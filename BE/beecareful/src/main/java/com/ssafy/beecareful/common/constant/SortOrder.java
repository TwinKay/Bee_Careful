package com.ssafy.beecareful.common.constant;

public enum SortOrder {
    ASC,DESC,NONE
    ;
    public static SortOrder ignoreCaseOf(String value) {
        for (SortOrder sortOrder : SortOrder.values()) {
            if (sortOrder.name().equalsIgnoreCase(value)) {
                return sortOrder;
            }
        }
        return null;
    }
}

