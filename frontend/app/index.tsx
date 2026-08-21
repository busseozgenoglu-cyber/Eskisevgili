import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import SanalExMark from '../components/SanalExMark';
import { colors, type, radius, space, glow, textGlow } from '../constants/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(24)).current;
  const pulse = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 1100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 1100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.8,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <Animated.View
          style={[styles.content, { opacity: fade, transform: [{ translateY: rise }] }]}
        >
          {/* Artwork carries the wordmark, so no separate SANALEX label here. */}
          <SanalExMark size={64} style={styles.brandLogo} />

          {/* Question in white, answer in cyan - the payoff line is the hook. */}
          <View style={styles.headline}>
            <Text style={styles.headlineText}>Onunla bir daha</Text>
            <Text style={styles.headlineText}>konuşabilseydin?</Text>
            <Animated.Text style={[styles.headlineAccent, { opacity: pulse }]}>
              Konuşabilirsin.
            </Animated.Text>
          </View>

          <Text style={styles.sub}>eski bir sohbet, yeni bir yüzleşme</Text>

          <View style={styles.divider} />

          <View style={styles.specs}>
            <SpecRow index="01" text="Onu tanımlayan tek kişi sensin" />
            <SpecRow index="02" text="Nasıl konuşurduysa öyle yanıtlar" />
            <SpecRow index="03" text="Kayıt sende kalır, kimseyle paylaşılmaz" />
          </View>
        </Animated.View>

        <Animated.View style={[styles.footer, { opacity: fade }]}>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => router.replace('/anket')}
            activeOpacity={0.7}
          >
            <Text style={styles.ctaText}>BAŞLAT</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace('/home')}
            style={styles.secondary}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryText}>MEVCUT KAYITLARIM</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

function SpecRow({ index, text }: { index: string; text: string }) {
  return (
    <View style={styles.specRow}>
      <Text style={styles.specIndex}>{index}</Text>
      <Text style={styles.specText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, justifyContent: 'space-between', paddingHorizontal: space.lg },
  content: { flex: 1, justifyContent: 'center' },

  brandLogo: { marginBottom: space.xl },

  headline: { marginBottom: space.md },
  headlineText: { ...type.display, color: colors.text },
  headlineAccent: { ...type.display, color: colors.cyan, ...textGlow(colors.cyan, 18) },

  sub: { ...type.small, color: colors.textFaint, fontStyle: 'italic' },

  divider: {
    height: 1,
    backgroundColor: colors.hairline,
    marginVertical: space.xl,
  },

  specs: { gap: space.md },
  specRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  specIndex: { ...type.label, color: colors.cyan, opacity: 0.6, marginTop: 3 },
  specText: { ...type.body, color: colors.textMuted, flex: 1 },

  footer: { paddingBottom: space.lg, gap: space.sm },
  cta: {
    borderWidth: 1,
    borderColor: colors.cyan,
    borderRadius: radius.sharp,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: colors.cyanFaint,
    ...glow(colors.cyan, 12),
  },
  ctaText: { ...type.label, color: colors.cyan },
  // Returning users need to find this without hunting, so it reads as a real
  // button - neutral border keeps the cyan CTA as the clear primary.
  secondary: {
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    borderRadius: radius.sharp,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  secondaryText: { ...type.label, color: colors.text },
});
