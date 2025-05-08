package com.worldbeesion.beecareful.member.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name="members")
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
    private LocalDateTime createdAt;

    @Column(name="updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name="deleted_at", nullable = true)
    private LocalDateTime deletedAt;
}
