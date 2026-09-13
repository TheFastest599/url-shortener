package com.urlshortener.apigateway.security;


import com.google.common.net.HttpHeaders;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.web.server.context.ServerSecurityContextRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
@RequiredArgsConstructor
public class BearerTokenSecurityContextRepository implements ServerSecurityContextRepository {
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public Mono<Void> save(ServerWebExchange exchange, SecurityContext context){
        return Mono.empty();
    }

    @Override
    public Mono<SecurityContext> load(ServerWebExchange exchange){
        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader != null && authHeader.startsWith("Bearer ")){
            String token = authHeader.substring(7);
            if (jwtTokenProvider.validToken(token)){
                Claims claims = jwtTokenProvider.getClaimsFromToken(token);
                String userId = claims.getSubject();
                String role = claims.get("role", String.class);
                String authority = (role != null && !role.isBlank())
                        ? (role.startsWith("ROLE_") ? role : "ROLE_" + role)
                        : "ROLE_USER";

                List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(authority));

                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userId, null, authorities);

                return Mono.just(new SecurityContextImpl(auth));
            }
        }
        return Mono.empty();
    }
}
