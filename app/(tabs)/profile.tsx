import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,

  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAccessibility } from '../../context/AccessibilityContext';
import { appDictionary, AppLanguage } from '../../lib/appTranslations';

type DropdownOption = string | { label: string; value: string };

type DropdownFieldProps = {
  label: string;
  value: string;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  placeholder: string;
  getFontSize?: (base: number) => number;
};

function DropdownField({ label, value, options, onSelect, placeholder, getFontSize = (s) => s }: DropdownFieldProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((opt) => 
    typeof opt === 'string' ? opt === value : opt.value === value
  );

  const displayValue = selectedOption 
    ? (typeof selectedOption === 'string' ? selectedOption : selectedOption.label)
    : placeholder;

  return (
    <View style={styles.fieldGroup}>
      {label ? (
        <Text style={[styles.label, { fontSize: getFontSize(16) }]} aria-hidden={true}>
          {label}
        </Text>
      ) : null}
      
      <Pressable
        style={[styles.inputLike, open && styles.inputFocused]}
        onPress={() => setOpen(true)}
        accessibilityRole="combobox"
        accessibilityLabel={label ? `${label}, selected option: ${displayValue}` : displayValue}
        accessibilityHint="Double tap to open selection menu"
        accessibilityState={{ expanded: open }}
      >
        <Text style={[styles.inputText, { fontSize: getFontSize(16) }, !value && styles.placeholder]}>
          {displayValue}
        </Text>
        <Ionicons name="chevron-down-outline" size={20} color="#334155" style={styles.rightIcon} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable 
          style={styles.modalBackdrop} 
          onPress={() => setOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Close selection menu"
        >
          <View style={styles.modalCard} accessibilityViewIsModal={true}>
            {label ? (
              <Text style={[styles.modalTitle, { fontSize: getFontSize(18) }]} accessibilityRole="header">
                {label}
              </Text>
            ) : null}
            <ScrollView>
              {options.map((option) => {
                const optValue = typeof option === 'string' ? option : option.value;
                const optLabel = typeof option === 'string' ? option : option.label;
                const isSelected = value === optValue;

                return (
                  <Pressable
                    key={optValue}
                    style={[styles.optionButton, isSelected && styles.optionButtonActive]}
                    onPress={() => {
                      onSelect(optValue);
                      setOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={optLabel}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text style={[styles.optionText, { fontSize: getFontSize(16) }, isSelected && styles.optionTextActive]}>
                      {optLabel}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color="#1d4ed8" />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
// List of supported languages for the selection modal
const LANGUAGES = [
  { code: 'English', label: 'English' },
  { code: 'Hindi', label: 'हिन्दी' },
  { code: 'Tamil', label: 'தமிழ்' },
  { code: 'Telugu', label: 'తెలుగు' },
  { code: 'Bengali', label: 'বাংলা' },
  { code: 'Marathi', label: 'मराठी' },
  { code: 'Kannada', label: 'ಕನ್ನಡ' }
];

const RAW_DISABILITY_TYPES = [
  'Locomotor Disability',
  'Visual Impairment',
  'Hearing Impairment',
  'Intellectual Disability',
  'Autism Spectrum Disorder',
  'Multiple Disabilities'
];

const COMPLETE_DISABILITY_TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  English: {
    'Locomotor Disability': 'Locomotor Disability',
    'Visual Impairment': 'Visual Impairment',
    'Hearing Impairment': 'Hearing Impairment',
    'Intellectual Disability': 'Intellectual Disability',
    'Autism Spectrum Disorder': 'Autism Spectrum Disorder',
    'Multiple Disabilities': 'Multiple Disabilities',
  },
  Kannada: {
    'Locomotor Disability': 'ಚಲನವಲನ ವಿಕಲಾಂಗತೆ (Locomotor Disability)',
    'Visual Impairment': 'ದೃಷ್ಟಿ ದೋಷ (Visual Impairment)',
    'Hearing Impairment': 'ಶ್ರವಣ ದೋಷ (Hearing Impairment)',
    'Intellectual Disability': 'ಬೌದ್ಧಿಕ ವಿಕಲಾಂಗತೆ (Intellectual Disability)',
    'Autism Spectrum Disorder': 'ಆಟಿಸಂ ಸ್ಪೆಕ್ಟ್ರಮ್ ಡಿಸಾರ್ಡರ್ (Autism Spectrum)',
    'Multiple Disabilities': 'ಬಹು ವಿಕಲಾಂಗತೆಗಳು (Multiple Disabilities)',
  },
  Hindi: {
    'Locomotor Disability': 'लोकोमोटर दिव्यांगता (Locomotor Disability)',
    'Visual Impairment': 'दृष्टिबाधित (Visual Impairment)',
    'Hearing Impairment': 'श्रवण बाधित (Hearing Impairment)',
    'Intellectual Disability': 'बौद्धिक दिव्यांगता (Intellectual Disability)',
    'Autism Spectrum Disorder': 'ऑटिज्म स्पेक्ट्रम डिसऑर्डर (Autism Spectrum)',
    'Multiple Disabilities': 'बहु-दिव्यांगता (Multiple Disabilities)',
  },
  Tamil: {
    'Locomotor Disability': 'இயக்கக் குறைபாடு (Locomotor Disability)',
    'Visual Impairment': 'பார்வைக் குறைபாடு (Visual Impairment)',
    'Hearing Impairment': 'கேள்விக் குறைபாடு (Hearing Impairment)',
    'Intellectual Disability': 'அறிவுசார் குறைபாடு (Intellectual Disability)',
    'Autism Spectrum Disorder': 'ஆட்டிசம் குறைபாடு (Autism Spectrum)',
    'Multiple Disabilities': 'பல்வேறு குறைபாடுகள் (Multiple Disabilities)',
  },
  Telugu: {
    'Locomotor Disability': 'చలన వైకల్యం (Locomotor Disability)',
    'Visual Impairment': 'దృష్టి లోపం (Visual Impairment)',
    'Hearing Impairment': 'వినికిడి లోపం (Hearing Impairment)',
    'Intellectual Disability': 'మేధో వైకల్యం (Intellectual Disability)',
    'Autism Spectrum Disorder': 'ఆటిజం స్పెక్ట్రమ్ డిజార్డర్ (Autism Spectrum)',
    'Multiple Disabilities': 'బహుళ వైకల్యాలు (Multiple Disabilities)',
  },
  Bengali: {
    'Locomotor Disability': 'লোকোমোটর প্রতিবন্ধকতা (Locomotor Disability)',
    'Visual Impairment': 'দৃষ্টি প্রতিবন্ধকতা (Visual Impairment)',
    'Hearing Impairment': 'শ্রবণ প্রতিবন্ধকতা (Hearing Impairment)',
    'Intellectual Disability': 'বুদ্ধিবৃত্তিক প্রতিবন্ধকতা (Intellectual Disability)',
    'Autism Spectrum Disorder': 'অটিজম স্পেকট্রাম ডিসঅর্ডার (Autism Spectrum)',
    'Multiple Disabilities': 'একাধিক প্রতিবন্ধকতা (Multiple Disabilities)',
  },
  Marathi: {
    'Locomotor Disability': 'अस्थिव्यंग दिव्यांगत्व (Locomotor Disability)',
    'Visual Impairment': 'दृष्टिदोष (Visual Impairment)',
    'Hearing Impairment': 'कर्णबधिरता (Hearing Impairment)',
    'Intellectual Disability': 'बौद्धिक दिव्यांगत्व (Intellectual Disability)',
    'Autism Spectrum Disorder': 'ऑटिझम स्पेक्ट्रम डिसऑर्डर (Autism Spectrum)',
    'Multiple Disabilities': 'बहुविकलांगत्व (Multiple Disabilities)',
  },
};



// Screen-specific language dictionaries for titles, labels, and popups
const profileTranslations = {
  English: {
    editProfile: "Edit Profile Identity Fields",
    viewSaved: "View Saved Welfare Schemes",
    changeLang: "Change Application Language",
    largeFont: "Large Typography Text Mode",
    contactHelpline: "Contact NGO Toll-Free Helpline",
    raiseGrievance: "Log an Official Support Request",
    idKey: "UID/UDID",
    mobile: "Mobile Contact",
    emailStr: "Email Address",
    langStr: "Language Layer",
    modalEditTitle: "Update Profile Fields",
    modalNameLabel: "Full Applicant Name",
    modalEmailLabel: "Email Address Connection",
    modalSaveBtn: "Save Profile Modifications",
    modalCancelBtn: "Cancel and Close",
    modalLangTitle: "Choose Language Variant",
    modalLangDismiss: "Dismiss Selection",
    modalTicketTitle: "File a Support Request",
    modalTicketDesc: "Describe the issue with your paperwork, pension processing, or application states below:",
    modalTicketPlaceholder: "Type out your support details clearly...",
    modalTicketSubmit: "Submit Ticket Entry",
  },
  Hindi: {
    editProfile: "प्रोफ़ाइल पहचान फ़ील्ड संपादित करें",
    viewSaved: "सहेजी गई कल्याण योजनाएं देखें",
    changeLang: "एप्लिकेशन की भाषा बदलें",
    largeFont: "बड़ी टाइपोग्राफी टेक्स्ट मोड",
    contactHelpline: "एनजीओ टोल-फ्री हेल्पलाइन से संपर्क करें",
    raiseGrievance: "आधिकारिक सहायता अनुरोध दर्ज करें",
    idKey: "आईडी (UID/UDID)",
    mobile: "मोबाइल संपर्क",
    emailStr: "ईमेल पता",
    langStr: "भाषा परत",
    modalEditTitle: "प्रोफ़ाइल फ़ील्ड अपडेट करें",
    modalNameLabel: "आवेदक का पूरा नाम",
    modalEmailLabel: "ईमेल पता कनेक्शन",
    modalSaveBtn: "प्रोफ़ाइल संशोधन सहेजें",
    modalCancelBtn: "रद्द करें और बंद करें",
    modalLangTitle: "भाषा संस्करण चुनें",
    modalLangDismiss: "चयन खारिज करें",
    modalTicketTitle: "सहायता अनुरोध दर्ज करें",
    modalTicketDesc: "अपने कागजी काम, पेंशन प्रसंस्करण, या आवेदन की स्थिति के साथ आ रही समस्या का वर्णन नीचे करें:",
    modalTicketPlaceholder: "अपनी सहायता का विवरण स्पष्ट रूप से टाइप करें...",
    modalTicketSubmit: "टिकट प्रविष्टि सबमिट करें",
  },
  Kannada: {
    editProfile: "ಪ್ರೊಫೈಲ್ ವಿವರಗಳನ್ನು ಸಂಪಾದಿಸಿ",
    viewSaved: "ಉಳಿಸಲಾದ ಕಲ್ಯಾಣ ಯೋಜನೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
    changeLang: "ಅಪ್ಲಿಕೇಶನ್ ಭಾಷೆಯನ್ನು ಬದಲಾಯಿಸಿ",
    largeFont: "ದೊಡ್ಡ ಅಕ್ಷರಗಳ ಪಠ್ಯ ಮೋಡ್",
    contactHelpline: "ಸಹಾಯವಾಣಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ",
    raiseGrievance: "ಅಧಿಕೃತ ಬೆಂಬಲ ವಿನಂತಿಯನ್ನು ಸಲ್ಲಿಸಿ",
    idKey: "ಐಡಿ ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ(UID/UDID)",
    mobile: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
    emailStr: "ಇಮೇಲ್ ವಿಳಾಸ",
    langStr: "ಭಾಷೆ",
    modalEditTitle: "ಪ್ರೊಫೈಲ್ ಕ್ಷೇತ್ರಗಳನ್ನು ನವೀಕರಿಸಿ",
    modalNameLabel: "ಅರ್ಜಿದಾರರ ಪೂರ್ಣ ಹೆಸರು",
    modalEmailLabel: "ಇಮೇಲ್ ವಿಳಾಸ ಸಂಪರ್ಕ",
    modalSaveBtn: "ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ",
    modalCancelBtn: "ರದ್ದುಗೊಳಿಸಿ ಮತ್ತು ಮುಚ್ಚಿ",
    modalLangTitle: "ಭಾಷಾ ರೂಪಾಂತರವನ್ನು ಆರಿಸಿ",
    modalLangDismiss: "ಆಯ್ಕೆಯನ್ನು ವಜಾಗೊಳಿಸಿ",
    modalTicketTitle: "ಬೆಂಬಲ ವಿನಂತಿಯನ್ನು ಸಲ್ಲಿಸಿ",
    modalTicketDesc: "ನಿಮ್ಮ ದಾಖಲೆಗಳು, ಪೆನ್ಷನ್ ಪ್ರಕ್ರಿಯೆ ಅಥವಾ ಅಪ್ಲಿಕೇಶನ್ ಸ್ಥಿತಿಯ ಸಮಸ್ಯೆಯನ್ನು ಕೆಳಗೆ ವಿವರಿಸಿ:",    
    modalTicketPlaceholder: "ನಿಮ್ಮ ಬೆಂಬಲ ವಿವರಗಳನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಟೈಪ್ ಮಾಡಿ...",
    modalTicketSubmit: "ವಿನಂತಿಯನ್ನು ಸಲ್ಲಿಸಿ",
  },
  Telugu: {
    editProfile: "ప్రొఫైల్ గుర్తింపు ఫీల్డ్‌లను సవరించండి",
    viewSaved: "సేవ్ చేసిన సంక్షేమ పథకాలను వీక్షించండి",
    changeLang: "అప్లికేషన్ భాషను మార్చండి",
    largeFont: "పెద్ద టైపోగ్రఫీ టెక్స్ట్ మోడ్",
    contactHelpline: "NGO ఉచిత హెల్ప్‌లైన్‌ను సంప్రదించండి",
    raiseGrievance: "అధికారిక మద్దతు అభ్యర్థనను నమోదు చేయండి",
    idKey: "ఐడి సూచన కీ(UID/UDID)",
    mobile: "మొబైల్ సంప్రదింపు",
    emailStr: "ఇమెయిల్ చిరునామా",
    langStr: "భాషా శ్రేణి",
    modalEditTitle: "ప్రొఫైల్ ఫీల్డ్‌లను అప్‌డేట్ చేయండి",
    modalNameLabel: "దరఖాస్తుదారు పూర్తి పేరు",
    modalEmailLabel: "ఇమెయిల్ చిరునామా అనుసంధానం",
    modalSaveBtn: "ప్రొఫైల్ సవరణలను సేవ్ చేయి",
    modalCancelBtn: "రద్దు చేసి మూసివేయి",
    modalLangTitle: "భాషను ఎంచుకోండి",
    modalLangDismiss: "ఎంపికను విస్మరించు",
    modalTicketTitle: "మద్దతు అభ్యర్థనను ఫైల్ చేయండి",
    modalTicketDesc: "మీ పత్రాలు, పెన్షన్ ప్రాసెసింగ్ లేదా అప్లికేషన్ స్థితిగతుల సమస్యను కింద వివరించండి:", 
    modalTicketSubmit: "టికెట్ ఎంట్రీని సమర్పించండి",
  },
  Tamil: {
    editProfile: "சுயவிவரப் புலங்களைத் திருத்தவும்",
    viewSaved: "சேமிக்கப்பட்ட நலத்திட்டங்களைப் பார்க்கவும்",
    changeLang: "செயலி மொழியை மாற்றவும்",
    largeFont: "பெரிய எழுத்து உரை முறைமை",
    contactHelpline: "உதவி எண்களை அழைக்கவும்",
    raiseGrievance: "ஆதரவு கோரிக்கையைப் பதிவு செய்யவும்",
    idKey: "அடையாளக் குறிப்பு எண்(UID/UDID)",
    mobile: "கைபேசி எண்",
    emailStr: "மின்னஞ்சல் முகவரி",
    langStr: "மொழி",
    modalEditTitle: "சுயவிவரப் புலங்களை மாற்றியமைக்கவும்",
    modalNameLabel: "விண்ணப்பதாரரின் முழு பெயர்",
    modalEmailLabel: "மின்னஞ்சல் முகவரி இணைப்பு",
    modalSaveBtn: "சுயவிவர மாற்றங்களைச் சேमी",
    modalCancelBtn: "ரத்து செய்து மூடவும்",
    modalLangTitle: "மொழியைத் தேர்ந்தெடுக்கவும்",
    modalLangDismiss: "தேர்வை ரத்துசெய்",
    modalTicketTitle: "ஆதரவு கோரிக்கையை சமர்ப்பிக்கவும்",
    modalTicketDesc: "உங்கள் ஆவணங்கள், ஓய்வூதியச் செயலாக்கம் किंवा விண்ணப்ப நிலை பற்றிய சிக்கலைக் கீழே விவரிக்கவும்:",
    modalTicketPlaceholder: "உங்கள் ஆதரவு விவரங்களைத் தெளிவாக தட்டச்சு செய்யவும்...",
    modalTicketSubmit: "கோரிக்கையைச் சமர்ப்பிக்கவும்",
  },
  Bengali: {
    editProfile: "প্রোফাইল ক্ষেত্র সম্পাদনা করুন",
    viewSaved: "সংরক্ষিত কল্যাণ স্কিম দেখুন", 
    changeLang: "অ্যাপ্লিকেশনের ভাষা পরিবর্তন করুন",
    largeFont: "বড় টাইপোগ্রাফি টেক্সট মোড",
    contactHelpline: "এনজিও টোল-ফ্রি হেল্পলাইনে যোগাযোগ করুন",
    raiseGrievance: "একটি অফিশিয়াল সমর্থন অনুরোধ নথিভুক্ত করুন",
    idKey: "আইডি রেফারেন্স কী(UID/UDID)",
    mobile: "মোবাইল যোগাযোগ",
    emailStr: "ইমেল ঠিকানা",
    langStr: "ভাষা স্তর",
    modalEditTitle: "প্রোফাইল ক্ষেত্র করুন",
    modalNameLabel: "আবেদনকারীর পুরো নাম",
    modalEmailLabel: "ইমেল ঠিকানা সংযোগ",
    modalSaveBtn: "প্রোফাইল সংশোধন সংরক্ষণ করুন",
    modalCancelBtn: "বাতিল করুন এবং বন্ধ করুন",
    modalLangTitle: "ভাষা সংস্করণ নির্বাচন করুন", 
    modalLangDismiss: "নির্বাচন খারিজ করুন",
    modalTicketTitle: "সহায়তার অনুরোধ ফাইল করুন",
    modalTicketDesc: "কাগজপত্রের সমস্যা, পেনশন প্রক্রিয়াকরণ, বা আবেদনের স্থিতি নীচে বর্ণনা করুন:",
    modalTicketPlaceholder: "আপনার সমর্থনের বিবরণ স্পষ্টভাবে টাইপ করুন...",
    modalTicketSubmit: "টিকিট এন্ট্রি জমা দিন",
  },
  Marathi: {
    editProfile: "प्रोफाइल ओळख फील्ड संपादित करा",
    viewSaved: "जतन केलेल्या कल्याणकारी योजना पहा",
    changeLang: "ॲप्लिकेशनची भाषा बदला",
    largeFont: "मोठा टायपोग्राफी टेक्स्ट मोड", 
    contactHelpline: "एनजीओ टोल-फ्री हेल्पलाइनशी संपर्क साधा",
    raiseGrievance: "अधिकृत समर्थन विनंती नोंदवा",
    idKey: "आयडी संदर्भ की(UID/UDID)",
    mobile: "मोबाईल संपर्क",
    emailStr: "ईमेल पत्ता",
    langStr: "भाषा स्तर",
    modalEditTitle: "प्रोफाइल फील्ड अपडेट करा",
    modalNameLabel: "अर्जदाराचे पूर्ण नाव",
    modalEmailLabel: "ईमेल पत्ता कनेक्शन",
    modalSaveBtn: "प्रोफाइल बदल जतन करा",
    modalCancelBtn: "रद्द करा आणि बंद करा",
    modalLangTitle: "भाषा पर्याय निवडा",
    modalLangDismiss: "निवड रद्द करा",
    modalTicketTitle: "समर्थन विनंती दाखल करा",
    modalTicketDesc: "तुमच्या कागदपत्रांमधील समस्या, पेन्शन प्रक्रिया किंवा अर्जाची स्थिती खाली तपशीलवार लिहा:",
    modalTicketPlaceholder: "तुमचा तपशील स्पष्टपणे टाईप करा...",
    modalTicketSubmit: "तिकीट नोंदणी सबमिट करा",
  }
};

export default function ProfileScreen() {
  const router = useRouter();
  const { fontLarge, toggleFontLarge, getFontSize } = useAccessibility(); // Sizing states from accessibility context
  
  // App profile display fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [disabilityType, setDisabilityType] = useState('');
  const [uid, setUid] = useState('');
  const [language, setLanguage] = useState('English');
  const [appLang, setAppLang] = useState<AppLanguage>('English');

  // Popup visibility flags
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [grievanceModalVisible, setGrievanceModalVisible] = useState(false);
  const [grievanceText, setGrievanceText] = useState('');
  const [ngoId, setNgoId] = useState('CENTRAL_POOL');

  // Form input field temporary buffers
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editdisabilityType, seteditdisabilityType] = useState('');
  const [EditUid, setEditUid] = useState('');



      const disabilityTypeOptions = useMemo(() => {
        const optiosMap = COMPLETE_DISABILITY_TRANSLATIONS[appLang] || COMPLETE_DISABILITY_TRANSLATIONS.English;
        return RAW_DISABILITY_TYPES.map((st) => ({
          value: st, // Stored cleanly in English for backend/sheets
          label: optiosMap[st] || st // Displayed dynamically in regional script + English
        }));
      }, [appLang]);
  

  // Runs once on launch: Restores logged-in user profile from local storage
  useEffect(() => {
    async function loadUser() {
      const raw = await AsyncStorage.getItem('loggedInUser');
      if (raw) {
        const user = JSON.parse(raw);
        setName(user.name || 'User');
        setPhone(user.phone || '');
        setEmail(user.email || '');
        setDisabilityType(user.disabilityType || '');
        setUid(user.uid || '');
        setNgoId(user.ngoId || 'CENTRAL_POOL');
        setEditName(user.name || '');
        seteditdisabilityType(user.disabilityType||'');
        setEditEmail(user.email || '');
        setEditUid(user.uid || '');
        setLanguage(user.language || 'English');
        if (user.language) setAppLang(user.language as AppLanguage);
      }
    }
    loadUser();
  }, []);

  // Form Submit: Saves modified name/email variables 
  const handleSaveProfile = async () => {
    try {
      const raw = await AsyncStorage.getItem('loggedInUser');
      if (!raw) return;

      const user = JSON.parse(raw);
      const chosenDisability = editdisabilityType || disabilityType;
      const chosenName = editName.trim() || name;
      const chosenEmail = editEmail.trim();
      const chosenUid=EditUid.trim();

      // 1. Sync to Google Sheets backend
      const { updateUserProfile } = require('../../lib/googleSheets');
      await updateUserProfile({
        phone: user.phone,
        name: chosenName,
        email: chosenEmail,
        disabilityType: chosenDisability,
        uid:chosenUid
      });


      
      // 2. Sync to local AsyncStorage
      const updated = {
        ...user,
        name: chosenName,
        email: chosenEmail,
        disabilityType: chosenDisability,
      };

      await AsyncStorage.setItem('loggedInUser', JSON.stringify(updated));

      // 3. Update active UI states
      setName(chosenName);
      setEmail(chosenEmail);
      setDisabilityType(chosenDisability);

      setEditModalVisible(false);
      Alert.alert('Saved', 'Your profile configuration details have been updated.');
    } catch (error) {
      console.error('Failed to sync profile update:', error);
      Alert.alert('Update Error', 'Could not sync changes to the cloud. Please check your internet connection.');
    }
  };

  // Language Picker: Commits new language choices across both global preferences and user accounts
  const handleLanguageSelect = async (lang: string) => {
    await AsyncStorage.setItem('appLanguagePreference', lang);
    const raw = await AsyncStorage.getItem('loggedInUser');
    if (raw) {
      const user = JSON.parse(raw);
      const updatedUser = { ...user, language: lang };
      
      await AsyncStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
      await AsyncStorage.setItem(`user_lang_${user.uid}`, lang); // Saves preference specifically for this user ID instance
    }
    setLanguage(lang);
    setAppLang(lang as AppLanguage);
    setLanguageModalVisible(false);
  };

  // Helpline Utility: Fetches custom partner helpline records from Google Sheet rows dynamically
  const handleContactHelpline = async () => {
    try {
      const userNgoId = ngoId; 
      const { getNgoContactDetails } = require('../../lib/googleSheets');
      const ngoConfig = await getNgoContactDetails(userNgoId);

      const displayNgoName = ngoConfig?.ngoName || "Disability Welfare Support Desk";
      const displayNumber = ngoConfig?.helpline || "1800-11-0180";

      Alert.alert(
        `Contact ${displayNgoName}`,
        `Official Helpline: ${displayNumber}\nTimings: Mon–Sat, 9am–5pm`,
        [
          { 
            text: 'Call Now', 
            onPress: () => Linking.openURL(`tel:${displayNumber.replace(/[^0-9]/g, '')}`) // Fires up the mobile phone dialer app
          },
          { text: 'Close', style: 'cancel' },
        ]
      );
    } catch (err) {
      console.error("Dynamic tenant Helpline resolution crash intercept:", err);
      Linking.openURL('tel:1800110180'); // Static safety phone line fallback
    }
  };

  // Support Request Submissions: Performs a network POST request to send user text tickets to Google Sheets
  const handleSubmitGrievance = async () => {
    if (!grievanceText.trim()) {
      Alert.alert('Empty', 'Please describe your support request issue before submitting.');
      return;
    }
    try {
      await fetch('https://script.google.com/macros/s/AKfycbwQrpJuBbxob2il_yZwOcfG34jyBArDl7I4RYsfH4RKW7q4n7xtBzhQxLpRXdGZPDGPIQ/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          sheet: 'Grievances',
          ngoId: ngoId || 'CENTRAL_POOL',
          userId: uid || 'unknown',
          name: name,
          phone: phone,
          grievance: grievanceText,
        }),
      });
      setGrievanceModalVisible(false);
      setGrievanceText('');
      Alert.alert('Submitted', 'Your support request has been logged. We will reach out to update you within 5 working days.');
    } catch {
      Alert.alert('Error', 'Could not submit tracking entry. Please check connection logs.');
    }
  };

  // Session Reset: Clears cached active profile states and routes back to authentication screens
  const handleLogout = async () => {
    await AsyncStorage.removeItem('loggedInUser');
    await AsyncStorage.removeItem('savedSchemes'); 
    router.replace('/sign-in');
  };

  const tGlobal = appDictionary[appLang] || appDictionary.English;
  const tProfile = profileTranslations[appLang] || profileTranslations.English;

  return (
    <ScrollView style={styles.scrollViewOuter} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title} accessibilityRole="header">
        {tGlobal.profileTitle}
      </Text>

      {/* ── Profile Identity Card Container ── */}
      <View 
        style={styles.userCard}
        accessibilityRole="summary"
        accessibilityLabel={`User Account Card: Name is ${name || 'Not set'}. Profile Type is ${disabilityType || 'Beneficiary'}.`}
      >
        <View style={styles.avatarRow} aria-hidden={true}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{name ? name.charAt(0).toUpperCase() : 'U'}</Text>
          </View>
          <View style={styles.avatarTextContainer}>
            <Text style={styles.userName}>{name || 'User Profile'}</Text>
            <Text style={styles.userClassificationTag}>{disabilityType || 'Beneficiary'}</Text>
          </View>
        </View>

        <View style={styles.profileDividerLine} aria-hidden={true} />

        {/* Display profile properties list */}
        <View style={styles.metaDataListContainer}>
          <View style={styles.metaIconRow}>
            <Ionicons name="key-outline" size={16} color="#64748b" style={styles.inlineIcon} />
            <Text style={styles.userMeta} accessibilityLabel={`${tProfile.idKey}: ${uid || 'Blank'}`}>
              <Text style={styles.metaLabel} aria-hidden={true}>{tProfile.idKey}:</Text> {uid || '—'}
            </Text>
          </View>

          <View style={styles.metaIconRow}>
            <Ionicons name="call-outline" size={16} color="#64748b" style={styles.inlineIcon} />
            <Text style={styles.userMeta} accessibilityLabel={`${tProfile.mobile}: ${phone || 'Blank'}`}>
              <Text style={styles.metaLabel} aria-hidden={true}>{tProfile.mobile}:</Text> {phone || '—'}
            </Text>
          </View>

          <View style={styles.metaIconRow}>
            <Ionicons name="mail-outline" size={16} color="#64748b" style={styles.inlineIcon} />
            <Text style={styles.userMeta} accessibilityLabel={`${tProfile.emailStr}: ${email || 'Blank'}`}>
              <Text style={styles.metaLabel} aria-hidden={true}>{tProfile.emailStr}:</Text> {email || '—'}
            </Text>
          </View>

          <View style={styles.metaIconRow}>
            <Ionicons name="planet-outline" size={16} color="#64748b" style={styles.inlineIcon} />
            <Text style={styles.userMeta} accessibilityLabel={`${tProfile.langStr}: ${language}`}>
              <Text style={styles.metaLabel} aria-hidden={true}>{tProfile.langStr}:</Text> {language}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Actions: Customization Settings ── */}
      <Text style={styles.sectionHeadingTitle} accessibilityRole="header">{tGlobal.profileSectionCustom}</Text>

      <TouchableOpacity 
        style={styles.optionButton} 
        onPress={() => setEditModalVisible(true)} 
        accessibilityRole="button"
        accessibilityLabel={tProfile.editProfile}
      >
        <View style={styles.buttonContentFlex}>
          <Ionicons name="create-outline" size={20} color="#2563eb" style={styles.buttonIcon} />
          <Text style={styles.optionText}>{tProfile.editProfile}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.optionButton} 
        onPress={() => router.push('/(tabs)/saved')} 
        accessibilityRole="link"
        accessibilityLabel={tProfile.viewSaved}
      >
        <View style={styles.buttonContentFlex}>
          <Ionicons name="bookmark" size={20} color="#2563eb" style={styles.buttonIcon} />
          <Text style={styles.optionText}>{tProfile.viewSaved}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.optionButton} 
        onPress={() => setLanguageModalVisible(true)} 
        accessibilityRole="button"
        accessibilityLabel={tProfile.changeLang}
      >
        <View style={styles.buttonContentFlex}>
          <Ionicons name="globe-outline" size={20} color="#2563eb" style={styles.buttonIcon} />
          <Text style={styles.optionText}>{tProfile.changeLang}</Text>
        </View>
      </TouchableOpacity>

      {/* ── Actions: Accessibility Overrides ── */}
      <Text style={styles.sectionHeadingTitle} accessibilityRole="header">{tGlobal.profileSectionAccess}</Text>

      <View 
        style={styles.toggleRow}
        accessibilityRole="checkbox"
        accessibilityLabel={tProfile.largeFont}
        accessibilityState={{ checked: fontLarge }}
      >
        <View style={styles.buttonContentFlex}>
          <Ionicons name="text-outline" size={20} color="#2563eb" style={styles.buttonIcon} />
          <Text style={styles.optionText} aria-hidden={true}>{tProfile.largeFont}</Text>
        </View>
        <Switch 
          value={fontLarge} 
          onValueChange={toggleFontLarge} 
          trackColor={{ true: '#1d4ed8', false: '#ccc' }}
          thumbColor={fontLarge ? '#ffffff' : '#f4f3f4'}
          importantForAccessibility="no" 
        />
      </View>

      {/* ── Actions: Support & Ticketing Interfaces ── */}
      <Text style={styles.sectionHeadingTitle} accessibilityRole="header">{tGlobal.profileSectionSupport}</Text>

      <TouchableOpacity 
        style={styles.optionButton} 
        onPress={handleContactHelpline} 
        accessibilityRole="button"
        accessibilityLabel={tProfile.contactHelpline}
      >
        <View style={styles.buttonContentFlex}>
          <Ionicons name="call-outline" size={20} color="#2563eb" style={styles.buttonIcon} />
          <Text style={styles.optionText}>{tProfile.contactHelpline}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.optionButton} 
        onPress={() => setGrievanceModalVisible(true)} 
        accessibilityRole="button"
        accessibilityLabel={tProfile.raiseGrievance}
      >
        <View style={styles.buttonContentFlex}>
          <Ionicons name="chatbox-ellipses-outline" size={20} color="#2563eb" style={styles.buttonIcon} />
          <Text style={styles.optionText}>{tProfile.raiseGrievance}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout} 
        accessibilityRole="button"
        accessibilityLabel={tGlobal.logoutText}
      >
        <View style={styles.buttonContentFlex}>
          <Ionicons name="log-out-outline" size={20} color="#e11d48" style={styles.buttonIcon} />
          <Text style={styles.logoutText}>{tGlobal.logoutText}</Text>
        </View>
      </TouchableOpacity>

      {/* ── Popup Layout 1: Profile Text Modification Form ── */}
      <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} accessibilityViewIsModal={true}>
            <Text style={styles.modalTitle} accessibilityRole="header">{tProfile.modalEditTitle}</Text>
            
            <Text style={styles.modalLabel} aria-hidden={true}>{tProfile.modalNameLabel}</Text>
            <TextInput 
              style={styles.modalInput} 
              value={editName} 
              onChangeText={setEditName} 
              placeholder="Full name" 
              placeholderTextColor="#94a3b8" 
              accessibilityLabel={tProfile.modalNameLabel}
            />
            
            <Text style={styles.modalLabel} aria-hidden={true}>{tProfile.modalEmailLabel}</Text>
            <TextInput 
              style={styles.modalInput} 
              value={editEmail} 
              onChangeText={setEditEmail} 
              placeholder="Email" 
              placeholderTextColor="#94a3b8" 
              keyboardType="email-address" 
              autoCapitalize="none" 
              accessibilityLabel={tProfile.modalEmailLabel}
            />

<Text style={styles.modalLabel} aria-hidden={true}>{tProfile.idKey}</Text>
            <TextInput 
              style={styles.modalInput} 
              value={EditUid} 
              onChangeText={setEditUid} 
              placeholder="UID/UDID" 
              placeholderTextColor="#94a3b8" 
              autoCapitalize="none" 
              accessibilityLabel={tProfile.idKey}
            />

<DropdownField
  label="Disability Type"
  value={editdisabilityType}
  onSelect={(val) => {
    seteditdisabilityType(val);
  }}
  placeholder="Select disability type"
  options={disabilityTypeOptions}
  getFontSize={getFontSize}
/>


            
            <TouchableOpacity style={styles.modalSaveButton} onPress={handleSaveProfile} accessibilityRole="button" accessibilityLabel={tProfile.modalSaveBtn}>
              <Text style={styles.modalSaveText}>{tProfile.modalSaveBtn}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditModalVisible(false)} accessibilityRole="button" accessibilityLabel={tProfile.modalCancelBtn}>
              <Text style={styles.modalCancelText}>{tProfile.modalCancelBtn}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      {/* ── Popup Layout 2: Language Selector Radio List ── */}
      <Modal visible={languageModalVisible} transparent animationType="slide" onRequestClose={() => setLanguageModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} accessibilityViewIsModal={true}>
            <Text style={styles.modalTitle} accessibilityRole="header">{tProfile.modalLangTitle}</Text>
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {LANGUAGES.map((lang) => {
                const isActive = lang.code === appLang;
                return (
                  <TouchableOpacity 
                    key={lang.code} 
                    style={[styles.langOption, isActive && styles.langOptionSelected]} 
                    onPress={() => handleLanguageSelect(lang.code)}
                    accessibilityRole="button"
                    accessibilityLabel={lang.label}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text style={[styles.langOptionText, isActive && styles.langOptionTextSelected]}>
                      {lang.label} 
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity onPress={() => setLanguageModalVisible(false)} style={{ marginTop: 8 }} accessibilityRole="button" accessibilityLabel={tProfile.modalLangDismiss}>
              <Text style={styles.modalCancelText}>{tProfile.modalLangDismiss}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Popup Layout 3: Grievance Multi-line Text Area ── */}
      <Modal visible={grievanceModalVisible} transparent animationType="slide" onRequestClose={() => setGrievanceModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} accessibilityViewIsModal={true}>
            <Text style={styles.modalTitle} accessibilityRole="header">{tProfile.modalTicketTitle}</Text>
            <Text style={styles.modalDescription}>{tProfile.modalTicketDesc}</Text>
            
            <TextInput 
              style={[styles.modalInput, styles.grievanceInput]} 
              value={grievanceText} 
              onChangeText={setGrievanceText} 
              placeholder={tProfile.modalTicketPlaceholder} 
              placeholderTextColor="#94a3b8" 
              multiline 
              numberOfLines={5} 
              accessibilityLabel={tProfile.modalTicketTitle}
              accessibilityHint={tProfile.modalTicketDesc}
            />
            
            <TouchableOpacity style={styles.modalSaveButton} onPress={handleSubmitGrievance} accessibilityRole="button" accessibilityLabel={tProfile.modalTicketSubmit}>
              <Text style={styles.modalSaveText}>{tProfile.modalTicketSubmit}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setGrievanceModalVisible(false)} accessibilityRole="button" accessibilityLabel={tProfile.modalCancelBtn}>
              <Text style={styles.modalCancelText}>{tProfile.modalCancelBtn}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Global layout specs sheet declarations
const styles = StyleSheet.create({
  scrollViewOuter: { flex: 1, backgroundColor: '#ffffff' },
  container: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40, backgroundColor: '#ffffff', flexGrow: 1 },
  title: { fontSize: 32, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5, marginBottom: 20 },
  sectionHeadingTitle: { fontSize: 15, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 18, marginBottom: 10, paddingLeft: 2 },
  userCard: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 10, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 12, elevation: 2 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontSize: 24, fontWeight: '700', color: '#ffffff' },
  avatarTextContainer: { flex: 1 },
  userName: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  userClassificationTag: { fontSize: 13, fontWeight: '700', color: '#2563eb', backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', textTransform: 'uppercase' },
  profileDividerLine: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 16 },
  metaDataListContainer: { gap: 10 },
  metaIconRow: { flexDirection: 'row', alignItems: 'center' },
  inlineIcon: { marginRight: 10, width: 18, textAlign: 'center' },
  userMeta: { fontSize: 16, color: '#334155', flex: 1 },
  metaLabel: { fontWeight: '600', color: '#64748b' },
  optionButton: { minHeight: 52, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, justifyContent: 'center', paddingHorizontal: 16, marginBottom: 8, backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  buttonContentFlex: { flexDirection: 'row', alignItems: 'center' },
  buttonIcon: { marginRight: 12, width: 22, textAlign: 'center' },
  optionText: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  toggleRow: { minHeight: 52, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, backgroundColor: '#ffffff' },
  logoutButton: { marginTop: 24, minHeight: 54, borderRadius: 12, backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#ffe4e6', justifyContent: 'center', paddingHorizontal: 16 },
  logoutText: { color: '#e11d48', fontSize: 17, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5, marginBottom: 16 },
  //modalDescription: { fontSize: 15, color: '#475569', lineHeight: 22, marginBottom: 16 },
  modalLabel: { fontSize: 15, fontWeight: '700', color: '#334155', marginBottom: 6 },
  modalInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 17, color: '#0f172a', backgroundColor: '#f8fafc', marginBottom: 16 },
  grievanceInput: { minHeight: 120, textAlignVertical: 'top' },
  modalSaveButton: { backgroundColor: '#2563eb', borderRadius: 12, minHeight: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 12, marginTop: 4 },
  modalSaveText: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
  modalCancelText: { textAlign: 'center', fontSize: 16, color: '#64748b', fontWeight: '600', paddingVertical: 8 },
  langOption: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: '#f1f5f9' },
  langOptionSelected: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  langOptionText: { fontSize: 17, color: '#334155', fontWeight: '500' },
  langOptionTextSelected: { fontWeight: '700', color: '#1d4ed8' },

  modalDescription: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 14,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif', //clean default system font sheet that separates regional blocks safely
    }),
  },


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




});