package com.urlshortener.core.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ab_variants", indexes = {
        @Index(name = "idx_ab_variants_test_id", columnList = "ab_test_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AbVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "ab_test_id", nullable = false)
    private UUID abTestId;

    @Column(name = "variant_key", nullable = false, length = 10)
    private String variantKey; // 'A', 'B', 'C'

    @Column(name = "destination_url", nullable = false, columnDefinition = "TEXT")
    private String destinationUrl;

    @Column(name = "weight", nullable = false)
    @Builder.Default
    private Integer weight = 50;

    @Column(name = "is_control", nullable = false)
    @Builder.Default
    private Boolean isControl = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (weight == null) weight = 50;
        if (isControl == null) isControl = false;
    }
}
