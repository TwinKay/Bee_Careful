package com.worldbeesion.beecareful.common.exception;

import org.springframework.http.ResponseEntity;

public abstract class CommonException extends RuntimeException {

    public ResponseEntity<?> toResponseEntity() {
        return ResponseEntity
                .status(getErrorCode().getStatus())
                .body(ErrorResponseDto.of(getErrorCode().getMessage()));
    }

    public abstract ErrorCode getErrorCode();
}
