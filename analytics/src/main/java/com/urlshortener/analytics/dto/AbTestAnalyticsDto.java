package com.urlshortener.analytics.dto;

import java.util.List;

public record AbTestAnalyticsDto(
        String identifier,
        long totalClicks,
        long humanClicks,
        long botClicks,
        double botPercentage,
        List<StatMetricDto> variantBreakdown,
        List<TimeSeriesPoint> timeSeries,
        List<StatMetricDto> topCountries,
        List<StatMetricDto> topBrowsers,
        List<StatMetricDto> topDevices,
        List<StatMetricDto> topReferrers
) {}
