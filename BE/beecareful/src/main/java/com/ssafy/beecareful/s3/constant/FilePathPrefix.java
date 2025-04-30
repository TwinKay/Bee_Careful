package com.ssafy.beecareful.s3.constant;

public enum FilePathPrefix {

    MEMBER_PROFILE("member/profile/"),
    AUCTION_PRODUCT("auction/product/")
    ;
    private final String prefix;
    FilePathPrefix(String prefix){
        this.prefix = prefix;
    }

    public String getPrefix(){
        return this.prefix;
    }

}
