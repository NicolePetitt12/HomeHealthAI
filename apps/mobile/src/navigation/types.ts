import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Onboarding
export type OnboardingStackParamList = {
  Welcome: undefined;
  Features: undefined;
  Permissions: undefined;
};

// Auth
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Main app
export type MainStackParamList = {
  Home: undefined;
  Camera: undefined;
  Results: { inspectionId: string };
  History: undefined;
};

// Root — used for inter-navigator navigation
export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
};

// Convenience screen prop types
export type MainStackScreenProps<T extends keyof MainStackParamList> =
  NativeStackScreenProps<MainStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type OnboardingStackScreenProps<T extends keyof OnboardingStackParamList> =
  NativeStackScreenProps<OnboardingStackParamList, T>;
