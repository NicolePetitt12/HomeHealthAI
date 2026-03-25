import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { GnomeAvatar } from '../components';
import { spacing, radii } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    if (!email.trim() || !password) return;
    setIsLoading(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
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
          <GnomeAvatar state="idle" size={96} />
          <Text variant="headlineMedium" style={styles.title}>Sign In</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Welcome back to Inspector Gnome
          </Text>
        </View>

        <View style={styles.form}>
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
            autoComplete="password"
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
            onPress={handleSignIn}
            loading={isLoading}
            disabled={isLoading || !email.trim() || !password}
            buttonColor="#2E7D32"
            contentStyle={styles.buttonContent}
          >
            Sign In
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Register')}
            disabled={isLoading}
            textColor="#2E7D32"
          >
            Don't have an account? Create one
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
});
