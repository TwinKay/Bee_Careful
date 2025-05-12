package com.worldbeesion.beecareful.s3.exception;

import com.worldbeesion.beecareful.common.exception.CommonException;
import com.worldbeesion.beecareful.common.exception.ErrorCode;

public class InvalidS3EventException extends CommonException {

	@Override
	public ErrorCode getErrorCode() {
		return ErrorCode.INVALID_S3_EVENT;
	}
}
