package com.urlshortener.core.service;

import com.urlshortener.core.dto.CampaignResponse;
import com.urlshortener.core.dto.CreateCampaignRequest;
import com.urlshortener.core.entity.Campaign;
import com.urlshortener.core.entity.UrlMapping;
import com.urlshortener.core.repository.CampaignRepository;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CampaignServiceTest {

    @Mock
    private CampaignRepository campaignRepository;
    @Mock
    private UrlMappingRepository urlRepository;

    @InjectMocks
    private CampaignService campaignService;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
    }

    @Test
    @DisplayName("createCampaign - throws IllegalArgumentException on blank name")
    void createCampaign_blankName_throwsException() {
        CreateCampaignRequest request = new CreateCampaignRequest("   ", "desc");
        assertThrows(IllegalArgumentException.class, () -> campaignService.createCampaign(request, userId));
    }

    @Test
    @DisplayName("createCampaign - throws IllegalArgumentException on duplicate name")
    void createCampaign_duplicateName_throwsException() {
        CreateCampaignRequest request = new CreateCampaignRequest("Summer Launch", "desc");
        when(campaignRepository.existsByUserIdAndName(userId, "Summer Launch")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> campaignService.createCampaign(request, userId));
    }

    @Test
    @DisplayName("createCampaign - creates and saves campaign")
    void createCampaign_success() {
        CreateCampaignRequest request = new CreateCampaignRequest("Summer Launch", "desc");
        when(campaignRepository.existsByUserIdAndName(userId, "Summer Launch")).thenReturn(false);
        when(campaignRepository.save(any(Campaign.class))).thenAnswer(invocation -> {
            Campaign c = invocation.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        CampaignResponse response = campaignService.createCampaign(request, userId);

        assertNotNull(response);
        assertEquals("Summer Launch", response.name());
        assertEquals(0, response.linkCount());
    }

    @Test
    @DisplayName("getUserCampaigns - returns campaigns with link counts")
    void getUserCampaigns_returnsWithCounts() {
        UUID campaignId = UUID.randomUUID();
        Campaign c = Campaign.builder()
                .id(campaignId)
                .name("Q3 Campaign")
                .userId(userId)
                .build();

        when(campaignRepository.findByUserId(userId)).thenReturn(List.of(c));
        when(urlRepository.countByCampaignId(campaignId)).thenReturn(5L);

        List<CampaignResponse> list = campaignService.getUserCampaigns(userId);

        assertEquals(1, list.size());
        assertEquals(5L, list.get(0).linkCount());
    }

    @Test
    @DisplayName("deleteCampaign - unlinks URLs and deletes campaign")
    void deleteCampaign_unlinksUrls() {
        UUID campaignId = UUID.randomUUID();
        Campaign c = Campaign.builder().id(campaignId).userId(userId).name("To Delete").build();
        UrlMapping url = UrlMapping.builder().id(UUID.randomUUID()).campaignId(campaignId).build();

        when(campaignRepository.findByIdAndUserId(campaignId, userId)).thenReturn(Optional.of(c));
        when(urlRepository.findByCampaignId(campaignId)).thenReturn(List.of(url));

        campaignService.deleteCampaign(campaignId, userId);

        assertNull(url.getCampaignId());
        verify(urlRepository).saveAll(List.of(url));
        verify(campaignRepository).delete(c);
    }
}
