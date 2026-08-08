package com.urlshortener.apigateway.dto;

public record OAuth2UserInfo(
        String providerUserId,
        String email,
        String username,
        String provider
) {
}
