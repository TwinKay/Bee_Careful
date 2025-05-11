package com.worldbeesion.beecareful.common.util;

import java.sql.Timestamp;
import java.time.LocalDateTime;


public class TypeConversionUtil {

    public static LocalDateTime toLocalDateTime(Object obj) {
        return obj == null ? null : ((Timestamp) obj).toLocalDateTime();
    }

    public static Boolean toBoolean(Object obj) {
        if (obj instanceof Boolean b) return b;
        if (obj instanceof Number n) return n.intValue() != 0;
        return false;
    }

}
