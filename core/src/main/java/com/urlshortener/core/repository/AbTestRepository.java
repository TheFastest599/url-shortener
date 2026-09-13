package com.urlshortener.core.repository;

import com.urlshortener.core.entity.AbTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AbTestRepository extends JpaRepository<AbTest, UUID> {

    Optional<AbTest> findByUrlMappingId(UUID urlMappingId);

    void deleteByUrlMappingId(UUID urlMappingId);

    @Query("SELECT t FROM AbTest t, UrlMapping u WHERE t.urlMappingId = u.id AND u.userId = :userId")
    Page<AbTest> findAllByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT t FROM AbTest t, UrlMapping u WHERE t.urlMappingId = u.id AND u.userId = :userId AND UPPER(t.status) = UPPER(:status)")
    Page<AbTest> findByUserIdAndStatus(@Param("userId") UUID userId, @Param("status") String status, Pageable pageable);

    @Query("SELECT t FROM AbTest t, UrlMapping u " +
            "WHERE t.urlMappingId = u.id AND u.userId = :userId " +
            "AND (LOWER(t.name) LIKE :search OR LOWER(u.shortCode) LIKE :search)")
    Page<AbTest> searchByUserId(@Param("userId") UUID userId, @Param("search") String search, Pageable pageable);

    @Query("SELECT t FROM AbTest t, UrlMapping u " +
            "WHERE t.urlMappingId = u.id AND u.userId = :userId " +
            "AND UPPER(t.status) = UPPER(:status) " +
            "AND (LOWER(t.name) LIKE :search OR LOWER(u.shortCode) LIKE :search)")
    Page<AbTest> searchByUserIdAndStatus(@Param("userId") UUID userId, @Param("search") String search, @Param("status") String status, Pageable pageable);

    @Query("SELECT t FROM AbTest t, UrlMapping u WHERE t.id = :id AND t.urlMappingId = u.id AND u.userId = :userId")
    Optional<AbTest> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    @Query("SELECT t FROM AbTest t, UrlMapping u WHERE u.shortCode = :shortCode AND t.urlMappingId = u.id AND u.userId = :userId")
    Optional<AbTest> findByShortCodeAndUserId(@Param("shortCode") String shortCode, @Param("userId") UUID userId);
}
