package com.worldbeesion.beecareful.s3.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.Assert;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.worldbeesion.beecareful.s3.model.dto.S3EventPayload;
import com.worldbeesion.beecareful.s3.service.S3EventService; // Import the service interface

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/s3") // Base path for the S3 event related endpoints
@Slf4j
public class S3EventController {

	private final S3EventService s3EventService; // Inject the service
	private final String s3ApiSecret; // Renamed for clarity

	public S3EventController(
		S3EventService s3EventService,
		@Value("${aws.s3.apiSecret}") String s3ApiSecret
	) {
		Assert.hasText(s3ApiSecret, "Configuration property 'aws.s3.apiSecret' must not be null or empty");
		this.s3EventService = s3EventService;
		this.s3ApiSecret = s3ApiSecret;
	}

	/**
	 * Endpoint to receive S3 event notifications from the AWS Lambda function.
	 *
	 * @param eventPayload The S3EventPayload deserialized from the JSON request body.
	 * @param receivedApiSecret API key passed in the header for security.
	 * @return ResponseEntity indicating the outcome of the processing.
	 */
	@PostMapping
	public ResponseEntity<String> receiveS3Event(
		@RequestBody S3EventPayload eventPayload,
		@RequestHeader(value = "X-API-Key", required = true) String receivedApiSecret
	) {
		if (s3ApiSecret.equals(receivedApiSecret)) {
			log.warn("Received request with missing or invalid API key. Check configuration and request header.");
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or missing API Key");
		}

		// Log initial reception info
		log.info("Received S3 event notification. Bucket: {}, Key: {}, Event: {}",
			eventPayload.getBucketName(),
			eventPayload.getObjectKey(),
			eventPayload.getEventName());

		s3EventService.processS3Event(eventPayload);

		return ResponseEntity.ok("Event processed successfully for: " + eventPayload.getObjectKey());
	}
}