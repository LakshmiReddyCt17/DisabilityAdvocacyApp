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

// Data model shape for standard scheme entries received from the Sheets engine
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
  
  // Interface & data lists lifecycle state
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [savedSchemeIds, setSavedSchemeIds] = useState<string[]>([]);
  const [disabilityType, setDisabilityType] = useState('');
  const [appLang, setAppLang] = useState<AppLanguage>('English');
  const [newSchemesBanner, setNewSchemesBanner] = useState<Scheme[]>([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  
  // New States added for client-side raw suggestion list processing
  const [userPhoneState, setUserPhoneState] = useState('');
  const [rawSuggestions, setRawSuggestions] = useState<any[]>([]);
  
  const { getFontSize, fontLarge } = useAccessibility();
  const [newSchemeIds, setNewSchemeIds] = useState<string[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');

  
  //const t = appDictionary[appLang] || appDictionary.English;


  // Lifecycle Step 1: Run once on component mount to retrieve initial user profile parameters
  useEffect(() => {
    async function initializeSessionContext() {
      try {
        const raw = await AsyncStorage.getItem('loggedInUser');
        if (raw) {
          const user = JSON.parse(raw);
          
          const dynamicDisability = user.disabilityType || '';
          setDisabilityType(dynamicDisability);
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

  // Lifecycle Step 2: Executes every single time screen gains focus window view context
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

      const fetchSchemes = async () => {
        try {
          setLoading(true);
          
          const persistedGlobalLang = await AsyncStorage.getItem('appLanguagePreference');
          let activeLanguage = persistedGlobalLang || 'English';
          if (persistedGlobalLang && isMounted) {
            setAppLang(persistedGlobalLang as AppLanguage);
          }

          let currentUserPhone = '';
          const rawUser = await AsyncStorage.getItem('loggedInUser');
          if (rawUser && isMounted) {
            const user = JSON.parse(rawUser);
            setDisabilityType(user.disabilityType || '');
            if (user.language) {
              setAppLang(user.language as AppLanguage);
              activeLanguage = user.language;
            }
            currentUserPhone = user.phone || ''; 
            
            const userIsolatedKey = user.uid ? `saved_schemes_${user.uid}` : `saved_schemes_${user.phone}`;
            const rawSaved = await AsyncStorage.getItem(userIsolatedKey);
            if (rawSaved) {
              const parsedSaved = JSON.parse(rawSaved) as Scheme[];
              setSavedSchemeIds(parsedSaved.map(s => String(s.id || '')));
            } else {
              setSavedSchemeIds([]);
            }
          }

          const responseData = await getSchemes(activeLanguage, currentUserPhone); 

          if (!isMounted) return;

          const inboundSchemes = responseData?.schemes || [];
          const inboundSuggestions = responseData?.rawSuggestions || [];

          if (isMounted) {
            setUserPhoneState(currentUserPhone.split('.')[0].replace(/\D/g, '').trim());
            setRawSuggestions(inboundSuggestions);
          }

          if (!inboundSchemes || !inboundSchemes.length) {
            setErrorText('No schemes found.');
            setSchemes([]);
          } else {
            const mapped = inboundSchemes.map((s: any) => ({
              ...s,
              id: String(s.id).trim().toUpperCase(),
            }));
            setSchemes(mapped);
            setErrorText('');

            // Safe structured snapshot delivery call
            await processSessionComparison(mapped, currentUserPhone);
          }
        } catch (err) {
          console.error(" CRITICAL FETCH ERROR:", err);
          if (isMounted) {
            setErrorText('Could not load schemes.');
            setSchemes([]);
          }
        } finally {
          if (isMounted) setLoading(false);
        }
      };
      
      fetchSchemes();

      return () => {
        isMounted = false; 
      };
    }, [isInitialLoad]) 
  );

// ── 1. THE DISABILITY-ISOLATED SEARCH FILTER ──
const filteredSchemes = useMemo(() => {
  const safeSchemes = schemes || [];
  
  // Step A: First, filter the master list so ONLY the user's disability type is present
  const eligiblePool = safeSchemes.filter(scheme => 
    scheme && String(scheme.disabilityType).toLowerCase().trim() === String(disabilityType).toLowerCase().trim()
  );

  const cleanQuery = searchQuery.trim().toLowerCase();
  
  // Step B: If the search bar is empty, return the full eligible pool immediately
  if (!cleanQuery) return eligiblePool; 

  // Step C: If typing, search strictly WITHIN the eligible disability pool
  return eligiblePool.filter((scheme) => {
    const currentLangName = String(scheme.schemeName || '').toLowerCase();
    const englishName = String(scheme.englishSchemeName || '').toLowerCase();

    return (
      currentLangName.includes(cleanQuery) ||
      englishName.includes(cleanQuery)
    );
  });
}, [schemes, disabilityType, searchQuery]);

  // Performance Optimizer: Computes sub-filtered list matrix ranked dynamically
  const personalizedSchemes = useMemo(() => {
    const cleanUserPhone = userPhoneState.trim();

    // Pull directly from our calculated filtered pool (which defaults to all eligible items when search is blank)
    const sourceBucket = filteredSchemes || [];

    // Group suggested items to float them to the top of the view
    const suggestedBucket = sourceBucket.filter(scheme => {
      return rawSuggestions.some(sug => sug.phone === cleanUserPhone && sug.schemeId === scheme.id);
    });

    // Group standard items right underneath them
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




  const t = appDictionary[appLang] || appDictionary.English;

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
      {/* ── HEADER SYSTEM ── */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextContainer}>
          <Text 
            style={[styles.title, { fontSize: getFontSize(32), lineHeight: fontLarge ? getFontSize(38) : 38 }]} 
            accessibilityRole="header"
            includeFontPadding={!fontLarge}
          >
            {t.homeTitle}
          </Text>
          <Text 
            style={[styles.subtitle, { fontSize: getFontSize(16), lineHeight: fontLarge ? getFontSize(22) : 22 }]}
            includeFontPadding={!fontLarge}
          >
            {t.homeSubtitle} <Text style={[styles.disabilityHighlight, { fontSize: getFontSize(16) }]}>{disabilityType || 'you'}</Text>
          </Text>
        </View>

        <Pressable
          style={[styles.bellButton, newSchemesBanner.length > 0 && !bannerDismissed && styles.bellButtonActive]}
          accessibilityRole="button"
          accessibilityLabel={newSchemesBanner.length > 0 && !bannerDismissed ? "Notifications, new schemes available." : "Notifications, no new updates."}
          accessibilityHint="Double tap to review your notifications banner alerts."
          onPress={() => {
            if (newSchemesBanner.length > 0) {
              setBannerDismissed(prev => !prev); 
            } else {
              Alert.alert("Notifications", "You are completely caught up! No new schemes since your last session.");
            }
          }}>
          <Ionicons name="notifications" size={26} color={newSchemesBanner.length > 0 && !bannerDismissed ? "#ffffff" : "#1e293b"} />
          {newSchemesBanner.length > 0 && !bannerDismissed && (
            <View style={styles.notificationBadge}>
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
              accessibilityLabel="Dismiss new schemes announcement banner"
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
                accessibilityLabel="View details for newly added welfare options"
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
                  <Ionicons name="sparkles" size={14} color="#ffffff" />
                  <Text style={[styles.newSchemeChipText, { fontSize: getFontSize(13) }]}>
                    {scheme.schemeName}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── CARDS LOADING INDICATION BLOCK ── */}
      {loading ? (
        <View style={styles.centerContent} accessibilityLiveRegion="polite" aria-live="polite">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={[styles.statusText, { fontSize: getFontSize(16) }]}>Loading personalized options...</Text>
        </View>
      ) : null}

      {!loading && errorText ? <Text style={[styles.errorText, { fontSize: getFontSize(16) }]} accessibilityLiveRegion="assertive" aria-live="assertive">{errorText}</Text> : null}

      {/* ── CARD ROWS PRESENTATION GRID SYSTEM ── */}
      {!loading && !errorText && personalizedSchemes.length === 0 ? (
        <View style={styles.emptyContainerCard}>
          <Text style={styles.emptyIconText} aria-hidden={true}>🔍</Text>
          <Text style={[styles.emptyMainText, { fontSize: getFontSize(18) }]}>{t.emptyHomeMain}</Text>
          <Text style={[styles.emptySubText, { fontSize: getFontSize(14) }]}>{t.emptyHomeSub}</Text>
        </View>
      ) : null}

      {!loading && !errorText && personalizedSchemes.map((scheme) => {
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
              Alert.alert('Link Error', 'Cannot launch browser for this link.');
            }
          } catch {
            Alert.alert('Network Issue', 'Failed to open the link.');
          }
        };

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
            accessibilityLabel={`${isSuggested ? `NGO Recommended Option by ${operatorName}: ` : ""}${isNewlyAdded ? "Newly Added Scheme: " : ""}${scheme.schemeName}`}
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

            <View style={styles.cardHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                {isNewlyAdded && (
                  <View style={styles.newNotificationBadge}>
                    <Ionicons name="sparkles" size={12} color="#ffffff" />
                    <Text style={styles.newNotificationText}>NEW</Text>
                  </View>
                )}

                <Text style={[styles.schemeName, { fontSize: getFontSize(20) }]} textBreakStrategy="simple">
                  {scheme.schemeName}
                </Text>
              </View>

              <View style={[styles.tag, isGovt ? styles.govtTag : styles.csrTag]}>
                <Text style={[styles.tagText, { fontSize: getFontSize(12) }, isGovt ? styles.govtTagText : styles.csrTagText]}>
                  {isGovt ? 'Government' : 'CSR Welfare'}
                </Text>
              </View>
            </View>

            <Text style={[styles.summary, { fontSize: getFontSize(15) }]} numberOfLines={3} textBreakStrategy="simple">
              {scheme.summary}
            </Text>

            <TouchableOpacity style={styles.redirectWebButton} onPress={handleExternalRedirect}>
              <Text style={[styles.redirectWebButtonText, { fontSize: getFontSize(15) }]}>{t.applyButton}</Text>
            </TouchableOpacity>

            <View style={styles.cardFooter}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, paddingRight: 8 }}>
                <Ionicons name="business-outline" size={16} color="#64748b" />
                <Text style={[styles.issuingBodyText, { fontSize: getFontSize(14) }]} numberOfLines={1}>
                  {scheme.issuingBody}
                </Text>
              </View>
              
              <TouchableOpacity
                style={[styles.saveButton, isSaved && styles.savedButton]}
                onPress={(e) => { e.stopPropagation(); toggleSave(scheme); }}>
                <Ionicons
                  name={isSaved ? "bookmark" : "bookmark-outline"}
                  size={16}
                  color={isSaved ? "#ffffff" : "#2563eb"}
                />
                <Text style={[styles.saveButtonText, { fontSize: getFontSize(14) }, isSaved && styles.savedButtonText]}>
                  {isSaved ? t.savedButton : t.saveButton}
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
  container: { flexGrow: 1, backgroundColor: '#ffffff', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 26 },
  headerTextContainer: { flex: 1, paddingRight: 12 },
  title: { fontSize: 32, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 16, lineHeight: 22, color: '#64748b', fontWeight: '500' },
  disabilityHighlight: { color: '#2563eb', fontWeight: '700' },
  bellButton: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
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
  saveButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: '#2563eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#ffffff' },
  savedButton: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  saveButtonText: { fontSize: 14, fontWeight: '700' },
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


