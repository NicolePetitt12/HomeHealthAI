import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';

// ─── Onboarding ──────────────────────────────────────────────────────────────

export type OnboardingStackParamList = {
  Welcome: undefined;
  Features: undefined;
  Permissions: undefined;
};

// ─── Auth ────────────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// ─── Main Tabs ───────────────────────────────────────────────────────────────

export type MainTabParamList = {
  HomeTab: undefined;
  HistoryTab: undefined;
  CameraTab: undefined;
  ProfileTab: undefined;
};

// ─── Main Stack (tabs + detail screens) ──────────────────────────────────────

export type MainStackParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList>;
  Results: { inspectionId: string };
  FindAPro: { scanId?: string };
  Camera: undefined;
};

// ─── Root ────────────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
};

// ─── Screen prop helpers ──────────────────────────────────────────────────────

export type MainStackScreenProps<T extends keyof MainStackParamList> =
  NativeStackScreenProps<MainStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<MainStackParamList>
>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type OnboardingStackScreenProps<T extends keyof OnboardingStackParamList> =
  NativeStackScreenProps<OnboardingStackParamList, T>;
