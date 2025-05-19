import { useGetDiagnosisImages } from '@/apis/beehive';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import CardTitle from '@/components/common/CardTitle';
import RemixIcon from '@/components/common/RemixIcon';
import DiagnosisPieChart from '@/components/diagnosis/DiagnosisPieChart';
import type { DiagnosisDataType } from '@/types/diagnosis';
import { getLocaleDateString } from '@/utils/getLocaleDateString';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

const DiagnosisDetailPage: React.FC<DiagnosisDataType> = (data) => {
  const beehiveId = useParams().id;

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const { data: images } = useGetDiagnosisImages(Number(beehiveId) || 0, data.diagnosisId);

  const parsedData = useMemo(() => {
    const result = {
      larvaCount: data.larvaCount,
      imagoCount: data.imagoCount,
      imagoDisease: [
        {
          name: '진드기(응애)',
          value: data.result.imago?.varroaCount,
          ratio: data.result.imago?.varroaRatio,
          color: '#E57373',
        },
        {
          name: '날개바이러스',
          value: data.result.imago?.dwvCount,
          ratio: data.result.imago?.dwvRatio,
          color: '#FFB74D',
        },
        {
          name: '정상',
          value:
            data.imagoCount -
            (data.result.imago?.varroaCount || 0) -
            (data.result.imago?.dwvCount || 0),
          ratio: 100 - (data.result.imago?.varroaRatio || 0),
          color: '#E6E6E6',
        },
      ],
      larvaDisease: [
        {
          name: '진드기(응애)',
          value: data.result.larva?.varroaCount,
          ratio: data.result.larva?.varroaRatio,
          color: '#E57373',
        },
        {
          name: '부저병',
          value: data.result.larva?.foulBroodCount,
          ratio: data.result.larva?.foulBroodRatio,
          color: '#64B5F6',
        },
        {
          name: '석고병',
          value: data.result.larva?.chalkBroodCount,
          ratio: data.result.larva?.chalkBroodRatio,
          color: '#81C784',
        },
        {
          name: '정상',
          value:
            data.larvaCount -
            (data.result.larva?.varroaCount || 0) -
            (data.result.larva?.foulBroodCount || 0) -
            (data.result.larva?.chalkBroodCount || 0),
          ratio: 100 - (data.result.larva?.varroaRatio || 0),
          color: '#E6E6E6',
        },
      ],
    };
    return result;
  }, [data]);
  console.log(parsedData);

  return (
    <div className="flex h-full w-full flex-col items-center justify-start gap-4">
      <Card className="items-center">
        <RemixIcon name="ri-stethoscope-fill" className="ri-3x" />
        <CardTitle className="justify-center">검사 결과표</CardTitle>
        <p className="text-sm font-extrabold text-gray-400">
          {getLocaleDateString(data.createdAt)}
        </p>
        <Button
          size="lg"
          variant="success"
          className="justify-between gap-2"
          startIcon={<RemixIcon name="ri-image-line" className="ri-md" />}
          endIcon={<RemixIcon name="ri-arrow-right-s-line" className="ri-md" />}
          fullWidth
          onClick={() => {
            setImageModalOpen(true);
          }}
        >
          <p className="ml-2 w-full text-start font-extrabold">결과 사진 상세보기</p>
        </Button>
        <div className="flex w-full flex-col items-start gap-4">
          <CardTitle>검사 개체 수</CardTitle>
          <div className="flex w-full flex-col items-start gap-1">
            <div className="flex w-full items-end justify-between p-2">
              <p className="text-lg font-bold text-gray-500">성충</p>
              <p>
                <span className="text-lg font-extrabold">{parsedData.imagoCount}</span> &nbsp;
                <span className="font-bold text-bc-brown-10">마리</span>
              </p>
            </div>

            <div className="h-[1px] w-full bg-gray-200"></div>

            <div className="flex w-full items-end justify-between p-2">
              <p className="text-lg font-bold text-gray-500">유충</p>
              <p>
                <span className="text-lg font-extrabold">{parsedData.larvaCount}</span> &nbsp;
                <span className="font-bold text-bc-brown-10">마리</span>
              </p>
            </div>
          </div>
        </div>
      </Card>
      <Card>
        <CardTitle>
          <span className="text-bc-yellow-100">성충</span>&nbsp; 질병 감염 현황
        </CardTitle>
        <DiagnosisPieChart data={parsedData.imagoDisease} />
        <div className="flex w-full flex-col gap-2.5">
          {parsedData.imagoDisease.map((item, index) => (
            <div key={item.name}>
              <div className="flex justify-between p-2">
                <p className="text-lg font-bold text-gray-500">{item.name}</p>
                <div className="flex flex-col items-end">
                  <p>
                    <span
                      className={`text-lg font-extrabold ${item.name == '정상' ? 'text-gray-600' : 'text-red-500'}`}
                    >
                      {Number(item.ratio).toFixed(3)}%
                    </span>
                  </p>
                  <p className="font-bold text-gray-400">
                    <span className="text-sm ">{item.value}</span>
                    <span className="text-sm">마리</span>
                  </p>
                </div>
              </div>
              {index !== parsedData.imagoDisease.length - 1 && (
                <div className="h-[1px] w-full bg-gray-200"></div>
              )}
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardTitle>
          <span className="text-bc-yellow-100">유충</span>&nbsp; 질병 감염 현황
        </CardTitle>
        <DiagnosisPieChart data={parsedData.larvaDisease} />

        <div className="flex w-full flex-col gap-2.5">
          {parsedData.larvaDisease.map((item, index) => (
            <>
              <div key={item.name} className="flex justify-between p-2">
                <p className="text-lg font-bold text-gray-500">{item.name}</p>
                <div className="flex flex-col items-end">
                  <p>
                    <span
                      className={`text-lg font-extrabold ${item.name == '정상' ? 'text-gray-600' : 'text-red-500'}`}
                    >
                      {item.ratio}%
                    </span>
                  </p>
                  <p className="font-bold text-gray-400">
                    <span className="text-sm ">{item.value}</span>
                    <span className="text-sm">마리</span>
                  </p>
                </div>
              </div>
              {index !== parsedData.larvaDisease.length - 1 && (
                <div className="h-[1px] w-full bg-gray-200"></div>
              )}
            </>
          ))}
        </div>
      </Card>
      {imageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex h-full w-full flex-col items-center justify-center bg-black bg-opacity-50"
          onClick={() => setImageModalOpen(false)}
        >
          <div className="h-1/2 w-96 bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="snap-x snap-mandatory overflow-x-auto">
              {images?.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Diagnosis Image ${index}`}
                  className="h-full w-full snap-center object-cover"
                  onClick={() => {
                    setImageIndex(index);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DiagnosisDetailPage;
