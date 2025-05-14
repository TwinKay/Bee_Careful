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
}
