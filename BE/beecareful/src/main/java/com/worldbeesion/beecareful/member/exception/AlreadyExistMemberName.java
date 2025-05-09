package com.worldbeesion.beecareful.member.exception;

import com.worldbeesion.beecareful.common.exception.CommonException;
import com.worldbeesion.beecareful.common.exception.ErrorCode;

public class AlreadyExistMemberName extends CommonException {
    @Override
    public ErrorCode getErrorCode() {
        return ErrorCode.DUPLICATE_MEMBER_LOGIN_ID;
    }
}
