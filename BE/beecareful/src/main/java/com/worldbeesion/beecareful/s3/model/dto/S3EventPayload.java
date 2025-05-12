package com.worldbeesion.beecareful.s3.model.dto;

import java.util.Map;

public class S3EventPayload {
	private String bucketName;
	private String objectKey;
	private String eventTime;
	private String eventName;
	private String awsRegion;
	private Map<String, Object> sourceEvent; // To capture the original S3 record

	// Getters and Setters (Lombok can also be used here: @Data)
	public String getBucketName() {
		return bucketName;
	}

	public void setBucketName(String bucketName) {
		this.bucketName = bucketName;
	}

	public String getObjectKey() {
		return objectKey;
	}

	public void setObjectKey(String objectKey) {
		this.objectKey = objectKey;
	}

	public String getEventTime() {
		return eventTime;
	}

	public void setEventTime(String eventTime) {
		this.eventTime = eventTime;
	}

	public String getEventName() {
		return eventName;
	}

	public void setEventName(String eventName) {
		this.eventName = eventName;
	}

	public String getAwsRegion() {
		return awsRegion;
	}

	public void setAwsRegion(String awsRegion) {
		this.awsRegion = awsRegion;
	}

	public Map<String, Object> getSourceEvent() {
		return sourceEvent;
	}

	public void setSourceEvent(Map<String, Object> sourceEvent) {
		this.sourceEvent = sourceEvent;
	}

	@Override
	public String toString() {
		return "S3EventPayload{" +
			"bucketName='" + bucketName + '\'' +
			", objectKey='" + objectKey + '\'' +
			", eventTime='" + eventTime + '\'' +
			", eventName='" + eventName + '\'' +
			", awsRegion='" + awsRegion + '\'' +
			// Avoid printing the full sourceEvent if it's too large for logs
			", sourceEventPresent=" + (sourceEvent != null && !sourceEvent.isEmpty()) +
			'}';
	}
}
