import React from 'react';
import { Image, StyleSheet, ImageStyle, StyleProp } from 'react-native';

const LOGO = require('../assets/images/icon.png');

/**
 * Brand mark. The artwork already carries the SanalEx wordmark, so avoid
 * pairing it with a second wordmark at large sizes.
 */
export default function SanalExMark({
  size = 96,
  style,
}: {
  size?: number;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={LOGO}
      style={[styles.logo, { width: size, height: size, borderRadius: size * 0.22 }, style]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    shadowColor: '#2B7FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
});
