import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  Purchase,
} from 'react-native-iap';

const PRODUCT_ID = 'com.sanaleskisevgili.app.premium.weekly';
const PREMIUM_KEY = 'is_premium';

export function useSubscription() {
  const [isPremium, setIsPremium] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    loadState();
    const purchaseUpdateSub = purchaseUpdatedListener(handlePurchase);
    const purchaseErrorSub = purchaseErrorListener(() => {});
    return () => {
      purchaseUpdateSub.remove();
      purchaseErrorSub.remove();
    };
  }, []);

  const loadState = async () => {
    try {
      const premium = await AsyncStorage.getItem(PREMIUM_KEY);
      setIsPremium(premium === 'true');
    } finally {
      setInitialized(true);
    }
  };

  const handlePurchase = async (purchase: Purchase) => {
    if (purchase.productId === PRODUCT_ID) {
      try {
        await finishTransaction({ purchase, isConsumable: false });
        await AsyncStorage.setItem(PREMIUM_KEY, 'true');
        setIsPremium(true);
        setShowPaywall(false);
      } catch {}
    }
  };

  const dismissPaywall = useCallback(() => setShowPaywall(false), []);

  const onPurchased = useCallback(async () => {
    await AsyncStorage.setItem(PREMIUM_KEY, 'true');
    setIsPremium(true);
    setShowPaywall(false);
  }, []);

  return {
    isPremium,
    showPaywall,
    initialized,
    dismissPaywall,
    onPurchased,
  };
}
