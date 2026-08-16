package com.urlshortener.core.controller;

import com.urlshortener.core.dto.CreateUrlRequest;
import com.urlshortener.core.dto.CreateUtmRequest;
import com.urlshortener.core.dto.UpdateUrlRequest;
import com.urlshortener.core.dto.UpdateUtmRequest;
import com.urlshortener.core.entity.UrlMapping;
import com.urlshortener.core.entity.UtmProfile;
import com.urlshortener.core.service.UrlCoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/urls")
@RequiredArgsConstructor
public class UrlCoreController {

    private final UrlCoreService urlCoreService;

    // ==========================================
    // URL ENDPOINTS
    // ==========================================

    @PostMapping
    public ResponseEntity<UrlMapping> createShortUrl(
            @Valid @RequestBody CreateUrlRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(urlCoreService.createShortUrl(request, userId));
    }

    @GetMapping
    public ResponseEntity<List<UrlMapping>> getUserUrls(
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(urlCoreService.getUserUrls(userId));
    }

    @GetMapping("/{urlId}")
    public ResponseEntity<UrlMapping> getUrl(
            @PathVariable UUID urlId,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(urlCoreService.getUrl(urlId, userId));
    }

    @GetMapping("/short/{shortCode}")
    public ResponseEntity<Optional<UrlMapping>> getUrlFromShortCode(@PathVariable String shortCode) {
        return ResponseEntity.ok(urlCoreService.getUrlFromShortCode(shortCode));
    }

    @PutMapping("/{urlId}")
    public ResponseEntity<UrlMapping> updateShortUrl(
            @PathVariable UUID urlId,
            @Valid @RequestBody UpdateUrlRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(urlCoreService.updatedShortUrl(urlId, request, userId));
    }

    @DeleteMapping("/{urlId}")
    public ResponseEntity<Void> deleteShortUrl(
            @PathVariable UUID urlId,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        urlCoreService.deleteShortUrl(urlId, userId);
        return ResponseEntity.noContent().build();
    }

    // ==========================================
    // UTM PROFILE ENDPOINTS
    // ==========================================

    @PostMapping("/{urlId}/utm")
    public ResponseEntity<UtmProfile> addUtmProfile(
            @PathVariable UUID urlId,
            @Valid @RequestBody CreateUtmRequest request) {
        return ResponseEntity.ok(urlCoreService.addUtmProfile(urlId, request));
    }

    @GetMapping("/{urlId}/utm")
    public ResponseEntity<List<UtmProfile>> getUtmProfiles(
            @PathVariable UUID urlId,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(urlCoreService.getUtmProfiles(urlId, userId));
    }

    @GetMapping("/utm/{utmId}")
    public ResponseEntity<UtmProfile> getUtmProfile(
            @PathVariable UUID utmId,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(urlCoreService.getUtmProfile(utmId, userId));
    }

    @PutMapping("/utm/{utmId}")
    public ResponseEntity<UtmProfile> updateUtmProfile(
            @PathVariable UUID utmId,
            @RequestBody UpdateUtmRequest request) {
        return ResponseEntity.ok(urlCoreService.updateUtmProfile(utmId, request));
    }

    @DeleteMapping("/utm/{utmId}")
    public ResponseEntity<Void> deleteUtmProfile(@PathVariable UUID utmId) {
        urlCoreService.deleteUtmProfile(utmId);
        return ResponseEntity.noContent().build();
    }
}
