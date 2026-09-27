package com.urlshortener.analytics.service;

import com.urlshortener.analytics.dto.AbTestAnalyticsDto;
import com.urlshortener.analytics.dto.AnalyticsOverviewDto;
import com.urlshortener.analytics.dto.CampaignAnalyticsDto;
import com.urlshortener.analytics.dto.CityStatDto;
import com.urlshortener.analytics.dto.StatMetricDto;
import com.urlshortener.analytics.dto.TimeSeriesPoint;
import com.urlshortener.analytics.repository.ClickAnalyticsQueryRepository;
import com.urlshortener.analytics.repository.projection.CityStatProjection;
import com.urlshortener.analytics.repository.projection.StatProjection;
import com.urlshortener.analytics.repository.projection.TimeSeriesProjection;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ClickAnalyticsQueryRepository repository;

    public AnalyticsOverviewDto getOverview(String shortCode, int days, boolean includeBots) {
        return getOverview(shortCode, days, null, "UTC", includeBots);
    }

    public AnalyticsOverviewDto getOverview(String shortCode, int days, String interval, String timezone, boolean includeBots) {
        long totalClicks = repository.countByShortCode(shortCode);
        Instant now = Instant.now();
        ZoneId zone = parseZoneId(timezone);
        ZonedDateTime localNow = now.atZone(zone);
        ZonedDateTime localSince = days <= 2
                ? localNow.minusHours(days * 24L)
                : localNow.minusDays(days).truncatedTo(ChronoUnit.DAYS);
        Instant since = localSince.toInstant();

        boolean isHourly = interval != null
                ? "HOUR".equalsIgnoreCase(interval)
                : days <= 2;

        if (totalClicks == 0) {
            List<TimeSeriesPoint> zeroSeries = buildTimeSeries(List.of(), since, now, zone, isHourly);
            return new AnalyticsOverviewDto(
                    shortCode, 0, 0, 0, 0.0,
                    zeroSeries, List.of(), List.of(), List.of(), List.of(), List.of(), List.of(),
                    List.of(), List.of(), List.of()
            );
        }

        long humanClicks = repository.countHumanClicksByShortCode(shortCode);
        long botClicks = repository.countBotClicksByShortCode(shortCode);
        double botPercentage = Math.round(((double) botClicks / totalClicks) * 1000.0) / 10.0;

        long denominator = includeBots ? totalClicks : Math.max(humanClicks, 1);

        // Fetch hourly buckets from DB and aggregate into user's timezone
        List<TimeSeriesProjection> rawHourly = repository.findHourlyTimeSeries(shortCode, since);
        List<TimeSeriesPoint> timeSeries = buildTimeSeries(rawHourly, since, now, zone, isHourly);

        List<StatMetricDto> countries = mapMetrics(repository.findTopCountries(shortCode, includeBots, 10), denominator);
        List<CityStatDto> cities = mapCityMetrics(repository.findTopCities(shortCode, includeBots, 10), denominator);
        List<StatMetricDto> browsers = mapMetrics(repository.findTopBrowsers(shortCode, includeBots, 10), denominator);
        List<StatMetricDto> os = mapMetrics(repository.findTopOperatingSystems(shortCode, includeBots, 10), denominator);
        List<StatMetricDto> devices = mapMetrics(repository.findTopDeviceTypes(shortCode, includeBots, 10), denominator);
        List<StatMetricDto> referrers = mapMetrics(repository.findTopReferrers(shortCode, includeBots, 10), denominator);
        List<StatMetricDto> variants = mapMetrics(repository.findVariantBreakdown(shortCode), denominator);
        List<StatMetricDto> utmSources = mapMetrics(repository.findTopUtmSources(shortCode, 10), denominator);
        List<StatMetricDto> utmCampaigns = mapMetrics(repository.findTopUtmCampaigns(shortCode, 10), denominator);

        return new AnalyticsOverviewDto(
                shortCode,
                totalClicks,
                humanClicks,
                botClicks,
                botPercentage,
                timeSeries,
                countries,
                cities,
                browsers,
                os,
                devices,
                referrers,
                variants,
                utmSources,
                utmCampaigns
        );
    }

    public List<TimeSeriesPoint> getTimeSeries(String shortCode, String interval, int days, String timezone) {
        Instant now = Instant.now();
        ZoneId zone = parseZoneId(timezone);
        ZonedDateTime localNow = now.atZone(zone);
        ZonedDateTime localSince = days <= 2
                ? localNow.minusHours(days * 24L)
                : localNow.minusDays(days).truncatedTo(ChronoUnit.DAYS);
        Instant since = localSince.toInstant();
        boolean isHourly = "HOUR".equalsIgnoreCase(interval) || days <= 2;

        List<TimeSeriesProjection> rawHourly = repository.findHourlyTimeSeries(shortCode, since);
        return buildTimeSeries(rawHourly, since, now, zone, isHourly);
    }

    public List<StatMetricDto> getCountries(String shortCode, boolean includeBots, int limit) {
        long total = repository.countByShortCode(shortCode);
        if (total == 0) return List.of();
        return mapMetrics(repository.findTopCountries(shortCode, includeBots, limit), total);
    }

    public List<StatMetricDto> getBrowsers(String shortCode, boolean includeBots, int limit) {
        long total = repository.countByShortCode(shortCode);
        if (total == 0) return List.of();
        return mapMetrics(repository.findTopBrowsers(shortCode, includeBots, limit), total);
    }

    public List<StatMetricDto> getReferrers(String shortCode, boolean includeBots, int limit) {
        long total = repository.countByShortCode(shortCode);
        if (total == 0) return List.of();
        return mapMetrics(repository.findTopReferrers(shortCode, includeBots, limit), total);
    }

    // ==========================================
    // CAMPAIGN ANALYTICS (BY CAMPAIGN_ID)
    // ==========================================

    public CampaignAnalyticsDto getCampaignAnalytics(UUID campaignId, int days, String interval, String timezone, boolean includeBots) {
        long totalClicks = repository.countByCampaignId(campaignId);
        Instant now = Instant.now();
        ZoneId zone = parseZoneId(timezone);
        ZonedDateTime localNow = now.atZone(zone);
        ZonedDateTime localSince = days <= 2
                ? localNow.minusHours(days * 24L)
                : localNow.minusDays(days).truncatedTo(ChronoUnit.DAYS);
        Instant since = localSince.toInstant();

        boolean isHourly = interval != null
                ? "HOUR".equalsIgnoreCase(interval)
                : days <= 2;

        if (totalClicks == 0) {
            List<TimeSeriesPoint> zeroSeries = buildTimeSeries(List.of(), since, now, zone, isHourly);
            return new CampaignAnalyticsDto(
                    campaignId.toString(), 0, 0, 0, 0.0,
                    zeroSeries, List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of()
            );
        }

        long humanClicks = repository.countHumanClicksByCampaignId(campaignId);
        long botClicks = repository.countBotClicksByCampaignId(campaignId);
        double botPercentage = Math.round(((double) botClicks / totalClicks) * 1000.0) / 10.0;
        long denominator = includeBots ? totalClicks : Math.max(humanClicks, 1);

        List<TimeSeriesProjection> rawHourly = repository.findHourlyTimeSeriesByCampaignId(campaignId, since);
        List<TimeSeriesPoint> timeSeries = buildTimeSeries(rawHourly, since, now, zone, isHourly);

        List<StatMetricDto> linkBreakdown = mapMetrics(repository.findLinkBreakdownByCampaignId(campaignId), totalClicks);
        List<StatMetricDto> countries = mapMetrics(repository.findTopCountriesByCampaignId(campaignId, includeBots, 10), denominator);
        List<CityStatDto> cities = mapCityMetrics(repository.findTopCitiesByCampaignId(campaignId, includeBots, 10), denominator);
        List<StatMetricDto> browsers = mapMetrics(repository.findTopBrowsersByCampaignId(campaignId, includeBots, 10), denominator);
        List<StatMetricDto> devices = mapMetrics(repository.findTopDeviceTypesByCampaignId(campaignId, includeBots, 10), denominator);
        List<StatMetricDto> referrers = mapMetrics(repository.findTopReferrersByCampaignId(campaignId, includeBots, 10), denominator);
        List<StatMetricDto> utmSources = mapMetrics(repository.findTopUtmSourcesByCampaignId(campaignId, 10), denominator);

        return new CampaignAnalyticsDto(
                campaignId.toString(),
                totalClicks,
                humanClicks,
                botClicks,
                botPercentage,
                timeSeries,
                linkBreakdown,
                countries,
                cities,
                browsers,
                devices,
                referrers,
                utmSources
        );
    }

    // ==========================================
    // A/B TEST ANALYTICS (BY AB_TEST_ID & SHORTCODE)
    // ==========================================

    public AbTestAnalyticsDto getAbTestAnalytics(UUID abTestId, int days, String interval, String timezone, boolean includeBots) {
        long totalClicks = repository.countByAbTestId(abTestId);
        Instant now = Instant.now();
        ZoneId zone = parseZoneId(timezone);
        ZonedDateTime localNow = now.atZone(zone);
        ZonedDateTime localSince = days <= 2
                ? localNow.minusHours(days * 24L)
                : localNow.minusDays(days).truncatedTo(ChronoUnit.DAYS);
        Instant since = localSince.toInstant();

        boolean isHourly = interval != null
                ? "HOUR".equalsIgnoreCase(interval)
                : days <= 2;

        if (totalClicks == 0) {
            List<TimeSeriesPoint> zeroSeries = buildTimeSeries(List.of(), since, now, zone, isHourly);
            return new AbTestAnalyticsDto(
                    abTestId.toString(), 0, 0, 0, 0.0,
                    List.of(), zeroSeries, List.of(), List.of(), List.of(), List.of()
            );
        }

        long humanClicks = repository.countHumanClicksByAbTestId(abTestId);
        long botClicks = repository.countBotClicksByAbTestId(abTestId);
        double botPercentage = Math.round(((double) botClicks / totalClicks) * 1000.0) / 10.0;
        long denominator = includeBots ? totalClicks : Math.max(humanClicks, 1);

        List<TimeSeriesProjection> rawHourly = repository.findHourlyTimeSeriesByAbTestId(abTestId, since);
        List<TimeSeriesPoint> timeSeries = buildTimeSeries(rawHourly, since, now, zone, isHourly);

        List<StatMetricDto> variants = mapMetrics(repository.findVariantBreakdownByAbTestId(abTestId), denominator);
        List<StatMetricDto> countries = mapMetrics(repository.findTopCountriesByAbTestId(abTestId, includeBots, 10), denominator);
        List<StatMetricDto> browsers = mapMetrics(repository.findTopBrowsersByAbTestId(abTestId, includeBots, 10), denominator);
        List<StatMetricDto> devices = mapMetrics(repository.findTopDeviceTypesByAbTestId(abTestId, includeBots, 10), denominator);
        List<StatMetricDto> referrers = mapMetrics(repository.findTopReferrersByAbTestId(abTestId, includeBots, 10), denominator);

        return new AbTestAnalyticsDto(
                abTestId.toString(),
                totalClicks,
                humanClicks,
                botClicks,
                botPercentage,
                variants,
                timeSeries,
                countries,
                browsers,
                devices,
                referrers
        );
    }

    public AbTestAnalyticsDto getAbTestAnalyticsByCode(String shortCode, int days, String interval, String timezone, boolean includeBots) {
        long totalClicks = repository.countByShortCode(shortCode);
        Instant now = Instant.now();
        ZoneId zone = parseZoneId(timezone);
        ZonedDateTime localNow = now.atZone(zone);
        ZonedDateTime localSince = days <= 2
                ? localNow.minusHours(days * 24L)
                : localNow.minusDays(days).truncatedTo(ChronoUnit.DAYS);
        Instant since = localSince.toInstant();

        boolean isHourly = interval != null
                ? "HOUR".equalsIgnoreCase(interval)
                : days <= 2;

        if (totalClicks == 0) {
            List<TimeSeriesPoint> zeroSeries = buildTimeSeries(List.of(), since, now, zone, isHourly);
            return new AbTestAnalyticsDto(
                    shortCode, 0, 0, 0, 0.0,
                    List.of(), zeroSeries, List.of(), List.of(), List.of(), List.of()
            );
        }

        long humanClicks = repository.countHumanClicksByShortCode(shortCode);
        long botClicks = repository.countBotClicksByShortCode(shortCode);
        double botPercentage = Math.round(((double) botClicks / totalClicks) * 1000.0) / 10.0;
        long denominator = includeBots ? totalClicks : Math.max(humanClicks, 1);

        List<TimeSeriesProjection> rawHourly = repository.findHourlyTimeSeries(shortCode, since);
        List<TimeSeriesPoint> timeSeries = buildTimeSeries(rawHourly, since, now, zone, isHourly);

        List<StatMetricDto> variants = mapMetrics(repository.findVariantBreakdown(shortCode), denominator);
        List<StatMetricDto> countries = mapMetrics(repository.findTopCountries(shortCode, includeBots, 10), denominator);
        List<StatMetricDto> browsers = mapMetrics(repository.findTopBrowsers(shortCode, includeBots, 10), denominator);
        List<StatMetricDto> devices = mapMetrics(repository.findTopDeviceTypes(shortCode, includeBots, 10), denominator);
        List<StatMetricDto> referrers = mapMetrics(repository.findTopReferrers(shortCode, includeBots, 10), denominator);

        return new AbTestAnalyticsDto(
                shortCode,
                totalClicks,
                humanClicks,
                botClicks,
                botPercentage,
                variants,
                timeSeries,
                countries,
                browsers,
                devices,
                referrers
        );
    }

    // ==========================================
    // URL ANALYTICS (BY URL_ID)
    // ==========================================

    public AnalyticsOverviewDto getUrlAnalyticsById(UUID urlId, int days, String interval, String timezone, boolean includeBots) {
        long totalClicks = repository.countByUrlId(urlId);
        Instant now = Instant.now();
        ZoneId zone = parseZoneId(timezone);
        ZonedDateTime localNow = now.atZone(zone);
        ZonedDateTime localSince = days <= 2
                ? localNow.minusHours(days * 24L)
                : localNow.minusDays(days).truncatedTo(ChronoUnit.DAYS);
        Instant since = localSince.toInstant();

        boolean isHourly = interval != null
                ? "HOUR".equalsIgnoreCase(interval)
                : days <= 2;

        if (totalClicks == 0) {
            List<TimeSeriesPoint> zeroSeries = buildTimeSeries(List.of(), since, now, zone, isHourly);
            return new AnalyticsOverviewDto(
                    urlId.toString(), 0, 0, 0, 0.0,
                    zeroSeries, List.of(), List.of(), List.of(), List.of(), List.of(), List.of(),
                    List.of(), List.of(), List.of()
            );
        }

        long humanClicks = repository.countHumanClicksByUrlId(urlId);
        long botClicks = repository.countBotClicksByUrlId(urlId);
        double botPercentage = Math.round(((double) botClicks / totalClicks) * 1000.0) / 10.0;
        long denominator = includeBots ? totalClicks : Math.max(humanClicks, 1);

        List<TimeSeriesProjection> rawHourly = repository.findHourlyTimeSeriesByUrlId(urlId, since);
        List<TimeSeriesPoint> timeSeries = buildTimeSeries(rawHourly, since, now, zone, isHourly);

        List<StatMetricDto> countries = mapMetrics(repository.findTopCountriesByUrlId(urlId, includeBots, 10), denominator);
        List<CityStatDto> cities = mapCityMetrics(repository.findTopCitiesByUrlId(urlId, includeBots, 10), denominator);
        List<StatMetricDto> browsers = mapMetrics(repository.findTopBrowsersByUrlId(urlId, includeBots, 10), denominator);
        List<StatMetricDto> os = mapMetrics(repository.findTopOperatingSystemsByUrlId(urlId, includeBots, 10), denominator);
        List<StatMetricDto> devices = mapMetrics(repository.findTopDeviceTypesByUrlId(urlId, includeBots, 10), denominator);
        List<StatMetricDto> referrers = mapMetrics(repository.findTopReferrersByUrlId(urlId, includeBots, 10), denominator);
        List<StatMetricDto> variants = mapMetrics(repository.findVariantBreakdownByUrlId(urlId), denominator);
        List<StatMetricDto> utmSources = mapMetrics(repository.findTopUtmSourcesByUrlId(urlId, 10), denominator);
        List<StatMetricDto> utmCampaigns = mapMetrics(repository.findTopUtmCampaignsByUrlId(urlId, 10), denominator);

        return new AnalyticsOverviewDto(
                urlId.toString(),
                totalClicks,
                humanClicks,
                botClicks,
                botPercentage,
                timeSeries,
                countries,
                cities,
                browsers,
                os,
                devices,
                referrers,
                variants,
                utmSources,
                utmCampaigns
        );
    }

    // -- Helper Methods --

    private ZoneId parseZoneId(String tzStr) {
        if (tzStr == null || tzStr.isBlank()) {
            return ZoneOffset.UTC;
        }
        try {
            return ZoneId.of(tzStr);
        } catch (Exception e) {
            return ZoneOffset.UTC;
        }
    }

    private List<TimeSeriesPoint> buildTimeSeries(
            List<TimeSeriesProjection> rawHourly,
            Instant since,
            Instant now,
            ZoneId zone,
            boolean isHourly
    ) {
        Map<ZonedDateTime, Long> localHourMap = new HashMap<>();
        if (rawHourly != null) {
            for (TimeSeriesProjection p : rawHourly) {
                if (p != null && p.getLabel() != null) {
                    try {
                        Instant instant = Instant.parse(p.getLabel());
                        ZonedDateTime localHour = instant.atZone(zone).truncatedTo(ChronoUnit.HOURS);
                        localHourMap.put(localHour, localHourMap.getOrDefault(localHour, 0L) + p.getCount());
                    } catch (Exception ignored) {
                    }
                }
            }
        }

        List<TimeSeriesPoint> result = new ArrayList<>();

        if (isHourly) {
            ZonedDateTime current = since.atZone(zone).truncatedTo(ChronoUnit.HOURS);
            ZonedDateTime end = now.atZone(zone).truncatedTo(ChronoUnit.HOURS);
            DateTimeFormatter formatter = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

            while (!current.isAfter(end)) {
                long count = localHourMap.getOrDefault(current, 0L);
                result.add(new TimeSeriesPoint(current.format(formatter), count));
                current = current.plusHours(1);
            }
        } else {
            ZonedDateTime currentDay = since.atZone(zone).truncatedTo(ChronoUnit.DAYS);
            ZonedDateTime endDay = now.atZone(zone).truncatedTo(ChronoUnit.DAYS);
            DateTimeFormatter formatter = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

            while (!currentDay.isAfter(endDay)) {
                java.time.LocalDate targetDate = currentDay.toLocalDate();

                long dayClicks = 0;
                for (Map.Entry<ZonedDateTime, Long> entry : localHourMap.entrySet()) {
                    if (entry.getKey().toLocalDate().equals(targetDate)) {
                        dayClicks += entry.getValue();
                    }
                }
                result.add(new TimeSeriesPoint(currentDay.format(formatter), dayClicks));
                currentDay = currentDay.plusDays(1);
            }
        }

        return result;
    }

    private List<StatMetricDto> mapMetrics(List<StatProjection> list, long denominator) {
        return list.stream()
                .map(p -> {
                    double pct = Math.round(((double) p.getCount() / denominator) * 1000) / 10.0;
                    return new StatMetricDto(p.getName(), p.getCount(), pct);
                })
                .toList();
    }

    private List<CityStatDto> mapCityMetrics(List<CityStatProjection> list, long denominator) {
        return list.stream()
                .map(p -> {
                    double pct = Math.round(((double) p.getCount() / denominator) * 1000.0) / 10.0;
                    return new CityStatDto(p.getCity(), p.getCountry(), p.getCount(), pct);
                }).toList();
    }
}
