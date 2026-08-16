package com.urlshortener.core.repository;


import com.urlshortener.core.entity.UtmProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UtmProfileRepository extends JpaRepository<UtmProfile, UUID> {
    List<UtmProfile> findByUrlMappingId(UUID urlMappingId);
}
