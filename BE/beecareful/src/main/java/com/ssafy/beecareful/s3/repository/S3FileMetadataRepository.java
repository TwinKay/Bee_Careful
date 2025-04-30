package com.ssafy.beecareful.s3.repository;

import com.ssafy.beecareful.s3.entity.S3FileMetadata;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;


@Repository
public interface S3FileMetadataRepository extends JpaRepository<S3FileMetadata,Long> {
    S3FileMetadata findByUrl(String url);

}