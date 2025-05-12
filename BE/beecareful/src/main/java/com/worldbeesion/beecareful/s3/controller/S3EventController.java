package com.worldbeesion.beecareful.s3.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.worldbeesion.beecareful.s3.model.dto.S3EventPayload;
import com.worldbeesion.beecareful.s3.constant.FileStatus;
import com.worldbeesion.beecareful.s3.model.entity.S3FileMetadata;
import com.worldbeesion.beecareful.s3.repository.S3FileMetadataRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/s3") // Base path for the S3 event related endpoints
@Slf4j
@RequiredArgsConstructor
public class S3EventController {
    private final S3FileMetadataRepository s3FileMetadataRepository;
	@Value("${aws.s3.bucketName}")
	public String bucketName;
	@Value("${aws.s3.apiKey}")
	public String apiKey;
	/**
	 * Endpoint to receive S3 event notifications from the AWS Lambda function.
	 *
	 * @param eventPayload The S3EventPayload deserialized from the JSON request body.
	 * @param receivedApiKey       Optional API key passed in the header for security.
	 * @return ResponseEntity indicating the outcome of the processing.
	 */
	@PostMapping
	public ResponseEntity<String> receiveS3Event(
		@RequestBody S3EventPayload eventPayload,
		@RequestHeader(value = "X-API-Key", required = true) String receivedApiKey
	) {

		// Security Check
		if (!apiKey.equals(receivedApiKey)) {
		log.warn("Received request with missing or invalid API key. Might be a SECURITY ISSUE.");
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or missing API Key");
		}

		// Log specific details
		log.info("Bucket: {}, Key: {}, Event: {}",
			eventPayload.getBucketName(),
			eventPayload.getObjectKey(),
			eventPayload.getEventName());

		// 1. Validate the payload
		// 1-1. check bucketName, eventName
		if (!bucketName.equals(eventPayload.getBucketName())) {
			log.warn("Bucket name mismatch. Received: {}, Expected: {}", eventPayload.getBucketName(), bucketName);
			return ResponseEntity.badRequest().body("Invalid bucket name");
		}
		if (!"ObjectCreated:Put".equals(eventPayload.getEventName())) {
			log.warn("Invalid event name. Received: {}", eventPayload.getEventName());
			return ResponseEntity.badRequest().body("Invalid event name");
		}

		// 1-2. check objectKey, compare expectedSize and actualSize received
        long receivedSize = eventPayload.getObjectSize(); // Assuming objectSize property exists in the payload
        S3FileMetadata metadata = s3FileMetadataRepository.findByS3Key(eventPayload.getObjectKey());

        if (metadata == null) {
            log.warn("Metadata not found for objectKey: {}", eventPayload.getObjectKey());
            return ResponseEntity.badRequest().body("Metadata not found for objectKey");
        }

        long expectedSize = metadata.getSize();
        double sizeDifferencePercentage = Math.abs((double) (expectedSize - receivedSize) / expectedSize) * 100;

        if (sizeDifferencePercentage > 20.0) {
            log.warn("File size mismatch for objectKey: {}. Expected: {}, Received: {}, Difference: {}%",
                eventPayload.getObjectKey(), expectedSize, receivedSize, sizeDifferencePercentage);
            return ResponseEntity.badRequest().body("File size mismatch exceeds 20%");
        }

		// 2. Update the status of the upload.
        metadata.setStatus(FileStatus.STORED);
        s3FileMetadataRepository.save(metadata);

		return ResponseEntity.ok("Event received successfully: " + eventPayload.getObjectKey());
	}
}