import threading

def send_notification_async():
    def task():
        try:
            import requests
            url = 'https://k12a203.p.ssafy.io/api/v1/beehives/hornet/notification'
            myobj = {'serial': '725672613a1f2549'}
            response = requests.post(url, json=myobj, timeout=3)  # 3초 타임아웃 설정
            print(f"[Callback] Notification response: {response.text}")
        except Exception as e:
            print(f"[Callback] Notification failed: {e}")

    threading.Thread(target=task, daemon=True).start()