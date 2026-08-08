package com.urlshortener.apigateway.security.oauth;

import com.urlshortener.apigateway.dto.OAuth2UserInfo;
import reactor.core.publisher.Mono;

public interface OAuth2IdentityProvider {
    /**
     * Returns the uppercase provider name identifier (e.g. "GOOGLE", "GITHUB").
     */
    String getProviderName();
    /**
     * Exchanges authorization code for provider user details asynchronously.
     */
    Mono<OAuth2UserInfo> processAuthorizationCode(String code);
    /**
     * Constructs the OAuth2 login redirect URL for the frontend client.
     */
    String getAuthorizationUrl();
}
