package com.worldbeesion.beecareful.beehive.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisApiResponse;
import jakarta.annotation.Resource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class AiDiagnosisServiceImpl implements AiDiagnosisService {

    @Resource(lookup = "diagnosisWebClient")
    private final WebClient webClient;

    @Value("${beecareful.ai.api.endpoint}")
    private String aiApiEndpoint;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Mono<DiagnosisApiResponse> analyzePhoto(String originalPhotoS3Key) {
        log.debug("Sending S3 key {} to AI API for analysis.", originalPhotoS3Key);

        return webClient.post()
            .uri(aiApiEndpoint)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(Map.of("s3Key", originalPhotoS3Key))
            .accept(MediaType.APPLICATION_JSON)
            .retrieve()
            .bodyToMono(DiagnosisApiResponse.class)
            .flatMap(response -> {
                if (response == null) {
                    log.error("AI API returned null response");
                    return Mono.error(new RuntimeException("AI API returned null response"));
                }

                if (response.diagnosis() == null) {
                    log.error("AI API returned null diagnosis result");
                    return Mono.error(new RuntimeException("AI API returned null diagnosis result"));
                }

                if (response.analyzedImageS3Key() == null || response.analyzedImageS3Key().isEmpty()) {
                    log.error("AI API returned null or empty analyzed image S3 key");
                    return Mono.error(new RuntimeException("AI API returned null or empty analyzed image S3 key"));
                }

                log.debug("Received diagnosis result and analyzed image S3 key: {}", response.analyzedImageS3Key());
                return Mono.just(response);
            })
            .onErrorResume(e -> {
                log.error("Error occurred while calling AI API: {}", e.getMessage(), e);
                return Mono.error(new RuntimeException("Failed to get diagnosis from AI API", e));
            });
    }
}
