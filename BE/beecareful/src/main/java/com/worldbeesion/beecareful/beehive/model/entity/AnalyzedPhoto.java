package com.worldbeesion.beecareful.beehive.model.entity;


import com.worldbeesion.beecareful.s3.model.entity.S3FileMetadata;
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
@Table(name = "analyzed_photos")
public class AnalyzedPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "analyzed_photo_id")
    private Long id;

    @OneToOne
    @JoinColumn(name = "original_photo_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private OriginalPhoto originalPhoto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diagnosis_id", nullable = false)
    private Diagnosis diagnosis;

    @OneToOne
    @JoinColumn(name = "s3_file_metadata_id", nullable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private S3FileMetadata s3FileMetadata;

    @Column(name = "imago_count", nullable = false)
    private Long imagoCount;

    @Column(name = "larva_count", nullable = false)
    private Long larvaCount;

}
