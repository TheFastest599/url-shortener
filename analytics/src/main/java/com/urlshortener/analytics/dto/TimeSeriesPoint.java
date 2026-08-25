package com.urlshortener.analytics.dto;

public record TimeSeriesPoint(
        String timestamp,
        long clicks
) {
}
