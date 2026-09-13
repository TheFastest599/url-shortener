package com.urlshortener.core.controller;

import com.urlshortener.core.dto.AbTestResponse;
import com.urlshortener.core.dto.CreateAbTestRequest;
import com.urlshortener.core.dto.PagedResponse;
import com.urlshortener.core.dto.UpdateAbTestRequest;
import com.urlshortener.core.dto.UpdateAbTestStatusRequest;
import com.urlshortener.core.service.AbTestService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class AbTestController {

    private final AbTestService abTestService;

    // =========================================================================
    // TOP-LEVEL RESOURCE: /api/v1/ab-tests
    // =========================================================================

    @GetMapping("/api/v1/ab-tests")
    public ResponseEntity<PagedResponse<AbTestResponse>> getUserAbTests(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "sortBy", defaultValue = "createdAt") String sortBy,
            @RequestParam(value = "direction", defaultValue = "DESC") String direction,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {

        Sort.Direction sortDirection = "ASC".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String sortField = "name".equalsIgnoreCase(sortBy) ? "name" : "createdAt";
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortField));

        Page<AbTestResponse> pagedResult = abTestService.getUserAbTestsPaged(userId, search, status, pageable);
        return ResponseEntity.ok(PagedResponse.from(pagedResult));
    }

    @PostMapping("/api/v1/ab-tests")
    public ResponseEntity<AbTestResponse> createAbTest(
            @Valid @RequestBody CreateAbTestRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(abTestService.configureAbTest(request.shortCode(), request, userId));
    }

    @GetMapping("/api/v1/ab-tests/{id}")
    public ResponseEntity<AbTestResponse> getAbTestById(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(abTestService.getAbTestById(id, userId));
    }

    @PutMapping("/api/v1/ab-tests/{id}")
    public ResponseEntity<AbTestResponse> updateAbTest(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAbTestRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(abTestService.updateAbTest(id, request, userId));
    }

    @PutMapping("/api/v1/ab-tests/{id}/status")
    public ResponseEntity<AbTestResponse> updateStatusById(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAbTestStatusRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(abTestService.updateStatusById(id, request, userId));
    }

    @DeleteMapping("/api/v1/ab-tests/{id}")
    public ResponseEntity<Void> deleteAbTestById(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        abTestService.deleteAbTestById(id, userId);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // LINK-SCOPED ENDPOINTS (for per-shortcode operations & backward compatibility)
    // =========================================================================

    @GetMapping({"/api/v1/ab-tests/code/{shortCode}", "/api/v1/urls/{shortCode}/ab-test"})
    public ResponseEntity<AbTestResponse> getAbTestByCode(
            @PathVariable String shortCode,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(abTestService.getAbTest(shortCode, userId));
    }

    @PostMapping("/api/v1/urls/{shortCode}/ab-test")
    public ResponseEntity<AbTestResponse> configureAbTestByCode(
            @PathVariable String shortCode,
            @Valid @RequestBody CreateAbTestRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(abTestService.configureAbTest(shortCode, request, userId));
    }

    @PutMapping("/api/v1/urls/{shortCode}/ab-test/status")
    public ResponseEntity<AbTestResponse> updateStatusByCode(
            @PathVariable String shortCode,
            @Valid @RequestBody UpdateAbTestStatusRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(abTestService.updateStatus(shortCode, request, userId));
    }

    @DeleteMapping("/api/v1/urls/{shortCode}/ab-test")
    public ResponseEntity<Void> deleteAbTestByCode(
            @PathVariable String shortCode,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        abTestService.deleteAbTest(shortCode, userId);
        return ResponseEntity.noContent().build();
    }
}
