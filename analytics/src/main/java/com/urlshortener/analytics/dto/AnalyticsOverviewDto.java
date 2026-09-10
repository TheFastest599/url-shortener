package com.urlshortener.analytics.dto;

import java.util.List;

public record AnalyticsOverviewDto(
        String shortCode,
        long totalClicks,
        long humanClicks,
        long botClicks,
        double botPercentage,
        List<TimeSeriesPoint> timeSeries,
        List<StatMetricDto> topCountries,
        List<CityStatDto> topCities,
        List<StatMetricDto> topBrowsers,
        List<StatMetricDto> topOperatingSystems,
        List<StatMetricDto> topDevices,
        List<StatMetricDto> topReferrers,
        List<StatMetricDto> variantBreakdown,
        List<StatMetricDto> topUtmSources,
        List<StatMetricDto> topUtmCampaigns
) {}
