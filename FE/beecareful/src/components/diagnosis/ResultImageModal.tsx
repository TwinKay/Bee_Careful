import { useGetDiagnosisImages } from '@/apis/beehive';
import { useParams } from 'react-router-dom';

const ResultImageModal = ({
  diagnosisId,
  onClose,
}: {
  diagnosisId: number;
  onClose: () => void;
}) => {
  const beehiveId = useParams().id;
  const { data: images, isLoading } = useGetDiagnosisImages(Number(beehiveId), diagnosisId);

  return (
    <div
      className="fixed inset-0 z-50 flex h-full w-full flex-col items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div className="h-1/2 w-96 bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex h-full snap-x snap-mandatory overflow-x-auto">
          {isLoading || !images ? (
            <div className="flex h-full w-full items-center justify-center">
              <p>{isLoading ? '이미지 불러오는 중...' : '이미지 오류'}</p>
            </div>
          ) : (
            images.urls.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Diagnosis Image ${index}`}
                className="h-full w-full snap-center object-cover"
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
export default ResultImageModal;
