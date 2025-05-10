package com.worldbeesion.beecareful.s3.constant;

public enum FilePathPrefix {

    BEEHIVE_ORIGIN("BEEHIVE/ORIGIN/"),
    BEEHIVE_DIAGNOSIS("BEEHIVE/DIAGNOSIS/")
    ;
    private final String prefix;
    FilePathPrefix(String prefix){
        this.prefix = prefix;
    }

    public String getPrefix(){
        return this.prefix;
    }

}
