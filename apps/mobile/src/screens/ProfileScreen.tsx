import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenContainer } from '../components';
import { useAuth } from '../hooks/useAuth';
import { spacing, radii } from '../theme';
import { PRIVACY_POLICY_MD } from '../content/privacyPolicy';
import { TERMS_OF_SERVICE_MD } from '../content/termsOfService';
import type { MainTabScreenProps } from '../navigation/types';

type Props = MainTabScreenProps<'ProfileTab'>;

export function ProfileScreen({ navigation }: Props) {
  const { user, signOut, deleteAccount } = useAuth();

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all inspection data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              Alert.alert('Error', msg);
            }
          },
        },
      ],
    );
  }

  const initials = user?.email?.charAt(0).toUpperCase() ?? '?';

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>Profile</Text>
      </View>

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text variant="headlineLarge" style={styles.initials}>{initials}</Text>
        </View>
        <Text variant="titleMedium" style={styles.name}>
          {user?.user_metadata?.full_name ?? 'Homeowner'}
        </Text>
        <Text variant="bodySmall" style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity onPress={() => navigation.navigate('Legal', { title: 'Privacy Policy', content: PRIVACY_POLICY_MD })}>
          <View style={styles.menuItem}>
            <MaterialCommunityIcons name="shield-account-outline" size={22} color="#B0B0B0" />
            <Text variant="bodyLarge" style={styles.menuLabel}>Privacy Policy</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#3A3A3A" />
          </View>
        </TouchableOpacity>
        <Divider style={styles.divider} />
        <TouchableOpacity onPress={() => navigation.navigate('Legal', { title: 'Terms of Service', content: TERMS_OF_SERVICE_MD })}>
          <View style={styles.menuItem}>
            <MaterialCommunityIcons name="file-document-outline" size={22} color="#B0B0B0" />
            <Text variant="bodyLarge" style={styles.menuLabel}>Terms of Service</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#3A3A3A" />
          </View>
        </TouchableOpacity>
        <Divider style={styles.divider} />
        <View style={styles.menuItem}>
          <MaterialCommunityIcons name="bell-outline" size={22} color="#B0B0B0" />
          <Text variant="bodyLarge" style={styles.menuLabel}>Notifications</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#3A3A3A" />
        </View>
        <Divider style={styles.divider} />
        <View style={styles.menuItem}>
          <MaterialCommunityIcons name="help-circle-outline" size={22} color="#B0B0B0" />
          <Text variant="bodyLarge" style={styles.menuLabel}>Help & Support</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#3A3A3A" />
        </View>
        <Divider style={styles.divider} />
        <View style={styles.menuItem}>
          <MaterialCommunityIcons name="information-outline" size={22} color="#B0B0B0" />
          <Text variant="bodyLarge" style={styles.menuLabel}>About Inspector Gnome</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#3A3A3A" />
        </View>
      </View>

      <Button
        mode="outlined"
        onPress={signOut}
        textColor="#CF6679"
        style={styles.signOut}
        contentStyle={styles.signOutContent}
      >
        Sign Out
      </Button>

      <Button
        mode="text"
        onPress={handleDeleteAccount}
        textColor="#888888"
        contentStyle={styles.signOutContent}
      >
        Delete Account
      </Button>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  avatarSection: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxxl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  name: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  email: {
    color: '#B0B0B0',
  },
  menu: {
    backgroundColor: '#1E1E1E',
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  menuLabel: {
    flex: 1,
    color: '#FFFFFF',
  },
  divider: {
    backgroundColor: '#2A2A2A',
  },
  signOut: {
    borderColor: '#CF6679',
  },
  signOutContent: {
    paddingVertical: spacing.sm,
  },
});
