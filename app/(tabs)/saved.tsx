// saved.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAccessibility } from '../../context/AccessibilityContext';
import { appDictionary, AppLanguage } from '../../lib/appTranslations';
import { getSchemes } from '../../lib/googleSheets';

// ── COMPREHENSIVE INLINE SAVED ACCESSIBILITY DICTIONARY ──
const A11Y_SAVED_TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  English: {
    searchHint: "Type here to filter saved schemes by name.",
    clearSearchLabel: "Clear search text",
    govtTag: "Government Welfare Scheme",
    csrTag: "CSR Welfare Program",
    applyButtonHint: "Navigates away to launch the official form inside your browser.",
    cardHint: "Double tap to review comprehensive eligibility details for this bookmarked item.",
    recommendedBy: "NGO Recommended Option by",
    savedSchemePrefix: "Saved Scheme",
    categoryPrefix: "Category",
    issuedByPrefix: "Issued by",
    removeButtonHint: "Double tap to delete this scheme from your saved bookmarks.",
    removePrefix: "Remove",
    removeSuffix: "from your saved bookmarks.",
    linkErrorTitle: "Link Error",
    linkErrorMsg: "Cannot launch browser routing for this website target path.",
    networkIssueTitle: "Network Issue",
    networkIssueMsg: "Failed to route out to the target server configuration.",
  },
  Hindi: {
    searchHint: "सहेजी गई योजनाओं को नाम से खोजने के लिए यहाँ टाइप करें।",
    clearSearchLabel: "खोज टेक्स्ट साफ़ करें",
    govtTag: "सरकारी कल्याण योजना",
    csrTag: "सीएसआर कल्याण कार्यक्रम",
    applyButtonHint: "अपने ब्राउज़र में आधिकारिक पोर्टल खोलने के लिए दो बार टैप करें।",
    cardHint: "इस बुकमार्क की गई योजना के संपूर्ण विवरण देखने के लिए दो बार टैप करें।",
    recommendedBy: "एनजीओ द्वारा अनुशंसित योजना, अनुशंसक:",
    savedSchemePrefix: "सहेजी गई योजना",
    categoryPrefix: "श्रेणी",
    issuedByPrefix: "जारीकर्ता",
    removeButtonHint: "इस योजना को अपने सहेजे गए बुकमार्क से हटाने के लिए दो बार टैप करें।",
    removePrefix: "हटाएं",
    removeSuffix: "सहेजे गए बुकमार्क से।",
    linkErrorTitle: "लिंक त्रुटि",
    linkErrorMsg: "इस वेबसाइट लिंक के लिए ब्राउज़र नहीं खोला जा सका।",
    networkIssueTitle: "नेटवर्क समस्या",
    networkIssueMsg: "लक्ष्य सर्वर से जुड़ने में असमर्थ।",
  },
  Kannada: {
    searchHint: "ಉಳಿಸಲಾದ ಯೋಜನೆಗಳನ್ನು ಹೆಸರಿನ ಮೂಲಕ ಹುಡುಕಲು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ.",
    clearSearchLabel: "ಹುಡುಕಾಟ ಪಠ್ಯವನ್ನು ತೆರವುಗೊಳಿಸಿ",
    govtTag: "ಸರ್ಕಾರಿ ಕಲ್ಯಾಣ ಯೋಜನೆ",
    csrTag: "ಸಿಎಸ್ಆರ್ ಕಲ್ಯಾಣ ಕಾರ್ಯಕ್ರಮ",
    applyButtonHint: "ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ತೆರೆಯಲು ಎರಡು ಬಾರಿ ಟ್ಯಾಪ್ ಮಾಡಿ.",
    cardHint: "ಈ ಉಳಿಸಲಾದ ಯೋಜನೆಯ ಸಂಪೂರ್ಣ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ಎರಡು ಬಾರಿ ಟ್ಯಾಪ್ ಮಾಡಿ.",
    recommendedBy: "ಎನ್‌ಜಿಒ ಶಿಫಾರಸು ಮಾಡಿದ ಯೋಜನೆ, ಶಿಫಾರಸುದಾರರು:",
    savedSchemePrefix: "ಉಳಿಸಲಾದ ಯೋಜನೆ",
    categoryPrefix: "ವರ್ಗ",
    issuedByPrefix: "ನೀಡಿದವರು",
    removeButtonHint: "ಈ ಯೋಜನೆಯನ್ನು ನಿಮ್ಮ ಉಳಿಸಿದ ಬುಕ್‌ಮಾರ್ಕ್‌ಗಳಿಂದ ತೆಗೆದುಹಾಕಲು ಎರಡು ಬಾರಿ ಟ್ಯಾಪ್ ಮಾಡಿ.",
    removePrefix: "ತೆಗೆದುಹಾಕಿ",
    removeSuffix: "ಉಳಿಸಿದ ಬುಕ್‌ಮಾರ್ಕ್‌ಗಳಿಂದ.",
    linkErrorTitle: "ಲಿಂಕ್ ದೋಷ",
    linkErrorMsg: "ಈ ವೆಬ್‌ಸೈಟ್‌ಗಾಗಿ ಬ್ರೌಸರ್ ತೆರೆಯಲು ಸಾಧ್ಯವಿಲ್ಲ.",
    networkIssueTitle: "ನೆಟ್‌ವರ್ಕ್ ಸಮಸ್ಯೆ",
    networkIssueMsg: "ಸರ್ವರ್ ಕಾನ್ಫಿಗರೇಶನ್‌ಗೆ ಸಂಪರ್ಕಿಸಲು ವಿಫಲವಾಗಿದೆ.",
  },
  Tamil: {
    searchHint: "சேமிக்கப்பட்ட திட்டங்களை பெயர் மூலம் வடிகட்ட இங்கே தட்டச்சு செய்யவும்.",
    clearSearchLabel: "தேடல் உரையை அழிக்கவும்",
    govtTag: "அரசு நலத்திட்டம்",
    csrTag: "கார்ப்பரேட் சமூக நலத் திட்டம்",
    applyButtonHint: "உலாவியில் அதிகாரப்பூர்வ இணையதளத்தைத் திறக்க இருமுறை தட்டவும்.",
    cardHint: "இந்தச் சேமிக்கப்பட்ட திட்டத்தின் விரிவான தகுதி விவரங்களைக் காண இருமுறை தட்டவும்.",
    recommendedBy: "தன்னார்வ அமைப்பால் பரிந்துரைக்கப்பட்ட திட்டம், பரிந்துரைத்தவர்:",
    savedSchemePrefix: "சேமிக்கப்பட்ட திட்டம்",
    categoryPrefix: "வகை",
    issuedByPrefix: "வழங்குபவர்",
    removeButtonHint: "இந்தத் திட்டத்தை சேமிப்பிலிருந்து நீக்க இருமுறை தட்டவும்.",
    removePrefix: "நீக்குக",
    removeSuffix: "சேமிக்கப்பட்ட திட்டங்களிலிருந்து.",
    linkErrorTitle: "இணைப்புப் பிழை",
    linkErrorMsg: "இந்த வலைத்தள இணைப்பிற்கான உலாவியைத் திறக்க முடியவில்லை.",
    networkIssueTitle: "வலைப்பின்னல் சிக்கல்",
    networkIssueMsg: "இலக்கு சேவையகத்தை இணைக்க முடியவில்லை.",
  },
  Telugu: {
    searchHint: "సేవ్ చేసిన పథకాలను పేరు ద్వారా ఫిల్టర్ చేయడానికి ఇక్కడ టైప్ చేయండి.",
    clearSearchLabel: "శోధన వచనాన్ని క్లియర్ చేయండి",
    govtTag: "ప్రభుత్వ సంక్షేమ పథకం",
    csrTag: "సిఎస్‌ఆర్ సంక్షేమ కార్యక్రమం",
    applyButtonHint: "మీ బ్రౌజర్‌లో అధికారిక పోర్టల్‌ను ప్రారంభించడానికి రెండుసార్లు నొక్కండి.",
    cardHint: "ఈ బుక్‌మార్క్ చేసిన అంశం యొక్క సమగ్ర అర్హత వివరాలను సమీక్షించడానికి రెండుసార్లు నొక్కండి.",
    recommendedBy: "ఎన్‌జీవో సిఫార్సు చేసిన పథకం, సిఫార్సు చేసినవారు:",
    savedSchemePrefix: "సేవ్ చేసిన పథకం",
    categoryPrefix: "వర్గం",
    issuedByPrefix: "జారీ చేసిన సంస్థ",
    removeButtonHint: "ఈ పథకాన్ని సేవ్ చేసిన బుక్‌మార్క్‌ల నుండి తొలగించడానికి రెండుసార్లు నొక్కండి.",
    removePrefix: "తొలగించు",
    removeSuffix: "సేవ్ చేసిన బుక్‌మార్క్‌ల నుండి.",
    linkErrorTitle: "లింక్ లోపం",
    linkErrorMsg: "ఈ వెబ్‌సైట్ కోసం బ్రౌజర్‌ను ప్రారంభించడం సాధ్యం కాలేదు.",
    networkIssueTitle: "నెట్‌వర్క్ సమస్య",
    networkIssueMsg: "టార్గెట్ సర్వర్ కాన్ఫిగరేషన్‌కు రూట్ చేయడంలో విఫలమైంది.",
  },
  Bengali: {
    searchHint: "নাম অনুসারে সংরক্ষিত স্কিমগুলি ফিল্টার করতে এখানে লিখুন।",
    clearSearchLabel: "অনুসন্ধান লেখা মুছুন",
    govtTag: "সরকারি কল্যাণমূলক স্কিম",
    csrTag: "সিএসআর কল্যাণ কর্মসূচি",
    applyButtonHint: "আপনার ব্রাউজারে অফিসিয়াল ফর্মটি খুলতে দুবার ট্যাপ করুন।",
    cardHint: "এই সংরক্ষিত স্কিমের সম্পূর্ণ বিবরণ পর্যালোচনা করতে দুবার ট্যাপ করুন।",
    recommendedBy: "এনজিও সুপারিশকৃত স্কিম, সুপারিশকারী:",
    savedSchemePrefix: "সংরক্ষিত স্কিম",
    categoryPrefix: "বিভাগ",
    issuedByPrefix: "প্রদানকারী সংস্থা",
    removeButtonHint: "সংরক্ষিত তালিকা থেকে এই স্কিমটি সরিয়ে ফেলতে দুবার ট্যাপ করুন।",
    removePrefix: "সরান",
    removeSuffix: "আপনার সংরক্ষিত বুকমার্ক থেকে।",
    linkErrorTitle: "লিংক ত্রুটি",
    linkErrorMsg: "এই ওয়েবসাইট লিংকের জন্য ব্রাউজার চালু করা যাচ্ছে না।",
    networkIssueTitle: "নেটওয়ার্ক সমস্যা",
    networkIssueMsg: "সার্ভারের সাথে সংযোগ করতে ব্যর্থ হয়েছে।",
  },
  Marathi: {
    searchHint: "जतन केलेल्या योजना नावाद्वारे शोधण्यासाठी येथे टाइप करा.",
    clearSearchLabel: "शोध मजकूर साफ करा",
    govtTag: "शासकीय कल्याणकारी योजना",
    csrTag: "सीएसआर कल्याणकारी कार्यक्रम",
    applyButtonHint: "अधिकृत वेबसाइट ब्राउझरमध्ये उघडण्यासाठी दोनदा टॅप करा.",
    cardHint: "या जतन केलेल्या योजनेची सर्व माहिती पाहण्यासाठी दोनदा टॅप करा.",
    recommendedBy: "एनजीओने शिफारस केलेली योजना, शिफारसकर्ता:",
    savedSchemePrefix: "जतन केलेली योजना",
    categoryPrefix: "वर्गवारी",
    issuedByPrefix: "जारी करणारी संस्था",
    removeButtonHint: "या योजनेला तुमच्या जतन केलेल्या यादीतून काढून टाकण्यासाठी दोनदा टॅप करा.",
    removePrefix: "काढा",
    removeSuffix: "तुमच्या जतन केलेल्या यादीतून.",
    linkErrorTitle: "लिंक त्रुटी",
    linkErrorMsg: "या वेबसाइटसाठी ब्राउझर उघडता येत नाही.",
    networkIssueTitle: "नेटवर्क समस्या",
    networkIssueMsg: "सर्व्हरशी संपर्क साधण्यात अयशस्वी.",
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
};

export default function SavedScreen() {
  const router = useRouter();
  const [savedSchemes, setSavedSchemes] = useState<Scheme[]>([]);
  const [appLang, setAppLang] = useState<AppLanguage>('English');

  const [userPhoneState, setUserPhoneState] = useState('');
  const [rawSuggestions, setRawSuggestions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [disabilityType, setDisabilityType] = useState('');

  const { getFontSize } = useAccessibility();

  useFocusEffect(
    useCallback(() => {
      async function loadAndTranslateSaved() {
        try {
          const rawSaved = await AsyncStorage.getItem('savedSchemes');
          const rawUser = await AsyncStorage.getItem('loggedInUser');
          
          let activeLang: AppLanguage = 'English';
          let currentUserPhone = '';

          if (rawUser) {
            const user = JSON.parse(rawUser);
            setDisabilityType(user.disabilityType || '');
            if (user.language) {
              activeLang = user.language as AppLanguage;
              setAppLang(activeLang);
            }
            currentUserPhone = user.phone || '';
            setUserPhoneState(currentUserPhone.split('.')[0].replace(/\D/g, '').trim());
          }
      
          if (!rawSaved) {
            setSavedSchemes([]);
            return;
          }
      
          const localFavorites = JSON.parse(rawSaved) as Scheme[];
          const responseData = await getSchemes(activeLang, currentUserPhone);
      
          let freshSheetData = [];
          let inboundSuggestions = [];

          if (responseData && typeof responseData === 'object') {
            if (Array.isArray(responseData)) {
              freshSheetData = responseData;
            } else {
              freshSheetData = responseData.schemes || [];
              inboundSuggestions = responseData.rawSuggestions || [];
            }
          }

          setRawSuggestions(inboundSuggestions);

          if (freshSheetData && freshSheetData.length > 0) {
            const translatedFavorites = localFavorites.map((localFav) => {
              const matchedLiveRow = freshSheetData.find(
                (sheetRow: any) => 
                  (sheetRow.englishSchemeName && localFav.englishSchemeName && 
                    sheetRow.englishSchemeName.toLowerCase().trim() === localFav.englishSchemeName.toLowerCase().trim()) ||
                  (localFav.id && sheetRow.id && String(localFav.id).trim().toUpperCase() === String(sheetRow.id).trim().toUpperCase()) ||
                  sheetRow.schemeName.toLowerCase().trim() === localFav.schemeName.toLowerCase().trim()
              );
      
              if (matchedLiveRow) {
                return {
                  ...localFav,
                  id: String(matchedLiveRow.id).trim().toUpperCase(),
                  schemeName: matchedLiveRow.schemeName,
                  englishSchemeName: matchedLiveRow.englishSchemeName || localFav.englishSchemeName,
                  summary: matchedLiveRow.summary,
                  eligibility: matchedLiveRow.eligibility,
                  howToApply: matchedLiveRow.howToApply,
                  issuingBody: matchedLiveRow.issuingBody,
                  applicationUrl: matchedLiveRow.applicationUrl
                };
              }
              return { ...localFav, id: String(localFav.id).trim().toUpperCase() }; 
            });
      
            setSavedSchemes(translatedFavorites);
          } else {
            setSavedSchemes(localFavorites.map(f => ({ ...f, id: String(f.id).trim().toUpperCase() }))); 
          }
        } catch (error) {
          console.error("Saved translation engine mismatch:", error);
        }
      }
      
      loadAndTranslateSaved();
    }, [])
  );

  const handleRemove = async (schemeId: string) => {
    const updated = savedSchemes.filter((s) => s.id !== schemeId); 
    setSavedSchemes(updated); 
    
    await AsyncStorage.setItem('savedSchemes', JSON.stringify(updated));
    
    const rawUser = await AsyncStorage.getItem('loggedInUser');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      if (user.uid) {
        await AsyncStorage.setItem(`saved_schemes_${user.uid}`, JSON.stringify(updated));
      }
    }
  };

  const filterSaved = useMemo(() => {
    const safeSchemes = savedSchemes || [];
    const cleanQuery = searchQuery.trim().toLowerCase();

    if (!cleanQuery) return savedSchemes; 

    return safeSchemes.filter((scheme) => {
      const currentLangName = String(scheme.schemeName || '').toLowerCase();
      const englishName = String(scheme.englishSchemeName || '').toLowerCase();
      return (
        currentLangName.includes(cleanQuery) ||
        englishName.includes(cleanQuery)
      );
    });
  }, [savedSchemes, searchQuery]);

  const t = ((appDictionary as Record<string, any>)?.[appLang] || (appDictionary as Record<string, any>)?.English || {}) as Record<string, string>;
  const a11y = A11Y_SAVED_TRANSLATIONS[appLang] || A11Y_SAVED_TRANSLATIONS.English;

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
        {/* Dynamic Accessible Headers mapped to screen scales */}
        <Text style={[styles.title, { fontSize: getFontSize(32) }]} accessibilityRole="header">
          {t.savedTitle || "Saved Schemes"}
        </Text>
        <Text style={[styles.subtitle, { fontSize: getFontSize(16) }]}>{t.savedSubtitle || "Your bookmarked welfare programs"}</Text>

        {/* RENDER SYSTEM BLOCK 1: Empty State Graphic Alert Placeholder Display */}
        {savedSchemes.length === 0 ? (
          <View style={styles.emptyContainerCard} accessibilityRole="text" accessibilityLabel={`${t.emptySavedMain || 'No saved schemes'}. ${t.emptySavedSub || 'Bookmark programs to view them later'}`}>
            <View style={styles.emptyIconWrapper} aria-hidden={true}>
              <Ionicons name="bookmark-outline" size={44} color="#94a3b8" />
            </View>
            <Text style={[styles.emptyMainText, { fontSize: getFontSize(18) }]}>{t.emptySavedMain || "No saved schemes"}</Text>
            <Text style={[styles.emptySubText, { fontSize: getFontSize(14) }]}>{t.emptySavedSub || "Bookmark programs to view them later"}</Text>
          </View>
        ) : null}

        {/* RENDER SYSTEM BLOCK 2: Map saved records into list layout view cards */}
        {filterSaved.map((scheme) => {
          const isGovt = scheme.issuingBody.toLowerCase().includes('govt') || scheme.issuingBody.toLowerCase().includes('goi') || scheme.issuingBody.toLowerCase().includes('national') || scheme.issuingBody.toLowerCase().includes('ministry');
          const targetUrl = scheme.applicationUrl || 'https://www.swavlambancard.gov.in/';

          const dynamicSuggestion = rawSuggestions.find(
            sug => sug.phone === userPhoneState && sug.schemeId === scheme.id
          );

          const isSuggested = !!dynamicSuggestion; 
          const operatorName = dynamicSuggestion?.operatorId || 'NGO Team';
          const suggestionNotes = dynamicSuggestion?.operatorNotes || '';

          const handleExternalRedirect = async () => {
            try {
              const supported = await Linking.canOpenURL(targetUrl);
              if (supported) {
                await Linking.openURL(targetUrl);
              } else {
                Alert.alert(a11y.linkErrorTitle, a11y.linkErrorMsg);
              }
            } catch {
              Alert.alert(a11y.networkIssueTitle, a11y.networkIssueMsg);
            }
          };

          const cardVoiceLabel = `${isSuggested ? `${a11y.recommendedBy} ${operatorName}: ` : ""}${a11y.savedSchemePrefix}: ${scheme.schemeName}. ${a11y.categoryPrefix}: ${isGovt ? a11y.govtTag : a11y.csrTag}. ${a11y.issuedByPrefix}: ${scheme.issuingBody}.`;

          return (
            <Pressable 
              key={scheme.id} 
              style={[styles.card, isSuggested && styles.suggestedCardHighlight]} 
              android_ripple={{ color: '#f1f5f9' }}
              accessibilityRole="button"
              accessibilityLabel={cardVoiceLabel}
              accessibilityHint={a11y.cardHint}
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
                    fromSaved: 'true',
                    isSuggested: isSuggested ? 'true' : 'false',
                    translatedOperatorNotes: suggestionNotes || '', 
                  },
                } as any)
              }
            >
              {/* ── NGO RECOMMENDATION BANNER ── */}
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

              {/* Welfare Program Card Title Row Layout block */}
              <View style={styles.cardHeader}>
                <Text style={[styles.schemeName, { fontSize: getFontSize(20) }]} textBreakStrategy="simple">{scheme.schemeName}</Text>

                <View style={[styles.tag, isGovt ? styles.govtTag : styles.csrTag]} aria-hidden={true}>
                  <Text style={[styles.tagText, { fontSize: getFontSize(12) }, isGovt ? styles.govtTagText : styles.csrTagText]}>
                    {isGovt ? 'Government' : 'CSR Welfare'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.summary, { fontSize: getFontSize(15) }]} textBreakStrategy="simple">
                {scheme.summary}
              </Text>

              {/* Central Call-To-Action Apply Button */}
              <TouchableOpacity 
                style={styles.redirectWebButton}
                onPress={handleExternalRedirect}
                accessibilityRole="link"
                accessibilityLabel={`${t.applyButton || "Apply"} for ${scheme.schemeName}`}
                accessibilityHint={a11y.applyButtonHint}
              >
                <Text style={[styles.redirectWebButtonText, { fontSize: getFontSize(15) }]}>{t.applyButton || "Apply"}</Text>
              </TouchableOpacity>

              {/* Bottom Card Control Action Bar Tray */}
              <View style={styles.cardFooter}>
                <View style={styles.footerIconRow} aria-hidden={true}>
                  <Ionicons name="business-outline" size={16} color="#64748b" style={styles.footerIconSpacing} />
                  <Text 
                    style={[styles.issuingBodyText, { fontSize: getFontSize(14) }]} 
                    numberOfLines={1}
                  >
                    {scheme.issuingBody}
                  </Text>
                </View>

                {/* Explicit Bookmark Removal action button wrapper link */}
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={(e) => { e.stopPropagation(); handleRemove(scheme.id); }}
                  accessibilityRole="button"
                  accessibilityLabel={`${a11y.removePrefix} ${scheme.schemeName} ${a11y.removeSuffix}`}
                  accessibilityHint={a11y.removeButtonHint}
                >
                  <Text style={[styles.removeButtonText, { fontSize: getFontSize(14) }]}>{t.removeButton || "Remove"}</Text>
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
  container: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40, backgroundColor: '#ffffff' },
  title: { fontSize: 32, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 16, lineHeight: 22, color: '#64748b', fontWeight: '500', marginBottom: 24 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 },
  cardHeader: { marginBottom: 10 },
  schemeName: { fontSize: 20, fontWeight: '700', color: '#1e293b', lineHeight: 26, marginBottom: 8, flexShrink: 1, flexWrap: 'wrap' },
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
  footerIconRow: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 },
  footerIconSpacing: { marginRight: 6 },
  issuingBodyText: { fontSize: 14, fontWeight: '600', color: '#64748b', flex: 1 },
  removeButton: {
    borderWidth: 1.5,
    borderColor: '#ffe4e6',
    backgroundColor: '#fff1f2',
    borderRadius: 8,
    paddingHorizontal: 14,
    minHeight: 48, // Guarantees the 48dp minimum target
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: { fontSize: 14, fontWeight: '700', color: '#e11d48' },
  emptyContainerCard: { backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1.5, borderColor: '#e2e8f0', borderStyle: 'dashed', padding: 32, alignItems: 'center', marginTop: 10 },
  emptyIconWrapper: { marginBottom: 12, justifyContent: 'center', alignItems: 'center' },
  emptyMainText: { fontSize: 18, fontWeight: '700', color: '#334155', marginBottom: 6 },
  emptySubText: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },
  suggestedCardHighlight: { borderColor: '#fbcfe8', borderWidth: 2, backgroundColor: '#fff5f7' },
  suggestionBannerContainer: { backgroundColor: '#fce7f3', borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#fbcfe8' },
  suggestionBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  suggestionBadgeText: { color: '#be185d', fontWeight: '800', letterSpacing: 0.3 },
  suggestionNotesText: { color: '#475569', fontWeight: '500', fontStyle: 'italic', paddingLeft: 2 },

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
    minHeight: 44,
    minWidth: 44,
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