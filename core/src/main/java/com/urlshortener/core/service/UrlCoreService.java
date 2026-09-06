package com.urlshortener.core.service;

import com.urlshortener.core.dto.CreateUrlRequest;
import com.urlshortener.core.dto.UpdateUrlRequest;
import com.urlshortener.core.entity.UrlMapping;
import com.urlshortener.core.repository.UrlMappingRepository;
import com.urlshortener.core.util.Base62;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UrlCoreService {

    private final UrlMappingRepository urlRepository;
    private final Base62 base62;
    private final StringRedisTemplate redisTemplate;

    // ==========================================
    // URL CRUD OPERATIONS
    // ==========================================

    @Transactional
    public UrlMapping createShortUrl(CreateUrlRequest request, UUID userId) {
        // Guard Clause: Validate custom alias availability immediately
        if (request.customAlias() != null && !request.customAlias().isBlank()) {
            if (urlRepository.existsByShortCode(request.customAlias())) {
                throw new IllegalArgumentException("Custom alias already in use");
            }
        }

        String shortCode = (request.customAlias() != null && !request.customAlias().isBlank())
                ? request.customAlias()
                : generateUniqueShortCode();

        String finalDestinationUrl = appendUtmParams(request);

        UrlMapping mapping = UrlMapping.builder()
                .shortCode(shortCode)
                .destinationUrl(finalDestinationUrl)
                .tenantId("default")
                .userId(userId)
                .isActive(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return urlRepository.save(mapping);
    }

    @Transactional
    public UrlMapping updatedShortUrl(UUID urlId, UpdateUrlRequest request, UUID userId) {
        // Guard Clause 1: Validate entity existence
        UrlMapping mapping = urlRepository.findById(urlId)
                .orElseThrow(() -> new IllegalArgumentException("Url mapping not found"));

        // Guard Clause 2: Validate ownership
        if (!mapping.getUserId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to modify this URL");
        }

        // Happy Path: Flat updates
        if (request.destinationUrl() != null && !request.destinationUrl().isBlank()) {
            mapping.setDestinationUrl(request.destinationUrl());
        }
        if (request.isActive() != null) {
            mapping.setIsActive(request.isActive());
        }
        if (request.expiresAt() != null) {
            mapping.setExpiresAt(request.expiresAt());
        }
        mapping.setUpdatedAt(Instant.now());

        UrlMapping updated = urlRepository.save(mapping);
        evictRedirectCache(mapping.getShortCode());

        return updated;
    }

    @Transactional
    public void deleteShortUrl(UUID urlId, UUID userId) {
        // Guard Clause 1: Validate existence
        UrlMapping mapping = urlRepository.findById(urlId)
                .orElseThrow(() -> new IllegalArgumentException("Url Mapping not found"));

        // Guard Clause 2: Validate ownership
        if (!mapping.getUserId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to delete this url");
        }

        // Happy Path: Delete & evict cache
        urlRepository.delete(mapping);
        evictRedirectCache(mapping.getShortCode());
    }

    public List<UrlMapping> getUserUrls(UUID userId) {
        return urlRepository.findByUserId(userId);
    }

    public Page<UrlMapping> getUserUrlsPaged(
            UUID userId,
            String search,
            Boolean isActive,
            Pageable pageable) {
        return urlRepository.findByUserIdWithFilters(userId, search, isActive, pageable);
    }

    public UrlMapping getUrl(UUID urlId, UUID userId) {
        // Guard Clause 1: Validate existence
        UrlMapping mapping = urlRepository.findById(urlId)
                .orElseThrow(() -> new IllegalArgumentException("URL mapping not found"));

        // Guard Clause 2: Validate ownership
        if (!mapping.getUserId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to access this URL");
        }

        // Happy path
        return mapping;
    }

    public Optional<UrlMapping> getUrlFromShortCode(String shortCode) {
        // Public lookup by shortcode
        return urlRepository.findByShortCode(shortCode);
    }

    // ==========================================
    // PRIVATE HELPER METHODS
    // ==========================================

    private String generateUniqueShortCode() {
        String shortCode;
        do {
            shortCode = base62.generateRandomShortCode(7);
        } while (urlRepository.existsByShortCode(shortCode));
        return shortCode;
    }

    private boolean hasUtmParams(CreateUrlRequest request) {
        return request.utmSource() != null || request.utmCampaign() != null || request.utmMedium() != null;
    }

    private void evictRedirectCache(String shortCode) {
        try {
            redisTemplate.delete("url:redirect:" + shortCode);
        } catch (Exception ignored) {}
    }

    private String appendUtmParams(CreateUrlRequest request) {
        if (!hasUtmParams(request)) {
            return request.destinationUrl();
        }

        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(request.destinationUrl());

        if (request.utmSource() != null && !request.utmSource().isBlank()) builder.queryParam("utm_source", request.utmSource());
        if (request.utmMedium() != null && !request.utmMedium().isBlank()) builder.queryParam("utm_medium", request.utmMedium());
        if (request.utmCampaign() != null && !request.utmCampaign().isBlank()) builder.queryParam("utm_campaign", request.utmCampaign());
        if (request.utmTerm() != null && !request.utmTerm().isBlank()) builder.queryParam("utm_term", request.utmTerm());
        if (request.utmContent() != null && !request.utmContent().isBlank()) builder.queryParam("utm_content", request.utmContent());

        return builder.build().toUriString();
    }
}
