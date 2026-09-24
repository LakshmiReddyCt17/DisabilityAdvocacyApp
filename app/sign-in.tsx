import { Ionicons } from '@expo/vector-icons'; // Vector icons library
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SignInScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    const rawPhone = phone.trim();
    const cleanPhoneDigits = rawPhone.replace(/\D/g, '').slice(-10);
    

    if (cleanPhoneDigits.length !== 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setLoading(true);

      const persistedGlobalLang = await AsyncStorage.getItem('appLanguagePreference');
      const fallbackLang = persistedGlobalLang || 'English';

      // 1. Fetch live user sheet records
      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbwQrpJuBbxob2il_yZwOcfG34jyBArDl7I4RYsfH4RKW7q4n7xtBzhQxLpRXdGZPDGPIQ/exec?action=getUsers',
        { method: 'GET', redirect: 'follow' }
      );

      let usersList = [];
      if (response.ok) {
        const rawData = await response.json();
        usersList = Array.isArray(rawData) ? rawData : (rawData.data || rawData.users || rawData.Users || []);
      }

      // 2. Resilient Phone Number Matching (compares last 10 digits)
      let matchedUser = null;
      if (Array.isArray(usersList) && usersList.length > 0) {
        matchedUser = usersList.find((u: any) => {
          if (!u || !u.phone) return false;
          const userPhoneDigits = String(u.phone).replace(/\D/g, '').slice(-10);
          return userPhoneDigits === cleanPhoneDigits;
        });
      }

      // 3. User Not Found Check
      if (!matchedUser) {
        Alert.alert(
          'Not Registered',
          'No account found with this mobile number. Please register first.',
          [
            { text: 'Register', onPress: () => router.push('/sign-up') },
            { text: 'Try Again', style: 'cancel' }
          ]
        );
        setLoading(false);
        return;
      }


      const resolvedLang = persistedGlobalLang || matchedUser.language || 'English';

      matchedUser = {
        ...matchedUser,
        phone: cleanPhoneDigits,
        language: resolvedLang,
        ngoId: matchedUser.ngoId || 'CENTRAL_POOL'
      };

      // 5. Restore user-specific bookmark states
      const lookupUid = matchedUser.uid || matchedUser.userId || `user_${cleanPhoneDigits}`;
      const primaryBackup = await AsyncStorage.getItem(`saved_schemes_${lookupUid}`);
      const fallbackBackup = await AsyncStorage.getItem(`saved_schemes_${cleanPhoneDigits}`);
      const resolvedBackupData = primaryBackup || fallbackBackup;

      if (resolvedBackupData) {
        await AsyncStorage.setItem('savedSchemes', resolvedBackupData);
      } else {
        await AsyncStorage.removeItem('savedSchemes');
      }

      // 6. Persist session
      await AsyncStorage.setItem('loggedInUser', JSON.stringify(matchedUser));
      await AsyncStorage.setItem('appLanguagePreference', resolvedLang);

      router.replace('/(tabs)');

    } catch (error) {
      console.error('Sign-in network error:', error);
      Alert.alert('Connection Error', 'Unable to reach the server. Please verify your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardWrapper}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.formContainer}>
          
          {/* Brand Vector Icon Canvas */}
          <View style={styles.iconContainer} aria-hidden={true}>
            <Ionicons name="people-circle-outline" size={80} color="#2563eb" />
          </View>
          
          <Text style={styles.loginMainTitle} accessibilityRole="header">
            Welcome Back
          </Text>
          



            <Text style={{ textAlign: 'center', fontSize: 16, color: '#64748b', marginTop: 8 }}>
              Sign in using your registered mobile number to access your dashboard.
            </Text>
          

          {/* Form Input Control Layouts */}
          <View style={styles.inputCardGroup}>
            <Text style={styles.fieldLabel} aria-hidden={true}>Mobile Number</Text>
            <TextInput
              style={styles.inputField}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter registered mobile number"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              autoComplete="tel"
              accessibilityLabel="Registered Mobile Contact Number"
              accessibilityHint="Type your ten digit mobile number associated with your applicant account registration profile."
            />
          </View>

          

          {/* Interactive Form Action Elements */}
          <TouchableOpacity
            style={styles.signInButton}
            onPress={handleSignIn}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={loading ? "Verifying user registration details" : "Sign In Safely"}
            accessibilityHint="Double tap to confirm your credentials and fetch your personalized welfare options panel."
          >
            {loading ? (
              <View accessibilityLiveRegion="assertive">
                <ActivityIndicator color="#ffffff" size="small" />
              </View>
            ) : (
              <Text style={styles.signInButtonText}>Sign In Safely</Text>
            )}
          </TouchableOpacity>

          {/* Navigation Links Routing to Registrations Workspace */}
          <View style={styles.navigationFooterRow}>
            <Text style={styles.footerPromptText}>New beneficiary applicant account?</Text>
            <TouchableOpacity 
              onPress={() => router.push('/sign-up')}
              accessibilityRole="link"
              accessibilityLabel="Register an account"
            >
              <Text style={styles.footerLinkText}>Register Account</Text>
            </TouchableOpacity>
          </View>

            {/* Backdoor portal access entry points linked directly within descriptions */}
            <TouchableOpacity 
            activeOpacity={1} 
            onPress={() => router.push('/admin')}
            >
            <View>
             <Text style={{ textAlign: 'center', fontSize: 16, marginTop: 8 ,color: '#2563eb', 
    textDecorationLine: 'underline', 
    textDecorationColor: '#2563eb',}}>
              NGO Staff-Tap here for admin access
            </Text>
            </View>
            </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardWrapper: { flex: 1, backgroundColor: '#ffffff' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  formContainer: { alignItems: 'center', width: '100%' },
  iconContainer: { marginBottom: 12, justifyContent: 'center', alignItems: 'center' }, 
  loginMainTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5, marginBottom: 6, textAlign: 'center' },
  inputCardGroup: { width: '100%', backgroundColor: '#f8fafc', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  inputField: { backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, minHeight: 50, paddingHorizontal: 16, fontSize: 16, color: '#0f172a' },
  signInButton: { width: '100%', backgroundColor: '#2563eb', borderRadius: 14, minHeight: 52, justifyContent: 'center', alignItems: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  signInButtonText: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
  navigationFooterRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 24 },
  footerPromptText: { fontSize: 15, color: '#64748b' },
  footerLinkText: { fontSize: 15, color: '#2563eb', fontWeight: '700' },
});