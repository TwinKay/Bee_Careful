package com.ssafy.beecareful.member.constant;

public enum SocialType {
    NAVER,KAKAO,GOOGLE
    ;

    public static SocialType ignoreCaseOf(String value) {
        for (SocialType socialType : SocialType.values()) {
            if (socialType.name().equalsIgnoreCase(value)) {
                return socialType;
            }
        }
        return null;
    }
}
