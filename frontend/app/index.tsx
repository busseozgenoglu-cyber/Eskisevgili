import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(40));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={['#0A0A0F', '#1A1A2E', '#16213E']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['#6C63FF', '#9D4EDD']}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="heart" size={52} color="#fff" />
          </LinearGradient>
        </View>

        {/* Başlık */}
        <Text style={styles.title}>Eski Sevgili</Text>
        <Text style={styles.tagline}>Onunla bir daha konuşabilseydin…</Text>

        {/* Özellikler */}
        <View style={styles.features}>
          <FeatureRow icon="sparkles" text="Onu tam olarak sen tanımlıyorsun" />
          <FeatureRow icon="chatbubble-ellipses" text="O nasıl konuşurdu, o şekilde yanıt veriyor" />
          <FeatureRow icon="lock-closed" text="Sadece seninle, tamamen özel" />
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/anket')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#6C63FF', '#9D4EDD']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>Eski Sevgilini Oluştur</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/home')} style={styles.skipButton}>
          <Text style={styles.skipText}>Zaten bir anım var →</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

function FeatureRow({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={18} color="#9D4EDD" />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 30,
    width: '100%',
  },
  logoContainer: {
    marginBottom: 28,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  logoGradient: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  features: {
    width: '100%',
    marginBottom: 48,
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(108,99,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
  },
  button: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: 20,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
    gap: 10,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  skipButton: {
    paddingVertical: 10,
  },
  skipText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.35)',
  },
});
