package com.ssafy.beecareful.common.exception;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Getter
public class ErrorResponseDto {

    String code;
    String message;

    public static ErrorResponseDto of(ErrorCode errorCode){
        return new ErrorResponseDto(errorCode.getCode(), errorCode.getMessage());
    }

    public static ErrorResponseDto of(String code, String message){
        return new ErrorResponseDto(code,message);
    }

}
