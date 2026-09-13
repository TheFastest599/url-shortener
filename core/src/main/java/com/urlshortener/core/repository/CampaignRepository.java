package com.urlshortener.core.repository;

import com.urlshortener.core.entity.Campaign;
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
public interface CampaignRepository extends JpaRepository<Campaign, UUID> {
    List<Campaign> findByUserId(UUID userId);
    Page<Campaign> findByUserId(UUID userId, Pageable pageable);
    Optional<Campaign> findByIdAndUserId(UUID id, UUID userId);
    boolean existsByUserIdAndName(UUID userId, String name);

    @Query("SELECT c FROM Campaign c WHERE c.userId = :userId " +
            "AND (LOWER(c.name) LIKE :search OR LOWER(c.description) LIKE :search)")
    Page<Campaign> searchUserCampaigns(@Param("userId") UUID userId, @Param("search") String search, Pageable pageable);
}
