package com.worldbeesion.beecareful.beehive.controller;


import com.worldbeesion.beecareful.beehive.model.dto.*;
import com.worldbeesion.beecareful.beehive.service.BeehiveService;
import com.worldbeesion.beecareful.beehive.service.DiagnosisService;
import com.worldbeesion.beecareful.common.auth.principal.UserDetailsImpl;
import jakarta.websocket.server.PathParam;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
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
    private final DiagnosisService diagnosisService;

    @PostMapping("")
    public ResponseEntity<?> createBeehive(@RequestBody BeehiveRequestDto beehiveRequestDto,
                                           @AuthenticationPrincipal UserDetailsImpl userDetails) {
        beehiveService.addBeehive(beehiveRequestDto, userDetails);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("")
    public ResponseEntity<?> getAllBeehives(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<AllBeehiveResponseDto> beehiveList = beehiveService.getAllBeehives(userDetails);
        return ResponseEntity
                .ok()
                .body(beehiveList);
    }

//    @GetMapping("/{beeHiveId}")
//    public ResponseEntity<?> getBeehiveById(@PathVariable("beeHiveId") Long beeHiveId, Pageable pageable) {
//        BeehiveDetailResponseDto responseDto = beehiveService.getBeehiveDetails(beeHiveId, pageable);
//        return ResponseEntity.ok().body(responseDto);
//    }

    @GetMapping("/{beeHiveId}")
    public ResponseEntity<?> getBeehiveById(@PathVariable("beeHiveId") Long beeHiveId,
                                            @RequestParam("month") int month,
                                            @AuthenticationPrincipal UserDetailsImpl userDetails){
        BeehiveDetailResponseDto responseDto = beehiveService.getBeehiveDetails(beeHiveId, month, userDetails);
        return ResponseEntity.ok().body(responseDto);
    }

    @PostMapping("/{beeHiveId}/turret")
    public ResponseEntity<?> addTurret(@PathVariable("beeHiveId") Long beeHiveId, @RequestBody TurretRequestDto turretRequestDto) {
        beehiveService.addTurret(beeHiveId, turretRequestDto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PatchMapping("/{beeHiveId}")
    public ResponseEntity<?> modifyBeehive(@PathVariable("beeHiveId") Long beeHiveId
                                            , @RequestBody BeehiveUpdateDto beehiveUpdateDto
                                            , @AuthenticationPrincipal UserDetailsImpl userDetails) {
        beehiveService.updateBeehive(beeHiveId, beehiveUpdateDto, userDetails);
        return ResponseEntity.ok().build();
    }


    @PostMapping("/{beeHiveId}/diagnosis")
    public ResponseEntity<?> diagnosisRequest(@PathVariable(name = "beeHiveId") Long beeHiveId, @RequestBody DiagnosisRequestDto request){
        System.out.println("beeHiveId = " + beeHiveId);
        System.out.println("request = " + request);

        DiagnosisDto diagnosisDto = new DiagnosisDto(beeHiveId, request.photos());
        List<DiagnosisResponseDto> response = diagnosisService.generateDiagnosisPresignedUrls(diagnosisDto);
        return ResponseEntity
                .ok()
                .body(response);
    }

    @DeleteMapping("/{beeHiveId}")
    public ResponseEntity<?> deleteBeehive(@PathVariable(name = "beeHiveId") Long beeHiveId,
                                           @AuthenticationPrincipal UserDetailsImpl userDetails) {
        beehiveService.deleteBeehive(beeHiveId, userDetails);
        return ResponseEntity.ok().build();
    }
}
