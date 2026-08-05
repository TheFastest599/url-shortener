package com.urlshortener.apigateway.controller;


import com.urlshortener.apigateway.dto.AuthResponse;
import com.urlshortener.apigateway.dto.LoginRequest;
import com.urlshortener.apigateway.dto.RefreshTokenRequest;
import com.urlshortener.apigateway.dto.RegisterRequest;
import com.urlshortener.apigateway.security.oauth.OAuth2ProviderFactory;
import com.urlshortener.apigateway.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final OAuth2ProviderFactory oAuth2ProviderFactory;

    @PostMapping("/register")
    public Mono<ResponseEntity<AuthResponse>> register(@Valid @RequestBody RegisterRequest request){
        return authService.register(request)
                .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response));
    }

    @PostMapping("/login")
    public Mono<ResponseEntity<AuthResponse>> login(@Valid @RequestBody LoginRequest request){
        return authService.login(request)
                .map(ResponseEntity::ok);
    }

    @PostMapping("/refresh")
    public Mono<ResponseEntity<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return authService.refreshToken(request)
                .map(ResponseEntity::ok);
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
                .map(ResponseEntity::ok);
    }
}
