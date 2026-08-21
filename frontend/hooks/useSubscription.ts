import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initConnection,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  getAvailablePurchases,
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
    verifyEntitlement();
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

  // Cached flag is only ever set to 'true' on purchase, so a lapsed/cancelled
  // subscription would otherwise grant access forever. Re-check the real
  // entitlement against StoreKit whenever we can reach it.
  const verifyEntitlement = async () => {
    try {
      await initConnection();
      const purchases = await getAvailablePurchases();
      const active = purchases.find((p: Purchase) => {
        if (p.productId !== PRODUCT_ID) return false;
        const expiry = (p as any).expirationDateIos;
        return !expiry || expiry > Date.now();
      });

      if (active) {
        await AsyncStorage.setItem(PREMIUM_KEY, 'true');
        setIsPremium(true);
      } else if (purchases.some((p: Purchase) => p.productId === PRODUCT_ID)) {
        // We saw a transaction for this product but it's expired.
        await AsyncStorage.removeItem(PREMIUM_KEY);
        setIsPremium(false);
      }
      // If StoreKit returned nothing at all (e.g. offline), keep the cached
      // flag as-is rather than punishing the user for a network hiccup.
    } catch (err) {
      console.warn('Entitlement check failed:', err);
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
