package com.worldbeesion.beecareful.beehive.model.dto;

public record BeehiveUpdateDto(
        String nickname,
        Long xDirection,
        Long yDirection
) {
}
