package com.worldbeesion.beecareful.common.exception;

public class CannotMatchTypeException extends CommonException{

    @Override
    public ErrorCode getErrorCode() {
        return ErrorCode.CANNOT_MATCH_TYPE;
    }
}
