package com.urlshortener.analytics.service;

import com.urlshortener.analytics.dto.AnalyticsOverviewDto;
import com.urlshortener.analytics.dto.CityStatDto;
import com.urlshortener.analytics.dto.StatMetricDto;
import com.urlshortener.analytics.dto.TimeSeriesPoint;
import com.urlshortener.analytics.repository.ClickAnalyticsRepository;
import com.urlshortener.analytics.repository.projection.CityStatProjection;
import com.urlshortener.analytics.repository.projection.StatProjection;
import com.urlshortener.analytics.repository.projection.TimeSeriesProjection;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ClickAnalyticsRepository repository;


    public AnalyticsOverviewDto getOverview(String shortCode, int days, boolean includeBots) {
        long totalClicks = repository.countByShortCode(shortCode);

        //Guard Clause : If zero clicks, return clean empty dashboard structure immediately
        if (totalClicks == 0){
            return new AnalyticsOverviewDto(
                    shortCode, 0, 0, 0, 0.0,
                    List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of()
            );
        }

        long humanClicks = repository.countHumanClicksByShortCode(shortCode);
        long botClicks = repository.countBotClicksByShortCode(shortCode);
        double botPercentage = Math.round(((double) botClicks / totalClicks) * 1000.0) / 10.0;

        long denominator = includeBots ? totalClicks : Math.max(humanClicks, 1);
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);

        // Fetch time-series (hourly if <= 2 days, daily if > 2 days)
        List<TimeSeriesPoint> timeSeries = days <= 2
                ? mapTimeSeries(repository.findHourlyTimeSeries(shortCode, since))
                : mapTimeSeries(repository.findDailyTimeSeries(shortCode, since));

        List<StatMetricDto> countries = mapMetrics(repository.findTopCountries(shortCode, includeBots, 10), denominator);
        List<CityStatDto> cities = mapCityMetrics(repository.findTopCities(shortCode, includeBots, 10), denominator);
        List<StatMetricDto> browsers = mapMetrics(repository.findTopBrowsers(shortCode, includeBots, 10), denominator);
        List<StatMetricDto> os = mapMetrics(repository.findTopOperatingSystems(shortCode, includeBots, 10), denominator);
        List<StatMetricDto> devices = mapMetrics(repository.findTopDeviceTypes(shortCode, includeBots, 10), denominator);
        List<StatMetricDto> referrers = mapMetrics(repository.findTopReferrers(shortCode, includeBots, 10), denominator);

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
                referrers
        );
    }

    public List<TimeSeriesPoint> getTimeSeries(String shortCode, String interval, int days) {
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);

        if ("HOUR".equalsIgnoreCase(interval)) {
            return mapTimeSeries(repository.findHourlyTimeSeries(shortCode, since));
        }
        return mapTimeSeries(repository.findDailyTimeSeries(shortCode, since));
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

    // -- Helper Methods --

    private List<TimeSeriesPoint> mapTimeSeries(List<TimeSeriesProjection> list) {
        return list.stream().map(
                p -> new TimeSeriesPoint(p.getLabel(), p.getCount())
        ).toList();
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
                    double pct = Math.round(((double) p.getCount() / denominator * 1000.0) / 10.0);
                    return new CityStatDto(p.getCity(), p.getCountry(), p.getCount(), pct);
                }).toList();
    }
}
