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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as RNIap from 'react-native-iap';

const PRODUCT_ID = 'com.sanaleskisevgili.app.premium.monthly';

interface Props {
  onClose?: () => void;
  onPurchased?: () => void;
}

export default function PaywallScreen({ onClose, onPurchased }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<RNIap.Subscription | null>(null);
  const [fetchingProducts, setFetchingProducts] = useState(true);

  useEffect(() => {
    initIAP();
    return () => {
      RNIap.endConnection();
    };
  }, []);

  const initIAP = async () => {
    try {
      await RNIap.initConnection();
      const subs = await RNIap.getSubscriptions({ skus: [PRODUCT_ID] });
      if (subs.length > 0) {
        setSubscription(subs[0]);
      }
    } catch (err) {
      console.warn('IAP init error:', err);
    } finally {
      setFetchingProducts(false);
    }
  };

  const handlePurchase = async () => {
    setLoading(true);
    try {
      await RNIap.requestSubscription({ sku: PRODUCT_ID });
      // Purchase listener handles success
    } catch (err: any) {
      if (err.code !== 'E_USER_CANCELLED') {
        Alert.alert('Hata', 'Satın alma tamamlanamadı. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      await RNIap.getPurchaseHistory();
      Alert.alert('Tamamlandı', 'Satın alımlarınız geri yüklendi.');
      onPurchased?.();
    } catch {
      Alert.alert('Hata', 'Geri yükleme başarısız. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const priceStr = subscription?.localizedPrice ?? '₺899,99';

  return (
    <LinearGradient colors={['#0A0A0F', '#1A0A2E']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
          <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Heart icon */}
          <View style={styles.iconWrap}>
            <Text style={styles.heartIcon}>💔</Text>
          </View>

          <Text style={styles.title}>Sınırsız Konuş</Text>
          <Text style={styles.subtitle}>
            5 ücretsiz mesaj hakkın bitti.{'\n'}Premium'a geç, dilediğin kadar konuş.
          </Text>

          {/* Features */}
          <View style={styles.features}>
            {[
              ['chatbubbles', 'Sınırsız mesaj'],
              ['flash', 'Anında yanıt'],
              ['heart', 'Özlem dolu sohbetler'],
              ['shield-checkmark', '7 gün ücretsiz'],
            ].map(([icon, text]) => (
              <View key={text} style={styles.feature}>
                <View style={styles.featureIcon}>
                  <Ionicons name={icon as any} size={20} color="#9D4EDD" />
                </View>
                <Text style={styles.featureText}>{text}</Text>
              </View>
            ))}
          </View>

          {/* Price block */}
          <LinearGradient
            colors={['rgba(108,99,255,0.15)', 'rgba(157,78,221,0.15)']}
            style={styles.priceBlock}
          >
            <Text style={styles.trialBadge}>7 GÜN ÜCRETSİZ</Text>
            <Text style={styles.priceText}>{priceStr}/ay</Text>
            <Text style={styles.priceSub}>Deneme bittikten sonra ücretlendirilirsin</Text>
          </LinearGradient>

          {/* Purchase button */}
          <TouchableOpacity onPress={handlePurchase} disabled={loading || fetchingProducts} activeOpacity={0.85}>
            <LinearGradient colors={['#6C63FF', '#9D4EDD']} style={styles.purchaseBtn}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.purchaseBtnText}>7 Gün Ücretsiz Başla</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn}>
            <Text style={styles.restoreText}>Satın alımı geri yükle</Text>
          </TouchableOpacity>

          <Text style={styles.legal}>
            Abonelik, deneme süresi sonunda otomatik olarak yenilenir. İptal etmek için App Store ayarlarını kullan.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 16,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  iconWrap: {
    marginBottom: 20,
  },
  heartIcon: {
    fontSize: 72,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  features: {
    width: '100%',
    marginBottom: 28,
    gap: 14,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(157,78,221,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  priceBlock: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.3)',
  },
  trialBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9D4EDD',
    letterSpacing: 1,
    marginBottom: 8,
  },
  priceText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  priceSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  purchaseBtn: {
    width: 300,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  purchaseBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  restoreBtn: {
    paddingVertical: 12,
    marginBottom: 16,
  },
  restoreText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textDecorationLine: 'underline',
  },
  legal: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10,
  },
});
