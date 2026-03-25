import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  hasCompletedOnboarding,
  completeOnboarding as persistOnboarding,
  resetOnboarding as clearOnboarding,
} from '../services/onboarding';

interface OnboardingContextValue {
  hasOnboarded: boolean | null;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    hasCompletedOnboarding().then(setHasOnboarded);
  }, []);

  async function completeOnboarding() {
    await persistOnboarding();
    setHasOnboarded(true);
  }

  async function resetOnboarding() {
    await clearOnboarding();
    setHasOnboarded(false);
  }

  return (
    <OnboardingContext.Provider value={{ hasOnboarded, completeOnboarding, resetOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
