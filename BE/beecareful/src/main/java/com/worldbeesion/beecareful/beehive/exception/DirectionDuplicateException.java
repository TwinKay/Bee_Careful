package com.worldbeesion.beecareful.beehive.exception;

import com.worldbeesion.beecareful.common.exception.CommonException;
import com.worldbeesion.beecareful.common.exception.ErrorCode;

public class DirectionDuplicateException extends CommonException  {

    @Override
    public ErrorCode getErrorCode() {
        return ErrorCode.DUPLICATE_DIRECTION;
    }
}
