package com.worldbeesion.beecareful.beehive.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class DiagnosisWebClientConfig {

    @Value("${ai-server.baseUrl}")
    private String aiServerBaseUrl;

    @Bean("diagnosisWebClient")
    public WebClient webClient(WebClient.Builder builder) {
        // Consider increasing buffer size if images can be large
        return builder
            .baseUrl(aiServerBaseUrl)
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(128 * 1024 * 1024)) // 128MB buffer
            .build();
    }
}
