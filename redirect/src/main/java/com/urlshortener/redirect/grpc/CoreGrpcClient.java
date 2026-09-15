package com.urlshortener.redirect.grpc;

import com.urlshortener.grpc.UrlRequest;
import com.urlshortener.grpc.UrlResponse;
import com.urlshortener.grpc.UrlServiceGrpc;
import net.devh.boot.grpc.client.inject.GrpcClient;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.concurrent.TimeUnit;

@Component
public class CoreGrpcClient {

    @GrpcClient("core-service")
    private UrlServiceGrpc.UrlServiceBlockingStub urlServiceBlockingStub;

    public Mono<UrlResponse> getDestinationUrl(String shortCode) {
        return Mono.fromCallable(() -> {
            UrlRequest request = UrlRequest.newBuilder()
                    .setShortCode(shortCode)
                    .build();

            return urlServiceBlockingStub
                    .withDeadlineAfter(5, TimeUnit.SECONDS)
                    .getDestinationUrl(request);
        }).subscribeOn(Schedulers.boundedElastic());
    }
}