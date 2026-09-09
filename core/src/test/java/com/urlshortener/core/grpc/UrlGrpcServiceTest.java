package com.urlshortener.core.grpc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.urlshortener.core.entity.UrlMapping;
import com.urlshortener.core.repository.AbTestRepository;
import com.urlshortener.core.repository.AbVariantRepository;
import com.urlshortener.core.repository.UrlMappingRepository;
import com.urlshortener.core.service.UrlCoreService;
import com.urlshortener.grpc.CreateUrlRequest;
import com.urlshortener.grpc.CreateUrlResponse;
import com.urlshortener.grpc.UrlRequest;
import com.urlshortener.grpc.UrlResponse;
import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UrlGrpcServiceTest {

    @Mock
    private UrlMappingRepository urlMappingRepository;
    @Mock
    private AbTestRepository abTestRepository;
    @Mock
    private AbVariantRepository abVariantRepository;
    @Mock
    private UrlCoreService urlCoreService;
    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private StreamObserver<UrlResponse> responseObserver;
    @Mock
    private StreamObserver<CreateUrlResponse> createResponseObserver;

    @InjectMocks
    private UrlGrpcService urlGrpcService;

    @Test
    @DisplayName("getDestinationUrl - returns not found for blank short code")
    void getDestinationUrl_blankShortCode_notFound() {
        UrlRequest request = UrlRequest.newBuilder().setShortCode("").build();

        urlGrpcService.getDestinationUrl(request, responseObserver);

        ArgumentCaptor<UrlResponse> captor = ArgumentCaptor.forClass(UrlResponse.class);
        verify(responseObserver).onNext(captor.capture());
        verify(responseObserver).onCompleted();

        UrlResponse response = captor.getValue();
        assertFalse(response.getIsFound());
        assertFalse(response.getIsActive());
    }

    @Test
    @DisplayName("getDestinationUrl - returns not found when mapping does not exist in DB")
    void getDestinationUrl_missingMapping_notFound() {
        UrlRequest request = UrlRequest.newBuilder().setShortCode("missing").build();
        when(urlMappingRepository.findByShortCode("missing")).thenReturn(Optional.empty());

        urlGrpcService.getDestinationUrl(request, responseObserver);

        ArgumentCaptor<UrlResponse> captor = ArgumentCaptor.forClass(UrlResponse.class);
        verify(responseObserver).onNext(captor.capture());
        verify(responseObserver).onCompleted();

        UrlResponse response = captor.getValue();
        assertFalse(response.getIsFound());
    }

    @Test
    @DisplayName("getDestinationUrl - returns inactive and found when link is disabled")
    void getDestinationUrl_inactiveLink_returnsInactive() {
        UrlRequest request = UrlRequest.newBuilder().setShortCode("inactive").build();
        UrlMapping mapping = UrlMapping.builder()
                .shortCode("inactive")
                .destinationUrl("https://example.com")
                .isActive(false)
                .build();

        when(urlMappingRepository.findByShortCode("inactive")).thenReturn(Optional.of(mapping));

        urlGrpcService.getDestinationUrl(request, responseObserver);

        ArgumentCaptor<UrlResponse> captor = ArgumentCaptor.forClass(UrlResponse.class);
        verify(responseObserver).onNext(captor.capture());
        verify(responseObserver).onCompleted();

        UrlResponse response = captor.getValue();
        assertTrue(response.getIsFound());
        assertFalse(response.getIsActive());
    }

    @Test
    @DisplayName("getDestinationUrl - returns active URL response for valid active link")
    void getDestinationUrl_activeLink_returnsActive() {
        UrlRequest request = UrlRequest.newBuilder().setShortCode("active01").build();
        UrlMapping mapping = UrlMapping.builder()
                .id(UUID.randomUUID())
                .shortCode("active01")
                .destinationUrl("https://example.com")
                .isActive(true)
                .isAbTest(false)
                .build();

        when(urlMappingRepository.findByShortCode("active01")).thenReturn(Optional.of(mapping));

        urlGrpcService.getDestinationUrl(request, responseObserver);

        ArgumentCaptor<UrlResponse> captor = ArgumentCaptor.forClass(UrlResponse.class);
        verify(responseObserver).onNext(captor.capture());
        verify(responseObserver).onCompleted();

        UrlResponse response = captor.getValue();
        assertTrue(response.getIsFound());
        assertTrue(response.getIsActive());
        assertEquals("https://example.com", response.getDestinationUrl());
    }

    @Test
    @DisplayName("createUrlMapping - creates mapping and returns success")
    void createUrlMapping_success() {
        CreateUrlRequest request = CreateUrlRequest.newBuilder()
                .setDestinationUrl("https://example.com/grpc")
                .setCustomAlias("grpc01")
                .build();

        UrlMapping created = UrlMapping.builder()
                .shortCode("grpc01")
                .destinationUrl("https://example.com/grpc")
                .build();

        when(urlCoreService.createShortUrl(any(), any())).thenReturn(created);

        urlGrpcService.createUrlMapping(request, createResponseObserver);

        ArgumentCaptor<CreateUrlResponse> captor = ArgumentCaptor.forClass(CreateUrlResponse.class);
        verify(createResponseObserver).onNext(captor.capture());
        verify(createResponseObserver).onCompleted();

        CreateUrlResponse response = captor.getValue();
        assertTrue(response.getSuccess());
        assertEquals("grpc01", response.getShortCode());
    }
}
