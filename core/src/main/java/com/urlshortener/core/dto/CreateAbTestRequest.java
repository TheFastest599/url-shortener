package com.urlshortener.core.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateAbTestRequest(
        @Size(max = 64, message = "Short code cannot exceed 64 characters")
        String shortCode,

        @NotBlank(message = "A/B test name is required")
        @Size(min = 2, max = 100, message = "A/B test name must be between 2 and 100 characters")
        String name,

        @Min(value = 60, message = "Cookie stickiness TTL must be at least 60 seconds")
        @Max(value = 31536000, message = "Cookie stickiness TTL cannot exceed 365 days")
        Integer cookieTtlSeconds,

        @NotEmpty(message = "At least two variants are required")
        @Size(min = 2, max = 10, message = "An A/B test must have between 2 and 10 variants")
        List<@Valid VariantRequest> variants
) {
    public record VariantRequest(
            @NotBlank(message = "Variant key is required")
            @Size(max = 10, message = "Variant key cannot exceed 10 characters")
            String key,

            @NotBlank(message = "Variant destination URL is required")
            @Size(max = 2048, message = "Variant destination URL cannot exceed 2048 characters")
            @Pattern(regexp = "^(https?://).+", message = "Variant destination URL must start with http:// or https://")
            String destinationUrl,

            @Min(value = 0, message = "Variant weight cannot be negative")
            @Max(value = 100, message = "Variant weight cannot exceed 100")
            int weight,

            boolean isControl
    ) {}
}
