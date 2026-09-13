package com.urlshortener.analytics.dto;

import java.util.List;

public record CampaignAnalyticsDto(
        String campaignId,
        long totalClicks,
        long humanClicks,
        long botClicks,
        double botPercentage,
        List<TimeSeriesPoint> timeSeries,
        List<StatMetricDto> linkBreakdown,
        List<StatMetricDto> topCountries,
        List<CityStatDto> topCities,
        List<StatMetricDto> topBrowsers,
        List<StatMetricDto> topDevices,
        List<StatMetricDto> topReferrers,
        List<StatMetricDto> topUtmSources
) {}
