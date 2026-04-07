import React from 'react';
import { GnomeAvatar } from './GnomeAvatar';

interface Props {
  size?: number;
}

/**
 * App logo placeholder. Replace the implementation with the official
 * brand asset once available — all usages update automatically.
 */
export function AppLogo({ size = 140 }: Props) {
  return <GnomeAvatar state="idle" size={size} />;
}
