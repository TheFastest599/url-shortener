package com.urlshortener.analytics.controller;


import com.urlshortener.analytics.dto.AnalyticsOverviewDto;
import com.urlshortener.analytics.dto.StatMetricDto;
import com.urlshortener.analytics.dto.TimeSeriesPoint;
import com.urlshortener.analytics.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * Complete Dashboard Overview (Total clicks, human/bot ratio, time-series graph, top countries, devices, browsers, referrers)
     */

    @GetMapping("/{shortCode}")
    public ResponseEntity<AnalyticsOverviewDto> getOverview(
            @PathVariable String shortCode,
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(defaultValue = "false") boolean includeBots
    ) {
        return ResponseEntity.ok(analyticsService.getOverview(shortCode, days, includeBots));
    }

    /**
     * Dedicated Time-Series Graph Data for Chart.js / Recharts / ApexCharts
     */
    @GetMapping("/{shortCode}/timeseries")
    public ResponseEntity<List<TimeSeriesPoint>> getTimeSeries(
            @PathVariable String shortCode,
            @RequestParam(defaultValue = "DAY") String interval,
            @RequestParam(defaultValue = "30") int days
    ) {
        return ResponseEntity.ok(analyticsService.getTimeSeries(shortCode, interval, days));
    }

    /**
     * Top Countries for Interactive World Map
     */

    @GetMapping("/{shortCode}/countries")
    public ResponseEntity<List<StatMetricDto>> getCountries(
            @PathVariable String shortCode,
            @RequestParam(defaultValue = "false") boolean includeBots,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(analyticsService.getCountries(shortCode, includeBots, limit));
    }

    /**
     * Browser Breakdown (Chrome, Safari, Firefox, Edge, etc.)
     */

    @GetMapping("/{shortCode}/browsers")
    public ResponseEntity<List<StatMetricDto>> getBrowsers(
            @PathVariable String shortCode,
            @RequestParam(defaultValue = "false") boolean includeBots,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(analyticsService.getBrowsers(shortCode, includeBots, limit));
    }

    /**
     * Traffic Channels & Referrers (Twitter, LinkedIn, Direct, etc.)
     */
    @GetMapping("/{shortCode}/referrers")
    public ResponseEntity<List<StatMetricDto>> getReferrers(
            @PathVariable String shortCode,
            @RequestParam(defaultValue = "false") boolean includeBots,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(analyticsService.getReferrers(shortCode, includeBots, limit));
    }

}
