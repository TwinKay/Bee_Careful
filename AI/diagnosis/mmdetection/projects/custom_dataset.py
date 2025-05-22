import os
from mmdet.registry import DATASETS
from mmdet.datasets import CocoDataset

@DATASETS.register_module()
class CocoDatasetSkipMissing(CocoDataset):
    """COCO 포맷에서, 실제 파일이 디스크에 없으면 해당 이미지 정보 자체를 제거하고 넘어갑니다."""
    def load_data_list(self):
        data_infos = super().load_data_list()
        filtered = []
        for info in data_infos:
            # 1) info에 img_path 키가 있으면 이걸 쓰고,
            # 2) 아니면 file_name 또는 filename 키를 쓴다.
            if 'img_path' in info:
                rel_path = info['img_path']
            else:
                # file_name / filename 은 COCODataset 이전 버전에서 들어오는 키
                rel_path = info.get('file_name', info.get('filename'))

            if rel_path is None:
                # 키가 하나도 없으면 스킵
                continue

            # data_prefix (img 폴더명) 이 설정되어 있으면 앞에 붙여주고,
            # 아니면 그냥 data_root 아래 rel_path 라고 본다.
            if isinstance(self.data_prefix, dict):
                img_subdir = self.data_prefix.get('img', '')
            else:
                img_subdir = ''

            # full path
            full_path = os.path.join(self.data_root, img_subdir, rel_path)
            if not os.path.exists(full_path):
                # 없으면 스킵
                continue

            # 남은 info 만 모아서 반환
            filtered.append(info)

        return filtered
