import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

export type GnomeState = 'idle' | 'analyzing' | 'concern' | 'inconclusive' | 'noMold';

interface Props {
  state: GnomeState;
  size?: number;
}

function GnomeImage({ source, size }: { source: ReturnType<typeof require>; size: number }) {
  return <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />;
}

const gnomeAssets = {
  idle: require('../../assets/hi-gnome.png'),
  analyzing: require('../../assets/analisis-gnome.png'),
  concern: require('../../assets/result-mold-suspected.png'),
  inconclusive: require('../../assets/result-inconclusive.png'),
  noMold: require('../../assets/result-no-mold.png'),
} as const;

export function GnomeAvatar({ state, size = 80 }: Props) {
  return (
    <View style={styles.container}>
      <GnomeImage source={gnomeAssets[state]} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
