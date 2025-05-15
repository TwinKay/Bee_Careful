package com.worldbeesion.beecareful.beehive.exception;

import com.worldbeesion.beecareful.common.exception.CommonException;
import com.worldbeesion.beecareful.common.exception.ErrorCode;

public class DirectionNullException extends CommonException {

    @Override
    public ErrorCode getErrorCode() {
        return ErrorCode.DIRECTION_NULL;
    }
}
