package com.urlshortener.analytics.kafka;

import com.urlshortener.analytics.dto.ClickEvent;
import com.urlshortener.analytics.dto.GeoLocation;
import com.urlshortener.analytics.entity.ClickAnalytics;
import com.urlshortener.analytics.repository.ClickAnalyticsBatchRepository;
import com.urlshortener.analytics.service.GeoIpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class ClickEventConsumer {

    private final ClickAnalyticsBatchRepository batchRepository;
    private final GeoIpService geoIpService;

    @KafkaListener(
        topics = "${KAFKA_TOPIC_CLICKS:url-clicks}",
        groupId = "${spring.kafka.consumer.group-id:analytics-ingest-group}"
    )
    public void consumeBatch(List<ClickEvent> events, Acknowledgment ack) {
        if (events == null || events.isEmpty()) {
            if (ack != null) {
                ack.acknowledge();
            }
            return;
        }

        try {
            List<ClickAnalytics> records = events.stream()
                .filter(event -> event != null && event.shortCode() != null && !event.shortCode().isBlank())
                .map(this::mapToEntity)
                .toList();

            if (!records.isEmpty()) {
                batchRepository.bulkInsert(records);
                log.info("Batch processed [{}] click events out of [{}] received in poll", records.size(), events.size());
            }

            if (ack != null) {
                ack.acknowledge();
            }
        } catch (Exception e) {
            log.error("Failed to process click events batch of size [{}]: {}", events.size(), e.getMessage(), e);
            throw e;
        }
    }

    private ClickAnalytics mapToEntity(ClickEvent event) {
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

        return ClickAnalytics.builder()
                .id(UUID.randomUUID())
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
                .urlId(parseUuidSafe(event.urlId()))
                .campaignId(parseUuidSafe(event.campaignId()))
                .abTestId(parseUuidSafe(event.abTestId()))
                .build();
    }

    private UUID parseUuidSafe(String str) {
        if (str == null || str.isBlank()) return null;
        try {
            return UUID.fromString(str.trim());
        } catch (Exception e) {
            return null;
        }
    }
}
