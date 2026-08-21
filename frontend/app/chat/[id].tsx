import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Audio } from 'expo-av';
import { useSubscription } from '../../hooks/useSubscription';
import { getCihazId } from '../../utils/cihazId';
import PaywallScreen from '../paywall';
import { colors, type, radius, space } from '../../constants/theme';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Kisi {
  id: string;
  isim: string;
  sana_hitap: string;
  profil_emoji: string;
  profil_foto?: string;
  favori_emojiler: string[];
  ozlem_ifadesi: string;
}

interface Mesaj {
  id: string;
  kisi_id: string;
  icerik: string;
  kullanicidan_mi: boolean;
  zaman: string;
  ses_mesaji?: string;
}

export default function ChatScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  
  // Ensure id is a string (not array)
  const kisiId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [kisi, setKisi] = useState<Kisi | null>(null);
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const { isPremium, initialized: subscriptionInitialized } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (kisiId) {
      fetchData();
    }
  }, [kisiId]);

  const fetchData = async () => {
    if (!kisiId) return;
    try {
      console.log('Fetching data for kisiId:', kisiId);
      console.log('Backend URL:', BACKEND_URL);
      const cihazId = await getCihazId();
      const [kisiRes, mesajlarRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/kisiler/${kisiId}`, { params: { cihaz_id: cihazId } }),
        axios.get(`${BACKEND_URL}/api/mesajlar/${kisiId}`, { params: { cihaz_id: cihazId } }),
      ]);
      setKisi(kisiRes.data);
      setMesajlar(mesajlarRes.data);
    } catch (error: any) {
      console.error('Veri yükleme hatası:', error?.response?.status, error?.message);
      Alert.alert('Hata', 'Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessage = async (overrideText?: string) => {
    const kaynakMetin = overrideText ?? inputText;
    if (!kaynakMetin.trim() || sending || !kisiId) return;

    if (subscriptionInitialized && !isPremium) {
      setShowPaywall(true);
      return;
    }

    const mesaj = kaynakMetin.trim();
    setInputText('');
    Keyboard.dismiss();
    setSending(true);
    setTyping(true);

    // Optimistic update
    const tempMesaj: Mesaj = {
      id: `temp-${Date.now()}`,
      kisi_id: kisiId,
      icerik: mesaj,
      kullanicidan_mi: true,
      zaman: new Date().toISOString(),
    };
    setMesajlar(prev => [...prev, tempMesaj]);
    scrollToBottom();

    try {
      console.log('Sending chat message to:', `${BACKEND_URL}/api/chat`);
      const cihazId = await getCihazId();
      const response = await axios.post(`${BACKEND_URL}/api/chat`, {
        kisi_id: kisiId,
        mesaj: mesaj,
        cihaz_id: cihazId,
      });

      // Add AI response
      const aiMesaj: Mesaj = {
        id: response.data.mesaj_id,
        kisi_id: kisiId,
        icerik: response.data.yanit,
        kullanicidan_mi: false,
        zaman: new Date().toISOString(),
      };
      setMesajlar(prev => [...prev, aiMesaj]);
      scrollToBottom();
    } catch (error: any) {
      console.error('Mesaj gönderme hatası:', error?.response?.status, error?.message);
      setMesajlar(prev => prev.filter(m => m.id !== tempMesaj.id));
      Alert.alert('Hata', 'Mesaj gönderilemedi');
    } finally {
      setSending(false);
      setTyping(false);
    }
  };

  const clearChat = () => {
    Alert.alert(
      'Sohbeti Temizle',
      'Tüm mesajlar silinecek. Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Temizle',
          style: 'destructive',
          onPress: async () => {
            try {
              const cihazId = await getCihazId();
              await axios.delete(`${BACKEND_URL}/api/mesajlar/${kisiId}`, { params: { cihaz_id: cihazId } });
              setMesajlar([]);
            } catch (error) {
              Alert.alert('Hata', 'Sohbet temizlenemedi');
            }
          },
        },
      ]
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Dün ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'd MMM HH:mm', { locale: tr });
    }
  };

  const shouldShowTime = (index: number) => {
    if (index === 0) return true;
    const current = new Date(mesajlar[index].zaman);
    const prev = new Date(mesajlar[index - 1].zaman);
    return differenceInMinutes(current, prev) > 5;
  };

  const sendQuickMessage = (text: string) => {
    sendMessage(text);
  };

  const renderMessage = ({ item, index }: { item: Mesaj; index: number }) => (
    <View>
      {shouldShowTime(index) && (
        <Text style={styles.timeStamp}>{formatTime(item.zaman)}</Text>
      )}
      <View
        style={[
          styles.messageRow,
          item.kullanicidan_mi ? styles.messageRowUser : styles.messageRowAI,
        ]}
      >
        {!item.kullanicidan_mi && (
          kisi?.profil_foto ? (
            <Image source={{ uri: kisi.profil_foto }} style={styles.avatarSmall} />
          ) : (
            <View style={[styles.avatarSmall, styles.avatarFallback]}>
              <Text style={styles.avatarEmoji}>{kisi?.profil_emoji || '◍'}</Text>
            </View>
          )
        )}
        <View
          style={[
            styles.messageBubble,
            item.kullanicidan_mi ? styles.userBubble : styles.aiBubble,
          ]}
        >
          <Text style={item.kullanicidan_mi ? styles.messageText : styles.messageTextAI}>
            {item.icerik}
          </Text>
        </View>
        {item.kullanicidan_mi && <View style={{ width: 36 }} />}
      </View>
    </View>
  );

  const renderEmptyChat = () => (
    <View style={styles.emptyChat}>
      {kisi?.profil_foto ? (
        <Image source={{ uri: kisi.profil_foto }} style={styles.emptyAvatar} />
      ) : (
        <View style={[styles.emptyAvatar, styles.avatarFallback]}>
          <Text style={styles.emptyEmoji}>{kisi?.profil_emoji || '◍'}</Text>
        </View>
      )}
      <Text style={styles.emptyTitle}>{kisi?.isim}</Text>
      <Text style={styles.emptySubtitle}>kayıt açık · yazmaya başla</Text>

      <View style={styles.quickReplies}>
        <TouchableOpacity
          style={styles.quickReply}
          onPress={() => sendQuickMessage('Merhaba!')}
        >
          <Text style={styles.quickReplyText}>Merhaba! 👋</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickReply}
          onPress={() => sendQuickMessage('Nasılsın?')}
        >
          <Text style={styles.quickReplyText}>Nasılsın?</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickReply}
          onPress={() => sendQuickMessage('Seni özledim')}
        >
          <Text style={styles.quickReplyText}>Seni özledim</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.cyan} />
      </View>
    );
  }

  return (
    <>
      <Modal visible={showPaywall} animationType="slide" presentationStyle="fullScreen">
        <PaywallScreen
          onClose={() => {
            setShowPaywall(false);
            router.replace('/home');
          }}
          onPurchased={() => setShowPaywall(false)}
        />
      </Modal>
    <View style={styles.container}>
<SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
            style={styles.backButton}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          {kisi?.profil_foto ? (
            <Image source={{ uri: kisi.profil_foto }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, styles.avatarFallback]}>
              <Text style={styles.headerEmoji}>{kisi?.profil_emoji || '◍'}</Text>
            </View>
          )}

          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{kisi?.isim}</Text>
            {typing ? (
              <View style={styles.typingIndicator}>
                <Text style={styles.typingText}>yazıyor</Text>
                <View style={styles.typingDots}>
                  <View style={styles.dot} />
                  <View style={[styles.dot, styles.dotDelay1]} />
                  <View style={[styles.dot, styles.dotDelay2]} />
                </View>
              </View>
            ) : (
              <Text style={styles.onlineStatus}>çevrimiçi</Text>
            )}
          </View>

          <TouchableOpacity onPress={clearChat} style={styles.menuButton} hitSlop={8}>
            <Ionicons name="ellipsis-vertical" size={18} color={colors.textFaint} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatContainer}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatListRef}
            data={mesajlar}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            ListEmptyComponent={renderEmptyChat}
            onContentSizeChange={scrollToBottom}
            showsVerticalScrollIndicator={false}
          />

{/* Input Area */}
          <View style={styles.inputArea}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Mesaj yaz…"
                placeholderTextColor={colors.textGhost}
                multiline
                maxLength={1000}
                onSubmitEditing={() => sendMessage()}
              />
            </View>

            <TouchableOpacity
              onPress={() => sendMessage()}
              disabled={!inputText.trim() || sending}
              style={[
                styles.sendButton,
                (!inputText.trim() || sending) && styles.sendButtonDisabled,
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-up" size={20} color={colors.cyan} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safeArea: { flex: 1 },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  backButton: { padding: space.xs },
  headerAvatar: { width: 34, height: 34, borderRadius: radius.sm },
  avatarFallback: {
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEmoji: { fontSize: 15 },
  headerInfo: { flex: 1, gap: 2 },
  headerName: { ...type.heading, color: colors.text },
  onlineStatus: { ...type.label, fontSize: 9, color: colors.cyan, opacity: 0.7 },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typingText: { ...type.label, fontSize: 9, color: colors.cyan, opacity: 0.7 },
  typingDots: { flexDirection: 'row', gap: 3 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.cyan },
  dotDelay1: { opacity: 0.6 },
  dotDelay2: { opacity: 0.3 },
  menuButton: { padding: space.xs },

  chatContainer: { flex: 1 },
  messagesList: { paddingHorizontal: space.md, paddingVertical: space.md, flexGrow: 1 },

  timeStamp: {
    ...type.label,
    fontSize: 9,
    color: colors.textGhost,
    textAlign: 'center',
    marginVertical: space.md,
  },

  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, marginBottom: space.sm },
  messageRowUser: { justifyContent: 'flex-end' },
  messageRowAI: { justifyContent: 'flex-start' },
  avatarSmall: { width: 28, height: 28, borderRadius: radius.sm },
  avatarEmoji: { fontSize: 13 },

  messageBubble: { maxWidth: '76%', paddingHorizontal: space.md, paddingVertical: 10 },
  userBubble: {
    backgroundColor: colors.cyanFaint,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.35)',
    borderRadius: radius.md,
    borderBottomRightRadius: radius.sharp,
  },
  aiBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    borderBottomLeftRadius: radius.sharp,
  },
  messageText: { ...type.body, color: colors.text },
  messageTextAI: { ...type.body, color: colors.textMuted },

  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    gap: space.sm,
  },
  emptyAvatar: { width: 64, height: 64, borderRadius: radius.md, marginBottom: space.sm },
  emptyEmoji: { fontSize: 28 },
  emptyTitle: { ...type.title, color: colors.text },
  emptySubtitle: { ...type.label, fontSize: 10, color: colors.cyan, opacity: 0.6, marginBottom: space.lg },

  quickReplies: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' },
  quickReply: {
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    borderRadius: radius.sharp,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: colors.surface,
  },
  quickReplyText: { ...type.small, color: colors.textMuted },

  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    backgroundColor: colors.bg,
  },
  inputContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
    maxHeight: 120,
  },
  textInput: { ...type.body, color: colors.text, padding: 0 },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.cyan,
    backgroundColor: colors.cyanFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.3 },
});
