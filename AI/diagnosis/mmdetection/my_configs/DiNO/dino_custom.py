
# Configuration for DINO adapted to DiseaseDataset (same dataset as CoDETR)

_base_ = [
    '../../configs/_base_/datasets/coco_detection.py',
    '../../configs/_base_/default_runtime.py'
]

# Checkpoint loading and output directory
load_from = 'https://download.openmmlab.com/mmdetection/v3.0/dino/dino-5scale_swin-l_8xb2-12e_coco/dino-5scale_swin-l_8xb2-12e_coco_20230228_072924-a654145f.pth'
work_dir = '/home/j-k12a203/Disease/level2-objectdetection-cv-05/mmdetection/work_dirs/dino'

# Imports for custom dataset and CoDETR components
custom_imports = dict(
    imports=[
        'projects.custom_dataset',      # 이미지 누락 건너뛰기 데이터셋
        'projects.CO-DETR.codetr'       # CoDETR 모델 구현체 (required by some utilities)
    ],
    allow_failed_imports=False
)

# Dataset settings (7 disease classes)
num_classes = 7
image_size = (1024, 1024)
classes = (
    "유충_정상", "유충_응애", "유충_석고병", "유충_부저병",
    "성충_정상", "성충_응애", "성충_날개불구바이러스감염증"
)

dataset_type = 'CocoDatasetSkipMissing'
data_root = '/home/j-k12a203/DiseaseDataset'
train_ann_file = 'annotations/train.json'
val_ann_file   = 'annotations/val_stratified.json'
test_ann_file  = 'test.json'
img_folder     = 'images'
metainfo = dict(classes=classes)

# Model: DINO with Swin-L backbone
pretrained = 'https://github.com/SwinTransformer/storage/releases/download/v1.0.0/swin_large_patch4_window12_384_22k.pth'
model = dict(
    type='DINO',
    num_queries=900,
    with_box_refine=True,
    as_two_stage=True,
    data_preprocessor=dict(
        type='DetDataPreprocessor',
        mean=[123.675, 116.28, 103.53],
        std=[58.395, 57.12, 57.375],
        bgr_to_rgb=True,
        pad_size_divisor=1
    ),
    num_feature_levels=5,
    backbone=dict(
        type='SwinTransformer',
        pretrain_img_size=384,
        embed_dims=192,
        depths=[2, 2, 18, 2],
        num_heads=[6, 12, 24, 48],
        window_size=12,
        mlp_ratio=4,
        qkv_bias=True,
        drop_path_rate=0.2,
        patch_norm=True,
        out_indices=(0, 1, 2, 3),
        with_cp=True,
        convert_weights=True,
        init_cfg=dict(type='Pretrained', checkpoint=pretrained)
    ),
    neck=dict(
        type='ChannelMapper',
        in_channels=[192, 384, 768, 1536],
        kernel_size=1,
        out_channels=256,
        norm_cfg=dict(type='GN', num_groups=32),
        num_outs=5
    ),
    encoder=dict(
        num_layers=6,
        layer_cfg=dict(
            self_attn_cfg=dict(embed_dims=256, num_levels=5, dropout=0.0),
            ffn_cfg=dict(embed_dims=256, feedforward_channels=2048, ffn_drop=0.0)
        )
    ),
    decoder=dict(
        num_layers=6,
        return_intermediate=True,
        layer_cfg=dict(
            self_attn_cfg=dict(embed_dims=256, num_heads=8, dropout=0.0),
            cross_attn_cfg=dict(embed_dims=256, num_levels=5, dropout=0.0),
            ffn_cfg=dict(embed_dims=256, feedforward_channels=2048, ffn_drop=0.0)
        ),
        post_norm_cfg=None
    ),
    positional_encoding=dict(num_feats=128, normalize=True, offset=0.0, temperature=20),
    bbox_head=dict(
        type='DINOHead',
        num_classes=num_classes,
        sync_cls_avg_factor=True,
        loss_cls=dict(type='FocalLoss', use_sigmoid=True, gamma=2.0, alpha=0.25, loss_weight=1.0),
        loss_bbox=dict(type='L1Loss', loss_weight=5.0),
        loss_iou=dict(type='GIoULoss', loss_weight=2.0)
    ),
    dn_cfg=dict(label_noise_scale=0.5, box_noise_scale=1.0, group_cfg=dict(dynamic=True, num_groups=None, num_dn_queries=100)),
    train_cfg=dict(
        assigner=dict(
            type='HungarianAssigner',
            match_costs=[
                dict(type='FocalLossCost', weight=2.0),
                dict(type='BBoxL1Cost', weight=5.0, box_format='xywh'),
                dict(type='IoUCost', iou_mode='giou', weight=2.0)
            ]
        )
    ),
    test_cfg=dict(max_per_img=300)
)

# Data pipelines
train_pipeline = [
    dict(type='LoadImageFromFile'),
    dict(type='LoadAnnotations', with_bbox=True),
    dict(type='Resize', scale=image_size, keep_ratio=True),
    dict(type='RandomFlip', prob=0.5),
    # dict(type='RandAugment', aug_space=[
    #     [dict(type='ColorTransform')],
    #     [dict(type='AutoContrast')],
    #     [dict(type='Equalize')],
    #     [dict(type='Sharpness')],
    #     [dict(type='Posterize')],
    #     [dict(type='Solarize')],
    #     [dict(type='Color')],
    #     [dict(type='Contrast')],
    #     [dict(type='Brightness')]
    # ], aug_num=1),
    dict(type='Pad', size=image_size, pad_val=dict(img=(114, 114, 114))),
    dict(type='PackDetInputs')
]

test_pipeline = [
    dict(type='LoadImageFromFile'),
    dict(type='Resize', scale=image_size, keep_ratio=True),
    dict(type='Pad', size=image_size, pad_val=dict(img=(114, 114, 114))),
    dict(type='LoadAnnotations', with_bbox=True),
    dict(type='PackDetInputs', meta_keys=('img_id', 'img_path', 'ori_shape', 'img_shape', 'scale_factor'))
]

# Dataloaders


train_dataloader = dict(
    batch_size=2,
    num_workers=4,
    persistent_workers=True,
    sampler=dict(type='DefaultSampler', shuffle=True),
    batch_sampler=dict(type='AspectRatioBatchSampler'),
    dataset=dict(
        type=dataset_type,
        metainfo=metainfo,
        ann_file=f"{data_root}/{train_ann_file}",
        data_prefix=dict(img=f"{data_root}/{img_folder}"),
        pipeline=train_pipeline
    )
)


val_dataloader = dict(
    batch_size=8,
    num_workers=4,
    persistent_workers=True,
    drop_last=False,
    sampler=dict(type='DefaultSampler', shuffle=False),
    dataset=dict(
        type=dataset_type,
        metainfo=metainfo,
        data_root=data_root,
        ann_file=val_ann_file,
        data_prefix=dict(img=img_folder),
        test_mode=True,
        pipeline=test_pipeline
    )
)
test_dataloader = dict(
    batch_size=1,
    num_workers=4,
    persistent_workers=True,
    sampler=dict(type='DefaultSampler', shuffle=False),
    dataset=dict(
        type=dataset_type,
        metainfo=metainfo,
        data_root=data_root,
        ann_file=test_ann_file,
        data_prefix=dict(img=img_folder),
        pipeline=test_pipeline
    )
)

# 올바른 val/test evaluator 오버라이드
val_evaluator = dict(
    type='CocoMetric',
    ann_file=f"{data_root}/{val_ann_file}",
    metric=['bbox'],
    format_only=False,
    classwise=True
)
test_evaluator = dict(
    type='CocoMetric',
    ann_file=f"{data_root}/{test_ann_file}",
    metric=['bbox'],
    format_only=False,
    classwise=True
)


# Optimizer and schedule
optim_wrapper = dict(
    type='OptimWrapper',
    optimizer=dict(type='AdamW', lr=1e-4, weight_decay=1e-4),
    clip_grad=dict(max_norm=0.1, norm_type=2),
    accumulative_counts=8,
    paramwise_cfg=dict(custom_keys={'backbone': dict(lr_mult=0.1)})
)
max_epochs = 25
iters_per_epoch = 61984

max_iters = iters_per_epoch * max_epochs

train_cfg = dict(
    type='IterBasedTrainLoop',
    max_iters=max_iters,
    val_interval=4000,
)
val_cfg   = dict(type='ValLoop')
test_cfg  = dict(type='TestLoop')
param_scheduler = [
    dict(type='CosineAnnealingLR', eta_min=0.0, begin=0, end=max_epochs, T_max=max_epochs, by_epoch=True)
]

# Hooks and visualization
default_hooks = dict(
    # default_scope = 'mmdet',
    timer=dict(type='IterTimerHook'),
    logger=dict(type='LoggerHook', interval=50),
    param_scheduler=dict(type='ParamSchedulerHook'),
    checkpoint=dict(
        type='CheckpointHook',
        interval=4000, 
        save_best='coco/bbox_mAP_50',
        max_keep_ckpts=2
    ),
    sampler_seed=dict(type='DistSamplerSeedHook'),
    visualization=dict(type='DetVisualizationHook')
)
log_processor = dict(
    type='LogProcessor',
    by_epoch=True,
    window_size=50)

# 1) 위에서 선언한 vis_backends 변수를 그대로 사용
vis_backends = [
    dict(type='LocalVisBackend', save_dir='visualizations'),
    dict(
        type='WandbVisBackend',
        init_kwargs=dict(project='Disease', name='Dino_Swin_L')
    ),
]

# 2) 기본 visualizer를 이 vis_backends로 교체
visualizer = dict(
    type='DetLocalVisualizer',
    vis_backends=vis_backends,
    name='visualizer'
)

auto_scale_lr = dict(base_batch_size=2)
fp16 = dict(loss_scale=512.)

# Reproducibility
seed = 42
randomness = dict(seed=seed)
