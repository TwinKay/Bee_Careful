package com.worldbeesion.beecareful.common.exception;

import lombok.AllArgsConstructor;

@AllArgsConstructor
public class ErrorResponseDto {

    String message;

    public static ErrorResponseDto of(ErrorCode errorCode) {
        return new ErrorResponseDto(errorCode.getMessage());
    }

    public static ErrorResponseDto of(String message) {
        return new ErrorResponseDto(message);
    }
}
