package com.urlshortener.apigateway.entity;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table("refresh_tokens")
public class RefreshToken {

    @Id
    private UUID id;

    @Column("user_id")
    private UUID userId;

    private String token;

    @Column("expiry_date")
    private Instant expiryDate;

    private Boolean revoked;

    @Column("created_at")
    private Instant createdAt;


}
