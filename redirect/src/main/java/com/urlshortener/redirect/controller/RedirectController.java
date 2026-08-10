package com.urlshortener.redirect.controller;

import com.urlshortener.redirect.service.RedirectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.net.URI;

@RestController
@RequiredArgsConstructor
public class RedirectController {

    private final RedirectService redirectService;

    @GetMapping("/r/{shortCode}")
    public Mono<ResponseEntity<Object>> redirect(
            @PathVariable String shortCode,
            ServerHttpRequest request
    ) {
        String userAgent = request.getHeaders().getFirst(HttpHeaders.USER_AGENT);
        String referrer = request.getHeaders().getFirst(HttpHeaders.REFERER);
        String ip = request.getRemoteAddress() != null
                ? request.getRemoteAddress().getAddress().getHostAddress()
                : "unknown";

        return redirectService.resolveAndTrackUrl(shortCode, userAgent, ip, referrer)
                .map(destinationUrl -> ResponseEntity.status(HttpStatus.FOUND)
                        .location(URI.create(destinationUrl))
                        .build())
                .defaultIfEmpty(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
}
