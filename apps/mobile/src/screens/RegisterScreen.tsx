import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useLegalConsent } from '../contexts/LegalConsentContext';
import { GnomeAvatar } from '../components';
import { spacing } from '../theme';
import { TERMS_OF_SERVICE_MD } from '../content/termsOfService';
import { PRIVACY_POLICY_MD } from '../content/privacyPolicy';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const { resetOnboarding } = useOnboarding();
  const { resetTerms } = useLegalConsent();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!fullName.trim()) return 'Full name is required.';
    if (!email.trim()) return 'Email is required.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  }

  async function handleSignUp() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await signUp(email.trim(), password, fullName.trim());
      await resetOnboarding();
      await resetTerms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
      >
        <View style={styles.header}>
          <GnomeAvatar state="idle" size={80} />
          <Text variant="headlineMedium" style={styles.title}>Create Account</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Start protecting your home today
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoComplete="name"
            mode="outlined"
            textColor="#FFFFFF"
            style={styles.input}
          />
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            mode="outlined"
            textColor="#FFFFFF"
            style={styles.input}
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            mode="outlined"
            textColor="#FFFFFF"
            style={styles.input}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword((v) => !v)}
              />
            }
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Button
            mode="contained"
            onPress={handleSignUp}
            loading={isLoading}
            disabled={isLoading}
            buttonColor="#2E7D32"
            contentStyle={styles.buttonContent}
          >
            Create Account
          </Button>

          <Text variant="bodySmall" style={styles.legalText}>
            {'By creating an account, you agree to our '}
            <Text
              style={styles.legalLink}
              onPress={() => navigation.navigate('Legal', { title: 'Terms of Service', content: TERMS_OF_SERVICE_MD })}
            >
              Terms of Service
            </Text>
            {' and '}
            <Text
              style={styles.legalLink}
              onPress={() => navigation.navigate('Legal', { title: 'Privacy Policy', content: PRIVACY_POLICY_MD })}
            >
              Privacy Policy
            </Text>
            .
          </Text>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            disabled={isLoading}
            textColor="#2E7D32"
          >
            Already have an account? Sign in
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scroll: {
    backgroundColor: '#121212',
  },
  container: {
    flexGrow: 1,
    padding: spacing.xxxl,
    justifyContent: 'center',
    gap: spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  subtitle: {
    color: '#B0B0B0',
  },
  form: {
    gap: spacing.lg,
  },
  input: {
    backgroundColor: '#1E1E1E',
  },
  error: {
    color: '#FF6B6B',
    textAlign: 'center',
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  legalText: {
    color: '#888888',
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: '#2E7D32',
    textDecorationLine: 'underline' as const,
  },
});
