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
    CANNOT_MATCH_TYPE(HttpStatus.INTERNAL_SERVER_ERROR, "지정한 형식의 타입이 아닙니다."),

    // Member
    DUPLICATE_MEMBER_LOGIN_ID(HttpStatus.CONFLICT, "이미 존재하는 아이디 입니다."),
    USER_NOT_FOUND(HttpStatus.BAD_REQUEST, "ID 또는 비밀번호가 잘못되었습니다."),

    // S3
    S3_CONNECT_FAIL(HttpStatus.INTERNAL_SERVER_ERROR,"내부 서버 오류입니다"),
    IMAGE_UPLOAD_FAIL(HttpStatus.BAD_REQUEST,"이미지 업로드에 실패하였습니다."),

    //Beehive
    BEEHIVE_NOT_FOUND(HttpStatus.BAD_REQUEST, "존재하지 않는 벌통입니다."),


    // Auth
    COOKIE_NOT_FOUND(HttpStatus.UNAUTHORIZED, "쿠키가 존재하지 않습니다"),
    JWT_NOT_FOUND(HttpStatus.UNAUTHORIZED, "토큰이 존재하지 않습니다. "),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다.");


    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }

}
