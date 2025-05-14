package com.worldbeesion.beecareful.beehive.service; // Or a more specific service package

import static com.worldbeesion.beecareful.common.util.HttpUtil.*;

import com.worldbeesion.beecareful.beehive.model.dto.AnalyzedPhotoImageDto;
import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisApiResponse;
import jakarta.annotation.Resource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor // If you prefer constructor injection for WebClient
public class AiDiagnosisServiceImpl implements AiDiagnosisService {

    @Resource(lookup = "diagnosisWebClient")
    private final WebClient webClient;

    @Value("${beecareful.ai.api.endpoint}")
    private String aiApiEndpoint;

    @Override
    public Mono<AnalyzedPhotoImageDto> analyzePhoto(String originalPhotoS3Url) {
        log.debug("Sending URL {} to AI API for analysis.", originalPhotoS3Url);

        return webClient.post()
            .uri(aiApiEndpoint)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(Map.of("s3Url", originalPhotoS3Url))
            .accept(MediaType.MULTIPART_FORM_DATA)
            .exchangeToMono(this::handleAndParseAiApiResponse);
    }

    /**
     * Handles the AI API response, extracts parts, and constructs AiAnalysisData.
     */
    private Mono<AnalyzedPhotoImageDto> handleAndParseAiApiResponse(ClientResponse response) {
        if (response.statusCode().isError()) {
            log.error("AI API returned error status: {}", response.statusCode());
            return response.bodyToMono(String.class)
                .flatMap(errorBody -> Mono.error(new RuntimeException("AI API Error: " + response.statusCode() + " - " + errorBody)));
        }

        MediaType contentTypeHeader = response.headers().contentType().orElse(MediaType.APPLICATION_OCTET_STREAM);
        if (!contentTypeHeader.isCompatibleWith(MediaType.MULTIPART_FORM_DATA)) {
            log.error("Unexpected Content-Type from AI API: {}", contentTypeHeader);
            return Mono.error(new RuntimeException("Expected multipart/form-data response, but received: " + contentTypeHeader));
        }

        return response.bodyToFlux(Part.class)
            .collectMap(Part::name) // Collect parts into a Map
            .flatMap(partsMap -> {
                if (!partsMap.containsKey("diagnosis") || !partsMap.containsKey("image")) {
                    log.error("Incomplete multipart response. Missing 'diagnosis' or 'image' part. Parts: {}", partsMap.keySet());
                    return Mono.error(new IllegalStateException("Incomplete response from AI API: Missing required parts"));
                }

                Part diagnosisJsonPart = partsMap.get("diagnosis");
                Part analyzedImagePart = partsMap.get("image");

                Mono<DiagnosisApiResponse.DiagnosisResult> diagnosisResultMono = parseDiagnosisResult(diagnosisJsonPart);
                Mono<byte[]> imageDataMono = extractImageData(analyzedImagePart);
                String imageContentType = getPartContentType(analyzedImagePart);

                return Mono.zip(diagnosisResultMono, imageDataMono)
                    .map(tuple -> new AnalyzedPhotoImageDto(tuple.getT1(), tuple.getT2(), imageContentType));
            });
    }

    /**
     * Parses the JSON diagnosis part from the AI response.
     */
    private Mono<DiagnosisApiResponse.DiagnosisResult> parseDiagnosisResult(Part jsonPart) {
        return DataBufferUtils.join(jsonPart.content())
            .map(dataBuffer -> {
                byte[] bytes = new byte[dataBuffer.readableByteCount()];
                dataBuffer.read(bytes);
                DataBufferUtils.release(dataBuffer); // Important to release buffer
                return bytes;
            })
            .flatMap(jsonBytes -> {
                try {
                    com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    DiagnosisApiResponse tempResponse = objectMapper.readValue(jsonBytes, DiagnosisApiResponse.class);
                    if (tempResponse == null || tempResponse.getDiagnosis() == null) {
                        log.error("Parsed DiagnosisApiResponse or its DiagnosisResult is null. JSON: {}", new String(jsonBytes));
                        return Mono.error(new IllegalStateException("Parsed diagnosis result is null"));
                    }
                    return Mono.just(tempResponse.getDiagnosis());
                } catch (Exception e) {
                    log.error("Failed to decode JSON diagnosis part. JSON: {}", new String(jsonBytes), e);
                    return Mono.error(new RuntimeException("Failed to decode JSON diagnosis part", e));
                }
            });
    }

    /**
     * Extracts byte array from the image Part.
     */
    private Mono<byte[]> extractImageData(Part imagePart) {
        return DataBufferUtils.join(imagePart.content())
            .map(dataBuffer -> {
                byte[] bytes = new byte[dataBuffer.readableByteCount()];
                dataBuffer.read(bytes);
                DataBufferUtils.release(dataBuffer); // Important to release buffer
                return bytes;
            })
            .filter(bytes -> bytes.length > 0) // Ensure data is not empty
            .switchIfEmpty(Mono.error(new IllegalStateException("Extracted image data is empty")));
    }
}
