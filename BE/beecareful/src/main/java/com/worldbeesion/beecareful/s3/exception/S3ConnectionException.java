package com.worldbeesion.beecareful.s3.exception;

import com.worldbeesion.beecareful.common.exception.CommonException;
import com.worldbeesion.beecareful.common.exception.ErrorCode;

public class S3ConnectionException extends CommonException {
    @Override
    public ErrorCode getErrorCode() {
        return ErrorCode.S3_CONNECT_FAIL;
    }
}
