package com.ssafy.beecareful.common.dto;

import lombok.Builder;
import lombok.Getter;
import org.springframework.data.domain.Page;

@Getter
@Builder
public class PageInfo {
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean hasPrevious;
    private boolean hasNext;

    public static PageInfo from(Page page) {
        return PageInfo.builder()
                .page(page.getNumber() + 1)
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .hasPrevious(page.hasPrevious())
                .hasNext(page.hasNext())
                .build();
    }
}
