package com.urlshortener.core.service;

import com.urlshortener.core.dto.CampaignResponse;
import com.urlshortener.core.dto.CreateCampaignRequest;
import com.urlshortener.core.entity.Campaign;
import com.urlshortener.core.entity.UrlMapping;
import com.urlshortener.core.repository.CampaignRepository;
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
public class CampaignService {

    private final CampaignRepository campaignRepository;
    private final UrlMappingRepository urlRepository;

    @Transactional
    public CampaignResponse createCampaign(CreateCampaignRequest request, UUID userId) {
        String campaignName = request.name() != null ? request.name().trim() : "";

        // Guard Clause 1: Blank campaign name
        if (campaignName.isBlank()) {
            throw new IllegalArgumentException("Campaign name is required");
        }

        // Guard Clause 2: Duplicate campaign name for this user
        if (campaignRepository.existsByUserIdAndName(userId, campaignName)) {
            throw new IllegalArgumentException("Campaign with name '" + campaignName + "' already exists");
        }

        // Happy Path: Persist new campaign
        Campaign campaign = Campaign.builder()
                .userId(userId)
                .name(campaignName)
                .description(request.description())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Campaign saved = campaignRepository.save(campaign);
        return CampaignResponse.from(saved, 0);
    }

    public List<CampaignResponse> getUserCampaigns(UUID userId) {
        return campaignRepository.findByUserId(userId).stream()
                .map(c -> CampaignResponse.from(c, urlRepository.countByCampaignId(c.getId())))
                .toList();
    }

    public CampaignResponse getCampaign(UUID id, UUID userId) {
        Optional<Campaign> campaignOpt = campaignRepository.findByIdAndUserId(id, userId);

        // Guard Clause: Validate campaign existence & ownership
        if (campaignOpt.isEmpty()) {
            throw new IllegalArgumentException("Campaign not found: " + id);
        }

        Campaign campaign = campaignOpt.get();
        long count = urlRepository.countByCampaignId(id);
        return CampaignResponse.from(campaign, count);
    }

    public List<UrlMapping> getCampaignUrls(UUID campaignId, UUID userId) {
        // Guard Clause: Validate campaign exists and is owned by user
        if (campaignRepository.findByIdAndUserId(campaignId, userId).isEmpty()) {
            throw new IllegalArgumentException("Campaign not found: " + campaignId);
        }

        return urlRepository.findByCampaignId(campaignId);
    }

    @Transactional
    public void deleteCampaign(UUID id, UUID userId) {
        Optional<Campaign> campaignOpt = campaignRepository.findByIdAndUserId(id, userId);

        // Guard Clause: Validate existence and ownership
        if (campaignOpt.isEmpty()) {
            throw new IllegalArgumentException("Campaign not found: " + id);
        }

        // Happy Path: Unlink associated URLs (nullify campaignId) and delete campaign
        List<UrlMapping> linkedUrls = urlRepository.findByCampaignId(id);
        for (UrlMapping url : linkedUrls) {
            url.setCampaignId(null);
        }
        urlRepository.saveAll(linkedUrls);

        campaignRepository.delete(campaignOpt.get());
        log.info("Deleted campaign {} and unlinked {} URLs for user {}", id, linkedUrls.size(), userId);
    }
}
