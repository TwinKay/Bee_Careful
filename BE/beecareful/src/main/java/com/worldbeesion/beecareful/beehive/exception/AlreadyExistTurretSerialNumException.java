package com.worldbeesion.beecareful.beehive.exception;

import com.worldbeesion.beecareful.common.exception.CommonException;
import com.worldbeesion.beecareful.common.exception.ErrorCode;

public class AlreadyExistTurretSerialNumException extends CommonException {

    @Override
    public ErrorCode getErrorCode() {
        return ErrorCode.ALREADY_EXIST_SERIAL;
    }
}
