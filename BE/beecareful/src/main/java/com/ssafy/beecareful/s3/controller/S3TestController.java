package com.ssafy.beecareful.s3.controller;


import com.ssafy.beecareful.s3.constant.FilePathPrefix;
import com.ssafy.beecareful.s3.dto.S3DeleteDto;
import com.ssafy.beecareful.s3.dto.S3SimpleDto;
import com.ssafy.beecareful.s3.service.S3FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping(path = "/api/test")
@RequiredArgsConstructor
public class S3TestController {

    private final S3FileService s3FileService;

    @PostMapping("/multiFile")
    public ResponseEntity<?> multiUpload(
            @ModelAttribute S3SimpleDto.Request request
            ){

        s3FileService.putObjects(request.images(), FilePathPrefix.MEMBER_PROFILE);

        return ResponseEntity.ok(null);
    }

    @PostMapping("/singleFile")
    public ResponseEntity<?> singleUpload(
            @ModelAttribute S3SimpleDto.Request request
    ){
        s3FileService.putObject(request.images().get(0), FilePathPrefix.MEMBER_PROFILE);

        return ResponseEntity.ok(null);
    }


    @PostMapping("/multiDelete")
    public ResponseEntity<?> multiDelete(
            @RequestBody S3DeleteDto.Request request
    ){

        s3FileService.deleteObjects(request.ids());
        return ResponseEntity.ok(null);
    }


    @PostMapping("/singleDelete")
    public ResponseEntity<?> singleDelete(
            @RequestBody S3DeleteDto.Request request
    ){
        s3FileService.deleteObject(request.ids().get(0));
        return ResponseEntity.ok(null);
    }


}
