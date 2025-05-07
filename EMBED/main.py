import time
from adafruit_servokit import ServoKit

kit = ServoKit(channels=16)

# kit.servo[1].angle = 180
# time.sleep(1)
# kit.servo[1].angle = 0


kit.continuous_servo[1].throttle = 1
time.sleep(1)
kit.continuous_servo[1].throttle = -1
time.sleep(1)
kit.continuous_servo[1].throttle = 0