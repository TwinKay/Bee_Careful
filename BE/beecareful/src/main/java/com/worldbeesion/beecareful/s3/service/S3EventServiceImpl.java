package com.worldbeesion.beecareful.s3.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import com.worldbeesion.beecareful.beehive.model.entity.OriginalPhoto;
import com.worldbeesion.beecareful.s3.constant.FilePathPrefix;
import com.worldbeesion.beecareful.s3.constant.S3FileStatus;
import com.worldbeesion.beecareful.s3.exception.InvalidS3EventException;
import com.worldbeesion.beecareful.s3.model.dto.S3EventPayload;
import com.worldbeesion.beecareful.s3.model.entity.S3FileMetadata;
import com.worldbeesion.beecareful.s3.repository.S3FileMetadataRepository;

import lombok.extern.slf4j.Slf4j;

@Service // Mark this as a Spring service bean
@Slf4j
public class S3EventServiceImpl implements S3EventService {

	private final S3FileMetadataRepository s3FileMetadataRepository;
	private final S3OriginPhotoUploadProcessingService s3OriginPhotoUploadProcessingService;

	private final String s3BucketName;

	/**
	 * S3에 업로드된 파일의 실제 크기와 예상 크기 간의 허용 가능한 최대 차이 백분율
	 * 예상 크기와 실제 크기의 차이가 20%를 초과하면 InvalidS3EventException이 발생함
	 */
	private static final double MAXIMUM_ALLOWED_SIZE_DIFFERENCE_PERCENTAGE = 20.0;

	public S3EventServiceImpl(
		S3FileMetadataRepository s3FileMetadataRepository,
		S3OriginPhotoUploadProcessingService s3OriginPhotoUploadProcessingService,
		@Value("${aws.s3.bucketName}") String s3BucketName
	) {
		Assert.hasText(s3BucketName, "Expected bucket name must not be empty");
		this.s3FileMetadataRepository = s3FileMetadataRepository;
		this.s3OriginPhotoUploadProcessingService = s3OriginPhotoUploadProcessingService;
		this.s3BucketName = s3BucketName;
	}

	@Override
	public void processS3PutEvent(S3EventPayload eventPayload) {
		log.info("Processing S3 event for Key: {}", eventPayload.getObjectKey());

		// 1. Validate the payload
		validateEventPayload(eventPayload);

		// only when ORIGIN PHOTO RECEIVED
		if (eventPayload.getObjectKey().startsWith(FilePathPrefix.BEEHIVE_ORIGIN.getPrefix())) {

			// 2. Find Metadata and Validate Size
			S3FileMetadata metadata = findAndValidateMetadata(eventPayload);

			// 3. Update the status of the upload.
			OriginalPhoto originalPhoto = s3OriginPhotoUploadProcessingService.updateOriginPhotoFileStatus(metadata);

			// 4. Check if all Origin Photos are uploaded
			s3OriginPhotoUploadProcessingService.checkUploadStatusOfOriginPhotosOfTheDiagnosisAndRunDiagnosis(originalPhoto);

			log.info("Successfully processed S3 event for Key: {}", eventPayload.getObjectKey());
		}
	}

	private void validateEventPayload(S3EventPayload eventPayload) {
		// TODO: add InvalidS3EventException handling logic (status to FAILED)
		// TODO: implement specific Exceptions for each following cases
		if (!s3BucketName.equals(eventPayload.getBucketName())) {
			String errorMsg = String.format("Bucket name mismatch. Received: %s, Expected: %s",
				eventPayload.getBucketName(), s3BucketName);
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

			if (sizeDifferencePercentage > MAXIMUM_ALLOWED_SIZE_DIFFERENCE_PERCENTAGE) {
				String errorMsg = String.format("File size mismatch for objectKey: %s. Expected: %d, Received: %d, Difference: %.2f%% (Limit: %.1f%%)",
					eventPayload.getObjectKey(), expectedSize, receivedSize, sizeDifferencePercentage, MAXIMUM_ALLOWED_SIZE_DIFFERENCE_PERCENTAGE);
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
		if (metadata.getStatus() == S3FileStatus.STORED) {
			log.warn("Received duplicate S3 event for already stored file: {}", eventPayload.getObjectKey());
			// Decide how to handle duplicates. Maybe throw a specific exception or just log and ignore.
			// For now, let's throw an exception to indicate it's already processed.
			throw new InvalidS3EventException();
		}

		return metadata;
	}
}