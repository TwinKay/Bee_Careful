package com.worldbeesion.beecareful.common.exception;

public class CookieNotFoundException extends CommonException{

    @Override
    public ErrorCode getErrorCode() {
        return ErrorCode.COOKIE_NOT_FOUND;
    }
}
