package com.worldbeesion.beecareful.common.exception;

public class InternalServerErrorException extends CommonException {

    @Override
    public ErrorCode getErrorCode() {
        return ErrorCode.INTERNAL_SERVER_ERROR;
    }
}
