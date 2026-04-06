import React from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Professional } from '@inspector-gnome/shared';
import { spacing, radii } from '../theme';

interface Props {
  professional: Professional;
  rating?: number;
  distance?: string;
  tags?: string[];
  onBook?: () => void;
}

const typeLabels: Record<string, string> = {
  inspector: 'Certified Inspector',
  remediation: 'Mold Remediation Specialist',
  plumber: 'Licensed Plumber',
  hvac: 'HVAC Technician',
};

export function ProfessionalCard({ professional, rating, distance, tags, onBook }: Props) {
  function handleCall() {
    if (professional.phone) {
      Linking.openURL(`tel:${professional.phone}`);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account-circle" size={48} color="#C41E3A" />
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text variant="titleSmall" style={styles.name}>{professional.businessName}</Text>
            {professional.isVerified && (
              <MaterialCommunityIcons name="check-decagram" size={16} color="#C41E3A" />
            )}
          </View>
          <Text variant="bodySmall" style={styles.specialty}>
            {typeLabels[professional.professionalType] ?? professional.professionalType}
          </Text>
          <View style={styles.metaRow}>
            {rating !== undefined && (
              <View style={styles.meta}>
                <MaterialCommunityIcons name="star" size={12} color="#FFA726" />
                <Text variant="labelSmall" style={styles.metaText}>{rating.toFixed(1)}</Text>
              </View>
            )}
            {distance && (
              <View style={styles.meta}>
                <MaterialCommunityIcons name="map-marker" size={12} color="#888" />
                <Text variant="labelSmall" style={styles.metaText}>{distance}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {tags && tags.length > 0 && (
        <View style={styles.tags}>
          {tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text variant="labelSmall" style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={handleCall}
          disabled={!professional.phone}
          style={styles.btn}
          textColor="#C41E3A"
        >
          Call
        </Button>
        <Button
          mode="contained"
          onPress={onBook}
          style={styles.btn}
          buttonColor="#C41E3A"
        >
          Book Now
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1C1212',
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  specialty: {
    color: '#B0B0B0',
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    color: '#888888',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: '#2A1A1A',
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tagText: {
    color: '#B0B0B0',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btn: {
    flex: 1,
    borderColor: '#C41E3A',
  },
});
