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
import com.worldbeesion.beecareful.s3.service.S3EventService; // Import the service interface

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/s3") // Base path for the S3 event related endpoints
@Slf4j
@RequiredArgsConstructor // Injects final fields via constructor
public class S3EventController {

	private final S3EventService s3EventService; // Inject the service

	@Value("${aws.s3.apiKey}") // Keep API key for endpoint security check
	private String expectedApiKey; // Renamed for clarity

	/**
	 * Endpoint to receive S3 event notifications from the AWS Lambda function.
	 *
	 * @param eventPayload The S3EventPayload deserialized from the JSON request body.
	 * @param receivedApiKey API key passed in the header for security.
	 * @return ResponseEntity indicating the outcome of the processing.
	 */
	@PostMapping
	public ResponseEntity<String> receiveS3Event(
		@RequestBody S3EventPayload eventPayload,
		@RequestHeader(value = "X-API-Key", required = true) String receivedApiKey
	) {
		// 1. Security Check (Remains in Controller)
		if (expectedApiKey == null || !expectedApiKey.equals(receivedApiKey)) {
			log.warn("Received request with missing or invalid API key. Check configuration and request header.");
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or missing API Key");
		}

		// Log initial reception info
		log.info("Received S3 event notification. Bucket: {}, Key: {}, Event: {}",
			eventPayload.getBucketName(),
			eventPayload.getObjectKey(),
			eventPayload.getEventName());

		// 2. Delegate processing to the service layer
		s3EventService.processS3Event(eventPayload);

		// 3. Return success response
		return ResponseEntity.ok("Event processed successfully for: " + eventPayload.getObjectKey());
	}
}