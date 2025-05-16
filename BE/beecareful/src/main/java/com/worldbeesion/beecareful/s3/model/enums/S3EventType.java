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
    OBJECT_CREATED_PUT("ObjectCreated:Put"),
    OBJECT_CREATED_POST("ObjectCreated:Post"),
    OBJECT_CREATED_COPY("ObjectCreated:Copy"),
    OBJECT_CREATED_COMPLETE_MULTIPART_UPLOAD("ObjectCreated:CompleteMultipartUpload"),
    OBJECT_REMOVED_DELETE("ObjectRemoved:Delete"),
    OBJECT_REMOVED_DELETE_MARKER_CREATED("ObjectRemoved:DeleteMarkerCreated"),
    REDUCED_REDUNDANCY_LOST_OBJECT("ReducedRedundancyLostObject"),
    REPLICATION_OPERATION_FAILED("Replication:OperationFailedReplication"),
    REPLICATION_OPERATION_MISSED_THRESHOLD("Replication:OperationMissedThreshold"),
    REPLICATION_OPERATION_REPLICATED("Replication:OperationReplicated"),
    REPLICATION_OPERATION_NOT_TRACKED("Replication:OperationNotTracked");

    private final String eventName;
}