package com.ssafy.beecareful.common.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;


@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {


    // @RequestPart에 매핑되는 멀티파트가 없는경우
    @Override
    protected ResponseEntity<Object> handleMissingServletRequestPart(MissingServletRequestPartException e,
                                                                     HttpHeaders headers, HttpStatusCode status,
                                                                     WebRequest request) {
        String requestPartName = e.getRequestPartName();
        String message = requestPartName + "매핑에 실패하였습니다.";

        return ResponseEntity
                .status(ErrorCode.MULTIPART_BINDING_FAIL.getHttpStatus())
                .body(ErrorResponseDto.of(ErrorCode.MULTIPART_BINDING_FAIL.getCode(),message));

    }

    @Override
    protected ResponseEntity<Object> handleHttpMediaTypeNotSupported(HttpMediaTypeNotSupportedException ex,
                                                                     HttpHeaders headers, HttpStatusCode status,
                                                                     WebRequest request) {
        return ResponseEntity
                .status(ErrorCode.UNSUPPORTED_MEDIA_TYPE.getHttpStatus())
                .body(ErrorResponseDto.of(ErrorCode.UNSUPPORTED_MEDIA_TYPE.getCode(),ErrorCode.UNSUPPORTED_MEDIA_TYPE.getMessage()));
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<ErrorResponseDto> handleMultipartException(MultipartException e) {
        String message= "잘못된 Content-Type이거나 multipart 요청 구성이 올바르지 않습니다.";
        return ResponseEntity
                .status(ErrorCode.MULTIPART_BINDING_FAIL.getHttpStatus())
                .body(ErrorResponseDto.of(ErrorCode.MULTIPART_BINDING_FAIL.getCode(),message));
    }


    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {

        BindingResult bindingResult = ex.getBindingResult();
        String message = bindingResult.getFieldError().getDefaultMessage();
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponseDto(ErrorCode.PARAMETER_VALIDATION_FAIL.getCode(), message));
    }

    @ExceptionHandler(value = CommonException.class)
    public ResponseEntity<ErrorResponseDto> businessExceptionHandler(CommonException e){

        return ResponseEntity
                .status(e.getErrorCode().getHttpStatus())
                .body(ErrorResponseDto.of(e.getErrorCode()));
    }

    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @ExceptionHandler(value = Exception.class)
    public ResponseEntity<?> handleException(Exception e){
        e.printStackTrace();
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponseDto.of(ErrorCode.INTERNAL_SERVER_ERROR));
    }
}
