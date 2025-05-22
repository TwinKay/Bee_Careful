_base_ = [
    '../../configs/_base_/datasets/coco_detection.py',
    '../../configs/_base_/default_runtime.py'
]

###########################################################################
# Model
###########################################################################
pretrained = 'https://github.com/SwinTransformer/storage/releases/download/v1.0.0/' \
             'swin_large_patch4_window12_384_22k.pth'

model = dict(
    type='DETR',  # top-level detector

    data_preprocessor=dict(
        type='DetDataPreprocessor',
        mean=[123.675, 116.28, 103.53],
        std=[58.395, 57.12, 57.375],
        bgr_to_rgb=True,
        pad_size_divisor=1
    ),

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
        out_indices=(3,),              # 마지막 스테이지만 사용
        with_cp=True,
        convert_weights=True,
        init_cfg=dict(type='Pretrained', checkpoint=pretrained)
    ),

    # DETR는 neck 없이 단일 스케일(feature) 사용
    bbox_head=dict(
        type='DETRHead',
        num_classes=7,                 # (배경 제외) 클래스 수
        in_channels=1536,              # Swin-L 마지막 스테이지 채널 수
        num_query=100,                 # Transformer query 개수 :contentReference[oaicite:0]{index=0}
        num_reg_fcs=2,

        transformer=dict(
            type='DetrTransformer',
            embed_dims=256,
            encoder=dict(num_layers=6),
            decoder=dict(num_layers=6, return_intermediate=True),
            act_cfg=dict(type='ReLU', inplace=True)
        ),

        sync_cls_avg_factor=False,     # multi-gpu 시 클래스 평균 동기화 여부
        positional_encoding=dict(
            type='SinePositionalEncoding',
            num_feats=128,
            normalize=True
        ),

        loss_cls=dict(
            type='CrossEntropyLoss',
            use_sigmoid=False,
            loss_weight=1.0
        ),
        loss_bbox=dict(type='L1Loss', loss_weight=5.0),
        loss_iou=dict(type='GIoULoss', iou_mode='giou', loss_weight=2.0),

        train_cfg=dict(
            assigner=dict(
                type='HungarianAssigner',
                cls_cost=dict(type='ClassificationCost', weight=1.0),
                reg_cost=dict(type='BBoxL1Cost', weight=5.0, box_format='xywh'),
                iou_cost=dict(type='IoUCost', iou_mode='giou', weight=2.0)
            )
        ),
        test_cfg=dict(max_per_img=100)
    )
)

###########################################################################
# Pipeline & DataLoader
###########################################################################
data_root = '/home/j-k12a203/aihub'
metainfo = {
    'classes': (
        "유충_정상", "유충_응애", "유충_석고병", "유충_부저병",
        "성충_정상", "성충_응애", "성충_날개불구바이러스감염증",
    )
}

image_size = (640, 640)
train_pipeline = [
    dict(type='LoadImageFromFile'),
    dict(type='LoadAnnotations', with_bbox=True),
    dict(type='Resize', scale=image_size, keep_ratio=True),
    dict(type='RandomFlip', prob=0.5),
    dict(
        type='RandomResize',
        scale=image_size,
        ratio_range=(0.1, 2.0),
        keep_ratio=True
    ),
    dict(
        type='RandomCrop',
        crop_type='absolute_range',
        crop_size=image_size,
        recompute_bbox=True,
        allow_negative_crop=True
    ),
    dict(type='PackDetInputs')
]
test_pipeline = [
    dict(type='LoadImageFromFile'),
    dict(type='Resize', scale=image_size, keep_ratio=True),
    dict(type='LoadAnnotations', with_bbox=True),
    dict(
        type='PackDetInputs',
        meta_keys=('img_id','img_path','ori_shape','img_shape','scale_factor')
    )
]

train_dataloader = dict(
    batch_size=4,
    num_workers=4,
    persistent_workers=True,
    sampler=dict(type='DefaultSampler', shuffle=True),
    batch_sampler=dict(type='AspectRatioBatchSampler'),
    dataset=dict(
        type='CocoDataset',
        data_root=data_root,
        ann_file='label/train.json',
        data_prefix=dict(img='image/train'),
        filter_cfg=dict(filter_empty_gt=True, min_size=32),
        pipeline=train_pipeline,
        metainfo=metainfo
    )
)
val_dataloader = dict(
    batch_size=8,
    num_workers=4,
    persistent_workers=True,
    sampler=dict(type='DefaultSampler', shuffle=False),
    dataset=dict(
        type='CocoDataset',
        data_root=data_root,
        ann_file='label/val.json',
        data_prefix=dict(img='image/val'),
        filter_cfg=dict(filter_empty_gt=True, min_size=32),
        pipeline=test_pipeline,
        metainfo=metainfo
    )
)
test_dataloader = dict(
    batch_size=8,
    num_workers=4,
    persistent_workers=True,
    sampler=dict(type='DefaultSampler', shuffle=False),
    dataset=dict(
        type='CocoDataset',
        data_root=data_root,
        ann_file='label/test.json',
        data_prefix=dict(img='image/test'),
        filter_cfg=dict(filter_empty_gt=True, min_size=32),
        pipeline=test_pipeline,
        metainfo=metainfo
    )
)

###########################################################################
# Evaluator
###########################################################################
val_evaluator = dict(
    type='CocoMetric',
    ann_file=f'{data_root}/label/val.json',
    metric=['bbox'],
    classwise=True
)
test_evaluator = dict(
    type='CocoMetric',
    ann_file=f'{data_root}/label/test.json',
    metric=['bbox'],
    classwise=True
)

###########################################################################
# Schedule & Optimizer
###########################################################################
optim_wrapper = dict(
    type='OptimWrapper',
    optimizer=dict(type='AdamW', lr=1e-4, weight_decay=1e-4),
    clip_grad=dict(max_norm=0.1, norm_type=2),
    paramwise_cfg=dict(custom_keys={'backbone': dict(lr_mult=0.1)})
)

max_epochs = 25
train_cfg = dict(type='EpochBasedTrainLoop', max_epochs=max_epochs, val_interval=1)
val_cfg   = dict(type='ValLoop')
test_cfg  = dict(type='TestLoop')

param_scheduler = [
    dict(
        type='CosineAnnealingLR',
        eta_min=0.0,
        begin=0,
        T_max=max_epochs,
        by_epoch=True,
        convert_to_iter_based=True
    )
]

###########################################################################
# Visualizer & Hooks
###########################################################################
vis_backends = [
    dict(type='LocalVisBackend', save_dir='visualizations'),
    dict(type='WandbVisBackend', init_kwargs=dict(project='Disease', name='DETR_SwinL'))
]
visualizer = dict(type='DetLocalVisualizer', vis_backends=vis_backends)

work_dir = './work_dirs/detr_swin_L_640'
auto_scale_lr = dict(base_batch_size=2)
fp16 = dict(loss_scale=512.)
