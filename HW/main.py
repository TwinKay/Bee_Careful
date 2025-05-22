import depthai as dai
import cv2
import numpy as np
import queue
import threading
import time
import argparse
import os

from object_detection_utils import ObjectDetectionUtils
from utils import HailoAsyncInference
from supervision import ByteTrack, Detections
from filterpy.kalman import UnscentedKalmanFilter as UKF
from filterpy.kalman import MerweScaledSigmaPoints
from api_request import send_notification_async

MODEL_PATH = "/home/ssafy/project/RPI-tests/python/object_detection/models/yolov8n2.hef"
LABELS_PATH = "/home/ssafy/project/RPI-tests/python/object_detection/wasp.txt"
BATCH_SIZE = 1
TRACK_THRESH = 0.15
TRACK_BUFFER = 30
FPS = 30
PREDICT_FRAMES_AHEAD = 3
MIN_SCORE = 0.15
INPUT_SIZE = 640
FRAME_WIDTH = 1280
FRAME_HEIGHT = 720

last_hornet_found_time = 0
LASER_OFF_DELAY_SEC = 0.5

NOTIFICATION_DELAY_MIN = 5
last_notification_time = 0
last_save_time = 0

ENABLE_DEBUG_SAVE = False
USE_RADIAL_TO_Z_CONVERSION = False

os.makedirs("debug_frames", exist_ok=True)
os.makedirs("debug_depth", exist_ok=True)

def on_wasp_tracked(track_id, x, y, z, turret=None):
    # print(f"[Callback] ID={track_id:2d} → X={x:.3f} m, Y={y:.3f} m, Z={z:.3f} m")
    if z > 0:
        if turret:
            global last_hornet_found_time
            last_hornet_found_time = time.time()
            turret.laser.on()
            turret.look_at(x * 1000 + 17, y * 1000 + 10, z * 1000)
        global last_notification_time
        current_time = time.time()
        if current_time - last_notification_time > NOTIFICATION_DELAY_MIN * 60:
            last_notification_time = current_time
            # print("[Callback] Notification response:")
            send_notification_async()

def save_images_async(depth_img, rgb_img):
    def writer():
        timestamp = f"{time.time():.0f}"
        cv2.imwrite(f"debug_depth/depth_{timestamp}.png", depth_img)
        cv2.imwrite(f"debug_frames/rgb_{timestamp}.png", rgb_img)
    threading.Thread(target=writer, daemon=True).start()

def build_pipeline():
    pipeline = dai.Pipeline()
    cam = pipeline.createColorCamera()
    cam.setResolution(dai.ColorCameraProperties.SensorResolution.THE_1080_P)
    cam.setVideoSize(FRAME_WIDTH, FRAME_HEIGHT)
    cam.setInterleaved(False)
    cam.setFps(FPS)

    xout_rgb = pipeline.createXLinkOut()
    xout_rgb.setStreamName("rgb")
    cam.video.link(xout_rgb.input)

    monoL = pipeline.createMonoCamera()
    monoR = pipeline.createMonoCamera()
    monoL.setBoardSocket(dai.CameraBoardSocket.CAM_B)
    monoR.setBoardSocket(dai.CameraBoardSocket.CAM_C)
    monoL.setResolution(dai.MonoCameraProperties.SensorResolution.THE_480_P)
    monoR.setResolution(dai.MonoCameraProperties.SensorResolution.THE_480_P)

    stereo = pipeline.createStereoDepth()
    stereo.setSubpixel(True)
    stereo.setLeftRightCheck(True)
    stereo.setExtendedDisparity(False)
    stereo.setDepthAlign(dai.CameraBoardSocket.CAM_A)
    stereo.setDefaultProfilePreset(dai.node.StereoDepth.PresetMode.HIGH_DENSITY)
    stereo.setOutputSize(FRAME_WIDTH, FRAME_HEIGHT)

    monoL.out.link(stereo.left)
    monoR.out.link(stereo.right)

    xout_depth = pipeline.createXLinkOut()
    xout_depth.setStreamName("depth")
    stereo.depth.link(xout_depth.input)

    return pipeline

def main(turret_enabled=False, use_ukf=False):
    global last_save_time
    turret = None
    if turret_enabled:
        from turret_module import Turret
        turret = Turret()

    pipeline = build_pipeline()
    with dai.Device(pipeline) as dev:
        q_rgb = dev.getOutputQueue("rgb", maxSize=1, blocking=True)
        q_depth = dev.getOutputQueue("depth", maxSize=1, blocking=True)

        calib = dev.readCalibration()
        intrinsics = np.array(calib.getCameraIntrinsics(dai.CameraBoardSocket.CAM_A, FRAME_WIDTH, FRAME_HEIGHT), dtype=np.float64)
        dist_coeffs = np.array(calib.getDistortionCoefficients(dai.CameraBoardSocket.CAM_A), dtype=np.float64)
        fx_val, fy_val = intrinsics[0, 0], intrinsics[1, 1]
        cx0, cy0 = intrinsics[0, 2], intrinsics[1, 2]
        # print(f"[Intrinsics] fx={fx_val:.1f}, fy={fy_val:.1f}, cx={cx0:.1f}, cy={cy0:.1f}")

        det_utils = ObjectDetectionUtils(LABELS_PATH)
        frame_q, result_q, meta_q = queue.Queue(1), queue.Queue(), queue.Queue(1)
        hailo_inf = HailoAsyncInference(MODEL_PATH, frame_q, result_q, BATCH_SIZE, send_original_frame=True)

        def hailo_runner():
            try:
                # print("[DEBUG] Hailo inference thread started.")
                hailo_inf.run()
            except Exception as e:
                print(f"[ERROR] Hailo runner crashed: {e}")

        threading.Thread(target=hailo_runner, daemon=True).start()

        def frame_reader():
            # print("[DEBUG] Frame reader thread started.")
            while True:
                try:
                    if turret and (time.time() - last_hornet_found_time > LASER_OFF_DELAY_SEC):
                        turret.laser.off()

                    if not result_q.empty():
                        time.sleep(0.001)
                        continue

                    in_rgb = q_rgb.tryGet()
                    if in_rgb is None:
                        time.sleep(0.001)
                        continue

                    frame_bgr = in_rgb.getCvFrame()
                    rgb_for_model = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
                    proc, scale, x_offset, y_offset = det_utils.preprocess(rgb_for_model, INPUT_SIZE, INPUT_SIZE)

                    frame_q.put(([frame_bgr], [proc]), block=False)
                    meta_q.put((scale, x_offset, y_offset))  # 순서 보장
                    # print("[DEBUG] Frame and meta info added to queues")

                except queue.Full:
                    print("[WARN] frame_q or meta_q is full — skipping frame")
                except Exception as e:
                    print(f"[ERROR] Frame reader exception: {e}")


        threading.Thread(target=frame_reader, daemon=True).start()

        tracker = ByteTrack(TRACK_THRESH, TRACK_BUFFER, 0.65, FPS)
        target_track_id, ukf = None, None
        prev_cx, prev_cy, prev_z = 0, 0, 0
        static_frame_count = 0

        while True:
            # if result_q.empty():
                # print("[DEBUG] Waiting for result_q...")
            # if meta_q.empty():
                # print("[DEBUG] Waiting for meta_q...")
            if result_q.empty() or meta_q.empty():
                time.sleep(0.001)
                continue

            frame_bgr, results = result_q.get()
            # print("[DEBUG] Result received from inference")
            scale, x_offset, y_offset = meta_q.get()
            dets = det_utils.extract_detections(results, threshold=MIN_SCORE)
            # print(f"[DEBUG] Detections extracted: {len(dets['detection_boxes'])}")

            xyxy, confidence, class_id = [], [], []
            for (ymin, xmin, ymax, xmax), cls, score in zip(dets['detection_boxes'], dets['detection_classes'], dets['detection_scores']):
                if cls == 1:
                    box = [xmin * INPUT_SIZE, ymin * INPUT_SIZE, xmax * INPUT_SIZE, ymax * INPUT_SIZE]
                    xmin_r = (box[0] - x_offset) / scale
                    ymin_r = (box[1] - y_offset) / scale
                    xmax_r = (box[2] - x_offset) / scale
                    ymax_r = (box[3] - y_offset) / scale
                    xyxy.append([xmin_r, ymin_r, xmax_r, ymax_r])
                    confidence.append(score)
                    class_id.append(cls)

            if not xyxy:
                continue

            detections = Detections(xyxy=np.array(xyxy), confidence=np.array(confidence), class_id=np.array(class_id))
            tracked = tracker.update_with_detections(detections)

            if target_track_id not in tracked.tracker_id:
                if tracked.xyxy.size > 0:
                    best_idx = np.argmax(tracked.confidence)
                    target_track_id = int(tracked.tracker_id[best_idx])
                    static_frame_count = 0
                    if use_ukf:
                        def fx_kf(x, dt): x[:3] += x[3:] * dt; return x
                        def hx_kf(x): return x[:3]
                        points = MerweScaledSigmaPoints(n=6, alpha=0.1, beta=2., kappa=0)
                        ukf = UKF(dim_x=6, dim_z=3, fx=fx_kf, hx=hx_kf, dt=PREDICT_FRAMES_AHEAD * (1.0 / FPS), points=points)
                        ukf.x = np.zeros(6)
                        ukf.P *= 10.0
                        ukf.Q *= 0.01
                        ukf.R *= 0.1
                else:
                    target_track_id, ukf = None, None

            for bbox, tid in zip(tracked.xyxy, tracked.tracker_id):
                if int(tid) == target_track_id:
                    x1, y1, x2, y2 = bbox
                    cx, cy = int((x1 + x2) / 2), int((y1 + y2) / 2)
                    # print(f"[TRACKED] cx={cx}, cy={cy}")
                    depth_msg = q_depth.tryGet()
                    if depth_msg is None:
                        continue
                    depth_frame = depth_msg.getFrame()
                    depth_cx, depth_cy = cx, cy
                    roi_size = 100
                    half_roi = roi_size // 2
                    if not (half_roi <= depth_cx < depth_frame.shape[1] - half_roi and half_roi <= depth_cy < depth_frame.shape[0] - half_roi):
                        continue
                    roi = depth_frame[depth_cy - half_roi:depth_cy + half_roi, depth_cx - half_roi:depth_cx + half_roi]
                    valid = roi[roi > 0]
                    if valid.size == 0:
                        continue
                    depth_mm = np.min(valid)
                    # print(f"[DEPTH] min depth (mm): {depth_mm}")
                    R = depth_mm / 1000.0
                    pt = np.array([[[cx, cy]]], dtype=np.float32)
                    und = cv2.undistortPoints(pt, intrinsics, dist_coeffs, P=intrinsics)
                    u_ud, v_ud = und[0, 0]
                    theta_x = (u_ud - cx0) / fx_val
                    theta_y = (v_ud - cy0) / fy_val
                    Z = R / np.sqrt(1 + theta_x ** 2 + theta_y ** 2) if USE_RADIAL_TO_Z_CONVERSION else R
                    X = theta_x * Z * (1 - Z * 0.27)
                    Y = theta_y * Z * (1 - Z * 0.25)

                    if abs(prev_cx - cx) < 3 and abs(prev_cy - cy) < 3 and abs(prev_z - Z) < 0.01:
                        static_frame_count += 1
                    else:
                        static_frame_count = 0
                    prev_cx, prev_cy, prev_z = cx, cy, Z

                    if static_frame_count > FPS * 2:
                        # print("[TRACKING] Object too static, resetting tracker.")
                        target_track_id = None
                        static_frame_count = 0
                        continue

                    if use_ukf and ukf:
                        ukf.predict()
                        ukf.update([X, Y, Z])
                        X, Y, Z = ukf.x[:3]

                    on_wasp_tracked(track_id=target_track_id, x=X, y=Y, z=Z, turret=turret)

    if turret:
        turret.off()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-turret", type=str, default="false")
    parser.add_argument("-ukf", type=str, default="true")
    args = parser.parse_args()
    turret_flag = args.turret.lower() == "true"
    ukf_flag = args.ukf.lower() == "true"
    main(turret_enabled=turret_flag, use_ukf=ukf_flag)
