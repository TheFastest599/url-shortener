package com.urlshortener.apigateway.controller;

import com.urlshortener.apigateway.dto.AuthResponse;
import com.urlshortener.apigateway.dto.LoginRequest;
import com.urlshortener.apigateway.dto.RefreshTokenRequest;
import com.urlshortener.apigateway.dto.RegisterRequest;
import com.urlshortener.apigateway.security.oauth.OAuth2ProviderFactory;
import com.urlshortener.apigateway.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final OAuth2ProviderFactory oAuth2ProviderFactory;

    @Value("${app.frontend-url:${FRONTEND_URL:http://localhost:5173}}")
    private String frontendUrl;

    private ResponseCookie createRefreshTokenCookie(String refreshToken) {
        return ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(false) // localhost compatible
                .path("/")
                .maxAge(Duration.ofDays(7))
                .sameSite("Lax")
                .build();
    }

    private ResponseCookie createDeleteCookie() {
        return ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
    }

    @PostMapping("/register")
    public Mono<ResponseEntity<AuthResponse>> register(@Valid @RequestBody RegisterRequest request){
        return authService.register(request)
                .map(response -> ResponseEntity.status(HttpStatus.CREATED)
                        .header(HttpHeaders.SET_COOKIE, createRefreshTokenCookie(response.refreshToken()).toString())
                        .body(response));
    }

    @PostMapping("/login")
    public Mono<ResponseEntity<AuthResponse>> login(@Valid @RequestBody LoginRequest request){
        return authService.login(request)
                .map(response -> ResponseEntity.ok()
                        .header(HttpHeaders.SET_COOKIE, createRefreshTokenCookie(response.refreshToken()).toString())
                        .body(response));
    }

    @PostMapping("/refresh")
    public Mono<ResponseEntity<AuthResponse>> refreshToken(
            @CookieValue(name = "refreshToken", required = false) String cookieRefreshToken,
            @RequestBody(required = false) RefreshTokenRequest request
    ) {
        String tokenToRefresh = (request != null && request.refreshToken() != null && !request.refreshToken().isBlank())
                ? request.refreshToken()
                : cookieRefreshToken;

        if (tokenToRefresh == null || tokenToRefresh.isBlank()) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return authService.refreshToken(new RefreshTokenRequest(tokenToRefresh))
                .map(authResponse -> ResponseEntity.ok()
                        .header(HttpHeaders.SET_COOKIE, createRefreshTokenCookie(authResponse.refreshToken()).toString())
                        .body(authResponse))
                .onErrorResume(e -> Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .header(HttpHeaders.SET_COOKIE, createDeleteCookie().toString())
                        .build()));
    }

    @PostMapping("/logout")
    public Mono<ResponseEntity<Map<String, String>>> logout() {
        return Mono.just(ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, createDeleteCookie().toString())
                .body(Map.of("message", "Logged out successfully")));
    }

    @GetMapping("/oauth2/{provider}/login")
    public Mono<ResponseEntity<Map<String, String>>> getOAuth2LoginUrl(@PathVariable String provider) {
        String url = oAuth2ProviderFactory.getProvider(provider).getAuthorizationUrl();
        return Mono.just(ResponseEntity.ok(Map.of("authorizationUrl", url)));
    }

    @GetMapping("/oauth2/{provider}/callback")
    public Mono<ResponseEntity<AuthResponse>> oauth2Callback(
            @PathVariable String provider,
            @RequestParam String code
    ) {
        return authService.processOAuth2Login(provider, code)
                .map(authResponse -> {
                    URI redirectUri = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth2/callback")
                            .queryParam("accessToken", authResponse.accessToken())
                            .queryParam("refreshToken", authResponse.refreshToken())
                            .queryParam("id", authResponse.user().id())
                            .queryParam("username", authResponse.user().username())
                            .queryParam("email", authResponse.user().email())
                            .queryParam("role", authResponse.user().role())
                            .build()
                            .encode()
                            .toUri();
                    return ResponseEntity.status(HttpStatus.FOUND)
                            .header(HttpHeaders.SET_COOKIE, createRefreshTokenCookie(authResponse.refreshToken()).toString())
                            .location(redirectUri)
                            .body(authResponse);
                });
    }
}
