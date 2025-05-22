package com.worldbeesion.beecareful.s3.service;

import com.worldbeesion.beecareful.s3.model.dto.S3EventPayload;
import com.worldbeesion.beecareful.s3.exception.S3EventProcessingException; // Import base or specific exceptions

public interface S3EventService {

	/**
	 * Processes the received S3 event payload, validates it,
	 * and updates the corresponding file metadata.
	 *
	 * @param eventPayload The details of the S3 event.
	 * @throws S3EventProcessingException if validation fails or an error occurs.
	 */
	void processS3PutEvent(S3EventPayload eventPayload) throws S3EventProcessingException;
}