import Button from '@/components/common/Button';
import ConfirmModal from '@/components/common/ConfirmModal';
import RemixIcon from '@/components/common/RemixIcon';
import { removeMetadata } from '@/utils/removeMetadata';
import { useState } from 'react';

const DiagnosisCreatePage = () => {
  const [images, setImages] = useState<File[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const captureImage = () => {
    const fileInput = document.getElementById('capture-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const getImages = () => {
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const deleteImage = (index: number) => {
    if (index !== null && index >= 0 && index < images.length) {
      const newImages = [...images];
      newImages.splice(index, 1);
      setImages(newImages);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const promises = files.map(removeMetadata);
      Promise.all(promises).then((cleanFiles) => {
        setImages((prevImages) => [...prevImages, ...cleanFiles]);
      });
    }
  };

  return (
    <div className="flex h-screen flex-col items-center">
      {images.length > 0 ? (
        <div className="flex h-full w-full flex-col items-center gap-8">
          <div className="flex w-full flex-wrap">
            {images.map((image, index) => (
              <div key={index} className="relative aspect-square w-1/3">
                <button
                  className="aspect-suqare absolute right-2 top-2 z-10 rounded-full bg-white p-1 shadow-md"
                  onClick={() => {
                    setSelectedImageIndex(index);
                    setIsConfirmModalOpen(true);
                  }}
                >
                  <RemixIcon name="ri-close-fill" className="ri-xl text-gray-500" />
                </button>
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Uploaded ${index}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
          <p className="p-4 font-bold text-gray-400">
            {images.length}장의 사진이 업로드 되었습니다.
          </p>
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-8">
          <RemixIcon name="ri-image-add-fill" className="ri-5x text-gray-400" />
          <p className="font-bold text-gray-400">정확한 검사를 위해 사진을 업로드 해주세요</p>
        </div>
      )}
      <div className="flex w-full flex-col gap-4 p-4">
        <input
          id="capture-input"
          className="hidden"
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          onChange={handleFileChange}
        />
        <input
          id="file-input"
          className="hidden"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
        />
        <Button variant={`${images.length === 0 ? 'success' : 'neutral'}`} onClick={captureImage}>
          <p className="text-lg font-bold">사진 촬영</p>
        </Button>
        <Button variant={`${images.length === 0 ? 'success' : 'neutral'}`} onClick={getImages}>
          <p className="text-lg font-bold">사진 업로드</p>
        </Button>
        <Button
          variant="success"
          disabled={images.length === 0}
          onClick={() => {
            alert('검사 시작');
          }}
        >
          <p className={`text-lg font-bold ${images.length === 0 ? 'text-gray-500' : ''}`}>
            검사 시작
          </p>
        </Button>
      </div>
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
        }}
        onConfirm={() => {
          if (selectedImageIndex == null) return;
          deleteImage(selectedImageIndex);
        }}
        title="사진을 삭제하시겠어요?"
        // description="삭제된 사진은 복구할 수 없습니다."
        confirmText="삭제"
      />
    </div>
  );
};
export default DiagnosisCreatePage;
