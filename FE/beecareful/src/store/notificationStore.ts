import { create } from 'zustand';
import useBeehiveStore from './beehiveStore'; // 벌통 스토어 임포트

// 알림 타입 정의
export type NotificationDataType = {
  beehiveId: string;
  message: string;
  status: 'WARNING' | 'SUCCESS' | 'DANGER';
  nickname?: string;
};

export type NotificationType = {
  id?: string;
  title: string;
  body: string;
  data?: NotificationDataType;
  read?: boolean;
  createdAt: string;
};

// 스토어 상태 타입 정의
type NotificationStateType = {
  notifications: NotificationType[];
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<boolean>;
  deleteNotification: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  getUnreadCount: () => number;
  enrichNotificationsWithBeehiveNames: () => void;
};

// IndexedDB에서 알림을 가져오는 함수
const fetchNotificationsFromDB = async (): Promise<NotificationType[]> => {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open('notifications-db', 1);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['notifications'], 'readonly');
        const store = transaction.objectStore('notifications');
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          // 최신 알림부터 정렬
          const notifications = getAllRequest.result.sort(
            (a: NotificationType, b: NotificationType) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          resolve(notifications);
        };

        getAllRequest.onerror = () => {
          reject('알림 데이터를 가져오는 데 실패했습니다.');
        };

        transaction.oncomplete = () => {
          db.close();
        };
      };

      request.onerror = () => {
        reject('IndexedDB 연결에 실패했습니다.');
      };
    } catch (error) {
      reject(error);
    }
  });
};

// 알림 읽음 표시 함수
const markNotificationAsReadInDB = async (id: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open('notifications-db', 1);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['notifications'], 'readwrite');
        const store = transaction.objectStore('notifications');

        // 해당 알림 가져오기
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
          const notification = getRequest.result;
          if (notification) {
            // 읽음 상태로 업데이트
            notification.read = true;
            const updateRequest = store.put(notification);

            updateRequest.onsuccess = () => {
              resolve(true);
            };

            updateRequest.onerror = () => {
              reject('알림 업데이트에 실패했습니다.');
            };
          } else {
            resolve(false); // 알림을 찾지 못함
          }
        };

        getRequest.onerror = () => {
          reject('알림을 찾는 데 실패했습니다.');
        };

        transaction.oncomplete = () => {
          db.close();
        };
      };

      request.onerror = () => {
        reject('IndexedDB 연결에 실패했습니다.');
      };
    } catch (error) {
      reject(error);
    }
  });
};

// 알림 삭제 함수
const deleteNotificationFromDB = async (id: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open('notifications-db', 1);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['notifications'], 'readwrite');
        const store = transaction.objectStore('notifications');

        const deleteRequest = store.delete(id);

        deleteRequest.onsuccess = () => {
          resolve(true);
        };

        deleteRequest.onerror = () => {
          reject('알림 삭제에 실패했습니다.');
        };

        transaction.oncomplete = () => {
          db.close();
        };
      };

      request.onerror = () => {
        reject('IndexedDB 연결에 실패했습니다.');
      };
    } catch (error) {
      reject(error);
    }
  });
};

// Zustand 스토어 생성
const useNotificationStore = create<NotificationStateType>((set, get) => ({
  // 상태
  notifications: [],
  loading: false,
  error: null,

  // 액션
  fetchNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const notifications = await fetchNotificationsFromDB();
      set({ notifications, loading: false });

      // 알림 데이터를 가져온 후 벌통 별명 정보 추가
      setTimeout(() => {
        get().enrichNotificationsWithBeehiveNames();
      }, 0);
    } catch (error) {
      console.error('알림 가져오기 실패:', error);
      set({ error: '알림을 불러오는 중 오류가 발생했습니다.', loading: false });
    }
  },

  // 벌통 별명을 알림 데이터에 추가하는 함수
  enrichNotificationsWithBeehiveNames: () => {
    const { notifications } = get();
    const getBeehiveNicknameById = useBeehiveStore.getState().getBeehiveNicknameById;

    // 각 알림 데이터에 벌통 별명 추가
    const enrichedNotifications = notifications.map((notification) => {
      if (notification.data?.beehiveId) {
        // 문자열 ID를 숫자로 변환 (필요한 경우)
        const beehiveId = parseInt(notification.data.beehiveId, 10);
        if (!isNaN(beehiveId)) {
          const nickname = getBeehiveNicknameById(beehiveId);
          if (nickname) {
            return {
              ...notification,
              data: {
                ...notification.data,
                nickname,
              },
            };
          }
        }
      }
      return notification;
    });

    set({ notifications: enrichedNotifications });
  },

  markAsRead: async (id: string) => {
    try {
      const success = await markNotificationAsReadInDB(id);
      if (success) {
        // 상태 업데이트
        const updatedNotifications = get().notifications.map((notification: NotificationType) =>
          notification.id === id ? { ...notification, read: true } : notification,
        );
        set({ notifications: updatedNotifications });
      }
      return success;
    } catch (error) {
      console.error('읽음 표시 실패:', error);
      return false;
    }
  },

  deleteNotification: async (id: string) => {
    try {
      const success = await deleteNotificationFromDB(id);
      if (success) {
        // 상태에서 제거
        const updatedNotifications = get().notifications.filter(
          (notification: NotificationType) => notification.id !== id,
        );
        set({ notifications: updatedNotifications });
      }
      return success;
    } catch (error) {
      console.error('알림 삭제 실패:', error);
      return false;
    }
  },

  markAllAsRead: async () => {
    try {
      const { notifications } = get();
      const unreadNotifications = notifications.filter(
        (notification: NotificationType) => notification.read === false,
      );

      // 모든 안 읽은 알림을 읽음 처리
      const promises = unreadNotifications.map((notification: NotificationType) =>
        notification.id ? markNotificationAsReadInDB(notification.id) : Promise.resolve(false),
      );

      await Promise.all(promises);

      // 상태 업데이트
      const updatedNotifications = notifications.map((notification: NotificationType) => ({
        ...notification,
        read: true,
      }));

      set({ notifications: updatedNotifications });
      return true;
    } catch (error) {
      console.error('모두 읽음 표시 실패:', error);
      return false;
    }
  },

  // 읽지 않은 알림 개수 계산
  getUnreadCount: () => {
    return get().notifications.filter(
      (notification: NotificationType) => notification.read === false,
    ).length;
  },
}));

export default useNotificationStore;
