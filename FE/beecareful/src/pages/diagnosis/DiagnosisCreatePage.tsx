import Button from '@/components/common/Button';
import RemixIcon from '@/components/common/RemixIcon';

const DiagnosisCreatePage = () => {
  return (
    <div className="flex h-screen flex-col items-center">
      <div className="flex h-full flex-col items-center justify-center gap-8">
        <RemixIcon name="ri-image-add-fill" className="ri-5x text-gray-400" />
        <p className="font-bold text-gray-400">정확한 검사를 위해 사진을 업로드 해주세요</p>
      </div>
      <div className="flex w-full flex-col gap-4 p-4">
        <Button variant="success">
          <p className="text-lg font-bold">사진 촬영</p>
        </Button>
        <Button variant="neutral">
          <p className="text-lg font-bold">앨범에서 업로드</p>
        </Button>
        <Button variant="success" disabled>
          <p className="text-lg font-bold text-gray-500">검사 시작</p>
        </Button>
      </div>
    </div>
  );
};
export default DiagnosisCreatePage;
