# Copyright (c) OpenMMLab. All rights reserved.
from typing import Any, Optional, Sequence

from mmcv.ops import batched_nms
from mmengine.evaluator import BaseMetric
from mmengine.logging import print_log

from mmdet.registry import METRICS

import os
import pandas as pd
from tqdm.auto import tqdm as tqdm_auto

try:
    import jsonlines
except ImportError:
    jsonlines = None


@METRICS.register_module()
class CustomResultDumping(BaseMetric):
    default_prefix: Optional[str] = 'pl_odvg'

    def __init__(self,
                 outfile_path,
                 img_prefix: str,
                 classes: list,
                 collect_device: str = 'cpu',
                 prefix: Optional[str] = None) -> None:
        super().__init__(collect_device=collect_device, prefix=prefix)
        self.outfile_path = outfile_path
        self.img_prefix = img_prefix
        self.classes=classes
        
        if not os.path.exists(outfile_path):
            os.makedirs(outfile_path)
            print(f"Created directories for the path: {outfile_path}")
        else:
            print(f"Path already exists: {outfile_path}")

        if jsonlines is None:
            raise ImportError('Please run "pip install jsonlines" to install '
                              'this package.')

    def process(self, data_batch: Any, data_samples: Sequence[dict]) -> None:
        for data_sample in data_samples:
            result = {}

            filename = data_sample['img_path']
            filename = filename.replace(self.img_prefix, '')
            if filename.startswith('/'):
                filename = filename[1:]
            result['filename'] = filename

            height = data_sample['ori_shape'][0]
            width = data_sample['ori_shape'][1]
            result['height'] = height
            result['width'] = width

            pred_instances = data_sample['pred_instances']

            pred_instances['bboxes'] = pred_instances['bboxes']
            pred_instances['scores'] = pred_instances['scores']
            pred_instances['labels'] = pred_instances['labels']


            result['pred_instances'] = pred_instances
            self.results.append(result)
                

    def compute_metrics(self, results: list) -> dict:
        prediction_strings = []
        file_names = []
        
        for result in tqdm_auto(results, desc="making csv file"):
            prediction_string = ''
            file_name = result['filename']
            if 'pred_instances' in result:
                pred_instances = result["pred_instances"]
                if pred_instances['bboxes'].numel() > 0:
                    bboxes = pred_instances['bboxes'].cpu().numpy()
                    scores = pred_instances['scores'].cpu().numpy()
                    labels = pred_instances['labels'].cpu().numpy()
                    
                    # 클래스별로 결과 정리
                    class_results = [[] for _ in range(len(self.classes))]
                    for label, score, bbox in zip(labels, scores, bboxes):
                        class_results[label].append((score, bbox))
                    
                    # Pascal VOC 형식으로 문자열 생성
                    for class_id, class_result in enumerate(class_results):
                        if class_result:  # 해당 클래스의 결과가 있는 경우만
                            for score, bbox in class_result:
                                prediction_string += f"{class_id} {score:.4f} {bbox[0]:.2f} {bbox[1]:.2f} {bbox[2]:.2f} {bbox[3]:.2f} "
            
            prediction_strings.append(prediction_string)
            file_names.append(file_name)
        
        # submission 파일 생성
        submission = pd.DataFrame()
        submission['PredictionString'] = prediction_strings
        submission['image_id'] = file_names
        submission.to_csv(os.path.join(self.outfile_path, 'submission.csv'), index=None)
        
        
        print(submission.head())
        print_log(
            f'Results has been saved to {self.outfile_path}.',
            logger='current')
        return {}
