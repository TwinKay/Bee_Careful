package com.worldbeesion.beecareful.s3.model.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Enum representing the different types of S3 events.
 * This provides a type-safe way to check for event types instead of using string literals.
 */
@Getter
@RequiredArgsConstructor
public enum S3EventType {
    OBJECT_CREATED_PUT("S3:ObjectCreated:Put"),
    OBJECT_CREATED_POST("S3:ObjectCreated:Post"),
    OBJECT_CREATED_COPY("S3:ObjectCreated:Copy"),
    OBJECT_CREATED_COMPLETE_MULTIPART_UPLOAD("S3:ObjectCreated:CompleteMultipartUpload"),
    OBJECT_REMOVED_DELETE("S3:ObjectRemoved:Delete"),
    OBJECT_REMOVED_DELETE_MARKER_CREATED("S3:ObjectRemoved:DeleteMarkerCreated"),
    REDUCED_REDUNDANCY_LOST_OBJECT("S3:ReducedRedundancyLostObject"),
    REPLICATION_OPERATION_FAILED("S3:Replication:OperationFailedReplication"),
    REPLICATION_OPERATION_MISSED_THRESHOLD("S3:Replication:OperationMissedThreshold"),
    REPLICATION_OPERATION_REPLICATED("S3:Replication:OperationReplicated"),
    REPLICATION_OPERATION_NOT_TRACKED("S3:Replication:OperationNotTracked");

    private final String eventName;
}