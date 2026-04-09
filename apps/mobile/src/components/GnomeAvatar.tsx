import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Path, Polygon, Rect, Text as SvgText, G } from 'react-native-svg';

export type GnomeState = 'idle' | 'analyzing' | 'concern';

interface Props {
  state: GnomeState;
  size?: number;
}

function GnomeIdle({ size }: { size: number }) {
  return (
    <Image
      source={require('../../assets/hi-gnome.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

function GnomeAnalyzing({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Hat (slightly tilted) */}
      <G transform="rotate(-8, 100, 60)">
        <Polygon points="100,20 60,90 140,90" fill="#C41E3A" />
        <Ellipse cx="100" cy="90" rx="42" ry="10" fill="#7F0000" />
        <Rect x="62" y="83" width="76" height="12" rx="6" fill="#4CAF50" />
      </G>
      {/* Face */}
      <Ellipse cx="100" cy="116" rx="28" ry="26" fill="#FFCC80" />
      {/* Focused eyes */}
      <Ellipse cx="89" cy="111" rx="4.5" ry="3.5" fill="#4E342E" />
      <Ellipse cx="111" cy="111" rx="4.5" ry="3.5" fill="#4E342E" />
      <Circle cx="91" cy="110" r="1.5" fill="#FFFFFF" />
      <Circle cx="113" cy="110" r="1.5" fill="#FFFFFF" />
      {/* Focused brows */}
      <Path d="M84 106 Q89 103 94 106" stroke="#795548" strokeWidth="2" fill="none" />
      <Path d="M106 106 Q111 103 116 106" stroke="#795548" strokeWidth="2" fill="none" />
      {/* Nose */}
      <Ellipse cx="100" cy="118" rx="5" ry="4" fill="#FFAB40" />
      {/* Concentrated expression */}
      <Path d="M90 127 Q100 125 110 127" stroke="#795548" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Beard */}
      <Path d="M76 131 Q78 149 100 153 Q122 149 124 131" fill="#FAFAFA" />
      {/* Body */}
      <Rect x="72" y="149" width="56" height="36" rx="10" fill="#C41E3A" />
      {/* Left arm */}
      <Ellipse cx="60" cy="163" rx="14" ry="8" fill="#D32F2F" />
      {/* Right arm raised */}
      <Path d="M140 155 L158 138" stroke="#D32F2F" strokeWidth="14" strokeLinecap="round" />
      {/* Hands */}
      <Circle cx="50" cy="168" r="7" fill="#FFCC80" />
      <Circle cx="160" cy="136" r="8" fill="#FFCC80" />
      {/* Magnifying glass */}
      <Circle cx="172" cy="120" r="14" stroke="#FFA000" strokeWidth="4" fill="rgba(165,214,255,0.4)" />
      <Path d="M162 130 L152 140" stroke="#FFA000" strokeWidth="4" strokeLinecap="round" />
      {/* Belt */}
      <Rect x="72" y="166" width="56" height="8" rx="4" fill="#7F0000" />
      <Rect x="96" y="164" width="8" height="12" rx="2" fill="#FFA000" />
      {/* Legs */}
      <Rect x="78" y="183" width="18" height="20" rx="6" fill="#7F0000" />
      <Rect x="104" y="183" width="18" height="20" rx="6" fill="#7F0000" />
      {/* Boots */}
      <Ellipse cx="87" cy="200" rx="12" ry="6" fill="#4E342E" />
      <Ellipse cx="113" cy="200" rx="12" ry="6" fill="#4E342E" />
    </Svg>
  );
}

function GnomeConcern({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Hat (orange/concern) */}
      <Polygon points="100,20 60,90 140,90" fill="#E65100" />
      <Ellipse cx="100" cy="90" rx="42" ry="10" fill="#BF360C" />
      <Rect x="62" y="83" width="76" height="12" rx="6" fill="#FF6D00" />
      {/* Warning symbol */}
      <SvgText x="100" y="70" textAnchor="middle" fontSize="18" fill="#FFCC80">!</SvgText>
      {/* Face */}
      <Ellipse cx="100" cy="115" rx="28" ry="26" fill="#FFCC80" />
      {/* Worried eyes */}
      <Ellipse cx="90" cy="110" rx="4" ry="5" fill="#4E342E" />
      <Ellipse cx="110" cy="110" rx="4" ry="5" fill="#4E342E" />
      <Circle cx="92" cy="108" r="1.5" fill="#FFFFFF" />
      <Circle cx="112" cy="108" r="1.5" fill="#FFFFFF" />
      {/* Worried brows */}
      <Path d="M84 103 Q89 107 94 103" stroke="#795548" strokeWidth="2.5" fill="none" />
      <Path d="M106 103 Q111 107 116 103" stroke="#795548" strokeWidth="2.5" fill="none" />
      {/* Nose */}
      <Ellipse cx="100" cy="117" rx="5" ry="4" fill="#FFAB40" />
      {/* Worried mouth */}
      <Path d="M89 129 Q100 123 111 129" stroke="#795548" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Sweat drop */}
      <Path d="M118 105 Q120 110 118 113 Q115 110 118 105" fill="#81D4FA" />
      {/* Beard */}
      <Path d="M76 130 Q78 148 100 152 Q122 148 124 130" fill="#FAFAFA" />
      {/* Body */}
      <Rect x="72" y="148" width="56" height="36" rx="10" fill="#E65100" />
      {/* Arms raised in concern */}
      <Path d="M72 158 L55 143" stroke="#EF6C00" strokeWidth="14" strokeLinecap="round" />
      <Path d="M128 158 L145 143" stroke="#EF6C00" strokeWidth="14" strokeLinecap="round" />
      {/* Hands */}
      <Circle cx="51" cy="140" r="8" fill="#FFCC80" />
      <Circle cx="149" cy="140" r="8" fill="#FFCC80" />
      {/* Belt */}
      <Rect x="72" y="165" width="56" height="8" rx="4" fill="#BF360C" />
      <Rect x="96" y="163" width="8" height="12" rx="2" fill="#FFA000" />
      {/* Legs */}
      <Rect x="78" y="182" width="18" height="20" rx="6" fill="#BF360C" />
      <Rect x="104" y="182" width="18" height="20" rx="6" fill="#BF360C" />
      {/* Boots */}
      <Ellipse cx="87" cy="200" rx="12" ry="6" fill="#4E342E" />
      <Ellipse cx="113" cy="200" rx="12" ry="6" fill="#4E342E" />
    </Svg>
  );
}

const gnomeMap = {
  idle: GnomeIdle,
  analyzing: GnomeAnalyzing,
  concern: GnomeConcern,
} as const;

export function GnomeAvatar({ state, size = 80 }: Props) {
  const GnomeComponent = gnomeMap[state];
  return (
    <View style={styles.container}>
      <GnomeComponent size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
