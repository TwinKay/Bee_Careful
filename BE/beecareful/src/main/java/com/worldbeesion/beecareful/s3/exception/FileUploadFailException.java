package com.worldbeesion.beecareful.s3.exception;

import com.worldbeesion.beecareful.common.exception.CommonException;
import com.worldbeesion.beecareful.common.exception.ErrorCode;

public class FileUploadFailException extends CommonException {
    @Override
    public ErrorCode getErrorCode() {
        return ErrorCode.IMAGE_UPLOAD_FAIL;
    }
}
