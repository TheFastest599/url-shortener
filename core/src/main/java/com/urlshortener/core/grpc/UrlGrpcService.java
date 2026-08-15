package com.urlshortener.core.grpc;


import com.urlshortener.core.entity.UrlMapping;
import com.urlshortener.core.repository.UrlMappingRepository;
import com.urlshortener.grpc.UrlRequest;
import com.urlshortener.grpc.UrlResponse;
import com.urlshortener.grpc.UrlServiceGrpc;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.server.service.GrpcService;

import java.util.Optional;

@GrpcService
@RequiredArgsConstructor
public class UrlGrpcService extends UrlServiceGrpc.UrlServiceImplBase {

    private final UrlMappingRepository urlMappingRepository;

    @Override
    public void getDestinationUrl(UrlRequest request, StreamObserver<UrlResponse> responseObserver){
        Optional<UrlMapping> mappingOpt = urlMappingRepository.findByShortCode(request.getShortCode());

        if(mappingOpt.isPresent()){
            UrlMapping mapping = mappingOpt.get();
            UrlResponse response = UrlResponse.newBuilder()
                    .setShortCode(mapping.getShortCode())
                    .setDestinationUrl(mapping.getDestinationUrl())
                    .setIsActive(mapping.getIsActive())
                    .setIsFound(true)
                    .build();
            responseObserver.onNext(response);
        } else {
            UrlResponse response = UrlResponse.newBuilder()
                    .setShortCode(request.getShortCode())
                    .setIsFound(false)
                    .build();
            responseObserver.onNext(response);
        }
        responseObserver.onCompleted();
    }
}
