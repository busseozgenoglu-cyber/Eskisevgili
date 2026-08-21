import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import RNIap, {
  initConnection,
  getSubscriptions,
  requestSubscription,
  getAvailablePurchases,
  Subscription,
} from 'react-native-iap';
import SanalExMark from '../components/SanalExMark';
import { colors, type, radius, space, glow } from '../constants/theme';

const PRODUCT_ID = 'com.sanaleskisevgili.app.premium.weekly';
const PRIVACY_URL = 'https://busseozgenoglu-cyber.github.io/Eskisevgili/privacy.html';
const TERMS_URL = 'https://busseozgenoglu-cyber.github.io/Eskisevgili/privacy.html#terms';

interface Props {
  onClose?: () => void;
  onPurchased?: () => void;
}

export default function PaywallScreen({ onClose, onPurchased }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [fetchingProducts, setFetchingProducts] = useState(true);

  useEffect(() => {
    let mounted = true;
    initIAP(mounted);
    // Note: intentionally not calling endConnection() here. The IAP
    // connection is shared with useSubscription()'s listeners for the
    // lifetime of the app; tearing it down when this screen unmounts
    // would kill purchase-update delivery app-wide.
    return () => {
      mounted = false;
    };
  }, []);

  const initIAP = async (mounted: boolean) => {
    try {
      await initConnection();
      const subs = await getSubscriptions({ skus: [PRODUCT_ID] });
      if (mounted && subs.length > 0) {
        setSubscription(subs[0] as Subscription);
      }
    } catch (err) {
      console.warn('IAP init error:', err);
    } finally {
      if (mounted) setFetchingProducts(false);
    }
  };

  const handlePurchase = async () => {
    setLoading(true);
    try {
      await requestSubscription({ sku: PRODUCT_ID });
      // purchaseUpdatedListener in useSubscription hook handles success
      onPurchased?.();
    } catch (err: any) {
      if (err?.code !== 'E_USER_CANCELLED') {
        Alert.alert('Hata', 'Satın alma tamamlanamadı. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const purchases = await getAvailablePurchases();
      if (purchases.some(p => p.productId === PRODUCT_ID)) {
        Alert.alert('Tamamlandı', 'Aboneliğiniz geri yüklendi.');
        onPurchased?.();
      } else {
        Alert.alert('Bulunamadı', 'Aktif bir abonelik bulunamadı.');
      }
    } catch {
      Alert.alert('Hata', 'Geri yükleme başarısız. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (onClose) onClose();
    else if (router.canGoBack()) router.back();
    else router.replace('/home');
  };

  const priceStr = (subscription as any)?.localizedPrice ?? '₺239,99';

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleClose} hitSlop={12}>
          <Ionicons name="close" size={22} color={colors.textFaint} />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <SanalExMark size={64} />

          <Text style={styles.title}>Sohbet{'\n'}kilitli.</Text>
          <Text style={styles.sub}>
            Konuşmaya devam etmek için erişimi aç.{'\n'}İlk 7 gün ücretsiz.
          </Text>

          <View style={styles.divider} />

          <View style={styles.specs}>
            <SpecRow index="01" text="Sınırsız mesaj" />
            <SpecRow index="02" text="Anında yanıt" />
            <SpecRow index="03" text="Tüm kayıtlara erişim" />
          </View>

          <View style={styles.divider} />

          {/* Apple guideline 3.1.2(c): the subscription's title, length and
              price must all be visible inside the purchase flow itself. */}
          <View style={styles.planBox}>
            <Text style={styles.planBadge}>7 GÜN ÜCRETSİZ</Text>
            <Text style={styles.planName}>Premium Haftalık</Text>
            <Text style={styles.planPrice}>{priceStr} / hafta</Text>
            <Text style={styles.planTerms}>
              Süre: 1 hafta. Deneme sonunda otomatik yenilenir, dilediğin zaman
              App Store ayarlarından iptal edebilirsin.
            </Text>
          </View>

          <TouchableOpacity
            onPress={handlePurchase}
            disabled={loading || fetchingProducts}
            activeOpacity={0.7}
            style={[styles.cta, (loading || fetchingProducts) && styles.ctaDisabled]}
          >
            {loading ? (
              <ActivityIndicator color={colors.cyan} />
            ) : (
              <Text style={styles.ctaText}>ERİŞİMİ AÇ</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRestore} style={styles.restore} hitSlop={8}>
            <Text style={styles.restoreText}>Satın alımı geri yükle</Text>
          </TouchableOpacity>

          <View style={styles.legalLinks}>
            <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={8}>
              <Text style={styles.legalLink}>Gizlilik Politikası</Text>
            </TouchableOpacity>
            <Text style={styles.legalSep}>·</Text>
            <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)} hitSlop={8}>
              <Text style={styles.legalLink}>Kullanım Şartları</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  safe: { flex: 1 },
  closeBtn: { alignSelf: 'flex-end', padding: space.md },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xl },

  title: { ...type.display, color: colors.text, marginTop: space.lg },
  sub: { ...type.body, color: colors.textMuted, marginTop: space.sm },

  divider: { height: 1, backgroundColor: colors.hairline, marginVertical: space.lg },

  specs: { gap: space.md },
  specRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  specIndex: { ...type.label, color: colors.cyan, opacity: 0.6, marginTop: 3 },
  specText: { ...type.body, color: colors.textMuted, flex: 1 },

  planBox: {
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    borderRadius: radius.sharp,
    backgroundColor: colors.surface,
    padding: space.md,
    gap: 6,
  },
  planBadge: { ...type.label, color: colors.cyan },
  planName: { ...type.heading, color: colors.text, marginTop: space.xs },
  planPrice: { ...type.title, color: colors.text },
  planTerms: { ...type.small, color: colors.textFaint, fontSize: 11, marginTop: space.xs },

  cta: {
    borderWidth: 1,
    borderColor: colors.cyan,
    borderRadius: radius.sharp,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: colors.cyanFaint,
    marginTop: space.lg,
    ...glow(colors.cyan, 12),
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { ...type.label, color: colors.cyan },

  restore: { paddingVertical: space.md, alignItems: 'center' },
  restoreText: { ...type.small, color: colors.textFaint, textDecorationLine: 'underline' },

  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    marginTop: space.xs,
  },
  legalLink: { ...type.small, fontSize: 12, color: colors.textMuted, textDecorationLine: 'underline' },
  legalSep: { ...type.small, color: colors.textGhost },
});
