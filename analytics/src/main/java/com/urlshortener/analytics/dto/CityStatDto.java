package com.urlshortener.analytics.dto;

public record CityStatDto(
        String city,
        String country,
        long count,
        double percentage
) {
}
