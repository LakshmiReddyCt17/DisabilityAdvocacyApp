import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useState } from 'react';
import { appDictionary, AppLanguage } from '../../lib/appTranslations';

import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const CLOUDINARY_CLOUD = 'dgnrn2dui';
const CLOUDINARY_PRESET = 'dybx1a3f';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`;

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwQrpJuBbxob2il_yZwOcfG34jyBArDl7I4RYsfH4RKW7q4n7xtBzhQxLpRXdGZPDGPIQ/exec";

type DocumentStatus = 'Verified' | 'Pending' | 'Action Required';
type DocumentType = 'Disability Certificate' | 'ID Proof' | 'Other Document';

type UploadedDocument = {
  documentId: string;
  userId: string;
  documentType: DocumentType;
  fileName: string;
  status: DocumentStatus;
  fileUrl?: string;
  adminMessage?: string;
};

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [appLang, setAppLang] = useState<AppLanguage>('English');

  const fetchUserDocuments = async (userId: string) => {
    try {
      const rawUser = await AsyncStorage.getItem('loggedInUser');
      const parsedUser = rawUser ? JSON.parse(rawUser) : {};
      const userPhone = String(parsedUser.phone || '').trim().toLowerCase();
      const cleanUserId = String(userId).trim().toLowerCase();

      const response = await fetch(`${SCRIPT_URL}?action=getDocuments`);
      const result = await response.json();
      
      if (result.success && result.documents) {
        const filtered = result.documents.filter((doc: any) => {
          const docOwnerId = String(doc.userId || '').trim().toLowerCase();
          
          const matchesId = cleanUserId !== '' && docOwnerId === cleanUserId;
          const matchesPhone = userPhone !== '' && docOwnerId === userPhone;
          
          return matchesId || matchesPhone;
        });
        
        setDocuments(filtered);
      }
    } catch (err) {
      console.error("Failed fetching live docs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadUserAndData() {
      try {
        const raw = await AsyncStorage.getItem('loggedInUser');
        if (raw) {
          const user = JSON.parse(raw);
          const realId = user.userId || '';
          if (user.language) setAppLang(user.language as AppLanguage);
          setCurrentUserId(realId);
          if (realId) {
            await fetchUserDocuments(realId);
            return;
          }
        }
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    }
    loadUserAndData();
  }, []);

  function getStatusStyle(status: DocumentStatus) {
    if (status === 'Verified') return { container: styles.verifiedTag, text: styles.verifiedTagText };
    if (status === 'Action Required') return { container: styles.actionRequiredTag, text: styles.actionRequiredTagText };
    return { container: styles.pendingTag, text: styles.pendingTagText };
  }

  const uploadToCloudinary = async (uri: string, fileName: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'application/octet-stream',
      name: fileName,
    } as any);
    formData.append('upload_preset', CLOUDINARY_PRESET);
    formData.append('folder', 'disability_app_documents');

    const res = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!data.secure_url) throw new Error('Cloudinary secure URL missing.');
    return data.secure_url;
  };

  const handleUpload = async (documentType: DocumentType) => {
    if (!currentUserId) {
      Alert.alert('Session Error', 'User context not found. Please log in again.');
      return;
    }
    setUploadError('');
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setUploadingType(documentType);

      const fileUrl = await uploadToCloudinary(file.uri, file.name);

      const postPayload = {
        sheet: "Documents",
        userId: currentUserId, 
        documentType: documentType,
        fileName: file.name,
        fileUrl: fileUrl,
        status: "Pending"
      };

      const sheetResponse = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postPayload),
      });
      
      const sheetResult = await sheetResponse.json();

      if (sheetResult.success) {
        Alert.alert('Uploaded!', 'Your document has been logged into the review verification database pipeline.');
        setLoading(true);
        await fetchUserDocuments(currentUserId);
      } else {
        throw new Error('Spreadsheet rejected write.');
      }
    } catch (err) {
      setUploadError('Upload pipeline failure. Please verify connection.');
      console.error(err);
    } finally {
      setUploadingType(null);
    }
  };

  const handleView = async (doc: UploadedDocument) => {
    if (doc.fileUrl) {
      const supported = await Linking.canOpenURL(doc.fileUrl);
      if (supported) {
        await Linking.openURL(doc.fileUrl);
      } else {
        Alert.alert('Cannot Open', 'Browser layer failed to resolve target reference URL.');
      }
    } else {
      Alert.alert('Not Available', 'Target file url mapping is empty.');
    }
  };

  const t = appDictionary[appLang] || appDictionary.English;

  return (
    <ScrollView 
      style={styles.scrollViewOuter} 
      contentContainerStyle={styles.container} 
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title} accessibilityRole="header">
        {t.docTitle}
      </Text>
      <Text style={styles.subtitle}>
        {t.docSubtitle}
      </Text>

      {/* Upload Buttons Hub with Corrected Syntax and Modern Vector Alignment */}
      <View style={styles.uploadHubContainer}>
        {(['Disability Certificate', 'ID Proof', 'Other Document'] as DocumentType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.uploadButton, uploadingType === type && styles.uploadButtonDisabled]}
            accessibilityRole="button"
            disabled={uploadingType !== null}
            onPress={() => handleUpload(type)}
          >
            {uploadingType === type ? (
              <View style={styles.uploadingRow}>
                <ActivityIndicator color="#ffffff" size="small" />
                <Text style={styles.uploadButtonText}>  Uploading file...</Text>
              </View>
            ) : (
              <View style={styles.buttonContentFlex}>
                <Ionicons name="cloud-upload-outline" size={20} color="#ffffff" style={styles.buttonIconSpacing} />
                <Text style={styles.uploadButtonText}>Upload {type}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {uploadError ? <Text style={styles.errorText}>{uploadError}</Text> : null}

      <Text style={styles.sectionTitle}>{t.uploadBtn}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
      ) : documents.length === 0 ? (
        <View style={styles.emptyContainerCard}>
          <View style={styles.emptyIconWrapper} aria-hidden={true}>
            <Ionicons name="folder-open-outline" size={44} color="#94a3b8" />
          </View>
          <Text style={styles.emptyMainText}>{t.uploadStatus}</Text>
          <Text style={styles.emptySubText}>{t.quickActionSecureText}</Text>
        </View>
      ) : (
        documents.map((document) => {
          const statusStyle = getStatusStyle(document.status);
          return (
            <View key={document.documentId} style={styles.card} accessibilityRole="summary">
              <View style={styles.cardHeader}>
                <Text style={styles.fileName}>{document.fileName}</Text>
                <Text style={styles.metaText}>{document.documentType}</Text>
                
                <View style={[styles.statusTag, statusStyle.container]}>
                  <Text style={[styles.statusTagText, statusStyle.text]}>{document.status}</Text>
                </View>
              </View>

              {document.status === 'Action Required' && document.adminMessage ? (
                <View style={styles.rejectionMessageBox}>
                  <View style={styles.rejectionTitleRow}>
                    <Ionicons name="alert-circle-outline" size={16} color="#991b1b" style={{ marginRight: 6 }} />
                    <Text style={styles.rejectionMessageTitle}>Action Required Reason:</Text>
                  </View>
                  <Text style={styles.rejectionMessageText}>"{document.adminMessage}"</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.viewButton, !document.fileUrl && styles.viewButtonDisabled]}
                disabled={!document.fileUrl}
                onPress={() => handleView(document)}
                accessibilityRole="button"
              >
                <View style={styles.buttonContentFlex}>
                  <Ionicons 
                    name="eye-outline" 
                    size={18} 
                    color={document.fileUrl ? '#2563eb' : '#94a3b8'} 
                    style={styles.buttonIconSpacing} 
                  />
                  <Text style={[styles.viewButtonText, !document.fileUrl && styles.viewButtonTextDisabled]}>
                    {document.fileUrl ? 'View Attached Document' : 'Not Available'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollViewOuter: { flex: 1, backgroundColor: '#ffffff' },
  container: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40, backgroundColor: '#ffffff', flexGrow: 1 },
  title: { fontSize: 32, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 16, lineHeight: 22, color: '#64748b', fontWeight: '500', marginBottom: 24 },
  uploadHubContainer: { marginBottom: 16 },
  uploadButton: { minHeight: 54, borderRadius: 12, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginBottom: 12, paddingHorizontal: 16, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
  uploadButtonDisabled: { backgroundColor: '#93c5fd' },
  uploadingRow: { flexDirection: 'row', alignItems: 'center' },
  buttonContentFlex: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonIconSpacing: { marginRight: 8 },
  uploadButtonText: { color: '#ffffff', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#1e293b', marginTop: 16, marginBottom: 16 },
  errorText: { fontSize: 15, color: '#b91c1c', marginBottom: 8, fontWeight: '500' },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 3 },
  cardHeader: { marginBottom: 12 },
  fileName: { fontSize: 19, fontWeight: '700', color: '#1e293b', lineHeight: 24, marginBottom: 4 },
  metaText: { fontSize: 15, color: '#64748b', fontWeight: '500', marginBottom: 10 },
  statusTag: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 2 },
  statusTagText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  verifiedTag: { backgroundColor: '#dcfce7' },
  verifiedTagText: { color: '#15803d' },
  pendingTag: { backgroundColor: '#fef3c7' },
  pendingTagText: { color: '#b45309' },
  actionRequiredTag: { backgroundColor: '#fee2e2' },
  actionRequiredTagText: { color: '#b91c1c' },
  viewButton: { borderWidth: 1.5, borderColor: '#2563eb', borderRadius: 8, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', marginTop: 4, backgroundColor: '#ffffff' },
  viewButtonDisabled: { borderColor: '#e2e8f0' },
  viewButtonText: { fontSize: 15, fontWeight: '700', color: '#2563eb' },
  viewButtonTextDisabled: { color: '#94a3b8' },
  rejectionMessageBox: { backgroundColor: '#fee2e2', borderWidth: 1.5, borderColor: '#fca5a5', borderRadius: 10, padding: 14, marginBottom: 14, marginTop: 4 },
  rejectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  rejectionMessageTitle: { fontSize: 15, fontWeight: '700', color: '#991b1b' },
  rejectionMessageText: { fontSize: 15, color: '#7f1d1d', lineHeight: 22, fontStyle: 'italic' },
  emptyContainerCard: { backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1.5, borderColor: '#e2e8f0', borderStyle: 'dashed', padding: 32, alignItems: 'center', marginTop: 4 },
  emptyIconWrapper: { marginBottom: 12, justifyContent: 'center', alignItems: 'center' },
  emptyMainText: { fontSize: 18, fontWeight: '700', color: '#334155', marginBottom: 6 },
  emptySubText: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },
});