package com.worldbeesion.beecareful.s3.model.dto;

import java.util.Map;

import lombok.Data;

@Data
public class S3EventPayload {
	private String bucketName;
	private String objectKey;
	private Long objectSize;
	private String eventTime;
	private String eventName;
	private String awsRegion;
	private Map<String, Object> sourceEvent; // To capture the original S3 record
}
