package com.urlshortener.core.service;

import com.urlshortener.core.dto.AbTestResponse;
import com.urlshortener.core.dto.CreateAbTestRequest;
import com.urlshortener.core.dto.UpdateAbTestRequest;
import com.urlshortener.core.dto.UpdateAbTestStatusRequest;
import com.urlshortener.core.entity.AbTest;
import com.urlshortener.core.entity.AbVariant;
import com.urlshortener.core.entity.UrlMapping;
import com.urlshortener.core.repository.AbTestRepository;
import com.urlshortener.core.repository.AbVariantRepository;
import com.urlshortener.core.repository.UrlMappingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AbTestService {

    private final AbTestRepository abTestRepository;
    private final AbVariantRepository abVariantRepository;
    private final UrlMappingRepository urlRepository;
    private final UrlCoreService urlCoreService;

    @Transactional(readOnly = true)
    public Page<AbTestResponse> getUserAbTestsPaged(UUID userId, String search, String status, Pageable pageable) {
        String cleanSearch = (search != null && !search.isBlank()) ? "%" + search.trim().toLowerCase() + "%" : null;
        String cleanStatus = (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status.trim()))
                ? status.trim().toUpperCase() : null;

        Page<AbTest> page;
        if (cleanSearch != null && cleanStatus != null) {
            page = abTestRepository.searchByUserIdAndStatus(userId, cleanSearch, cleanStatus, pageable);
        } else if (cleanSearch != null) {
            page = abTestRepository.searchByUserId(userId, cleanSearch, pageable);
        } else if (cleanStatus != null) {
            page = abTestRepository.findByUserIdAndStatus(userId, cleanStatus, pageable);
        } else {
            page = abTestRepository.findAllByUserId(userId, pageable);
        }

        return page.map(this::toAbTestResponse);
    }

    @Transactional(readOnly = true)
    public AbTestResponse getAbTestById(UUID id, UUID userId) {
        AbTest test = abTestRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("A/B test not found with id: " + id));
        return toAbTestResponse(test);
    }

    @Transactional(readOnly = true)
    public AbTestResponse getAbTest(String shortCode, UUID userId) {
        UrlMapping mapping = urlRepository.findByShortCode(shortCode)
                .orElseThrow(() -> new IllegalArgumentException("Short code not found: " + shortCode));

        if (!mapping.getUserId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to view this A/B test");
        }

        AbTest test = abTestRepository.findByUrlMappingId(mapping.getId())
                .orElseThrow(() -> new IllegalArgumentException("No A/B test configured for " + shortCode));

        return toAbTestResponse(test, mapping);
    }

    @Transactional
    public AbTestResponse configureAbTest(String shortCode, CreateAbTestRequest request, UUID userId) {
        String targetCode = (shortCode != null && !shortCode.isBlank()) ? shortCode.trim() : request.shortCode();
        if (targetCode == null || targetCode.isBlank()) {
            throw new IllegalArgumentException("Short code is required to configure an A/B test");
        }

        UrlMapping mapping = urlRepository.findByShortCode(targetCode.trim())
                .orElseThrow(() -> new IllegalArgumentException("Short code not found: " + targetCode));

        if (!mapping.getUserId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to configure A/B test for this URL");
        }

        int totalWeight = request.variants().stream()
                .mapToInt(CreateAbTestRequest.VariantRequest::weight)
                .sum();
        if (totalWeight != 100) {
            throw new IllegalArgumentException("Variant weights must sum to exactly 100 (current sum: " + totalWeight + ")");
        }

        abTestRepository.findByUrlMappingId(mapping.getId()).ifPresent(existing -> {
            abVariantRepository.deleteByAbTestId(existing.getId());
            abTestRepository.delete(existing);
        });

        AbTest abTest = AbTest.builder()
                .urlMappingId(mapping.getId())
                .name(request.name().trim())
                .status("ACTIVE")
                .cookieTtlSeconds(request.cookieTtlSeconds() != null ? request.cookieTtlSeconds() : 2592000)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        AbTest savedTest = abTestRepository.save(abTest);

        List<AbVariant> variants = request.variants().stream().map(v -> AbVariant.builder()
                .abTestId(savedTest.getId())
                .variantKey(v.key().trim().toUpperCase())
                .destinationUrl(v.destinationUrl().trim())
                .weight(v.weight())
                .isControl(v.isControl())
                .createdAt(Instant.now())
                .build()).toList();
        List<AbVariant> savedVariants = abVariantRepository.saveAll(variants);

        mapping.setIsAbTest(true);
        mapping.setUpdatedAt(Instant.now());
        urlRepository.save(mapping);

        urlCoreService.evictRedirectCache(targetCode);

        log.info("Configured A/B test '{}' for shortCode {} with {} variants", savedTest.getName(), targetCode, savedVariants.size());
        return AbTestResponse.from(savedTest, savedVariants, mapping.getShortCode(), mapping.getDestinationUrl());
    }

    @Transactional
    public AbTestResponse updateAbTest(UUID id, UpdateAbTestRequest request, UUID userId) {
        AbTest test = abTestRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("A/B test not found with id: " + id));

        int totalWeight = request.variants().stream()
                .mapToInt(CreateAbTestRequest.VariantRequest::weight)
                .sum();
        if (totalWeight != 100) {
            throw new IllegalArgumentException("Variant weights must sum to exactly 100 (current sum: " + totalWeight + ")");
        }

        test.setName(request.name().trim());
        if (request.cookieTtlSeconds() != null) {
            test.setCookieTtlSeconds(request.cookieTtlSeconds());
        }
        test.setUpdatedAt(Instant.now());
        AbTest savedTest = abTestRepository.save(test);

        // Replace variants
        abVariantRepository.deleteByAbTestId(savedTest.getId());
        List<AbVariant> variants = request.variants().stream().map(v -> AbVariant.builder()
                .abTestId(savedTest.getId())
                .variantKey(v.key().trim().toUpperCase())
                .destinationUrl(v.destinationUrl().trim())
                .weight(v.weight())
                .isControl(v.isControl())
                .createdAt(Instant.now())
                .build()).toList();
        List<AbVariant> savedVariants = abVariantRepository.saveAll(variants);

        UrlMapping mapping = urlRepository.findById(savedTest.getUrlMappingId()).orElse(null);
        if (mapping != null) {
            urlCoreService.evictRedirectCache(mapping.getShortCode());
        }

        log.info("Updated A/B test '{}' ({}) with {} variants", savedTest.getName(), id, savedVariants.size());
        return AbTestResponse.from(savedTest, savedVariants, mapping != null ? mapping.getShortCode() : null, mapping != null ? mapping.getDestinationUrl() : null);
    }

    @Transactional
    public AbTestResponse updateStatusById(UUID id, UpdateAbTestStatusRequest request, UUID userId) {
        AbTest test = abTestRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("A/B test not found with id: " + id));

        UrlMapping mapping = urlRepository.findById(test.getUrlMappingId())
                .orElseThrow(() -> new IllegalArgumentException("URL mapping not found for test: " + id));

        return handleStatusTransition(mapping, test, request);
    }

    @Transactional
    public AbTestResponse updateStatus(String shortCode, UpdateAbTestStatusRequest request, UUID userId) {
        UrlMapping mapping = urlRepository.findByShortCode(shortCode)
                .orElseThrow(() -> new IllegalArgumentException("Short code not found: " + shortCode));

        if (!mapping.getUserId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to update this A/B test");
        }

        AbTest test = abTestRepository.findByUrlMappingId(mapping.getId())
                .orElseThrow(() -> new IllegalArgumentException("No A/B test configured for " + shortCode));

        return handleStatusTransition(mapping, test, request);
    }

    private AbTestResponse handleStatusTransition(UrlMapping mapping, AbTest test, UpdateAbTestStatusRequest request) {
        String newStatus = request.status().trim().toUpperCase();

        if ("CONCLUDED".equalsIgnoreCase(newStatus)) {
            return concludeAbTest(mapping, test, request.winningVariant());
        }

        test.setStatus(newStatus);
        test.setUpdatedAt(Instant.now());
        AbTest savedTest = abTestRepository.save(test);

        urlCoreService.evictRedirectCache(mapping.getShortCode());

        List<AbVariant> variants = abVariantRepository.findByAbTestId(savedTest.getId());
        return AbTestResponse.from(savedTest, variants, mapping.getShortCode(), mapping.getDestinationUrl());
    }

    private AbTestResponse concludeAbTest(UrlMapping mapping, AbTest test, String winningVariantKey) {
        if (winningVariantKey == null || winningVariantKey.isBlank()) {
            throw new IllegalArgumentException("A winning variant (e.g. 'B') is required to conclude the test");
        }

        String normalizedKey = winningVariantKey.trim().toUpperCase();
        List<AbVariant> variants = abVariantRepository.findByAbTestId(test.getId());

        Optional<AbVariant> winnerOpt = variants.stream()
                .filter(v -> v.getVariantKey().equalsIgnoreCase(normalizedKey))
                .findFirst();

        if (winnerOpt.isEmpty()) {
            throw new IllegalArgumentException("Winning variant '" + normalizedKey + "' not found among test variants");
        }

        test.setStatus("CONCLUDED");
        test.setWinningVariant(normalizedKey);
        test.setUpdatedAt(Instant.now());

        mapping.setDestinationUrl(winnerOpt.get().getDestinationUrl());
        mapping.setIsAbTest(false);
        mapping.setUpdatedAt(Instant.now());
        urlRepository.save(mapping);

        AbTest savedTest = abTestRepository.save(test);

        urlCoreService.evictRedirectCache(mapping.getShortCode());
        log.info("Concluded A/B test for shortCode {} with winner {}", mapping.getShortCode(), normalizedKey);

        return AbTestResponse.from(savedTest, variants, mapping.getShortCode(), mapping.getDestinationUrl());
    }

    @Transactional
    public void deleteAbTestById(UUID id, UUID userId) {
        AbTest test = abTestRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("A/B test not found with id: " + id));

        UrlMapping mapping = urlRepository.findById(test.getUrlMappingId()).orElse(null);

        abVariantRepository.deleteByAbTestId(test.getId());
        abTestRepository.delete(test);

        if (mapping != null) {
            mapping.setIsAbTest(false);
            mapping.setUpdatedAt(Instant.now());
            urlRepository.save(mapping);
            urlCoreService.evictRedirectCache(mapping.getShortCode());
        }

        log.info("Deleted A/B test with id {}", id);
    }

    @Transactional
    public void deleteAbTest(String shortCode, UUID userId) {
        UrlMapping mapping = urlRepository.findByShortCode(shortCode)
                .orElseThrow(() -> new IllegalArgumentException("Short code not found: " + shortCode));

        if (!mapping.getUserId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to delete this A/B test");
        }

        abTestRepository.findByUrlMappingId(mapping.getId()).ifPresent(test -> {
            abVariantRepository.deleteByAbTestId(test.getId());
            abTestRepository.delete(test);
        });

        mapping.setIsAbTest(false);
        mapping.setUpdatedAt(Instant.now());
        urlRepository.save(mapping);

        urlCoreService.evictRedirectCache(shortCode);
        log.info("Deleted A/B test for shortCode {}", shortCode);
    }

    private AbTestResponse toAbTestResponse(AbTest test) {
        UrlMapping mapping = urlRepository.findById(test.getUrlMappingId()).orElse(null);
        return toAbTestResponse(test, mapping);
    }

    private AbTestResponse toAbTestResponse(AbTest test, UrlMapping mapping) {
        String shortCode = mapping != null ? mapping.getShortCode() : null;
        String destUrl = mapping != null ? mapping.getDestinationUrl() : null;
        List<AbVariant> variants = abVariantRepository.findByAbTestId(test.getId());
        return AbTestResponse.from(test, variants, shortCode, destUrl);
    }
}
