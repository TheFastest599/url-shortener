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

        // Single joint SQL query across url_mappings, ab_tests, and ab_variants
        List<com.urlshortener.core.repository.UrlResolutionProjection> rows =
                urlMappingRepository.findFullResolutionByShortCode(shortCode.trim());

        // Guard Clause 2: URL not found in database
        if (rows == null || rows.isEmpty()) {
            sendNotFound(shortCode, responseObserver);
            return;
        }

        com.urlshortener.core.repository.UrlResolutionProjection first = rows.get(0);

        // Guard Clause 3: Link is deactivated/disabled
        if (!Boolean.TRUE.equals(first.getIsActive())) {
            UrlResponse inactiveResponse = UrlResponse.newBuilder()
                    .setShortCode(first.getShortCode())
                    .setDestinationUrl(first.getDestinationUrl())
                    .setIsActive(false)
                    .setIsFound(true)
                    .build();
            responseObserver.onNext(inactiveResponse);
            responseObserver.onCompleted();
            return;
        }

        // URL is active and found: assemble single-pass response
        UrlResponse.Builder builder = UrlResponse.newBuilder()
                .setShortCode(first.getShortCode())
                .setDestinationUrl(first.getDestinationUrl())
                .setIsActive(true)
                .setIsFound(true);

        if (first.getSmartRules() != null && !first.getSmartRules().isBlank()) {
            builder.setSmartRulesJson(first.getSmartRules());
        }

        if (first.getUrlId() != null) {
            builder.setUrlId(first.getUrlId().toString());
        }
        if (first.getCampaignId() != null) {
            builder.setCampaignId(first.getCampaignId().toString());
        }
        if (first.getTestId() != null) {
            builder.setAbTestId(first.getTestId().toString());
        }

        // Process A/B testing variants from joined rows if test is ACTIVE
        if (Boolean.TRUE.equals(first.getIsAbTest()) && "ACTIVE".equalsIgnoreCase(first.getTestStatus())) {
            assembleAbRulesJson(first, rows).ifPresent(builder::setAbRulesJson);
        }

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
     * Assembles active A/B test variants into a JSON payload from the joint query rows.
     */
    private Optional<String> assembleAbRulesJson(
            com.urlshortener.core.repository.UrlResolutionProjection first,
            List<com.urlshortener.core.repository.UrlResolutionProjection> rows) {
        try {
            List<Map<String, Object>> variantList = new java.util.ArrayList<>();
            for (com.urlshortener.core.repository.UrlResolutionProjection row : rows) {
                if (row.getVariantKey() != null && !row.getVariantKey().isBlank()) {
                    variantList.add(Map.of(
                            "key", row.getVariantKey(),
                            "url", row.getVariantUrl() != null ? row.getVariantUrl() : "",
                            "weight", row.getVariantWeight() != null ? row.getVariantWeight() : 50,
                            "isControl", Boolean.TRUE.equals(row.getVariantIsControl())
                    ));
                }
            }

            if (variantList.isEmpty()) {
                return Optional.empty();
            }

            Map<String, Object> abPayload = new HashMap<>();
            abPayload.put("testId", first.getTestId() != null ? first.getTestId().toString() : "");
            abPayload.put("status", first.getTestStatus());
            abPayload.put("winningVariant", first.getWinningVariant());
            abPayload.put("cookieTtlSeconds", first.getCookieTtlSeconds() != null ? first.getCookieTtlSeconds() : 2592000);
            abPayload.put("variants", variantList);

            return Optional.of(objectMapper.writeValueAsString(abPayload));
        } catch (Exception e) {
            log.error("Failed to assemble A/B rules for shortCode {}: {}", first.getShortCode(), e.getMessage());
            return Optional.empty();
        }
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
