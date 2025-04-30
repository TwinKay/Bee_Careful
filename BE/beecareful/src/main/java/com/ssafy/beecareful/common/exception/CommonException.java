package com.ssafy.beecareful.common.exception;

import org.springframework.http.ResponseEntity;

public abstract class CommonException extends RuntimeException{
    static ErrorCode errorCode;

    public ResponseEntity<?> toResponseEntity() {
        return ResponseEntity
                .status(getErrorCode().getHttpStatus())
                .body(null);
    }

    public abstract ErrorCode getErrorCode();
}
