import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { getCihazId } from '../utils/cihazId';
import SanalExMark from '../components/SanalExMark';
import { colors, type, radius, space, glow } from '../constants/theme';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Kisi {
  id: string;
  isim: string;
  sana_hitap: string;
  birlikte_sure: string;
  meslek: string;
  profil_emoji: string;
  profil_foto?: string;
  olusturma_tarihi: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [kisiler, setKisiler] = useState<Kisi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchKisiler = async () => {
    try {
      const cihazId = await getCihazId();
      const response = await axios.get(`${BACKEND_URL}/api/kisiler`, { params: { cihaz_id: cihazId } });
      setKisiler(response.data);
    } catch (error) {
      console.error('Kişiler yüklenirken hata:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchKisiler();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchKisiler();
  };

  const handleDelete = (kisi: Kisi) => {
    Alert.alert(
      'Kaydı Sil',
      `${kisi.isim} ile olan tüm kayıt silinecek. Bu işlem geri alınamaz.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const cihazId = await getCihazId();
              await axios.delete(`${BACKEND_URL}/api/kisiler/${kisi.id}`, { params: { cihaz_id: cihazId } });
              setKisiler(prev => prev.filter(k => k.id !== kisi.id));
            } catch (error) {
              Alert.alert('Hata', 'Silme işlemi başarısız oldu');
            }
          },
        },
      ]
    );
  };

  const renderKisi = ({ item, index }: { item: Kisi; index: number }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/chat/${item.id}`)}
      onLongPress={() => handleDelete(item)}
      activeOpacity={0.6}
    >
      <Text style={styles.rowIndex}>{String(index + 1).padStart(2, '0')}</Text>

      {item.profil_foto ? (
        <Image source={{ uri: item.profil_foto }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarEmoji}>{item.profil_emoji || '◍'}</Text>
        </View>
      )}

      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{item.isim}</Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {item.birlikte_sure ? `${item.birlikte_sure} birlikte` : item.meslek || 'kayıt aktif'}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.textGhost} />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.empty}>
      <SanalExMark size={72} />
      <Text style={styles.emptyTitle}>Kayıt bulunamadı</Text>
      <Text style={styles.emptySub}>
        Konuşmak istediğin kişiyi{'\n'}tanımlayarak başla
      </Text>
      <TouchableOpacity
        style={styles.cta}
        onPress={() => router.push('/anket')}
        activeOpacity={0.7}
      >
        <Text style={styles.ctaText}>YENİ KAYIT</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.cyan} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <SanalExMark size={30} />
          <View style={styles.headerText}>
            <Text style={styles.brand}>SANALEX</Text>
            <Text style={styles.headerSub}>
              {kisiler.length > 0 ? `${kisiler.length} kayıt` : 'kayıt yok'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <FlatList
          data={kisiler}
          keyExtractor={(item) => item.id}
          renderItem={renderKisi}
          contentContainerStyle={
            kisiler.length === 0 ? styles.listEmpty : styles.list
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.cyan}
            />
          }
        />

        {kisiler.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cta}
              onPress={() => router.push('/anket')}
              activeOpacity={0.7}
            >
              <Text style={styles.ctaText}>YENİ KAYIT</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.md,
  },
  headerText: { gap: 2 },
  brand: { ...type.label, color: colors.cyan },
  headerSub: { ...type.small, color: colors.textFaint, fontSize: 11 },

  divider: { height: 1, backgroundColor: colors.hairline },
  separator: { height: 1, backgroundColor: colors.hairline },

  list: { paddingBottom: space.xxl },
  listEmpty: { flexGrow: 1 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  rowIndex: { ...type.label, color: colors.cyan, opacity: 0.5, width: 20 },
  avatar: { width: 44, height: 44, borderRadius: radius.sm },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 20 },
  rowInfo: { flex: 1, gap: 3 },
  rowName: { ...type.heading, color: colors.text },
  rowMeta: { ...type.small, color: colors.textFaint, fontSize: 12 },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    gap: space.md,
  },
  emptyTitle: { ...type.title, color: colors.text, marginTop: space.md },
  emptySub: {
    ...type.body,
    color: colors.textFaint,
    textAlign: 'center',
    marginBottom: space.lg,
  },

  footer: { paddingHorizontal: space.lg, paddingBottom: space.md, paddingTop: space.sm },
  cta: {
    borderWidth: 1,
    borderColor: colors.cyan,
    borderRadius: radius.sharp,
    paddingVertical: 16,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    backgroundColor: colors.cyanFaint,
    ...glow(colors.cyan, 10),
  },
  ctaText: { ...type.label, color: colors.cyan },
});
