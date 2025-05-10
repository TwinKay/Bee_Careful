package com.worldbeesion.beecareful.member.model;

import jakarta.persistence.*;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name="members")
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Members {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="member_id")
    private Long id;

    @Column(name="member_name", nullable = false)
    private String memberName;

    @Column(name="phone", nullable = false)
    private String phone;

    @Column(name="created_at", nullable = false)
    @CreatedDate
    private LocalDateTime createdAt;

    @Column(name="updated_at", nullable = false)
    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Column(name="deleted_at", nullable = true)
    private LocalDateTime deletedAt;

    public Members(String memberName, String phone) {
        this.memberName = memberName;
        this.phone = phone;
    }
}
