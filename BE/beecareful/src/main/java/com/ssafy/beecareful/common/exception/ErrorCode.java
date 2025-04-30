package com.ssafy.beecareful.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    // Common
    BAD_REQUEST(HttpStatus.BAD_REQUEST,"COMMON-001","유효하지 않은 요청입니다."),
    PARAMETER_VALIDATION_FAIL(HttpStatus.BAD_REQUEST,"COMMON-002","입력값 형식 오류입니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR,"COMMON-001","내부 서버 오류입니다"),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED,"COMMON-401", "인증되지 않은 사용자입니다" ),
    FORBIDDEN(HttpStatus.FORBIDDEN,"COMMON-403","권한이 없습니다"),
    MULTIPART_BINDING_FAIL(HttpStatus.BAD_REQUEST,"COMMON-400", "멀티파티 파일 매핑에 실패하였습니다"),
    UNSUPPORTED_MEDIA_TYPE(HttpStatus.UNSUPPORTED_MEDIA_TYPE,"COOMON-415","지원하지 않는 형식입니다"),



    // Auth
    LOGIN_FAIL(HttpStatus.UNAUTHORIZED,"AUTH-001","로그인에 실패하였습니다"),
    TOKEN_VALIDATION_FAIL(HttpStatus.UNAUTHORIZED,"AUTH-002","토큰 검증에 실패하였습니다"),

    // Member
    MEMBER_ALREADY_EXISTS(HttpStatus.BAD_REQUEST,"MEMBER-001","이미 존재하는 회원입니다"),
    MEMBER_NOT_FOUND(HttpStatus.BAD_REQUEST,"MEMBER-002","존재하지 않는 회원입니다"),
    MEMBER_NOT_ACTIVE(HttpStatus.BAD_REQUEST,"MEMBER-003","비활성 회원입니다."),

    // S3
    IMAGE_NOT_FOUND(HttpStatus.BAD_REQUEST,"FILE-001","이미지가 존재하지 않습니다."),
    IMAGE_DUPLICATED(HttpStatus.BAD_REQUEST,"FILE-002","중복된 이미지입니다."),
    IMAGE_UPLOAD_FAIL(HttpStatus.BAD_REQUEST,"FILE-003","이미지 업로드에 실패하였습니다."),
    IMAGE_EXTENSION_NOT_VALID(HttpStatus.UNSUPPORTED_MEDIA_TYPE,"FILE-004","지원하지 않는 확장자입니다."),
    IMAGE_REMOVE_FAIL(HttpStatus.INTERNAL_SERVER_ERROR,"FILE-005","삭제에 실패하였습니다.."),

    S3_CONNECT_FAIL(HttpStatus.INTERNAL_SERVER_ERROR,"S3-001","내부 서버 오류"), // S3 버킷 연결 실패

    ;

    private final HttpStatus httpStatus;	// HttpStatus
    private final String code;				// 에러코드
    private final String message;			// 에러설명

    ErrorCode(HttpStatus httpStatus, String code, String message){
        this.httpStatus = httpStatus;
        this.code = code;
        this.message = message;
    }
}
