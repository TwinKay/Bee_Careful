package com.ssafy.beecareful.common.exception;

public class ForbiddenException extends CommonException{
    @Override
    public ErrorCode getErrorCode() {
        return ErrorCode.UNAUTHORIZED;
    }
}
