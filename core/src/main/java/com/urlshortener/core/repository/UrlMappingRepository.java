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

    @Query("SELECT u FROM UrlMapping u WHERE u.userId = :userId " +
           "AND (:search IS NULL OR :search = '' OR LOWER(u.shortCode) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.destinationUrl) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:isActive IS NULL OR u.isActive = :isActive)")
    Page<UrlMapping> findByUserIdWithFilters(
            @Param("userId") UUID userId,
            @Param("search") String search,
            @Param("isActive") Boolean isActive,
            Pageable pageable);
}
