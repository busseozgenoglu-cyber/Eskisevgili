import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNIap from 'react-native-iap';

const PRODUCT_ID = 'com.sanaleskisevgili.app.premium.monthly';
const FREE_MSG_LIMIT = 5;
const MSG_COUNT_KEY = 'free_msg_count';
const PREMIUM_KEY = 'is_premium';

export function useSubscription() {
  const [isPremium, setIsPremium] = useState(false);
  const [freeMessagesUsed, setFreeMessagesUsed] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    loadState();
    const purchaseUpdateSub = RNIap.purchaseUpdatedListener(handlePurchase);
    const purchaseErrorSub = RNIap.purchaseErrorListener(() => {});
    return () => {
      purchaseUpdateSub.remove();
      purchaseErrorSub.remove();
    };
  }, []);

  const loadState = async () => {
    try {
      const [premium, count] = await Promise.all([
        AsyncStorage.getItem(PREMIUM_KEY),
        AsyncStorage.getItem(MSG_COUNT_KEY),
      ]);
      setIsPremium(premium === 'true');
      setFreeMessagesUsed(count ? parseInt(count, 10) : 0);
    } finally {
      setInitialized(true);
    }
  };

  const handlePurchase = async (purchase: RNIap.Purchase) => {
    try {
      await RNIap.finishTransaction({ purchase, isConsumable: false });
      await AsyncStorage.setItem(PREMIUM_KEY, 'true');
      setIsPremium(true);
      setShowPaywall(false);
    } catch {}
  };

  const incrementMessageCount = useCallback(async (): Promise<boolean> => {
    if (isPremium) return true; // allowed

    const newCount = freeMessagesUsed + 1;
    setFreeMessagesUsed(newCount);
    await AsyncStorage.setItem(MSG_COUNT_KEY, String(newCount));

    if (newCount > FREE_MSG_LIMIT) {
      setShowPaywall(true);
      return false; // blocked
    }
    return true; // allowed
  }, [isPremium, freeMessagesUsed]);

  const canSendMessage = useCallback((): boolean => {
    return isPremium || freeMessagesUsed < FREE_MSG_LIMIT;
  }, [isPremium, freeMessagesUsed]);

  const dismissPaywall = useCallback(() => setShowPaywall(false), []);

  const onPurchased = useCallback(async () => {
    await AsyncStorage.setItem(PREMIUM_KEY, 'true');
    setIsPremium(true);
    setShowPaywall(false);
  }, []);

  return {
    isPremium,
    freeMessagesUsed,
    showPaywall,
    initialized,
    FREE_MSG_LIMIT,
    canSendMessage,
    incrementMessageCount,
    dismissPaywall,
    onPurchased,
  };
}
