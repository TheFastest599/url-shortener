package com.urlshortener.core.service;

import com.urlshortener.core.dto.AbTestResponse;
import com.urlshortener.core.dto.CreateAbTestRequest;
import com.urlshortener.core.dto.UpdateAbTestStatusRequest;
import com.urlshortener.core.entity.AbTest;
import com.urlshortener.core.entity.AbVariant;
import com.urlshortener.core.entity.UrlMapping;
import com.urlshortener.core.repository.AbTestRepository;
import com.urlshortener.core.repository.AbVariantRepository;
import com.urlshortener.core.repository.UrlMappingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AbTestServiceTest {

    @Mock
    private AbTestRepository abTestRepository;
    @Mock
    private AbVariantRepository abVariantRepository;
    @Mock
    private UrlMappingRepository urlRepository;
    @Mock
    private UrlCoreService urlCoreService;

    @InjectMocks
    private AbTestService abTestService;

    private UUID userId;
    private String shortCode;
    private UrlMapping mapping;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        shortCode = "test01";
        mapping = UrlMapping.builder()
                .id(UUID.randomUUID())
                .shortCode(shortCode)
                .destinationUrl("https://example.com/base")
                .userId(userId)
                .isAbTest(false)
                .build();
    }

    @Test
    @DisplayName("configureAbTest - throws IllegalStateException when user does not own URL")
    void configureAbTest_unauthorized_throwsException() {
        UUID otherUser = UUID.randomUUID();
        mapping.setUserId(otherUser);
        when(urlRepository.findByShortCode(shortCode)).thenReturn(Optional.of(mapping));

        CreateAbTestRequest request = new CreateAbTestRequest(
                "Test A/B",
                2592000,
                List.of(
                        new CreateAbTestRequest.VariantRequest("A", "https://v1.com", 50, true),
                        new CreateAbTestRequest.VariantRequest("B", "https://v2.com", 50, false)
                )
        );

        assertThrows(IllegalStateException.class, () -> abTestService.configureAbTest(shortCode, request, userId));
    }

    @Test
    @DisplayName("configureAbTest - throws IllegalArgumentException when variant weights do not sum to 100")
    void configureAbTest_invalidWeights_throwsException() {
        when(urlRepository.findByShortCode(shortCode)).thenReturn(Optional.of(mapping));

        CreateAbTestRequest request = new CreateAbTestRequest(
                "Bad Weights",
                2592000,
                List.of(
                        new CreateAbTestRequest.VariantRequest("A", "https://v1.com", 30, true),
                        new CreateAbTestRequest.VariantRequest("B", "https://v2.com", 40, false)
                )
        );

        assertThrows(IllegalArgumentException.class, () -> abTestService.configureAbTest(shortCode, request, userId));
    }

    @Test
    @DisplayName("configureAbTest - successfully saves test, enables isAbTest, and evicts cache")
    void configureAbTest_success() {
        when(urlRepository.findByShortCode(shortCode)).thenReturn(Optional.of(mapping));
        when(abTestRepository.findByUrlMappingId(mapping.getId())).thenReturn(Optional.empty());

        UUID testId = UUID.randomUUID();
        when(abTestRepository.save(any(AbTest.class))).thenAnswer(invocation -> {
            AbTest t = invocation.getArgument(0);
            t.setId(testId);
            return t;
        });
        when(abVariantRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        CreateAbTestRequest request = new CreateAbTestRequest(
                "Landing Test",
                2592000,
                List.of(
                        new CreateAbTestRequest.VariantRequest("A", "https://v1.com", 50, true),
                        new CreateAbTestRequest.VariantRequest("B", "https://v2.com", 50, false)
                )
        );

        AbTestResponse response = abTestService.configureAbTest(shortCode, request, userId);

        assertNotNull(response);
        assertEquals("ACTIVE", response.status());
        assertEquals(2, response.variants().size());
        assertTrue(mapping.getIsAbTest());
        verify(urlCoreService).evictRedirectCache(shortCode);
    }

    @Test
    @DisplayName("updateStatus - conclude test updates destination URL and disables A/B testing")
    void updateStatus_conclude_promotesWinner() {
        when(urlRepository.findByShortCode(shortCode)).thenReturn(Optional.of(mapping));

        UUID testId = UUID.randomUUID();
        AbTest test = AbTest.builder()
                .id(testId)
                .urlMappingId(mapping.getId())
                .name("Landing Test")
                .status("ACTIVE")
                .build();
        when(abTestRepository.findByUrlMappingId(mapping.getId())).thenReturn(Optional.of(test));

        AbVariant variantA = AbVariant.builder().abTestId(testId).variantKey("A").destinationUrl("https://v1.com").weight(50).build();
        AbVariant variantB = AbVariant.builder().abTestId(testId).variantKey("B").destinationUrl("https://winner.com").weight(50).build();
        when(abVariantRepository.findByAbTestId(testId)).thenReturn(List.of(variantA, variantB));
        when(abTestRepository.save(any(AbTest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateAbTestStatusRequest request = new UpdateAbTestStatusRequest("CONCLUDED", "B");
        AbTestResponse response = abTestService.updateStatus(shortCode, request, userId);

        assertEquals("CONCLUDED", response.status());
        assertEquals("B", response.winningVariant());
        assertEquals("https://winner.com", mapping.getDestinationUrl());
        assertFalse(mapping.getIsAbTest());
        verify(urlCoreService).evictRedirectCache(shortCode);
    }

    @Test
    @DisplayName("deleteAbTest - removes test, unsets flag, and evicts AB cache")
    void deleteAbTest_success() {
        when(urlRepository.findByShortCode(shortCode)).thenReturn(Optional.of(mapping));

        UUID testId = UUID.randomUUID();
        AbTest test = AbTest.builder().id(testId).urlMappingId(mapping.getId()).build();
        when(abTestRepository.findByUrlMappingId(mapping.getId())).thenReturn(Optional.of(test));

        abTestService.deleteAbTest(shortCode, userId);

        verify(abVariantRepository).deleteByAbTestId(testId);
        verify(abTestRepository).delete(test);
        assertFalse(mapping.getIsAbTest());
        verify(urlCoreService).evictAbCache(shortCode);
    }
}
