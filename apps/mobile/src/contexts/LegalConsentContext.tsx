import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  hasAcceptedLegalConsent,
  acceptLegalConsent as persistConsent,
  resetLegalConsent as clearConsent,
} from '../services/legalConsent';

interface LegalConsentContextValue {
  hasAcceptedTerms: boolean | null;
  acceptTerms: () => Promise<void>;
  resetTerms: () => Promise<void>;
}

const LegalConsentContext = createContext<LegalConsentContextValue | null>(null);

export function LegalConsentProvider({ children }: { children: React.ReactNode }) {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean | null>(null);

  useEffect(() => {
    hasAcceptedLegalConsent().then(setHasAcceptedTerms);
  }, []);

  async function acceptTerms() {
    await persistConsent();
    setHasAcceptedTerms(true);
  }

  async function resetTerms() {
    await clearConsent();
    setHasAcceptedTerms(false);
  }

  return (
    <LegalConsentContext.Provider value={{ hasAcceptedTerms, acceptTerms, resetTerms }}>
      {children}
    </LegalConsentContext.Provider>
  );
}

export function useLegalConsent(): LegalConsentContextValue {
  const ctx = useContext(LegalConsentContext);
  if (!ctx) throw new Error('useLegalConsent must be used within LegalConsentProvider');
  return ctx;
}
