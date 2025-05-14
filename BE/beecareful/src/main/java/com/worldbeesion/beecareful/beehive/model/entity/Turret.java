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
@Table(name = "turrets")
public class Turret {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "turret_id")
    private Long id;

    @JoinColumn(name = "beehive_id", nullable = false)
    @OneToOne(fetch = FetchType.LAZY)
    private Beehive beehive;

    @Column(name = "serial", length = 100, nullable = false)
    private String serial;

    public void updateTurret(String serial) {
        this.serial = serial;
    }
}
