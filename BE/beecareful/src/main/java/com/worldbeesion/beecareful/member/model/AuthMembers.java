package com.worldbeesion.beecareful.member.model;

import jakarta.persistence.*;

@Entity
@Table(name = "auth_members")
public class AuthMembers {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "auth_member_id")
    private Long id;

    @OneToOne
    @JoinColumn(name= "member_id", nullable = false)
    private Members member;

    @Column(name="member_login_id", nullable = false)
    private String loginId;

    @Column(name="password", nullable = false)
    private String password;
}
