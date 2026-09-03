package com.urlshortener.core.service;

import com.urlshortener.core.dto.CreateUrlRequest;
import com.urlshortener.core.dto.CreateUtmRequest;
import com.urlshortener.core.dto.UpdateUrlRequest;
import com.urlshortener.core.dto.UpdateUtmRequest;
import com.urlshortener.core.entity.UrlMapping;
import com.urlshortener.core.entity.UtmProfile;
import com.urlshortener.core.repository.UrlMappingRepository;
import com.urlshortener.core.repository.UtmProfileRepository;
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
    private final UtmProfileRepository utmRepository;
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

        UrlMapping savedMapping = urlRepository.save(mapping);

        if (hasUtmParams(request)) {
            saveDefaultUtmProfile(savedMapping.getId(), request);
        }

        return savedMapping;
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
    // UTM PROFILE OPERATIONS
    // ==========================================

    @Transactional
    public UtmProfile addUtmProfile(UUID urlMappingId, CreateUtmRequest request) {
        // Guard Clause: Validate parent URL mapping exists
        UrlMapping mapping = urlRepository.findById(urlMappingId)
                .orElseThrow(() -> new IllegalArgumentException("URL mapping not found"));

        UtmProfile profile = UtmProfile.builder()
                .urlMappingId(mapping.getId())
                .name(request.name())
                .utmSource(request.utmSource())
                .utmMedium(request.utmMedium())
                .utmCampaign(request.utmCampaign())
                .utmTerm(request.utmTerm())
                .utmContent(request.utmContent())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return utmRepository.save(profile);
    }

    @Transactional
    public UtmProfile updateUtmProfile(UUID utmId, UpdateUtmRequest request) {
        // Guard Clause: Validate existence
        UtmProfile profile = utmRepository.findById(utmId)
                .orElseThrow(() -> new IllegalArgumentException("UTM profile not found"));

        if (request.name() != null) profile.setName(request.name());
        if (request.utmSource() != null) profile.setUtmSource(request.utmSource());
        if (request.utmMedium() != null) profile.setUtmMedium(request.utmMedium());
        if (request.utmCampaign() != null) profile.setUtmCampaign(request.utmCampaign());
        if (request.utmTerm() != null) profile.setUtmTerm(request.utmTerm());
        if (request.utmContent() != null) profile.setUtmContent(request.utmContent());
        profile.setUpdatedAt(Instant.now());

        return utmRepository.save(profile);
    }

    @Transactional
    public void deleteUtmProfile(UUID utmId) {
        // Guard Clause: Validate existence
        if (!utmRepository.existsById(utmId)) {
            throw new IllegalArgumentException("UTM profile not found");
        }

        // Happy Path
        utmRepository.deleteById(utmId);
    }

    public List<UtmProfile> getUtmProfiles(UUID urlMappingId, UUID userId) {
        // Guard Clause 1: Validate parent URL exists
        UrlMapping mapping = urlRepository.findById(urlMappingId)
                .orElseThrow(() -> new IllegalArgumentException("URL mapping not found"));

        // Guard Clause 2: Validate ownership
        if (!mapping.getUserId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to access UTM profiles for this URL");
        }

        return utmRepository.findByUrlMappingId(urlMappingId);
    }

    public UtmProfile getUtmProfile(UUID utmProfileId, UUID userId) {
        // Guard Clause 1: Validate UTM profile exists
        UtmProfile profile = utmRepository.findById(utmProfileId)
                .orElseThrow(() -> new IllegalArgumentException("UTM profile not found"));

        // Guard Clause 2: Validate parent URL ownership
        UrlMapping mapping = urlRepository.findById(profile.getUrlMappingId())
                .orElseThrow(() -> new IllegalArgumentException("Parent URL mapping not found"));

        if (!mapping.getUserId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to access this UTM profile");
        }

        return profile;
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

    private void saveDefaultUtmProfile(UUID urlMappingId, CreateUrlRequest request) {
        UtmProfile profile = UtmProfile.builder()
                .urlMappingId(urlMappingId)
                .name("Default Campaign")
                .utmSource(request.utmSource())
                .utmMedium(request.utmMedium())
                .utmCampaign(request.utmCampaign())
                .utmTerm(request.utmTerm())
                .utmContent(request.utmContent())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        utmRepository.save(profile);
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
