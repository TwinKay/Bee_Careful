package com.worldbeesion.beecareful.notification.exception;

import com.worldbeesion.beecareful.common.exception.CommonException;
import com.worldbeesion.beecareful.common.exception.ErrorCode;

public class DeviceNotFoundException extends CommonException {

    @Override
    public ErrorCode getErrorCode() {
        return ErrorCode.DEVICE_NOT_FOUND;
    }
}
