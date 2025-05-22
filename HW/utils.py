from typing import List, Generator, Optional, Tuple, Dict
from pathlib import Path
from functools import partial
import queue
from loguru import logger
import numpy as np
from hailo_platform import (HEF, VDevice,
                            FormatType, HailoSchedulingAlgorithm)
IMAGE_EXTENSIONS: Tuple[str, ...] = ('.jpg', '.png', '.bmp', '.jpeg')


class HailoAsyncInference:
    def __init__(
        self, hef_path: str, input_queue: queue.Queue,
        output_queue: queue.Queue, batch_size: int = 1,
        input_type: Optional[str] = None, output_type: Optional[Dict[str, str]] = None,
        send_original_frame: bool = False) -> None:

        self.input_queue = input_queue
        self.output_queue = output_queue
        params = VDevice.create_params()
        params.scheduling_algorithm = HailoSchedulingAlgorithm.ROUND_ROBIN

        self.hef = HEF(hef_path)
        self.target = VDevice(params)
        self.infer_model = self.target.create_infer_model(hef_path)
        self.infer_model.set_batch_size(batch_size)      
        if input_type is not None:
            self._set_input_type(input_type)
        if output_type is not None:
            self._set_output_type(output_type)

        self.output_type = output_type
        self.send_original_frame = send_original_frame

    def _set_input_type(self, input_type: Optional[str] = None) -> None:

        self.infer_model.input().set_format_type(getattr(FormatType, input_type))
    
    def _set_output_type(self, output_type_dict: Optional[Dict[str, str]] = None) -> None:

        for output_name, output_type in output_type_dict.items():
            self.infer_model.output(output_name).set_format_type(
                getattr(FormatType, output_type)
            )

    def callback(
        self, completion_info, bindings_list: list, input_batch: list,
    ) -> None:

        if completion_info.exception:
            logger.error(f'Inference error: {completion_info.exception}')
        else:
            for i, bindings in enumerate(bindings_list):
                if len(bindings._output_names) == 1:
                    result = bindings.output().get_buffer()
                else:
                    result = {
                        name: np.expand_dims(
                            bindings.output(name).get_buffer(), axis=0
                        )
                        for name in bindings._output_names
                    }
                self.output_queue.put((input_batch[i], result))

    def get_vstream_info(self) -> Tuple[list, list]:

        return (
            self.hef.get_input_vstream_infos(), 
            self.hef.get_output_vstream_infos()
        )

    def get_hef(self) -> HEF:

        return self.hef

    def get_input_shape(self) -> Tuple[int, ...]:

        return self.hef.get_input_vstream_infos()[0].shape 

    def run(self) -> None:
        with self.infer_model.configure() as configured_infer_model:
            while True:
                batch_data = self.input_queue.get()
                if batch_data is None:
                    break 

                if self.send_original_frame:
                    original_batch, preprocessed_batch = batch_data
                else:
                    preprocessed_batch = batch_data

                bindings_list = []
                for frame in preprocessed_batch:
                    bindings = self._create_bindings(configured_infer_model)
                    bindings.input().set_buffer(np.array(frame))
                    bindings_list.append(bindings)

                configured_infer_model.wait_for_async_ready(timeout_ms=10000)
                job = configured_infer_model.run_async(
                    bindings_list, partial(
                        self.callback,
                        input_batch=original_batch if self.send_original_frame else preprocessed_batch,
                        bindings_list=bindings_list
                    )
                )
            job.wait(10000)

    def _get_output_type_str(self, output_info) -> str:
        if self.output_type is None:
            return str(output_info.format.type).split(".")[1].lower()
        else:
            self.output_type[output_info.name].lower()

    def _create_bindings(self, configured_infer_model) -> object:

        if self.output_type is None:
            output_buffers = {
                output_info.name: np.empty(
                    self.infer_model.output(output_info.name).shape,
                    dtype=(getattr(np, self._get_output_type_str(output_info)))
                )
            for output_info in self.hef.get_output_vstream_infos()
            }
        else:
            output_buffers = {
                name: np.empty(
                    self.infer_model.output(name).shape, 
                    dtype=(getattr(np, self.output_type[name].lower()))
                )
            for name in self.output_type
            }
        return configured_infer_model.create_bindings(
            output_buffers=output_buffers
        )


def load_images_opencv(images_path: str) -> List[np.ndarray]:

    import cv2
    path = Path(images_path)
    if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
        return [cv2.imread(str(path))]
    elif path.is_dir():
        return [
            cv2.imread(str(img)) for img in path.glob("*")
            if img.suffix.lower() in IMAGE_EXTENSIONS
        ]
    return []

def load_input_images(images_path: str):

    from PIL import Image
    path = Path(images_path)
    if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
        return [Image.open(path)]
    elif path.is_dir():
        return [
            Image.open(img) for img in path.glob("*") 
            if img.suffix.lower() in IMAGE_EXTENSIONS
        ]
    return []

def validate_images(images: List[np.ndarray], batch_size: int) -> None:

    if not images:
        raise ValueError(
            'No valid images found in the specified path.'
        )
    
    if len(images) % batch_size != 0:
        raise ValueError(
            'The number of input images should be divisible by the batch size '
            'without any remainder.'
        )


def divide_list_to_batches(
    images_list: List[np.ndarray], batch_size: int
) -> Generator[List[np.ndarray], None, None]:

    for i in range(0, len(images_list), batch_size):
        yield images_list[i: i + batch_size]
