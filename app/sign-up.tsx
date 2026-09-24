// sign-up.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
import { useAccessibility } from '../context/AccessibilityContext';
import { appDictionary, AppLanguage } from '../lib/appTranslations';
import { registerUser } from '../lib/googleSheets';

// ── COMPREHENSIVE INLINE ACCESSIBILITY DICTIONARY ──
const A11Y_TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  English: {
    langSelectorLabel: "Display Language Selector",
    dropdownSelected: "selected option",
    dropdownHint: "Double tap to open selection menu",
    dropdownCloseLabel: "Close selection menu",
    individualTabLabel: "Individual Mode Account Creation Type",
    operatorTabLabel: "NGO Operator Mode Registry Account Creation Type",
    operatorIdLabel: "Official NGO Operator ID Input Field",
    operatorIdHint: "Type your authorized staff operational alphanumeric registry key.",
    nameLabel: "Full Applicant Name Input Field",
    nameHint: "Type your full legal name as formatted on your paperwork.",
    phoneLabel: "Phone Number Input Field",
    phoneHint: "Type your ten-digit active mobile contact number.",
    emailLabel: "Email Address Input Field, Optional Entry.",
    dobSummaryLabel: "Selected Date of Birth Summary",
    uidLabel: "Unique Disability ID Input Field",
    uidHint: "Type out your official government registration token code pattern.",
    uidHelpLabel: "Don't have a Unique Disability ID? Click here to find the nearest assessment hospitals.",
    registerLoadingLabel: "Registering account profile data entries",
    registerButtonLabel: "Register Profile",
    registerButtonHint: "Double tap to execute submission and create your profile.",
  },
  Hindi: {
    langSelectorLabel: "भाषा चयनकर्ता",
    dropdownSelected: "चयनित विकल्प",
    dropdownHint: "चयन मेनू खोलने के लिए दो बार टैप करें",
    dropdownCloseLabel: "चयन मेनू बंद करें",
    individualTabLabel: "व्यक्तिगत खाता निर्माण मोड",
    operatorTabLabel: "एनजीओ ऑपरेटर खाता निर्माण मोड",
    operatorIdLabel: "आधिकारिक एनजीओ ऑपरेटर आईडी इनपुट फ़ील्ड",
    operatorIdHint: "अपनी अधिकृत स्टाफ़ पहचान कुंजी टाइप करें।",
    nameLabel: "आवेदक का पूरा नाम इनपुट फ़ील्ड",
    nameHint: "दस्तावेजों के अनुसार अपना पूरा कानूनी नाम दर्ज करें।",
    phoneLabel: "फ़ोन नंबर इनपुट फ़ील्ड",
    phoneHint: "अपना 10 अंकों का सक्रिय मोबाइल नंबर दर्ज करें।",
    emailLabel: "ईमेल पता इनपुट फ़ील्ड, वैकल्पिक प्रविष्टि।",
    dobSummaryLabel: "चयनित जन्म तिथि का सारांश",
    uidLabel: "विशिष्ट दिव्यांगता पहचान पत्र (UDID) फ़ील्ड",
    uidHint: "अपना आधिकारिक सरकारी दिव्यांगता पहचान कोड दर्ज करें।",
    uidHelpLabel: "यूडीआईडी नहीं है? निकटतम मूल्यांकन अस्पताल खोजने के लिए यहां टैप करें।",
    registerLoadingLabel: "खाता विवरण पंजीकृत किया जा रहा है",
    registerButtonLabel: "प्रोफ़ाइल पंजीकृत करें",
    registerButtonHint: "विवरण सबमिट करने और प्रोफ़ाइल बनाने के लिए दो बार टैप करें।",
  },
  Kannada: {
    langSelectorLabel: "ಭಾಷಾ ಆಯ್ಕೆ ಪಟ್ಟಿ",
    dropdownSelected: "ಆಯ್ಕೆಮಾಡಿದ ಆಯ್ಕೆ",
    dropdownHint: "ಆಯ್ಕೆ ಮೆನುವನ್ನು ತೆರೆಯಲು ಎರಡು ಬಾರಿ ಟ್ಯಾಪ್ ಮಾಡಿ",
    dropdownCloseLabel: "ಆಯ್ಕೆ ಮೆನುವನ್ನು ಮುಚ್ಚಿ",
    individualTabLabel: "ವೈಯಕ್ತಿಕ ಖಾತೆ ರಚನೆ ಮೋಡ್",
    operatorTabLabel: "ಎನ್‌ಜಿಒ ಆಪರೇಟರ್ ಖಾತೆ ರಚನೆ ಮೋಡ್",
    operatorIdLabel: "ಅಧಿಕೃತ ಎನ್‌ಜಿಒ ಆಪರೇಟರ್ ಐಡಿ ಇನ್‌ಪುಟ್ ಕ್ಷೇತ್ರ",
    operatorIdHint: "ನಿಮ್ಮ ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿ ಗುರುತಿನ ಕೀಲಿಯನ್ನು ಟೈಪ್ ಮಾಡಿ.",
    nameLabel: "ಅರ್ಜಿದಾರರ ಪೂರ್ಣ ಹೆಸರು ಇನ್‌ಪುಟ್ ಕ್ಷೇತ್ರ",
    nameHint: "ದಾಖಲೆಗಳಲ್ಲಿರುವಂತೆ ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ಟೈಪ್ ಮಾಡಿ.",
    phoneLabel: "ದೂರವಾಣಿ ಸಂಖ್ಯೆ ಇನ್‌ಪುಟ್ ಕ್ಷೇತ್ರ",
    phoneHint: "ನಿಮ್ಮ ಹತ್ತು ಅಂಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.",
    emailLabel: "ಇಮೇಲ್ ವಿಳಾಸ ಇನ್‌ಪುಟ್ ಕ್ಷೇತ್ರ, ಐಚ್ಛಿಕ.",
    dobSummaryLabel: "ಆಯ್ಕೆಮಾಡಿದ ಜನ್ಮ ದಿನಾಂಕದ ಸಾರಾಂಶ",
    uidLabel: "ವಿಶಿಷ್ಟ ವಿಕಲಾಂಗತೆ ಗುರುತಿನ ಚೀಟಿ (UDID) ಕ್ಷೇತ್ರ",
    uidHint: "ನಿಮ್ಮ ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಗುರುತಿನ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.",
    uidHelpLabel: "ಯುಡಿಐಡಿ ಇಲ್ವಾ? ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗಳನ್ನು ಹುಡುಕಲು ಇಲ್ಲಿ ಟ್ಯಾಪ್ ಮಾಡಿ.",
    registerLoadingLabel: "ಖಾತೆ ವಿವರಗಳನ್ನು ನೋಂದಾಯಿಸಲಾಗುತ್ತಿದೆ",
    registerButtonLabel: "ಪ್ರೊಫೈಲ್ ನೋಂದಾಯಿಸಿ",
    registerButtonHint: "ಸಲ್ಲಿಸಲು ಮತ್ತು ನಿಮ್ಮ ಖಾತೆಯನ್ನು ರಚಿಸಲು ಎರಡು ಬಾರಿ ಟ್ಯಾಪ್ ಮಾಡಿ.",
  },
  Tamil: {
    langSelectorLabel: "மொழி தெரிவுசெய்தல்",
    dropdownSelected: "தேர்ந்தெடுக்கப்பட்ட விருப்பம்",
    dropdownHint: "தேர்வு மெனுவைத் திறக்க இருமுறை தட்டவும்",
    dropdownCloseLabel: "தேர்வு மெனுவை மூடவும்",
    individualTabLabel: "தனிநபர் கணக்கு உருவாக்கும் முறை",
    operatorTabLabel: "அரசு சாரா நிறுவன (NGO) ஆபரேட்டர் கணக்கு முறை",
    operatorIdLabel: "அதிகாரப்பூர்வ NGO ஆபரேட்டர் ஐடி உள்ளீட்டு புலம்",
    operatorIdHint: "உங்கள் அங்கீகரிக்கப்பட்ட பணியாளர் பதிவு எண்ணைத் தட்டச்சு செய்யவும்.",
    nameLabel: "விண்ணப்பதாரரின் முழுப் பெயர் உள்ளீட்டுப் புலம்",
    nameHint: "ஆவணங்களில் உள்ளபடி உங்கள் முழுப் பெயரைத் தட்டச்சு செய்யவும்.",
    phoneLabel: "தொலைபேசி எண் உள்ளீட்டுப் புலம்",
    phoneHint: "உங்கள் 10 இலக்க மொபைல் எண்ணைத் தட்டச்சு செய்யவும்.",
    emailLabel: "மின்னஞ்சல் முகவரி உள்ளீட்டுப் புலம், விருப்பத்தேர்வு.",
    dobSummaryLabel: "தேர்ந்தெடுக்கப்பட்ட பிறந்த தேதியின் சுருக்கம்",
    uidLabel: "தனித்துவ மாற்றுத்திறனாளி அடையாள அட்டை (UDID) புலம்",
    uidHint: "உங்கள் அதிகாரப்பூர்வ அரசு அடையாள எண்ணைத் தட்டச்சு செய்யவும்.",
    uidHelpLabel: "UDID இல்லையா? அருகிலுள்ள மருத்துவமனைகளைக் கண்டறிய இங்கே தட்டவும்.",
    registerLoadingLabel: "கணக்கு விவரங்கள் பதிவு செய்யப்படுகின்றன",
    registerButtonLabel: "சுயவிவரத்தைப் பதிவுசெய்க",
    registerButtonHint: "பதிவைச் சமர்ப்பிக்க இருமுறை தட்டவும்.",
  },
  Telugu: {
    langSelectorLabel: "భాష ఎంపిక సాధనం",
    dropdownSelected: "ఎంచుకున్న ఎంపిక",
    dropdownHint: "ఎంపిక మెనుని తెరవడానికి రెండుసార్లు నొక్కండి",
    dropdownCloseLabel: "ఎంపిక మెనుని మూసివేయండి",
    individualTabLabel: "వ్యక్తిగత ఖాతా సృష్టి మోడ్",
    operatorTabLabel: "NGO ఆపరేటర్ ఖాతా సృష్టి మోడ్",
    operatorIdLabel: "అధికారిక NGO ఆపరేటర్ ఐడి ఇన్‌పుట్ ఫీల్డ్",
    operatorIdHint: "మీ అధికారిక సిబ్బంది రిజిస్ట్రీ కీని టైప్ చేయండి.",
    nameLabel: "దరఖాస్తుదారు పూర్తి పేరు ఇన్‌పుట్ ఫీల్డ్",
    nameHint: "పత్రాల ప్రకారం మీ పూర్తి చట్టపరమైన పేరును టైప్ చేయండి.",
    phoneLabel: "ఫోన్ నంబర్ ఇన్‌పుట్ ఫీల్డ్",
    phoneHint: "మీ పది అంకెల మొబైల్ నంబర్‌ను టైప్ చేయండి.",
    emailLabel: "ఈమెయిల్ చిరునామా ఇన్‌పుట్ ఫీల్డ్, ఐచ్ఛికం.",
    dobSummaryLabel: "ఎంచుకున్న పుట్టిన తేదీ సారాంశం",
    uidLabel: "ప్రత్యేక వైకల్య గుర్తింపు కార్డు (UDID) ఫీల్డ్",
    uidHint: "మీ అధికారిక ప్రభుత్వ గుర్తింపు కోడ్‌ను టైప్ చేయండి.",
    uidHelpLabel: "UDID లేదా? సమీప ఆసుపత్రులను కనుగొనడానికి ఇక్కడ నొక్కండి.",
    registerLoadingLabel: "ఖాతా వివరాలు నమోదు చేయబడుతున్నాయి",
    registerButtonLabel: "ప్రొఫైల్‌ను నమోదు చేయండి",
    registerButtonHint: "సమర్పించడానికి మరియు ప్రొఫైల్ సృష్టించడానికి రెండుసార్లు నొక్కండి.",
  },
  Bengali: {
    langSelectorLabel: "ভাষা নির্বাচনকারী",
    dropdownSelected: "নির্বাচিত বিকল্প",
    dropdownHint: "মেনু খুলতে দুবার ট্যাপ করুন",
    dropdownCloseLabel: "মেনু বন্ধ করুন",
    individualTabLabel: "ব্যক্তিগত অ্যাকাউন্ট খোলার মোড",
    operatorTabLabel: "এনজিও অপারেটর অ্যাকাউন্ট খোলার মোড",
    operatorIdLabel: "অফিসিয়াল এনজিও অপারেটর আইডি ক্ষেত্র",
    operatorIdHint: "আপনার অনুমোদিত কর্মী শনাক্তকরণ কোডটি টাইপ করুন।",
    nameLabel: "আবেদনকারীর পুরো নামের ক্ষেত্র",
    nameHint: "কাগজপত্রের সাথে মিল রেখে আপনার পুরো নাম লিখুন।",
    phoneLabel: "ফোন নম্বর ক্ষেত্র",
    phoneHint: "আপনার দশ অঙ্কের মোবাইল নম্বর লিখুন।",
    emailLabel: "ইমেল ঠিকানা ক্ষেত্র, ঐচ্ছিক।",
    dobSummaryLabel: "নির্বাচিত জন্ম তারিখের বিবরণ",
    uidLabel: "স্বতন্ত্র প্রতিবন্ধী পরিচয়পত্র (UDID) ক্ষেত্র",
    uidHint: "আপনার সরকারী রেজিস্ট্রেশন কোডটি লিখুন।",
    uidHelpLabel: "UDID নেই? নিকটতম হাসপাতাল খুঁজতে এখানে ট্যাপ করুন।",
    registerLoadingLabel: "অ্যাকাউন্ট বিবরণ নিবন্ধন করা হচ্ছে",
    registerButtonLabel: "প্রোফাইল নিবন্ধন করুন",
    registerButtonHint: "জমা দিতে এবং প্রোফাইল তৈরি করতে দুবার ট্যাপ করুন।",
  },
  Marathi: {
    langSelectorLabel: "भाषा निवडक",
    dropdownSelected: "निवडलेला पर्याय",
    dropdownHint: "मेनू उघडण्यासाठी दोनदा टॅप करा",
    dropdownCloseLabel: "मेनू बंद करा",
    individualTabLabel: "वैयक्तिक खाते तयार करण्याचा मोड",
    operatorTabLabel: "एनजीओ ऑपरेटर खाते तयार करण्याचा मोड",
    operatorIdLabel: "अधिकृत एनजीओ ऑपरेटर आयडी फील्ड",
    operatorIdHint: "तुमचा अधिकृत कर्मचारी कोड टाइप करा.",
    nameLabel: "अर्जदाराचे पूर्ण नाव इनपुट फील्ड",
    nameHint: "कागदपत्रांनुसार तुमचे पूर्ण कायदेशीर नाव टाइप करा.",
    phoneLabel: "फोन नंबर इनपुट फील्ड",
    phoneHint: "तुमचा 10 अंकी मोबाइल नंबर टाइप करा.",
    emailLabel: "ईमेल पत्ता इनपुट फील्ड, ऐच्छिक.",
    dobSummaryLabel: "निवडलेल्या जन्मतारखेचा तपशील",
    uidLabel: "विशिष्ट दिव्यांगत्व ओळखपत्र (UDID) फील्ड",
    uidHint: "तुमचा अधिकृत सरकारी नोंदणी कोड टाइप करा.",
    uidHelpLabel: "UDID नाही? जवळचे रुग्णालय शोधण्यासाठी येथे टॅप करा.",
    registerLoadingLabel: "खाते तपशील नोंदणीकृत केले जात आहेत",
    registerButtonLabel: "प्रोफाइल नोंदणी करा",
    registerButtonHint: "नोंदणी पूर्ण करण्यासाठी दोनदा टॅप करा.",
  }
};

type DropdownOption = string | { label: string; value: string };

type DropdownFieldProps = {
  label: string;
  value: string;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  placeholder: string;
  getFontSize?: (base: number) => number;
  appLang?: AppLanguage;
};

function DropdownField({ label, value, options, onSelect, placeholder, getFontSize = (s) => s, appLang = 'English' }: DropdownFieldProps) {
  const [open, setOpen] = useState(false);
  const a11y = A11Y_TRANSLATIONS[appLang] || A11Y_TRANSLATIONS.English;

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
        accessibilityLabel={label ? `${label}, ${a11y.dropdownSelected}: ${displayValue}` : displayValue}
        accessibilityHint={a11y.dropdownHint}
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
          accessibilityLabel={a11y.dropdownCloseLabel}
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

const LOCAL_LANGUAGE_OPTIONS: { label: string; value: AppLanguage }[] = [
  { label: 'English', value: 'English' },
  { label: 'हिन्दी (Hindi)', value: 'Hindi' },
  { label: 'ಕನ್ನಡ (Kannada)', value: 'Kannada' },
  { label: 'తెలుగు (Telugu)', value: 'Telugu' },
  { label: 'தமிழ் (Tamil)', value: 'Tamil' },
  { label: 'বাংলা (Bengali)', value: 'Bengali' },
  { label: 'मराठी (Marathi)', value: 'Marathi' },
];

export default function SignUpScreen() {
  const router = useRouter();
  
  // Wizard Step State (1, 2, 3)
  const [currentStep, setCurrentStep] = useState(1);

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [disabilityType, setDisabilityType] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const { getFontSize } = useAccessibility();
  const [appLang, setAppLang] = useState<AppLanguage>('English');

  const ALL_INDIA_STATES_AND_UTS = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ];

  const COMPLETE_STATE_TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
    English: {
      'Andhra Pradesh': 'Andhra Pradesh', 'Arunachal Pradesh': 'Arunachal Pradesh', 'Assam': 'Assam', 'Bihar': 'Bihar', 'Chhattisgarh': 'Chhattisgarh', 'Goa': 'Goa', 'Gujarat': 'Gujarat', 'Haryana': 'Haryana', 'Himachal Pradesh': 'Himachal Pradesh', 'Jharkhand': 'Jharkhand', 'Karnataka': 'Karnataka', 'Kerala': 'Kerala', 'Madhya Pradesh': 'Madhya Pradesh', 'Maharashtra': 'Maharashtra', 'Manipur': 'Manipur', 'Meghalaya': 'Meghalaya', 'Mizoram': 'Mizoram', 'Nagaland': 'Nagaland', 'Odisha': 'Odisha', 'Punjab': 'Punjab', 'Rajasthan': 'Rajasthan', 'Sikkim': 'Sikkim', 'Tamil Nadu': 'Tamil Nadu', 'Telangana': 'Telangana', 'Tripura': 'Tripura', 'Uttar Pradesh': 'Uttar Pradesh', 'Uttarakhand': 'Uttarakhand', 'West Bengal': 'West Bengal', 'Andaman and Nicobar Islands': 'Andaman and Nicobar Islands', 'Chandigarh': 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu': 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi': 'Delhi (NCT)', 'Jammu and Kashmir': 'Jammu and Kashmir', 'Ladakh': 'Ladakh', 'Lakshadweep': 'Lakshadweep', 'Puducherry': 'Puducherry'
    },
    Kannada: {
      'Andhra Pradesh': 'ಆಂಧ್ರಪ್ರದೇಶ (Andhra Pradesh)', 'Arunachal Pradesh': 'ಅರುಣಾಚಲ ಪ್ರದೇಶ (Arunachal Pradesh)', 'Assam': 'ಅಸ್ಸಾಂ (Assam)', 'Bihar': 'ಬಿಹಾರ (Bihar)', 'Chhattisgarh': 'ಛತ್ತೀಸ್‌ಗಢ (Chhattisgarh)', 'Goa': 'ಗೋವಾ (Goa)', 'Gujarat': 'ಗುಜರಾತ್ (Gujarat)', 'Haryana': 'ಹರಿಯಾಣ (Haryana)', 'Himachal Pradesh': 'ಹಿಮಾಚಲ ಪ್ರದೇಶ (Himachal Pradesh)', 'Jharkhand': 'ಜಾರ್ಖಂಡ್ (Jharkhand)', 'Karnataka': 'ಕರ್ನಾಟಕ (Karnataka)', 'Kerala': 'ಕೇರಳ (Kerala)', 'Madhya Pradesh': 'ಮಧ್ಯಪ್ರದೇಶ (Madhya Pradesh)', 'Maharashtra': 'ಮಹಾರಾಷ್ಟ್ರ (Maharashtra)', 'Manipur': 'ಮಣಿಪುರ (Manipur)', 'Meghalaya': 'ಮೇಘಾಲಯ (Meghalaya)', 'Mizoram': 'ಮಿಜೋರಾಂ (Mizoram)', 'Nagaland': 'ನಾಗಾಲ್ಯಾಂಡ್ (Nagaland)', 'Odisha': 'ಒಡಿಶಾ (Odisha)', 'Punjab': 'ಪಂಜಾಬ್ (Punjab)', 'Rajasthan': 'ರಾಜಸ್ಥಾನ (Rajasthan)', 'Sikkim': 'ಸಿಕ್ಕಿಂ (Sikkim)', 'Tamil Nadu': 'ತಮಿಳುನಾಡು (Tamil Nadu)', 'Telangana': 'ತೆಲಂಗಾಣ (Telangana)', 'Tripura': 'ತ್ರಿಪುರ (Tripura)', 'Uttar Pradesh': 'ಉತ್ತರ ಪ್ರದೇಶ (Uttar Pradesh)', 'Uttarakhand': 'ಉತ್ತರಾಖಂಡ (Uttarakhand)', 'West Bengal': 'ಪಶ್ಚಿಮ ಬಂಗಾಳ (West Bengal)', 'Andaman and Nicobar Islands': 'ಅಂಡಮಾನ್ ಮತ್ತು ನಿಕೋಬಾರ್ ದ್ವೀಪಗಳು (Andaman & Nicobar)', 'Chandigarh': 'ಚಂಡೀಗಢ (Chandigarh)', 'Dadra and Nagar Haveli and Daman and Diu': 'ದಾದ್ರಾ ಮತ್ತು ನಗರ ಹವೇಲಿ ಮತ್ತು ದಮನ್ ಮತ್ತು ದಿಯು (DNHDD)', 'Delhi': 'ದೆಹಲಿ (Delhi)', 'Jammu and Kashmir': 'ಜಮ್ಮು ಮತ್ತು ಕಾಶ್ಮೀರ (Jammu & Kashmir)', 'Ladakh': 'ಲಡಾಖ್ (Ladakh)', 'Lakshadweep': 'ಲಕ್ಷದ್ವೀಪ (Lakshadweep)', 'Puducherry': 'ಪುದುಚೇರಿ (Puducherry)'
    },
    Hindi: {
      'Andhra Pradesh': 'आंध्र प्रदेश (Andhra Pradesh)', 'Arunachal Pradesh': 'अरुणाचल प्रदेश (Arunachal Pradesh)', 'Assam': 'असम (Assam)', 'Bihar': 'बिहार (Bihar)', 'Chhattisgarh': 'छत्तीसगढ़ (Chhattisgarh)', 'Goa': 'गोवा (Goa)', 'Gujarat': 'गुजरात (Gujarat)', 'Haryana': 'हरियाणा (Haryana)', 'Himachal Pradesh': 'हिमाचल प्रदेश (Himachal Pradesh)', 'Jharkhand': 'झारखंड (Jharkhand)', 'Karnataka': 'कर्नाटक (Karnataka)', 'Kerala': 'केरल (Kerala)', 'Madhya Pradesh': 'मध्य प्रदेश (Madhya Pradesh)', 'Maharashtra': 'महाराष्ट्र (Maharashtra)', 'Manipur': 'मणिपुर (Manipur)', 'Meghalaya': 'मेघालय (Meghalaya)', 'Mizoram': 'मिजोरम (Mizoram)', 'Nagaland': 'नागालैंड (Nagaland)', 'Odisha': 'ओडिशा (Odisha)', 'Punjab': 'पंजाब (Punjab)', 'Rajasthan': 'राजस्थान (Rajasthan)', 'Sikkim': 'सिक्किम (Sikkim)', 'Tamil Nadu': 'तमिलनाडु (Tamil Nadu)', 'Telangana': 'तेलंगाना (Telangana)', 'Tripura': 'त्रिपुरा (Tripura)', 'Uttar Pradesh': 'उत्तर प्रदेश (Uttar Pradesh)', 'Uttarakhand': 'उत्तराखंड (Uttarakhand)', 'West Bengal': 'पश्चिम बंगाल (West Bengal)', 'Andaman and Nicobar Islands': 'अंडमान और निकोबार द्वीप समूह (Andaman & Nicobar)', 'Chandigarh': 'चंडीगढ़ (Chandigarh)', 'Dadra and Nagar Haveli and Daman and Diu': 'दादरा और नगर हवेली और दमन और दीव (DNHDD)', 'Delhi': 'दिल्ली (Delhi)', 'Jammu and Kashmir': 'जम्मू और कश्मीर (Jammu & Kashmir)', 'Ladakh': 'लद्दाख (Ladakh)', 'Lakshadweep': 'लक्षद्वीप (Lakshadweep)', 'Puducherry': 'पुदुचेरी (Puducherry)'
    },
    Tamil: {
      'Andhra Pradesh': 'ஆந்திரப் பிரதேசம் (Andhra Pradesh)', 'Arunachal Pradesh': 'அருணாச்சலப் பிரதேசம் (Arunachal Pradesh)', 'Assam': 'அசாம் (Assam)', 'Bihar': 'பீகார் (Bihar)', 'Chhattisgarh': 'சத்தீஸ்கர் (Chhattisgarh)', 'Goa': 'கோவா (Goa)', 'Gujarat': 'குஜராத் (Gujarat)', 'Haryana': 'ஹரியானா (Haryana)', 'Himachal Pradesh': 'இமாச்சலப் பிரதேசம் (Himachal Pradesh)', 'Jharkhand': 'ஜார்க்கண்ட் (Jharkhand)', 'Karnataka': 'கர்நாடகா (Karnataka)', 'Kerala': 'கேரளா (Kerala)', 'Madhya Pradesh': 'மத்தியப் பிரதேசம் (Madhya Pradesh)', 'Maharashtra': 'மகாராஷ்டிரா (Maharashtra)', 'Manipur': 'மணிப்பூர் (Manipur)', 'Meghalaya': 'மேகாலயா (Meghalaya)', 'Mizoram': 'மிசோரம் (Mizoram)', 'Nagaland': 'நாகாலாந்து (Nagaland)', 'Odisha': 'ஒடிசா (Odisha)', 'Punjab': 'பஞ்சாப் (Punjab)', 'Rajasthan': 'ராஜஸ்தான் (Rajasthan)', 'Sikkim': 'சிக்கிம் (Sikkim)', 'Tamil Nadu': 'தமிழ்நாடு (Tamil Nadu)', 'Telangana': 'தெலுங்கானா (Telangana)', 'Tripura': 'திரிபுரா (Tripura)', 'Uttar Pradesh': 'உத்தரப் பிரதேசம் (Uttar Pradesh)', 'Uttarakhand': 'உத்தராகண்ட் (Uttarakhand)', 'West Bengal': 'மேற்கு வங்காளம் (West Bengal)', 'Andaman and Nicobar Islands': 'அந்தமான் நிகோபார் தீவுகள் (Andaman & Nicobar)', 'Chandigarh': 'சண்டிகர் (Chandigarh)', 'Dadra and Nagar Haveli and Daman and Diu': 'தாத்ரா மற்றும் நகர் ஹவேலி மற்றும் தாமன் மற்றும் தியூ (DNHDD)', 'Delhi': 'டெல்லி (Delhi)', 'Jammu and Kashmir': 'ஜம்மு காஷ்மீர் (Jammu & Kashmir)', 'Ladakh': 'லடாக் (Ladakh)', 'Lakshadweep': 'லட்சத்தீவு (Lakshadweep)', 'Puducherry': 'புதுச்சேரி (Puducherry)'
    },
    Telugu: {
      'Andhra Pradesh': 'ఆంధ్రప్రదేశ్ (Andhra Pradesh)', 'Arunachal Pradesh': 'అరుణాచల్ ప్రదేశ్ (Arunachal Pradesh)', 'Assam': 'అస్సాం (Assam)', 'Bihar': 'బీహార్ (Bihar)', 'Chhattisgarh': 'ఛత్తీస్‌గఢ్ (Chhattisgarh)', 'Goa': 'గోవా (Goa)', 'Gujarat': 'గుజరాత్ (Gujarat)', 'Haryana': 'హర్యానా (Haryana)', 'Himachal Pradesh': 'హిమాచల్ ప్రదేశ్ (Himachal Pradesh)', 'Jharkhand': 'జార్ఖండ్ (Jharkhand)', 'Karnataka': 'కర్ణాటక (Karnataka)', 'Kerala': 'కేరళ (Kerala)', 'Madhya Pradesh': 'మధ్యప్రదేశ్ (Madhya Pradesh)', 'Maharashtra': 'మహారాష్ట్ర (Maharashtra)', 'Manipur': 'మణిపూర్ (Manipur)', 'Meghalaya': 'మేఘాలయ (Meghalaya)', 'Mizoram': 'మిజోరం (Mizoram)', 'Nagaland': 'నాగాలాండ్ (Nagaland)', 'Odisha': 'ఒడిశా (Odisha)', 'Punjab': 'పంజాబ్ (Punjab)', 'Rajasthan': 'రాజస్థాన్ (Rajasthan)', 'Sikkim': 'సిక్కిం (Sikkim)', 'Tamil Nadu': 'తమిళనాడు (Tamil Nadu)', 'Telangana': 'తెలంగాణ (Telangana)', 'Tripura': 'త్రిపుర (Tripura)', 'Uttar Pradesh': 'ఉత్తర ప్రదేశ్ (Uttar Pradesh)', 'Uttarakhand': 'ఉత్తరాఖండ్ (Uttarakhand)', 'West Bengal': 'పశ్చిమ బెంగాల్ (West Bengal)', 'Andaman and Nicobar Islands': 'అండమాన్ మరియు నికోబార్ దీవులు (Andaman & Nicobar)', 'Chandigarh': 'చండీగఢ్ (Chandigarh)', 'Dadra and Nagar Haveli and Daman and Diu': 'దాద్రా మరియు నగర్ హవేలీ మరియు డామన్ మరియు డయ్యూ (DNHDD)', 'Delhi': 'ఢిల్లీ (Delhi)', 'Jammu and Kashmir': 'జమ్మూ కాశ్మీర్ (Jammu & Kashmir)', 'Ladakh': 'లడఖ్ (Ladakh)', 'Lakshadweep': 'లక్షద్వీప్ (Lakshadweep)', 'Puducherry': 'పుదుచ్చేరి (Puducherry)'
    },
    Bengali: {
      'Andhra Pradesh': 'অন্ধ্রপ্রদেশ (Andhra Pradesh)', 'Arunachal Pradesh': 'অরুণাচল প্রদেশ (Arunachal Pradesh)', 'Assam': 'আসাম (Assam)', 'Bihar': 'বিহার (Bihar)', 'Chhattisgarh': 'ছত্তিশগড় (Chhattisgarh)', 'Goa': 'গোয়া (Goa)', 'Gujarat': 'গুজরাট (Gujarat)', 'Haryana': 'হরিয়ানা (Haryana)', 'Himachal Pradesh': 'হিমাচল প্রদেশ (Himachal Pradesh)', 'Jharkhand': 'ঝাড়খণ্ড (Jharkhand)', 'Karnataka': 'কর্ণাটক (Karnataka)', 'Kerala': 'কেরালা (Kerala)', 'Madhya Pradesh': 'মধ্যপ্রদেশ (Madhya Pradesh)', 'Maharashtra': 'মহারাষ্ট্র (Maharashtra)', 'Manipur': 'মণিপুর (Manipur)', 'Meghalaya': 'মেঘালয় (Meghalaya)', 'Mizoram': 'মিজোরাম (Mizoram)', 'Nagaland': 'নাগাল্যান্ড (Nagaland)', 'Odisha': 'ওড়িশা (Odisha)', 'Punjab': 'পাঞ্জাব (Punjab)', 'Rajasthan': 'রাজস্থান (Rajasthan)', 'Sikkim': 'সিকিম (Sikkim)', 'Tamil Nadu': 'তামিলনাড়ু (Tamil Nadu)', 'Telangana': 'তেলেঙ্গানা (Telangana)', 'Tripura': 'ত্রিপুরা (Tripura)', 'Uttar Pradesh': 'উত্তর প্রদেশ (Uttar Pradesh)', 'Uttarakhand': 'উত্তরাখণ্ড (Uttarakhand)', 'West Bengal': 'পশ্চিমবঙ্গ (West Bengal)', 'Andaman and Nicobar Islands': 'আন্দামান ও নিকোবর দ্বীপপুঞ্জ (Andaman & Nicobar)', 'Chandigarh': 'চণ্ডীগড় (Chandigarh)', 'Dadra and Nagar Haveli and Daman and Diu': 'দাদরা ও নগর হাভেলি এবং দমন ও দিউ (DNHDD)', 'Delhi': 'দিল্লি (Delhi)', 'Jammu and Kashmir': 'জম্মু ও কাশ্মীর (Jammu & Kashmir)', 'Ladakh': 'লাদাখ (Ladakh)', 'Lakshadweep': 'লক্ষদ্বীপ (Lakshadweep)', 'Puducherry': 'পুদুচেরি (Puducherry)'
    },
    Marathi: {
      'Andhra Pradesh': 'आंध्र प्रदेश (Andhra Pradesh)', 'Arunachal Pradesh': 'अरुणाचल प्रदेश (Arunachal Pradesh)', 'Assam': 'आसाम (Assam)', 'Bihar': 'बिहार (Bihar)', 'Chhattisgarh': 'छत्तीसगढ (Chhattisgarh)', 'Goa': 'गोवा (Goa)', 'Gujarat': 'गुजरात (Gujarat)', 'Haryana': 'हरियाणा (Haryana)', 'Himachal Pradesh': 'हिमाचल प्रदेश (Himachal Pradesh)', 'Jharkhand': 'झारखंड (Jharkhand)', 'Karnataka': 'कर्नाटक (Karnataka)', 'Kerala': 'केरळ (Kerala)', 'Madhya Pradesh': 'मध्य प्रदेश (Madhya Pradesh)', 'Maharashtra': 'महाराष्ट्र (Maharashtra)', 'Manipur': 'मणिपूर (Manipur)', 'Meghalaya': 'मेघालय (Meghalaya)', 'Mizoram': 'मिझोराम (Mizoram)', 'Nagaland': 'नागालँड (Nagaland)', 'Odisha': 'ओडिशा (Odisha)', 'Punjab': 'पंजाब (Punjab)', 'Rajasthan': 'राजस्थान (Rajasthan)', 'Sikkim': 'सिक्कीम (Sikkim)', 'Tamil Nadu': 'तमिळनाडू (Tamil Nadu)', 'Telangana': 'तेलंगणा (Telangana)', 'Tripura': 'त्रिपुरा (Tripura)', 'Uttar Pradesh': 'उत्तर प्रदेश (Uttar Pradesh)', 'Uttarakhand': 'उत्तराखंड (Uttarakhand)', 'West Bengal': 'पश्चिम बंगाल (West Bengal)', 'Andaman and Nicobar Islands': 'अंदमान आणि निकोबार द्वीपसमूह (Andaman & Nicobar)', 'Chandigarh': 'चंदिगढ (Chandigarh)', 'Dadra and Nagar Haveli and Daman and Diu': 'दादरा आणि नगर हवेली आणि दमण आणि दीव (DNHDD)', 'Delhi': 'दिल्ली (Delhi)', 'Jammu and Kashmir': 'जम्मू आणि काश्मीर (Jammu & Kashmir)', 'Ladakh': 'लडाख (Ladakh)', 'Lakshadweep': 'लक्षद्वीप (Lakshadweep)', 'Puducherry': 'पुडुचेरी (Puducherry)'
    }
  };

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
      'Locomotor Disability': 'Locomotor Disability', 'Visual Impairment': 'Visual Impairment', 'Hearing Impairment': 'Hearing Impairment', 'Intellectual Disability': 'Intellectual Disability', 'Autism Spectrum Disorder': 'Autism Spectrum Disorder', 'Multiple Disabilities': 'Multiple Disabilities',
    },
    Kannada: {
      'Locomotor Disability': 'ಚಲನವಲನ ವಿಕಲಾಂಗತೆ (Locomotor Disability)', 'Visual Impairment': 'ದೃಷ್ಟಿ ದೋಷ (Visual Impairment)', 'Hearing Impairment': 'ಶ್ರವಣ ದೋಷ (Hearing Impairment)', 'Intellectual Disability': 'ಬೌದ್ಧಿಕ ವಿಕಲಾಂಗತೆ (Intellectual Disability)', 'Autism Spectrum Disorder': 'ಆಟಿಸಂ ಸ್ಪೆಕ್ಟ್ರಮ್ ಡಿಸಾರ್ಡರ್ (Autism Spectrum)', 'Multiple Disabilities': 'ಬಹು ವಿಕಲಾಂಗತೆಗಳು (Multiple Disabilities)',
    },
    Hindi: {
      'Locomotor Disability': 'लोकोमोटर दिव्यांगता (Locomotor Disability)', 'Visual Impairment': 'दृष्टिबाधित (Visual Impairment)', 'Hearing Impairment': 'श्रवण बाधित (Hearing Impairment)', 'Intellectual Disability': 'बौद्धिक दिव्यांगता (Intellectual Disability)', 'Autism Spectrum Disorder': 'ऑटिज्म स्पेक्ट्रम डिसऑर्डर (Autism Spectrum)', 'Multiple Disabilities': 'बहु-दिव्यांगता (Multiple Disabilities)',
    },
    Tamil: {
      'Locomotor Disability': 'இயக்கக் குறைபாடு (Locomotor Disability)', 'Visual Impairment': 'பார்வைக் குறைபாடு (Visual Impairment)', 'Hearing Impairment': 'கேள்விக் குறைபாடு (Hearing Impairment)', 'Intellectual Disability': 'அறிவுசார் குறைபாடு (Intellectual Disability)', 'Autism Spectrum Disorder': 'ஆட்டிசம் குறைபாடு (Autism Spectrum)', 'Multiple Disabilities': 'பல்வேறு குறைபாடுகள் (Multiple Disabilities)',
    },
    Telugu: {
      'Locomotor Disability': 'చలన వైకల్యం (Locomotor Disability)', 'Visual Impairment': 'దృష్టి లోపం (Visual Impairment)', 'Hearing Impairment': 'వినికిడి లోపం (Hearing Impairment)', 'Intellectual Disability': 'మేధో వైకల్యం (Intellectual Disability)', 'Autism Spectrum Disorder': 'ఆటిజం స్పెక్ట్రమ్ డిజార్డర్ (Autism Spectrum)', 'Multiple Disabilities': 'బహుళ వైకల్యాలు (Multiple Disabilities)',
    },
    Bengali: {
      'Locomotor Disability': 'লোকোমোটর প্রতিবন্ধকতা (Locomotor Disability)', 'Visual Impairment': 'দৃষ্টি প্রতিবন্ধকতা (Visual Impairment)', 'Hearing Impairment': 'শ্রবণ প্রতিবন্ধকতা (Hearing Impairment)', 'Intellectual Disability': 'বুদ্ধিবৃত্তিক প্রতিবন্ধকতা (Intellectual Disability)', 'Autism Spectrum Disorder': 'অটিজম স্পেকট্রাম ডিসঅর্ডার (Autism Spectrum)', 'Multiple Disabilities': 'একাধিক প্রতিবন্ধকতা (Multiple Disabilities)',
    },
    Marathi: {
      'Locomotor Disability': 'अस्थिव्यंग दिव्यांगत्व (Locomotor Disability)', 'Visual Impairment': 'दृष्टिदोष (Visual Impairment)', 'Hearing Impairment': 'कर्णबधिरता (Hearing Impairment)', 'Intellectual Disability': 'बौद्धिक दिव्यांगत्व (Intellectual Disability)', 'Autism Spectrum Disorder': 'ऑटिझम स्पेक्ट्रम डिसऑर्डर (Autism Spectrum)', 'Multiple Disabilities': 'बहुविकलांगत्व (Multiple Disabilities)',
    },
  };
  
  const stateOptions = useMemo(() => {
    const langMap = COMPLETE_STATE_TRANSLATIONS[appLang] || COMPLETE_STATE_TRANSLATIONS.English;
    return ALL_INDIA_STATES_AND_UTS.map((st) => ({
      value: st,
      label: langMap[st] || st
    }));
  }, [appLang]);

  const dateOfBirth = dobDay && dobMonth && dobYear ? `${dobDay}/${dobMonth}/${dobYear}` : '';

  const [state, setState] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [uid, setUid] = useState('');
  const [loading, setLoading] = useState(false);
  const [userMode, setUserMode] = useState<'individual' | 'operator'>('individual');
  const [operatorId, setOperatorId] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const disabilityTypeOptions = useMemo(() => {
    const optiosMap = COMPLETE_DISABILITY_TRANSLATIONS[appLang] || COMPLETE_DISABILITY_TRANSLATIONS.English;
    return RAW_DISABILITY_TYPES.map((st) => ({
      value: st,
      label: optiosMap[st] || st
    }));
  }, [appLang]);

  function validatePhone(phone: string): boolean {
    const cleaned = phone.trim();
    return /^[6-9]\d{9}$/.test(cleaned);
  }

  // Multi-step validation guards
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!fullName.trim()) {
        Alert.alert('Missing Field', 'Please enter your full name.');
        return;
      }
      if (!validatePhone(phoneNumber)) {
        Alert.alert('Invalid Phone', 'Please enter a valid 10-digit Indian mobile number.');
        return;
      }
      if (userMode === 'operator' && !operatorId.trim()) {
        Alert.alert('Missing Operator ID', 'Please provide an official NGO Staff/Volunteer reference ID.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!disabilityType) {
        Alert.alert('Missing Field', 'Please select your disability type.');
        return;
      }
      if (!dobDay || !dobMonth || !dobYear) {
        Alert.alert('Missing Field', 'Please select your complete date of birth.');
        return;
      }
      if (!state) {
        Alert.alert('Missing Field', 'Please select your state.');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleRegister = async () => {
    const cleanedPhone = phoneNumber.trim();

    if (!preferredLanguage) {
      Alert.alert('Missing Field', 'Please select your preferred language.');
      return;
    }

    setLoading(true);
    try {
      const computedNgoId = userMode === 'operator' ? operatorId.trim() : 'CENTRAL_POOL';
      const computedRegisteredBy = userMode === 'operator' ? `Staff_${operatorId.trim()}` : 'Self';

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
  };

  useEffect(() => {
    async function loadSavedLanguage() {
      const savedLang = await AsyncStorage.getItem('appLanguagePreference');
      if (savedLang) {
        setAppLang(savedLang as AppLanguage);
        setPreferredLanguage(savedLang);
      }
    }
    loadSavedLanguage();
  }, []);

  const handleLanguageChange = async (newLang: string) => {
    setAppLang(newLang as AppLanguage);
    setPreferredLanguage(newLang);
    await AsyncStorage.setItem('appLanguagePreference', newLang);
  };

  const t = ((appDictionary as Record<string, any>)?.[appLang] || (appDictionary as Record<string, any>)?.English || {}) as Record<string, string>;
  const a11y = A11Y_TRANSLATIONS[appLang] || A11Y_TRANSLATIONS.English;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* ── HIGH-VISIBILITY ACCESSIBLE LANGUAGE SWITCHER ── */}
      <View 
        style={styles.topLanguageBar}
        accessibilityRole="header"
        accessibilityLabel={a11y.langSelectorLabel}
      >
        <Ionicons name="globe-outline" size={22} color="#1d4ed8" style={{ marginRight: 8 }} />
        <View style={{ flex: 1 }}>
          <DropdownField
            label=""
            value={appLang}
            options={LOCAL_LANGUAGE_OPTIONS}
            onSelect={handleLanguageChange}
            placeholder="Select Display Language"
            getFontSize={getFontSize}
            appLang={appLang}
          />
        </View>
      </View>

      <Text style={styles.screenTitle} accessibilityRole="header">
        {t.signUpTitle || "Sign Up"}
      </Text>

      {/* ── WIZARD PROGRESS STEPPER ── */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressSegment, currentStep >= 1 && styles.progressSegmentActive]} />
          <View style={[styles.progressSegment, currentStep >= 2 && styles.progressSegmentActive]} />
          <View style={[styles.progressSegment, currentStep >= 3 && styles.progressSegmentActive]} />
        </View>
        <Text style={styles.stepCounterText}>Step {currentStep} of 3</Text>
      </View>

      {/* ───────────────────────────────────────────
          STEP 1: IDENTITY & BASIC DETAILS
         ─────────────────────────────────────────── */}
      {currentStep === 1 && (
        <View>
          <Text style={styles.stepTitle}>1. Basic Information</Text>

          {/* Account Type Layout Selection Tabs */}
          <View style={styles.toggleContainerTabGroup} accessibilityRole="tablist">
            <TouchableOpacity
              style={[styles.toggleTab, userMode === 'individual' && styles.activeToggleTab]}
              onPress={() => setUserMode('individual')}
              accessibilityRole="tab"
              accessibilityLabel={a11y.individualTabLabel}
              accessibilityState={{ selected: userMode === 'individual' }}
            >
              <View style={styles.tabContent}>
                <Ionicons name="person-outline" size={16} color={userMode === 'individual' ? '#2563eb' : '#4b5563'} />
                <Text style={[styles.toggleTabText, userMode === 'individual' && styles.activeToggleTabText]}>
                  {t.individualTab || "Individual"}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleTab, userMode === 'operator' && styles.activeToggleTab]}
              onPress={() => setUserMode('operator')}
              accessibilityRole="tab"
              accessibilityLabel={a11y.operatorTabLabel}
              accessibilityState={{ selected: userMode === 'operator' }}
            >
              <View style={styles.tabContent}>
                <Ionicons name="business-outline" size={16} color={userMode === 'operator' ? '#2563eb' : '#4b5563'} />
                <Text style={[styles.toggleTabText, userMode === 'operator' && styles.activeToggleTabText]}>
                  {t.ngoOperatorTab || "NGO Operator"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Displayed exclusively when on-boarding via assisted operator modes */}
          {userMode === 'operator' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label} aria-hidden={true}>{t.ngoIdLabel || "Official NGO ID"}</Text>
              <TextInput
                style={[styles.inputLike, focusedField === 'operatorId' && styles.inputFocused]}
                onFocus={() => setFocusedField('operatorId')}
                onBlur={() => setFocusedField(null)}
                value={operatorId}
                onChangeText={setOperatorId}
                placeholder={t.ngoIdPlaceholder || "Enter NGO Id"}
                placeholderTextColor="#94a3b8"
                accessibilityLabel={a11y.operatorIdLabel}
                accessibilityHint={a11y.operatorIdHint}
              />
            </View>
          )}

          {/* NAME */} 
          <View style={styles.fieldGroup}>
            <Text style={styles.label} aria-hidden={true}>{t.fullNameLabel || "Full Name"}</Text>
            <TextInput
              style={[styles.inputLike, focusedField === 'fullName' && styles.inputFocused]}
              onFocus={() => setFocusedField('fullName')}
              onBlur={() => setFocusedField(null)}
              value={fullName}
              onChangeText={setFullName}
              placeholder={t.fullNamePlaceholder || "Enter your full name"}
              placeholderTextColor="#94a3b8"
              accessibilityLabel={a11y.nameLabel}
              accessibilityHint={a11y.nameHint}
            />
          </View>

          {/* PHONE */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label} aria-hidden={true}>{t.phoneLabel || "Phone Number"}</Text>
            <TextInput
              style={[styles.inputLike, focusedField === 'phone' && styles.inputFocused]}
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(null)}
              value={phoneNumber}
              onChangeText={(text) => {
                const digits = text.replace(/[^0-9]/g, '').slice(0, 10);
                setPhoneNumber(digits);
              }}
              placeholder={t.phonePlaceholder || "10-digit mobile number"}
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              maxLength={10}
              accessibilityLabel={a11y.phoneLabel}
              accessibilityHint={a11y.phoneHint}
            />
            {phoneNumber.length > 0 && !validatePhone(phoneNumber) && (
              <Text style={styles.validationError} accessibilityLiveRegion="assertive">
                {t.phoneValidationError || "Please enter a valid 10-digit Indian mobile number"}
              </Text>
            )}
          </View>

          {/* EMAIL */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label} aria-hidden={true}>
              {t.emailLabel || "Email Address"} <Text style={styles.optionalTag}>({t.optionalText || "Optional"})</Text>
            </Text>
            <TextInput
              style={[styles.inputLike, focusedField === 'email' && styles.inputFocused]}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              value={email}
              onChangeText={setEmail}
              placeholder={t.emailPlaceholder || "Enter email if available"}
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel={a11y.emailLabel}
            />
          </View>

          {/* STEP 1 NEXT BUTTON */}
          <TouchableOpacity style={styles.nextButton} onPress={handleNextStep}>
            <Text style={styles.nextButtonText}>Next: Demographics →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ───────────────────────────────────────────
          STEP 2: DISABILITY & DEMOGRAPHICS
         ─────────────────────────────────────────── */}
      {currentStep === 2 && (
        <View>
          <Text style={styles.stepTitle}>2. Demographics & Profile</Text>

          {/* DISABILITY TYPE DROPDOWN */}
          <DropdownField
            label={t.disabilityTypeLabel || "Disability Type *"}
            value={disabilityType}
            onSelect={setDisabilityType}
            placeholder={t.disabilityTypePlaceholder || "Select disability type"}
            options={disabilityTypeOptions}
            getFontSize={getFontSize}
            appLang={appLang}
          />

          {/* Date Of Birth Section */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label} accessibilityRole="header">{t.dobLabel || "Date of Birth"}</Text>
            <View style={styles.dobRow}>
              <View style={styles.dobDayCol}>
                <DropdownField
                  label=""
                  value={dobDay}
                  onSelect={setDobDay}
                  placeholder={t.dobDayPlaceholder || "Day"}
                  options={Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))}
                  appLang={appLang}
                />
              </View>
              <View style={styles.dobMonthCol}>
                <DropdownField
                  label=""
                  value={dobMonth}
                  onSelect={setDobMonth}
                  placeholder={t.dobMonthPlaceholder || "Month"}
                  options={[
                    '01 - Jan', '02 - Feb', '03 - Mar',
                    '04 - Apr', '05 - May', '06 - Jun',
                    '07 - Jul', '08 - Aug', '09 - Sep',
                    '10 - Oct', '11 - Nov', '12 - Dec',
                  ]}
                  appLang={appLang}
                />
              </View>
              <View style={styles.dobYearCol}>
                <DropdownField
                  label=""
                  value={dobYear}
                  onSelect={setDobYear}
                  placeholder={t.dobYearPlaceholder || "Year"}
                  options={Array.from(
                    { length: new Date().getFullYear() - 1900 + 1 },
                    (_, i) => String(new Date().getFullYear() - i)
                  )}
                  appLang={appLang}
                />
              </View>
            </View>
            {dateOfBirth ? (
              <View style={styles.dobPreviewRow}>
                <Ionicons name="calendar-outline" size={14} color="#2563eb" style={{ marginRight: 4 }} />
                <Text style={styles.dobPreview} accessibilityLabel={`${a11y.dobSummaryLabel}: ${dateOfBirth}`}>
                  {dateOfBirth}
                </Text>
              </View>
            ) : null}
          </View>

          {/* STATE */}
          <DropdownField
            label={t.stateLabel || "State / Territory"}
            value={state}
            onSelect={setState}
            placeholder={t.statePlaceholder || "Select your state"}
            options={stateOptions}
            getFontSize={getFontSize}
            appLang={appLang}
          />

          {/* STEP 2 NAVIGATION ROW */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => setCurrentStep(1)}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.nextButton, { flex: 1, marginLeft: 10 }]} onPress={handleNextStep}>
              <Text style={styles.nextButtonText}>Next: Preferences →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ───────────────────────────────────────────
          STEP 3: PREFERENCES & VERIFICATION
         ─────────────────────────────────────────── */}
      {currentStep === 3 && (
        <View>
          <Text style={styles.stepTitle}>3. Preferences & Verification</Text>

          <DropdownField
            label={t.preferredLanguageLabel || "Preferred Language"}
            value={preferredLanguage}
            onSelect={setPreferredLanguage}
            placeholder={t.preferredLanguagePlaceholder || "Select preferred language"}
            options={LOCAL_LANGUAGE_OPTIONS}
            getFontSize={getFontSize}
            appLang={appLang}
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.label} aria-hidden={true}>{t.uidLabel || "Unique Disability ID (UDID)"}</Text>
            <TextInput
              style={[styles.inputLike, focusedField === 'uid' && styles.inputFocused]}
              onFocus={() => setFocusedField('uid')}
              onBlur={() => setFocusedField(null)}
              value={uid}
              onChangeText={setUid}
              placeholder={t.uidPlaceholder || "Enter your UID"}
              placeholderTextColor="#6b7280"
              accessibilityLabel={a11y.uidLabel}
              accessibilityHint={a11y.uidHint}
            />
            <TouchableOpacity
              accessibilityRole="link"
              accessibilityLabel={a11y.uidHelpLabel}
              onPress={() => router.push('/uid-discovery')}
              style={styles.linkContainer}
            >
              <Ionicons name="help-circle-outline" size={16} color="#1d4ed8" style={{ marginRight: 4, marginTop: 10 }} />
              <Text style={styles.linkText}>{t.uidHelpLink || "Don't have a UID? Find nearest hospitals issuing UID/UDID"}</Text>
            </TouchableOpacity>
          </View>

          {/* SUMMARY REVIEW CARD */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Quick Review</Text>
            <Text style={styles.summaryRow}><Text style={{ fontWeight: '700' }}>Name:</Text> {fullName}</Text>
            <Text style={styles.summaryRow}><Text style={{ fontWeight: '700' }}>Phone:</Text> {phoneNumber}</Text>
            <Text style={styles.summaryRow}><Text style={{ fontWeight: '700' }}>Disability:</Text> {disabilityType}</Text>
            <Text style={styles.summaryRow}><Text style={{ fontWeight: '700' }}>State:</Text> {state}</Text>
          </View>

          {/* STEP 3 NAVIGATION ROW & SUBMIT */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => setCurrentStep(2)}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled, { flex: 1, marginLeft: 10, marginTop: 0 }]}
              accessibilityRole="button"
              accessibilityLabel={loading ? a11y.registerLoadingLabel : a11y.registerButtonLabel}
              accessibilityHint={a11y.registerButtonHint}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <View accessibilityLiveRegion="assertive">
                  <ActivityIndicator color="#ffffff" size="small" />
                </View>
              ) : (
                <Text style={styles.registerButtonText}>{t.registerButton || "Register Profile"}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40, backgroundColor: '#ffffff' },
  screenTitle: { fontSize: 32, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5, marginBottom: 16 },
  stepTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  optionalTag: { fontSize: 13, fontWeight: '400', color: '#64748b' },
  rightIcon: { marginLeft: 8 },
  validationError: { marginTop: 6, fontSize: 14, color: '#dc2626', fontWeight: '500' },
  
  // Progress Bar
  progressContainer: { marginBottom: 20 },
  progressBar: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  progressSegment: { flex: 1, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2 },
  progressSegmentActive: { backgroundColor: '#1d4ed8' },
  stepCounterText: { fontSize: 13, color: '#64748b', fontWeight: '600', textAlign: 'right' },

  // Buttons & Rows
  buttonRow: { flexDirection: 'row', marginTop: 12, alignItems: 'center' },
  nextButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  nextButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  backButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    minHeight: 52,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: { color: '#334155', fontSize: 16, fontWeight: '700' },

  // Summary Card
  summaryCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    marginTop: 6,
  },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  summaryRow: { fontSize: 14, color: '#475569', marginBottom: 4 },

  linkContainer: { flexDirection: 'row', alignItems: 'center' },
  linkText: { marginTop: 8, fontSize: 15, color: '#1d4ed8', fontWeight: '600', textDecorationLine: 'underline' },
  registerButtonDisabled: { backgroundColor: '#93c5fd' },
  registerButtonText: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.3)', justifyContent: 'center', paddingHorizontal: 20 },
  modalCard: { backgroundColor: '#ffffff', borderRadius: 16, paddingVertical: 16, maxHeight: '70%', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  
  toggleContainerTabGroup: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 20, width: '100%' },
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
  dobPreview: { fontSize: 14, color: '#2563eb', fontWeight: '600' },

  topLanguageBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#93c5fd',
  },
  fieldGroup: { 
    marginBottom: 16 
  },
  label: { 
    fontWeight: '700', 
    color: '#0f172a',
    marginBottom: 6 
  },
  inputLike: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 52,
    backgroundColor: '#f8fafc',
  },
  inputFocused: {
    borderColor: '#1d4ed8',
    backgroundColor: '#ffffff',
  },
  inputText: { 
    color: '#0f172a', 
    fontWeight: '500',
    flex: 1 
  },
  placeholder: { 
    color: '#475569' 
  },
  optionButton: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14, 
    paddingHorizontal: 16, 
    minHeight: 50,
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9' 
  },
  optionButtonActive: {
    backgroundColor: '#eff6ff',
  },
  optionText: { 
    color: '#1e293b', 
    fontWeight: '500' 
  },
  optionTextActive: { 
    color: '#1d4ed8', 
    fontWeight: '700' 
  },
  registerButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
});