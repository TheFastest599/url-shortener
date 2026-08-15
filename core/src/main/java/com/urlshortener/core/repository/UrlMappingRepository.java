package com.urlshortener.core.repository;


import com.urlshortener.core.entity.UrlMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UrlMappingRepository extends JpaRepository<UrlMapping, UUID> {
    Optional<UrlMapping> findByShortCode(String shortCode);
    boolean existsByShortCode (String shortCode);
    List<UrlMapping> findByUserId(UUID userId);

}
