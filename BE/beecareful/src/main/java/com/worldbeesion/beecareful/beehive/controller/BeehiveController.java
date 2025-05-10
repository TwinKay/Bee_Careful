package com.worldbeesion.beecareful.beehive.controller;


import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisDto;
import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisRequestDto;
import com.worldbeesion.beecareful.beehive.model.dto.DiagnosisResponseDto;
import com.worldbeesion.beecareful.beehive.model.dto.Photo;
import com.worldbeesion.beecareful.beehive.service.BeehiveService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/beehives")
@RequiredArgsConstructor
public class BeehiveController {

    private final BeehiveService beehiveService;


    @PostMapping("/{beeHiveId}/diagnosis")
    public ResponseEntity<?> diagnosisRequest(@PathVariable(name = "beeHiveId") Long beeHiveId, @RequestBody DiagnosisRequestDto request){
        System.out.println("beeHiveId = " + beeHiveId);
        System.out.println("request = " + request);

        DiagnosisDto diagnosisDto = new DiagnosisDto(beeHiveId, request.photos());
        List<DiagnosisResponseDto> response = beehiveService.generateDiagnosisPresignedUrl(diagnosisDto);
        return ResponseEntity
                .ok()
                .body(response);
    }
}
