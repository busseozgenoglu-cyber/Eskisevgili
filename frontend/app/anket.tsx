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
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SORULAR, Soru } from '../constants/sorular';
import PaywallScreen from './paywall';
import { getCihazId } from '../utils/cihazId';

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
    // Allow limited access even without subscription
    if (pendingChatId) {
      router.replace(`/chat/${pendingChatId}`);
    }
  };

  return (
    <>
      <Modal visible={showPaywall} animationType="slide" presentationStyle="fullScreen">
        <PaywallScreen onClose={handlePaywallClose} onPurchased={handlePurchased} />
      </Modal>
    <LinearGradient colors={['#0A0A0F', '#1A1A2E']} style={styles.container}>
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
              <Ionicons name="close" size={24} color="#fff" />
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
                      <Ionicons name="camera" size={30} color="rgba(255,255,255,0.5)" />
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
                <Ionicons name="arrow-back" size={20} color="#fff" />
                <Text style={styles.prevButtonText}>Geri</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.prevButton} />
            )}

            <TouchableOpacity
              style={styles.nextButton}
              onPress={currentPage === SORULAR.length - 1 ? handleSubmit : goNext}
              disabled={loading}
            >
              <LinearGradient
                colors={['#6C63FF', '#9D4EDD']}
                style={styles.nextButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.nextButtonText}>
                      {currentPage === SORULAR.length - 1 ? 'Tamamla' : 'Devam'}
                    </Text>
                    <Ionicons
                      name={currentPage === SORULAR.length - 1 ? 'checkmark' : 'arrow-forward'}
                      size={20}
                      color="#fff"
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  closeButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  kategori: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  pageNumber: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginTop: 2,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  progressBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6C63FF',
    borderRadius: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
  },
  question: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 30,
    lineHeight: 32,
  },
  hint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 12,
  },
  inputWrapper: {
    marginTop: 40,
    paddingBottom: 30,
  },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textInput: {
    color: '#fff',
    fontSize: 18,
    padding: 20,
  },
  multilineInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  optionButtonSelected: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  optionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  emojiOption: {
    fontSize: 22,
  },
  photoSection: {
    marginTop: 30,
    alignItems: 'center',
  },
  photoLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 15,
  },
  photoButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 5,
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    gap: 15,
  },
  prevButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: 8,
  },
  prevButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  nextButton: {
    flex: 2,
    borderRadius: 30,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
