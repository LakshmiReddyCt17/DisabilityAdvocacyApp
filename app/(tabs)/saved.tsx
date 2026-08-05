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

// Define the shape of a Scheme object for type-safety across the file
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
  const router = useRouter(); // Core component for handling view transitions and screen routing
  const [savedSchemes, setSavedSchemes] = useState<Scheme[]>([]); // Tracks array of schemes saved locally
  const [appLang, setAppLang] = useState<AppLanguage>('English'); // Holds user's active interface language choice

  // Added States for client-side local recommendation checks
  const [userPhoneState, setUserPhoneState] = useState('');
  const [rawSuggestions, setRawSuggestions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [disabilityType, setDisabilityType] = useState('');



  const { getFontSize } = useAccessibility(); // Accessibility hook to dynamically scale text sizing layout parameters

  // Fires automatically every single time a user switches tabs or navigates back to this screen
  useFocusEffect(
    useCallback(() => {
      async function loadAndTranslateSaved() {
        try {
          // Fetch raw strings out of local hardware memory storage sandbox
          const rawSaved = await AsyncStorage.getItem('savedSchemes');
          const rawUser = await AsyncStorage.getItem('loggedInUser');
          
          let activeLang: AppLanguage = 'English';
          let currentUserPhone = '';

          if (rawUser) {
            const user = JSON.parse(rawUser);
            setDisabilityType(user.disabilityType || '');
            if (user.language) {
              activeLang = user.language as AppLanguage;
              setAppLang(activeLang); // Sync state variables with active profile language configuration
            }
            currentUserPhone = user.phone || '';
            setUserPhoneState(currentUserPhone.split('.')[0].replace(/\D/g, '').trim());
          }
      
          // Early exit check if the user has absolutely no bookmarked items yet
          if (!rawSaved) {
            setSavedSchemes([]);
            return;
          }
      
          const localFavorites = JSON.parse(rawSaved) as Scheme[];
          // Request fresh database master package envelope formats from backend engine
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
            // Loop through local items and overwrite localized details using the matching live spreadsheet values
            const translatedFavorites = localFavorites.map((localFav) => {
              const matchedLiveRow = freshSheetData.find(
                (sheetRow: any) => 
                  // Matching strategy variant 1: Validate exact match using invariant English schema keys
                  (sheetRow.englishSchemeName && localFav.englishSchemeName && 
                    sheetRow.englishSchemeName.toLowerCase().trim() === localFav.englishSchemeName.toLowerCase().trim()) ||
                  // Matching strategy variant 2: Direct identifier key alignment checks
                  (localFav.id && sheetRow.id && String(localFav.id).trim().toUpperCase() === String(sheetRow.id).trim().toUpperCase()) ||
                  // Matching strategy variant 3: Direct baseline validation comparison fallback
                  sheetRow.schemeName.toLowerCase().trim() === localFav.schemeName.toLowerCase().trim()
              );
      
              if (matchedLiveRow) {
                return {
                  ...localFav,
                  id: String(matchedLiveRow.id).trim().toUpperCase(), // Enforce unyielding uppercase identifier
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
      
            setSavedSchemes(translatedFavorites); // Commit newly computed data to update display lists
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

  // ── REMOVE BOOKMARK TRANSACTION  ──
  const handleRemove = async (schemeId: string) => {
    const updated = savedSchemes.filter((s) => s.id !== schemeId); 
    setSavedSchemes(updated); 
    
    // Write changes immediately across both global cache keys and isolated multi-user profiles
    await AsyncStorage.setItem('savedSchemes', JSON.stringify(updated));
    
    const rawUser = await AsyncStorage.getItem('loggedInUser');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      if (user.uid) {
        await AsyncStorage.setItem(`saved_schemes_${user.uid}`, JSON.stringify(updated));
      }
    }
  };



  const filterSaved=useMemo(()=>{
    const safeSchemes = savedSchemes || [];
    const cleanQuery = searchQuery.trim().toLowerCase();

    if (!cleanQuery) return savedSchemes; 

    return savedSchemes.filter((scheme)=>{
      const currentLangName=String(scheme.schemeName).toLowerCase();
      const englishName=String(scheme.englishSchemeName).toLowerCase();
      return(
        currentLangName.includes(cleanQuery)||
        englishName.includes(cleanQuery)
      )
  });
  },[savedSchemes,searchQuery]);



  // Extract translation text dictionary objects mapped to screen language states
  const t = appDictionary[appLang] || appDictionary.English;

  return (

    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>

      {/* ── ACCESSIBLE SEARCH BOX ── */}
      <View style={styles.searchSectionWrapper}>
        <View style={styles.searchContainer}>
          
          <Ionicons name="search-sharp" size={22} color="#2563eb" style={styles.searchIcon} />
            <TextInput
                style={[styles.searchInput, { fontSize: getFontSize(16) }]} // Respects dynamic font sizes
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t.searchSchemesPlaceholder}
                placeholderTextColor="#64748b"
                clearButtonMode="while-editing"
                accessibilityRole="search"
                accessibilityHint="Type here to instantly filter schemes by name anywhere in the text."
              />
          {searchQuery.length > 0 && (
              <TouchableOpacity 
              onPress={() => setSearchQuery('')} 
              style={styles.clearButton}
              accessibilityRole="button"
              accessibilityLabel="Clear search text"
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
          {t.savedTitle}
      </Text>
      <Text style={[styles.subtitle, { fontSize: getFontSize(16) }]}>{t.savedSubtitle}</Text>

      {/* RENDER SYSTEM BLOCK 1: Empty State Graphic Alert Placeholder Display */}
      {savedSchemes.length === 0 ? (
        <View style={styles.emptyContainerCard} accessibilityLabel={`${t.emptySavedMain}. ${t.emptySavedSub}`}>
          <View style={styles.emptyIconWrapper} aria-hidden={true}>
            <Ionicons name="bookmark-outline" size={44} color="#94a3b8" />
          </View>
          <Text style={[styles.emptyMainText, { fontSize: getFontSize(18) }]}>{t.emptySavedMain}</Text>
          <Text style={[styles.emptySubText, { fontSize: getFontSize(14) }]}>{t.emptySavedSub}</Text>
        </View>
      ) : null}

      {/* RENDER SYSTEM BLOCK 2: Map saved records into list layout view cards */}
      {filterSaved.map((scheme) => {
        // Evaluate organizational status logic parameter sequences to build dynamic display metadata tags
        const isGovt = scheme.issuingBody.toLowerCase().includes('govt') || scheme.issuingBody.toLowerCase().includes('goi') || scheme.issuingBody.toLowerCase().includes('national') || scheme.issuingBody.toLowerCase().includes('ministry');
        const targetUrl = scheme.applicationUrl || 'https://www.swavlambancard.gov.in/';

        // ── CLIENT-SIDE RECOMMENDATION MATCHING MATRIX FOR SAVED CARDS ──
        const dynamicSuggestion = rawSuggestions.find(
          sug => sug.phone === userPhoneState && sug.schemeId === scheme.id
        );

        const isSuggested = !!dynamicSuggestion; 
        const operatorName = dynamicSuggestion?.operatorId || 'NGO Team';
        const suggestionNotes = dynamicSuggestion?.operatorNotes || '';

        // Native Browser Launcher action router loop mapping
        const handleExternalRedirect = async () => {
          try {
            const supported = await Linking.canOpenURL(targetUrl);
            if (supported) {
              await Linking.openURL(targetUrl); // Handoff process execution context layer directly to mobile OS browser engine
            } else {
              Alert.alert('Link Error', 'Cannot launch browser routing for this website target path.');
            }
          } catch {
            Alert.alert('Network Issue', 'Failed to route out to the target server configuration.');
          }
        };

        return (
          <Pressable 
            key={scheme.id} 
            style={[styles.card, isSuggested && styles.suggestedCardHighlight]} 
            android_ripple={{ color: '#f1f5f9' }}
            accessibilityRole="button"
            accessibilityLabel={`${isSuggested ? `NGO Recommended Option by ${operatorName}: ` : ""}Saved Scheme: ${scheme.schemeName}. Category: ${isGovt ? 'Government Welfare' : 'CSR Welfare'}. Organization: ${scheme.issuingBody}.`}
            accessibilityHint="Double tap to open and review the comprehensive eligibility requirements and procedural steps for this bookmarked item."
            onPress={() =>
              // Transition router forward to the scheme details card layout workspace injection engine
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
                  fromSaved: 'true', // Flag argument ensures back targets path returns cleanly to the bookmarks screen
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
                  <Ionicons name="shield-checkmark" size={16} color="#be185d" />
                  <Text style={[styles.suggestionBadgeText, { fontSize: getFontSize(13) }]}>
                    {t.ngoSuggested} ({operatorName})
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

              {/* Dynamic Tag Container: Color styling updates contextually depending on Government vs Private CSR tracking data flags */}
              <View style={[styles.tag, isGovt ? styles.govtTag : styles.csrTag]} aria-hidden={true}>
                <Text style={[styles.tagText, { fontSize: getFontSize(12) }, isGovt ? styles.govtTagText : styles.csrTagText]}>
                  {isGovt ? 'Government' : 'CSR Welfare'}
                </Text>
              </View>
            </View>

            {/* Scheme Summary snippet presentation*/}
            <Text style={[styles.summary, { fontSize: getFontSize(15) }]} textBreakStrategy="simple">
              {scheme.summary}
            </Text>

            {/* Central Call-To-Action Apply Button */}
            <TouchableOpacity 
              style={styles.redirectWebButton}
              onPress={handleExternalRedirect}
              accessibilityRole="link"
              accessibilityLabel={`${t.applyButton} for ${scheme.schemeName}`}
              accessibilityHint="Navigates away from the application layer to launch the form registration inside your device browser."
            >
              <Text style={[styles.redirectWebButtonText, { fontSize: getFontSize(15) }]}>{t.applyButton}</Text>
            </TouchableOpacity>

            {/* Bottom Card Control Action Bar Tray */}
            <View style={styles.cardFooter}>
              {/* Department/Issuing Organization indicator metadata tags block */}
              <View style={styles.footerIconRow}>
                <Ionicons name="business-outline" size={16} color="#64748b" style={styles.footerIconSpacing} />
                <Text 
                  style={[styles.issuingBodyText, { fontSize: getFontSize(14) }]} 
                  accessibilityLabel={`Issued by: ${scheme.issuingBody}`}
                  numberOfLines={1} // Prevents extra-long text strings from wrapping out of line alignment boundaries
                >
                  {scheme.issuingBody}
                </Text>
              </View>

              {/* Explicit Bookmark Removal action button wrapper link */}
              <TouchableOpacity
                style={styles.removeButton}
                // e.stopPropagation ensures clicking the nested button area doesn't trigger the root parent card press action handler route
                onPress={(e) => { e.stopPropagation(); handleRemove(scheme.id); }}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${scheme.schemeName} out of your saved bookmarks selection checklist.`}
              >
                <Text style={[styles.removeButtonText, { fontSize: getFontSize(14) }]}>{t.removeButton}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
    </View>
  );
}

// Styles
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
  removeButton: { borderWidth: 1.5, borderColor: '#ffe4e6', backgroundColor: '#fff1f2', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6, alignItems: 'center', justifyContent: 'center' },
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
    height: 48,
    // Soft shadow framework for Android
    elevation: 2, 
    // Soft shadow framework for iOS
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
    padding: 4,
  },

  searchSectionWrapper: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 54, // Safely clears status bars
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9', // Soft separator line before scroll starts
  },

});