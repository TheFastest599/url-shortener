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

    @Query(value = "SELECT new com.urlshortener.core.dto.ShortUrlResponse(" +
            "u.id, u.shortCode, u.destinationUrl, u.campaignId, c.name, " +
            "u.isAbTest, t.id, t.name, t.status, u.smartRules, u.tenantId, " +
            "u.userId, u.isActive, u.expiresAt, u.createdAt, u.updatedAt) " +
            "FROM UrlMapping u " +
            "LEFT JOIN Campaign c ON u.campaignId = c.id " +
            "LEFT JOIN AbTest t ON t.urlMappingId = u.id " +
            "WHERE u.userId = :userId " +
            "AND (:search IS NULL OR LOWER(u.shortCode) LIKE :search OR LOWER(u.destinationUrl) LIKE :search) " +
            "AND (:isActive IS NULL OR u.isActive = :isActive) " +
            "AND ((:unassignedOnly = true AND u.campaignId IS NULL) OR (:unassignedOnly = false AND (:campaignId IS NULL OR u.campaignId = :campaignId)))",
            countQuery = "SELECT count(u) FROM UrlMapping u " +
            "WHERE u.userId = :userId " +
            "AND (:search IS NULL OR LOWER(u.shortCode) LIKE :search OR LOWER(u.destinationUrl) LIKE :search) " +
            "AND (:isActive IS NULL OR u.isActive = :isActive) " +
            "AND ((:unassignedOnly = true AND u.campaignId IS NULL) OR (:unassignedOnly = false AND (:campaignId IS NULL OR u.campaignId = :campaignId)))")
    Page<com.urlshortener.core.dto.ShortUrlResponse> searchUserUrls(
            @Param("userId") UUID userId,
            @Param("search") String search,
            @Param("isActive") Boolean isActive,
            @Param("campaignId") UUID campaignId,
            @Param("unassignedOnly") boolean unassignedOnly,
            Pageable pageable
    );

    @Query("SELECT new com.urlshortener.core.dto.ShortUrlResponse(" +
            "u.id, u.shortCode, u.destinationUrl, u.campaignId, c.name, " +
            "u.isAbTest, t.id, t.name, t.status, u.smartRules, u.tenantId, " +
            "u.userId, u.isActive, u.expiresAt, u.createdAt, u.updatedAt) " +
            "FROM UrlMapping u " +
            "LEFT JOIN Campaign c ON u.campaignId = c.id " +
            "LEFT JOIN AbTest t ON t.urlMappingId = u.id " +
            "WHERE u.userId = :userId ORDER BY u.createdAt DESC")
    List<com.urlshortener.core.dto.ShortUrlResponse> findUserUrlsWithDetails(@Param("userId") UUID userId);

    @Query("SELECT new com.urlshortener.core.dto.ShortUrlResponse(" +
            "u.id, u.shortCode, u.destinationUrl, u.campaignId, c.name, " +
            "u.isAbTest, t.id, t.name, t.status, u.smartRules, u.tenantId, " +
            "u.userId, u.isActive, u.expiresAt, u.createdAt, u.updatedAt) " +
            "FROM UrlMapping u " +
            "LEFT JOIN Campaign c ON u.campaignId = c.id " +
            "LEFT JOIN AbTest t ON t.urlMappingId = u.id " +
            "WHERE u.id = :urlId AND u.userId = :userId")
    Optional<com.urlshortener.core.dto.ShortUrlResponse> findUserUrlWithDetails(@Param("urlId") UUID urlId, @Param("userId") UUID userId);

    @Query("SELECT new com.urlshortener.core.dto.ShortUrlResponse(" +
            "u.id, u.shortCode, u.destinationUrl, u.campaignId, c.name, " +
            "u.isAbTest, t.id, t.name, t.status, u.smartRules, u.tenantId, " +
            "u.userId, u.isActive, u.expiresAt, u.createdAt, u.updatedAt) " +
            "FROM UrlMapping u " +
            "LEFT JOIN Campaign c ON u.campaignId = c.id " +
            "LEFT JOIN AbTest t ON t.urlMappingId = u.id " +
            "WHERE u.shortCode = :shortCode")
    Optional<com.urlshortener.core.dto.ShortUrlResponse> findByShortCodeWithDetails(@Param("shortCode") String shortCode);


    @Query("SELECT u.shortCode as shortCode, u.destinationUrl as destinationUrl, u.isActive as isActive, " +
            "u.isAbTest as isAbTest, u.smartRules as smartRules, u.id as urlId, u.campaignId as campaignId, " +
            "t.id as testId, t.status as testStatus, t.winningVariant as winningVariant, t.cookieTtlSeconds as cookieTtlSeconds, " +
            "v.variantKey as variantKey, v.destinationUrl as variantUrl, v.weight as variantWeight, v.isControl as variantIsControl " +
            "FROM UrlMapping u " +
            "LEFT JOIN AbTest t ON t.urlMappingId = u.id " +
            "LEFT JOIN AbVariant v ON v.abTestId = t.id " +
            "WHERE u.shortCode = :shortCode")
    List<UrlResolutionProjection> findFullResolutionByShortCode(@Param("shortCode") String shortCode);
}


