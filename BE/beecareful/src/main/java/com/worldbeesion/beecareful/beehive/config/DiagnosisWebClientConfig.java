package com.worldbeesion.beecareful.beehive.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class DiagnosisWebClientConfig {
	@Bean("diagnosisWebClient")
	public WebClient webClient(WebClient.Builder builder) {
		// Consider increasing buffer size if images can be large
		return builder.baseUrl("http://your-api-endpoint") // Base URL for the AI API
		           .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(128 * 1024 * 1024)) // 128MB buffer
		           .build();
	}
}
