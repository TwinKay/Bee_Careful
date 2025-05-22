# optimizer
optim_wrapper = dict(
    type='OptimWrapper',
    optimizer=dict(type='AdamW', lr=2e-4, weight_decay=0.0001),
    clip_grad=dict(max_norm=0.1, norm_type=2),
    accumulative_counts=2,
    paramwise_cfg=dict(custom_keys={'backbone': dict(lr_mult=0.1)}))


# learning policy
max_epochs = 36  # 에폭 수 증가
train_cfg = dict(
    type='EpochBasedTrainLoop', 
    max_epochs=max_epochs, 
    val_interval=1)

val_cfg = dict(type='ValLoop')
test_cfg = dict(type='TestLoop')

param_scheduler = [
     dict(
        type='CosineAnnealingLR',
        eta_min=0.0,
        begin=0,
        T_max=max_epochs,
        end=max_epochs,
        by_epoch=True,
        convert_to_iter_based=True)
]


# NOTE: `auto_scale_lr` is for automatically scaling LR,
# USER SHOULD NOT CHANGE ITS VALUES.
# base_batch_size = (8 GPUs) x (2 samples per GPU)
auto_scale_lr = dict(base_batch_size=16)

###########################################################################
#visuallization & hooks
###########################################################################

vis_backends = [
    dict(type='LocalVisBackend', save_dir='visualizations'),
    dict(type='WandbVisBackend',
         init_kwargs={
            'project': 'mmdetection',
            'name': 'cascade_convnext_v2_baseline'
         })
]
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

env_cfg = dict(
    cudnn_benchmark=False,
    mp_cfg=dict(mp_start_method='fork', opencv_num_threads=0),
    dist_cfg=dict(backend='nccl'),
)

visualizer = dict(
    type='DetLocalVisualizer', vis_backends=vis_backends, name='visualizer')
visualization=dict(
    type='DetVisualizationHook',
    draw=True,
    interval=1,
    show=True)
log_processor = dict(type='LogProcessor', window_size=50, by_epoch=True)

log_level = 'INFO'