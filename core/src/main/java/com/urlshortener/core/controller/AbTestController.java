package com.urlshortener.core.controller;

import com.urlshortener.core.dto.AbTestResponse;
import com.urlshortener.core.dto.CreateAbTestRequest;
import com.urlshortener.core.dto.UpdateAbTestStatusRequest;
import com.urlshortener.core.service.AbTestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/urls/{shortCode}/ab-test")
@RequiredArgsConstructor
public class AbTestController {

    private final AbTestService abTestService;

    @PostMapping
    public ResponseEntity<AbTestResponse> configureAbTest(
            @PathVariable String shortCode,
            @Valid @RequestBody CreateAbTestRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(abTestService.configureAbTest(shortCode, request, userId));
    }

    @GetMapping
    public ResponseEntity<AbTestResponse> getAbTest(
            @PathVariable String shortCode,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(abTestService.getAbTest(shortCode, userId));
    }

    @PutMapping("/status")
    public ResponseEntity<AbTestResponse> updateStatus(
            @PathVariable String shortCode,
            @Valid @RequestBody UpdateAbTestStatusRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(abTestService.updateStatus(shortCode, request, userId));
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAbTest(
            @PathVariable String shortCode,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        abTestService.deleteAbTest(shortCode, userId);
        return ResponseEntity.noContent().build();
    }
}
