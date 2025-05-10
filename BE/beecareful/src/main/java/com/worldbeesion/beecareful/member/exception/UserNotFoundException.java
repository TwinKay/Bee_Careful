package com.worldbeesion.beecareful.member.exception;

import com.worldbeesion.beecareful.common.exception.CommonException;
import com.worldbeesion.beecareful.common.exception.ErrorCode;

public class UserNotFoundException extends CommonException {

    @Override
    public ErrorCode getErrorCode() {
        return ErrorCode.BAD_REQUEST;
    }
}
