import React from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenContainer, PaymentListItem, useDialog } from '../components';
import { useInvoices } from '../hooks/useInvoices';
import { useInvoiceDownload } from '../hooks/useInvoiceDownload';
import { spacing } from '../theme';

export function PaymentHistoryScreen() {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInvoices();
  const { download, downloadingId, error: downloadError, clearError } = useInvoiceDownload();
  const { showDialog } = useDialog();

  const invoices = data?.pages.flatMap((p) => p.items) ?? [];

  React.useEffect(() => {
    if (downloadError) {
      showDialog({ title: 'Download failed', message: downloadError });
      clearError();
    }
  }, [downloadError]);

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#C41E3A" />
        </View>
      </ScreenContainer>
    );
  }

  if (isError) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#C41E3A" />
          <Text style={styles.errorText}>Failed to load payment history</Text>
          <Button mode="contained" buttonColor="#C41E3A" textColor="#FFFFFF" onPress={() => refetch()}>
            Retry
          </Button>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={false} padded={false}>
      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <PaymentListItem
            invoice={item}
            onDownload={download}
            isDownloading={downloadingId === item.id}
          />
        )}
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={isFetchingNextPage ? (
          <ActivityIndicator size="small" color="#C41E3A" style={styles.footerLoader} />
        ) : null}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="receipt-text-outline" size={56} color="#C41E3A" />
            <Text variant="titleMedium" style={styles.emptyTitle}>No payments yet</Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Your payment history will appear here after your first subscription charge.
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  list: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  footerLoader: {
    marginVertical: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptySubtext: {
    color: '#888888',
    textAlign: 'center',
  },
});
