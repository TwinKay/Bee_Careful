package com.worldbeesion.beecareful.s3.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.worldbeesion.beecareful.s3.model.dto.S3EventPayload;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/s3") // Base path for the S3 event related endpoints
@Slf4j
public class S3EventController {
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

		if (!apiKey.equals(receivedApiKey)) {
		log.warn("Received request with missing or invalid API key. Might be a SECURITY ISSUE.");
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or missing API Key");
		}

		// --- End Security Check ---
		// log.info("Received S3 event notification: {}", eventPayload.toString());

		// Log specific details
		log.info("Bucket: {}, Key: {}, Event: {}",
			eventPayload.getBucketName(),
			eventPayload.getObjectKey(),
			eventPayload.getEventName());

		// TODO
		// 1. Validate the payload
		// 1-1. check bucketName, eventName
		// 1-2. check objectKey, compare expectedSize and actualSize received
		// 2. Update the status of the upload in your system.

		return ResponseEntity.ok("Event received successfully: " + eventPayload.getObjectKey());
	}
}