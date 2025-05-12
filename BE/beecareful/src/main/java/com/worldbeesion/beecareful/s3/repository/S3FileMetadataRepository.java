package com.worldbeesion.beecareful.s3.repository;

import com.worldbeesion.beecareful.s3.model.entity.S3FileMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface S3FileMetadataRepository extends JpaRepository<S3FileMetadata,Long> {

	S3FileMetadata findByS3Key(String s3Key);
}