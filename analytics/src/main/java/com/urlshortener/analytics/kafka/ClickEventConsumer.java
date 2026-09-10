package com.urlshortener.analytics.kafka;

import com.urlshortener.analytics.dto.ClickEvent;
import com.urlshortener.analytics.dto.GeoLocation;
import com.urlshortener.analytics.entity.ClickAnalytics;
import com.urlshortener.analytics.repository.ClickAnalyticsRepository;
import com.urlshortener.analytics.service.GeoIpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class ClickEventConsumer {
    private final ClickAnalyticsRepository repository;
    private final GeoIpService geoIpService;

    @KafkaListener(topics = "url-clicks", groupId = "analytics-group")
    public void consumeClickEvent(ClickEvent event) {
        if (event == null || event.shortCode() == null){
            return;
        }

        String ua = event.userAgent() != null ? event.userAgent() : "";
        String uaLower = ua.toLowerCase();

        // 1. Device Type Detection
        String device = "Desktop";
        if (uaLower.contains("mobi") || uaLower.contains("android") || uaLower.contains("iphone")){
            device = "Mobile";
        } else if (uaLower.contains("tablet") || uaLower.contains("ipad")) {
            device = "Tablet";
        }

        // 2. Browser Detection
        String browser = "Other";

        if (uaLower.contains("edg")) browser = "Edge";
        else if (uaLower.contains("chrome")) browser = "Chrome";
        else if (uaLower.contains("safari") && !uaLower.contains("chrome")) browser = "Safari";
        else if (uaLower.contains("firefox")) browser = "Firefox";
        else if (uaLower.contains("opera") || uaLower.contains("opr")) browser = "Opera";

        // 3. Operating System Detection
        String os = "Other";
        if (uaLower.contains("iphone") || uaLower.contains("ipad") || uaLower.contains("ios")) {
            os = "iOS";
        } else if (uaLower.contains("android")) {
            os = "Android";
        } else if (uaLower.contains("windows")) {
            os = "Windows";
        } else if (uaLower.contains("mac os") || uaLower.contains("macintosh")) {
            os = "macOS";
        } else if (uaLower.contains("linux")) {
            os = "Linux";
        }

        // 4. Bot Detection
        boolean isBot = uaLower.contains("bot") || uaLower.contains("crawler") || uaLower.contains("spider")
                || uaLower.contains("curl") || uaLower.contains("wget") || uaLower.contains("python");

        // 5. Clean Referrer Domain
        String cleanReferrer = event.referrer();
        if (cleanReferrer == null || cleanReferrer.isBlank()) {
            cleanReferrer = "Direct / None";
        }

        // 6. Exact MaxMind GeoIP Resolution (Country & City)
        GeoLocation location = geoIpService.resolve(event.ipAddress());

        ClickAnalytics analytics = ClickAnalytics.builder()
                .shortCode(event.shortCode())
                .timestamp(event.timestamp() != null ? event.timestamp() : Instant.now())
                .userAgent(ua)
                .deviceType(device)
                .browser(browser)
                .operatingSystem(os)
                .geoCountry(location.country())
                .geoCity(location.city())
                .referrer(cleanReferrer)
                .variant(event.variant())
                .utmSource(event.utmSource())
                .utmMedium(event.utmMedium())
                .utmCampaign(event.utmCampaign())
                .isBot(isBot)
                .build();

        repository.save(analytics);
        log.info("Logged click for [{}] | Country: [{}] | City: [{}] | Device: [{}] | Browser: [{}]", event.shortCode(), location.country(), location.city(), device, browser);
    }
}
