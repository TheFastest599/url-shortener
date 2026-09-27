package com.urlshortener.redirect.controller;

import com.urlshortener.redirect.service.RedirectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.net.URI;

@Slf4j
@RestController
@RequiredArgsConstructor
public class RedirectController {

    private final RedirectService redirectService;

    @GetMapping({"/r/{shortCode}", "/s/{shortCode}"})
    public Mono<ResponseEntity<Void>> redirect(
            @PathVariable String shortCode,
            ServerHttpRequest request,
            ServerHttpResponse response
    ) {
        return redirectService.resolveAndTrackUrl(shortCode, request, response)
                .map(destinationUrl -> {
                    URI uri = toSanitizedUri(destinationUrl);
                    return ResponseEntity.status(HttpStatus.FOUND)
                            .location(uri)
                            .<Void>build();
                })
                .defaultIfEmpty(ResponseEntity.status(HttpStatus.NOT_FOUND).build())
                .onErrorResume(e -> {
                    log.error("Redirect processing error for shortCode [{}]: {}", shortCode, e.getMessage());
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
                });
    }

    private URI toSanitizedUri(String url) {
        String target = url != null ? url.trim() : "";
        if (!target.startsWith("http://") && !target.startsWith("https://")) {
            target = "https://" + target;
        }
        try {
            return URI.create(target);
        } catch (IllegalArgumentException e) {
            return UriComponentsBuilder.fromUriString(target).build().toUri();
        }
    }
}
