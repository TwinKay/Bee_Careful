package com.ssafy.beecareful.member.entity;

import com.ssafy.beecareful.member.constant.MemberStatus;
import com.ssafy.beecareful.s3.entity.S3FileMetadata;
import jakarta.persistence.Column;
import jakarta.persistence.ConstraintMode;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;


@Entity
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Table(name = "members")
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "member_id")
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String nickname;

    @Column
    private String photo;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="s3_file_metadata_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private S3FileMetadata s3FileMetadata;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private int reliability;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;

    @Column
    @Enumerated(EnumType.STRING)
    private MemberStatus status;

    @PrePersist
    public void prePersist() {
        if (this.status == null) {
            this.status = MemberStatus.ACTIVE;
        }
        if (this.reliability == 0) {
            this.reliability = 66;
        }
    }

    public void setS3FileMetadata(S3FileMetadata s3FileMetadata ){
        this.s3FileMetadata = s3FileMetadata;
    }

    public void updateReliability(int reliability) {
        this.reliability = reliability;
    }
}

