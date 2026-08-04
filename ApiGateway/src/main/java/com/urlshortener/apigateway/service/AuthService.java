package com.urlshortener.apigateway.service;

import com.urlshortener.apigateway.dto.*;
import com.urlshortener.apigateway.entity.RefreshToken;
import com.urlshortener.apigateway.entity.User;
import com.urlshortener.apigateway.entity.UserPassword;
import com.urlshortener.apigateway.repository.RefreshTokenRepository;
import com.urlshortener.apigateway.repository.UserPasswordRepository;
import com.urlshortener.apigateway.repository.UserRepository;
import com.urlshortener.apigateway.security.JwtTokenProvider;
import com.urlshortener.apigateway.security.oauth.OAuth2IdentityProvider;
import com.urlshortener.apigateway.security.oauth.OAuth2ProviderFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserPasswordRepository passwordRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final OAuth2ProviderFactory oAuth2ProviderFactory;

//    1. Public Authentication APIs

//    @Transactional
    public Mono<AuthResponse> register(RegisterRequest request){
        return validateUserDoesNotExist(request.email(), request.username())
                .then(saveUser(request))
                .flatMap(user -> saveUserPassword(user, request.password()))
                .flatMap(this::generateAuthTokenPair);
    }

    public Mono<AuthResponse> login(LoginRequest request) {
        return findUserByEmail(request.email())
                .flatMap(user -> verifyPassword(user, request.password()))
                .flatMap(this::generateAuthTokenPair);
    }

    @Transactional
    public Mono<AuthResponse> refreshToken(RefreshTokenRequest request) {
        return findValidRefreshToken(request.refreshToken())
                .flatMap(this::rotateRefreshToken)
                .flatMap(token ->userRepository.findById(token.getUserId()))
                .flatMap(this::generateAuthTokenPair);
    }

    @Transactional
    public Mono<AuthResponse> processOAuth2Login(String providerName, String code) {
        OAuth2IdentityProvider provider =oAuth2ProviderFactory.getProvider(providerName);

        return provider.processAuthorizationCode(code)
                .flatMap(this::findOrCreateAuthUser)
                .flatMap(this::generateAuthTokenPair);
    }

//    2. HELPER METHODS

    private Mono<Void> validateUserDoesNotExist(String email, String username){
        return userRepository.existsByEmail(email)
                .flatMap(emailExists -> emailExists
                ? Mono.error(new IllegalArgumentException("Email Already Registered"))
                : userRepository.existsByUsername(username))
                .flatMap(usernameExists -> usernameExists
                 ? Mono.error(new IllegalArgumentException("Username already taken"))
                 : Mono.empty());

    }

    private Mono<User> saveUser(RegisterRequest request) {
        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .role("USER")
                .authType("EMAIL")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        return userRepository.save(user);
    }

    private Mono<User> saveUserPassword(User user, String rawPassword){
        UserPassword userPassword = UserPassword.builder()
                .userId(user.getId())
                .passwordHash(passwordEncoder.encode(rawPassword))
                .updatedAt(Instant.now())
                .build();

        return passwordRepository.save(userPassword).thenReturn(user);
    }

    private Mono<User> findUserByEmail(String email){
        return userRepository.findByEmail(email)
                .switchIfEmpty(Mono.error(new
                        IllegalArgumentException("Invalid email or password")));
    }

    private Mono<User> verifyPassword(User user, String rawPassword){
        return passwordRepository.findByUserId(user.getId())
                .flatMap(userPassword -> {
                    if(!passwordEncoder.matches(rawPassword, userPassword.getPasswordHash()))
                    {
                        return Mono.error(new IllegalArgumentException("Email or password om"));
                    }
                    return  Mono.just(user);
                });
    }

    private Mono<RefreshToken> findValidRefreshToken(String token){
        return refreshTokenRepository.findByToken(token)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Invalid Refresh Token")))
                .flatMap(refreshToken -> {
                    if (refreshToken.getRevoked() || refreshToken.getExpiryDate().isBefore(Instant.now())){
                        return Mono.error(new IllegalArgumentException("Refresh Token is expired or revoked"));
                    }
                    return Mono.just(refreshToken);
                });
    }

    private Mono<RefreshToken> rotateRefreshToken(RefreshToken refreshToken) {
        refreshToken.setRevoked(true);
        return refreshTokenRepository.save(refreshToken);
    }

    private Mono<User> findOrCreateAuthUser(OAuth2UserInfo userInfo){
        return userRepository.findByEmail(userInfo.email())
                .switchIfEmpty(userRepository.save(User.builder()
                        .username(userInfo.username())
                        .email(userInfo.email())
                        .role("USER")
                        .authType(userInfo.provider())
                        .createdAt(Instant.now())
                        .updatedAt(Instant.now())
                        .build()
                ));
    }

    private Mono<AuthResponse> generateAuthTokenPair(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getUsername(), user.getEmail(), user.getRole()
        );

        String rawRefreshToken = jwtTokenProvider.generateRefreshToken();

        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .userId(user.getId())
                .token(rawRefreshToken)
                .expiryDate(Instant.now().plus(7, ChronoUnit.DAYS))
                .revoked(false)
                .createdAt(Instant.now())
                .build();

        return refreshTokenRepository.save(refreshTokenEntity)
                .map(savedToken -> new AuthResponse(
                        accessToken,
                        rawRefreshToken,
                        "Bearer",
                        900,
                        new UserDto(user.getId(), user.getUsername(), user.getEmail(), user.getRole())
                ));
    }


}
