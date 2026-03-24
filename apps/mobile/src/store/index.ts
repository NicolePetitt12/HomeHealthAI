import { configureStore } from '@reduxjs/toolkit';
import { inspectionSlice } from './slices/inspectionSlice';

export const store = configureStore({
  reducer: {
    inspection: inspectionSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
