package com.urlshortener.core.controller;

import com.urlshortener.core.dto.CreateUrlRequest;
import com.urlshortener.core.dto.PagedResponse;
import com.urlshortener.core.dto.UpdateUrlRequest;
import com.urlshortener.core.entity.UrlMapping;
import com.urlshortener.core.service.UrlCoreService;
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
@RequestMapping("/api/v1/urls")
@RequiredArgsConstructor
public class UrlCoreController {

    private final UrlCoreService urlCoreService;

    @PostMapping
    public ResponseEntity<UrlMapping> createShortUrl(
            @Valid @RequestBody CreateUrlRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(urlCoreService.createShortUrl(request, userId));
    }

    @GetMapping
    public ResponseEntity<?> getUserUrls(
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "size", required = false) Integer size,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "campaignId", required = false) String campaignId,
            @RequestParam(value = "sortBy", defaultValue = "createdAt") String sortBy,
            @RequestParam(value = "direction", defaultValue = "DESC") String direction,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {

        if (page == null) {
            return ResponseEntity.ok(urlCoreService.getUserUrls(userId));
        }

        Boolean isActive = null;
        if ("active".equalsIgnoreCase(status)) {
            isActive = true;
        } else if ("inactive".equalsIgnoreCase(status)) {
            isActive = false;
        }

        UUID targetCampaignId = null;
        boolean unassignedOnly = false;
        if (campaignId != null && !campaignId.isBlank()) {
            if ("unassigned".equalsIgnoreCase(campaignId) || "none".equalsIgnoreCase(campaignId)) {
                unassignedOnly = true;
            } else if (!"all".equalsIgnoreCase(campaignId)) {
                try {
                    targetCampaignId = UUID.fromString(campaignId);
                } catch (IllegalArgumentException ignored) {
                }
            }
        }

        Sort.Direction sortDirection = "ASC".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String sortField = "shortCode".equalsIgnoreCase(sortBy) ? "shortCode" : "createdAt";
        Pageable pageable = PageRequest.of(page, size != null ? size : 10, Sort.by(sortDirection, sortField));

        Page<UrlMapping> pagedResult = urlCoreService.getUserUrlsPaged(userId, search, isActive, targetCampaignId, unassignedOnly, pageable);
        return ResponseEntity.ok(PagedResponse.from(pagedResult));
    }

    @GetMapping("/{urlId}")
    public ResponseEntity<UrlMapping> getUrl(
            @PathVariable UUID urlId,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(urlCoreService.getUrl(urlId, userId));
    }

    @GetMapping("/code/{shortCode}")
    public ResponseEntity<UrlMapping> getUrlByCode(
            @PathVariable String shortCode,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        UrlMapping mapping = urlCoreService.getUrlFromShortCode(shortCode)
                .orElseThrow(() -> new IllegalArgumentException("Short code not found: " + shortCode));
        return ResponseEntity.ok(mapping);
    }

    @PutMapping("/{urlId}")
    public ResponseEntity<UrlMapping> updateShortUrl(
            @PathVariable UUID urlId,
            @Valid @RequestBody UpdateUrlRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(urlCoreService.updateShortUrl(urlId, request, userId));
    }

    @PutMapping("/code/{shortCode}")
    public ResponseEntity<UrlMapping> updateUrlByCode(
            @PathVariable String shortCode,
            @Valid @RequestBody UpdateUrlRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        UrlMapping mapping = urlCoreService.getUrlFromShortCode(shortCode)
                .orElseThrow(() -> new IllegalArgumentException("Short code not found: " + shortCode));
        return ResponseEntity.ok(urlCoreService.updateShortUrl(mapping.getId(), request, userId));
    }

    @DeleteMapping("/{urlId}")
    public ResponseEntity<Void> deleteShortUrl(
            @PathVariable UUID urlId,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        urlCoreService.deleteShortUrl(urlId, userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/code/{shortCode}")
    public ResponseEntity<Void> deleteUrlByCode(
            @PathVariable String shortCode,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        urlCoreService.deleteShortUrlByCode(shortCode, userId);
        return ResponseEntity.noContent().build();
    }
}

