package com.worldbeesion.beecareful.s3.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Import Transactional
import org.springframework.util.Assert;

import com.worldbeesion.beecareful.s3.constant.FileStatus;
import com.worldbeesion.beecareful.s3.exception.InvalidS3EventException;
import com.worldbeesion.beecareful.s3.model.dto.S3EventPayload;
import com.worldbeesion.beecareful.s3.model.entity.S3FileMetadata;
import com.worldbeesion.beecareful.s3.repository.S3FileMetadataRepository;

import lombok.extern.slf4j.Slf4j;

@Service // Mark this as a Spring service bean
@Slf4j
public class S3EventServiceImpl implements S3EventService {

	private final S3FileMetadataRepository s3FileMetadataRepository;

	private String s3BucketName;

	public S3EventServiceImpl(
		S3FileMetadataRepository s3FileMetadataRepository,
		@Value("${aws.s3.bucketName}") String s3BucketName
	) {
		Assert.hasText(s3BucketName, "Expected bucket name must not be empty");
		this.s3FileMetadataRepository = s3FileMetadataRepository;
		this.s3BucketName = s3BucketName;
	}

	private static final String EXPECTED_EVENT_NAME = "ObjectCreated:Put";
	private static final double MAX_SIZE_DIFFERENCE_PERCENTAGE = 20.0;


	@Override
	@Transactional // Make the method transactional (optional but good practice for DB updates)
	public void processS3Event(S3EventPayload eventPayload) {
		log.info("Processing S3 event for Key: {}", eventPayload.getObjectKey());

		// 1. Validate the payload
		validateEventPayload(eventPayload);

		// 2. Find Metadata and Validate Size
		S3FileMetadata metadata = findAndValidateMetadata(eventPayload);

		// 3. Update the status of the upload.
		updateFileStatus(metadata);

		log.info("Successfully processed S3 event for Key: {}", eventPayload.getObjectKey());
	}

	private void validateEventPayload(S3EventPayload eventPayload) {
		// 1-1. check bucketName, eventName
		if (!s3BucketName.equals(eventPayload.getBucketName())) {
			String errorMsg = String.format("Bucket name mismatch. Received: %s, Expected: %s",
				eventPayload.getBucketName(), s3BucketName);
			log.warn(errorMsg);
			throw new InvalidS3EventException(); // Throw specific exception
		}
		if (!EXPECTED_EVENT_NAME.equals(eventPayload.getEventName())) {
			String errorMsg = String.format("Invalid event name. Received: %s, Expected: %s",
				eventPayload.getEventName(), EXPECTED_EVENT_NAME);
			log.warn(errorMsg);
			throw new InvalidS3EventException();
		}
		if (eventPayload.getObjectKey() == null || eventPayload.getObjectKey().isBlank()) {
			String errorMsg = "Object key is missing in the event payload.";
			log.warn(errorMsg);
			throw new InvalidS3EventException();
		}
		// Add null check for object size if necessary
		if (eventPayload.getObjectSize() == null) {
			String errorMsg = String.format("Object size is missing for key: %s", eventPayload.getObjectKey());
			log.warn(errorMsg);
			throw new InvalidS3EventException();
		}

		log.debug("Event payload validated successfully for Key: {}", eventPayload.getObjectKey());
	}

	private S3FileMetadata findAndValidateMetadata(S3EventPayload eventPayload) {
		// Use Optional for better null handling if findByS3Key returns Optional<S3FileMetadata>
		// Assuming findByS3Key returns S3FileMetadata or null as per original code:
		S3FileMetadata metadata = s3FileMetadataRepository.findByS3Key(eventPayload.getObjectKey());

		if (metadata == null) {
			String errorMsg = String.format("Metadata not found for objectKey: %s", eventPayload.getObjectKey());
			log.warn(errorMsg);
			throw new InvalidS3EventException();
		}

		// Compare sizes
		long receivedSize = eventPayload.getObjectSize();
		long expectedSize = metadata.getSize(); // Assuming getSize() exists and returns long

		// Avoid division by zero if expected size is 0
		if (expectedSize == 0 && receivedSize != 0) {
			String errorMsg = String.format("File size mismatch for objectKey: %s. Expected: 0, Received: %d",
				eventPayload.getObjectKey(), receivedSize);
			log.warn(errorMsg);
			throw new InvalidS3EventException();
		} else if (expectedSize != 0) {
			double sizeDifferencePercentage = Math.abs((double) (expectedSize - receivedSize) / expectedSize) * 100;

			if (sizeDifferencePercentage > MAX_SIZE_DIFFERENCE_PERCENTAGE) {
				String errorMsg = String.format("File size mismatch for objectKey: %s. Expected: %d, Received: %d, Difference: %.2f%% (Limit: %.1f%%)",
					eventPayload.getObjectKey(), expectedSize, receivedSize, sizeDifferencePercentage, MAX_SIZE_DIFFERENCE_PERCENTAGE);
				log.warn(errorMsg);
				throw new InvalidS3EventException(); // Throw specific exception
			}
			log.debug("File size validated successfully for Key: {}. Expected: {}, Received: {}",
				eventPayload.getObjectKey(), expectedSize, receivedSize);
		} else {
			// Both expected and received are 0, which is acceptable.
			log.debug("File size validated successfully for Key: {} (both expected and received are 0).", eventPayload.getObjectKey());
		}


		// Check if the file is already processed
		if (metadata.getStatus() == FileStatus.STORED) {
			log.warn("Received duplicate S3 event for already stored file: {}", eventPayload.getObjectKey());
			// Decide how to handle duplicates. Maybe throw a specific exception or just log and ignore.
			// For now, let's throw an exception to indicate it's already processed.
			throw new InvalidS3EventException();
		}


		return metadata;
	}

	private void updateFileStatus(S3FileMetadata metadata) {
		metadata.setStatus(FileStatus.STORED);
		s3FileMetadataRepository.save(metadata); // Save the updated entity
		log.info("Updated status to STORED for Key: {}", metadata.getS3Key()); // Assuming getS3Key() exists
	}
}