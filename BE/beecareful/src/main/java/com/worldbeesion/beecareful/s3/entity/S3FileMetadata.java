package com.worldbeesion.beecareful.s3.entity;


import com.worldbeesion.beecareful.s3.constant.FileStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;


@Entity
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Table(name = "s3_file_metadatas")
public class S3FileMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "s3_file_metadata_id")
    private Long id;

    private Long memberId;

    @Column(name="original_filename", nullable = false)
    private String originalFilename;

    @Column(name="s3_key",nullable = false, unique = true)
    private String s3Key;

    @Column(name="url", nullable = false,unique = true)
    private String url;

    @Column(name="size", nullable = false)
    private Long size; // 파일 크기 (바이트)

    @Column(name="content_type")
    private String contentType; // MIME Type

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FileStatus status;

    @Column(nullable = false)
    @CreatedDate
    private LocalDateTime createdAt;


    @Column
    private LocalDateTime deletedAt;

    public void setStatus(FileStatus status){
        this.status = status;
    }

    public void delete(){
        this.status = FileStatus.DELETED;
        this.deletedAt = LocalDateTime.now();
    }

}


