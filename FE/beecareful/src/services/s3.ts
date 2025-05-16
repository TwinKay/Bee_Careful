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
    const promises = imageUrls.urls.map(({ filename, status, preSignedUrl }) => {
      if (status > 0) throw new Error(`Error uploading image ${filename}: ${status}`);

      const formData = new FormData();
      formData.append('file', imageMap[filename], filename);

      return fetch(preSignedUrl, {
        method: 'PUT',
        body: formData,
        headers: {
          'Content-Type': imageMap[filename].type,
        },
      });
    });
    const results = await Promise.all(promises);
    const allSuccessful = results.every((result) => result.ok);
    if (allSuccessful) {
      callbacks.onSuccess();
    } else {
      throw new Error('Some images failed to upload');
    }
  } catch (error) {
    console.error('Error uploading images:', error);
    callbacks.onError(error as AxiosError);
  }
};
