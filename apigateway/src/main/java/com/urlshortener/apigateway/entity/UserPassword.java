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
@Table("user_passwords")
public class UserPassword {

    @Id
    private UUID id;

    @Column("user_id")
    private UUID userId;

    @Column("password_hash")
    private String passwordHash;

    @Column("updated_at")
    private Instant updatedAt;
}
