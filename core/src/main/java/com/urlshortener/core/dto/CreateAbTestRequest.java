package com.urlshortener.core.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record CreateAbTestRequest(
        @NotBlank(message = "A/B test name is required")
        String name,
        Integer cookieTtlSeconds,
        @NotEmpty(message = "At least two variants are required")
        List<VariantRequest> variants
) {

    public record VariantRequest(
            @NotBlank String key,
            @NotBlank String destinationUrl,
            int weight,
            boolean isControl
    ){}
}
