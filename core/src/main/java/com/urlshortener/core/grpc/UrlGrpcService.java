package com.urlshortener.core.grpc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.urlshortener.core.entity.AbTest;
import com.urlshortener.core.entity.AbVariant;
import com.urlshortener.core.entity.UrlMapping;
import com.urlshortener.core.repository.AbTestRepository;
import com.urlshortener.core.repository.AbVariantRepository;
import com.urlshortener.core.repository.UrlMappingRepository;
import com.urlshortener.core.service.UrlCoreService;
import com.urlshortener.grpc.CreateUrlRequest;
import com.urlshortener.grpc.CreateUrlResponse;
import com.urlshortener.grpc.UrlRequest;
import com.urlshortener.grpc.UrlResponse;
import com.urlshortener.grpc.UrlServiceGrpc;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.service.GrpcService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@GrpcService
@RequiredArgsConstructor
public class UrlGrpcService extends UrlServiceGrpc.UrlServiceImplBase {

    private final UrlMappingRepository urlMappingRepository;
    private final AbTestRepository abTestRepository;
    private final AbVariantRepository abVariantRepository;
    private final UrlCoreService urlCoreService;
    private final ObjectMapper objectMapper;

    @Override
    public void getDestinationUrl(UrlRequest request, StreamObserver<UrlResponse> responseObserver) {
        String shortCode = request.getShortCode();

        // Guard Clause 1: Invalid or blank short code input
        if (shortCode == null || shortCode.isBlank()) {
            sendNotFound("", responseObserver);
            return;
        }

        Optional<UrlMapping> mappingOpt = urlMappingRepository.findByShortCode(shortCode.trim());

        // Guard Clause 2: URL not found in database
        if (mappingOpt.isEmpty()) {
            sendNotFound(shortCode, responseObserver);
            return;
        }

        UrlMapping mapping = mappingOpt.get();

        // Guard Clause 3: Link is deactivated/disabled (short-circuit without loading variants)
        if (!Boolean.TRUE.equals(mapping.getIsActive())) {
            UrlResponse inactiveResponse = UrlResponse.newBuilder()
                    .setShortCode(mapping.getShortCode())
                    .setDestinationUrl(mapping.getDestinationUrl())
                    .setIsActive(false)
                    .setIsFound(true)
                    .build();
            responseObserver.onNext(inactiveResponse);
            responseObserver.onCompleted();
            return;
        }

        // Happy Path: URL is active and found (unindented, linear flow)
        UrlResponse.Builder builder = UrlResponse.newBuilder()
                .setShortCode(mapping.getShortCode())
                .setDestinationUrl(mapping.getDestinationUrl())
                .setIsActive(true)
                .setIsFound(true);

        resolveAbRulesJson(mapping).ifPresent(builder::setAbRulesJson);
        resolveSmartRulesJson(mapping).ifPresent(builder::setSmartRulesJson);

        responseObserver.onNext(builder.build());
        responseObserver.onCompleted();
    }

    @Override
    public void createUrlMapping(CreateUrlRequest request, StreamObserver<CreateUrlResponse> responseObserver) {
        String destinationUrl = request.getDestinationUrl();

        // Guard Clause 1: Blank destination URL
        if (destinationUrl == null || destinationUrl.isBlank()) {
            CreateUrlResponse failureResponse = CreateUrlResponse.newBuilder()
                    .setSuccess(false)
                    .build();
            responseObserver.onNext(failureResponse);
            responseObserver.onCompleted();
            return;
        }

        // Guard Clause 2: Parse or default user UUID
        UUID userId;
        try {
            userId = (request.getUserId() != null && !request.getUserId().isBlank())
                    ? UUID.fromString(request.getUserId())
                    : UUID.fromString("00000000-0000-0000-0000-000000000001");
        } catch (IllegalArgumentException e) {
            userId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        }

        try {
            com.urlshortener.core.dto.CreateUrlRequest coreRequest = new com.urlshortener.core.dto.CreateUrlRequest(
                    destinationUrl.trim(),
                    request.getCustomAlias(),
                    null,
                    null
            );

            UrlMapping mapping = urlCoreService.createShortUrl(coreRequest, userId);

            CreateUrlResponse response = CreateUrlResponse.newBuilder()
                    .setShortCode(mapping.getShortCode())
                    .setDestinationUrl(mapping.getDestinationUrl())
                    .setSuccess(true)
                    .build();
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("Failed to create URL mapping via gRPC: {}", e.getMessage());
            CreateUrlResponse errorResponse = CreateUrlResponse.newBuilder()
                    .setSuccess(false)
                    .build();
            responseObserver.onNext(errorResponse);
            responseObserver.onCompleted();
        }
    }

    /**
     * Resolves active A/B test variant rules using negative space guard clauses.
     */
    private Optional<String> resolveAbRulesJson(UrlMapping mapping) {
        // Guard Clause 1: URL mapping is not configured for A/B testing
        if (!Boolean.TRUE.equals(mapping.getIsAbTest())) {
            return Optional.empty();
        }

        Optional<AbTest> abTestOpt = abTestRepository.findByUrlMappingId(mapping.getId());

        // Guard Clause 2: No A/B test record associated with this mapping
        if (abTestOpt.isEmpty()) {
            return Optional.empty();
        }

        AbTest test = abTestOpt.get();

        // Guard Clause 3: Test is not active (paused, concluded, etc.)
        if (!"ACTIVE".equalsIgnoreCase(test.getStatus())) {
            return Optional.empty();
        }

        List<AbVariant> variants = abVariantRepository.findByAbTestId(test.getId());

        // Guard Clause 4: No variants exist for this test
        if (variants == null || variants.isEmpty()) {
            return Optional.empty();
        }

        // Happy Path: Construct JSON configuration payload
        try {
            Map<String, Object> abPayload = new HashMap<>();
            abPayload.put("testId", test.getId().toString());
            abPayload.put("status", test.getStatus());
            abPayload.put("cookieTtlSeconds", test.getCookieTtlSeconds());
            abPayload.put("variants", variants.stream().map(v -> Map.of(
                    "key", v.getVariantKey(),
                    "url", v.getDestinationUrl(),
                    "weight", v.getWeight(),
                    "isControl", v.getIsControl()
            )).toList());
            return Optional.of(objectMapper.writeValueAsString(abPayload));
        } catch (Exception e) {
            log.error("Failed to serialize A/B rules for shortCode {}: {}", mapping.getShortCode(), e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Extracts smart routing rules using guard clauses.
     */
    private Optional<String> resolveSmartRulesJson(UrlMapping mapping) {
        if (mapping.getSmartRules() == null || mapping.getSmartRules().isBlank()) {
            return Optional.empty();
        }
        return Optional.of(mapping.getSmartRules());
    }

    /**
     * Standardized negative-space response when a URL mapping is missing or invalid.
     */
    private void sendNotFound(String shortCode, StreamObserver<UrlResponse> responseObserver) {
        UrlResponse notFoundResponse = UrlResponse.newBuilder()
                .setShortCode(shortCode != null ? shortCode : "")
                .setDestinationUrl("")
                .setIsActive(false)
                .setIsFound(false)
                .build();
        responseObserver.onNext(notFoundResponse);
        responseObserver.onCompleted();
    }
}
