package com.ssafy.beecareful.common.exception;

public class BadRequestException extends CommonException{
    @Override
    public ErrorCode getErrorCode() {
        return ErrorCode.BAD_REQUEST;
    }
}
