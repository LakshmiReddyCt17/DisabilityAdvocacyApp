import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type AccessibilityContextType = {
  fontLarge: boolean;
  toggleFontLarge: (value: boolean) => Promise<void>;
  getFontSize: (baseSize: number) => number;
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  // 🚀 Explicitly default to FALSE so it never scales automatically on first boot
  const [fontLarge, setFontLarge] = useState(false);

  useEffect(() => {
    async function loadPreference() {
      try {
        const savedTextMode = await AsyncStorage.getItem('useLargeTypographyMode');
        if (savedTextMode !== null) {
          setFontLarge(savedTextMode === 'true');
        } else {
          // 🚀 Security catch: if storage is completely empty, force it to stay off!
          setFontLarge(false);
        }
      } catch (err) {
        console.error("Accessibility context loader error:", err);
      }
    }
    loadPreference();
  }, []);

  const toggleFontLarge = async (value: boolean) => {
    setFontLarge(value);
    await AsyncStorage.setItem('useLargeTypographyMode', String(value));
  };

  const getFontSize = (baseSize: number) => {
    return fontLarge ? baseSize + 6 : baseSize;
  };

  return (
    <AccessibilityContext.Provider value={{ fontLarge, toggleFontLarge, getFontSize }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used inside an AccessibilityProvider');
  }
  return context;
}