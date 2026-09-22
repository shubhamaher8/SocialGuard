package com.socialguard.config;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;

import reactor.netty.http.client.HttpClient;

@Configuration
public class AppConfig {

    @Value("${geo.timeout-ms:3000}")
    private long geoTimeoutMs;

    // Shared HTTP client
    @Bean
    public WebClient.Builder webClientBuilder() {
        HttpClient httpClient = HttpClient.create()
                .responseTimeout(Duration.ofMillis(geoTimeoutMs));
        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient));
    }
}
