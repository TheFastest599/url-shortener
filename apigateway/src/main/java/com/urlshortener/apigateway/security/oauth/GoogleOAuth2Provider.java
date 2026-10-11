package com.urlshortener.apigateway.security.oauth;

import com.urlshortener.apigateway.dto.OAuth2UserInfo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Component
public class GoogleOAuth2Provider implements OAuth2IdentityProvider {

    private final WebClient webClient = WebClient.create();

    @Value("${oauth.google.client-id:${OAUTH_GOOGLE_CLIENT_ID:google-client-id-fallback}}")
    private String clientId;

    @Value("${oauth.google.client-secret:${OAUTH_GOOGLE_CLIENT_SECRET:google-client-secret-fallback}}")
    private String clientSecret;

    @Value("${oauth.google.redirect-uri:${OAUTH_GOOGLE_REDIRECT_URI:http://localhost:8080/api/v1/auth/oauth2/google/callback}}")
    private String redirectUri;

    @Override
    public String getProviderName() {
        return "GOOGLE";
    }

    @Override
    public String getAuthorizationUrl() {
        return "https://accounts.google.com/o/oauth2/v2/auth" +
                "?client_id=" + clientId +
                "&redirect_uri=" + redirectUri +
                "&response_type=code" +
                "&scope=openid%20email%20profile";
    }

    @Override
    public Mono<OAuth2UserInfo> processAuthorizationCode(String code) {
        return webClient.post()
                .uri("https://oauth2.googleapis.com/token")
                .bodyValue(Map.of(
                        "code", code,
                        "client_id", clientId,
                        "client_secret", clientSecret,
                        "redirect_uri", redirectUri,
                        "grant_type", "authorization_code"
                ))
                .retrieve()
                .bodyToMono(Map.class)
                .flatMap(tokenResponse -> {
                    String accessToken = (String) tokenResponse.get("access_token");
                    return webClient.get()
                            .uri("https://www.googleapis.com/oauth2/v3/userinfo")
                            .headers(h -> h.setBearerAuth(accessToken))
                            .retrieve()
                            .bodyToMono(Map.class)
                            .map(userMap -> new OAuth2UserInfo(
                                    (String) userMap.get("sub"),
                                    (String) userMap.get("email"),
                                    (String) userMap.getOrDefault("name", userMap.get("email")),
                                    getProviderName()
                            ));
                });
    }
}
