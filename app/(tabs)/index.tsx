// index.tsx

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAccessibility } from '../../context/AccessibilityContext';
import { appDictionary, AppLanguage } from '../../lib/appTranslations';
import { getSchemes } from '../../lib/googleSheets';

// ── CACHE CONSTANTS ──
const CACHE_KEY_SCHEMES_PREFIX = 'cached_schemes_data_';
const CACHE_KEY_SUGGESTIONS_PREFIX = 'cached_suggestions_data_';

// ── COMPREHENSIVE INLINE HOME ACCESSIBILITY DICTIONARY ──
const A11Y_HOME_TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  English: {
    searchHint: "Type here to instantly filter schemes by name anywhere in the text.",
    clearSearchLabel: "Clear search text",
    notifActiveLabel: "Notifications, new schemes available.",
    notifIdleLabel: "Notifications, no new updates.",
    notifHint: "Double tap to review your notifications banner alerts.",
    notifCaughtUpTitle: "Notifications",
    notifCaughtUpMsg: "You are completely caught up! No new schemes since your last session.",
    dismissBannerLabel: "Dismiss new schemes announcement banner",
    viewNewSchemeLabel: "View details for newly added welfare options",
    loadingText: "Loading personalized options...",
    govtTag: "Government Scheme",
    csrTag: "CSR Welfare Program",
    applyButtonLabel: "Apply on official portal",
    applyButtonHint: "Double tap to launch the external application website in your browser.",
    saveButtonLabel: "Save scheme to bookmarks",
    savedButtonLabel: "Remove scheme from bookmarks",
    recommendedBy: "NGO Recommended Option by",
    newSchemePrefix: "Newly Added Scheme",
    linkErrorTitle: "Link Error",
    linkErrorMsg: "Cannot launch browser for this link.",
    networkIssueTitle: "Network Issue",
    networkIssueMsg: "Failed to open the link.",
  },
  Hindi: {
    searchHint: "नाम से योजनाओं को फ़िल्टर करने के लिए यहाँ टाइप करें।",
    clearSearchLabel: "खोज टेक्स्ट साफ़ करें",
    notifActiveLabel: "सूचनाएं, नई योजनाएं उपलब्ध हैं।",
    notifIdleLabel: "सूचनाएं, कोई नया अपडेट नहीं।",
    notifHint: "अपने सूचना बैनर अलर्ट देखने के लिए दो बार टैप करें।",
    notifCaughtUpTitle: "सूचनाएं",
    notifCaughtUpMsg: "सब कुछ देखा जा चुका है! पिछले सत्र के बाद से कोई नई योजना नहीं है।",
    dismissBannerLabel: "नई योजनाओं का बैनर हटाएं",
    viewNewSchemeLabel: "नई कल्याण योजनाओं का विवरण देखें",
    loadingText: "योजनाएं लोड हो रही हैं...",
    govtTag: "सरकारी योजना",
    csrTag: "सीएसआर कल्याण कार्यक्रम",
    applyButtonLabel: "आधिकारिक पोर्टल पर आवेदन करें",
    applyButtonHint: "ब्राउज़र में आधिकारिक वेबसाइट खोलने के लिए दो बार टैप करें।",
    saveButtonLabel: "योजना बुकमार्क में सहेजें",
    savedButtonLabel: "बुकमार्क से योजना हटाएं",
    recommendedBy: "एनजीओ द्वारा अनुशंसित योजना, अनुशंसक:",
    newSchemePrefix: "हाल ही में जोड़ी गई योजना",
    linkErrorTitle: "लिंक त्रुटि",
    linkErrorMsg: "इस लिंक के लिए ब्राउज़र नहीं खोला जा सका।",
    networkIssueTitle: "नेटवर्क समस्या",
    networkIssueMsg: "लिंक खोलने में विफल।",
  },
  Kannada: {
    searchHint: "ಯೋಜನೆಗಳನ್ನು ಹೆಸರಿನ ಮೂಲಕ ಫಿಲ್ಟರ್ ಮಾಡಲು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ.",
    clearSearchLabel: "ಹುಡುಕಾಟ ಪಠ್ಯವನ್ನು ತೆರವುಗೊಳಿಸಿ",
    notifActiveLabel: "ಅಧಿಸೂಚನೆಗಳು, ಹೊಸ ಯೋಜನೆಗಳು ಲಭ್ಯವಿದೆ.",
    notifIdleLabel: "ಅಧಿಸೂಚನೆಗಳು, ಯಾವುದೇ ಹೊಸ ನವೀಕರಣಗಳಿಲ್ಲ.",
    notifHint: "ನಿಮ್ಮ ಅಧಿಸೂಚನೆಗಳ ಬ್ಯಾನರ್ ವೀಕ್ಷಿಸಲು ಎರಡು ಬಾರಿ ಟ್ಯಾಪ್ ಮಾಡಿ.",
    notifCaughtUpTitle: "ಅಧಿಸೂಚನೆಗಳು",
    notifCaughtUpMsg: "ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಲಾಗಿದೆ! ನಿಮ್ಮ ಕೊನೆಯ ಭೇಟಿಯಿಂದ ಯಾವುದೇ ಹೊಸ ಯೋಜನೆಗಳಿಲ್ಲ.",
    dismissBannerLabel: "ಹೊಸ ಯೋಜನೆಗಳ ಬ್ಯಾನರ್ ಮುಚ್ಚಿ",
    viewNewSchemeLabel: "ಹೊಸ ಕಲ್ಯಾಣ ಯೋಜನೆಗಳ ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
    loadingText: "ಯೋಜನೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    govtTag: "ಸರ್ಕಾರಿ ಯೋಜನೆ",
    csrTag: "ಸಿಎಸ್ಆರ್ ಕಲ್ಯಾಣ ಕಾರ್ಯಕ್ರಮ",
    applyButtonLabel: "ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",
    applyButtonHint: "ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್ ತೆರೆಯಲು ಎರಡು ಬಾರಿ ಟ್ಯಾಪ್ ಮಾಡಿ.",
    saveButtonLabel: "ಯೋಜನೆಯನ್ನು ಬುಕ್‌ಮಾರ್ಕ್‌ಗಳಲ್ಲಿ ಉಳಿಸಿ",
    savedButtonLabel: "ಬುಕ್‌ಮಾರ್ಕ್‌ಗಳಿಂದ ಯೋಜನೆಯನ್ನು ತೆಗೆದುಹಾಕಿ",
    recommendedBy: "ಎನ್‌ಜಿಒ ಶಿಫಾರಸು ಮಾಡಿದ ಯೋಜನೆ, ಶಿಫಾರಸುದಾರರು:",
    newSchemePrefix: "ಹೊಸದಾಗಿ ಸೇರಿಸಲಾದ ಯೋಜನೆ",
    linkErrorTitle: "ಲಿಂಕ್ ದೋಷ",
    linkErrorMsg: "ಈ ಲಿಂಕ್‌ಗಾಗಿ ಬ್ರೌಸರ್ ತೆರೆಯಲು ಸಾಧ್ಯವಿಲ್ಲ.",
    networkIssueTitle: "ನೆಟ್‌ವರ್ಕ್ ಸಮಸ್ಯೆ",
    networkIssueMsg: "ಲಿಂಕ್ ತೆರೆಯಲು ವಿಫಲವಾಗಿದೆ.",
  },
  Tamil: {
    searchHint: "திட்டங்களை பெயர் மூலம் வடிகட்ட இங்கே தட்டச்சு செய்யவும்.",
    clearSearchLabel: "தேடல் உரையை அழிக்கவும்",
    notifActiveLabel: "அறிவிப்புகள், புதிய திட்டங்கள் உள்ளன.",
    notifIdleLabel: "அறிவிப்புகள், புதிய புதுப்பிப்புகள் இல்லை.",
    notifHint: "அறிவிப்பு பலகையை மறுபரிசீலனை செய்ய இருமுறை தட்டவும்.",
    notifCaughtUpTitle: "அறிவிப்புகள்",
    notifCaughtUpMsg: "அனைத்தும் புதுப்பித்த நிலையில் உள்ளது! புதிய திட்டங்கள் எதுவும் இல்லை.",
    dismissBannerLabel: "புதிய திட்டங்களின் அறிவிப்பை மூடவும்",
    viewNewSchemeLabel: "புதிய நலத்திட்ட விவரங்களைப் பார்க்கவும்",
    loadingText: "திட்டங்கள் ஏற்றப்படுகின்றன...",
    govtTag: "அரசுத் திட்டம்",
    csrTag: "கார்ப்பரேட் சமூக நலத் திட்டம்",
    applyButtonLabel: "அதிகாரப்பூர்வ போர்ட்டலில் விண்ணப்பிக்கவும்",
    applyButtonHint: "இணையதளத்தை உலாவியில் திறக்க இருமுறை தட்டவும்.",
    saveButtonLabel: "திட்டத்தை சேமிக்கவும்",
    savedButtonLabel: "திட்டத்தை சேமிப்பிலிருந்து நீக்கவும்",
    recommendedBy: "தன்னார்வ அமைப்பால் பரிந்துரைக்கப்பட்ட திட்டம், பரிந்துரைத்தவர்:",
    newSchemePrefix: "புதிதாக சேர்க்கப்பட்ட திட்டம்",
    linkErrorTitle: "இணைப்புப் பிழை",
    linkErrorMsg: "இந்த இணைப்பிற்கான உலாவியைத் திறக்க முடியவில்லை.",
    networkIssueTitle: "வலைப்பின்னல் சிக்கல்",
    networkIssueMsg: "இணைப்பைத் திறக்க முடியவில்லை.",
  },
  Telugu: {
    searchHint: "పేరు ద్వారా పథకాలను శోధించడానికి ఇక్కడ టైప్ చేయండి.",
    clearSearchLabel: "శోధన వచనాన్ని క్లియర్ చేయండి",
    notifActiveLabel: "నోటిఫికేషన్‌లు, కొత్త పథకాలు అందుబాటులో ఉన్నాయి.",
    notifIdleLabel: "నోటిఫికేషన్‌లు, కొత్త అప్‌డేట్‌లు లేవు.",
    notifHint: "నోటిఫికేషన్‌ల వివరాలను సమీక్షించడానికి రెండుసార్లు నొక్కండి.",
    notifCaughtUpTitle: "నోటిఫికేషన్‌లు",
    notifCaughtUpMsg: "అన్నీ చూసేశారు! మీ మునుపటి సెషన్ నుండి కొత్త పథకాలు లేవు.",
    dismissBannerLabel: "కొత్త పథకాల బ్యానర్‌ను మూసివేయండి",
    viewNewSchemeLabel: "కొత్త సంక్షేమ ఎంపికల వివరాలను చూడండి",
    loadingText: "పథకాలు లోడ్ అవుతున్నాయి...",
    govtTag: "ప్రభుత్వ పథకం",
    csrTag: "సిఎస్‌ఆర్ సంక్షేమ కార్యక్రమం",
    applyButtonLabel: "అధికారిక పోర్టల్‌లో దరఖాస్తు చేసుకోండి",
    applyButtonHint: "బ్రౌజర్‌లో వెబ్‌సైట్‌ను తెరవడానికి రెండుసార్లు నొక్కండి.",
    saveButtonLabel: "పథకాన్ని సేవ్ చేయండి",
    savedButtonLabel: "సేవ్ చేసిన పథకాల నుండి తీసివేయండి",
    recommendedBy: "ఎన్‌జీవో సిఫార్సు చేసిన పథకం, సిఫార్సు చేసినవారు:",
    newSchemePrefix: "కొత్తగా జోడించిన పథకం",
    linkErrorTitle: "లింక్ లోపం",
    linkErrorMsg: "బ్రౌజర్‌లో లింక్ తెరవడం సాధ్యం కాలేదు.",
    networkIssueTitle: "నెట్‌వర్క్ సమస్య",
    networkIssueMsg: "లింక్ తెరవడంలో విఫలమైంది.",
  },
  Bengali: {
    searchHint: "নাম অনুসারে স্কিমগুলি ফিল্টার করতে এখানে লিখুন।",
    clearSearchLabel: "অনুসন্ধান লেখা মুছুন",
    notifActiveLabel: "বিজ্ঞপ্তি, নতুন স্কিম উপলব্ধ রয়েছে।",
    notifIdleLabel: "বিজ্ঞপ্তি, কোনো নতুন আপডেট নেই।",
    notifHint: "বিজ্ঞপ্তি ব্যানার দেখতে দুবার ট্যাপ করুন।",
    notifCaughtUpTitle: "বিজ্ঞপ্তি",
    notifCaughtUpMsg: "আপনি সম্পূর্ণ আপ-টু-ডেট আছেন! নতুন কোনো স্কিম যোগ হয়নি।",
    dismissBannerLabel: "নতুন স্কিম ব্যানার খারিজ করুন",
    viewNewSchemeLabel: "নতুন কল্যাণ স্কিমগুলির বিবরণ দেখুন",
    loadingText: "স্কিমগুলি লোড হচ্ছে...",
    govtTag: "সরকারি স্কিম",
    csrTag: "সিএসআর কল্যাণ কর্মসূচি",
    applyButtonLabel: "অফিসিয়াল পোর্টালে আবেদন করুন",
    applyButtonHint: "ব্রাউজারে অফিসিয়াল ওয়েবসাইট খুলতে দুবার ট্যাপ করুন।",
    saveButtonLabel: "স্কিম সংরক্ষণ করুন",
    savedButtonLabel: "সংরক্ষণ তালিকা থেকে সরান",
    recommendedBy: "এনজিও সুপারিশকৃত স্কিম, সুপারিশকারী:",
    newSchemePrefix: "নতুন যুক্ত হওয়া স্কিম",
    linkErrorTitle: "লিংক ত্রুটি",
    linkErrorMsg: "এই লিংকের জন্য ব্রাউজার চালু করা যাচ্ছে না।",
    networkIssueTitle: "নেটওয়ার্ক সমস্যা",
    networkIssueMsg: "লিংকটি খুলতে ব্যর্থ হয়েছে।",
  },
  Marathi: {
    searchHint: "नावाद्वारे योजना शोधण्यासाठी येथे टाइप करा.",
    clearSearchLabel: "शोध मजकूर साफ करा",
    notifActiveLabel: "सूचना, नवीन योजना उपलब्ध आहेत.",
    notifIdleLabel: "सूचना, कोणतेही नवीन अपडेट नाहीत.",
    notifHint: "तुमच्या सूचना पाहण्यासाठी दोनदा टॅप करा.",
    notifCaughtUpTitle: "सूचना",
    notifCaughtUpMsg: "सर्व योजना पाहिलेल्या आहेत! नवीन कोणतीही योजना उपलब्ध नाही.",
    dismissBannerLabel: "नवीन योजनांचा बॅनर बंद करा",
    viewNewSchemeLabel: "नवीन कल्याणकारी योजनांचे तपशील पहा",
    loadingText: "योजना लोड होत आहेत...",
    govtTag: "शासकीय योजना",
    csrTag: "सीएसआर कल्याणकारी योजना",
    applyButtonLabel: "अधिकृत पोर्टलवर अर्ज करा",
    applyButtonHint: "ब्राउझरमध्ये अधिकृत वेबसाइट उघडण्यासाठी दोनदा टॅप करा.",
    saveButtonLabel: "योजना जतन करा",
    savedButtonLabel: "जतन केलेल्या यादीतून योजना काढा",
    recommendedBy: "एनजीओने शिफारस केलेली योजना, शिफारसकर्ता:",
    newSchemePrefix: "नुकतीच जोडलेली योजना",
    linkErrorTitle: "लिंक त्रुटी",
    linkErrorMsg: "या लिंकसाठी ब्राउझर सुरू करता येत नाही.",
    networkIssueTitle: "नेटवर्क समस्या",
    networkIssueMsg: "लिंक उघडण्यात अयशस्वी.",
  }
};

type Scheme = {
  id: string; 
  schemeName: string;
  issuingBody: string;
  disabilityType: string;
  summary: string;
  eligibility: string;
  howToApply: string;
  applicationUrl?: string;
  englishSchemeName?: string;
  translatedOperatorNotes?: string;
  isSuggested?: boolean;
};

export default function DashboardScreen() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [savedSchemeIds, setSavedSchemeIds] = useState<string[]>([]);
  const [disabilityType, setDisabilityType] = useState('');
  const [appLang, setAppLang] = useState<AppLanguage>('English');
  const [newSchemesBanner, setNewSchemesBanner] = useState<Scheme[]>([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  
  const [userPhoneState, setUserPhoneState] = useState('');
  const [rawSuggestions, setRawSuggestions] = useState<any[]>([]);
  
  const { getFontSize, fontLarge } = useAccessibility();
  const [newSchemeIds, setNewSchemeIds] = useState<string[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');

  // Initial user session bootstrap
  useEffect(() => {
    async function initializeSessionContext() {
      try {
        const raw = await AsyncStorage.getItem('loggedInUser');
        if (raw) {
          const user = JSON.parse(raw);
          setDisabilityType(user.disabilityType || '');
          if (user.language) setAppLang(user.language as AppLanguage);
          
          let userIsolatedKey = 'savedSchemes';
          if (user.uid) userIsolatedKey = `saved_schemes_${user.uid}`;
          else if (user.phone) userIsolatedKey = `saved_schemes_${user.phone}`;

          const rawSaved = await AsyncStorage.getItem(userIsolatedKey);
          if (rawSaved) {
            const parsedSaved = JSON.parse(rawSaved) as Scheme[];
            setSavedSchemeIds(parsedSaved.map(s => String(s.id || '')));
          } else {
            setSavedSchemeIds([]);
          }
        }
      } catch (err) {
        console.error("Session recovery initialization failure:", err);
      }
    }
    initializeSessionContext();
  }, []);

  // Screen focus: Instant Cache Load followed by Background Refresh
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const processSessionComparison = async (freshSchemes: any[], phoneKey: string) => {
        try {
          const storageKey = `last_schemes_snapshot_${phoneKey || 'guest'}`;
          const rawLastSnapshot = await AsyncStorage.getItem(storageKey);
          const freshIds = freshSchemes.map(s => String(s.id).trim().toUpperCase());

          if (rawLastSnapshot) {
            const lastSessionIds = JSON.parse(rawLastSnapshot) as string[];
            const newDiscovered = freshIds.filter(id => !lastSessionIds.includes(id));
            
            if (isInitialLoad && newDiscovered.length > 0) {
              setNewSchemeIds(newDiscovered);
              setIsInitialLoad(false); 
              
              Alert.alert(
                `New Updates!`,
                `We found ${newDiscovered.length} new welfare program(s) added since your last visit.`
              );
            }
          } else {
            setIsInitialLoad(false);
          }

          await AsyncStorage.setItem(storageKey, JSON.stringify(freshIds));
        } catch (error) {
          console.error("Failed to calculate session delta metrics:", error);
        }
      };

      const fetchSchemesWithCache = async () => {
        try {
          // 1. Resolve active user credentials
          const persistedGlobalLang = await AsyncStorage.getItem('appLanguagePreference');
          let activeLanguage: AppLanguage = (persistedGlobalLang as AppLanguage) || 'English';
          let currentUserPhone = '';

          const rawUser = await AsyncStorage.getItem('loggedInUser');
          if (rawUser && isMounted) {
            const user = JSON.parse(rawUser);
            setDisabilityType(user.disabilityType || '');
            if (user.language) {
              setAppLang(user.language as AppLanguage);
              activeLanguage = user.language as AppLanguage;
            }
            currentUserPhone = user.phone || '';

            const userIsolatedKey = user.uid ? `saved_schemes_${user.uid}` : `saved_schemes_${user.phone}`;
            const rawSaved = await AsyncStorage.getItem(userIsolatedKey);
            if (rawSaved && isMounted) {
              const parsedSaved = JSON.parse(rawSaved) as Scheme[];
              setSavedSchemeIds(parsedSaved.map(s => String(s.id || '')));
            }
          }

          const cleanPhone = currentUserPhone.split('.')[0].replace(/\D/g, '').trim();
          if (isMounted) setUserPhoneState(cleanPhone);

          // 2. INSTANT CACHE CHECK (Eliminates the loading delay)
          const cacheSchemesKey = `${CACHE_KEY_SCHEMES_PREFIX}${activeLanguage}`;
          const cacheSuggsKey = `${CACHE_KEY_SUGGESTIONS_PREFIX}${cleanPhone}`;

          const [cachedSchemesRaw, cachedSuggsRaw] = await Promise.all([
            AsyncStorage.getItem(cacheSchemesKey),
            AsyncStorage.getItem(cacheSuggsKey)
          ]);

          if (cachedSchemesRaw && isMounted) {
            try {
              const parsedCachedSchemes = JSON.parse(cachedSchemesRaw);
              if (parsedCachedSchemes && parsedCachedSchemes.length > 0) {
                setSchemes(parsedCachedSchemes);
                if (cachedSuggsRaw) setRawSuggestions(JSON.parse(cachedSuggsRaw));
                setLoading(false); // Immediate visual render
              }
            } catch (cacheErr) {
              console.warn("Failed reading cached records:", cacheErr);
            }
          }

          // 3. SILENT NETWORK SYNC (Background revalidation)
          const responseData = await getSchemes(activeLanguage, currentUserPhone); 

          if (!isMounted) return;

          const inboundSchemes = responseData?.schemes || [];
          const inboundSuggestions = responseData?.rawSuggestions || [];

          if (inboundSchemes && inboundSchemes.length > 0) {
            const mapped = inboundSchemes.map((s: any) => ({
              ...s,
              id: String(s.id).trim().toUpperCase(),
            }));
            
            setSchemes(mapped);
            setRawSuggestions(inboundSuggestions);
            setErrorText('');

            // Write back to cache for instantaneous subsequent launches
            await Promise.all([
              AsyncStorage.setItem(cacheSchemesKey, JSON.stringify(mapped)),
              AsyncStorage.setItem(cacheSuggsKey, JSON.stringify(inboundSuggestions))
            ]);

            await processSessionComparison(mapped, currentUserPhone);
          } else if (!cachedSchemesRaw) {
            setErrorText('No schemes found.');
            setSchemes([]);
          }
        } catch (err) {
          console.error("CRITICAL FETCH ERROR:", err);
          if (isMounted && schemes.length === 0) {
            setErrorText('Could not load schemes.');
          }
        } finally {
          if (isMounted) setLoading(false);
        }
      };
      
      fetchSchemesWithCache();

      return () => {
        isMounted = false; 
      };
    }, [isInitialLoad]) 
  );

  // ── 1. THE DISABILITY-ISOLATED SEARCH FILTER ──
  const filteredSchemes = useMemo(() => {
    const safeSchemes = schemes || [];
    
    const eligiblePool = safeSchemes.filter(scheme => 
      scheme && String(scheme.disabilityType).toLowerCase().trim() === String(disabilityType).toLowerCase().trim()
    );

    const cleanQuery = searchQuery.trim().toLowerCase();
    if (!cleanQuery) return eligiblePool; 

    return eligiblePool.filter((scheme) => {
      const currentLangName = String(scheme.schemeName || '').toLowerCase();
      const englishName = String(scheme.englishSchemeName || '').toLowerCase();

      return (
        currentLangName.includes(cleanQuery) ||
        englishName.includes(cleanQuery)
      );
    });
  }, [schemes, disabilityType, searchQuery]);

  // Computes sub-filtered list matrix ranked dynamically
  const personalizedSchemes = useMemo(() => {
    const cleanUserPhone = userPhoneState.trim();
    const sourceBucket = filteredSchemes || [];

    const suggestedBucket = sourceBucket.filter(scheme => {
      return rawSuggestions.some(sug => sug.phone === cleanUserPhone && sug.schemeId === scheme.id);
    });

    const standardBucket = sourceBucket.filter(scheme => {
      const isAlreadySuggested = rawSuggestions.some(sug => sug.phone === cleanUserPhone && sug.schemeId === scheme.id);
      return !isAlreadySuggested;
    });

    return [...suggestedBucket, ...standardBucket];
  }, [filteredSchemes, rawSuggestions, userPhoneState]);

  const toggleSave = async (scheme: Scheme) => {
    const isSaved = savedSchemeIds.includes(String(scheme.id)); 

    const updated = isSaved
      ? savedSchemeIds.filter((id) => id !== scheme.id)
      : [...savedSchemeIds, scheme.id];
    setSavedSchemeIds(updated);
    const savedSchemesList = schemes.filter((s) => updated.includes(s.id));
    
    await AsyncStorage.setItem('savedSchemes', JSON.stringify(savedSchemesList));
    
    const rawUser = await AsyncStorage.getItem('loggedInUser');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      if (user.uid) {
        await AsyncStorage.setItem(`saved_schemes_${user.uid}`, JSON.stringify(savedSchemesList));
      }
      if (user.phone) {
        await AsyncStorage.setItem(`saved_schemes_${user.phone}`, JSON.stringify(savedSchemesList));
      }
    }
  };

  const t = ((appDictionary as Record<string, any>)?.[appLang] || (appDictionary as Record<string, any>)?.English || {}) as Record<string, string>;
  const a11y = A11Y_HOME_TRANSLATIONS[appLang] || A11Y_HOME_TRANSLATIONS.English;

  const getNewSchemeBannerText = () => {
    const count = newSchemesBanner.length;
    const langMessages: Record<AppLanguage, string> = {
      English: `🔔 ${count} new scheme${count > 1 ? 's' : ''} available for ${disabilityType}!`,
      Hindi: `🔔 ${disabilityType} के लिए ${count} नई योजना${count > 1 ? 'एं' : ''} उपलब्ध!`,
      Kannada: `🔔 ${disabilityType} ಗಾಗಿ ${count} ಹೊಸ ಯೋಜನೆ${count > 1 ? 'ಗಳು' : ''} ಲಭ್ಯವಿದೆ!`,
      Telugu: `🔔 ${disabilityType} కోసం ${count} కొత్త పథకం${count > 1 ? 'లు' : ''} అందుబాటులో!`,
      Tamil: `🔔 ${disabilityType} க்கு ${count} புதிய திட்டம் கிடைக்கிறது!`,
      Bengali: `🔔 ${disabilityType} এর জন্য ${count}টি নতুন স্কিম পাওয়া গেছে!`,
      Marathi: `🔔 ${disabilityType} साठी ${count} नवीन योजना उपलब्ध!`,
    };
    return langMessages[appLang] || langMessages.English;
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* ── ACCESSIBLE SEARCH BOX ── */}
      <View style={styles.searchSectionWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-sharp" size={22} color="#2563eb" style={styles.searchIcon} aria-hidden={true} />
          <TextInput
            style={[styles.searchInput, { fontSize: getFontSize(16) }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t.searchSchemesPlaceholder || "Search welfare schemes"}
            placeholderTextColor="#64748b"
            clearButtonMode="while-editing"
            accessibilityRole="search"
            accessibilityLabel={t.searchSchemesPlaceholder || "Search welfare schemes"}
            accessibilityHint={a11y.searchHint}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')} 
              style={styles.clearButton}
              accessibilityRole="button"
              accessibilityLabel={a11y.clearSearchLabel}
            >
              <Ionicons name="close-circle" size={20} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollViewOuter}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── HEADER SYSTEM ── */}
        <View style={styles.headerRow}>
          <View style={styles.headerTextContainer}>
            <Text 
              style={[styles.title, { fontSize: getFontSize(32), lineHeight: fontLarge ? getFontSize(38) : 38 }]} 
              accessibilityRole="header"
              includeFontPadding={!fontLarge}
            >
              {t.homeTitle || "Welfare Schemes"}
            </Text>
            <Text 
              style={[styles.subtitle, { fontSize: getFontSize(16), lineHeight: fontLarge ? getFontSize(22) : 22 }]}
              includeFontPadding={!fontLarge}
            >
              {t.homeSubtitle || "Curated for"} <Text style={[styles.disabilityHighlight, { fontSize: getFontSize(16) }]}>{disabilityType || 'you'}</Text>
            </Text>
          </View>

          <Pressable
            style={[styles.bellButton, newSchemesBanner.length > 0 && !bannerDismissed && styles.bellButtonActive]}
            accessibilityRole="button"
            accessibilityLabel={newSchemesBanner.length > 0 && !bannerDismissed ? a11y.notifActiveLabel : a11y.notifIdleLabel}
            accessibilityHint={a11y.notifHint}
            onPress={() => {
              if (newSchemesBanner.length > 0) {
                setBannerDismissed(prev => !prev); 
              } else {
                Alert.alert(a11y.notifCaughtUpTitle, a11y.notifCaughtUpMsg);
              }
            }}>
            <Ionicons name="notifications" size={26} color={newSchemesBanner.length > 0 && !bannerDismissed ? "#ffffff" : "#1e293b"} />
            {newSchemesBanner.length > 0 && !bannerDismissed && (
              <View style={styles.notificationBadge} aria-hidden={true}>
                <Text style={[styles.notificationBadgeText, { fontSize: getFontSize(11) }]}>{newSchemesBanner.length}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* ── NEW SCHEMES BANNER ── */}
        {newSchemesBanner.length > 0 && !bannerDismissed && (
          <View 
            style={styles.newSchemesBanner}
            accessibilityRole="summary"
            accessibilityLabel={getNewSchemeBannerText()}
          >
            <View style={styles.bannerTextRow}>
              <Text 
                style={[styles.bannerText, { fontSize: getFontSize(15), lineHeight: fontLarge ? getFontSize(21) : 21 }]}
                includeFontPadding={!fontLarge}
              >
                {getNewSchemeBannerText()}
              </Text>
              <TouchableOpacity 
                accessibilityRole="button"
                accessibilityLabel={a11y.dismissBannerLabel}
                onPress={async () => {
                  setBannerDismissed(true);
                  setNewSchemesBanner([]); 
                  const currentIds = schemes.map(s => s.id);
                  await AsyncStorage.setItem('lastSeenSchemeIds', JSON.stringify(currentIds));
                }}>
                <Ionicons name="close" size={20} color="#1d4ed8" />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.newSchemesScroll}>
              {newSchemesBanner.map(scheme => (
                <TouchableOpacity
                  key={scheme.id}
                  style={styles.newSchemeChip}
                  accessibilityRole="button"
                  accessibilityLabel={`${a11y.viewNewSchemeLabel}: ${scheme.schemeName}`}
                  onPress={() => router.push({
                    pathname: '/scheme-detail',
                    params: {
                      id: scheme.id, 
                      schemeName: scheme.schemeName,
                      issuingBody: scheme.issuingBody,
                      summary: scheme.summary,
                      eligibility: scheme.eligibility,
                      howToApply: scheme.howToApply,
                      applicationUrl: scheme.applicationUrl || 'https://www.swavlambancard.gov.in/',
                      englishSchemeName: scheme.englishSchemeName || '',
                      isSuggested: 'false',
                      translatedOperatorNotes: '', 
                    },
                  } as any)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="sparkles" size={14} color="#ffffff" aria-hidden={true} />
                    <Text style={[styles.newSchemeChipText, { fontSize: getFontSize(13) }]}>
                      {scheme.schemeName}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── CARDS LOADING INDICATION BLOCK (Only shown on initial cold start without cache) ── */}
        {loading && schemes.length === 0 ? (
          <View style={styles.centerContent} accessibilityLiveRegion="polite" aria-live="polite">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={[styles.statusText, { fontSize: getFontSize(16) }]}>{a11y.loadingText}</Text>
          </View>
        ) : null}

        {!loading && errorText && schemes.length === 0 ? (
          <Text style={[styles.errorText, { fontSize: getFontSize(16) }]} accessibilityLiveRegion="assertive" aria-live="assertive">
            {errorText}
          </Text>
        ) : null}

        {/* ── EMPTY STATE BLOCK ── */}
        {!loading && !errorText && personalizedSchemes.length === 0 ? (
          <View style={styles.emptyContainerCard} accessibilityRole="text">
            <Text style={styles.emptyIconText} aria-hidden={true}>🔍</Text>
            <Text style={[styles.emptyMainText, { fontSize: getFontSize(18) }]}>{t.emptyHomeMain || "No Schemes Found"}</Text>
            <Text style={[styles.emptySubText, { fontSize: getFontSize(14) }]}>{t.emptyHomeSub || "Try changing your search parameters"}</Text>
          </View>
        ) : null}

        {/* ── CARD ROWS PRESENTATION GRID SYSTEM ── */}
        {personalizedSchemes.map((scheme) => {
          const isSaved = savedSchemeIds.includes(scheme.id);
          const isGovt = scheme.issuingBody.toLowerCase().includes('govt') || scheme.issuingBody.toLowerCase().includes('goi') || scheme.issuingBody.toLowerCase().includes('national') || scheme.issuingBody.toLowerCase().includes('ministry');
          const targetUrl = scheme.applicationUrl || 'https://www.swavlambancard.gov.in/';
          
          const dynamicSuggestion = rawSuggestions.find(
            sug => sug.phone === userPhoneState && sug.schemeId === scheme.id
          );
          const isSuggested = !!dynamicSuggestion; 
          const operatorName = dynamicSuggestion?.operatorId || 'NGO Team';
          const suggestionNotes = dynamicSuggestion?.operatorNotes || '';
          const isNewlyAdded = newSchemeIds.includes(String(scheme.id).trim().toUpperCase());

          const handleExternalRedirect = async () => {
            try {
              if (await Linking.canOpenURL(targetUrl)) {
                await Linking.openURL(targetUrl);
              } else {
                Alert.alert(a11y.linkErrorTitle, a11y.linkErrorMsg);
              }
            } catch {
              Alert.alert(a11y.networkIssueTitle, a11y.networkIssueMsg);
            }
          };

          const cardVoiceLabel = `${isSuggested ? `${a11y.recommendedBy}${operatorName}: ` : ""}${isNewlyAdded ? `${a11y.newSchemePrefix}: ` : ""}${scheme.schemeName}. ${isGovt ? a11y.govtTag : a11y.csrTag}. ${scheme.summary}`;

          return (
            <Pressable
              key={scheme.id}
              style={[
                styles.card, 
                isSuggested && styles.suggestedCardHighlight,
                isNewlyAdded && styles.newCardHighlight
              ]}
              android_ripple={{ color: '#f1f5f9' }}
              accessibilityRole="button"
              accessibilityLabel={cardVoiceLabel}
              onPress={() =>
                router.push({
                  pathname: '/scheme-detail',
                  params: {
                    id: scheme.id, 
                    schemeName: scheme.schemeName,
                    issuingBody: scheme.issuingBody,
                    summary: scheme.summary,
                    eligibility: scheme.eligibility,
                    howToApply: scheme.howToApply,
                    applicationUrl: targetUrl,
                    englishSchemeName: scheme.englishSchemeName || '',
                    isSuggested: isSuggested ? 'true' : 'false',
                    translatedOperatorNotes: suggestionNotes || '',
                  },
                } as any)
              }>
              
              {isSuggested && (
                <View style={styles.suggestionBannerContainer}>
                  <View style={styles.suggestionBadgeRow}>
                    <Ionicons name="shield-checkmark" size={16} color="#be185d" aria-hidden={true} />
                    <Text style={[styles.suggestionBadgeText, { fontSize: getFontSize(13) }]}>
                      {t.ngoSuggested || "NGO Recommended"} ({operatorName})
                    </Text>
                  </View>
                  
                  {suggestionNotes ? (
                    <Text style={[styles.suggestionNotesText, { fontSize: getFontSize(14) }]}>
                      Note: "{suggestionNotes}"
                    </Text>
                  ) : null}
                </View>
              )}

              <View style={styles.cardHeader}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  {isNewlyAdded && (
                    <View style={styles.newNotificationBadge} aria-hidden={true}>
                      <Ionicons name="sparkles" size={12} color="#ffffff" />
                      <Text style={styles.newNotificationText}>NEW</Text>
                    </View>
                  )}

                  <Text style={[styles.schemeName, { fontSize: getFontSize(20) }]} textBreakStrategy="simple">
                    {scheme.schemeName}
                  </Text>
                </View>

                <View style={[styles.tag, isGovt ? styles.govtTag : styles.csrTag]} aria-hidden={true}>
                  <Text style={[styles.tagText, { fontSize: getFontSize(12) }, isGovt ? styles.govtTagText : styles.csrTagText]}>
                    {isGovt ? 'Government' : 'CSR Welfare'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.summary, { fontSize: getFontSize(15) }]} numberOfLines={3} textBreakStrategy="simple">
                {scheme.summary}
              </Text>

              <TouchableOpacity 
                style={styles.redirectWebButton} 
                onPress={handleExternalRedirect}
                accessibilityRole="link"
                accessibilityLabel={`${t.applyButton || "Apply"}: ${a11y.applyButtonLabel}`}
                accessibilityHint={a11y.applyButtonHint}
              >
                <Text style={[styles.redirectWebButtonText, { fontSize: getFontSize(15) }]}>
                  {t.applyButton || "Apply"}
                </Text>
              </TouchableOpacity>

              <View style={styles.cardFooter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, paddingRight: 8 }} aria-hidden={true}>
                  <Ionicons name="business-outline" size={16} color="#64748b" />
                  <Text style={[styles.issuingBodyText, { fontSize: getFontSize(14) }]} numberOfLines={1}>
                    {scheme.issuingBody}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={[styles.saveButton, isSaved && styles.savedButton]}
                  accessibilityRole="button"
                  accessibilityLabel={isSaved ? a11y.savedButtonLabel : a11y.saveButtonLabel}
                  accessibilityState={{ selected: isSaved }}
                  onPress={(e) => { e.stopPropagation(); toggleSave(scheme); }}
                >
                  <Ionicons
                    name={isSaved ? "bookmark" : "bookmark-outline"}
                    size={16}
                    color={isSaved ? "#ffffff" : "#2563eb"}
                    aria-hidden={true}
                  />
                  <Text style={[styles.saveButtonText, { fontSize: getFontSize(14) }, isSaved && styles.savedButtonText]}>
                    {isSaved ? (t.savedButton || "Saved") : (t.saveButton || "Save")}
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollViewOuter: { flex: 1, backgroundColor: '#ffffff' },
  container: { flexGrow: 1, backgroundColor: '#ffffff', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerTextContainer: { flex: 1, paddingRight: 12 },
  title: { fontSize: 32, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 16, lineHeight: 22, color: '#64748b', fontWeight: '500' },
  disabilityHighlight: { color: '#2563eb', fontWeight: '700' },
  bellButton: {
    minWidth: 48,
    minHeight: 48,
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellButtonActive: { backgroundColor: '#2563eb' },
  notificationBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: '#ef4444', borderRadius: 999, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  notificationBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  newSchemesBanner: { backgroundColor: '#eff6ff', borderWidth: 1.5, borderColor: '#bfdbfe', borderRadius: 14, padding: 14, marginBottom: 20 },
  bannerTextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  bannerText: { fontSize: 15, fontWeight: '700', color: '#1d4ed8', flex: 1, marginRight: 8 },
  newSchemesScroll: { flexDirection: 'row' },
  newSchemeChip: { backgroundColor: '#2563eb', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  newSchemeChipText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  statusText: { fontSize: 16, color: '#64748b', marginTop: 12, fontWeight: '500' },
  errorText: { fontSize: 16, color: '#dc2626', textAlign: 'center', backgroundColor: '#fef2f2', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#fee2e2', marginTop: 20 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 },
  cardHeader: { marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  schemeName: { fontSize: 20, fontWeight: '700', color: '#1e293b', lineHeight: 26, marginBottom: 8 },
  tag: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  govtTag: { backgroundColor: '#dcfce7' },
  govtTagText: { color: '#15803d' },
  csrTag: { backgroundColor: '#eff6ff' },
  csrTagText: { color: '#1d4ed8' },
  summary: { fontSize: 15, lineHeight: 22, color: '#475569', marginBottom: 16 },
  redirectWebButton: { backgroundColor: '#eff6ff', borderWidth: 1.5, borderColor: '#bfdbfe', borderRadius: 12, minHeight: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 14, marginTop: 2 },
  redirectWebButtonText: { color: '#1e4ed8', fontSize: 15, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f8fafc', paddingTop: 12 },
  issuingBodyText: { fontSize: 14, fontWeight: '600', color: '#64748b', flex: 1, paddingRight: 8 },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 14,
    minHeight: 48,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
  },  
  savedButton: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  saveButtonText: { fontSize: 14, fontWeight: '700', color: '#2563eb' },
  savedButtonText: { color: '#ffffff' },
  emptyContainerCard: { backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1.5, borderColor: '#e2e8f0', borderStyle: 'dashed', padding: 32, alignItems: 'center', marginTop: 20 },
  emptyIconText: { fontSize: 40, marginBottom: 12 },
  emptyMainText: { fontSize: 18, fontWeight: '700', color: '#334155', marginBottom: 6 },
  emptySubText: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },
  suggestedCardHighlight: { borderColor: '#fbcfe8', borderWidth: 2, backgroundColor: '#fff5f7' },
  suggestionBannerContainer: { backgroundColor: '#fce7f3', borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#fbcfe8' },
  suggestionBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  suggestionBadgeText: { color: '#be185d', fontWeight: '800', letterSpacing: 0.3 },
  suggestionNotesText: { color: '#475569', fontWeight: '500', fontStyle: 'italic', paddingLeft: 2 },
  newCardHighlight: { borderColor: '#2563eb', borderWidth: 2 },
  newNotificationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#2563eb', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6 },
  newNotificationText: { color: '#ffffff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 50,
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 8,
  },
  clearButton: {
    padding: 6,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSectionWrapper: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
});