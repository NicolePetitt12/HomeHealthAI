import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Text, TextInput, Button, Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenContainer, useDialog } from '../components';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '../hooks/useNotificationPreferences';
import type { NotificationPrefs } from '../hooks/useNotificationPreferences';
import { spacing, radii } from '../theme';
import type { MainStackScreenProps } from '../navigation/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = MainStackScreenProps<'Settings'>;

function PrefToggle({ label, description, value, disabled, onToggle }: {
  label: string;
  description: string;
  value: boolean;
  disabled?: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={prefStyles.row}>
      <View style={prefStyles.textWrap}>
        <Text variant="bodyMedium" style={[prefStyles.label, disabled && prefStyles.disabled]}>{label}</Text>
        <Text variant="bodySmall" style={[prefStyles.desc, disabled && prefStyles.disabled]}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        color="#C41E3A"
      />
    </View>
  );
}

const prefStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  textWrap: {
    flex: 1,
    marginRight: spacing.md,
  },
  label: {
    color: '#FFFFFF',
  },
  desc: {
    color: '#888888',
    marginTop: 2,
  },
  disabled: {
    opacity: 0.4,
  },
});

export function SettingsScreen(_props: Props) {
  const { user } = useAuth();
  const { showDialog } = useDialog();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [profileExpanded, setProfileExpanded] = useState(true);
  const [notifExpanded, setNotifExpanded] = useState(true);
  const { data: prefs } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();

  useEffect(() => {
    if (!user) return;
    setFullName((user.user_metadata?.full_name as string) ?? '');

    supabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.phone) setPhone(data.phone);
      });
  }, [user]);

  async function handleSave() {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), phone: phone.trim() || null })
        .eq('id', user.id);
      if (profileError) throw profileError;

      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      });
      if (authError) throw authError;

      showDialog({ title: 'Saved', message: 'Your profile has been updated.' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showDialog({ title: 'Error', message: msg });
    } finally {
      setIsSaving(false);
    }
  }

  function toggleProfile() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setProfileExpanded((v) => !v);
  }

  function toggleNotif() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNotifExpanded((v) => !v);
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Information */}
        <TouchableOpacity style={styles.accordionHeader} onPress={toggleProfile} activeOpacity={0.7}>
          <MaterialCommunityIcons name="account-outline" size={20} color="#B0B0B0" />
          <Text variant="bodyLarge" style={styles.accordionLabel}>Profile Information</Text>
          <MaterialCommunityIcons
            name={profileExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#666666"
          />
        </TouchableOpacity>
        {profileExpanded && (
          <View style={styles.accordionBody}>
            <TextInput
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              mode="outlined"
              style={styles.input}
              textColor="#FFFFFF"
              outlineColor="#3A2020"
              activeOutlineColor="#C41E3A"
              theme={{ colors: { onSurfaceVariant: '#888888' } }}
            />
            <TextInput
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
              textColor="#FFFFFF"
              outlineColor="#3A2020"
              activeOutlineColor="#C41E3A"
              theme={{ colors: { onSurfaceVariant: '#888888' } }}
            />
            <TextInput
              label="Email"
              value={user?.email ?? ''}
              mode="outlined"
              disabled
              style={styles.input}
              textColor="#888888"
              outlineColor="#3A2020"
              theme={{ colors: { onSurfaceVariant: '#888888' } }}
            />
            <Button
              mode="contained"
              onPress={handleSave}
              loading={isSaving}
              disabled={isSaving || !fullName.trim()}
              buttonColor="#C41E3A"
              textColor="#FFFFFF"
              style={styles.saveBtn}
              contentStyle={styles.saveBtnContent}
            >
              Save
            </Button>
          </View>
        )}

        <View style={styles.divider} />

        {/* Notifications */}
        <TouchableOpacity style={styles.accordionHeader} onPress={toggleNotif} activeOpacity={0.7}>
          <MaterialCommunityIcons name="bell-outline" size={20} color="#B0B0B0" />
          <Text variant="bodyLarge" style={styles.accordionLabel}>Notifications</Text>
          <MaterialCommunityIcons
            name={notifExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#666666"
          />
        </TouchableOpacity>
        {notifExpanded && prefs && (
          <View style={styles.accordionBody}>
            <PrefToggle
              label="Push Notifications"
              description="Receive alerts on your device"
              value={prefs.push_enabled}
              onToggle={(v) => updatePrefs.mutate({ push_enabled: v })}
            />
            <PrefToggle
              label="Scan Results"
              description="When your scan analysis is complete"
              value={prefs.scan_completed}
              disabled={!prefs.push_enabled}
              onToggle={(v) => updatePrefs.mutate({ scan_completed: v })}
            />
            <PrefToggle
              label="Subscription Updates"
              description="Plan changes and payment status"
              value={prefs.subscription_changed}
              disabled={!prefs.push_enabled}
              onToggle={(v) => updatePrefs.mutate({ subscription_changed: v })}
            />
            <PrefToggle
              label="App Updates"
              description="New features and improvements"
              value={prefs.app_update}
              disabled={!prefs.push_enabled}
              onToggle={(v) => updatePrefs.mutate({ app_update: v })}
            />
            <PrefToggle
              label="Promotions"
              description="Special offers and discounts"
              value={prefs.promotion}
              disabled={!prefs.push_enabled}
              onToggle={(v) => updatePrefs.mutate({ promotion: v })}
            />
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
    gap: spacing.md,
  },
  divider: {
    height: spacing.md,
  },
  input: {
    backgroundColor: '#1C1212',
  },
  saveBtn: {
    borderRadius: radii.md,
    marginTop: spacing.sm,
  },
  saveBtnContent: {
    paddingVertical: spacing.sm,
  },
});
