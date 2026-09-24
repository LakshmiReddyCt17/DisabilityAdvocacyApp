import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { addSchemes, getSchemes, getUserByPhone, registerNewNgoOrganization, submitSchemeSuggestion, verifyNgoAdmin } from '../lib/googleSheets';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwQrpJuBbxob2il_yZwOcfG34jyBArDl7I4RYsfH4RKW7q4n7xtBzhQxLpRXdGZPDGPIQ/exec';

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

// ── DATA TYPE STRUCTURE DEFINITIONS ──
type Document = {
  documentId: string;
  userId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  status: string;
  adminMessage?: string;
};

type UserProfile = {
  userId: string;
  name: string;
  phone: string;
  email: string;
  disabilityType: string;
  dob: string;
  state: string;
  language: string;
  uid: string;
  ngoId?: string;
};

type Grievance = {
  userId: string;
  name: string;
  phone: string;
  grievance: string;
  timestamp: string;
  ngoId?: string;
};

type AnalyticsRow = {
  timestamp: string;
  schemeId: string;
  schemeName: string;
  disabilityType: string;
  action: string;
  englishSchemeName?: string;
};

type SchemeStat = {
  schemeName: string;
  disabilityType: string;
  viewed: number;
  saved: number;
  apply_clicked: number;
  i_applied: number;
  shared: number;
  summary: string;
  eligibility: string;
  howToApply: string;
  applicationUrl: string;
};

type Tab = 'beneficiaries' | 'grievances' | 'addscheme' | 'suggestions';

export default function AdminScreen() {
  const router = useRouter();
  
  // Component application state variables tracking access rights, navigation tabs, and data models
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('beneficiaries');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [schemeStats, setSchemeStats] = useState<SchemeStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedDocId, setSelectedDocId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  // ── MULTI-TENANCY SUGGESTIONS & SELF-SERVICE STATES ──
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [newNgoName, setNewNgoName] = useState('');
  const [newNgoEmail, setNewNgoEmail] = useState('');

  const [newNgoId, setNewNgoId] = useState('');
  const [ngoId, setngoId] = useState('');
  const [newNgoPhone, setNewNgoPhone] = useState('');
  
  const [searchPhone, setSearchPhone] = useState('');
  const [foundUser, setFoundUser] = useState<any | null>(null);
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [operatorNotes, setOperatorNotes] = useState('');
  const [searchingUser, setSearchingUser] = useState(false);
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);
  const [masterSchemesRaw, setMasterSchemesRaw] = useState<any[]>([]);

  const [schemeName, setschemeName] = useState('');
  const [issuingBody, setissuingBody] = useState('');
  const [disabilityType, setdisabilityType] = useState('');
  const [schemeSummary, setschemeSummary] = useState('');
  const [schemeEligibility, setschemeEligibility] = useState('');
  const [schemeHowTo, setschemeHowTo] = useState('');
  const [applicationURL, setapplicationURL] = useState('');
  const [SubmittingScheme, setSubmittingScheme] = useState(false);
  const [beneficiaryNgoId, setbeneficiaryNgoId] = useState('');
  const [operatorNgoId, setoperatorNgoId] = useState('');

  // Form Submission Handler: Validates administrative session status credentials via spreadsheet registries
  const handleLogin = async () => {
    if (!password.trim() || !ngoId.trim()) {
      Alert.alert('Required', 'Please enter your organization ID and passphrase.');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyNgoAdmin(password.trim(), ngoId.trim());

      if (response.success && response.ngoDetails) {
        const simulatedUserSession = {
          userId: `operator-${response.ngoDetails.ngoId}`,
          name: `${response.ngoDetails.ngoName} Representative`,
          ngoId: response.ngoDetails.ngoId,
          onboardingType: 'operator'
        };

        setoperatorNgoId(response.ngoDetails.ngoId);
        
        await AsyncStorage.setItem('loggedInUser', JSON.stringify(simulatedUserSession));
        setAuthenticated(true);
        loadData();
        Alert.alert('Session Authorized', `Welcome to the ${response.ngoDetails.ngoName} workspace panel.`);
      } else {
        Alert.alert('Access Denied', response.message || 'Invalid volunteer authorization password.');
      }
    } catch {
      Alert.alert('Network Error', 'Could not complete security verification checks.');
    } finally {
      setLoading(false);
    }
  };

  // Self-Service NGO Onboarding Dispatch Form Handler
  const handleNgoRegistration = async () => {
    if (!newNgoName.trim() || !password.trim() || !newNgoId.trim()) {
      Alert.alert('Missing Info', 'Please complete all required fields.');
      return;
    }

    const cleanInputId = newNgoId.trim();

    setLoading(true);
    try {
      // 1. Live uniqueness check with redirect follow
      const checkUrl = `${SCRIPT_URL}?action=checkUniqueNgoId&ngoId=${encodeURIComponent(cleanInputId)}`;
      const checkResponse = await fetch(checkUrl, {
        method: 'GET',
        redirect: 'follow',
      });

      if (checkResponse.ok) {
        const text = await checkResponse.text();
        try {
          const checkResult = JSON.parse(text);
          if (checkResult.success && checkResult.isDuplicate) {
            Alert.alert(
              'ID Already Taken ❌', 
              `The NGO ID "${cleanInputId}" is already registered. Please choose a different unique identifier.`
            );
            setLoading(false);
            return;
          }
        } catch {
          // If script does not implement uniqueness check, proceed to register
        }
      }

      // 2. Dispatch NGO Registration
      const res = await registerNewNgoOrganization({
        ngoId: cleanInputId,
        ngoName: newNgoName.trim(),
        helpline: newNgoPhone.trim(),
        email: newNgoEmail.trim(),
        passwordInput: password.trim(),
      });

      if (res && res.success) {
        Alert.alert('Success 🎉', 'Your organization account has been created! You can now sign in using your passphrase.', [
          {
            text: 'Sign In',
            onPress: () => {
              setIsRegisterMode(false);
              setngoId(cleanInputId);
              setNewNgoId('');
              setNewNgoName('');
              setNewNgoEmail('');
              setNewNgoPhone('');
              setPassword('');
            }
          }
        ]);
      } else {
        Alert.alert('Registration Failed', res?.message || 'Could not register organization.');
      }
    } catch (err: any) {
      console.error("NGO Registration Error:", err);
      Alert.alert('Network Error', err?.message || 'Could not connect to the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // ── CORE DATA CROSS-REFERENCE MATCH ENGINE ──
  function processAnalytics(rows: AnalyticsRow[], masterSchemes: any[]): SchemeStat[] {
    const map: Record<string, SchemeStat> = {};
    
    rows.forEach(row => {
      if (!row.action || row.action.trim() === '') return;

      const matchedSchemeMeta = masterSchemes && masterSchemes.length > 0
        ? masterSchemes.find(m => String(m.id).toLowerCase().trim() === String(row.schemeId || '').toLowerCase().trim())
        : null;

      const key = matchedSchemeMeta 
        ? (matchedSchemeMeta.englishSchemeName || matchedSchemeMeta.schemeName) 
        : (row.schemeName || 'Unknown Program');

      if (!map[key]) {
        map[key] = {
          schemeName: key,
          disabilityType: matchedSchemeMeta ? matchedSchemeMeta.disabilityType : (row.disabilityType || 'General Welfare'),
          viewed: 0,
          saved: 0,
          apply_clicked: 0,
          i_applied: 0,
          shared: 0,
          summary: matchedSchemeMeta ? matchedSchemeMeta.summary : 'No overview summary available.',
          eligibility: matchedSchemeMeta ? matchedSchemeMeta.eligibility : 'Contact administrator for details.',
          howToApply: matchedSchemeMeta ? matchedSchemeMeta.howToApply : 'Process via external portal.',
          applicationUrl: matchedSchemeMeta ? matchedSchemeMeta.applicationUrl : 'https://www.swavlambancard.gov.in/',
        };
      }
      
      const currentAction = row.action.toLowerCase().trim();
      if (currentAction === 'viewed') map[key].viewed++;
      if (currentAction === 'saved') map[key].saved++;
      if (currentAction === 'apply_clicked') map[key].apply_clicked++;
      if (currentAction === 'i_applied') map[key].i_applied++;
      if (currentAction === 'shared') map[key].shared++;
    });

    return Object.values(map).sort((a, b) => b.viewed - a.viewed);
  }

  // ── REMOTE REST HTTP DATA INGESTION ENGINE ──
  const loadData = async () => {
    setLoading(true);
    try {
      const [userRes, docRes, grievanceRes, analyticsRes, sheetMasterData] = await Promise.all([
        fetch(`${SCRIPT_URL}?action=getUsers`, { redirect: 'follow' }),
        fetch(`${SCRIPT_URL}?action=getDocuments`, { redirect: 'follow' }),
        fetch(`${SCRIPT_URL}?action=getGrievances`, { redirect: 'follow' }),
        fetch(`${SCRIPT_URL}?action=getAnalytics`, { redirect: 'follow' }),
        getSchemes('English').catch(() => []), 
      ]);

      const userData = await userRes.json();
      const docData = await docRes.json();
      const grievanceData = await grievanceRes.json();
      const analyticsData = await analyticsRes.json();

      if (userData.success && Array.isArray(userData.users)) {
        const rawOperator = await AsyncStorage.getItem('loggedInUser');
        const operatorProfile = rawOperator ? JSON.parse(rawOperator) : {};
        const activeNgoId = String(operatorProfile.ngoId || operatorNgoId || 'CENTRAL_POOL').trim().toUpperCase();
      
        if (activeNgoId === 'CENTRAL_POOL') {
          setUsers(userData.users);
        } else {
          const tenantUsers = userData.users.filter((user: UserProfile) => {
            const userNgo = String(user.ngoId || 'CENTRAL_POOL').trim().toUpperCase();
            return userNgo === activeNgoId;
          });
          setUsers(tenantUsers);
        }
      }
      if (docData.success) setDocuments(docData.documents);
      //if (grievanceData.success) setGrievances(grievanceData.grievances);
      if (grievanceData.success && Array.isArray(grievanceData.grievances)) {
        const rawOperator = await AsyncStorage.getItem('loggedInUser');
        const operatorProfile = rawOperator ? JSON.parse(rawOperator) : {};
        const activeNgoId = String(operatorProfile.ngoId || operatorNgoId || 'CENTRAL_POOL').trim().toUpperCase();

        if (activeNgoId === 'CENTRAL_POOL') {
          setGrievances(grievanceData.grievances);
        } else {
          const tenantGrievances = grievanceData.grievances.filter((g: any) => {
            const gNgo = String(g.ngoId || 'CENTRAL_POOL').trim().toUpperCase();
            return gNgo === activeNgoId;
          });
          setGrievances(tenantGrievances);
        }
      }
      
      let freshMasterSchemes: any[] = [];
      if (sheetMasterData) {
        if (sheetMasterData.schemes && Array.isArray(sheetMasterData.schemes)) {
          freshMasterSchemes = sheetMasterData.schemes;
        } else if (Array.isArray(sheetMasterData)) {
          freshMasterSchemes = sheetMasterData;
        }
      }

      const normalizedSchemes = freshMasterSchemes.map((s: any) => ({
        id: String(s.id || '').trim().toUpperCase(),
        schemeName: String(s.schemeName || s.englishSchemeName || '').trim(),
        issuingBody: String(s.issuingBody || '').trim(),
        disabilityType: String(s.disabilityType || '').trim(),
        summary: String(s.summary || '').trim(),
        eligibility: String(s.eligibility || '').trim(),
        howToApply: String(s.howToApply || '').trim(),
        applicationUrl: String(s.applicationUrl || 'https://www.swavlambancard.gov.in/').trim(),
      }));

      setMasterSchemesRaw(normalizedSchemes);

      if (analyticsData.success && analyticsData.analytics) {
        setSchemeStats(processAnalytics(analyticsData.analytics, sheetMasterData));
      }
    } catch (err: any) {
      console.log("=== ADM_SYNC_ERROR_LOG ===", err?.message || err);
      Alert.alert('Sync Error', `Failed to fetch updated records. Error details: ${err?.message || 'Check connection'}`);
    } finally {
      setLoading(false);
    }
  };

  // ── MULTI-TENANT CONTEXT DRIVEN SUGGESTION HANDLERS ──
  const handleLookupBeneficiary = async () => {
    if (!searchPhone.trim() || searchPhone.trim().length < 10) {
      Alert.alert('Invalid Entry', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    const textInputStr = searchPhone.trim();
    setSearchingUser(true);
    setFoundUser(null);
    setSelectedSchemeId('');
    
    try {
      const rawOperator = await AsyncStorage.getItem('loggedInUser');
      const operatorProfile = rawOperator ? JSON.parse(rawOperator) : {};

      const result = await getUserByPhone(textInputStr);
      
      if (result) {
        const bNgoId = String(result.ngoId || 'CENTRAL_POOL').trim().toUpperCase();
        const oNgoId = String(operatorProfile.ngoId || 'CENTRAL_POOL').trim().toUpperCase();

        setbeneficiaryNgoId(bNgoId);
        setoperatorNgoId(oNgoId);

        if (bNgoId !== oNgoId && oNgoId !== 'CENTRAL_POOL') {
          Alert.alert('Access Denied', `This beneficiary profile is managed by another organization. (User: ${bNgoId}, Admin: ${oNgoId})`);
          setSearchingUser(false);
          return;
        }

        setFoundUser({
          userId: result.userId,
          name: result.name,
          phone: result.phone,
          disabilityType: result.disabilityType,
          ngoId: bNgoId,
        });
      } else {
        Alert.alert('Not Found', 'No beneficiary found matching this mobile number.');
      }
    } catch {
      Alert.alert('Sync Failure', 'Error connecting to user database registries.');
    } finally {
      setSearchingUser(false);
    }
  };

  const handleSendRecommendation = async () => {
    if (!foundUser || !selectedSchemeId) {
      Alert.alert('Incomplete Form', 'Please locate a user profile and choose a scheme.');
      return;
    }

    setSubmittingSuggestion(true);
    try {
      const rawOperator = await AsyncStorage.getItem('loggedInUser');
      const operatorProfile = rawOperator ? JSON.parse(rawOperator) : {};
      
      const computedStaffId = operatorProfile.name || 'Staff';
      const computedNgoGroup = operatorProfile.ngoId || 'CENTRAL_POOL';

      const response = await submitSchemeSuggestion({
        phone: foundUser.phone,
        schemeId: selectedSchemeId,
        operatorId: `${computedStaffId} (${computedNgoGroup})`,
        operatorNotes: operatorNotes.trim(),
        ngoId: computedNgoGroup
      });

      if (response.success) {
        Alert.alert('Success 🎉', 'Scheme recommendation pinned onto beneficiary\'s dashboard.', [
          { text: 'Done', onPress: () => { setSelectedSchemeId(''); setOperatorNotes(''); setFoundUser(null); setSearchPhone(''); } }
        ]);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch {
      Alert.alert('Network Error', 'Failed to complete transaction.');
    } finally {
      setSubmittingSuggestion(false);
    }
  };

  // ── DOCUMENT WORKFLOW ENGINE TRANSACTION POST ──
  const executeStatusUpdate = async (documentId: string, currentUserId: string, newStatus: string, messageText: string = '') => {
    setUpdatingId(documentId);
    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          sheet: 'UpdateStatus',
          documentId,
          userId: currentUserId,
          status: newStatus,
          adminMessage: messageText,
        }),
        redirect: 'follow',
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(prev =>
          prev.map(d => (d.documentId === documentId ? { ...d, status: newStatus, adminMessage: messageText } : d))
        );
        Alert.alert('Success', `Document marked as ${newStatus}`);
      } else {
        Alert.alert('Error', 'Server failed to update status.');
      }
    } catch {
      Alert.alert('Network Error', 'Could not reach server.');
    } finally {
      setUpdatingId('');
    }
  };

  const handleStatusUpdate = (documentId: string, currentUserId: string, newStatus: string) => {
    if (!documentId || documentId === 'undefined') {
      Alert.alert('Data Error', 'Cannot modify document without a valid ID.');
      return;
    }
    if (newStatus === 'Action Required') {
      setSelectedDocId(documentId);
      setSelectedUserId(currentUserId);
      setCustomMessage('');
      setModalVisible(true);
    } else {
      executeStatusUpdate(documentId, currentUserId, newStatus, '');
    }
  };

  const handleModalSubmit = () => {
    const finalRemarks = customMessage.trim() || 'Please re-upload a clearer copy of this document.';
    setModalVisible(false);
    executeStatusUpdate(selectedDocId, selectedUserId, 'Action Required', finalRemarks);
  };

  const viewDocumentFile = (url: string) => {
    if (!url || url.trim() === '') {
      Alert.alert('Unavailable', 'No file URL provided for this document.');
      return;
    }
    Linking.openURL(url).catch(() => {
      Alert.alert('Launch Fail', 'Could not open this file.');
    });
  };

  const getStatusColor = (status: string) => {
    if (status === 'Verified') return '#166534';
    if (status === 'Action Required') return '#991b1b';
    return '#92400e';
  };

  const getStatusBg = (status: string) => {
    if (status === 'Verified') return '#dcfce7';
    if (status === 'Action Required') return '#fee2e2';
    return '#fef3c7';
  };

  const handleSendScheme = async () => {
    setSubmittingScheme(true);
    try {
      const response = await addSchemes({
        schemeName: schemeName,
        issuingBody: issuingBody,
        disabilityType: disabilityType,
        schemeSummary: schemeSummary,
        eligibility: schemeEligibility,
        howToApply: schemeHowTo,
        applicationUrl: applicationURL,
      });

      if (response.success) {
        Alert.alert('Success 🎉', 'Scheme has been added to the system.', [
          { 
            text: 'Done', 
            onPress: () => { 
              setschemeName(''); 
              setissuingBody(''); 
              setschemeEligibility(''); 
              setschemeHowTo('');
              setapplicationURL('');
              setschemeSummary('');
              setdisabilityType('');
              loadData();
            } 
          }
        ]);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch {
      Alert.alert('Network Error', 'Failed to publish scheme.');
    } finally {
      setSubmittingScheme(false);
    }
  };

  // ── AUTHENTICATION GATE SCREEN ──
  if (!authenticated) {
    return (
      <View style={styles.loginContainer}>
        <Text style={styles.loginTitle}>{isRegisterMode ? 'Register NGO' : 'Volunteer Portal'}</Text>
        <Text style={styles.loginSubtitle}>ProVision Asia • Multi-Tenant Partner Space</Text>

        {isRegisterMode ? (
          <>
            <TextInput
              style={styles.loginInput}
              value={newNgoId}
              onChangeText={setNewNgoId}
              placeholder="Organization ID (e.g. NGO_BLR_01)"
              placeholderTextColor="#6b7280"
              autoCapitalize="characters"
            />
            <Text style={styles.loginUnderSub}>Please remember this username/ID to log in later</Text>

            <TextInput
              style={styles.loginInput}
              value={newNgoName}
              onChangeText={setNewNgoName}
              placeholder="Organization Name (e.g., VNA India)"
              placeholderTextColor="#6b7280"
            />
            <TextInput
              style={styles.loginInput}
              value={newNgoEmail}
              onChangeText={setNewNgoEmail}
              placeholder="Official Contact Email Address"
              placeholderTextColor="#6b7280"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.loginInput}
              value={newNgoPhone}
              onChangeText={setNewNgoPhone}
              placeholder="Helpline Number (10 digits)"
              placeholderTextColor="#6b7280"
              keyboardType="phone-pad"
              maxLength={10}
            />
          </>
        ) : (
          <TextInput
            style={styles.loginInput}
            value={ngoId}
            onChangeText={setngoId}
            placeholder="Enter Organization ID"
            placeholderTextColor="#6b7280"
            autoCapitalize="characters"
          />
        )}

        <TextInput
          style={styles.loginInput}
          value={password}
          onChangeText={setPassword}
          placeholder={isRegisterMode ? "Choose a secure access password" : "Enter organization passphrase key"}
          placeholderTextColor="#6b7280"
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={isRegisterMode ? handleNgoRegistration : handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.loginButtonText}>
              {isRegisterMode ? 'Create NGO Space' : 'Authorize Session'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setIsRegisterMode(!isRegisterMode); setPassword(''); }}>
          <Text style={{ textAlign: 'center', color: '#2563eb', fontWeight: '600', marginBottom: 16, fontSize: 15 }}>
            {isRegisterMode ? '← Already registered? Sign In' : 'Register a new NGO Organization'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Return to Main Application</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── CORE PANEL WORKSPACE ──
  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Admin Panel</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Exit System</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Selection Switch Bar */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'beneficiaries' && styles.tabActive]}
            onPress={() => setActiveTab('beneficiaries')}>
            <View style={styles.tabContentRow}>
              <Ionicons name="people" size={16} color={activeTab === 'beneficiaries' ? '#ffffff' : '#6b7280'} />
              <Text style={[styles.tabText, activeTab === 'beneficiaries' && styles.tabTextActive]}>Users</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'grievances' && styles.tabActive]}
            onPress={() => setActiveTab('grievances')}>
            <View style={styles.tabContentRow}>
              <Ionicons name="document-text" size={16} color={activeTab === 'grievances' ? '#ffffff' : '#6b7280'} />
              <Text style={[styles.tabText, activeTab === 'grievances' && styles.tabTextActive]}>Grievances</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'addscheme' && styles.tabActive]}
            onPress={() => setActiveTab('addscheme')}>
            <View style={styles.tabContentRow}>
              <Ionicons name="add-outline" size={16} color={activeTab === 'addscheme' ? '#ffffff' : '#6b7280'} />
              <Text style={[styles.tabText, activeTab === 'addscheme' && styles.tabTextActive]}>New Scheme</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'suggestions' && styles.tabActive]}
            onPress={() => setActiveTab('suggestions')}>
            <View style={styles.tabContentRow}>
              <Ionicons name="sparkles" size={16} color={activeTab === 'suggestions' ? '#ffffff' : '#6b7280'} />
              <Text style={[styles.tabText, activeTab === 'suggestions' && styles.tabTextActive]}>Suggest</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={loadData}>
          <View style={styles.refreshContentRow}>
            <Ionicons name="refresh-outline" size={16} color="#2563eb" />
            <Text style={styles.refreshText}>Refresh Data</Text>
          </View>
        </TouchableOpacity>

        {loading && <ActivityIndicator size="large" color="#2563eb" style={{ marginVertical: 20 }} />}

        {/* ── TAB 1: REGISTERED BENEFICIARIES ── */}
        {!loading && activeTab === 'beneficiaries' && (
          <View>
            {users.length === 0 ? (
              <Text style={styles.emptyText}>No registered beneficiaries found.</Text>
            ) : (
              users.map((user, uIdx) => {
                const matchedDocs = documents.filter(d => {
                  const docUserId = String(d.userId).trim().toLowerCase();
                  const profileUserId = String(user.userId || '').trim().toLowerCase();
                  const profilePhone = String(user.phone || '').trim().toLowerCase();
                  return (profileUserId !== '' && docUserId === profileUserId) ||
                    (profilePhone !== '' && docUserId === profilePhone);
                });

                return (
                  <View key={`user-${user.userId}-${uIdx}`} style={styles.profileCardContainer}>
                    <View style={styles.profileHeaderBlock}>
                      <Text style={styles.profileCardName}>{user.name || 'Unnamed'}</Text>
                      
                      <View style={styles.metadataInlineIconRow}>
                        <Ionicons name="call-outline" size={14} color="#4b5563" style={styles.inlineIconSpacing} />
                        <Text style={styles.profileCardSubText}>{user.phone}</Text>
                      </View>
                      <View style={styles.metadataInlineIconRow}>
                        <Ionicons name="body-outline" size={14} color="#4b5563" style={styles.inlineIconSpacing} />
                        <Text style={styles.profileCardSubText}>{user.disabilityType}</Text>
                      </View>
                      <View style={styles.metadataInlineIconRow}>
                        <Ionicons name="globe-outline" size={14} color="#4b5563" style={styles.inlineIconSpacing} />
                        <Text style={styles.profileCardSubText}>{user.state} • {user.language}</Text>
                      </View>
                    </View>

                    <Text style={styles.nestedDocHeader}>Documents ({matchedDocs.length})</Text>

                    {matchedDocs.length === 0 ? (
                      <Text style={styles.noDocText}>No documents submitted yet.</Text>
                    ) : (
                      matchedDocs.map((doc, dIdx) => (
                        <View key={`doc-${doc.documentId}-${dIdx}`} style={styles.nestedDocItemCard}>
                          <Text style={styles.docTitleText}>{doc.fileName}</Text>
                          <Text style={styles.docMetaLabel}>{doc.documentType}</Text>

                          <View style={[styles.statusBadge, { backgroundColor: getStatusBg(doc.status) }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(doc.status) }]}>{doc.status}</Text>
                          </View>

                          {doc.adminMessage ? (
                            <View style={styles.adminMessageDisplayBox}>
                              <Ionicons name="clipboard-outline" size={14} color="#991b1b" style={{ marginRight: 6 }} />
                              <Text style={styles.adminMessageDisplayText}>"{doc.adminMessage}"</Text>
                            </View>
                          ) : null}

                          <TouchableOpacity style={styles.viewDocumentLinkButton} onPress={() => viewDocumentFile(doc.fileUrl)}>
                            <View style={styles.innerButtonFlexRow}>
                              <Ionicons name="eye-outline" size={16} color="#2563eb" style={{ marginRight: 6 }} />
                              <Text style={styles.viewDocumentText}>View Document</Text>
                            </View>
                          </TouchableOpacity>

                          <Text style={styles.actionStateHeaderLabel}>Update Status:</Text>
                          <View style={styles.statusButtonRow}>
                            {['Verified', 'Pending', 'Action Required'].map(statusOption => (
                              <TouchableOpacity
                                key={statusOption}
                                style={[
                                  styles.statusButton,
                                  doc.status === statusOption && styles.statusButtonActive,
                                  updatingId === doc.documentId && styles.statusButtonDisabled,
                                ]}
                                disabled={updatingId === doc.documentId}
                                onPress={() => handleStatusUpdate(doc.documentId, user.userId, statusOption)}>
                                <Text style={[styles.statusButtonText, doc.status === statusOption && styles.statusButtonTextActive]}>
                                  {statusOption}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ── TAB 2: GRIEVANCES ── */}
        {!loading && activeTab === 'grievances' && (
          <View>
            {grievances.length === 0 ? (
              <Text style={styles.emptyText}>No grievances submitted yet.</Text>
            ) : (
              grievances.map((g, gIdx) => (
                <View key={`grievance-${g.userId}-${gIdx}`} style={styles.card}>
                  <Text style={styles.cardTitle}>{g.name}</Text>
                  <View style={styles.metadataInlineIconRow}>
                    <Ionicons name="call-outline" size={14} color="#374151" style={styles.inlineIconSpacing} />
                    <Text style={styles.cardMeta}>{g.phone}</Text>
                  </View>
                  <View style={styles.metadataInlineIconRow}>
                    <Ionicons name="time-outline" size={14} color="#374151" style={styles.inlineIconSpacing} />
                    <Text style={styles.cardMeta}>{g.timestamp}</Text>
                  </View>
                  <View style={styles.grievanceBox}>
                    <Text style={styles.grievanceText}>{g.grievance}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── TAB 3: SCHEME SUBMIT FORM ── */}
        {!loading && activeTab === 'addscheme' && (
          <View style={styles.suggestionFormWrapper}>
            <Text style={styles.formHeaderLabelTitle}>Curate New Scheme</Text>

            <Text style={styles.formSectionSubLabelHeadingText}>Scheme Name</Text>
            <TextInput
              style={[styles.formInputFieldSearchBox, { minHeight: 70, textAlignVertical: 'top', paddingTop: 10 }]}
              value={schemeName}
              onChangeText={setschemeName}
              placeholder="Add New Scheme's Name"
              placeholderTextColor="#a1a1aa"
              multiline
              numberOfLines={1}
            />

            <Text style={styles.formSectionSubLabelHeadingText}>Issuing Body</Text>
            <TextInput
              style={[styles.formInputFieldSearchBox, { minHeight: 70, textAlignVertical: 'top', paddingTop: 10 }]}
              value={issuingBody}
              onChangeText={setissuingBody}
              placeholder="Set Issuing Body as Govt/CSR Only"
              placeholderTextColor="#a1a1aa"
              multiline
              numberOfLines={1}
            />

            <Text style={styles.formSectionSubLabelHeadingText}>Disability Type</Text>
            <DropdownField
              label="Disability Type *"
              value={disabilityType}
              onSelect={setdisabilityType}
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

            <Text style={styles.formSectionSubLabelHeadingText}>Scheme Summary</Text>
            <TextInput
              style={[styles.formInputFieldSearchBox, { minHeight: 70, textAlignVertical: 'top', paddingTop: 10 }]}
              value={schemeSummary}
              onChangeText={setschemeSummary}
              placeholder="Add New Scheme's Summary"
              placeholderTextColor="#a1a1aa"
              multiline
              numberOfLines={1}
            />

            <Text style={styles.formSectionSubLabelHeadingText}>Scheme Eligibility Criteria</Text>
            <TextInput
              style={[styles.formInputFieldSearchBox, { minHeight: 70, textAlignVertical: 'top', paddingTop: 10 }]}
              value={schemeEligibility}
              onChangeText={setschemeEligibility}
              placeholder="Add New Scheme's Eligibility Criteria"
              placeholderTextColor="#a1a1aa"
              multiline
              numberOfLines={1}
            />

            <Text style={styles.formSectionSubLabelHeadingText}>How To Apply</Text>
            <TextInput
              style={[styles.formInputFieldSearchBox, { minHeight: 70, textAlignVertical: 'top', paddingTop: 10 }]}
              value={schemeHowTo}
              onChangeText={setschemeHowTo}
              placeholder="Add Details For A Beneficiary To Apply To The Scheme"
              placeholderTextColor="#a1a1aa"
              multiline
              numberOfLines={1}
            />

            <Text style={styles.formSectionSubLabelHeadingText}>Application URL</Text>
            <TextInput
              style={[styles.formInputFieldSearchBox, { minHeight: 70, textAlignVertical: 'top', paddingTop: 10 }]}
              value={applicationURL}
              onChangeText={setapplicationURL}
              placeholder="Add Application Link"
              placeholderTextColor="#a1a1aa"
              multiline
              numberOfLines={1}
            />

            <TouchableOpacity 
              style={[styles.mainFormSubmissionActionDispatcherBtn, (!schemeName.trim() || !disabilityType) && { backgroundColor: '#cbd5e1' }]} 
              onPress={handleSendScheme} 
              disabled={SubmittingScheme || !schemeName.trim() || !disabilityType}
            >
              {SubmittingScheme ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.mainFormSubmissionActionDispatcherBtnText}>Push to Beneficiary Screens</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── TAB 4: SUGGESTIONS FORM ── */}
        {!loading && activeTab === 'suggestions' && (
          <View style={styles.suggestionFormWrapper}>
            <Text style={styles.formHeaderLabelTitle}>Curate Scheme Assignment</Text>
            
            <View style={styles.searchRowContainer}>
              <TextInput
                style={styles.formInputFieldSearchBox}
                value={searchPhone}
                onChangeText={setSearchPhone}
                placeholder="Beneficiary phone number (10 digits)"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                maxLength={10}
              />
              <TouchableOpacity style={styles.formSubmitActionBtnSearch} onPress={handleLookupBeneficiary} disabled={searchingUser}>
                {searchingUser ? <ActivityIndicator color="#ffffff" size="small" /> : <Ionicons name="search" size={18} color="#ffffff" />}
              </TouchableOpacity>
            </View>

            {foundUser && (
              <View style={styles.summaryProfileCardFoundDisplayRow}>
                <View style={styles.summaryCardAvatarBoxCircle}>
                  <Text style={styles.avatarLetterFoundMiniText}>{foundUser.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.foundProfileNameHeading}>{foundUser.name}</Text>
                  <Text style={styles.foundProfileMetaCategoryDetail}>Category: {foundUser.disabilityType}</Text>
                </View>
              </View>
            )}

            {foundUser && (
              <View style={{ marginTop: 14 }}>
                <Text style={styles.formSectionSubLabelHeadingText}>Select Matching Welfare Scheme:</Text>
                <View style={styles.scrollRadioSelectorContainerBox}>
                  <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled={true}>
                    {masterSchemesRaw.filter(s => String(s.disabilityType).toLowerCase().trim() === String(foundUser.disabilityType).toLowerCase().trim()).length === 0 ? (
                      <Text style={{ fontStyle: 'italic', padding: 10, color: '#6b7280' }}>No specific schemes available for this category.</Text>
                    ) : (
                      masterSchemesRaw
                        .filter(s => s.disabilityType.toLowerCase().trim() === foundUser.disabilityType.toLowerCase().trim())
                        .map((scheme) => {
                          const isTargetActive = scheme.id === selectedSchemeId;
                          return (
                            <TouchableOpacity
                              key={scheme.id}
                              style={[styles.radioRowSelectTargetItemButton, isTargetActive && styles.radioRowSelectTargetItemButtonActive]}
                              onPress={() => setSelectedSchemeId(scheme.id)}
                            >
                              <Ionicons name={isTargetActive ? "radio-button-on" : "radio-button-off"} size={18} color={isTargetActive ? "#2563eb" : "#4b5563"} />
                              <Text style={[styles.radioSelectionLabelTitleText, isTargetActive && styles.radioSelectionLabelTitleTextActive]}>{scheme.schemeName}</Text>
                            </TouchableOpacity>
                          );
                        })
                    )}
                  </ScrollView>
                </View>

                <Text style={styles.formSectionSubLabelHeadingText}>Volunteer Advisor Notes:</Text>
                <TextInput
                  style={[styles.formInputFieldSearchBox, { minHeight: 70, textAlignVertical: 'top', paddingTop: 10 }]}
                  value={operatorNotes}
                  onChangeText={setOperatorNotes}
                  placeholder="Add custom eligibility tips or timeline application reminders..."
                  placeholderTextColor="#a1a1aa"
                  multiline
                  numberOfLines={3}
                />

                <TouchableOpacity 
                  style={[styles.mainFormSubmissionActionDispatcherBtn, !selectedSchemeId && { backgroundColor: '#cbd5e1' }]} 
                  onPress={handleSendRecommendation} 
                  disabled={submittingSuggestion || !selectedSchemeId}
                >
                  {submittingSuggestion ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.mainFormSubmissionActionDispatcherBtnText}>Push to Beneficiary Screen</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ACTION REQUIRED REMARKS DIALOG MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Action Required Reason</Text>
            <Text style={styles.modalSubtitle}>Explain to the beneficiary what needs to be corrected:</Text>
            <TextInput
              style={styles.modalTextInput}
              value={customMessage}
              onChangeText={setCustomMessage}
              placeholder="e.g., Document details unclear, please upload a clearer copy."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalSubmitButton]} onPress={handleModalSubmit}>
                <Text style={styles.modalSubmitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── STYLE SHEET CONFIGURATIONS ──
const styles = StyleSheet.create({
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 8 },
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
  optionButton: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  optionText: { fontSize: 17, color: '#334155', fontWeight: '500' },

  loginContainer: { flex: 1, backgroundColor: '#ffffff', paddingHorizontal: 24, justifyContent: 'center' },
  loginTitle: { fontSize: 32, fontWeight: '700', color: '#111827', marginBottom: 8 },
  loginSubtitle: { fontSize: 18, color: '#6b7280', marginBottom: 24, paddingVertical: 4 },
  loginUnderSub: { fontSize: 12, color: '#6b7280', marginTop: -8, marginBottom: 14 },
  loginInput: { borderWidth: 1.5, borderColor: '#9ca3af', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, fontSize: 18, color: '#111827', marginBottom: 14 },
  loginButton: { backgroundColor: '#2563eb', borderRadius: 10, minHeight: 54, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  loginButtonText: { color: '#ffffff', fontSize: 20, fontWeight: '700' },
  backText: { textAlign: 'center', fontSize: 17, color: '#6b7280' },
  container: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827' },
  backLink: { fontSize: 17, color: '#2563eb', fontWeight: '600' },
  tabRow: { flexDirection: 'row', marginBottom: 16, borderRadius: 10, borderWidth: 1.5, borderColor: '#d1d5db', overflow: 'hidden' },
  tab: { flex: 1, paddingVertical: 12, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' },
  tabActive: { backgroundColor: '#2563eb' },
  tabContentRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#ffffff' },
  refreshButton: { alignSelf: 'stretch', marginBottom: 16, paddingVertical: 12, borderWidth: 1.5, borderColor: '#2563eb', backgroundColor: '#eff6ff', borderRadius: 8, alignItems: 'center' },
  refreshContentRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  refreshText: { fontSize: 15, color: '#2563eb', fontWeight: '600' },
  emptyText: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginTop: 30, lineHeight: 24 },
  profileCardContainer: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 16, marginBottom: 16, elevation: 2 },
  profileHeaderBlock: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 10, marginBottom: 12, gap: 4 },
  profileCardName: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 2 },
  profileCardSubText: { fontSize: 14, color: '#4b5563', lineHeight: 20 },
  metadataInlineIconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  inlineIconSpacing: { marginRight: 6, width: 16, textAlign: 'center' },
  nestedDocHeader: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  noDocText: { fontSize: 14, color: '#9ca3af', fontStyle: 'italic', paddingVertical: 4 },
  nestedDocItemCard: { backgroundColor: '#f9fafb', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', padding: 12, marginBottom: 12 },
  docTitleText: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  docMetaLabel: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  viewDocumentLinkButton: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#2563eb', borderRadius: 6, paddingVertical: 8, marginVertical: 10, justifyContent: 'center', alignItems: 'center' },
  innerButtonFlexRow: { flexDirection: 'row', alignItems: 'center' },
  viewDocumentText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
  actionStateHeaderLabel: { fontSize: 13, fontWeight: '500', color: '#4b5563', marginBottom: 6 },
  card: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, backgroundColor: '#ffffff', padding: 14, marginBottom: 14, gap: 2 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardMeta: { fontSize: 15, color: '#374151' },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6, marginBottom: 6 },
  statusText: { fontSize: 13, fontWeight: '600' },
  statusButtonRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  statusButton: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: '#ffffff', flex: 1, minWidth: 90, alignItems: 'center' },
  statusButtonActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  statusButtonDisabled: { opacity: 0.5 },
  statusButtonText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  statusButtonTextActive: { color: '#ffffff' },
  grievanceBox: { marginTop: 10, backgroundColor: '#eff6ff', borderRadius: 8, padding: 12 },
  grievanceText: { fontSize: 15, lineHeight: 22, color: '#1e3a5f' },
  adminMessageDisplayBox: { backgroundColor: '#fee2e2', borderRadius: 6, padding: 10, marginVertical: 6, borderWidth: 1, borderColor: '#fca5a5', flexDirection: 'row', alignItems: 'center' },
  adminMessageDisplayText: { fontSize: 14, color: '#991b1b', fontWeight: '500', flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 20 },
  modalCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  modalSubtitle: { fontSize: 15, color: '#4b5563', lineHeight: 22, marginBottom: 14 },
  modalTextInput: { borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 16, color: '#111827', backgroundColor: '#f9fafb', minHeight: 100, textAlignVertical: 'top', marginBottom: 20 },
  modalButtonRow: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, minHeight: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  modalCancelButton: { backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#d1d5db' },
  modalCancelButtonText: { color: '#374151', fontSize: 16, fontWeight: '600' },
  modalSubmitButton: { backgroundColor: '#2563eb' },
  modalSubmitButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  suggestionFormWrapper: { backgroundColor: '#ffffff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginTop: 4 },
  formHeaderLabelTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  searchRowContainer: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  formInputFieldSearchBox: { flex: 1, backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10, minHeight: 48, paddingHorizontal: 14, fontSize: 16, color: '#111827' },
  formSubmitActionBtnSearch: { backgroundColor: '#2563eb', width: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  summaryProfileCardFoundDisplayRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, marginTop: 12 },
  summaryCardAvatarBoxCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1' },
  avatarLetterFoundMiniText: { color: '#2563eb', fontSize: 16, fontWeight: '700' },
  foundProfileNameHeading: { fontSize: 16, fontWeight: '700', color: '#111827' },
  foundProfileMetaCategoryDetail: { fontSize: 14, color: '#4b5563', marginTop: 1 },
  formSectionSubLabelHeadingText: { fontSize: 13, fontWeight: '700', color: '#4b5563', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 14, marginBottom: 6 },
  scrollRadioSelectorContainerBox: { backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 10, padding: 4, marginBottom: 2 },
  radioRowSelectTargetItemButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8 },
  radioRowSelectTargetItemButtonActive: { backgroundColor: '#eff6ff' },
  radioSelectionLabelTitleText: { fontSize: 15, color: '#374151', fontWeight: '500', flex: 1 },
  radioSelectionLabelTitleTextActive: { color: '#1d4ed8', fontWeight: '700' },
  mainFormSubmissionActionDispatcherBtn: { backgroundColor: '#10b981', minHeight: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  mainFormSubmissionActionDispatcherBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});