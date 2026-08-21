import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SORULAR, Soru } from '../constants/sorular';
import PaywallScreen from './paywall';
import { getCihazId } from '../utils/cihazId';
import { colors, type, radius, space, glow } from '../constants/theme';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AnketScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [profilFoto, setProfilFoto] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [pendingChatId, setPendingChatId] = useState<string | null>(null);

  const currentQuestion = SORULAR[currentPage];
  const progress = (currentPage + 1) / SORULAR.length;

  const updateAnswer = (field: string, value: any) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Hata', 'Galeri erişimi için izin gerekiyor');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setProfilFoto(base64Image);
      updateAnswer('profil_foto', base64Image);
    }
  };

  const goNext = () => {
    if (currentPage < SORULAR.length - 1) {
      setCurrentPage(prev => prev + 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const goPrev = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleSubmit = async () => {
    if (!answers.isim) {
      const isimIndex = SORULAR.findIndex((soru) => soru.alanAdi === 'isim');
      Alert.alert('Hata', 'Lütfen en az isim alanını doldurun');
      if (isimIndex !== -1) {
        setCurrentPage(isimIndex);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
      return;
    }

    setLoading(true);
    try {
      // Parse sik_kullanilan and uc_kelime as arrays
      const formattedAnswers = { ...answers };
      if (formattedAnswers.sik_kullanilan && typeof formattedAnswers.sik_kullanilan === 'string') {
        formattedAnswers.sik_kullanilan = formattedAnswers.sik_kullanilan.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      if (formattedAnswers.uc_kelime && typeof formattedAnswers.uc_kelime === 'string') {
        formattedAnswers.uc_kelime = formattedAnswers.uc_kelime.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      if (formattedAnswers.yas) {
        formattedAnswers.yas = parseInt(formattedAnswers.yas) || 25;
      }
      formattedAnswers.cihaz_id = await getCihazId();

      let response;
      try {
        response = await axios.post(`${BACKEND_URL}/api/kisiler`, formattedAnswers, { timeout: 15000 });
      } catch (firstError) {
        // Sunucu uykudan uyanıyor olabilir (Railway cold start); bir kez daha dene.
        response = await axios.post(`${BACKEND_URL}/api/kisiler`, formattedAnswers, { timeout: 20000 });
      }
      const chatId = response.data.id;

      // Check if user is already premium
      const isPremium = (await AsyncStorage.getItem('is_premium')) === 'true';
      if (isPremium) {
        router.replace(`/chat/${chatId}`);
      } else {
        setPendingChatId(chatId);
        setShowPaywall(true);
      }
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      Alert.alert('Hata', 'Kayıt sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const renderInputField = (question: Soru) => {
    const value = answers[question.alanAdi];

    switch (question.tur) {
      case 'metin':
      case 'sayi':
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={value || ''}
              onChangeText={(text) => updateAnswer(question.alanAdi, text)}
              placeholder="Yanıtını yaz..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType={question.tur === 'sayi' ? 'numeric' : 'default'}
            />
          </View>
        );

      case 'uzunMetin':
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={value || ''}
              onChangeText={(text) => updateAnswer(question.alanAdi, text)}
              placeholder="Detaylı yaz..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              multiline
              numberOfLines={4}
            />
          </View>
        );

      case 'tekSecim':
        return (
          <View style={styles.optionsContainer}>
            {question.secenekler?.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  value === option && styles.optionButtonSelected,
                ]}
                onPress={() => updateAnswer(question.alanAdi, option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    value === option && styles.optionTextSelected,
                    question.alanAdi === 'profil_emoji' && styles.emojiOption,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'cokluSecim':
        const selectedValues = (value as string[]) || [];
        return (
          <View style={styles.optionsContainer}>
            {question.secenekler?.map((option) => {
              const isSelected = selectedValues.includes(option);
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected,
                  ]}
                  onPress={() => {
                    if (isSelected) {
                      updateAnswer(
                        question.alanAdi,
                        selectedValues.filter((v) => v !== option)
                      );
                    } else if (selectedValues.length < 5) {
                      updateAnswer(question.alanAdi, [...selectedValues, option]);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                      question.alanAdi === 'favori_emojiler' && styles.emojiOption,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      default:
        return null;
    }
  };

  const handlePurchased = async () => {
    await AsyncStorage.setItem('is_premium', 'true');
    setShowPaywall(false);
    if (pendingChatId) {
      router.replace(`/chat/${pendingChatId}`);
    }
  };

  const handlePaywallClose = () => {
    setShowPaywall(false);
    // Chatting is the paid feature - closing the paywall without
    // purchasing sends the user to their profile list, not into the chat.
    router.replace('/home');
  };

  return (
    <>
      <Modal visible={showPaywall} animationType="slide" presentationStyle="fullScreen">
        <PaywallScreen onClose={handlePaywallClose} onPurchased={handlePurchased} />
      </Modal>
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={22} color={colors.textFaint} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.kategori}>{currentQuestion.kategori}</Text>
              <Text style={styles.pageNumber}>
                {currentPage + 1} / {SORULAR.length}
              </Text>
            </View>
            <View style={{ width: 48 }} />
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>

          {/* Content */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.question}>{currentQuestion.soruMetni}</Text>
            {currentQuestion.ipucu && (
              <Text style={styles.hint}>{currentQuestion.ipucu}</Text>
            )}

            {/* Profil foto seçme (8. soruda) */}
            {currentQuestion.numara === 8 && (
              <View style={styles.photoSection}>
                <Text style={styles.photoLabel}>veya profil fotoğrafı yükle:</Text>
                <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                  {profilFoto ? (
                    <Image source={{ uri: profilFoto }} style={styles.photoPreview} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="camera" size={26} color={colors.textFaint} />
                      <Text style={styles.photoText}>Fotoğraf Seç</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputWrapper}>
              {renderInputField(currentQuestion)}
            </View>
          </ScrollView>

          {/* Bottom Buttons */}
          <View style={styles.bottomButtons}>
            {currentPage > 0 ? (
              <TouchableOpacity style={styles.prevButton} onPress={goPrev}>
                <Ionicons name="arrow-back" size={18} color={colors.textMuted} />
                <Text style={styles.prevButtonText}>GERİ</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.prevButton} />
            )}

            <TouchableOpacity
              style={[styles.nextButton, loading && styles.nextButtonDisabled]}
              onPress={currentPage === SORULAR.length - 1 ? handleSubmit : goNext}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color={colors.cyan} />
              ) : (
                <Text style={styles.nextButtonText}>
                  {currentPage === SORULAR.length - 1 ? 'TAMAMLA' : 'DEVAM'}
                </Text>
              )}
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
  keyboardView: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  closeButton: { padding: space.sm, width: 44 },
  headerCenter: { alignItems: 'center', gap: 2 },
  kategori: { ...type.label, color: colors.cyan },
  pageNumber: { ...type.small, fontSize: 11, color: colors.textGhost },

  progressContainer: { paddingHorizontal: space.md, paddingBottom: space.lg },
  progressBg: { height: 1, backgroundColor: colors.hairline },
  progressFill: {
    height: 1,
    backgroundColor: colors.cyan,
    shadowColor: colors.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },

  content: { flex: 1, paddingHorizontal: space.lg },
  question: { ...type.title, color: colors.text, marginBottom: space.sm },
  hint: { ...type.small, color: colors.textFaint, marginBottom: space.lg },

  inputWrapper: { marginTop: space.md, paddingBottom: space.xl },
  inputContainer: {
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  textInput: { ...type.body, color: colors.text, padding: 0 },
  multilineInput: { minHeight: 100, textAlignVertical: 'top' },

  optionsContainer: { gap: space.sm },
  optionButton: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  optionButtonSelected: {
    borderColor: colors.cyan,
    backgroundColor: colors.cyanFaint,
  },
  optionText: { ...type.body, color: colors.textMuted },
  optionTextSelected: { color: colors.cyan, fontWeight: '600' },
  emojiOption: { fontSize: 24 },

  photoSection: { marginTop: space.lg, gap: space.sm },
  photoLabel: { ...type.small, color: colors.textFaint },
  photoButton: { alignSelf: 'flex-start' },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  photoPreview: { width: 100, height: 100, borderRadius: radius.sm },
  photoText: { ...type.small, fontSize: 11, color: colors.textFaint },

  bottomButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
    paddingHorizontal: space.md,
    minWidth: 96,
  },
  prevButtonText: { ...type.label, color: colors.textMuted },
  nextButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.cyan,
    borderRadius: radius.sharp,
    backgroundColor: colors.cyanFaint,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...glow(colors.cyan, 10),
  },
  nextButtonDisabled: { opacity: 0.45 },
  nextButtonText: { ...type.label, color: colors.cyan },
});
