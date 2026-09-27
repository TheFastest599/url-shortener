package com.urlshortener.core.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.urlshortener.core.dto.CreateUrlRequest;
import com.urlshortener.core.dto.ShortUrlResponse;
import com.urlshortener.core.dto.UpdateUrlRequest;
import com.urlshortener.core.entity.UrlMapping;
import com.urlshortener.core.repository.AbTestRepository;
import com.urlshortener.core.repository.AbVariantRepository;
import com.urlshortener.core.repository.UrlMappingQueryRepository;
import com.urlshortener.core.repository.UrlMappingRepository;
import com.urlshortener.core.util.Base62;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UrlCoreService {

    private final UrlMappingRepository urlRepository;
    private final UrlMappingQueryRepository urlQueryRepository;
    private final AbTestRepository abTestRepository;
    private final AbVariantRepository abVariantRepository;
    private final Base62 base62;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    // ==========================================
    // URL CRUD OPERATIONS
    // ==========================================

    @Transactional
    public UrlMapping createShortUrl(CreateUrlRequest request, UUID userId) {

        String customAlias = request.customAlias() != null ? request.customAlias().trim() : null;

        // Guard Clause: Validate custom alias availability immediately (flat negative space)
        if (customAlias != null && !customAlias.isBlank() && urlRepository.existsByShortCode(customAlias)) {
            throw new IllegalArgumentException("Custom alias already in use: " + customAlias);
        }

        String shortCode = (customAlias != null && !customAlias.isBlank())
                ? customAlias
                : generateUniqueShortCode();

        UrlMapping mapping = UrlMapping.builder()
                .shortCode(shortCode)
                .destinationUrl(request.destinationUrl().trim())
                .campaignId(request.campaignId())
                .smartRules(request.smartRules())
                .userId(userId)
                .isActive(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        // Note: Redis population is handled lazily by Redirect Service on first click (Cache-Aside with Adaptive TTL)
        return urlRepository.save(mapping);
    }

    @Transactional
    public UrlMapping updateShortUrl(UUID urlId, UpdateUrlRequest request, UUID userId) {
        // Guard Clause 1: Validate entity existence
        UrlMapping mapping = urlRepository.findById(urlId)
                .orElseThrow(() -> new IllegalArgumentException("URL mapping not found"));

        // Guard Clause 2: Validate ownership
        if (!mapping.getUserId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to modify this URL");
        }

        // Happy Path: Flat updates
        if (request.destinationUrl() != null && !request.destinationUrl().isBlank()) {
            mapping.setDestinationUrl(request.destinationUrl().trim());
        }
        if (request.campaignId() != null) {
            mapping.setCampaignId(request.campaignId());
        }
        if (request.smartRules() != null) {
            mapping.setSmartRules(request.smartRules());
        }
        if (request.isActive() != null) {
            mapping.setIsActive(request.isActive());
        }
        if (request.expiresAt() != null) {
            mapping.setExpiresAt(request.expiresAt());
        }
        mapping.setUpdatedAt(Instant.now());

        UrlMapping updated = urlRepository.save(mapping);

//        Evict all keys so subsequent clicks immediately re-fetch updated mapping
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

    @Transactional
    public void deleteShortUrlByCode(String shortCode, UUID userId) {
        UrlMapping mapping = urlRepository.findByShortCode(shortCode)
                .orElseThrow(() -> new IllegalArgumentException("Url Mapping not found for code: " + shortCode));

        if (!mapping.getUserId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to delete this url");
        }

        urlRepository.delete(mapping);
        evictRedirectCache(mapping.getShortCode());
    }

    public List<ShortUrlResponse> getUserUrls(UUID userId) {
        return urlQueryRepository.findUserUrlsWithDetails(userId);
    }

    public Page<ShortUrlResponse> getUserUrlsPaged(
            UUID userId,
            String search,
            Boolean isActive,
            UUID campaignId,
            Pageable pageable) {
        return getUserUrlsPaged(userId, search, isActive, campaignId, false, pageable);
    }

    public Page<ShortUrlResponse> getUserUrlsPaged(
            UUID userId,
            String search,
            Boolean isActive,
            UUID campaignId,
            boolean unassignedOnly,
            Pageable pageable) {
        String searchPattern = (search != null && !search.trim().isBlank())
                ? "%" + search.trim().toLowerCase() + "%"
                : null;
        return urlQueryRepository.searchUserUrls(userId, searchPattern, isActive, campaignId, unassignedOnly, pageable);
    }

    public ShortUrlResponse getUrl(UUID urlId, UUID userId) {
        return urlQueryRepository.findUserUrlWithDetails(urlId, userId)
                .orElseThrow(() -> new IllegalArgumentException("URL mapping not found"));
    }

    public Optional<ShortUrlResponse> getUrlFromShortCode(String shortCode) {
        return urlQueryRepository.findByShortCodeWithDetails(shortCode);
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

    /**
     * Cleanly evicts the consolidated routing hash for a short code across Redis.
     * Called whenever a link is updated, deactivated, or deleted.
     */
    public void evictRedirectCache(String shortCode) {
        try {
            redisTemplate.delete("url:" + shortCode);
            log.info("Evicted consolidated Redis key url:{} for shortCode", shortCode);
        } catch (Exception e) {
            log.warn("Failed to evict Redis cache for {}: {}", shortCode, e.getMessage());
        }
    }

    /**
     * Evicts the consolidated routing cache for a short code when an A/B test changes.
     * The next visitor triggers a fresh joint query reload.
     */
    public void evictAbCache(String shortCode) {
        evictRedirectCache(shortCode);
    }
}

