package com.urlshortener.core.repository;

import com.urlshortener.core.dto.ShortUrlResponse;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.JSONB;
import org.jooq.Record;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static com.urlshortener.core.jooq.tables.AbTests.AB_TESTS;
import static com.urlshortener.core.jooq.tables.AbVariants.AB_VARIANTS;
import static com.urlshortener.core.jooq.tables.Campaigns.CAMPAIGNS;
import static com.urlshortener.core.jooq.tables.UrlMappings.URL_MAPPINGS;

@Repository
@RequiredArgsConstructor
public class UrlMappingQueryRepository {

    private final DSLContext dsl;

    public Page<ShortUrlResponse> searchUserUrls(
            UUID userId,
            String searchPattern,
            Boolean isActive,
            UUID campaignId,
            boolean unassignedOnly,
            Pageable pageable
    ) {
        Condition condition = URL_MAPPINGS.USER_ID.eq(userId);

        if (searchPattern != null && !searchPattern.isBlank()) {
            condition = condition.and(
                    URL_MAPPINGS.SHORT_CODE.likeIgnoreCase(searchPattern)
                            .or(URL_MAPPINGS.DESTINATION_URL.likeIgnoreCase(searchPattern))
            );
        }

        if (isActive != null) {
            condition = condition.and(URL_MAPPINGS.IS_ACTIVE.eq(isActive));
        }

        if (unassignedOnly) {
            condition = condition.and(URL_MAPPINGS.CAMPAIGN_ID.isNull());
        } else if (campaignId != null) {
            condition = condition.and(URL_MAPPINGS.CAMPAIGN_ID.eq(campaignId));
        }

        Long totalCount = dsl.selectCount()
                .from(URL_MAPPINGS)
                .where(condition)
                .fetchOne(0, Long.class);

        long total = totalCount != null ? totalCount : 0L;

        if (total == 0) {
            return new PageImpl<>(List.of(), pageable, 0);
        }

        List<ShortUrlResponse> results = dsl.select(
                URL_MAPPINGS.ID,
                URL_MAPPINGS.SHORT_CODE,
                URL_MAPPINGS.DESTINATION_URL,
                URL_MAPPINGS.CAMPAIGN_ID,
                CAMPAIGNS.NAME,
                URL_MAPPINGS.IS_AB_TEST,
                AB_TESTS.ID,
                AB_TESTS.NAME,
                AB_TESTS.STATUS,
                URL_MAPPINGS.SMART_RULES,
                URL_MAPPINGS.TENANT_ID,
                URL_MAPPINGS.USER_ID,
                URL_MAPPINGS.IS_ACTIVE,
                URL_MAPPINGS.EXPIRES_AT,
                URL_MAPPINGS.CREATED_AT,
                URL_MAPPINGS.UPDATED_AT
        )
                .from(URL_MAPPINGS)
                .leftJoin(CAMPAIGNS).on(URL_MAPPINGS.CAMPAIGN_ID.eq(CAMPAIGNS.ID))
                .leftJoin(AB_TESTS).on(AB_TESTS.URL_MAPPING_ID.eq(URL_MAPPINGS.ID))
                .where(condition)
                .orderBy(URL_MAPPINGS.CREATED_AT.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch(this::mapToShortUrlResponse);

        return new PageImpl<>(results, pageable, total);
    }

    public List<ShortUrlResponse> findUserUrlsWithDetails(UUID userId) {
        return dsl.select(
                URL_MAPPINGS.ID,
                URL_MAPPINGS.SHORT_CODE,
                URL_MAPPINGS.DESTINATION_URL,
                URL_MAPPINGS.CAMPAIGN_ID,
                CAMPAIGNS.NAME,
                URL_MAPPINGS.IS_AB_TEST,
                AB_TESTS.ID,
                AB_TESTS.NAME,
                AB_TESTS.STATUS,
                URL_MAPPINGS.SMART_RULES,
                URL_MAPPINGS.TENANT_ID,
                URL_MAPPINGS.USER_ID,
                URL_MAPPINGS.IS_ACTIVE,
                URL_MAPPINGS.EXPIRES_AT,
                URL_MAPPINGS.CREATED_AT,
                URL_MAPPINGS.UPDATED_AT
        )
                .from(URL_MAPPINGS)
                .leftJoin(CAMPAIGNS).on(URL_MAPPINGS.CAMPAIGN_ID.eq(CAMPAIGNS.ID))
                .leftJoin(AB_TESTS).on(AB_TESTS.URL_MAPPING_ID.eq(URL_MAPPINGS.ID))
                .where(URL_MAPPINGS.USER_ID.eq(userId))
                .orderBy(URL_MAPPINGS.CREATED_AT.desc())
                .fetch(this::mapToShortUrlResponse);
    }

    public Optional<ShortUrlResponse> findUserUrlWithDetails(UUID urlId, UUID userId) {
        Record r = dsl.select(
                URL_MAPPINGS.ID,
                URL_MAPPINGS.SHORT_CODE,
                URL_MAPPINGS.DESTINATION_URL,
                URL_MAPPINGS.CAMPAIGN_ID,
                CAMPAIGNS.NAME,
                URL_MAPPINGS.IS_AB_TEST,
                AB_TESTS.ID,
                AB_TESTS.NAME,
                AB_TESTS.STATUS,
                URL_MAPPINGS.SMART_RULES,
                URL_MAPPINGS.TENANT_ID,
                URL_MAPPINGS.USER_ID,
                URL_MAPPINGS.IS_ACTIVE,
                URL_MAPPINGS.EXPIRES_AT,
                URL_MAPPINGS.CREATED_AT,
                URL_MAPPINGS.UPDATED_AT
        )
                .from(URL_MAPPINGS)
                .leftJoin(CAMPAIGNS).on(URL_MAPPINGS.CAMPAIGN_ID.eq(CAMPAIGNS.ID))
                .leftJoin(AB_TESTS).on(AB_TESTS.URL_MAPPING_ID.eq(URL_MAPPINGS.ID))
                .where(URL_MAPPINGS.ID.eq(urlId).and(URL_MAPPINGS.USER_ID.eq(userId)))
                .fetchOne();

        return Optional.ofNullable(r).map(this::mapToShortUrlResponse);
    }

    public Optional<ShortUrlResponse> findByShortCodeWithDetails(String shortCode) {
        Record r = dsl.select(
                URL_MAPPINGS.ID,
                URL_MAPPINGS.SHORT_CODE,
                URL_MAPPINGS.DESTINATION_URL,
                URL_MAPPINGS.CAMPAIGN_ID,
                CAMPAIGNS.NAME,
                URL_MAPPINGS.IS_AB_TEST,
                AB_TESTS.ID,
                AB_TESTS.NAME,
                AB_TESTS.STATUS,
                URL_MAPPINGS.SMART_RULES,
                URL_MAPPINGS.TENANT_ID,
                URL_MAPPINGS.USER_ID,
                URL_MAPPINGS.IS_ACTIVE,
                URL_MAPPINGS.EXPIRES_AT,
                URL_MAPPINGS.CREATED_AT,
                URL_MAPPINGS.UPDATED_AT
        )
                .from(URL_MAPPINGS)
                .leftJoin(CAMPAIGNS).on(URL_MAPPINGS.CAMPAIGN_ID.eq(CAMPAIGNS.ID))
                .leftJoin(AB_TESTS).on(AB_TESTS.URL_MAPPING_ID.eq(URL_MAPPINGS.ID))
                .where(URL_MAPPINGS.SHORT_CODE.eq(shortCode))
                .fetchOne();

        return Optional.ofNullable(r).map(this::mapToShortUrlResponse);
    }

    public List<UrlResolutionProjection> findFullResolutionByShortCode(String shortCode) {
        return dsl.select(
                URL_MAPPINGS.SHORT_CODE,
                URL_MAPPINGS.DESTINATION_URL,
                URL_MAPPINGS.IS_ACTIVE,
                URL_MAPPINGS.IS_AB_TEST,
                URL_MAPPINGS.SMART_RULES,
                URL_MAPPINGS.ID,
                URL_MAPPINGS.CAMPAIGN_ID,
                AB_TESTS.ID,
                AB_TESTS.STATUS,
                AB_TESTS.WINNING_VARIANT,
                AB_TESTS.COOKIE_TTL_SECONDS,
                AB_VARIANTS.VARIANT_KEY,
                AB_VARIANTS.DESTINATION_URL,
                AB_VARIANTS.WEIGHT,
                AB_VARIANTS.IS_CONTROL
        )
                .from(URL_MAPPINGS)
                .leftJoin(AB_TESTS).on(AB_TESTS.URL_MAPPING_ID.eq(URL_MAPPINGS.ID))
                .leftJoin(AB_VARIANTS).on(AB_VARIANTS.AB_TEST_ID.eq(AB_TESTS.ID))
                .where(URL_MAPPINGS.SHORT_CODE.eq(shortCode))
                .fetch(this::mapToResolutionProjection);
    }

    private ShortUrlResponse mapToShortUrlResponse(Record r) {
        OffsetDateTime expiresAtOdt = r.get(URL_MAPPINGS.EXPIRES_AT);
        OffsetDateTime createdAtOdt = r.get(URL_MAPPINGS.CREATED_AT);
        OffsetDateTime updatedAtOdt = r.get(URL_MAPPINGS.UPDATED_AT);
        JSONB smartRulesJsonb = r.get(URL_MAPPINGS.SMART_RULES);

        return new ShortUrlResponse(
                r.get(URL_MAPPINGS.ID),
                r.get(URL_MAPPINGS.SHORT_CODE),
                r.get(URL_MAPPINGS.DESTINATION_URL),
                r.get(URL_MAPPINGS.CAMPAIGN_ID),
                r.get(CAMPAIGNS.NAME),
                r.get(URL_MAPPINGS.IS_AB_TEST),
                r.get(AB_TESTS.ID),
                r.get(AB_TESTS.NAME),
                r.get(AB_TESTS.STATUS),
                smartRulesJsonb != null ? smartRulesJsonb.data() : null,
                r.get(URL_MAPPINGS.TENANT_ID),
                r.get(URL_MAPPINGS.USER_ID),
                r.get(URL_MAPPINGS.IS_ACTIVE),
                expiresAtOdt != null ? expiresAtOdt.toInstant() : null,
                createdAtOdt != null ? createdAtOdt.toInstant() : null,
                updatedAtOdt != null ? updatedAtOdt.toInstant() : null
        );
    }

    private UrlResolutionProjection mapToResolutionProjection(Record r) {
        JSONB smartRulesJsonb = r.get(URL_MAPPINGS.SMART_RULES);
        return new UrlResolutionRecord(
                r.get(URL_MAPPINGS.SHORT_CODE),
                r.get(URL_MAPPINGS.DESTINATION_URL),
                r.get(URL_MAPPINGS.IS_ACTIVE),
                r.get(URL_MAPPINGS.IS_AB_TEST),
                smartRulesJsonb != null ? smartRulesJsonb.data() : null,
                r.get(URL_MAPPINGS.ID),
                r.get(URL_MAPPINGS.CAMPAIGN_ID),
                r.get(AB_TESTS.ID),
                r.get(AB_TESTS.STATUS),
                r.get(AB_TESTS.WINNING_VARIANT),
                r.get(AB_TESTS.COOKIE_TTL_SECONDS),
                r.get(AB_VARIANTS.VARIANT_KEY),
                r.get(AB_VARIANTS.DESTINATION_URL),
                r.get(AB_VARIANTS.WEIGHT),
                r.get(AB_VARIANTS.IS_CONTROL)
        );
    }
}
