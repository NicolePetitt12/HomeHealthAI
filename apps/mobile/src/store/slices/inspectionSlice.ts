import { createSlice } from '@reduxjs/toolkit';
import type { Scan } from '@inspector-gnome/shared';

interface ScanState {
  currentScan: Scan | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ScanState = {
  currentScan: null,
  isLoading: false,
  error: null,
};

export const inspectionSlice = createSlice({
  name: 'inspection',
  initialState,
  reducers: {
    setCurrentScan(state, action: { payload: Scan }) {
      state.currentScan = action.payload;
    },
    clearCurrentScan(state) {
      state.currentScan = null;
    },
    setLoading(state, action: { payload: boolean }) {
      state.isLoading = action.payload;
    },
    setError(state, action: { payload: string | null }) {
      state.error = action.payload;
    },
  },
});

export const { setCurrentScan, clearCurrentScan, setLoading, setError } =
  inspectionSlice.actions;
