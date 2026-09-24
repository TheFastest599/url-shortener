package com.urlshortener.analytics.repository;

import com.urlshortener.analytics.repository.projection.CityStatProjection;
import com.urlshortener.analytics.repository.projection.CityStatRecord;
import com.urlshortener.analytics.repository.projection.StatProjection;
import com.urlshortener.analytics.repository.projection.StatRecord;
import com.urlshortener.analytics.repository.projection.TimeSeriesProjection;
import com.urlshortener.analytics.repository.projection.TimeSeriesRecord;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.SelectLimitStep;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import static com.urlshortener.analytics.jooq.tables.ClickAnalytics.CLICK_ANALYTICS;

@Repository
@RequiredArgsConstructor
public class ClickAnalyticsQueryRepository {

    private final DSLContext dsl;

    // ==========================================
    // BASIC COUNTS
    // ==========================================

    public long countByShortCode(String shortCode) {
        return countWhere(CLICK_ANALYTICS.SHORT_CODE.eq(shortCode));
    }

    public long countHumanClicksByShortCode(String shortCode) {
        return countWhere(CLICK_ANALYTICS.SHORT_CODE.eq(shortCode).and(CLICK_ANALYTICS.IS_BOT.isFalse()));
    }

    public long countBotClicksByShortCode(String shortCode) {
        return countWhere(CLICK_ANALYTICS.SHORT_CODE.eq(shortCode).and(CLICK_ANALYTICS.IS_BOT.isTrue()));
    }

    public long countByCampaignId(UUID campaignId) {
        return countWhere(CLICK_ANALYTICS.CAMPAIGN_ID.eq(campaignId));
    }

    public long countHumanClicksByCampaignId(UUID campaignId) {
        return countWhere(CLICK_ANALYTICS.CAMPAIGN_ID.eq(campaignId).and(CLICK_ANALYTICS.IS_BOT.isFalse()));
    }

    public long countBotClicksByCampaignId(UUID campaignId) {
        return countWhere(CLICK_ANALYTICS.CAMPAIGN_ID.eq(campaignId).and(CLICK_ANALYTICS.IS_BOT.isTrue()));
    }

    public long countByAbTestId(UUID abTestId) {
        return countWhere(CLICK_ANALYTICS.AB_TEST_ID.eq(abTestId));
    }

    public long countHumanClicksByAbTestId(UUID abTestId) {
        return countWhere(CLICK_ANALYTICS.AB_TEST_ID.eq(abTestId).and(CLICK_ANALYTICS.IS_BOT.isFalse()));
    }

    public long countBotClicksByAbTestId(UUID abTestId) {
        return countWhere(CLICK_ANALYTICS.AB_TEST_ID.eq(abTestId).and(CLICK_ANALYTICS.IS_BOT.isTrue()));
    }

    public long countByUrlId(UUID urlId) {
        return countWhere(CLICK_ANALYTICS.URL_ID.eq(urlId));
    }

    public long countHumanClicksByUrlId(UUID urlId) {
        return countWhere(CLICK_ANALYTICS.URL_ID.eq(urlId).and(CLICK_ANALYTICS.IS_BOT.isFalse()));
    }

    public long countBotClicksByUrlId(UUID urlId) {
        return countWhere(CLICK_ANALYTICS.URL_ID.eq(urlId).and(CLICK_ANALYTICS.IS_BOT.isTrue()));
    }

    private long countWhere(Condition condition) {
        Long count = dsl.selectCount()
                .from(CLICK_ANALYTICS)
                .where(condition)
                .fetchOne(0, Long.class);
        return count != null ? count : 0L;
    }

    // ==========================================
    // TIME SERIES QUERIES
    // ==========================================

    public List<TimeSeriesProjection> findHourlyTimeSeries(String shortCode, Instant since) {
        return findHourlyTimeSeries(CLICK_ANALYTICS.SHORT_CODE.eq(shortCode), since);
    }

    public List<TimeSeriesProjection> findDailyTimeSeries(String shortCode, Instant since) {
        return findDailyTimeSeries(CLICK_ANALYTICS.SHORT_CODE.eq(shortCode), since);
    }

    public List<TimeSeriesProjection> findHourlyTimeSeriesByCampaignId(UUID campaignId, Instant since) {
        return findHourlyTimeSeries(CLICK_ANALYTICS.CAMPAIGN_ID.eq(campaignId), since);
    }

    public List<TimeSeriesProjection> findHourlyTimeSeriesByAbTestId(UUID abTestId, Instant since) {
        return findHourlyTimeSeries(CLICK_ANALYTICS.AB_TEST_ID.eq(abTestId), since);
    }

    public List<TimeSeriesProjection> findHourlyTimeSeriesByUrlId(UUID urlId, Instant since) {
        return findHourlyTimeSeries(CLICK_ANALYTICS.URL_ID.eq(urlId), since);
    }

    public List<TimeSeriesProjection> findHourlyTimeSeries(Condition baseCondition, Instant since) {
        OffsetDateTime sinceOdt = since.atOffset(ZoneOffset.UTC);
        Field<String> labelField = DSL.field(
                "to_char(date_trunc('hour', timezone('UTC', {0})), 'YYYY-MM-DD\"T\"HH24:00:00\"Z\"')",
                String.class,
                CLICK_ANALYTICS.TIMESTAMP
        ).as("label");
        Field<?> hourTrunc = DSL.field("date_trunc('hour', timezone('UTC', {0}))", CLICK_ANALYTICS.TIMESTAMP);
        Field<Long> countField = DSL.count().cast(Long.class).as("count");

        return dsl.select(labelField, countField)
                .from(CLICK_ANALYTICS)
                .where(baseCondition.and(CLICK_ANALYTICS.TIMESTAMP.ge(sinceOdt)))
                .groupBy(hourTrunc)
                .orderBy(hourTrunc.asc())
                .fetch(r -> new TimeSeriesRecord(r.get(labelField), r.get(countField)));
    }

    public List<TimeSeriesProjection> findDailyTimeSeries(Condition baseCondition, Instant since) {
        OffsetDateTime sinceOdt = since.atOffset(ZoneOffset.UTC);
        Field<String> labelField = DSL.field(
                "to_char(date_trunc('day', {0}), 'YYYY-MM-DD\"T\"00:00:00\"Z\"')",
                String.class,
                CLICK_ANALYTICS.TIMESTAMP
        ).as("label");
        Field<?> dayTrunc = DSL.field("date_trunc('day', {0})", CLICK_ANALYTICS.TIMESTAMP);
        Field<Long> countField = DSL.count().cast(Long.class).as("count");

        return dsl.select(labelField, countField)
                .from(CLICK_ANALYTICS)
                .where(baseCondition.and(CLICK_ANALYTICS.TIMESTAMP.ge(sinceOdt)))
                .groupBy(dayTrunc)
                .orderBy(dayTrunc.asc())
                .fetch(r -> new TimeSeriesRecord(r.get(labelField), r.get(countField)));
    }

    // ==========================================
    // CATEGORICAL BREAKDOWN QUERIES (SHORT_CODE)
    // ==========================================

    public List<StatProjection> findTopCountries(String shortCode, boolean includeBots, int limit) {
        return findCategorical(CLICK_ANALYTICS.GEO_COUNTRY, "Unknown", botFilter(CLICK_ANALYTICS.SHORT_CODE.eq(shortCode), includeBots), limit);
    }

    public List<CityStatProjection> findTopCities(String shortCode, boolean includeBots, int limit) {
        return findCities(botFilter(CLICK_ANALYTICS.SHORT_CODE.eq(shortCode).and(CLICK_ANALYTICS.GEO_CITY.isNotNull()), includeBots), limit);
    }

    public List<StatProjection> findTopBrowsers(String shortCode, boolean includeBots, int limit) {
        return findCategorical(CLICK_ANALYTICS.BROWSER, "Other", botFilter(CLICK_ANALYTICS.SHORT_CODE.eq(shortCode), includeBots), limit);
    }

    public List<StatProjection> findTopOperatingSystems(String shortCode, boolean includeBots, int limit) {
        return findCategorical(CLICK_ANALYTICS.OPERATING_SYSTEM, "Other", botFilter(CLICK_ANALYTICS.SHORT_CODE.eq(shortCode), includeBots), limit);
    }

    public List<StatProjection> findTopDeviceTypes(String shortCode, boolean includeBots, int limit) {
        return findCategorical(CLICK_ANALYTICS.DEVICE_TYPE, "Desktop", botFilter(CLICK_ANALYTICS.SHORT_CODE.eq(shortCode), includeBots), limit);
    }

    public List<StatProjection> findTopReferrers(String shortCode, boolean includeBots, int limit) {
        return findCategorical(CLICK_ANALYTICS.REFERRER, "Direct / None", botFilter(CLICK_ANALYTICS.SHORT_CODE.eq(shortCode), includeBots), limit);
    }

    public List<StatProjection> findVariantBreakdown(String shortCode) {
        return findCategorical(CLICK_ANALYTICS.VARIANT, "Control", CLICK_ANALYTICS.SHORT_CODE.eq(shortCode).and(CLICK_ANALYTICS.VARIANT.isNotNull()), 0);
    }

    public List<StatProjection> findTopUtmSources(String shortCode, int limit) {
        return findCategorical(CLICK_ANALYTICS.UTM_SOURCE, "Direct", CLICK_ANALYTICS.SHORT_CODE.eq(shortCode).and(CLICK_ANALYTICS.UTM_SOURCE.isNotNull()), limit);
    }

    public List<StatProjection> findTopUtmCampaigns(String shortCode, int limit) {
        return findCategorical(CLICK_ANALYTICS.UTM_CAMPAIGN, "None", CLICK_ANALYTICS.SHORT_CODE.eq(shortCode).and(CLICK_ANALYTICS.UTM_CAMPAIGN.isNotNull()), limit);
    }

    public List<StatProjection> findTopUtmMediums(String shortCode, int limit) {
        return findCategorical(CLICK_ANALYTICS.UTM_MEDIUM, "None", CLICK_ANALYTICS.SHORT_CODE.eq(shortCode).and(CLICK_ANALYTICS.UTM_MEDIUM.isNotNull()), limit);
    }

    // ==========================================
    // CAMPAIGN ANALYTICS QUERIES (BY CAMPAIGN_ID)
    // ==========================================

    public List<StatProjection> findLinkBreakdownByCampaignId(UUID campaignId) {
        Field<String> nameField = CLICK_ANALYTICS.SHORT_CODE.as("name");
        Field<Long> countField = DSL.count().cast(Long.class).as("count");

        return dsl.select(nameField, countField)
                .from(CLICK_ANALYTICS)
                .where(CLICK_ANALYTICS.CAMPAIGN_ID.eq(campaignId))
                .groupBy(CLICK_ANALYTICS.SHORT_CODE)
                .orderBy(countField.desc())
                .fetch(r -> new StatRecord(r.get(nameField), r.get(countField)));
    }

    public List<StatProjection> findTopCountriesByCampaignId(UUID campaignId, boolean includeBots, int limit) {
        return findCategorical(CLICK_ANALYTICS.GEO_COUNTRY, "Unknown", botFilter(CLICK_ANALYTICS.CAMPAIGN_ID.eq(campaignId), includeBots), limit);
    }

    public List<CityStatProjection> findTopCitiesByCampaignId(UUID campaignId, boolean includeBots, int limit) {
        return findCities(botFilter(CLICK_ANALYTICS.CAMPAIGN_ID.eq(campaignId).and(CLICK_ANALYTICS.GEO_CITY.isNotNull()), includeBots), limit);
    }

    public List<StatProjection> findTopBrowsersByCampaignId(UUID campaignId, boolean includeBots, int limit) {
        return findCategorical(CLICK_ANALYTICS.BROWSER, "Other", botFilter(CLICK_ANALYTICS.CAMPAIGN_ID.eq(campaignId), includeBots), limit);
    }

    public List<StatProjection> findTopDeviceTypesByCampaignId(UUID campaignId, boolean includeBots, int limit) {
        return findCategorical(CLICK_ANALYTICS.DEVICE_TYPE, "Desktop", botFilter(CLICK_ANALYTICS.CAMPAIGN_ID.eq(campaignId), includeBots), limit);
    }

    public List<StatProjection> findTopReferrersByCampaignId(UUID campaignId, boolean includeBots, int limit) {
        return findCategorical(CLICK_ANALYTICS.REFERRER, "Direct / None", botFilter(CLICK_ANALYTICS.CAMPAIGN_ID.eq(campaignId), includeBots), limit);
    }

    public List<StatProjection> findTopUtmSourcesByCampaignId(UUID campaignId, int limit) {
        return findCategorical(CLICK_ANALYTICS.UTM_SOURCE, "Direct", CLICK_ANALYTICS.CAMPAIGN_ID.eq(campaignId).and(CLICK_ANALYTICS.UTM_SOURCE.isNotNull()), limit);
    }

    // ==========================================
    // A/B TEST ANALYTICS QUERIES (BY AB_TEST_ID)
    // ==========================================

    public List<StatProjection> findVariantBreakdownByAbTestId(UUID abTestId) {
        return findCategorical(CLICK_ANALYTICS.VARIANT, "Control", CLICK_ANALYTICS.AB_TEST_ID.eq(abTestId).and(CLICK_ANALYTICS.VARIANT.isNotNull()), 0);
    }

    public List<StatProjection> findTopCountriesByAbTestId(UUID abTestId, boolean includeBots, int limit) {
        return findCategorical(CLICK_ANALYTICS.GEO_COUNTRY, "Unknown", botFilter(CLICK_ANALYTICS.AB_TEST_ID.eq(abTestId), includeBots), limit);
    }

    public List<CityStatProjection> findTopCitiesByAbTestId(UUID abTestId, boolean includeBots, int limit) {
        return findCities(botFilter(CLICK_ANALYTICS.AB_TEST_ID.eq(abTestId).and(CLICK_ANALYTICS.GEO_CITY.isNotNull()), includeBots), limit);
    }

    public List<StatProjection> findTopBrowsersByAbTestId(UUID abTestId, boolean includeBots, int limit) {
        return findCategorical(CLICK_ANALYTICS.BROWSER, "Other", botFilter(CLICK_ANALYTICS.AB_TEST_ID.eq(abTestId), includeBots), limit);
    }

    public List<StatProjection> findTopDeviceTypesByAbTestId(UUID abTestId, boolean includeBots, int limit) {
        return findCategorical(CLICK_ANALYTICS.DEVICE_TYPE, "Desktop", botFilter(CLICK_ANALYTICS.AB_TEST_ID.eq(abTestId), includeBots), limit);
    }

    public List<StatProjection> findTopReferrersByAbTestId(UUID abTestId, boolean includeBots, int limit) {
        return findCategorical(CLICK_ANALYTICS.REFERRER, "Direct / None", botFilter(CLICK_ANALYTICS.AB_TEST_ID.eq(abTestId), includeBots), limit);
    }

    // ==========================================
    // URL ID ANALYTICS QUERIES (BY URL_ID)
    // ==========================================

    public List<StatProjection> findTopCountriesByUrlId(UUID urlId, boolean includeBots, int limit) {
        return findCategorical(CLICK_ANALYTICS.GEO_COUNTRY, "Unknown", botFilter(CLICK_ANALYTICS.URL_ID.eq(urlId), includeBots), limit);
    }

    public List<CityStatProjection> findTopCitiesByUrlId(UUID urlId, boolean includeBots, int limit) {
        return findCities(botFilter(CLICK_ANALYTICS.URL_ID.eq(urlId).and(CLICK_ANALYTICS.GEO_CITY.isNotNull()), includeBots), limit);
    }

    public List<StatProjection> findTopBrowsersByUrlId(UUID urlId, boolean includeBots, int limit) {
        return findCategorical(CLICK_ANALYTICS.BROWSER, "Other", botFilter(CLICK_ANALYTICS.URL_ID.eq(urlId), includeBots), limit);
    }

    public List<StatProjection> findTopOperatingSystemsByUrlId(UUID urlId, boolean includeBots, int limit) {
        return findCategorical(CLICK_ANALYTICS.OPERATING_SYSTEM, "Other", botFilter(CLICK_ANALYTICS.URL_ID.eq(urlId), includeBots), limit);
    }

    public List<StatProjection> findTopDeviceTypesByUrlId(UUID urlId, boolean includeBots, int limit) {
        return findCategorical(CLICK_ANALYTICS.DEVICE_TYPE, "Desktop", botFilter(CLICK_ANALYTICS.URL_ID.eq(urlId), includeBots), limit);
    }

    public List<StatProjection> findTopReferrersByUrlId(UUID urlId, boolean includeBots, int limit) {
        return findCategorical(CLICK_ANALYTICS.REFERRER, "Direct / None", botFilter(CLICK_ANALYTICS.URL_ID.eq(urlId), includeBots), limit);
    }

    public List<StatProjection> findVariantBreakdownByUrlId(UUID urlId) {
        return findCategorical(CLICK_ANALYTICS.VARIANT, "Control", CLICK_ANALYTICS.URL_ID.eq(urlId).and(CLICK_ANALYTICS.VARIANT.isNotNull()), 0);
    }

    public List<StatProjection> findTopUtmSourcesByUrlId(UUID urlId, int limit) {
        return findCategorical(CLICK_ANALYTICS.UTM_SOURCE, "Direct", CLICK_ANALYTICS.URL_ID.eq(urlId).and(CLICK_ANALYTICS.UTM_SOURCE.isNotNull()), limit);
    }

    public List<StatProjection> findTopUtmCampaignsByUrlId(UUID urlId, int limit) {
        return findCategorical(CLICK_ANALYTICS.UTM_CAMPAIGN, "None", CLICK_ANALYTICS.URL_ID.eq(urlId).and(CLICK_ANALYTICS.UTM_CAMPAIGN.isNotNull()), limit);
    }

    // ==========================================
    // REUSABLE QUERY BUILDERS
    // ==========================================

    private Condition botFilter(Condition base, boolean includeBots) {
        return includeBots ? base : base.and(CLICK_ANALYTICS.IS_BOT.isFalse());
    }

    private List<StatProjection> findCategorical(Field<String> field, String fallback, Condition condition, int limit) {
        Field<String> nameField = DSL.coalesce(field, fallback).as("name");
        Field<Long> countField = DSL.count().cast(Long.class).as("count");

        SelectLimitStep<?> query = dsl.select(nameField, countField)
                .from(CLICK_ANALYTICS)
                .where(condition)
                .groupBy(field)
                .orderBy(countField.desc());

        if (limit > 0) {
            return query.limit(limit).fetch(r -> new StatRecord(r.get(nameField), r.get(countField)));
        }
        return query.fetch(r -> new StatRecord(r.get(nameField), r.get(countField)));
    }

    private List<CityStatProjection> findCities(Condition condition, int limit) {
        Field<String> cityField = DSL.coalesce(CLICK_ANALYTICS.GEO_CITY, "Unknown").as("city");
        Field<String> countryField = DSL.coalesce(CLICK_ANALYTICS.GEO_COUNTRY, "Unknown").as("country");
        Field<Long> countField = DSL.count().cast(Long.class).as("count");

        return dsl.select(cityField, countryField, countField)
                .from(CLICK_ANALYTICS)
                .where(condition)
                .groupBy(CLICK_ANALYTICS.GEO_CITY, CLICK_ANALYTICS.GEO_COUNTRY)
                .orderBy(countField.desc())
                .limit(limit)
                .fetch(r -> new CityStatRecord(r.get(cityField), r.get(countryField), r.get(countField)));
    }
}
