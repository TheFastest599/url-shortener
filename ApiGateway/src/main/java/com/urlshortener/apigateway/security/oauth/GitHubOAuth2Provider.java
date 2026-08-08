package com.urlshortener.apigateway.security.oauth;

import com.urlshortener.apigateway.dto.OAuth2UserInfo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Component
public class GitHubOAuth2Provider implements OAuth2IdentityProvider {

    private final WebClient webClient = WebClient.create();

    @Value("${oauth.github.client-id:${OAUTH_GITHUB_CLIENT_ID:github-client-id-fallback}}")
    private String clientId;

    @Value("${oauth.github.client-secret:${OAUTH_GITHUB_CLIENT_SECRET:github-client-secret-fallback}}")
    private String clientSecret;

    @Value("${oauth.github.redirect-uri:${OAUTH_GITHUB_REDIRECT_URI:http://localhost:8080/api/v1/auth/oauth2/callback/github}}")
    private String redirectUri;

    @Override
    public String getProviderName() {
        return "GITHUB";
    }

    @Override
    public String getAuthorizationUrl() {
        return "https://github.com/login/oauth/authorize" +
                "?client_id=" + clientId +
                "&redirect_uri=" + redirectUri +
                "&scope=user:email";
    }

    @Override
    public Mono<OAuth2UserInfo> processAuthorizationCode(String code) {
        return webClient.post()
                .uri("https://github.com/login/oauth/access_token")
                .header("Accept", "application/json")
                .bodyValue(Map.of(
                        "code", code,
                        "client_id", clientId,
                        "client_secret", clientSecret,
                        "redirect_uri", redirectUri
                ))
                .retrieve()
                .bodyToMono(Map.class)
                .flatMap(tokenResponse -> {
                    String accessToken = (String) tokenResponse.get("access_token");
                    return webClient.get()
                            .uri("https://api.github.com/user")
                            .headers(h -> h.setBearerAuth(accessToken))
                            .retrieve()
                            .bodyToMono(Map.class)
                            .map(userMap -> new OAuth2UserInfo(
                                    String.valueOf(userMap.get("id")),
                                    (String) userMap.get("email"),
                                    (String) userMap.get("login"),
                                    getProviderName()
                            ));
                });
    }
}