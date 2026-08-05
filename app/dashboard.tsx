import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getSchemes } from '../lib/googleSheets';

type Scheme = {
  id: string;
  schemeName: string;
  issuingBody: string;
  disabilityType: string;
  summary: string;
  eligibility: string;
  howToApply: string;
};

const CURRENT_USER_DISABILITY_TYPE = 'Visual Impairment';

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [savedSchemeIds, setSavedSchemeIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        setLoading(true);
        const data = await getSchemes();
        if (!data.length) {
          setErrorText('No schemes found. Add data to your Schemes sheet.');
        } else {
          setSchemes(data.map((s, idx) => ({ id: `${s.schemeName}-${idx}`, ...s })));
          setErrorText('');
        }
      } catch {
        setErrorText('Could not load schemes. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    void fetchSchemes();
  }, []);

  const personalizedSchemes = useMemo(
    () =>
      schemes.filter(
        (scheme) =>
          scheme.disabilityType.toLowerCase().trim() ===
          CURRENT_USER_DISABILITY_TYPE.toLowerCase().trim()
      ),
    [schemes]
  );

  const toggleSave = async (scheme: Scheme) => {
    const isSaved = savedSchemeIds.includes(scheme.id);
    const updated = isSaved
      ? savedSchemeIds.filter((id) => id !== scheme.id)
      : [...savedSchemeIds, scheme.id];
  
    setSavedSchemeIds(updated);
  
    const savedSchemes = schemes.filter((s) => updated.includes(s.id));
    await AsyncStorage.setItem('savedSchemes', JSON.stringify(savedSchemes));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title} accessibilityRole="header">
            Home Dashboard
          </Text>
          <Text style={styles.subtitle}>
            Schemes personalized for {CURRENT_USER_DISABILITY_TYPE}
          </Text>
        </View>
        <Pressable
          style={styles.bellButton}
          accessibilityRole="button"
          accessibilityLabel="Notifications">
          <Ionicons name="notifications-outline" size={30} color="#111827" />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.statusText}>Loading schemes...</Text>
        </View>
      ) : null}

      {!loading && errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

      {!loading && !errorText && personalizedSchemes.length === 0 ? (
        <Text style={styles.statusText}>
          No schemes found for your disability type yet. Please check again later.
        </Text>
      ) : null}

      {!loading &&
        !errorText &&
        personalizedSchemes.map((scheme) => {
          const isSaved = savedSchemeIds.includes(scheme.id);
          const isGovt = scheme.issuingBody.toLowerCase().includes('govt');
          const issuerTag = isGovt ? 'Govt' : 'CSR';

          return (
            <Pressable
              key={scheme.id}
              style={styles.card}
              accessibilityRole="button"
              accessibilityLabel={`Open details for ${scheme.schemeName}`}
              onPress={() =>
                router.push({
                  pathname: '/scheme-detail',
                  params: {
                    schemeName: scheme.schemeName,
                    issuingBody: scheme.issuingBody,
                    summary: scheme.summary,
                    eligibility: scheme.eligibility,
                    howToApply: scheme.howToApply,
                  },
                })
              }>
              <Text style={styles.schemeName}>{scheme.schemeName}</Text>

              <View style={[styles.tag, isGovt ? styles.govtTag : styles.csrTag]}>
                <Text style={styles.tagText}>{issuerTag}</Text>
              </View>

              <Text style={styles.summary}>{scheme.summary}</Text>

              <TouchableOpacity
                style={[styles.saveButton, isSaved && styles.savedButton]}
                accessibilityRole="button"
                accessibilityLabel={`${isSaved ? 'Unsave' : 'Save'} ${scheme.schemeName}`}
                onPress={(event) => {
                  event.stopPropagation();
                  toggleSave(scheme);
                }}>
                <Text style={styles.saveButtonText}>{isSaved ? 'Saved ✓' : 'Save'}</Text>
              </TouchableOpacity>
            </Pressable>
          );
        })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 34,
    backgroundColor: '#ffffff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    color: '#374151',
    maxWidth: '88%',
  },
  bellButton: {
    padding: 4,
    borderRadius: 999,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 26,
  },
  statusText: {
    fontSize: 18,
    lineHeight: 26,
    color: '#374151',
    marginTop: 10,
  },
  errorText: {
    fontSize: 18,
    lineHeight: 26,
    color: '#b91c1c',
    marginBottom: 12,
  },
  card: {
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    padding: 14,
    marginBottom: 14,
  },
  schemeName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  tag: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 10,
  },
  govtTag: {
    backgroundColor: '#dbeafe',
  },
  csrTag: {
    backgroundColor: '#dcfce7',
  },
  tagText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  summary: {
    fontSize: 18,
    lineHeight: 27,
    color: '#1f2937',
    marginBottom: 12,
  },
  saveButton: {
    minHeight: 50,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedButton: {
    backgroundColor: '#1d4ed8',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
});