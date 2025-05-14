package com.worldbeesion.beecareful.beehive.model.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Table(name = "beehives")
// 벌통
public class Beehive {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "beehive_id")
    private Long id;

    @JoinColumn(name = "apiary_id", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    private Apiary apiary;

    @Column(name = "nickname", length = 100, nullable = false)
    private String nickname;

    @CreatedDate
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "hornet_appeared_at")
    private LocalDateTime hornetAppearedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "x_direction", nullable = false)
    private Long xDirection;

    @Column(name = "y_direction", nullable = false)
    private Long yDirection;

    @Column(name = "isInfected", nullable = false)
    private Boolean isInfected;

    public void updateNickname(String newNickname) {
        if (newNickname != null && !newNickname.isBlank()) {
            this.nickname = newNickname;
        }
    }

    public void updateDirection(Long newXDirection, Long newYDirection) {
        if (newXDirection != null && newYDirection != null) {
            this.xDirection = newXDirection;
            this.yDirection = newYDirection;
        }

    }

    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }

}
