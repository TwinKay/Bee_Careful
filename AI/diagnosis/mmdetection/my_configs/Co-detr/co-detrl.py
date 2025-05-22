load_from = 'https://download.openmmlab.com/mmdetection/v3.0/codetr/co_dino_5scale_lsj_swin_large_1x_coco-3af73af2.pth'
work_dir = '/home/j-k12a203/Disease/level2-objectdetection-cv-05/mmdetection/work_dirs/codetr'


# custom_imports = dict(
#     imports=['projects.CO-DETR.codetr'], allow_failed_imports=False)
custom_imports = dict(
    imports=[
        'projects.custom_dataset',      # 이미지 누락 건너뛰기 데이터셋
        'projects.CO-DETR.codetr'       # CoDETR 모델 구현체
    ],
    allow_failed_imports=False
)


# data settings
num_classes = 7
image_size = (1024, 1024)
classes = ("유충_정상", "유충_응애", "유충_석고병", "유충_부저병", "성충_정상", 
           "성충_응애", "성충_날개불구바이러스감염증")


# dataset_type = 'CocoDataset'
dataset_type = 'CocoDatasetSkipMissing'
data_root = '/home/j-k12a203/DiseaseDataset'
train_ann_file_name = "annotations/train.json"
val_ann_file_name = "annotations/val.json"
test_ann_file_name = "test.json"
img_folder = "images"


# model settings
num_dec_layer = 6
loss_lambda = 2.0

batch_augments = [
    dict(type='BatchFixedSizePad', size=image_size, pad_mask=True)
]
model = dict(
    type='CoDETR',
    # If using the lsj augmentation,
    # it is recommended to set it to True.
    use_lsj=True,
    eval_module='detr',  # in ['detr', 'one-stage', 'two-stage']
    data_preprocessor=dict(
        type='DetDataPreprocessor',
        mean=[123.675, 116.28, 103.53],
        std=[58.395, 57.12, 57.375],
        bgr_to_rgb=True,
        pad_mask=False,
        batch_augments=None),
    backbone=dict(
        type='SwinTransformer',
        pretrain_img_size=384,
        embed_dims=192,
        depths=[2, 2, 18, 2],
        num_heads=[6, 12, 24, 48],
        window_size=12,
        mlp_ratio=4,
        qkv_bias=True,
        qk_scale=None,
        drop_rate=0.,
        attn_drop_rate=0.,
        drop_path_rate=0.5,
        patch_norm=True,
        out_indices=(0, 1, 2, 3),
        with_cp=False,
        convert_weights=True),
    neck=dict(
        type='ChannelMapper',
        in_channels=[192, 384, 768, 1536],
        kernel_size=1,
        out_channels=256,
        act_cfg=None,
        norm_cfg=dict(type='GN', num_groups=32),
        num_outs=5),
    query_head=dict(
        type='CoDINOHead',
        num_query=900,
        num_classes=num_classes,
        in_channels=2048,
        as_two_stage=True,
        dn_cfg=dict(
            label_noise_scale=0.5,
            box_noise_scale=1.0,
            group_cfg=dict(dynamic=True, num_groups=None, num_dn_queries=100)),
        transformer=dict(
            type='CoDinoTransformer',
            with_coord_feat=False,
            num_co_heads=2,  # ATSS Aux Head + Faster RCNN Aux Head
            num_feature_levels=5,
            encoder=dict(
                type='DetrTransformerEncoder',
                num_layers=6,
                # number of layers that use checkpoint.
                # The maximum value for the setting is num_layers.
                # FairScale must be installed for it to work.
                with_cp=6,
                transformerlayers=dict(
                    type='BaseTransformerLayer',
                    attn_cfgs=dict(
                        type='MultiScaleDeformableAttention',
                        embed_dims=256,
                        num_levels=5,
                        dropout=0.0),
                    feedforward_channels=2048,
                    ffn_dropout=0.0,
                    operation_order=('self_attn', 'norm', 'ffn', 'norm'))),
            decoder=dict(
                type='DinoTransformerDecoder',
                num_layers=6,
                return_intermediate=True,
                transformerlayers=dict(
                    type='DetrTransformerDecoderLayer',
                    attn_cfgs=[
                        dict(
                            type='MultiheadAttention',
                            embed_dims=256,
                            num_heads=8,
                            dropout=0.0),
                        dict(
                            type='MultiScaleDeformableAttention',
                            embed_dims=256,
                            num_levels=5,
                            dropout=0.0),
                    ],
                    feedforward_channels=2048,
                    ffn_dropout=0.0,
                    operation_order=('self_attn', 'norm', 'cross_attn', 'norm',
                                     'ffn', 'norm')))),
        positional_encoding=dict(
            type='SinePositionalEncoding',
            num_feats=128,
            temperature=20,
            normalize=True),
        loss_cls=dict(  # Different from the DINO
            type='QualityFocalLoss',
            use_sigmoid=True,
            beta=2.0,
            loss_weight=1.0),
        loss_bbox=dict(type='L1Loss', loss_weight=5.0),
        loss_iou=dict(type='GIoULoss', loss_weight=2.0)),
    rpn_head=dict(
        type='RPNHead',
        in_channels=256,
        feat_channels=256,
        anchor_generator=dict(
            type='AnchorGenerator',
            octave_base_scale=4,
            scales_per_octave=3,
            ratios=[0.5, 1.0, 2.0],
            strides=[4, 8, 16, 32, 64, 128]),
        bbox_coder=dict(
            type='DeltaXYWHBBoxCoder',
            target_means=[.0, .0, .0, .0],
            target_stds=[1.0, 1.0, 1.0, 1.0]),
        loss_cls=dict(
            type='CrossEntropyLoss',
            use_sigmoid=True,
            loss_weight=1.0 * num_dec_layer * loss_lambda),
        loss_bbox=dict(
            type='L1Loss', loss_weight=1.0 * num_dec_layer * loss_lambda)),
    roi_head=[
        dict(
            type='CoStandardRoIHead',
            bbox_roi_extractor=dict(
                type='SingleRoIExtractor',
                roi_layer=dict(
                    type='RoIAlign', output_size=7, sampling_ratio=0),
                out_channels=256,
                featmap_strides=[4, 8, 16, 32, 64],
                finest_scale=56),
            bbox_head=dict(
                type='Shared2FCBBoxHead',
                in_channels=256,
                fc_out_channels=1024,
                roi_feat_size=7,
                num_classes=num_classes,
                bbox_coder=dict(
                    type='DeltaXYWHBBoxCoder',
                    target_means=[0., 0., 0., 0.],
                    target_stds=[0.1, 0.1, 0.2, 0.2]),
                reg_class_agnostic=False,
                reg_decoded_bbox=True,
                loss_cls=dict(
                    type='CrossEntropyLoss',
                    use_sigmoid=False,
                    loss_weight=1.0 * num_dec_layer * loss_lambda),
                loss_bbox=dict(
                    type='GIoULoss',
                    loss_weight=10.0 * num_dec_layer * loss_lambda)))
    ],
    bbox_head=[
        dict(
            type='CoATSSHead',
            num_classes=num_classes,
            in_channels=256,
            stacked_convs=1,
            feat_channels=256,
            anchor_generator=dict(
                type='AnchorGenerator',
                ratios=[1.0],
                octave_base_scale=8,
                scales_per_octave=1,
                strides=[4, 8, 16, 32, 64, 128]),
            bbox_coder=dict(
                type='DeltaXYWHBBoxCoder',
                target_means=[.0, .0, .0, .0],
                target_stds=[0.1, 0.1, 0.2, 0.2]),
            loss_cls=dict(
                type='FocalLoss',
                use_sigmoid=True,
                gamma=2.0,
                alpha=0.25,
                loss_weight=1.0 * num_dec_layer * loss_lambda),
            loss_bbox=dict(
                type='GIoULoss',
                loss_weight=2.0 * num_dec_layer * loss_lambda),
            loss_centerness=dict(
                type='CrossEntropyLoss',
                use_sigmoid=True,
                loss_weight=1.0 * num_dec_layer * loss_lambda)),
    ],
    # model training and testing settings
    train_cfg=[
        dict(
            assigner=dict(
                type='HungarianAssigner',
                match_costs=[
                    dict(type='FocalLossCost', weight=2.0),
                    dict(type='BBoxL1Cost', weight=5.0, box_format='xywh'),
                    dict(type='IoUCost', iou_mode='giou', weight=2.0)
                ])),
        dict(
            rpn=dict(
                assigner=dict(
                    type='MaxIoUAssigner',
                    pos_iou_thr=0.7,
                    neg_iou_thr=0.3,
                    min_pos_iou=0.3,
                    match_low_quality=True,
                    ignore_iof_thr=-1),
                sampler=dict(
                    type='RandomSampler',
                    num=256,
                    pos_fraction=0.5,
                    neg_pos_ub=-1,
                    add_gt_as_proposals=False),
                allowed_border=-1,
                pos_weight=-1,
                debug=False),
            rpn_proposal=dict(
                nms_pre=4000,
                max_per_img=1000,
                nms=dict(type='nms', iou_threshold=0.7),
                min_bbox_size=0),
            rcnn=dict(
                assigner=dict(
                    type='MaxIoUAssigner',
                    pos_iou_thr=0.5,
                    neg_iou_thr=0.5,
                    min_pos_iou=0.5,
                    match_low_quality=False,
                    ignore_iof_thr=-1),
                sampler=dict(
                    type='RandomSampler',
                    num=512,
                    pos_fraction=0.25,
                    neg_pos_ub=-1,
                    add_gt_as_proposals=True),
                pos_weight=-1,
                debug=False)),
        dict(
            assigner=dict(type='ATSSAssigner', topk=9),
            allowed_border=-1,
            pos_weight=-1,
            debug=False)
    ],
    test_cfg=[
        # Deferent from the DINO, we use the NMS.
        dict(
            max_per_img=300,
            # NMS can improve the mAP by 0.2.
            nms=dict(type='soft_nms', iou_threshold=0.8)),
        dict(
            rpn=dict(
                nms_pre=1000,
                max_per_img=1000,
                nms=dict(type='nms', iou_threshold=0.7),
                min_bbox_size=0),
            rcnn=dict(
                score_thr=0.05,
                nms=dict(type='nms', iou_threshold=0.5),
                max_per_img=100)),
        dict(
            # atss bbox head:
            nms_pre=1000,
            min_bbox_size=0,
            score_thr=0.05,
            nms=dict(type='nms', iou_threshold=0.6),
            max_per_img=100),
        # soft-nms is also supported for rcnn testing
        # e.g., nms=dict(type='soft_nms', iou_threshold=0.5, min_score=0.05)
    ])


# LSJ + CopyPaste
backend_args = None
color_space = [
    [dict(type='ColorTransform')],
    [dict(type='AutoContrast')],
    [dict(type='Equalize')],
    [dict(type='Sharpness')],
    [dict(type='Posterize')],
    [dict(type='Solarize')],
    [dict(type='Color')],
    [dict(type='Contrast')],
    [dict(type='Brightness')],
]
train_dataloader = dict(
    batch_size=1,
    num_workers=2,
    persistent_workers=True,
    sampler=dict(type='DefaultSampler', shuffle=True),
    batch_sampler=dict(type='AspectRatioBatchSampler'),
    dataset=dict(
        # 1) LSJ/Mosaic 적용용 wrapper
        type='MultiImageMixDataset',
        dataset=dict(
            # 2) 부족 클래스 oversampling
            type='ClassBalancedDataset',
            oversample_thr=0.05,
            dataset=dict(
                # 3) 실제 COCO 포맷 데이터
                type='CocoDatasetSkipMissing',
                metainfo=dict(classes=classes),
                data_root=data_root,
                ann_file=train_ann_file_name,
                data_prefix=dict(img=img_folder),
                filter_cfg=dict(filter_empty_gt=False, min_size=32),
                pipeline=[
                    dict(type='LoadImageFromFile'),
                    dict(type='LoadAnnotations', with_bbox=True)
                ]
            )
        ),
        pipeline=[
            dict(type='Mosaic', img_scale=image_size, prob=0.5),
            dict(
                type='RandomResize',
                scale=image_size,
                ratio_range=(0.5, 2.0),
                keep_ratio=True
            ),
            dict(
                type='RandomCrop',
                crop_type='absolute_range',
                crop_size=image_size,
                recompute_bbox=True,
                allow_negative_crop=True
            ),
            dict(type='FilterAnnotations', min_gt_bbox_wh=(1e-2, 1e-2)),
            dict(type='RandomFlip', prob=0.5),
            dict(type='Pad', size=image_size, pad_val=dict(img=(114,114,114))),
            dict(type='PackDetInputs')
        ]
    )
)



# train_pipeline = [
#     dict(type='Mosaic', img_scale=(1024, 1024), prob=1.0),
#     dict(
#         type='RandomResize',
#         scale=image_size,
#         ratio_range=(0.1, 2.0),
#         keep_ratio=True),
#     dict(
#         type='RandomCrop',
#         crop_type='absolute_range',
#         crop_size=image_size,
#         recompute_bbox=True,
#         allow_negative_crop=True),
#     dict(type='FilterAnnotations', min_gt_bbox_wh=(1e-2, 1e-2)),
#     dict(type='RandomFlip', prob=0.5),
#     dict(type='RandAugment', aug_space=color_space, aug_num=1),
#     dict(type='Pad', size=image_size, pad_val=dict(img=(114, 114, 114))),
#     dict(type='PackDetInputs')
# ]


# train_dataloader = dict(
#     batch_size=1,
#     num_workers=2,
#     persistent_workers=True,
#     sampler=dict(type='DefaultSampler', shuffle=True),
#     batch_sampler=dict(type='AspectRatioBatchSampler'),
#     dataset=dict(
#         # use MultiImageMixDataset wrapper to support mosaic and mixup
#         type='MultiImageMixDataset',
#         dataset=dict(
#             type=dataset_type,
#             metainfo=dict(classes=classes),
#             data_root=data_root,
#             ann_file=train_ann_file_name,
#             data_prefix=dict(img=img_folder),
#             pipeline=[
#                 dict(type='LoadImageFromFile', backend_args=backend_args),
#                 dict(type='LoadAnnotations', with_bbox=True)
#             ],
#             filter_cfg=dict(filter_empty_gt=False, min_size=32)),
#         pipeline=train_pipeline)
# )


test_pipeline = [
    dict(type='LoadImageFromFile'),
    dict(type='Resize', scale=image_size, keep_ratio=True),
    dict(type='Pad', size=image_size, pad_val=dict(img=(114, 114, 114))),
    dict(type='LoadAnnotations', with_bbox=True, with_mask=False),
    dict(
        type='PackDetInputs',
        meta_keys=('img_id', 'img_path', 'ori_shape', 'img_shape',
                   'scale_factor'))
]
tta_model = dict(
    type='DetTTAModel',
    tta_cfg=dict(nms=dict(
                   type='nms',
                   iou_threshold=0.5),
                   max_per_img=300))

img_scales = [(1333, 800), (666, 400), (2000, 1200)]
tta_pipeline = [
    dict(type='LoadImageFromFile',
         backend_args=None),
    dict(
        type='TestTimeAug',
        transforms=[[
            dict(type='Resize', scale=s, keep_ratio=True) for s in img_scales
        ], [
            dict(type='RandomFlip', prob=1.),
            dict(type='RandomFlip', prob=0.)
        ], [
            dict(
               type='PackDetInputs',
               meta_keys=('img_id', 'img_path', 'ori_shape',
                       'img_shape', 'scale_factor', 'flip',
                       'flip_direction'))
       ]])]
val_dataloader = dict(
    batch_size=1,
    num_workers=2,
    persistent_workers=True,
    drop_last=False,
    sampler=dict(type='DefaultSampler', shuffle=False),
    dataset=dict(
        type=dataset_type,
        metainfo=dict(classes=classes),
        data_root=data_root,
        ann_file=val_ann_file_name,
        data_prefix=dict(img=img_folder),
        test_mode=True,
        pipeline=test_pipeline,
        backend_args=backend_args))
test_dataloader = (
    dict(
        batch_size=1,
        num_workers=2,
        dataset=dict(
            data_root=data_root,
            ann_file='test.json',
            data_prefix=dict(img=''),
            pipeline=tta_pipeline,
            metainfo=dict(classes=classes))))


val_evaluator = dict(
    type='CocoMetric',
    ann_file=data_root + "/" + val_ann_file_name,
    metric='bbox',
    format_only=False,
    backend_args=backend_args)

test_evaluator = dict(
    type='CustomResultDumping',
    img_prefix="/home/j-k12a203/DiseaseDataset/images/",
    outfile_path='/home/j-k12a203/Disease/level2-objectdetection-cv-05/mmdetection/work_dirs/co-detr-test-result',
    classes=classes
    )


################################ training setting
optim_wrapper = dict(
    type='OptimWrapper',
    optimizer=dict(type='AdamW', lr=2e-4, weight_decay=0.0001),
    clip_grad=dict(max_norm=0.1, norm_type=2),
    accumulative_counts=2,
    paramwise_cfg=dict(custom_keys={'backbone': dict(lr_mult=0.1)}))


max_epochs = 12
train_cfg = dict(
    type='EpochBasedTrainLoop',
    max_epochs=max_epochs,
    val_interval=1)
val_cfg = (dict(type='ValLoop'))
test_cfg = (dict(type='TestLoop'))

param_scheduler = [
    dict(
        type='MultiStepLR',
        begin=0,
        end=max_epochs,
        by_epoch=True,
        milestones=[11],
        gamma=0.1)
]


###################################### hooks
default_scope = 'mmdet'
default_hooks = dict(
    timer=dict(type='IterTimerHook'),
    logger=dict(type='LoggerHook', interval=50),
    param_scheduler=dict(type='ParamSchedulerHook'),
    checkpoint=dict(type='CheckpointHook', 
                    interval=1,
                    save_best='coco/bbox_mAP_50',
                    max_keep_ckpts=2),
    sampler_seed=dict(type='DistSamplerSeedHook'),
    visualization=dict(type='DetVisualizationHook'))
log_processor = dict(
    type='LogProcessor',
    by_epoch=True,
    window_size=50)



vis_backends = [
    dict(type='LocalVisBackend', save_dir='visualizations'),
    dict(type='WandbVisBackend',
         init_kwargs={
            'project': 'Disease',
            'name': 'Co_DETR'
         })
]
visualizer = dict(
    type='DetLocalVisualizer',
    vis_backends=vis_backends,
    name='visualizer')

# NOTE: `auto_scale_lr` is for automatically scaling LR,
# USER SHOULD NOT CHANGE ITS VALUES.
# base_batch_size = (8 GPUs) x (2 samples per GPU)
auto_scale_lr = dict(base_batch_size=16)
fp16 = dict(loss_scale=512.)


######### seed ########
seed = 42
randomness = dict(
    seed = seed
)