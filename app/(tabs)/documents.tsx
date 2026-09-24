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

// ── COMPREHENSIVE INLINE DOCUMENTS ACCESSIBILITY DICTIONARY ──
const A11Y_DOCS_TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  English: {
    uploadCertLabel: "Upload Disability Certificate",
    uploadCertHint: "Double tap to choose and upload your government disability certificate document.",
    uploadIdLabel: "Upload Identity Proof",
    uploadIdHint: "Double tap to select and upload your national or regional identity proof.",
    uploadOtherLabel: "Upload Other Document",
    uploadOtherHint: "Double tap to select and upload any supplementary documents.",
    uploadingFile: "Uploading document file, please wait...",
    verifiedTag: "Document Verified",
    pendingTag: "Verification Pending",
    actionRequiredTag: "Action Required by Administrator",
    reasonTitle: "Reason for action required",
    viewDocLabel: "View uploaded document file",
    viewDocHint: "Double tap to open this document in your browser.",
    notAvailableLabel: "Document file not available for viewing",
    sessionErrorTitle: "Session Error",
    sessionErrorMsg: "User context not found. Please log in again.",
    uploadedSuccessTitle: "Uploaded!",
    uploadedSuccessMsg: "Your document has been logged into the review verification database pipeline.",
    cannotOpenTitle: "Cannot Open",
    cannotOpenMsg: "Browser failed to resolve target reference URL.",
    loadingDocs: "Loading submitted documents...",
  },
  Hindi: {
    uploadCertLabel: "दिव्यांगता प्रमाणपत्र अपलोड करें",
    uploadCertHint: "अपना सरकारी दिव्यांगता प्रमाणपत्र चुनने और अपलोड करने के लिए दो बार टैप करें।",
    uploadIdLabel: "पहचान प्रमाण अपलोड करें",
    uploadIdHint: "अपना पहचान प्रमाण पत्र चुनने और अपलोड करने के लिए दो बार टैप करें।",
    uploadOtherLabel: "अन्य दस्तावेज़ अपलोड करें",
    uploadOtherHint: "कोई अन्य सहायक दस्तावेज़ चुनने और अपलोड करने के लिए दो बार टैप करें।",
    uploadingFile: "दस्तावेज़ फ़ाइल अपलोड हो रही है, कृपया प्रतीक्षा करें...",
    verifiedTag: "दस्तावेज़ सत्यापित",
    pendingTag: "सत्यापन लंबित",
    actionRequiredTag: "प्रशासक द्वारा कार्रवाई आवश्यक",
    reasonTitle: "कार्रवाई आवश्यक होने का कारण",
    viewDocLabel: "अपलोड किया गया दस्तावेज़ देखें",
    viewDocHint: "ब्राउज़र में इस दस्तावेज़ को खोलने के लिए दो बार टैप करें।",
    notAvailableLabel: "देखने के लिए दस्तावेज़ फ़ाइल उपलब्ध नहीं है",
    sessionErrorTitle: "सत्र त्रुटि",
    sessionErrorMsg: "उपयोगकर्ता प्रोफ़ाइल नहीं मिली। कृपया पुनः लॉगिन करें।",
    uploadedSuccessTitle: "अपलोड सफल!",
    uploadedSuccessMsg: "आपका दस्तावेज़ समीक्षा सत्यापन डेटाबेस में दर्ज कर लिया गया है।",
    cannotOpenTitle: "खोला नहीं जा सका",
    cannotOpenMsg: "ब्राउज़र लिंक खोलने में विफल रहा।",
    loadingDocs: "जमा किए गए दस्तावेज़ लोड हो रहे हैं...",
  },
  Kannada: {
    uploadCertLabel: "ವಿಕಲಾಂಗತೆ ಪ್ರಮಾಣಪತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    uploadCertHint: "ನಿಮ್ಮ ಸರ್ಕಾರಿ ವಿಕಲಾಂಗತೆ ಪ್ರಮಾಣಪತ್ರವನ್ನು ಆಯ್ಕೆ ಮಾಡಲು ಮತ್ತು ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ಎರಡು ಬಾರಿ ಟ್ಯಾಪ್ ಮಾಡಿ.",
    uploadIdLabel: "ಗುರುತಿನ ಪುರಾವೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    uploadIdHint: "ನಿಮ್ಮ ಗುರುತಿನ ಪುರಾವೆ ದಾಖಲೆಯನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ಎರಡು ಬಾರಿ ಟ್ಯಾಪ್ ಮಾಡಿ.",
    uploadOtherLabel: "ಇತರ ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    uploadOtherHint: "ಯಾವುದೇ ಪೂರಕ ದಾಖಲೆಯನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ಎರಡು ಬಾರಿ ಟ್ಯಾಪ್ ಮಾಡಿ.",
    uploadingFile: "ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಆಗುತ್ತಿದೆ, ದಯವಿಟ್ಟು ನಿರೀಕ್ಷಿಸಿ...",
    verifiedTag: "ದಾಖಲೆ ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    pendingTag: "ಪರಿಶೀಲನೆ ಬಾಕಿ ಇದೆ",
    actionRequiredTag: "ನಿರ್ವಾಹಕರಿಂದ ಕ್ರಮ ಅಗತ್ಯವಿದೆ",
    reasonTitle: "ಕ್ರಮದ ಅಗತ್ಯತೆಯ ಕಾರಣ",
    viewDocLabel: "ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ದಾಖಲೆಯನ್ನು ವೀಕ್ಷಿಸಿ",
    viewDocHint: "ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಈ ದಾಖಲೆಯನ್ನು ತೆರೆಯಲು ಎರಡು ಬಾರಿ ಟ್ಯಾಪ್ ಮಾಡಿ.",
    notAvailableLabel: "ವೀಕ್ಷಿಸಲು ದಾಖಲೆ ಫೈಲ್ ಲಭ್ಯವಿಲ್ಲ",
    sessionErrorTitle: "ಸೆಷನ್ ದೋಷ",
    sessionErrorMsg: "ಬಳಕೆದಾರರ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಲಾಗಿನ್ ಮಾಡಿ.",
    uploadedSuccessTitle: "ಅಪ್‌ಲೋಡ್ ಆಗಿದೆ!",
    uploadedSuccessMsg: "ನಿಮ್ಮ ದಾಖಲೆಯನ್ನು ಪರಿಶೀಲನಾ ಪಟ್ಟಿಗೆ ಸೇರಿಸಲಾಗಿದೆ.",
    cannotOpenTitle: "ತೆರೆಯಲು ಸಾಧ್ಯವಿಲ್ಲ",
    cannotOpenMsg: "ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಈ ಲಿಂಕ್ ತೆರೆಯಲು ವಿಫಲವಾಗಿದೆ.",
    loadingDocs: "ಸಲ್ಲಿಸಿದ ದಾಖಲೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
  },
  Tamil: {
    uploadCertLabel: "மாற்றுத்திறனாளி சான்றிதழைப் பதிவேற்றவும்",
    uploadCertHint: "உங்கள் அரசு மாற்றுத்திறனாளி சான்றிதழைத் தேர்ந்தெடுத்து பதிவேற்ற இருமுறை தட்டவும்.",
    uploadIdLabel: "அடையாளச் சான்றைப் பதிவேற்றவும்",
    uploadIdHint: "உங்கள் அடையாளச் சான்றைத் தேர்ந்தெடுத்து பதிவேற்ற இருமுறை தட்டவும்.",
    uploadOtherLabel: "பிற ஆவணங்களைப் பதிவேற்றவும்",
    uploadOtherHint: "கூடுதல் ஆவணங்களைத் தேர்ந்தெடுத்து பதிவேற்ற இருமுறை தட்டவும்.",
    uploadingFile: "ஆவணம் பதிவேற்றப்படுகிறது, தயவுசெய்து காத்திருக்கவும்...",
    verifiedTag: "ஆவணம் சரிபார்க்கப்பட்டது",
    pendingTag: "சரிபார்ப்பு நிலுவையில் உள்ளது",
    actionRequiredTag: "நிர்வாகி நடவடிக்கை தேவை",
    reasonTitle: "நடவடிக்கை தேவைக்கான காரணம்",
    viewDocLabel: "பதிவேற்றப்பட்ட ஆவணத்தைப் பார்க்கவும்",
    viewDocHint: "இந்த ஆவணத்தை உலாவியில் திறக்க இருமுறை தட்டவும்.",
    notAvailableLabel: "பார்வையிட ஆவணக் கோப்பு கிடைக்கவில்லை",
    sessionErrorTitle: "அமர்வுப் பிழை",
    sessionErrorMsg: "பயனர் விவரம் கிடைக்கவில்லை. மீண்டும் உள்நுழையவும்.",
    uploadedSuccessTitle: "பதிவேற்றப்பட்டது!",
    uploadedSuccessMsg: "உங்கள் ஆவணம் சரிபார்ப்பு வரிசையில் வெற்றிகரமாகச் சேர்க்கப்பட்டது.",
    cannotOpenTitle: "திறக்க முடியவில்லை",
    cannotOpenMsg: "இணைப்பை உலாவியில் திறக்க முடியவில்லை.",
    loadingDocs: "சமர்ப்பிக்கப்பட்ட ஆவணங்கள் ஏற்றப்படுகின்றன...",
  },
  Telugu: {
    uploadCertLabel: "దివ్యాంగుల ధృవీకరణ పత్రాన్ని అప్‌లోడ్ చేయండి",
    uploadCertHint: "మీ ప్రభుత్వ ధృవీకరణ పత్రాన్ని ఎంచుకుని అప్‌లోడ్ చేయడానికి రెండుసార్లు నొక్కండి.",
    uploadIdLabel: "గుర్తింపు కార్డును అప్‌లోడ్ చేయండి",
    uploadIdHint: "మీ గుర్తింపు రుజువును ఎంచుకుని అప్‌లోడ్ చేయడానికి రెండుసార్లు నొక్కండి.",
    uploadOtherLabel: "ఇతర పత్రాలను అప్‌లోడ్ చేయండి",
    uploadOtherHint: "ఇతర సహాయక పత్రాలను ఎంచుకుని అప్‌లోడ్ చేయడానికి రెండుసార్లు నొక్కండి.",
    uploadingFile: "పత్రం అప్‌లోడ్ అవుతోంది, దయచేసి వేచి ఉండండి...",
    verifiedTag: "పత్రం ధృవీకరించబడింది",
    pendingTag: "ధృవీకరణ పెండింగ్‌లో ఉంది",
    actionRequiredTag: "నిర్వాహకుల చర్య అవసరం",
    reasonTitle: "చర్య అవసరానికి గల కారణం",
    viewDocLabel: "అప్‌లోడ్ చేసిన పత్రాన్ని చూడండి",
    viewDocHint: "బ్రౌజర్‌లో ఈ పత్రాన్ని తెరవడానికి రెండుసార్లు నొక్కండి.",
    notAvailableLabel: "వీక్షించడానికి పత్రం ఫైల్ అందుబాటులో లేదు",
    sessionErrorTitle: "సెషన్ లోపం",
    sessionErrorMsg: "వినియోగదారు వివరాలు లభించలేదు. దయచేసి మళ్ళీ లాగిన్ అవ్వండి.",
    uploadedSuccessTitle: "అప్‌లోడ్ పూర్తయింది!",
    uploadedSuccessMsg: "మీ పత్రం సమీక్ష ధృవీకరణ కోసం విజయవంతంగా నమోదు చేయబడింది.",
    cannotOpenTitle: "తెరవడం సాధ్యం కాలేదు",
    cannotOpenMsg: "బ్రౌజర్‌లో లింక్ తెరవడం విఫలమైంది.",
    loadingDocs: "సమర్పించిన పత్రాలు లోడ్ అవుతున్నాయి...",
  },
  Bengali: {
    uploadCertLabel: "প্রতিবন্ধী শংসাপত্র আপলোড করুন",
    uploadCertHint: "আপনার সরকারি প্রতিবন্ধী শংসাপত্র বেছে নিয়ে আপলোড করতে দুবার ট্যাপ করুন।",
    uploadIdLabel: "পরিচয় প্রমাণপত্র আপলোড করুন",
    uploadIdHint: "আপনার পরিচয়পত্র বেছে নিয়ে আপলোড করতে দুবার ট্যাপ করুন।",
    uploadOtherLabel: "অন্যান্য নথি আপলোড করুন",
    uploadOtherHint: "যেকোনো অতিরিক্ত নথি বেছে নিয়ে আপলোড করতে দুবার ট্যাপ করুন।",
    uploadingFile: "নথি আপলোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...",
    verifiedTag: "নথি যাচাই সম্পন্ন",
    pendingTag: "যাচাইকরণ প্রক্রিয়াধীন",
    actionRequiredTag: "প্রশাসকের পদক্ষেপ প্রয়োজন",
    reasonTitle: "পদক্ষেপের কারণ",
    viewDocLabel: "আপলোড করা নথি দেখুন",
    viewDocHint: "ব্রাউজারে এই নথিটি খুলতে দুবার ট্যাপ করুন।",
    notAvailableLabel: "দেখার জন্য নথিটি উপলব্ধ নেই",
    sessionErrorTitle: "সেশন ত্রুটি",
    sessionErrorMsg: "ব্যবহারকারীর বিবরণ পাওয়া যায়নি। অনুগ্রহ করে আবার লগ ইন করুন।",
    uploadedSuccessTitle: "আপলোড সম্পন্ন!",
    uploadedSuccessMsg: "আপনার নথিটি যাচাইকরণের জন্য সিস্টেমে যুক্ত করা হয়েছে।",
    cannotOpenTitle: "খোলা যাচ্ছে না",
    cannotOpenMsg: "ব্রাউজারে লিংকটি খুলতে ব্যর্থ হয়েছে।",
    loadingDocs: "জমা দেওয়া নথিগুলি লোড হচ্ছে...",
  },
  Marathi: {
    uploadCertLabel: "दिव्यांगत्व प्रमाणपत्र अपलोड करा",
    uploadCertHint: "तुमचे शासकीय दिव्यांगत्व प्रमाणपत्र निवडून अपलोड करण्यासाठी दोनदा टॅप करा.",
    uploadIdLabel: "ओळखपत्र पुरावा अपलोड करा",
    uploadIdHint: "तुमचे ओळखपत्र निवडून अपलोड करण्यासाठी दोनदा टॅप करा.",
    uploadOtherLabel: "इतर कागदपत्रे अपलोड करा",
    uploadOtherHint: "इतर पूरक कागदपत्रे निवडून अपलोड करण्यासाठी दोनदा टॅप करा.",
    uploadingFile: "कागदपत्र अपलोड होत आहे, कृपया प्रतीक्षा करा...",
    verifiedTag: "कागदपत्र पडताळणी पूर्ण",
    pendingTag: "पडताळणी प्रलंबित",
    actionRequiredTag: "प्रशासकाची कारवाई आवश्यक",
    reasonTitle: "कारवाई आवश्यक असण्याचे कारण",
    viewDocLabel: "अपलोड केलेले कागदपत्र पहा",
    viewDocHint: "हे कागदपत्र ब्राउझरमध्ये उघडण्यासाठी दोनदा टॅप करा.",
    notAvailableLabel: "पाहण्यासाठी कागदपत्र उपलब्ध नाही",
    sessionErrorTitle: "सत्र त्रुटी",
    sessionErrorMsg: "वापरकर्ता तपशील आढळला नाही. कृपया पुन्हा लॉग इन करा.",
    uploadedSuccessTitle: "अपलोड यशस्वी!",
    uploadedSuccessMsg: "तुमचे कागदपत्र पडताळणी डेटाबेसमध्ये यशस्वीरित्या नोंदवले गेले आहे.",
    cannotOpenTitle: "उघडता येत नाही",
    cannotOpenMsg: "ब्राउझरमध्ये लिंक उघडणे अयशस्वी झाले.",
    loadingDocs: "सादर केलेली कागदपत्रे लोड होत आहेत...",
  }
};

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [appLang, setAppLang] = useState<AppLanguage>('English');

  const t = appDictionary[appLang] || appDictionary.English;
  const a11y = A11Y_DOCS_TRANSLATIONS[appLang] || A11Y_DOCS_TRANSLATIONS.English;

  const fetchUserDocuments = async (userId: string) => {
    try {
      const rawUser = await AsyncStorage.getItem('loggedInUser');
      const parsedUser = rawUser ? JSON.parse(rawUser) : {};
      const userPhone = String(parsedUser.phone || '').trim().toLowerCase();
      const cleanUserId = String(userId).trim().toLowerCase();

      const response = await fetch(`${SCRIPT_URL}?action=getDocuments`, { redirect: 'follow' });
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

  function getStatusVoiceLabel(status: DocumentStatus): string {
    if (status === 'Verified') return a11y.verifiedTag;
    if (status === 'Action Required') return a11y.actionRequiredTag;
    return a11y.pendingTag;
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
      Alert.alert(a11y.sessionErrorTitle, a11y.sessionErrorMsg);
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

      // 1. Enforce 5 MB maximum size limit to protect free tier quotas
      if (file.size && file.size > 5 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Please select a document smaller than 5 MB.');
        return;
      }

      // 2. Validate allowed file extensions (PDF, JPG, JPEG, PNG)
      const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
      const fileExt = (file.name || '').split('.').pop()?.toLowerCase() || '';

      if (!allowedExtensions.includes(fileExt)) {
        Alert.alert('Invalid Format', 'Only PDF, JPG, and PNG documents are supported.');
        return;
      }

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
        redirect: 'follow',
      });
      
      const sheetResult = await sheetResponse.json();

      if (sheetResult.success) {
        Alert.alert(a11y.uploadedSuccessTitle, a11y.uploadedSuccessMsg);
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
        Alert.alert(a11y.cannotOpenTitle, a11y.cannotOpenMsg);
      }
    } else {
      Alert.alert(a11y.notAvailableLabel, '');
    }
  };

  const getUploadButtonAccessibility = (type: DocumentType) => {
    if (type === 'Disability Certificate') {
      return { label: a11y.uploadCertLabel, hint: a11y.uploadCertHint };
    }
    if (type === 'ID Proof') {
      return { label: a11y.uploadIdLabel, hint: a11y.uploadIdHint };
    }
    return { label: a11y.uploadOtherLabel, hint: a11y.uploadOtherHint };
  };

  return (
    <ScrollView 
      style={styles.scrollViewOuter} 
      contentContainerStyle={styles.container} 
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title} accessibilityRole="header">
        {t.docTitle || "Documents Hub"}
      </Text>
      <Text style={styles.subtitle}>
        {t.docSubtitle || "Manage and review verification states"}
      </Text>

      {/* Upload Buttons Hub */}
      <View style={styles.uploadHubContainer}>
        {(['Disability Certificate', 'ID Proof', 'Other Document'] as DocumentType[]).map((type) => {
          const a11yProps = getUploadButtonAccessibility(type);
          const isCurrentUploading = uploadingType === type;

          return (
            <TouchableOpacity
              key={type}
              style={[styles.uploadButton, isCurrentUploading && styles.uploadButtonDisabled]}
              accessibilityRole="button"
              accessibilityLabel={isCurrentUploading ? a11y.uploadingFile : a11yProps.label}
              accessibilityHint={a11yProps.hint}
              disabled={uploadingType !== null}
              onPress={() => handleUpload(type)}
            >
              {isCurrentUploading ? (
                <View style={styles.uploadingRow} accessibilityLiveRegion="assertive">
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={styles.uploadButtonText}>  {a11y.uploadingFile}</Text>
                </View>
              ) : (
                <View style={styles.buttonContentFlex}>
                  <Ionicons name="cloud-upload-outline" size={20} color="#ffffff" style={styles.buttonIconSpacing} aria-hidden={true} />
                  <Text style={styles.uploadButtonText}>
                    {type === 'Disability Certificate' 
                      ? a11y.uploadCertLabel 
                      : type === 'ID Proof' 
                      ? a11y.uploadIdLabel 
                      : a11y.uploadOtherLabel}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {uploadError ? (
        <Text style={styles.errorText} accessibilityLiveRegion="assertive">
          {uploadError}
        </Text>
      ) : null}

      <Text style={styles.sectionTitle} accessibilityRole="header">
        {t.uploadBtn || "Uploaded Documents"}
      </Text>

      {loading ? (
        <View style={styles.loadingContainer} accessibilityLiveRegion="polite">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>{a11y.loadingDocs}</Text>
        </View>
      ) : documents.length === 0 ? (
        <View style={styles.emptyContainerCard} accessibilityRole="text">
          <View style={styles.emptyIconWrapper} aria-hidden={true}>
            <Ionicons name="folder-open-outline" size={44} color="#94a3b8" />
          </View>
          <Text style={styles.emptyMainText}>{t.uploadStatus || "No documents uploaded yet"}</Text>
          <Text style={styles.emptySubText}>{t.quickActionSecureText || "Upload proof to expedite verification checks"}</Text>
        </View>
      ) : (
        documents.map((document) => {
          const statusStyle = getStatusStyle(document.status);
          const voiceStatus = getStatusVoiceLabel(document.status);
          const cardVoiceLabel = `${document.fileName}, ${document.documentType}. ${voiceStatus}. ${
            document.status === 'Action Required' && document.adminMessage ? `${a11y.reasonTitle}: ${document.adminMessage}` : ''
          }`;

          return (
            <View 
              key={document.documentId} 
              style={styles.card} 
              accessibilityRole="summary"
              accessibilityLabel={cardVoiceLabel}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.fileName}>{document.fileName}</Text>
                <Text style={styles.metaText}>{document.documentType}</Text>
                
                <View style={[styles.statusTag, statusStyle.container]} aria-hidden={true}>
                  <Text style={[styles.statusTagText, statusStyle.text]}>{document.status}</Text>
                </View>
              </View>

              {document.status === 'Action Required' && document.adminMessage ? (
                <View style={styles.rejectionMessageBox} aria-hidden={true}>
                  <View style={styles.rejectionTitleRow}>
                    <Ionicons name="alert-circle-outline" size={16} color="#991b1b" style={{ marginRight: 6 }} />
                    <Text style={styles.rejectionMessageTitle}>{a11y.reasonTitle}:</Text>
                  </View>
                  <Text style={styles.rejectionMessageText}>"{document.adminMessage}"</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.viewButton, !document.fileUrl && styles.viewButtonDisabled]}
                disabled={!document.fileUrl}
                onPress={() => handleView(document)}
                accessibilityRole="link"
                accessibilityLabel={document.fileUrl ? `${a11y.viewDocLabel}: ${document.fileName}` : a11y.notAvailableLabel}
                accessibilityHint={a11y.viewDocHint}
              >
                <View style={styles.buttonContentFlex}>
                  <Ionicons 
                    name="eye-outline" 
                    size={18} 
                    color={document.fileUrl ? '#2563eb' : '#94a3b8'} 
                    style={styles.buttonIconSpacing} 
                    aria-hidden={true}
                  />
                  <Text style={[styles.viewButtonText, !document.fileUrl && styles.viewButtonTextDisabled]}>
                    {document.fileUrl ? (t.viewSaved || 'View Attached Document') : a11y.notAvailableLabel}
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
  uploadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonContentFlex: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonIconSpacing: { marginRight: 8 },
  uploadButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#1e293b', marginTop: 16, marginBottom: 16 },
  errorText: { fontSize: 15, color: '#b91c1c', marginBottom: 8, fontWeight: '500' },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  loadingText: { fontSize: 15, color: '#64748b', marginTop: 10, fontWeight: '500' },
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
  viewButton: { borderWidth: 1.5, borderColor: '#2563eb', borderRadius: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', marginTop: 4, backgroundColor: '#ffffff', minHeight: 48 },
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