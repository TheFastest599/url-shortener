package com.urlshortener.analytics.service;


import com.maxmind.geoip2.DatabaseReader;
import com.maxmind.geoip2.model.CityResponse;
import com.urlshortener.analytics.dto.GeoLocation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.InputStream;
import java.net.InetAddress;

@Slf4j
@Service
public class GeoIpService {

    private DatabaseReader databaseReader;

    @PostConstruct
    public void init() {
        try {
            ClassPathResource resource = new ClassPathResource("geoip/GeoLite2-City.mmdb");
            if (resource.exists()) {
                try (InputStream inputStream = resource.getInputStream()) {
                    this.databaseReader = new DatabaseReader.Builder(inputStream).build();
                    log.info("MaxMind GeoLite2  Database loaded successfully.");
                }
            } else {
                log.warn("GeoLite2-City.mmdb not found in classpath. GeoIP lookups will use default fallback.");
            }

        } catch (Exception e) {
            log.warn("Failed to initialize MaxMind GeoIp reader : {}", e.getMessage());
        }
    }

    public GeoLocation resolve(String ipAddress) {
        // Guard Clause 1: Null or blank IP
        if (ipAddress == null || ipAddress.isBlank()) {
            return new GeoLocation("Unknown", "Unknown");
        }

        // Guard Clause 2: Localhost, IPv6 loopback, and Private Networks (RFC 1918 / Docker subnets)
        if (isPrivateOrLoopback(ipAddress.trim())) {
            return new GeoLocation("Localhost / Private Network", "Localhost");
        }

        // Guard Clause 3: Reader not available
        if (databaseReader == null) {
            return new GeoLocation("India", "Delhi"); // Graceful fallback
        }

        try {
            InetAddress ip = InetAddress.getByName(ipAddress.trim());
            CityResponse response = databaseReader.city(ip);

            String country = (response.getCountry() != null && response.getCountry().getName() != null)
                    ? response.getCountry().getName()
                    : "Unknown";

            String city = (response.getCity() != null && response.getCity().getName() != null)
                    ? response.getCity().getName()
                    : "Unknown";

            return new GeoLocation(country, city);
        } catch (Exception e) {
            log.debug("GeoIP lookup failed for IP [{}] : {}", ipAddress, e.getMessage());
            return new GeoLocation("Unknown", "Unknown");
        }
    }

    private boolean isPrivateOrLoopback(String ip) {
        if (ip.equals("127.0.0.1") || ip.equals("::1") || ip.equals("0:0:0:0:0:0:0:1")) {
            return true;
        }
        if (ip.startsWith("10.") || ip.startsWith("192.168.")) {
            return true;
        }
        // RFC 1918: 172.16.0.0 - 172.31.255.255 (standard Docker bridge networks)
        if (ip.matches("^172\\.(1[6-9]|2[0-9]|3[0-1])\\..*")) {
            return true;
        }
        try {
            InetAddress addr = InetAddress.getByName(ip);
            return addr.isLoopbackAddress() || addr.isSiteLocalAddress() || addr.isLinkLocalAddress();
        } catch (Exception ignored) {
            return false;
        }
    }
}
