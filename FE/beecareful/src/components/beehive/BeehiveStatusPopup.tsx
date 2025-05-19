import React from 'react';
import type { BeehiveType } from '@/types/beehive';
import Button from '@/components/common/Button';
import { formatTimeAgo } from '@/utils/format';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { motion, AnimatePresence } from 'framer-motion';

type BeehiveStatusPopupPropsType = {
  isOpen: boolean;
  onClose: () => void;
  hive: BeehiveType;
};

type StatusItemPropsType = {
  active: boolean;
  title: string;
  time: string;
  activeColor?: string;
  activeIconClass?: string;
  inactiveIconClass?: string;
};

// 상태 아이템 컴포넌트
const StatusItem: React.FC<StatusItemPropsType> = ({
  active,
  title,
  time,
  activeColor = 'bg-rose-100',
  activeIconClass = 'ri-checkbox-circle-fill text-rose-500',
  inactiveIconClass = 'ri-subtract-line text-white',
}) => {
  return (
    <div className="flex flex-col items-center space-y-2">
      <div
        className={`h-12 w-12 rounded-full ${active ? activeColor : 'bg-gray-300'} flex items-center justify-center`}
      >
        {active ? (
          <i className={`${activeIconClass} text-2xl`}></i>
        ) : (
          <i className={`${inactiveIconClass} text-2xl`}></i>
        )}
      </div>
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs text-gray-500">{time}</span>
    </div>
  );
};

/**
 * 날짜 차이를 일 단위로 계산
 */
const getDaysDifference = (dateString?: string | null): number => {
  if (!dateString) return 0;

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)); // 일 단위로 변환
};

const BeehiveStatusPopup: React.FC<BeehiveStatusPopupPropsType> = ({ isOpen, onClose, hive }) => {
  // 말벌 출현: hornetAppearedAt가 있어도 하루가 지나면 비활성화
  const hornetDaysDiff = getDaysDifference(hive.hornetAppearedAt);
  const hasHornetAppeared = !!hive.hornetAppearedAt && hornetDaysDiff < 1;

  // 질병 감지: isInfected 값에 따라 처리
  const hasDiseaseDetected = hive.isInfected;

  // 검사 필요: lastDiagnosedAt이 한 달 이상 지났거나, lastDiagnosisId가 없는 경우
  const diagnosisDaysDiff = getDaysDifference(hive.lastDiagnosedAt);
  const needsDiagnosis = !hive.lastDiagnosisId || diagnosisDaysDiff >= 30;

  // 상태 항목 정의
  const statusItems = [
    {
      id: 'hornet',
      title: '말벌 출현',
      active: hasHornetAppeared,
      time: hasHornetAppeared ? formatTimeAgo(hive.hornetAppearedAt) : '-',
      activeColor: 'bg-rose-100',
      activeIconClass: 'ri-checkbox-circle-fill text-rose-500',
    },
    {
      id: 'disease',
      title: '질병 감지',
      active: hasDiseaseDetected,
      time: hasDiseaseDetected ? formatTimeAgo(hive.recordCreatedAt) : '-',
      activeColor: 'bg-rose-100',
      activeIconClass: 'ri-checkbox-circle-fill text-rose-500',
    },
    {
      id: 'diagnosis',
      title: '검사 필요',
      active: needsDiagnosis,
      time: needsDiagnosis ? '필요' : formatTimeAgo(hive.lastDiagnosedAt),
      activeColor: 'bg-red-400',
      activeIconClass: 'ri-check-line text-white',
    },
  ];

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="mx-4 w-full max-w-md overflow-hidden rounded-xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 팝업 헤더 */}
            <div className="flex items-center justify-between p-4 px-6">
              <h2 className="text-xl font-bold text-bc-brown-100">{hive.nickname} 벌통</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            {/* 팝업 본문 */}
            <div className="px-4 py-10">
              <div className="flex justify-around">
                {statusItems.map((item) => (
                  <StatusItem
                    key={item.id}
                    active={item.active}
                    title={item.title}
                    time={item.time}
                    activeColor={item.activeColor}
                    activeIconClass={item.activeIconClass}
                  />
                ))}
              </div>
            </div>

            {/* 팝업 푸터 - 버튼 */}
            <div className="p-4 pb-6">
              <Link to={ROUTES.BEEHIVE_DETAIL(hive.beehiveId)}>
                <Button variant="success" size="lg" className="w-full">
                  벌통 정보 상세보기
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BeehiveStatusPopup;
