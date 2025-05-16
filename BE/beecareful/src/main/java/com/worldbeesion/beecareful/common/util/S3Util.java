package com.worldbeesion.beecareful.common.util;

import java.util.UUID;

public class S3Util {
    public static String extractFilenameFromS3Key(String s3Key) {
        if (s3Key == null || s3Key.isEmpty()) {
            return "unknown_file_" + UUID.randomUUID();
        }
        int lastSlash = s3Key.lastIndexOf('/');
        return (lastSlash >= 0) ? s3Key.substring(lastSlash + 1) : s3Key;
    }

    /**
     * Generates the full HTTPS URL for the S3 object.
     *
     * @param s3Key The unique key of the object in the bucket.
     * @return The full S3 object URL.
     */
    public static String generateS3Url(String bucketName, String region, String s3Key) {
        // Construct the URL based on bucket name, region, and key
        // Adjust format if using custom domain or different S3 URL structure
        return "https://" + bucketName + ".s3." + region + ".amazonaws.com/" + s3Key;
    }
}
