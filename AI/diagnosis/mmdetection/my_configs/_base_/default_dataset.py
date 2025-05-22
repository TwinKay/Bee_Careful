num_classes = 10
image_size = (1024, 1024)
classes = ("General trash", "Paper", "Paper pack", "Metal", "Glass", 
           "Plastic", "Styrofoam", "Plastic bag", "Battery", "Clothing")


# dataset settings ( 반드시 확인하기 )
dataset_type = 'CocoDataset' # data format 정의
data_root = '/data/ephemeral/home/dataset' # json과 train 모두 위치하는 최상단 폴더
train_ann_file_name = "MLSK_split/train_fold_2.json" # train ann file
val_ann_file_name = "MLSK_split/val_fold_2.json" # val ann file
test_ann_file_name = "test.json"
img_folder = "" # 신경안써도 됨



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


backend_args = None
train_pipeline = [
    dict(type='LoadImageFromFile', backend_args=backend_args),
    dict(type='LoadAnnotations', with_bbox=True),
    # dict(type='PhotoMetricDistortion'),
    # dict(type='Corrupt', corruption='gaussian_blur'),
    dict(
        type='RandomResize',
        scale=image_size,
        ratio_range=(0.1, 2.0),
        keep_ratio=True),
    dict(
        type='RandomCrop',
        crop_type='absolute_range',
        crop_size=image_size,
        recompute_bbox=True,
        allow_negative_crop=True),
    dict(type='RandomFlip', prob=0.5),
    dict(type='RandAugment', aug_space=color_space, aug_num=1),
    dict(type='FilterAnnotations', min_gt_bbox_wh=(1e-2, 1e-2)),
    dict(type='PackDetInputs')
]


train_dataloader = dict(
    batch_size=1,
    num_workers=4,
    persistent_workers=True,
    sampler=dict(type='DefaultSampler', shuffle=True),
    batch_sampler=dict(type='AspectRatioBatchSampler'),
    dataset=dict(
        type=dataset_type,
        metainfo=dict(classes=classes),
        data_root=data_root,
        ann_file=train_ann_file_name,
        pipeline=train_pipeline,
        data_prefix=dict(img=img_folder),
        filter_cfg=dict(filter_empty_gt=False, min_size=32))
)


# follow ViTDet
test_pipeline = [
    dict(type='LoadImageFromFile'),
    dict(type='Resize', scale=image_size, keep_ratio=True),  # diff
    dict(type='LoadAnnotations', with_bbox=True, with_mask=False),
    dict(
        type='PackDetInputs',
        meta_keys=('img_id', 'img_path', 'ori_shape', 'img_shape',
                   'scale_factor'))
]

val_dataloader = dict(
    batch_size=1,
    num_workers=2,
    persistent_workers=True,
    drop_last=False,
    sampler=dict(type='DefaultSampler', shuffle=False),
    dataset=dict(
        type=dataset_type,
        metainfo=dict(classes=classes), # 클래스 정보 반드시 적기
        data_root=data_root, # 마찬가지로 data_root
        ann_file=val_ann_file_name, # validation_ann_file
        data_prefix=dict(img=img_folder),
        test_mode=True,
        pipeline=test_pipeline,
        backend_args=backend_args))

test_dataloader = val_dataloader


val_evaluator = dict(
    type='CocoMetric',
    ann_file=data_root + "/" + val_ann_file_name,
    metric='bbox',
    format_only=False,
    backend_args=backend_args)


test_evaluator = dict(
    type='CustomResultDumping', # custom evaluating method를 정의
    img_prefix="/data/ephemeral/home/dataset/", # dataset 최상단 폴더
    outfile_path='/data/ephemeral/home/mmdetection/work_dir/co',
    classes=classes # class 정보를 담은 list나 집합
    )