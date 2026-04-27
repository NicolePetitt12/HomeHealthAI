import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Button, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenContainer, WelcomeCard, SubscriptionCard, useDialog } from '../components';
import { useAuth } from '../hooks/useAuth';
import { spacing, radii } from '../theme';
import { PRIVACY_POLICY_MD } from '../content/privacyPolicy';
import { TERMS_OF_SERVICE_MD } from '../content/termsOfService';
import type { MainTabScreenProps } from '../navigation/types';

type Props = MainTabScreenProps<'ProfileTab'>;

export function ProfileScreen({ navigation }: Props) {
  const { user, signOut, deleteAccount } = useAuth();
  const { showDialog } = useDialog();

  function handleDeleteAccount() {
    showDialog({
      title: 'Delete Account',
      message: 'This will permanently delete your account and all inspection data. This action cannot be undone.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              showDialog({ title: 'Error', message: msg });
            }
          },
        },
      ],
    });
  }

  return (
    <ScreenContainer>
      <WelcomeCard
        title={user?.user_metadata?.full_name as string ?? 'Homeowner'}
        subtitle={user?.email ?? ''}
      />

      <SubscriptionCard onManagePlan={() => navigation.navigate('Subscription')} />

      <View style={styles.menu}>
        <TouchableOpacity onPress={() => navigation.navigate('HistoryTab')}>
          <View style={styles.menuItem}>
            <MaterialCommunityIcons name="clipboard-list-outline" size={22} color="#B0B0B0" />
            <Text variant="bodyLarge" style={styles.menuLabel}>Scan History</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#3A3A3A" />
          </View>
        </TouchableOpacity>
        <Divider style={styles.divider} />
        <Divider style={styles.divider} />
        <TouchableOpacity onPress={() => navigation.navigate('PaymentHistory')}>
          <View style={styles.menuItem}>
            <MaterialCommunityIcons name="receipt-outline" size={22} color="#B0B0B0" />
            <Text variant="bodyLarge" style={styles.menuLabel}>Payment History</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#3A3A3A" />
          </View>
        </TouchableOpacity>
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
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <View style={styles.menuItem}>
            <MaterialCommunityIcons name="bell-outline" size={22} color="#B0B0B0" />
            <Text variant="bodyLarge" style={styles.menuLabel}>Notifications</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#3A3A3A" />
          </View>
        </TouchableOpacity>
        <Divider style={styles.divider} />
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <View style={styles.menuItem}>
            <MaterialCommunityIcons name="cog-outline" size={22} color="#B0B0B0" />
            <Text variant="bodyLarge" style={styles.menuLabel}>Settings</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#3A3A3A" />
          </View>
        </TouchableOpacity>
        <Divider style={styles.divider} />
        <TouchableOpacity onPress={() => navigation.navigate('HelpSupport')}>
          <View style={styles.menuItem}>
            <MaterialCommunityIcons name="help-circle-outline" size={22} color="#B0B0B0" />
            <Text variant="bodyLarge" style={styles.menuLabel}>Help & Support</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#3A3A3A" />
          </View>
        </TouchableOpacity>
      </View>

      <Button
        mode="contained"
        onPress={signOut}
        buttonColor="#C41E3A"
        textColor="#FFFFFF"
        style={styles.logOut}
        contentStyle={styles.signOutContent}
      >
        Log Out
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
  menu: {
    backgroundColor: '#1C1212',
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
    backgroundColor: '#2A1A1A',
  },
  logOut: {
    borderRadius: 8,
  },
  signOutContent: {
    paddingVertical: spacing.sm,
  },
});
