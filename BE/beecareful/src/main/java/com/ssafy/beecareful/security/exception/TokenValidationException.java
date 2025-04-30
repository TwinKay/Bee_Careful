package com.ssafy.beecareful.security.exception;

import com.ssafy.beecareful.common.exception.CommonException;
import com.ssafy.beecareful.common.exception.ErrorCode;

public class TokenValidationException extends CommonException {
    @Override
    public ErrorCode getErrorCode() {
        return null;
    }
}
