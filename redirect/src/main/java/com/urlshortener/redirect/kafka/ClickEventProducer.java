package com.urlshortener.redirect.kafka;

import com.urlshortener.redirect.dto.ClickEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/**
 * ClickEventProducer
 * Dispatches click telemetry events asynchronously to the 'url-clicks' Kafka topic.
 * Uses client-side memory batching (64 KB buffer / linger 10ms) and non-blocking
 * whenComplete callbacks to keep telemetry completely decoupled from the HTTP 302
 * redirect critical path.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ClickEventProducer {
    private static final String TOPIC = "url-clicks";
    private final KafkaTemplate<String, ClickEvent> kafkaTemplate;

    public void publishClickEvent(ClickEvent event) {
        try {
            kafkaTemplate.send(TOPIC, event.shortCode(), event).whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Kafka telemetry publishing failed for [{}]: {}", event.shortCode(), ex.getMessage());
                }
            });
        } catch (Exception e) {
            log.error("Failed to initiate Kafka event send for [{}]: {}", event.shortCode(), e.getMessage());
        }
    }
}
