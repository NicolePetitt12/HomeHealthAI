import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path, G } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { PRIVACY_POLICY_MD } from '../content/privacyPolicy';
import { TERMS_OF_SERVICE_MD } from '../content/termsOfService';
import { useAuth } from '../hooks/useAuth';
import { GnomeAvatar, AppBackground } from '../components';
import { spacing, radii } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

function GoogleG({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.3 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.8 6C12.2 13.1 17.6 9.5 24 9.5z"/>
      <Path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.9 7.2l7.6 5.9c4.5-4.1 7.1-10.2 7.1-17.1z"/>
      <Path fill="#FBBC05" d="M10.4 28.7a14.6 14.6 0 0 1 0-9.4l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z"/>
      <Path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.6-5.9c-2 1.4-4.7 2.2-7.6 2.2-6.4 0-11.8-3.6-13.6-8.9l-7.8 6C6.6 42.6 14.6 48 24 48z"/>
      <G><Path fill="none" d="M0 0h48v48H0z"/></G>
    </Svg>
  );
}

function FacebookF({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#1877F2"
        d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
      />
    </Svg>
  );
}

export function LoginScreen({ navigation }: Props) {
  const { signIn, signInWithProvider } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

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

  async function handleSocial(provider: 'google' | 'facebook') {
    setSocialLoading(provider);
    setError(null);
    try {
      await signInWithProvider(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} sign-in failed.`);
    } finally {
      setSocialLoading(null);
    }
  }

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Hero */}
            <View style={styles.hero}>
              <GnomeAvatar state="idle" size={110} />
              <Text variant="headlineMedium" style={styles.title}>Inspector Gnome</Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                AI powered mold detection made easy.
              </Text>
            </View>

            {!showForm ? (
              <View style={styles.actions}>
                {/* Log In */}
                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={() => setShowForm(true)}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="lock" size={18} color="#FFFFFF" style={styles.btnIcon} />
                  <Text variant="labelLarge" style={styles.btnPrimaryText}>Log In</Text>
                </TouchableOpacity>

                {/* Sign Up */}
                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={() => navigation.navigate('Register')}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="account-plus" size={18} color="#FFFFFF" style={styles.btnIcon} />
                  <Text variant="labelLarge" style={styles.btnSecondaryText}>Sign Up</Text>
                </TouchableOpacity>

                {/* OR divider */}
                <View style={styles.orRow}>
                  <View style={styles.orLine} />
                  <Text variant="labelSmall" style={styles.orText}>OR</Text>
                  <View style={styles.orLine} />
                </View>

                {/* Facebook */}
                <TouchableOpacity
                  style={[styles.btnSocial, socialLoading === 'facebook' && styles.btnDisabled]}
                  onPress={() => handleSocial('facebook')}
                  disabled={socialLoading !== null}
                  activeOpacity={0.85}
                >
                  <View style={styles.socialIcon}>
                    <FacebookF size={20} />
                  </View>
                  <Text variant="labelLarge" style={styles.btnSocialText}>
                    {socialLoading === 'facebook' ? 'Connecting…' : 'Continue with Facebook'}
                  </Text>
                </TouchableOpacity>

                {/* Google */}
                <TouchableOpacity
                  style={[styles.btnSocial, socialLoading === 'google' && styles.btnDisabled]}
                  onPress={() => handleSocial('google')}
                  disabled={socialLoading !== null}
                  activeOpacity={0.85}
                >
                  <View style={styles.socialIcon}>
                    <GoogleG size={20} />
                  </View>
                  <Text variant="labelLarge" style={styles.btnSocialText}>
                    {socialLoading === 'google' ? 'Connecting…' : 'Continue with Google'}
                  </Text>
                </TouchableOpacity>

                {error && <Text style={styles.error}>{error}</Text>}

                {/* Legal disclaimer */}
                <Text style={styles.legalText}>
                  By signing up or logging in, you agree to our{' '}
                  <Text
                    style={styles.legalLink}
                    onPress={() => navigation.navigate('Legal', { title: 'Terms of Service', content: TERMS_OF_SERVICE_MD })}
                  >
                    Terms of Service
                  </Text>
                  {' '}and{' '}
                  <Text
                    style={styles.legalLink}
                    onPress={() => navigation.navigate('Legal', { title: 'Privacy Policy', content: PRIVACY_POLICY_MD })}
                  >
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </View>
            ) : (
              /* Login form */
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
                  outlineColor="#3A2020"
                  activeOutlineColor="#C41E3A"
                  style={styles.input}
                  theme={{ colors: { background: '#1C1212', onSurfaceVariant: '#B0A0A0' } }}
                />
                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  mode="outlined"
                  textColor="#FFFFFF"
                  outlineColor="#3A2020"
                  activeOutlineColor="#C41E3A"
                  style={styles.input}
                  theme={{ colors: { background: '#1C1212', onSurfaceVariant: '#B0A0A0' } }}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword((v) => !v)}
                      color="#B0A0A0"
                    />
                  }
                />

                {error && <Text style={styles.error}>{error}</Text>}

                <TouchableOpacity
                  style={[styles.btnPrimary, isLoading && styles.btnDisabled]}
                  onPress={handleSignIn}
                  disabled={isLoading || !email.trim() || !password}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="lock" size={18} color="#FFFFFF" style={styles.btnIcon} />
                  <Text variant="labelLarge" style={styles.btnPrimaryText}>
                    {isLoading ? 'Signing in…' : 'Log In'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setShowForm(false)} style={styles.backLink}>
                  <Text variant="bodySmall" style={styles.backLinkText}>← Back</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxxl,
    paddingBottom: spacing.xxxl,
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
    paddingTop: spacing.xxxl * 2,
    gap: spacing.md,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    color: '#C0A8A8',
    textAlign: 'center',
  },
  actions: {
    gap: spacing.md,
    paddingTop: spacing.xxxl,
  },
  form: {
    gap: spacing.lg,
    paddingTop: spacing.xxl,
  },
  input: {
    backgroundColor: '#1C1212',
  },
  btnPrimary: {
    backgroundColor: '#C41E3A',
    borderRadius: radii.full,
    paddingVertical: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  btnSecondary: {
    backgroundColor: '#1C1212',
    borderRadius: radii.full,
    paddingVertical: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3A2020',
  },
  btnSecondaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  btnSocial: {
    backgroundColor: '#1C1212',
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#2A1A1A',
  },
  btnSocialText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 15,
    flex: 1,
    textAlign: 'center',
  },
  btnIcon: {
    marginRight: spacing.sm,
  },
  socialIcon: {
    width: 24,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2A1A1A',
  },
  orText: {
    color: '#666666',
    letterSpacing: 1,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  error: {
    color: '#FF6B6B',
    textAlign: 'center',
    fontSize: 13,
  },
  backLink: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  backLinkText: {
    color: '#B0A0A0',
  },
  legalText: {
    color: '#888888',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  legalLink: {
    color: '#C41E3A',
  },
});
