package com.urlshortener.core.service;

import com.urlshortener.core.dto.AbTestResponse;
import com.urlshortener.core.dto.CreateAbTestRequest;
import com.urlshortener.core.dto.UpdateAbTestStatusRequest;
import com.urlshortener.core.entity.AbTest;
import com.urlshortener.core.entity.AbVariant;
import com.urlshortener.core.entity.UrlMapping;
import com.urlshortener.core.repository.AbTestRepository;
import com.urlshortener.core.repository.AbVariantRepository;
import com.urlshortener.core.repository.UrlMappingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    @Transactional
    public AbTestResponse configureAbTest(String shortCode, CreateAbTestRequest request, UUID userId) {
        UrlMapping mapping = urlRepository.findByShortCode(shortCode)
                .orElseThrow(() -> new IllegalArgumentException("Short code not found: " + shortCode));

        // Guard Clause 1: Ownership validation
        if (!mapping.getUserId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to configure A/B test for this URL");
        }

        // Guard Clause 2: Variant weights sum check (must equal exactly 100)
        int totalWeight = request.variants().stream()
                .mapToInt(CreateAbTestRequest.VariantRequest::weight)
                .sum();
        if (totalWeight != 100) {
            throw new IllegalArgumentException("Variant weights must sum to exactly 100 (current sum: " + totalWeight + ")");
        }

        // Clean any existing test for this mapping
        abTestRepository.findByUrlMappingId(mapping.getId()).ifPresent(existing -> {
            abVariantRepository.deleteByAbTestId(existing.getId());
            abTestRepository.delete(existing);
        });

        // Happy Path Step 1: Create AbTest
        AbTest abTest = AbTest.builder()
                .urlMappingId(mapping.getId())
                .name(request.name().trim())
                .status("ACTIVE")
                .cookieTtlSeconds(request.cookieTtlSeconds() != null ? request.cookieTtlSeconds() : 2592000)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        AbTest savedTest = abTestRepository.save(abTest);

        // Happy Path Step 2: Create AbVariants
        List<AbVariant> variants = request.variants().stream().map(v -> AbVariant.builder()
                .abTestId(savedTest.getId())
                .variantKey(v.key().trim().toUpperCase())
                .destinationUrl(v.destinationUrl().trim())
                .weight(v.weight())
                .isControl(v.isControl())
                .createdAt(Instant.now())
                .build()).toList();
        List<AbVariant> savedVariants = abVariantRepository.saveAll(variants);

        // Happy Path Step 3: Mark UrlMapping as A/B test enabled
        mapping.setIsAbTest(true);
        mapping.setUpdatedAt(Instant.now());
        urlRepository.save(mapping);

        // Happy Path Step 4: Invalidate Redis cache so next click pulls new A/B configuration
        urlCoreService.evictRedirectCache(shortCode);

        log.info("Configured A/B test '{}' for shortCode {} with {} variants", savedTest.getName(), shortCode, savedVariants.size());
        return AbTestResponse.from(savedTest, savedVariants);
    }

    public AbTestResponse getAbTest(String shortCode, UUID userId) {
        UrlMapping mapping = urlRepository.findByShortCode(shortCode)
                .orElseThrow(() -> new IllegalArgumentException("Short code not found: " + shortCode));

        // Guard Clause 1: Ownership check
        if (!mapping.getUserId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to view this A/B test");
        }

        // Guard Clause 2: Test existence check
        AbTest test = abTestRepository.findByUrlMappingId(mapping.getId())
                .orElseThrow(() -> new IllegalArgumentException("No A/B test configured for " + shortCode));

        List<AbVariant> variants = abVariantRepository.findByAbTestId(test.getId());
        return AbTestResponse.from(test, variants);
    }

    @Transactional
    public AbTestResponse updateStatus(String shortCode, UpdateAbTestStatusRequest request, UUID userId) {
        UrlMapping mapping = urlRepository.findByShortCode(shortCode)
                .orElseThrow(() -> new IllegalArgumentException("Short code not found: " + shortCode));

        // Guard Clause 1: Ownership check
        if (!mapping.getUserId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to update this A/B test");
        }

        // Guard Clause 2: Test existence check
        AbTest test = abTestRepository.findByUrlMappingId(mapping.getId())
                .orElseThrow(() -> new IllegalArgumentException("No A/B test configured for " + shortCode));

        String newStatus = request.status().trim().toUpperCase();

        // Concluded flow: promote winner
        if ("CONCLUDED".equalsIgnoreCase(newStatus)) {
            return concludeAbTest(mapping, test, request.winningVariant());
        }

        // Active / Paused flow
        test.setStatus(newStatus);
        test.setUpdatedAt(Instant.now());
        AbTest savedTest = abTestRepository.save(test);

        // Evict A/B cache key so redirect service respects pause/resume state
        urlCoreService.evictAbCache(shortCode);

        List<AbVariant> variants = abVariantRepository.findByAbTestId(savedTest.getId());
        return AbTestResponse.from(savedTest, variants);
    }

    private AbTestResponse concludeAbTest(UrlMapping mapping, AbTest test, String winningVariantKey) {
        // Guard Clause: Winning variant is required when concluding
        if (winningVariantKey == null || winningVariantKey.isBlank()) {
            throw new IllegalArgumentException("A winning variant (e.g. 'B') is required to conclude the test");
        }

        String normalizedKey = winningVariantKey.trim().toUpperCase();
        List<AbVariant> variants = abVariantRepository.findByAbTestId(test.getId());

        Optional<AbVariant> winnerOpt = variants.stream()
                .filter(v -> v.getVariantKey().equalsIgnoreCase(normalizedKey))
                .findFirst();

        // Guard Clause: Winning variant key must exist in variants
        if (winnerOpt.isEmpty()) {
            throw new IllegalArgumentException("Winning variant '" + normalizedKey + "' not found among test variants");
        }

        test.setStatus("CONCLUDED");
        test.setWinningVariant(normalizedKey);
        test.setUpdatedAt(Instant.now());

        // Set the winning variant as the new base destination URL
        mapping.setDestinationUrl(winnerOpt.get().getDestinationUrl());
        mapping.setIsAbTest(false);
        mapping.setUpdatedAt(Instant.now());
        urlRepository.save(mapping);

        AbTest savedTest = abTestRepository.save(test);

        // Evict all Strategy 1 keys since base destination URL changed
        urlCoreService.evictRedirectCache(mapping.getShortCode());
        log.info("Concluded A/B test for shortCode {} with winner {}", mapping.getShortCode(), normalizedKey);

        return AbTestResponse.from(savedTest, variants);
    }

    @Transactional
    public void deleteAbTest(String shortCode, UUID userId) {
        UrlMapping mapping = urlRepository.findByShortCode(shortCode)
                .orElseThrow(() -> new IllegalArgumentException("Short code not found: " + shortCode));

        // Guard Clause: Ownership check
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

        // Evict A/B cache key so visitors fall back cleanly to the base URL
        urlCoreService.evictAbCache(shortCode);
        log.info("Deleted A/B test for shortCode {}", shortCode);
    }
}
