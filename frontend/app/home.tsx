import React, { useEffect, useState, useCallback } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { getCihazId } from '../utils/cihazId';

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
      'Anıyı Sil',
      `${kisi.isim} ile olan tüm anılar silinecek. Bu işlem geri alınamaz.`,
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

  const renderKisi = ({ item }: { item: Kisi }) => (
    <TouchableOpacity
      style={styles.kisiCard}
      onPress={() => router.push(`/chat/${item.id}`)}
      onLongPress={() => handleDelete(item)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#1E1E2E', '#2D2D44']}
        style={styles.kisiGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.kisiContent}>
          {item.profil_foto ? (
            <Image source={{ uri: item.profil_foto }} style={styles.profilFoto} />
          ) : (
            <LinearGradient
              colors={['#6C63FF', '#9D4EDD']}
              style={styles.emojiContainer}
            >
              <Text style={styles.emoji}>{item.profil_emoji || '💜'}</Text>
            </LinearGradient>
          )}
          
          <View style={styles.kisiInfo}>
            <Text style={styles.kisiIsim}>{item.isim}</Text>
            <Text style={styles.kisiDetay}>
              {item.birlikte_sure ? `${item.birlikte_sure} birlikte` : item.meslek}
            </Text>
            <View style={styles.chatHint}>
              <Ionicons name="chatbubble" size={14} color="rgba(255,255,255,0.3)" />
              <Text style={styles.chatHintText}>Sohbet etmek için dokun</Text>
            </View>
          </View>
          
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="chatbubble-outline" size={50} color="rgba(255,255,255,0.3)" />
      </View>
      <Text style={styles.emptyTitle}>Henüz bir anı yok</Text>
      <Text style={styles.emptySubtitle}>İlk anını oluşturmak için{"\n"}aşağıdaki butona tıkla</Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => router.push('/anket')}
      >
        <LinearGradient
          colors={['#6C63FF', '#9D4EDD']}
          style={styles.emptyButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.emptyButtonText}>Anı Oluştur</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#0A0A0F', '#1A1A2E']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#6C63FF', '#9D4EDD']}
            style={styles.headerLogo}
          >
            <Ionicons name="heart" size={24} color="#fff" />
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Sanal Eski Sevgili</Text>
            <Text style={styles.headerSubtitle}>Onunla bir daha konuş</Text>
          </View>
        </View>

        {/* Kişi Listesi */}
        <FlatList
          data={kisiler}
          keyExtractor={(item) => item.id}
          renderItem={renderKisi}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6C63FF"
            />
          }
        />

        {/* FAB */}
        {kisiler.length > 0 && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push('/anket')}
          >
            <LinearGradient
              colors={['#6C63FF', '#9D4EDD']}
              style={styles.fabGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="add" size={24} color="#fff" />
              <Text style={styles.fabText}>Yeni Anı</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  headerLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  headerText: {
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  kisiCard: {
    marginBottom: 15,
    borderRadius: 20,
    overflow: 'hidden',
  },
  kisiGradient: {
    borderRadius: 20,
  },
  kisiContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  emojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilFoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  emoji: {
    fontSize: 28,
  },
  kisiInfo: {
    flex: 1,
    marginLeft: 15,
  },
  kisiIsim: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  kisiDetay: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  chatHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 5,
  },
  chatHintText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(108,99,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  emptyButton: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    gap: 8,
  },
  fabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
