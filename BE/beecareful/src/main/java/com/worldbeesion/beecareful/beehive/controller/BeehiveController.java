package com.worldbeesion.beecareful.beehive.controller;


import com.worldbeesion.beecareful.beehive.model.dto.*;
import com.worldbeesion.beecareful.beehive.service.BeehiveService;
import com.worldbeesion.beecareful.common.auth.principal.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/beehives")
@RequiredArgsConstructor
public class BeehiveController {

    private final BeehiveService beehiveService;

    @PostMapping("")
    public ResponseEntity<?> createBeehive(@RequestBody BeehiveRequestDto beehiveRequestDto,
                                           @AuthenticationPrincipal UserDetailsImpl userDetails) {
        beehiveService.addBeehive(beehiveRequestDto, userDetails);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

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
