package com.ssafy.beecareful.common.exception;

public class UnauthorizedException extends CommonException{
    @Override
    public ErrorCode getErrorCode() {
        return ErrorCode.UNAUTHORIZED;
    }
}
