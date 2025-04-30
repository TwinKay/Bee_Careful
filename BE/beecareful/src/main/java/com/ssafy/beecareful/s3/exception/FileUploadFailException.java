package com.ssafy.beecareful.s3.exception;


import com.ssafy.beecareful.common.exception.CommonException;
import com.ssafy.beecareful.common.exception.ErrorCode;

public class FileUploadFailException extends CommonException {
    @Override
    public ErrorCode getErrorCode() {
        return ErrorCode.IMAGE_UPLOAD_FAIL;
    }
}
