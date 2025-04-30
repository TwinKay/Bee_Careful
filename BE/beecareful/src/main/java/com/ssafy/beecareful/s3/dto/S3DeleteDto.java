package com.ssafy.beecareful.s3.dto;

import java.util.List;

public class S3DeleteDto {

    public record Request(List<Long> ids){}
}
