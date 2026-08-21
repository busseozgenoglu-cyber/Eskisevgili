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
import { colors, type, radius, space, glow } from '../constants/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(24)).current;
  const pulse = useRef(new Animated.Value(0.45)).current;

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
          toValue: 0.45,
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
          <View style={styles.brandRow}>
            <SanalExMark size={34} />
            <Text style={styles.brand}>SANALEX</Text>
          </View>

          <View style={styles.headline}>
            <Text style={styles.headlineText}>Geçmiş bazen</Text>
            <Text style={styles.headlineText}>geri dönmez.</Text>
            <Animated.Text style={[styles.headlineAccent, { opacity: pulse }]}>
              Konuşur.
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

          <TouchableOpacity onPress={() => router.replace('/home')} style={styles.ghost}>
            <Text style={styles.ghostText}>Mevcut kayıtlarım</Text>
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

  brandRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.xl },
  brand: { ...type.label, color: colors.cyan },

  headline: { marginBottom: space.md },
  headlineText: { ...type.display, color: colors.text },
  headlineAccent: { ...type.display, color: colors.cyan, ...glow(colors.cyan, 14) },

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
  ghost: { paddingVertical: space.md, alignItems: 'center' },
  ghostText: { ...type.small, color: colors.textFaint },
});
