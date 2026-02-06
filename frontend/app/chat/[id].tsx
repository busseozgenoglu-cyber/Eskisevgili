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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Audio } from 'expo-av';

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
      const [kisiRes, mesajlarRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/kisiler/${kisiId}`),
        axios.get(`${BACKEND_URL}/api/mesajlar/${kisiId}`),
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

  const sendMessage = async () => {
    if (!inputText.trim() || sending || !kisiId) return;

    const mesaj = inputText.trim();
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
      const response = await axios.post(`${BACKEND_URL}/api/chat`, {
        kisi_id: kisiId,
        mesaj: mesaj,
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
              await axios.delete(`${BACKEND_URL}/api/mesajlar/${kisiId}`);
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
    setInputText(text);
    setTimeout(() => sendMessage(), 100);
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
            <LinearGradient colors={['#6C63FF', '#9D4EDD']} style={styles.avatarSmall}>
              <Text style={styles.avatarEmoji}>{kisi?.profil_emoji || '💜'}</Text>
            </LinearGradient>
          )
        )}
        <View
          style={[
            styles.messageBubble,
            item.kullanicidan_mi ? styles.userBubble : styles.aiBubble,
          ]}
        >
          {item.kullanicidan_mi ? (
            <LinearGradient
              colors={['#6C63FF', '#9D4EDD']}
              style={styles.userBubbleGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.messageText}>{item.icerik}</Text>
            </LinearGradient>
          ) : (
            <Text style={styles.messageTextAI}>{item.icerik}</Text>
          )}
        </View>
        {item.kullanicidan_mi && <View style={{ width: 40 }} />}
      </View>
    </View>
  );

  const renderEmptyChat = () => (
    <View style={styles.emptyChat}>
      {kisi?.profil_foto ? (
        <Image source={{ uri: kisi.profil_foto }} style={styles.emptyAvatar} />
      ) : (
        <LinearGradient colors={['#6C63FF', '#9D4EDD']} style={styles.emptyAvatar}>
          <Text style={styles.emptyEmoji}>{kisi?.profil_emoji || '💜'}</Text>
        </LinearGradient>
      )}
      <Text style={styles.emptyTitle}>Merhaba! Ben {kisi?.isim}</Text>
      <Text style={styles.emptySubtitle}>Sohbete başlamak için bir mesaj yaz</Text>

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
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <LinearGradient colors={['#0A0A0F', '#1A1A2E']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          {kisi?.profil_foto ? (
            <Image source={{ uri: kisi.profil_foto }} style={styles.headerAvatar} />
          ) : (
            <LinearGradient colors={['#6C63FF', '#9D4EDD']} style={styles.headerAvatar}>
              <Text style={styles.headerEmoji}>{kisi?.profil_emoji || '💜'}</Text>
            </LinearGradient>
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

          <TouchableOpacity onPress={clearChat} style={styles.menuButton}>
            <Ionicons name="ellipsis-vertical" size={20} color="rgba(255,255,255,0.7)" />
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
                placeholder="Mesaj yaz..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                multiline
                maxLength={1000}
                onSubmitEditing={sendMessage}
              />
            </View>

            <TouchableOpacity
              onPress={sendMessage}
              disabled={!inputText.trim() || sending}
              style={styles.sendButton}
            >
              <LinearGradient
                colors={sending ? ['#666', '#777'] : ['#6C63FF', '#9D4EDD']}
                style={styles.sendButtonGradient}
              >
                <Ionicons name="send" size={22} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    paddingHorizontal: 10,
    paddingVertical: 15,
    backgroundColor: 'rgba(10,10,15,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 22,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  onlineStatus: {
    fontSize: 12,
    color: '#4ade80',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingText: {
    fontSize: 12,
    color: '#6C63FF',
  },
  typingDots: {
    flexDirection: 'row',
    gap: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#6C63FF',
    opacity: 0.5,
  },
  dotDelay1: {
    opacity: 0.7,
  },
  dotDelay2: {
    opacity: 0.4,
  },
  menuButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexGrow: 1,
  },
  timeStamp: {
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginVertical: 15,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAI: {
    justifyContent: 'flex-start',
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarEmoji: {
    fontSize: 16,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  userBubble: {},
  aiBubble: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    paddingHorizontal: 16,
  },
  userBubbleGradient: {
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderBottomRightRadius: 5,
  },
  messageText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextAI: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    lineHeight: 22,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  emptyEmoji: {
    fontSize: 45,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 30,
  },
  quickReplies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  quickReply: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.3)',
  },
  quickReplyText: {
    color: '#fff',
    fontSize: 13,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 15,
    backgroundColor: 'rgba(10,10,15,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    gap: 10,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    maxHeight: 120,
  },
  textInput: {
    color: '#fff',
    fontSize: 15,
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxHeight: 100,
  },
  sendButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
