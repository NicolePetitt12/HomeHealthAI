import AsyncStorage from '@react-native-async-storage/async-storage';

const LEGAL_CONSENT_KEY = '@inspector-gnome/legal-consent-accepted';

export async function hasAcceptedLegalConsent(): Promise<boolean> {
  const value = await AsyncStorage.getItem(LEGAL_CONSENT_KEY);
  return value === 'true';
}

export async function acceptLegalConsent(): Promise<void> {
  await AsyncStorage.setItem(LEGAL_CONSENT_KEY, 'true');
}

export async function resetLegalConsent(): Promise<void> {
  await AsyncStorage.removeItem(LEGAL_CONSENT_KEY);
}
