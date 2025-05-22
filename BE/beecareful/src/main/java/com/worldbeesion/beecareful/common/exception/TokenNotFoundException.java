package com.worldbeesion.beecareful.common.exception;

public class TokenNotFoundException extends CommonException {

    @Override
    public ErrorCode getErrorCode() {
        return ErrorCode.JWT_NOT_FOUND;
    }
}
