package com.worldbeesion.beecareful.s3.controller;


import com.worldbeesion.beecareful.s3.service.S3PresignService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping(path = "/api/test")
@RequiredArgsConstructor
public class S3TestController {

    private final S3PresignService s3PresignService;

    @GetMapping("/url")
    public String geturl(){
        String s = s3PresignService.generatePutUrl("213", "becareful-bucket");
        return s;
    }

}