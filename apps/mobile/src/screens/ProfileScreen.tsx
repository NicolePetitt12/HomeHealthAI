import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenContainer } from '../components';
import { useAuth } from '../hooks/useAuth';
import { spacing, radii } from '../theme';

const MENU_ITEMS = [
  { icon: 'bell-outline', label: 'Notifications' },
  { icon: 'shield-account-outline', label: 'Privacy & Security' },
  { icon: 'help-circle-outline', label: 'Help & Support' },
  { icon: 'information-outline', label: 'About Inspector Gnome' },
] as const;

export function ProfileScreen() {
  const { user, signOut } = useAuth();

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
        {MENU_ITEMS.map((item, index) => (
          <View key={item.label}>
            <View style={styles.menuItem}>
              <MaterialCommunityIcons name={item.icon} size={22} color="#B0B0B0" />
              <Text variant="bodyLarge" style={styles.menuLabel}>{item.label}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#3A3A3A" />
            </View>
            {index < MENU_ITEMS.length - 1 && <Divider style={styles.divider} />}
          </View>
        ))}
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
