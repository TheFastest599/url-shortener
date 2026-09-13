package com.urlshortener.core.controller;

import com.urlshortener.core.dto.CampaignResponse;
import com.urlshortener.core.dto.CreateCampaignRequest;
import com.urlshortener.core.dto.PagedResponse;
import com.urlshortener.core.dto.UpdateCampaignRequest;
import com.urlshortener.core.entity.UrlMapping;
import com.urlshortener.core.service.CampaignService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    private final CampaignService campaignService;

    @PostMapping
    public ResponseEntity<CampaignResponse> createCampaign(
            @Valid @RequestBody CreateCampaignRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(campaignService.createCampaign(request, userId));
    }

    @GetMapping
    public ResponseEntity<?> getUserCampaigns(
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "size", required = false) Integer size,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "sortBy", defaultValue = "createdAt") String sortBy,
            @RequestParam(value = "direction", defaultValue = "DESC") String direction,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {

        if (page == null) {
            return ResponseEntity.ok(campaignService.getUserCampaigns(userId));
        }

        Sort.Direction sortDirection = "ASC".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String sortField = "name".equalsIgnoreCase(sortBy) ? "name" : "createdAt";
        Pageable pageable = PageRequest.of(page, size != null ? size : 10, Sort.by(sortDirection, sortField));

        Page<CampaignResponse> pagedResult = campaignService.getUserCampaignsPaged(userId, search, pageable);
        return ResponseEntity.ok(PagedResponse.from(pagedResult));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CampaignResponse> getCampaign(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(campaignService.getCampaign(id, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CampaignResponse> updateCampaign(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCampaignRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(campaignService.updateCampaign(id, request, userId));
    }

    @GetMapping("/{id}/urls")
    public ResponseEntity<List<UrlMapping>> getCampaignUrls(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(campaignService.getCampaignUrls(id, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCampaign(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        campaignService.deleteCampaign(id, userId);
        return ResponseEntity.noContent().build();
    }
}
