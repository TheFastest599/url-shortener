package com.urlshortener.core.repository;

import com.urlshortener.core.entity.UrlMapping;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA Repository for basic UrlMapping entity CRUD operations.
 * For complex multi-table joins, searching, and resolution queries, see {@link UrlMappingQueryRepository} (jOOQ).
 */
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
}
