package com.worldbeesion.beecareful.beehive.model.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Table(name = "Diagnoses")
public class Diagnosis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "diagnosis_id")
    private Long id;

    @JoinColumn(name = "beehive_id", nullable = false)
    @OneToOne(fetch = FetchType.LAZY)
    private Beehive beehive;

    @CreatedDate
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "imago_count")
    private Long imagoCount;

    @Column(name = "larva_count")
    private Long larvaCount;

    public void setImagoCount(Long imagoCount) {
        this.imagoCount = imagoCount;
    }

    public void setLarvaCount(Long larvaCount) {
        this.larvaCount = larvaCount;
    }
}
