import React, { useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenContainer, FaqSection, ContactForm } from '../components';
import { spacing, radii } from '../theme';
import type { MainStackScreenProps } from '../navigation/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = MainStackScreenProps<'HelpSupport'>;

export function HelpSupportScreen(_props: Props) {
  const [faqExpanded, setFaqExpanded] = useState(false);
  const [contactExpanded, setContactExpanded] = useState(false);

  function toggleFaq() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFaqExpanded((v) => !v);
  }

  function toggleContact() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setContactExpanded((v) => !v);
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* FAQ accordion */}
        <TouchableOpacity style={styles.accordionHeader} onPress={toggleFaq} activeOpacity={0.7}>
          <MaterialCommunityIcons name="frequently-asked-questions" size={20} color="#B0B0B0" />
          <Text variant="bodyLarge" style={styles.accordionLabel}>
            Frequently Asked Questions
          </Text>
          <MaterialCommunityIcons
            name={faqExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#666666"
          />
        </TouchableOpacity>
        {faqExpanded && (
          <View style={styles.accordionBody}>
            <FaqSection />
          </View>
        )}

        <View style={styles.divider} />

        {/* Contact Form accordion */}
        <TouchableOpacity style={styles.accordionHeader} onPress={toggleContact} activeOpacity={0.7}>
          <MaterialCommunityIcons name="email-outline" size={20} color="#B0B0B0" />
          <Text variant="bodyLarge" style={styles.accordionLabel}>
            Contact Us
          </Text>
          <MaterialCommunityIcons
            name={contactExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#666666"
          />
        </TouchableOpacity>
        {contactExpanded && (
          <View style={styles.accordionBody}>
            <ContactForm />
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
});
