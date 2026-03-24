import { createSlice } from '@reduxjs/toolkit';
import type { Inspection } from '@inspector-gnome/shared';

interface InspectionState {
  currentInspection: Inspection | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: InspectionState = {
  currentInspection: null,
  isLoading: false,
  error: null,
};

export const inspectionSlice = createSlice({
  name: 'inspection',
  initialState,
  reducers: {
    setCurrentInspection(state, action: { payload: Inspection }) {
      state.currentInspection = action.payload;
    },
    clearCurrentInspection(state) {
      state.currentInspection = null;
    },
    setLoading(state, action: { payload: boolean }) {
      state.isLoading = action.payload;
    },
    setError(state, action: { payload: string | null }) {
      state.error = action.payload;
    },
  },
});

export const { setCurrentInspection, clearCurrentInspection, setLoading, setError } =
  inspectionSlice.actions;
