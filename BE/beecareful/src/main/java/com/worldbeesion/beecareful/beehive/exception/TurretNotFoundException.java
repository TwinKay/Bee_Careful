package com.worldbeesion.beecareful.beehive.exception;

import com.worldbeesion.beecareful.common.exception.CommonException;
import com.worldbeesion.beecareful.common.exception.ErrorCode;

public class TurretNotFoundException extends CommonException {

    @Override
    public ErrorCode getErrorCode() {
        return ErrorCode.TURRET_NOT_FOUND;
    }
}
