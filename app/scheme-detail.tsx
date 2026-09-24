import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAccessibility } from '../context/AccessibilityContext';
import { appDictionary, AppLanguage } from '../lib/appTranslations';
import { trackAnalytics } from '../lib/googleSheets';

const detailLabels = {
  English: { summaryHead: "Summary", eligibilityHead: "Eligibility Criteria", applyHead: "How to Apply", unsaveText: "Unsave Scheme", saveText: "Bookmark for Later" },
  Hindi: { summaryHead: "विवरण", eligibilityHead: "पात्रता मापदंड", applyHead: "आवेदन कैसे करें", unsaveText: "योजना हटाएं", saveText: "बाद के लिए सहेजें" },
  Kannada: { summaryHead: "ಸಾರಾಂಶ", eligibilityHead: "ಅರ್ಹತೆಯ ಮಾನದಂಡಗಳು", applyHead: "ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ವಿಧಾನ", unsaveText: "ಯೋಜನೆಯನ್ನು ತೆಗೆದುಹಾಕಿ", saveText: "ನಂತರ ಉಳಿಸಿ" },
  Telugu: { summaryHead: "సారాंशం", eligibilityHead: "అర్హత నిబంధనలు", applyHead: "దరఖాస్తు విధానం", unsaveText: "పథకం తీసివేయి", saveText: "తర్వాత కోసం సేవ్ చేయि" },
  Tamil: { summaryHead: "சுருக்கம்", eligibilityHead: "தகுதி வரம்புகள்", applyHead: "விண்ணப்பிக்கும் முறை", unsaveText: "திட்டத்தை அகற்று", saveText: "பினregister சேமி" },
  Bengali: { summaryHead: "সারসংক্ষেপ", eligibilityHead: "যোগ্যতার মানদণ্ড", applyHead: "কিভাবে আবেদন করতে হবে", unsaveText: "স্কিম মুছুন", saveText: "পরের জন্য সংরক্ষণ করুন" },
  Marathi: { summaryHead: "सारांश", eligibilityHead: "पात्रता निकष", applyHead: "अर्ज कसा करावा", unsaveText: "योजना काढून टाका", saveText: "नंतरसाठी जतन करा" }
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

export default function SchemeDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { getFontSize } = useAccessibility();

  const [appLang, setAppLang] = useState<AppLanguage>('English');
  const [allSavedSchemes, setAllSavedSchemes] = useState<any[]>([]);
  const [isCurrentlySaved, setIsCurrentlySaved] = useState(false);
  const [disabilityType, setDisabilityType] = useState('');
  const [hasApplied, setHasApplied] = useState(false);

  const schemeId = String(params.id || params.schemeId || '');
  const schemeName = String(params.schemeName || '');
  
  const englishSchemeName = params.englishSchemeName && String(params.englishSchemeName).trim() !== ''
    ? String(params.englishSchemeName).trim()
    : schemeName; 

  //console.log('Tracking English identification string safely:', englishSchemeName);
  const issuingBody = String(params.issuingBody || '');
  const summary = String(params.summary || '');
  const eligibility = String(params.eligibility || '');
  const howToApply = String(params.howToApply || '');
  const applicationUrl = String(params.applicationUrl || 'https://www.swavlambancard.gov.in/');
  const fromSavedFlag = String(params.fromSaved || 'false');
  const isSuggested = String(params.isSuggested || '').toLowerCase() === 'true' || String(params.isSuggested || '').toLowerCase() === 'yes';
  const translatedOperatorNotes = params.translatedOperatorNotes && String(params.translatedOperatorNotes) !== 'undefined'
  ? String(params.translatedOperatorNotes).trim()
  : '';
    //const englishSchemeName = String(params.englishSchemeName || params.schemeName || '');

  useEffect(() => {
    async function initializeScreenData() {
      try {
        const rawUser = await AsyncStorage.getItem('loggedInUser');
        if (rawUser) {
          const user = JSON.parse(rawUser);
          if (user.language) setAppLang(user.language as AppLanguage);
          setDisabilityType(user.disabilityType || '');
        }

        const rawSaved = await AsyncStorage.getItem('savedSchemes');
        if (rawSaved) {
          const parsedSaved = JSON.parse(rawSaved) as any[];
          setAllSavedSchemes(parsedSaved);
          if (fromSavedFlag === 'true' || parsedSaved.some(s => String(s.id) === schemeId || String(s.schemeName) === schemeName)) {
            setIsCurrentlySaved(true);
          }
        }

        const appliedRaw = await AsyncStorage.getItem(`applied_${schemeId}`);
        if (appliedRaw === 'true') setHasApplied(true);

      } catch (err) {
        console.error("Sync error:", err);
      }
    }
    initializeScreenData();

    // Tracks analytics using the unique schemeId (S1, S2) 
    async function trackViewedOnce() {
      try {
        if (!schemeId) return;
        const sessionKey = `session_viewed_${schemeId}`;
        const alreadyViewed = await AsyncStorage.getItem(sessionKey);
        if (!alreadyViewed) {
          // englishSchemeName as the second parameter
      trackAnalytics(schemeId, englishSchemeName, disabilityType, 'viewed');
          await AsyncStorage.setItem(sessionKey, 'true');
        }
      } catch {
        // silent fail
      }
    }
    trackViewedOnce();
  }, [schemeId, schemeName, fromSavedFlag, disabilityType]);

  const handleToggleBookmarkAction = async () => {
    try {
      let updatedSchemes = [];
      if (isCurrentlySaved) {
        updatedSchemes = allSavedSchemes.filter(s => String(s.id) !== schemeId && String(s.schemeName) !== schemeName);
        setIsCurrentlySaved(false);
        Alert.alert('Removed', 'This scheme has been removed from your saved list.');
      } else {
        const targetId = schemeId || `${schemeName}-${allSavedSchemes.length}`;
        const newSchemeEntry = { id: targetId, schemeName, issuingBody, summary, eligibility, howToApply, applicationUrl, englishSchemeName };
        updatedSchemes = [...allSavedSchemes, newSchemeEntry];
        setIsCurrentlySaved(true);
        Alert.alert('Saved', 'Scheme bookmarked to your saved list.');

        //Tracks bookmark using the static unique schemeId column reference key
        if (schemeId) {
          trackAnalytics(schemeId, englishSchemeName, disabilityType, 'saved');
        }
      }
      setAllSavedSchemes(updatedSchemes);
      await AsyncStorage.setItem('savedSchemes', JSON.stringify(updatedSchemes));
    } catch (err) {
      Alert.alert('Storage Error', 'Failed to update bookmark.');
    }
  };

  const handleBrowserLaunchRedirect = async () => {
    // Tracks clicks using the structural schemeId database anchor
    if (schemeId) {
      trackAnalytics(schemeId, englishSchemeName, disabilityType, 'apply_clicked');
    }
    try {
      const supported = await Linking.canOpenURL(applicationUrl);
      if (supported) {
        await Linking.openURL(applicationUrl);
      } else {
        Alert.alert('Link Error', 'Cannot process web redirection.');
      }
    } catch {
      Alert.alert('Network Error', 'Failed to connect to portal.');
    }
  };

  const handleIApplied = async () => {
    // racks submission using the structural schemeId index
    if (schemeId) {
        trackAnalytics(schemeId, englishSchemeName, disabilityType, 'i_applied');
    }
    await AsyncStorage.setItem(`applied_${schemeId}`, 'true');
    setHasApplied(true);
    Alert.alert(
      'Great!',
      'Your application has been noted. The NGO may follow up with you if needed.',
      [{ text: 'OK' }]
    );
  };

  const handleShare = async () => {
    if (schemeId) {
    trackAnalytics(schemeId, englishSchemeName, disabilityType, 'shared');
    }
    try {
      const freeMsg = tGlobal.shareMessage || "This scheme is FREE to apply";
      await Share.share({
        message:
          `📋 *${schemeName}*\n` +
          `🏢 ${issuingBody}\n\n` +
          `📝 ${summary}\n\n` +
          `✅ ${freeMsg}\n\n` +
          `🔗 ${applicationUrl}`,
      });
    } catch {
      Alert.alert('Share Error', 'Could not share this scheme.');
    }
  };

  const tGlobal = appDictionary[appLang] || appDictionary.English;
  const tDetail = detailLabels[appLang] || detailLabels.English;

  return (
    <View style={styles.viewRootWrapper}>
      <View style={styles.topNavigationHeaderRow}>
        <TouchableOpacity
          style={styles.backButtonHitZone}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={[styles.headerBarTextLabel, { fontSize: getFontSize(18) }]} numberOfLines={1} accessibilityRole="header">
          {tGlobal.schemeDetailRootTitle}
        </Text>
        <TouchableOpacity
          style={styles.backButtonHitZone}
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Share scheme">
          <Ionicons name="share-social-outline" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollViewOuter} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.mainSchemeTitleName, { fontSize: getFontSize(24) }]}>
          {schemeName}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Ionicons name="business-outline" size={16} color="#64748b" />
          <Text style={[styles.metaIssuingBodyLabelText, { fontSize: getFontSize(15) }]}>
            {issuingBody}
          </Text>
        </View>

        {isSuggested && (
              <View style={styles.suggestionBannerContainer}> 
                <View style={styles.suggestionBadgeRow}>
                  <Ionicons name="shield-checkmark" size={16} color="#be185d" />
                  <Text style={[styles.suggestionBadgeText, { fontSize: getFontSize(13) }]}>
                    {tGlobal.ngoSuggested} 
                  </Text>
                </View>
                
                {translatedOperatorNotes ? (
                  <Text style={[styles.suggestionNotesText, { fontSize: getFontSize(14) }]}>
                    Note: "{translatedOperatorNotes}"
                  </Text>
                ) : null}
              </View>
            )}

        <View style={styles.contentSectionBlockCard}>
          <Text style={[styles.sectionHeadingTitle, { fontSize: getFontSize(16) }]}>{tDetail.summaryHead}</Text>
          <Text style={[styles.bodyDescriptionParaParagraphText, { fontSize: getFontSize(16) }]}>{summary}</Text>
        </View>

        <View style={styles.contentSectionBlockCard}>
          <Text style={[styles.sectionHeadingTitle, { fontSize: getFontSize(16) }]}>{tDetail.eligibilityHead}</Text>
          <Text style={[styles.bodyDescriptionParaParagraphText, { fontSize: getFontSize(16) }]}>{eligibility}</Text>
        </View>

        <View style={styles.contentSectionBlockCard}>
          <Text style={[styles.sectionHeadingTitle, { fontSize: getFontSize(16) }]}>{tDetail.applyHead}</Text>
          <Text style={[styles.bodyDescriptionParaParagraphText, { fontSize: getFontSize(16) }]}>{howToApply}</Text>
        </View>
      </ScrollView>

      <View style={styles.fixedBottomActionControlBarTray}>
        <TouchableOpacity
          style={styles.primaryActionButtonCallToActionCTA}
          onPress={handleBrowserLaunchRedirect}
          accessibilityRole="link">
          <Text style={[styles.primaryActionCTAFontLabel, { fontSize: getFontSize(16) }]}>{tGlobal.applyButton}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iAppliedButton, hasApplied && styles.iAppliedButtonDone]}
          onPress={hasApplied ? undefined : handleIApplied}
          accessibilityRole="button"
          disabled={hasApplied}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Ionicons 
              name={hasApplied ? "checkmark-circle" : "checkmark-circle-outline"} 
              size={18} 
              color="#000000" 
            />
            <Text style={[styles.iAppliedButtonText, { fontSize: getFontSize(15), color: '#000000' }]}>
              {hasApplied ? tGlobal.applicationDone : (tGlobal.iAppliedButton || 'I Applied for this Scheme')}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.bottomRowTwoButtons}>
          <TouchableOpacity
            style={[styles.secondaryBorderButton, isCurrentlySaved && styles.secondaryBorderButtonActive]}
            onPress={handleToggleBookmarkAction}
            accessibilityRole="button">
            <Ionicons
              name={isCurrentlySaved ? "bookmark" : "bookmark-outline"}
              size={20}
              color={isCurrentlySaved ? "#ffffff" : "#2563eb"}
            />
            <Text style={[styles.secondaryBorderButtonText, { fontSize: getFontSize(15) }, isCurrentlySaved && styles.secondaryBorderButtonTextActive]}>
              {isCurrentlySaved ? tDetail.unsaveText : tDetail.saveText}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            accessibilityRole="button">
            <Ionicons name="share-social-outline" size={20} color="#ffffff" />
            <Text style={[styles.shareButtonText, { fontSize: getFontSize(15) }]}>{tGlobal.shareButton}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewRootWrapper: { flex: 1, backgroundColor: '#ffffff' },
  topNavigationHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#ffffff' },
  backButtonHitZone: { padding: 8, borderRadius: 10, backgroundColor: '#f8fafc' },
  headerBarTextLabel: { fontSize: 18, fontWeight: '700', color: '#0f172a', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  scrollViewOuter: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 20, paddingBottom: 30 },
  mainSchemeTitleName: { fontSize: 24, fontWeight: '800', color: '#0f172a', lineHeight: 32, marginBottom: 8 },
  metaIssuingBodyLabelText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  freeBadgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 10, padding: 12, marginBottom: 16 },
  freeBadgeText: { fontSize: 14, fontWeight: '600', color: '#16a34a', flex: 1 },
  contentSectionBlockCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionHeadingTitle: { fontSize: 16, fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  bodyDescriptionParaParagraphText: { fontSize: 16, lineHeight: 24, color: '#334155' },
  fixedBottomActionControlBarTray: { padding: 16, paddingBottom: 36, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 10 },
  primaryActionButtonCallToActionCTA: { backgroundColor: '#2563eb', borderRadius: 14, minHeight: 52, justifyContent: 'center', alignItems: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  primaryActionCTAFontLabel: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  iAppliedButton: { backgroundColor: '#f0fdf4', borderWidth: 2, borderColor: '#16a34a', borderRadius: 14, minHeight: 52, justifyContent: 'center', alignItems: 'center' },
  iAppliedButtonDone: { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' },
  iAppliedButtonText: { color: '#16a34a', fontSize: 15, fontWeight: '700' },
  bottomRowTwoButtons: { flexDirection: 'row', gap: 10 },
  secondaryBorderButton: { flex: 1, flexDirection: 'row', borderWidth: 2, borderColor: '#2563eb', backgroundColor: '#ffffff', borderRadius: 14, minHeight: 52, justifyContent: 'center', alignItems: 'center', gap: 8 },
  secondaryBorderButtonActive: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  secondaryBorderButtonText: { color: '#2563eb', fontSize: 15, fontWeight: '700' },
  secondaryBorderButtonTextActive: { color: '#ffffff' },
  shareButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16a34a', borderRadius: 14, minHeight: 52, paddingHorizontal: 20, gap: 8 },
  shareButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  suggestionBannerContainer: { backgroundColor: '#fce7f3', borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#fbcfe8' },
  suggestionBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  suggestionBadgeText: { color: '#be185d', fontWeight: '800', letterSpacing: 0.3 },
  suggestionNotesText: { color: '#475569', fontWeight: '500', fontStyle: 'italic', paddingLeft: 2 },
});