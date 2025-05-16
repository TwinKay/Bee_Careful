import type { DiagnosisResponseType } from '@/types/diagnosis';
import type { AxiosError } from 'axios';

export const uploadImages = async (
  imageUrls: { images: File[]; urls: DiagnosisResponseType[] },
  callbacks: {
    onSuccess: () => void;
    onError: (error: AxiosError) => void;
  },
) => {
  const imageMap = imageUrls.images.reduce(
    (acc, image) => {
      const filename = image.name;
      const file = image;
      acc[filename] = file;
      return acc;
    },
    {} as Record<string, File>,
  );

  try {
    imageUrls.urls.forEach(({ filename, status, preSignedUrl }) => {
      if (status > 0) throw new Error(`Error uploading image ${filename}: ${status}`);

      const formData = new FormData();
      formData.append('file', imageMap[filename], filename);

      fetch(preSignedUrl, {
        method: 'PUT',
        body: formData,
        headers: {
          'Content-Type': imageMap[filename].type,
        },
      }).catch((error) => {
        console.error('Error uploading images:', error);
        throw error;
      });
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    callbacks.onError(error as AxiosError);
  }
  callbacks.onSuccess();
};
