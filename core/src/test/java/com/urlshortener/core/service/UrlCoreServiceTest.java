package com.urlshortener.core.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.urlshortener.core.dto.CreateUrlRequest;
import com.urlshortener.core.dto.UpdateUrlRequest;
import com.urlshortener.core.entity.UrlMapping;
import com.urlshortener.core.repository.AbTestRepository;
import com.urlshortener.core.repository.AbVariantRepository;
import com.urlshortener.core.repository.UrlMappingRepository;
import com.urlshortener.core.util.Base62;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UrlCoreServiceTest {

    @Mock
    private UrlMappingRepository urlRepository;
    @Mock
    private AbTestRepository abTestRepository;
    @Mock
    private AbVariantRepository abVariantRepository;
    @Mock
    private Base62 base62;
    @Mock
    private StringRedisTemplate redisTemplate;
    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private UrlCoreService urlCoreService;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
    }

    @Test
    @DisplayName("createShortUrl - throws IllegalArgumentException when custom alias is already in use")
    void createShortUrl_duplicateAlias_throwsException() {
        CreateUrlRequest request = new CreateUrlRequest(
                "https://example.com",
                "taken-alias",
                null,
                null
        );
        when(urlRepository.existsByShortCode("taken-alias")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> urlCoreService.createShortUrl(request, userId));
    }

    @Test
    @DisplayName("createShortUrl - successfully saves URL with generated shortCode")
    void createShortUrl_generatesCode_success() {
        CreateUrlRequest request = new CreateUrlRequest(
                "https://example.com/blog",
                null,
                null,
                null
        );
        when(base62.generateRandomShortCode(7)).thenReturn("abc1234");
        when(urlRepository.existsByShortCode("abc1234")).thenReturn(false);
        when(urlRepository.save(any(UrlMapping.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UrlMapping created = urlCoreService.createShortUrl(request, userId);

        assertNotNull(created);
        assertEquals("abc1234", created.getShortCode());
        assertEquals("https://example.com/blog", created.getDestinationUrl());
        assertEquals(userId, created.getUserId());
    }

    @Test
    @DisplayName("updateShortUrl - throws IllegalStateException when user does not own URL")
    void updateShortUrl_unauthorized_throwsException() {
        UUID urlId = UUID.randomUUID();
        UUID otherUser = UUID.randomUUID();
        UrlMapping existing = UrlMapping.builder()
                .id(urlId)
                .shortCode("link01")
                .destinationUrl("https://old.com")
                .userId(otherUser)
                .build();

        when(urlRepository.findById(urlId)).thenReturn(Optional.of(existing));

        UpdateUrlRequest updateRequest = new UpdateUrlRequest(
                "https://new.com",
                null,
                null,
                true,
                null
        );

        assertThrows(IllegalStateException.class, () -> urlCoreService.updateShortUrl(urlId, updateRequest, userId));
    }

    @Test
    @DisplayName("updateShortUrl - updates URL and evicts Strategy 1 Redis cache")
    void updateShortUrl_success_evictsCache() {
        UUID urlId = UUID.randomUUID();
        UrlMapping existing = UrlMapping.builder()
                .id(urlId)
                .shortCode("link01")
                .destinationUrl("https://old.com")
                .userId(userId)
                .build();

        when(urlRepository.findById(urlId)).thenReturn(Optional.of(existing));
        when(urlRepository.save(any(UrlMapping.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateUrlRequest updateRequest = new UpdateUrlRequest(
                "https://new.com",
                null,
                null,
                true,
                null
        );

        UrlMapping updated = urlCoreService.updateShortUrl(urlId, updateRequest, userId);

        assertEquals("https://new.com", updated.getDestinationUrl());
        verify(redisTemplate).delete(anyCollection());
    }

    @Test
    @DisplayName("deleteShortUrl - deletes mapping and evicts Strategy 1 Redis cache")
    void deleteShortUrl_success_evictsCache() {
        UUID urlId = UUID.randomUUID();
        UrlMapping existing = UrlMapping.builder()
                .id(urlId)
                .shortCode("del01")
                .destinationUrl("https://example.com")
                .userId(userId)
                .build();

        when(urlRepository.findById(urlId)).thenReturn(Optional.of(existing));

        urlCoreService.deleteShortUrl(urlId, userId);

        verify(urlRepository).delete(existing);
        verify(redisTemplate).delete(anyCollection());
    }
}
