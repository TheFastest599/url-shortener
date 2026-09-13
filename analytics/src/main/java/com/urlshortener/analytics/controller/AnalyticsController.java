package com.urlshortener.analytics.controller;


import com.urlshortener.analytics.dto.AbTestAnalyticsDto;
import com.urlshortener.analytics.dto.AnalyticsOverviewDto;
import com.urlshortener.analytics.dto.CampaignAnalyticsDto;
import com.urlshortener.analytics.dto.StatMetricDto;
import com.urlshortener.analytics.dto.TimeSeriesPoint;
import com.urlshortener.analytics.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * Complete Dashboard Overview by Short Code (Total clicks, human/bot ratio, time-series graph, top countries, devices, browsers, referrers)
     */
    @GetMapping("/{shortCode}")
    public ResponseEntity<AnalyticsOverviewDto> getOverview(
            @PathVariable String shortCode,
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(required = false) String interval,
            @RequestParam(defaultValue = "UTC") String timezone,
            @RequestParam(defaultValue = "false") boolean includeBots
    ) {
        return ResponseEntity.ok(analyticsService.getOverview(shortCode, days, interval, timezone, includeBots));
    }

    /**
     * Complete Dashboard Overview by URL UUID
     */
    @GetMapping("/urls/{urlId}")
    public ResponseEntity<AnalyticsOverviewDto> getUrlOverviewById(
            @PathVariable UUID urlId,
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(required = false) String interval,
            @RequestParam(defaultValue = "UTC") String timezone,
            @RequestParam(defaultValue = "false") boolean includeBots
    ) {
        return ResponseEntity.ok(analyticsService.getUrlAnalyticsById(urlId, days, interval, timezone, includeBots));
    }

    /**
     * Dedicated Campaign-Level Aggregated Analytics by Campaign UUID
     */
    @GetMapping("/campaigns/{campaignId}")
    public ResponseEntity<CampaignAnalyticsDto> getCampaignAnalytics(
            @PathVariable UUID campaignId,
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(required = false) String interval,
            @RequestParam(defaultValue = "UTC") String timezone,
            @RequestParam(defaultValue = "false") boolean includeBots
    ) {
        return ResponseEntity.ok(analyticsService.getCampaignAnalytics(campaignId, days, interval, timezone, includeBots));
    }

    /**
     * Dedicated A/B Test Analytics (Supports either test UUID or shortCode)
     */
    @GetMapping("/ab-tests/{identifier}")
    public ResponseEntity<AbTestAnalyticsDto> getAbTestAnalytics(
            @PathVariable String identifier,
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(required = false) String interval,
            @RequestParam(defaultValue = "UTC") String timezone,
            @RequestParam(defaultValue = "false") boolean includeBots
    ) {
        try {
            UUID testUuid = UUID.fromString(identifier);
            return ResponseEntity.ok(analyticsService.getAbTestAnalytics(testUuid, days, interval, timezone, includeBots));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(analyticsService.getAbTestAnalyticsByCode(identifier, days, interval, timezone, includeBots));
        }
    }

    /**
     * Dedicated Time-Series Graph Data for Chart.js / Recharts / ApexCharts
     */
    @GetMapping("/{shortCode}/timeseries")
    public ResponseEntity<List<TimeSeriesPoint>> getTimeSeries(
            @PathVariable String shortCode,
            @RequestParam(defaultValue = "DAY") String interval,
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(defaultValue = "UTC") String timezone
    ) {
        return ResponseEntity.ok(analyticsService.getTimeSeries(shortCode, interval, days, timezone));
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
