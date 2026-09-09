package com.urlshortener.core.repository;

import com.urlshortener.core.entity.AbTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AbTestRepository extends JpaRepository<AbTest, UUID> {
    Optional<AbTest> findByUrlMappingId(UUID urlMappingId);
    void deleteByUrlMappingId(UUID urlMappingId);
}
