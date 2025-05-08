from gpiozero import LED
import time

led = LED(17)
led.on()
time.sleep(1)
led.off()