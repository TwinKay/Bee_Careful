package com.worldbeesion.beecareful.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    // Common
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "유효하지 않은 요청입니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "내부 서버 오류입니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED,"인증되지 않은 사용자입니다" ),
    FORBIDDEN(HttpStatus.FORBIDDEN,"권한이 없습니다"),
    UNSUPPORTED_MEDIA_TYPE(HttpStatus.UNSUPPORTED_MEDIA_TYPE,"지원하지 않는 형식입니다"),
    PARAMETER_VALIDATION_FAIL(HttpStatus.BAD_REQUEST,"입력값 형식 오류입니다."),

    // Member
    DUPLICATE_MEMBER_LOGIN_ID(HttpStatus.CONFLICT, "이미 존재하는 아이디 입니다.");


    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }

}
