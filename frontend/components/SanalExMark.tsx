import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

const RAY_COUNT = 14;

/**
 * Neon speech-bubble mark. Drawn with plain Views rather than SVG so the
 * app doesn't take on react-native-svg just for the logo.
 */
export default function SanalExMark({ size = 96 }: { size?: number }) {
  const ring = size * 0.68;
  const dot = Math.max(3, size * 0.055);
  const rayLength = size * 0.1;
  const rayOrbit = ring / 2 + size * 0.075;

  return (
    <View style={[styles.root, { width: size, height: size }]}>
      {Array.from({ length: RAY_COUNT }).map((_, i) => {
        // Leave a gap where the tail sits so the rays don't collide with it.
        const angle = (360 / RAY_COUNT) * i;
        if (angle > 190 && angle < 250) return null;
        return (
          <View
            key={i}
            style={[
              styles.rayWrap,
              { transform: [{ rotate: `${angle}deg` }, { translateY: -rayOrbit }] },
            ]}
          >
            <View style={[styles.ray, { width: 1.5, height: rayLength }]} />
          </View>
        );
      })}

      <View
        style={[
          styles.ring,
          { width: ring, height: ring, borderRadius: ring / 2, borderWidth: Math.max(2, size * 0.022) },
        ]}
      >
        <View style={styles.dots}>
          <View style={[styles.dot, { width: dot, height: dot, borderRadius: dot / 2 }]} />
          <View
            style={[
              styles.dot,
              { width: dot, height: dot, borderRadius: dot / 2, marginLeft: size * 0.11 },
            ]}
          />
        </View>
      </View>

      <View
        style={[
          styles.tail,
          {
            width: size * 0.2,
            height: size * 0.2,
            borderLeftWidth: Math.max(2, size * 0.022),
            borderBottomWidth: Math.max(2, size * 0.022),
            bottom: size * 0.13,
            left: size * 0.17,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
  rayWrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ray: {
    backgroundColor: colors.violet,
    shadowColor: colors.violet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  ring: {
    borderColor: colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.violet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 12,
  },
  dots: { flexDirection: 'row', alignItems: 'center' },
  dot: {
    backgroundColor: colors.violet,
    shadowColor: colors.violet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  tail: {
    position: 'absolute',
    borderColor: colors.violet,
    transform: [{ rotate: '12deg' }],
    shadowColor: colors.violet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
});
