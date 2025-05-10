package com.worldbeesion.beecareful.beehive.model.dto;

public record Photo(
        String filename,
        String contentType,
        Long expectedSize
){
}
