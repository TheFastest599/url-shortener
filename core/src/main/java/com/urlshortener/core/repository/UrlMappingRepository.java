package com.urlshortener.core.repository;

import com.urlshortener.core.entity.UrlMapping;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UrlMappingRepository extends JpaRepository<UrlMapping, UUID> {

    Optional<UrlMapping> findByShortCode(String shortCode);

    boolean existsByShortCode(String shortCode);

    List<UrlMapping> findByUserId(UUID userId);

    Page<UrlMapping> findByUserId(UUID userId, Pageable pageable);

    Page<UrlMapping> findByUserIdAndIsActive(UUID userId, Boolean isActive, Pageable pageable);

    Page<UrlMapping> findByUserIdAndCampaignId(UUID userId, UUID campaignId, Pageable pageable);

    Page<UrlMapping> findByUserIdAndIsActiveAndCampaignId(UUID userId, Boolean isActive, UUID campaignId, Pageable pageable);

    List<UrlMapping> findByCampaignId(UUID campaignId);

    long countByCampaignId(UUID campaignId);

    Page<UrlMapping> findByUserIdAndCampaignIdIsNull(UUID userId, Pageable pageable);

    Page<UrlMapping> findByUserIdAndIsActiveAndCampaignIdIsNull(UUID userId, Boolean isActive, Pageable pageable);

    @Query("SELECT u FROM UrlMapping u WHERE u.userId = :userId " +
            "AND (LOWER(u.shortCode) LIKE :search OR LOWER(u.destinationUrl) LIKE :search) " +
            "AND (:isActive IS NULL OR u.isActive = :isActive) " +
            "AND ((:unassignedOnly = true AND u.campaignId IS NULL) OR (:unassignedOnly = false AND (:campaignId IS NULL OR u.campaignId = :campaignId)))")
    Page<UrlMapping> searchUserUrls(
            @Param("userId") UUID userId,
            @Param("search") String search,
            @Param("isActive") Boolean isActive,
            @Param("campaignId") UUID campaignId,
            @Param("unassignedOnly") boolean unassignedOnly,
            Pageable pageable
    );
}

