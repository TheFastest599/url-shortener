package com.urlshortener.core.dto;

import com.urlshortener.core.dto.CreateAbTestRequest.VariantRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateAbTestRequest(
        @NotBlank(message = "A/B test name is required")
        @Size(min = 2, max = 100, message = "A/B test name must be between 2 and 100 characters")
        String name,

        @Min(value = 60, message = "Cookie stickiness TTL must be at least 60 seconds")
        @Max(value = 31536000, message = "Cookie stickiness TTL cannot exceed 365 days")
        Integer cookieTtlSeconds,

        @NotEmpty(message = "At least two variants are required")
        @Size(min = 2, max = 10, message = "An A/B test must have between 2 and 10 variants")
        List<@Valid VariantRequest> variants
) {}
