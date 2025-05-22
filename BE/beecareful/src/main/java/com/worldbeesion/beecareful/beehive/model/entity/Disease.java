package com.worldbeesion.beecareful.beehive.model.entity;


import com.worldbeesion.beecareful.beehive.constant.BeeStage;
import com.worldbeesion.beecareful.beehive.constant.DiseaseName;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Table(name = "Diseases")
// 양봉장
public class Disease {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "disease_id")
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "name", nullable = false, length = 200)
    private DiseaseName name;

    @Enumerated(EnumType.STRING)
    @Column(name = "stage")
    private BeeStage stage;
}
