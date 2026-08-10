package com.urlshortener.redirect.kafka;

import com.urlshortener.redirect.dto.ClickEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ClickEventProducer {
    private static final String TOPIC = "url-clicks";
    private final KafkaTemplate<String, ClickEvent> kafkaTemplate;


    public  void publishClickEvent(ClickEvent event) {
        kafkaTemplate.send(TOPIC, event.shortCode(), event);
    }
}
