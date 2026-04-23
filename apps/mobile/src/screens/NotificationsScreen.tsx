import React from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenContainer, GnomeAvatar, useDialog } from '../components';
import { spacing, radii } from '../theme';
import {
  useNotificationsList,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '../hooks/useNotifications';
import type { MainStackScreenProps } from '../navigation/types';

type Props = MainStackScreenProps<'Notifications'>;

const TYPE_ICONS: Record<string, string> = {
  scan_completed: 'magnify-scan',
  subscription_changed: 'credit-card-outline',
  app_update: 'cellphone-arrow-down',
  promotion: 'tag-outline',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationsScreen({ navigation }: Props) {
  const { data: notifications, isLoading } = useNotificationsList();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();
  const { showDialog } = useDialog();

  const hasUnread = notifications?.some((n) => !n.is_read) ?? false;

  function handleTap(item: NonNullable<typeof notifications>[number]) {
    if (!item.is_read) markAsRead.mutate(item.id);

    const screen = item.data?.screen as string | undefined;
    if (screen === 'Results' && item.data?.scanId) {
      navigation.navigate('Results', { inspectionId: item.data.scanId as string });
    } else if (screen === 'Subscription') {
      navigation.navigate('Subscription');
    }
  }

  function handleLongPress(item: NonNullable<typeof notifications>[number]) {
    showDialog({
      title: 'Delete Notification',
      message: 'Remove this notification?',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteNotification.mutate(item.id) },
      ],
    });
  }

  return (
    <ScreenContainer scrollable={false}>
      {hasUnread && (
        <TouchableOpacity style={styles.markAllBtn} onPress={() => markAllAsRead.mutate()}>
          <MaterialCommunityIcons name="check-all" size={18} color="#C41E3A" />
          <Text variant="labelMedium" style={styles.markAllText}>Mark All Read</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={notifications?.length === 0 ? styles.emptyContainer : undefined}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.item, !item.is_read && styles.itemUnread]}
            onPress={() => handleTap(item)}
            onLongPress={() => handleLongPress(item)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons
                name={(TYPE_ICONS[item.type] ?? 'bell-outline') as never}
                size={22}
                color={item.is_read ? '#666666' : '#C41E3A'}
              />
            </View>
            <View style={styles.textWrap}>
              <Text variant="bodyMedium" style={[styles.title, !item.is_read && styles.titleUnread]}>
                {item.title}
              </Text>
              <Text variant="bodySmall" style={styles.body} numberOfLines={2}>
                {item.body}
              </Text>
              <Text variant="labelSmall" style={styles.time}>{timeAgo(item.created_at)}</Text>
            </View>
            {!item.is_read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.emptyState}>
              <GnomeAvatar state="idle" size={100} />
              <Text variant="titleMedium" style={styles.emptyTitle}>No Notifications</Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                You're all caught up! Notifications will appear here when your scans complete or your subscription changes.
              </Text>
            </View>
          )
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  markAllText: {
    color: '#C41E3A',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1212',
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  itemUnread: {
    backgroundColor: '#241414',
    borderLeftWidth: 3,
    borderLeftColor: '#C41E3A',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#B0B0B0',
  },
  titleUnread: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  body: {
    color: '#888888',
    lineHeight: 18,
  },
  time: {
    color: '#666666',
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C41E3A',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: spacing.md,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyText: {
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.xl,
  },
});
