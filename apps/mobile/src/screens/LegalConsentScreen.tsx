import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Markdown from '@ronradtke/react-native-markdown-display';
import { GnomeAvatar, AppBackground } from '../components';
import { useLegalConsent } from '../contexts/LegalConsentContext';
import { PRIVACY_POLICY_MD } from '../content/privacyPolicy';
import { TERMS_OF_SERVICE_MD } from '../content/termsOfService';
import { spacing, radii } from '../theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function LegalConsentScreen() {
  const { acceptTerms } = useLegalConsent();
  const [ppExpanded, setPpExpanded] = useState(false);
  const [tosExpanded, setTosExpanded] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function togglePp() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPpExpanded((v) => !v);
  }

  function toggleTos() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTosExpanded((v) => !v);
  }

  async function handleAccept() {
    if (!accepted) return;
    setIsLoading(true);
    await acceptTerms();
    setIsLoading(false);
  }

  return (
    <AppBackground>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <GnomeAvatar state="idle" size={72} />
        <Text variant="headlineSmall" style={styles.title}>Before You Begin</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Please review our Privacy Policy and Terms of Service. You must accept them to use Inspector Gnome.
        </Text>
      </View>

      {/* Privacy Policy accordion */}
      <TouchableOpacity style={styles.accordionHeader} onPress={togglePp} activeOpacity={0.7}>
        <MaterialCommunityIcons name="shield-account-outline" size={20} color="#B0B0B0" />
        <Text variant="bodyLarge" style={styles.accordionLabel}>Privacy Policy</Text>
        <MaterialCommunityIcons
          name={ppExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#666666"
        />
      </TouchableOpacity>
      {ppExpanded && (
        <View style={styles.accordionBody}>
          <Markdown style={markdownStyles}>{PRIVACY_POLICY_MD}</Markdown>
        </View>
      )}

      <View style={styles.divider} />

      {/* Terms of Service accordion */}
      <TouchableOpacity style={styles.accordionHeader} onPress={toggleTos} activeOpacity={0.7}>
        <MaterialCommunityIcons name="file-document-outline" size={20} color="#B0B0B0" />
        <Text variant="bodyLarge" style={styles.accordionLabel}>Terms of Service</Text>
        <MaterialCommunityIcons
          name={tosExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#666666"
        />
      </TouchableOpacity>
      {tosExpanded && (
        <View style={styles.accordionBody}>
          <Markdown style={markdownStyles}>{TERMS_OF_SERVICE_MD}</Markdown>
        </View>
      )}

      <View style={styles.divider} />

      {/* Acceptance checkbox */}
      <TouchableOpacity
        style={styles.checkRow}
        onPress={() => setAccepted((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
          {accepted && (
            <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
          )}
        </View>
        <Text variant="bodyMedium" style={styles.checkLabel}>
          I have read and agree to the Privacy Policy and Terms of Service
        </Text>
      </TouchableOpacity>

      <Button
        mode="contained"
        onPress={handleAccept}
        disabled={!accepted || isLoading}
        loading={isLoading}
        buttonColor="#C41E3A"
        contentStyle={styles.btnContent}
        style={styles.btn}
      >
        Accept & Continue
      </Button>
    </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  subtitle: {
    color: '#B0B0B0',
    textAlign: 'center',
    lineHeight: 20,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    backgroundColor: '#1C1212',
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
  },
  accordionLabel: {
    flex: 1,
    color: '#FFFFFF',
  },
  accordionBody: {
    backgroundColor: '#181818',
    borderRadius: radii.md,
    padding: spacing.lg,
    marginTop: 2,
  },
  divider: {
    height: spacing.md,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#C41E3A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#C41E3A',
  },
  checkLabel: {
    flex: 1,
    color: '#E0E0E0',
    lineHeight: 20,
  },
  btn: {
    borderRadius: radii.sm,
  },
  btnContent: {
    paddingVertical: spacing.sm,
  },
});

const markdownStyles = {
  body: {
    color: '#E0E0E0',
    fontSize: 13,
    lineHeight: 20,
    backgroundColor: '#181818',
  },
  heading1: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
    fontSize: 18,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  heading2: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
    fontSize: 15,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  heading3: {
    color: '#E0E0E0',
    fontWeight: '600' as const,
    fontSize: 14,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  paragraph: {
    color: '#E0E0E0',
    marginBottom: spacing.sm,
  },
  strong: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  link: {
    color: '#C41E3A',
  },
  hr: {
    backgroundColor: '#2A1A1A',
    height: 1,
    marginVertical: spacing.md,
  },
};
