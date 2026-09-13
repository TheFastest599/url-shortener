package com.urlshortener.redirect.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.urlshortener.grpc.UrlResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Standardized DTO encapsulating the entire routing payload for a short code.
 * Handles bidirectional runtime translation between Redis string hash fields and Java domain objects.
 */
@Slf4j
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShortCodePayloadDto {

    private String shortCode;
    private String targetUrl;
    private AbConfig abConfig;
    private SmartRules smartRules;
    private long hits;

    /**
     * Runtime converter: transforms Redis Hash entries into a structured domain DTO.
     */
    public static ShortCodePayloadDto fromHash(String shortCode, Map<String, String> hash, long hits, ObjectMapper mapper) {
        if (hash == null || hash.isEmpty() || !hash.containsKey("target") || hash.get("target").isBlank()) {
            return ShortCodePayloadDto.builder()
                    .shortCode(shortCode)
                    .hits(hits)
                    .build();
        }

        String targetUrl = hash.get("target");
        AbConfig abConfig = null;
        String abString = hash.get("ab");
        if (abString != null && !abString.isBlank()) {
            try {
                abConfig = mapper.readValue(abString, AbConfig.class);
            } catch (Exception e) {
                log.warn("Failed to deserialize AbConfig for {}: {}", shortCode, e.getMessage());
            }
        }

        SmartRules smartRules = null;
        String rulesString = hash.get("rules");
        if (rulesString != null && !rulesString.isBlank()) {
            try {
                smartRules = mapper.readValue(rulesString, SmartRules.class);
            } catch (Exception e) {
                log.warn("Failed to deserialize SmartRules for {}: {}", shortCode, e.getMessage());
            }
        }

        return ShortCodePayloadDto.builder()
                .shortCode(shortCode)
                .targetUrl(targetUrl)
                .abConfig(abConfig)
                .smartRules(smartRules)
                .hits(hits)
                .build();
    }

    /**
     * Runtime converter: transforms the structured domain DTO into Redis Hash string fields.
     */
    public Map<String, String> toHash(ObjectMapper mapper) {
        Map<String, String> map = new HashMap<>();
        if (targetUrl != null && !targetUrl.isBlank()) {
            map.put("target", targetUrl);
        }

        if (abConfig != null) {
            try {
                map.put("ab", mapper.writeValueAsString(abConfig));
            } catch (Exception e) {
                log.warn("Failed to serialize AbConfig for {}: {}", shortCode, e.getMessage());
            }
        }

        if (smartRules != null) {
            try {
                map.put("rules", mapper.writeValueAsString(smartRules));
            } catch (Exception e) {
                log.warn("Failed to serialize SmartRules for {}: {}", shortCode, e.getMessage());
            }
        }

        return map;
    }

    /**
     * Factory method: constructs the DTO from a single-query gRPC response.
     */
    public static ShortCodePayloadDto fromGrpc(String shortCode, UrlResponse response, long hits, ObjectMapper mapper) {
        String targetUrl = response.getDestinationUrl();
        AbConfig abConfig = null;
        if (!response.getAbRulesJson().isEmpty()) {
            try {
                abConfig = mapper.readValue(response.getAbRulesJson(), AbConfig.class);
            } catch (Exception e) {
                log.warn("Failed to parse gRPC AbRules for {}: {}", shortCode, e.getMessage());
            }
        }

        SmartRules smartRules = null;
        if (!response.getSmartRulesJson().isEmpty()) {
            try {
                smartRules = mapper.readValue(response.getSmartRulesJson(), SmartRules.class);
            } catch (Exception e) {
                log.warn("Failed to parse gRPC SmartRules for {}: {}", shortCode, e.getMessage());
            }
        }

        return ShortCodePayloadDto.builder()
                .shortCode(shortCode)
                .targetUrl(targetUrl)
                .abConfig(abConfig)
                .smartRules(smartRules)
                .hits(hits)
                .build();
    }

    public boolean isEmpty() {
        return targetUrl == null || targetUrl.isBlank();
    }

    public boolean hasAbConfig() {
        return abConfig != null && "ACTIVE".equalsIgnoreCase(abConfig.status());
    }

    public boolean hasSmartRules() {
        return smartRules != null && smartRules.devices() != null;
    }

    // Domain models used during routing resolution
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AbConfig(String status, String winningVariant, List<Variant> variants, Long cookieTtlSeconds, String testId) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Variant(String key, String url, int weight, Boolean isControl) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record SmartRules(Map<String, String> devices, Map<String, String> countries) {}

    public record VariantResolution(String url, String variantKey) {}
}
