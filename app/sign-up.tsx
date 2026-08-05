// sign-up.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { registerUser } from '../lib/googleSheets';

// Typing definition for custom single-select dropdown components
type DropdownFieldProps = {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  placeholder: string;
};

// Reusable custom Dropdown component utilizing a standard native slide-up/fade Modal layout
function DropdownField({ label, value, options, onSelect, placeholder }: DropdownFieldProps) {
  const [open, setOpen] = useState(false);
  const selectedValue = value || placeholder;

  return (
    <View style={styles.fieldGroup}>
      {label ? <Text style={styles.label} aria-hidden={true}>{label}</Text> : null}
      <Pressable
        style={[styles.inputLike, open && styles.inputFocused]} 
        onPress={() => setOpen(true)}
        accessibilityRole="combobox"
        accessibilityLabel={label ? `${label}: ${selectedValue}` : selectedValue}
        accessibilityHint="Double tap to open a selection modal menu list."
        accessibilityState={{ expanded: open }}
      >
        <Text style={[styles.inputText, !value && styles.placeholder]}>{selectedValue}</Text>
        <Ionicons name="chevron-down-outline" size={18} color="#64748b" style={styles.rightIcon} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.modalCard} accessibilityViewIsModal={true}>
            {label ? <Text style={styles.modalTitle} accessibilityRole="header">{label}</Text> : null}
            <ScrollView>
              {options.map((option) => (
                <Pressable
                  key={option}
                  style={styles.optionButton}
                  onPress={() => {
                    onSelect(option);
                    setOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={option}
                  accessibilityState={{ selected: value === option }}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function SignUpScreen() {
  const router = useRouter();
  
  // Input fields hook states
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [disabilityType, setDisabilityType] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  
  // Computed property combining separate Day/Month/Year dropdown states into standard string dates
  const dateOfBirth = dobDay && dobMonth && dobYear ? `${dobDay}/${dobMonth}/${dobYear}` : '';

  const [state, setState] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [uid, setUid] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Access mode control distinguishing standalone users from assisted NGO registrations
  const [userMode, setUserMode] = useState<'individual' | 'operator'>('individual');
  const [operatorId, setOperatorId] = useState('');

  // UI hook tracking active input field focusses to apply dynamic outline borders
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Validation Utility: RegEx checking standard 10-digit Indian mobile patterns
  function validatePhone(phone: string): boolean {
    const cleaned = phone.trim();
    return /^[6-9]\d{9}$/.test(cleaned);
  }

  // Registration Execution Workflow
  const handleRegister = async () => {
    const cleanedPhone = phoneNumber.trim();

    // 1. Core input parameter validation gates
    if (!validatePhone(cleanedPhone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    if (!fullName || !disabilityType || !dateOfBirth || !state || !preferredLanguage || !dobDay) {
      Alert.alert('Missing Fields', 'Please fill in all required fields before registering.');
      return;
    }

    if (userMode === 'operator' && !operatorId.trim()) {
      Alert.alert('Missing Operator ID', 'Please provide an official NGO Staff/Volunteer reference ID.');
      return;
    }

    setLoading(true);
    try {
      // 2. Compute regional administrative identifiers based on active onboarding modes
      const computedNgoId = userMode === 'operator' ? operatorId.trim() : 'CENTRAL_POOL';
      const computedRegisteredBy = userMode === 'operator' ? `Staff_${operatorId.trim()}` : 'Self';

      // 3. Asynchronous server dispatch submitting profile payload to Google Sheets script
      await registerUser({
        name: fullName,
        phone: cleanedPhone,
        email: email || '',         
        disabilityType,
        dob: dateOfBirth,
        state,
        language: preferredLanguage,
        uid: uid.trim() || 'PENDING_REGISTRATION',
        onboardingType: userMode,
        registeredBy: computedRegisteredBy,
        ngoId: computedNgoId
      });

      const generatedUserId = `usr-${cleanedPhone}`;

      // 4. Success committal handling local cache setup and forwarding user to app dashboard
      Alert.alert('Success', 'Registration complete!', [
        { text: 'Continue', onPress: async () => {
          await AsyncStorage.setItem('loggedInUser', JSON.stringify({
            userId: generatedUserId,
            name: fullName,
            phone: cleanedPhone,
            email: email || '',
            disabilityType,
            dob: dateOfBirth,
            state,
            language: preferredLanguage,
            uid,
            onboardingType: userMode,
            ngoId: computedNgoId
          }));
          router.replace('/(tabs)');
        }}
      ]);
    } catch (error) {
      Alert.alert('Error', 'Could not save your details. Please check your connection and try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.screenTitle} accessibilityRole="header">
        Sign Up
      </Text>

      {/* Account Type Layout Selection Tabs */}
      <View style={styles.toggleContainerTabGroup} accessibilityRole="tablist">
        <TouchableOpacity
          style={[styles.toggleTab, userMode === 'individual' && styles.activeToggleTab]}
          onPress={() => setUserMode('individual')}
          accessibilityRole="tab"
          accessibilityLabel="Individual Mode Account Creation Type"
          accessibilityState={{ selected: userMode === 'individual' }}
        >
          <View style={styles.tabContent}>
            <Ionicons name="person-outline" size={16} color={userMode === 'individual' ? '#2563eb' : '#4b5563'} />
            <Text style={[styles.toggleTabText, userMode === 'individual' && styles.activeToggleTabText]}>
              Individual
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleTab, userMode === 'operator' && styles.activeToggleTab]}
          onPress={() => setUserMode('operator')}
          accessibilityRole="tab"
          accessibilityLabel="NGO Operator Mode Registry Account Creation Type"
          accessibilityState={{ selected: userMode === 'operator' }}
        >
          <View style={styles.tabContent}>
            <Ionicons name="business-outline" size={16} color={userMode === 'operator' ? '#2563eb' : '#4b5563'} />
            <Text style={[styles.toggleTabText, userMode === 'operator' && styles.activeToggleTabText]}>
              NGO Operator
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Displayed exclusively when on-boarding via assisted operator modes */}
      {userMode === 'operator' && (
        <View style={styles.fieldGroup}>
          <Text style={styles.label} aria-hidden={true}>Official NGO ID</Text>
          <TextInput
            style={[styles.inputLike, focusedField === 'operatorId' && styles.inputFocused]}
            onFocus={() => setFocusedField('operatorId')}
            onBlur={() => setFocusedField(null)}
            value={operatorId}
            onChangeText={setOperatorId}
            placeholder="Enter NGO Id"
            placeholderTextColor="#94a3b8"
            accessibilityLabel="Official NGO Operator ID Input Field"
            accessibilityHint="Type your authorized staff operational alphanumeric registry key."
          />
        </View>
      )}
    {/*NAME*/} 
      <View style={styles.fieldGroup}>
        <Text style={styles.label} aria-hidden={true}>Full Name *</Text>
        <TextInput
          style={[styles.inputLike, focusedField === 'fullName' && styles.inputFocused]}
          onFocus={() => setFocusedField('fullName')}
          onBlur={() => setFocusedField(null)}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name"
          placeholderTextColor="#94a3b8"
          accessibilityLabel="Full Applicant Name Input Field"
          accessibilityHint="Type your full legal name as formatted on your paperwork."
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label} aria-hidden={true}>Phone Number *</Text>
        <TextInput
          style={[styles.inputLike, focusedField === 'phone' && styles.inputFocused]}
          onFocus={() => setFocusedField('phone')}
          onBlur={() => setFocusedField(null)}
          value={phoneNumber}
          // Sanitize inline user keyboard inputs to ensure strictly 10 clean digital integers
          onChangeText={(text) => {
            const digits = text.replace(/[^0-9]/g, '').slice(0, 10);
            setPhoneNumber(digits);
          }}
          placeholder="10-digit mobile number"
          placeholderTextColor="#94a3b8"
          keyboardType="phone-pad"
          maxLength={10}
          accessibilityLabel="Phone Number Input Field"
          accessibilityHint="Type your ten-digit active mobile contact number."
        />
        {phoneNumber.length > 0 && !validatePhone(phoneNumber) && (
          <Text style={styles.validationError} accessibilityLiveRegion="assertive">
            Please enter a valid 10-digit Indian mobile number
          </Text>
        )}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label} aria-hidden={true}>
          Email <Text style={styles.optionalTag}>(Optional)</Text>
        </Text>
        <TextInput
          style={[styles.inputLike, focusedField === 'email' && styles.inputFocused]}
          onFocus={() => setFocusedField('email')}
          onBlur={() => setFocusedField(null)}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email if available"
          placeholderTextColor="#94a3b8"
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel="Email Address Input Field, Optional Entry."
        />
      </View>

      <DropdownField
        label="Disability Type *"
        value={disabilityType}
        onSelect={setDisabilityType}
        placeholder="Select disability type"
        options={[
          'Locomotor Disability',
          'Visual Impairment',
          'Hearing Impairment',
          'Intellectual Disability',
          'Autism Spectrum Disorder',
          'Multiple Disabilities',
        ]}
      />

      {/* Date Of Birth Section combining three distinct dropdown selection columns */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label} accessibilityRole="header">Date of Birth *</Text>
        <View style={styles.dobRow}>
          <View style={styles.dobDayCol}>
            <DropdownField
              label="Birth Day Select"
              value={dobDay}
              onSelect={setDobDay}
              placeholder="Day"
              options={Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))}
            />
          </View>
          <View style={styles.dobMonthCol}>
            <DropdownField
              label="Birth Month Select"
              value={dobMonth}
              onSelect={setDobMonth}
              placeholder="Month"
              options={[
                '01 - Jan', '02 - Feb', '03 - Mar',
                '04 - Apr', '05 - May', '06 - Jun',
                '07 - Jul', '08 - Aug', '09 - Sep',
                '10 - Oct', '11 - Nov', '12 - Dec',
              ]}
            />
          </View>
          <View style={styles.dobYearCol}>
            <DropdownField
              label="Birth Year Select"
              value={dobYear}
              onSelect={setDobYear}
              placeholder="Year"
              options={Array.from(
                { length: new Date().getFullYear() - 1900 + 1 },
                (_, i) => String(new Date().getFullYear() - i)
              )}
            />
          </View>
        </View>
        {dateOfBirth ? (
          <View style={styles.dobPreviewRow}>
            <Ionicons name="calendar-outline" size={14} color="#2563eb" style={{ marginRight: 4 }} />
            <Text style={styles.dobPreview} accessibilityLabel={`Selected Date of Birth Summary: ${dateOfBirth}`}>{dateOfBirth}</Text>
          </View>
        ) : null}
      </View>

      <DropdownField
        label="State *"
        value={state}
        onSelect={setState}
        placeholder="Select your state"
        options={[
          'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
          'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
          'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
          'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
          'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
          'Uttarakhand', 'West Bengal'
        ]}
      />

      <DropdownField
        label="Preferred Language *"
        value={preferredLanguage}
        onSelect={setPreferredLanguage}
        placeholder="Select preferred language"
        options={['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Kannada']}
      />


      <View style={styles.fieldGroup}>
        <Text style={styles.label} aria-hidden={true}>Unique Disability ID (UID) *</Text>
        <TextInput
          style={[styles.inputLike, focusedField === 'uid' && styles.inputFocused]}
          onFocus={() => setFocusedField('uid')}
          onBlur={() => setFocusedField(null)}
          value={uid}
          onChangeText={setUid}
          placeholder="Enter your UID"
          placeholderTextColor="#6b7280"
          accessibilityLabel="Unique Disability ID Input Field"
          accessibilityHint="Type out your twelve character official government registration alphanumeric token code pattern."
        />
        <TouchableOpacity
          accessibilityRole="link"
          accessibilityLabel="Don't have a Unique Disability ID? Click here to find the nearest assessment hospitals."
          onPress={() => router.push('/uid-discovery')}
          style={styles.linkContainer}
        >
          <Ionicons name="help-circle-outline" size={16} color="#1d4ed8" style={{ marginRight: 4, marginTop: 10 }} />
          <Text style={styles.linkText}>Don't have a UID? Find nearest hospitals issuing UID/UDID</Text>
        </TouchableOpacity>
      </View>

      {/* Main Submission Interactive Target */}
      <TouchableOpacity
        style={[styles.registerButton, loading && styles.registerButtonDisabled]}
        accessibilityRole="button"
        accessibilityLabel={loading ? "Registering account profile data entries" : "Register Profile"}
        accessibilityHint="Double tap to execute submission parsing and launch your personalized profile platform layer."
        onPress={handleRegister}
        disabled={loading}>
        {loading
          ? <View accessibilityLiveRegion="assertive"><ActivityIndicator color="#ffffff" size="small" /></View>
          : <Text style={styles.registerButtonText}>Register</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

// Global Attribute Stylesheet Specifications Map
const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40, backgroundColor: '#ffffff' },
  screenTitle: { fontSize: 34, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5, marginBottom: 20 },
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 8 },
  optionalTag: { fontSize: 13, fontWeight: '400', color: '#64748b' },
  
  inputLike: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5, 
    borderColor: '#cbd5e1', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: '#f8fafc', 
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1
  },
  inputFocused: {
    borderColor: '#2563eb', 
    backgroundColor: '#ffffff',
    shadowColor: '#2563eb',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  inputText: { fontSize: 16, color: '#0f172a', flex: 1 },
  placeholder: { color: '#94a3b8' },
  rightIcon: { marginLeft: 8 },
  validationError: { marginTop: 6, fontSize: 14, color: '#dc2626', fontWeight: '500' },
  
  linkContainer: { flexDirection: 'row', alignItems: 'center' },
  linkText: { marginTop: 8, fontSize: 15, color: '#1d4ed8', fontWeight: '600', textDecorationLine: 'underline' },
  registerButton: { marginTop: 14, backgroundColor: '#2563eb', borderRadius: 12, minHeight: 52, justifyContent: 'center', alignItems: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  registerButtonDisabled: { backgroundColor: '#93c5fd' },
  registerButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.3)', justifyContent: 'center', paddingHorizontal: 20 },
  modalCard: { backgroundColor: '#ffffff', borderRadius: 16, paddingVertical: 16, maxHeight: '70%', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  optionButton: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  optionText: { fontSize: 17, color: '#334155', fontWeight: '500' },
  
  toggleContainerTabGroup: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 24, width: '100%' },
  toggleTab: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  activeToggleTab: { backgroundColor: '#ffffff', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  tabContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleTabText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  activeToggleTabText: { color: '#2563eb', fontWeight: '700' },
  
  dobRow: { flexDirection: 'row', gap: 8 },
  dobDayCol: { flex: 1.1 },
  dobMonthCol: { flex: 2 },
  dobYearCol: { flex: 1.5 },
  dobPreviewRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  dobPreview: { fontSize: 14, color: '#2563eb', fontWeight: '600' }
});