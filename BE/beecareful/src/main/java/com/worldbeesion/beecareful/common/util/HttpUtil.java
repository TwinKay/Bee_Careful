package com.worldbeesion.beecareful.common.util;

import java.util.Objects;

import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class HttpUtil {
    public static String getPartContentType(Part part) {
        if (part != null && part.headers().getContentType() != null) {
            return Objects.requireNonNull(part.headers().getContentType()).toString();
        }
        log.warn("Content type missing in image Part header. Defaulting to application/octet-stream.");
        return MediaType.APPLICATION_OCTET_STREAM_VALUE;
    }
}
