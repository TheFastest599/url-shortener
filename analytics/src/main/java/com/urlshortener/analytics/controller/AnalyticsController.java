package com.urlshortener.analytics.controller;

import com.urlshortener.analytics.dto.AbTestAnalyticsDto;
import com.urlshortener.analytics.dto.AnalyticsOverviewDto;
import com.urlshortener.analytics.dto.CampaignAnalyticsDto;
import com.urlshortener.analytics.dto.StatMetricDto;
import com.urlshortener.analytics.dto.TimeSeriesPoint;
import com.urlshortener.analytics.service.AnalyticsService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
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
@Validated
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * Complete Dashboard Overview by Short Code (Total clicks, human/bot ratio, time-series graph, top countries, devices, browsers, referrers)
     */
    @GetMapping("/{shortCode}")
    public ResponseEntity<AnalyticsOverviewDto> getOverview(
            @PathVariable @NotBlank @Size(max = 10, message = "Short code cannot exceed 10 characters") String shortCode,
            @RequestParam(defaultValue = "30") @Min(value = 1, message = "Days must be at least 1") @Max(value = 365, message = "Days cannot exceed 365") int days,
            @RequestParam(required = false) @Pattern(regexp = "^$|^(?i)(HOUR|DAY|WEEK|MONTH)$", message = "Interval must be HOUR, DAY, WEEK, or MONTH") String interval,
            @RequestParam(defaultValue = "UTC") @Size(max = 50, message = "Timezone string too long") String timezone,
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
            @RequestParam(defaultValue = "30") @Min(value = 1, message = "Days must be at least 1") @Max(value = 365, message = "Days cannot exceed 365") int days,
            @RequestParam(required = false) @Pattern(regexp = "^$|^(?i)(HOUR|DAY|WEEK|MONTH)$", message = "Interval must be HOUR, DAY, WEEK, or MONTH") String interval,
            @RequestParam(defaultValue = "UTC") @Size(max = 50, message = "Timezone string too long") String timezone,
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
            @RequestParam(defaultValue = "30") @Min(value = 1, message = "Days must be at least 1") @Max(value = 365, message = "Days cannot exceed 365") int days,
            @RequestParam(required = false) @Pattern(regexp = "^$|^(?i)(HOUR|DAY|WEEK|MONTH)$", message = "Interval must be HOUR, DAY, WEEK, or MONTH") String interval,
            @RequestParam(defaultValue = "UTC") @Size(max = 50, message = "Timezone string too long") String timezone,
            @RequestParam(defaultValue = "false") boolean includeBots
    ) {
        return ResponseEntity.ok(analyticsService.getCampaignAnalytics(campaignId, days, interval, timezone, includeBots));
    }

    /**
     * Dedicated A/B Test Analytics (Supports either test UUID or shortCode)
     */
    @GetMapping("/ab-tests/{identifier}")
    public ResponseEntity<AbTestAnalyticsDto> getAbTestAnalytics(
            @PathVariable @NotBlank @Size(min = 1, max = 36, message = "Identifier must be between 1 and 36 characters") String identifier,
            @RequestParam(defaultValue = "30") @Min(value = 1, message = "Days must be at least 1") @Max(value = 365, message = "Days cannot exceed 365") int days,
            @RequestParam(required = false) @Pattern(regexp = "^$|^(?i)(HOUR|DAY|WEEK|MONTH)$", message = "Interval must be HOUR, DAY, WEEK, or MONTH") String interval,
            @RequestParam(defaultValue = "UTC") @Size(max = 50, message = "Timezone string too long") String timezone,
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
            @PathVariable @NotBlank @Size(max = 10, message = "Short code cannot exceed 10 characters") String shortCode,
            @RequestParam(defaultValue = "DAY") @Pattern(regexp = "^(?i)(HOUR|DAY|WEEK|MONTH)$", message = "Interval must be HOUR, DAY, WEEK, or MONTH") String interval,
            @RequestParam(defaultValue = "30") @Min(value = 1, message = "Days must be at least 1") @Max(value = 365, message = "Days cannot exceed 365") int days,
            @RequestParam(defaultValue = "UTC") @Size(max = 50, message = "Timezone string too long") String timezone
    ) {
        return ResponseEntity.ok(analyticsService.getTimeSeries(shortCode, interval, days, timezone));
    }

    /**
     * Top Countries for Interactive World Map
     */
    @GetMapping("/{shortCode}/countries")
    public ResponseEntity<List<StatMetricDto>> getCountries(
            @PathVariable @NotBlank @Size(max = 10, message = "Short code cannot exceed 10 characters") String shortCode,
            @RequestParam(defaultValue = "false") boolean includeBots,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Limit must be at least 1") @Max(value = 100, message = "Limit cannot exceed 100") int limit
    ) {
        return ResponseEntity.ok(analyticsService.getCountries(shortCode, includeBots, limit));
    }

    /**
     * Browser Breakdown (Chrome, Safari, Firefox, Edge, etc.)
     */
    @GetMapping("/{shortCode}/browsers")
    public ResponseEntity<List<StatMetricDto>> getBrowsers(
            @PathVariable @NotBlank @Size(max = 10, message = "Short code cannot exceed 10 characters") String shortCode,
            @RequestParam(defaultValue = "false") boolean includeBots,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Limit must be at least 1") @Max(value = 100, message = "Limit cannot exceed 100") int limit
    ) {
        return ResponseEntity.ok(analyticsService.getBrowsers(shortCode, includeBots, limit));
    }

    /**
     * Traffic Channels & Referrers (Twitter, LinkedIn, Direct, etc.)
     */
    @GetMapping("/{shortCode}/referrers")
    public ResponseEntity<List<StatMetricDto>> getReferrers(
            @PathVariable @NotBlank @Size(max = 10, message = "Short code cannot exceed 10 characters") String shortCode,
            @RequestParam(defaultValue = "false") boolean includeBots,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Limit must be at least 1") @Max(value = 100, message = "Limit cannot exceed 100") int limit
    ) {
        return ResponseEntity.ok(analyticsService.getReferrers(shortCode, includeBots, limit));
    }
}
