package com.worldbeesion.beecareful.beehive.model.dto;

public record PageInfoDto(
        Long page, // 현재 페이지 번호
        Long size, // 한 페이지 당 데이터 개수
        Long totalElements, // 전체 데이터 갯수
        Long totalPages, // 전체 페이지 수
        Boolean hasPrevious, // 이전 페이지 존재 여부
        Boolean hasNext // 다음 페이지 존재 여부
) {
}
