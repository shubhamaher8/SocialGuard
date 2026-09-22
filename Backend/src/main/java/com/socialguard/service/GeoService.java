package com.socialguard.service;

import java.time.Duration;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class GeoService {

    private static final Logger log = LoggerFactory.getLogger(GeoService.class);

    private final WebClient webClient;
    private final String ipApiUrl;
    private final long timeoutMs;

    public GeoService(
            WebClient.Builder builder,
            @Value("${geo.ip-api-url:http://ip-api.com/json/{ip}}") String ipApiUrl,
            @Value("${geo.timeout-ms:3000}") long timeoutMs) {
        this.webClient = builder.build();
        this.ipApiUrl = ipApiUrl;
        this.timeoutMs = timeoutMs;
    }

    public record GeoResult(String city, String country, String isp, String location) {
        public static GeoResult unknown() {
            return new GeoResult("Unknown", "Unknown", "Unknown", "Unknown");
        }
    }

    @SuppressWarnings("unchecked")
    // Resolve IP location
    public GeoResult lookup(String ip) {
        try {
            Map<String, Object> data = webClient.get()
                    .uri(ipApiUrl, Map.of("ip", ip == null ? "" : ip))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(Duration.ofMillis(timeoutMs));
            if (data != null && "success".equals(data.get("status"))) {
                String city = str(data.get("city"));
                String country = str(data.get("country"));
                String isp = str(data.get("isp"));
                return new GeoResult(city, country, isp, city + ", " + country + " (ISP: " + isp + ")");
            }
        } catch (Exception e) {
            log.warn("Geo lookup failed: {}", e.getMessage());
        }
        return GeoResult.unknown();
    }

    private String str(Object v) {
        return v == null || v.toString().isEmpty() ? "Unknown" : v.toString();
    }
}
