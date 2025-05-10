package com.worldbeesion.beecareful.beehive.controller;


import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisRequestDto;
import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisResponseDto;
import com.worldbeesion.beecareful.beehive.model.dto.Photo;
import com.worldbeesion.beecareful.beehive.service.BeehiveService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/beehives")
@RequiredArgsConstructor
public class BeehiveController {

    private final BeehiveService beehiveService;


    @PostMapping("/{beeHiveId}/diagnosis")
    public ResponseEntity<?> diagnosisRequest(@RequestBody DiagnosisRequestDto request){
        List<DiagnosisResponseDto> presignedUrlDtos = beehiveService.generateDiagnosisPresignedUrl(request);
        return ResponseEntity
                .ok()
                .body(presignedUrlDtos);
    }
}
