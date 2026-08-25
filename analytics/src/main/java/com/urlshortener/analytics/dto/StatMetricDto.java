package com.urlshortener.analytics.dto;

public record StatMetricDto(
        String name,
        long count,
        double percentage
) {
}
