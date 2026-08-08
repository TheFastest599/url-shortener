package com.urlshortener.apigateway.exception;


import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.support.WebExchangeBindException;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public Mono<ResponseEntity<Map<String, String>>> handleIllegalArgument(IllegalArgumentException ex) {
        return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                        "error" , "Bad Request",
                        "message", ex.getMessage()
                )));
    }

    @ExceptionHandler(WebExchangeBindException.class)
    public  Mono<ResponseEntity<Map<String, String>>> hanleValidation(WebExchangeBindException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + " " +
                        err.getDefaultMessage())
                .findFirst()
                .orElse("Validation Error");

        return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                        "error" , "Validation Error",
                        "message", message
                )));
    }
}
