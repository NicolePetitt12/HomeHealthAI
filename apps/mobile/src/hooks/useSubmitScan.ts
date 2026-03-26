import { useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useAppDispatch } from '../store/hooks';
import { setCurrentScan } from '../store/slices/inspectionSlice';
import { compressImage, uploadScanImage, createScanRecord } from '../services/upload';
import type { Scan } from '@inspector-gnome/shared';

export type SubmitStage = 'compressing' | 'uploading' | 'creating' | 'done';

export interface SubmitProgress {
  stage: SubmitStage;
  percent: number;
}

export interface SubmitScanInput {
  imageUri: string;
  location: string;
  notes: string | null;
}

export function useSubmitScan(onProgress: (p: SubmitProgress) => void) {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  return useMutation<Scan, Error, SubmitScanInput>({
    mutationFn: async ({ imageUri, location, notes }) => {
      if (!user) throw new Error('Not authenticated');

      onProgressRef.current({ stage: 'compressing', percent: 10 });
      const { uri: compressedUri } = await compressImage(imageUri);

      onProgressRef.current({ stage: 'uploading', percent: 40 });
      const storagePath = await uploadScanImage(user.id, compressedUri);

      onProgressRef.current({ stage: 'creating', percent: 80 });
      const scan = await createScanRecord(user.id, storagePath, location, notes);

      onProgressRef.current({ stage: 'done', percent: 100 });
      dispatch(setCurrentScan(scan));

      return scan;
    },
  });
}
