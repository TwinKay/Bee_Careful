package com.worldbeesion.beecareful.s3.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.worldbeesion.beecareful.s3.model.dto.S3EventPayload;

@RestController
@RequestMapping("/api/s3-events") // Base path for the S3 event related endpoints
public class S3EventController {

	private static final Logger logger = LoggerFactory.getLogger(S3EventController.class);

	/**
	 * Endpoint to receive S3 event notifications from the AWS Lambda function.
	 *
	 * @param eventPayload The S3EventPayload deserialized from the JSON request body.
	 * @param apiKey       Optional API key passed in the header for security.
	 * @return ResponseEntity indicating the outcome of the processing.
	 */
	@PostMapping
	public ResponseEntity<String> receiveS3Event(
		@RequestBody S3EventPayload eventPayload,
		@RequestHeader(value = "X-API-Key", required = false) String apiKey) {

		// --- Security Check (Optional but Recommended) ---
		// Replace "your-configured-api-key" with the actual key you configure
		// It's better to load this from application properties or environment variables
		String configuredApiKey = System.getenv("EXPECTED_API_KEY"); // Or inject from properties
		if (configuredApiKey != null && !configuredApiKey.isEmpty()) {
			if (apiKey == null || !apiKey.equals(configuredApiKey)) {
				logger.warn("Received request with missing or invalid API key. Remote Addr: {}", getRemoteAddr());
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or missing API Key");
			}
		} else {
			logger.info("API Key check is not configured or EXPECTED_API_KEY is not set. Proceeding without key check.");
		}
		// --- End Security Check ---

		logger.info("Received S3 event notification: {}", eventPayload.toString());

		// --- Business Logic ---
		// Here you would typically:
		// 1. Validate the payload further if needed.
		// 2. Save the event details to a database.
		// 3. Trigger other business processes (e.g., data processing, notifications).
		// 4. Update the status of the upload in your system.

		// Example: Log specific details
		logger.info("Bucket: {}, Key: {}, Event: {}",
			eventPayload.getBucketName(),
			eventPayload.getObjectKey(),
			eventPayload.getEventName());

		// If you need to inspect the full original S3 record:
		if (eventPayload.getSourceEvent() != null) {
			// Be careful logging the full sourceEvent if it's very large
			// logger.debug("Full source S3 event record: {}", eventPayload.getSourceEvent());
		}

		// --- End Business Logic ---

		// Respond to the Lambda function
		return ResponseEntity.ok("Event received successfully: " + eventPayload.getObjectKey());
	}

	/**
	 * Helper method to get client IP for logging (requires proper proxy setup if behind one)
	 * This is a very basic implementation.
	 */
	private String getRemoteAddr() {
		// In a real application, you'd use HttpServletRequest if available
		// or rely on X-Forwarded-For headers if behind a proxy.
		// This is a placeholder as HttpServletRequest is not directly available here.
		return "N/A (requires HttpServletRequest for accurate IP)";
	}

	// You can add more specific endpoints if needed, e.g., for different event types
	// or if you want to handle different versions of your payload.
}