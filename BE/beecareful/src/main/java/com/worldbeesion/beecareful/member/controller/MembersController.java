package com.worldbeesion.beecareful.member.controller;

import com.worldbeesion.beecareful.member.service.MembersService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
public class MembersController {
    private final MembersService memberService;

}
