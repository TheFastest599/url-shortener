package com.urlshortener.core.repository;

import com.urlshortener.core.entity.AbVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AbVariantRepository extends JpaRepository<AbVariant, UUID> {
    List<AbVariant> findByAbTestId(UUID abTestId);
    void deleteByAbTestId(UUID abTestId);
}
