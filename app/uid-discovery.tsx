import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// ── MULTILINGUAL DICTIONARY MATRIX ──
const translations: Record<string, any> = {
  English: {
    title: 'Find an Assessment Center',
    subtitle: 'To obtain or renew your official UID/UDID card, you must undergo verification at an authorized medical board. Choose how you want to proceed:',
    mapsTitle: 'Find Nearby Centers on Google Maps',
    mapsDesc: 'View real-time map routes to physical government hospitals and local medical boards near your current location.',
    portalTitle: 'Official Government Registry',
    portalDesc: 'Look up specific state, district, or block level medical specialists directly on the official Swavlamban website.',
    checklistTitle: 'Documents to bring or have digital copies of:',
    doc1Title: 'Proof of Identity: ',
    doc1Desc: 'Aadhaar Card, Voter ID, Passport, or Driving License.',
    doc2Title: 'Proof of Address: ',
    doc2Desc: 'Ration Card, Utility Bills (Electricity/Water), or a valid Rent Agreement.',
    doc3Title: 'Recent Photographs: ',
    doc3Desc: 'Passport-size color photograph (clear face, white background).',
    doc4Title: 'Medical Documents: ',
    doc4Desc: 'Any old offline physical disability certificates or hospital treatment records if already issued.',
    doc5Title: 'Signature/Thumbprint: ',
    doc5Desc: 'A clean digital photo of your signature or ink thumb impression on white paper (if applying online).',
    backBtn: 'Back to Sign Up',
    selectLang: 'Choose Language'
  },
  Hindi: {
    title: 'मूल्यांकन केंद्र खोजें',
    subtitle: 'अपना आधिकारिक यूआईडी/यूडीआईडी (UID/UDID) कार्ड प्राप्त करने या नवीनीकृत करने के लिए, आपको एक अधिकृत चिकित्सा बोर्ड में सत्यापन कराना होगा। चुनें कि आप कैसे आगे बढ़ना चाहते हैं:',
    mapsTitle: 'गूगल मैप्स पर नजदीकी केंद्र खोजें',
    mapsDesc: 'अपने वर्तमान स्थान के पास के सरकारी अस्पतालों और स्थानीय चिकित्सा बोर्डों के लिए रीयल-टाइम मानचित्र मार्ग देखें।',
    portalTitle: 'आधिकारिक सरकारी रजिस्ट्री',
    portalDesc: 'आधिकारिक स्वावलंबन वेबसाइट पर सीधे विशिष्ट राज्य, जिला या ब्लॉक स्तर के चिकित्सा विशेषज्ञों की खोज करें।',
    checklistTitle: 'साथ लाने वाले या डिजिटल कॉपी रखने वाले दस्तावेज़:',
    doc1Title: 'पहचान का प्रमाण: ',
    doc1Desc: 'आधार कार्ड, मतदाता पहचान पत्र, पासपोर्ट, या ड्राइविंग लाइसेंस।',
    doc2Title: 'पते का प्रमाण: ',
    doc2Desc: 'राशन कार्ड, उपयोगिता बिल (बिजली/पानी), या एक वैध किराया समझौता।',
    doc3Title: 'हाल की तस्वीरें: ',
    doc3Desc: 'पासपोर्ट आकार की रंगीन तस्वीर (साफ चेहरा, सफेद पृष्ठभूमि)।',
    doc4Title: 'चिकित्सा दस्तावेज़: ',
    doc4Desc: 'यदि पहले से जारी किया गया हो तो कोई भी पुराना ऑफलाइन शारीरिक विकलांगता प्रमाण पत्र या अस्पताल के उपचार के रिकॉर्ड।',
    doc5Title: 'हस्ताक्षर/अंगूठे का निशान: ',
    doc5Desc: 'सफेद कागज पर आपके हस्ताक्षर या स्याही के अंगूठे के निशान की एक साफ डिजिटल फोटो (यदि ऑनलाइन आवेदन कर रहे हैं)।',
    backBtn: 'साइन अप पर वापस जाएं',
    selectLang: 'भाषा चुनें'
  },
  Tamil: {
    title: 'மதிப்பீட்டு மையத்தைக் கண்டறியவும்',
    subtitle: 'உங்களது அதிகாரப்பூர்வ UID/UDID கார்டைப் பெற அல்லது புதுப்பிக்க, அங்கீகரிக்கப்பட்ட மருத்துவ வாரியத்தில் சரிபார்ப்புக்கு உட்படுத்த வேண்டும். நீங்கள் எவ்வாறு தொடர விரும்புகிறீர்கள் என்பதைத் தேர்வுசெய்க:',
    mapsTitle: 'கூகுள் மேப்ஸில் அருகிலுள்ள மையங்களைக் கண்டறியவும்',
    mapsDesc: 'உங்கள் தற்போதைய இருப்பிடத்திற்கு அருகிலுள்ள அரசு மருத்துவமனைகள் மற்றும் உள்ளூர் மருத்துவ வாரியங்களுக்கான நிகழ்நேர வரைபட வழிகளைப் பார்க்கவும்.',
    portalTitle: 'அதிகாரப்பூர்வ அரசுப் பதிவு',
    portalDesc: 'அதிகாரப்பூர்வ ஸ்வாவலம்பன் இணையதளத்தில் நேரடியாக குறிப்பிட்ட மாநில, மாவட்ட அல்லது தொகுதி அளவிலான மருத்துவ நிபுணர்களைத் தேடுங்கள்.',
    checklistTitle: 'எடுத்து வர வேண்டிய அல்லது டிஜிட்டல் நகல் வைத்திருக்க வேண்டிய ஆவணங்கள்:',
    doc1Title: 'அடையாளச் சான்று: ',
    doc1Desc: 'ஆதார் அட்டை, வாக்காளர் அடையாள அட்டை, பாஸ்போர்ட் அல்லது ஓட்டுநர் உரிமம்.',
    doc2Title: 'முகவரிச் சான்று: ',
    doc2Desc: 'ரேஷன் கார்டு, பயன்பாட்டுக் கட்டணங்கள் (மின்சாரம்/தண்ணீர்) அல்லது செல்லுபடியாகும் வாடகை ஒப்பந்தம்.',
    doc3Title: 'சமீபத்திய புகைப்படங்கள்: ',
    doc3Desc: 'பாஸ்போர்ட் அளவு வண்ணப் புகைப்படம் (தெளிவான முகம்,amp; வெள்ளை பின்னணி).',
    doc4Title: 'மருத்துவ ஆவணங்கள்: ',
    doc4Desc: 'ஏற்கனவே வழங்கப்பட்டிருந்தால், ஏதேனும் பழைய ஆஃப்லைன் உடல் ஊனமுற்றோர் சான்றிதழ்கள் அல்லது மருத்துவமனை சிகிச்சை பதிவுகள்.',
    doc5Title: 'கையெழுத்து/கைரேகை: ',
    doc5Desc: 'வெள்ளை காகிதத்தில் உங்கள் கையெழுத்து அல்லது மை கட்டைவிரல் ரேகையின் தெளிவான டிஜிட்டல் புகைப்படம் (ஆன்லைனில் விண்ணப்பித்தால்).',
    backBtn: 'பதிவுப் பக்கத்திற்குத் திரும்பு',
    selectLang: 'மொழியைத் தேர்வுசெய்'
  },
  Telugu: {
    title: 'అసెస్మెంట్ కేంద్రాన్ని కనుగొనండి',
    subtitle: 'మీ అధికారిక UID/UDID కార్డ్‌ని పొందడానికి లేదా పునరుద్ధరించడానికి, మీరు అధీకృత వైద్య బోర్డులో ధృవీకరణను పొందాలి. మీరు ఎలా ముందుకు వెళ్లాలో ఎంచుకోండి:',
    mapsTitle: 'గూగుల్ म్యాప్స్‌లో సమీప కేంద్రాలను కనుగొనండి',
    mapsDesc: 'మీ ప్రస్తుత లొకేషన్ సమీపంలోని ప్రభుత్వ ఆసుపత్రులు మరియు స్థానిక వైద్య బోర్డుల రియల్ టైమ్ म్యాప్ రూట్లను చూడండి.',
    portalTitle: 'అధికారిక ప్రభుత్వ రిజిస్ట్రీ',
    portalDesc: 'అధికారిక స్వావలంబన్ వెబ్‌సైట్‌లో నేరుగా నిర్దిష్ట రాష్ట్ర, జిల్లా లేదా బ్లాక్ స్థాయి వైద్య నిపుణులను వెతకండి.',
    checklistTitle: 'తీసుకురావలసిన లేదా డిజిటల్ కాపీలు ఉంచుకోవలసిన పత్రాలు:',
    doc1Title: 'గుర్తింపు రుజువు: ',
    doc1Desc: 'ఆధార్ కార్డ్, ఓటర్ ఐడి, పాస్‌పోర్ట్ లేదా డ్రైవింగ్ లైసెన్స్.',
    doc2Title: 'చిరునామా రుజువు: ',
    doc2Desc: 'రేషన్ కార్డ్, యుటిలిటీ బిల్లులు (విద్యుత్/నీరు) లేదా చెల్లుబాటు అయ్యే అద్దె ఒప్పందం.',
    doc3Title: 'ఇటీవలి ఛాయాచిత్రాలు: ',
    doc3Desc: 'పాస్‌పోర్ట్ సైజ్ కలర్ ఫోటోగ్రాఫ్ (స్పష్టమైన ముఖం, తెల్లటి బ్యాక్‌గ్రౌండ్).',
    doc4Title: 'వైద్య పత్రాలు: ',
    doc4Desc: 'ఇప్పటికే జారీ చేసినట్లయితే పాత ఆఫ్‌లైన్ శారీరక వైకల్య ధృవీకరణ పత్రాలు లేదా ఆసుపత్రి చికిత్స రికార్డులు.',
    doc5Title: 'సంతకం/బొటనవేలు ముద్ర: ',
    doc5Desc: 'వైట్ పేపర్‌పై మీ సంతకం లేదా సిరా బొటనవేలు ముద్ర యొక్క స్పష్టమైన డిజిటల్ ఫోటో (ఆన్‌లైన్‌లో దరఖాస్తు చేస్తే).',
    backBtn: 'వెనుకకు సైన్ అప్',
    selectLang: 'భాషను ఎంచుకోండి'
  },
  Bengali: {
    title: 'মূল্যায়ন কেন্দ্র খুঁজুন',
    subtitle: 'আপনার অফিসিয়াল UID/UDID कार्ड পেতে বা পুনর্নবীকরণ করতে, আপনাকে একটি অনুমোদিত মেডিকেল বোর্ডের মাধ্যমে যাচাইকরণ করতে হবে। আপনি কীভাবে এগিয়ে যেতে চান তা চয়ন করুন:',
    mapsTitle: 'গুগল ম্যাপে কাছাকাছি কেন্দ্র খুঁজুন',
    mapsDesc: 'আপনার বর্তমান অবস্থানের কাছাকাছি সরকারি হাসপাতাল এবং স্থানীয় মেডিকেল বোর্ডগুলির রিয়েল-টাইম মানচিত্রের রুটগুলি দেখুন।',
    portalTitle: 'অফিসিয়াল সরকারি রেজিস্ট্রি',
    portalDesc: 'অফিসিয়াল স্বাবলম্বন ওয়েবসাইটে সরাসরি নির্দিষ্ট রাজ্য, জেলা বা ব্লক স্তরের চিকিৎসা বিশেষজ্ঞদের সন্ধান করুন।',
    checklistTitle: 'যে নথিগুলি সাথে আনতে হবে বা ডিজিটাল কপি রাখতে হবে:',
    doc1Title: 'পরিচয়ের প্রমাণ: ',
    doc1Desc: 'আধার কার্ড, ভোটার আইডি, পাসপোর্ট বা ড্রাইভিং লাইসেন্স।',
    doc2Title: 'ঠিকানার প্রমাণ: ',
    doc2Desc: 'রেশন কার্ড, ইউটিलिटी বিল (বিদ্যুৎ/জল), বা একটি বৈধ ভাড়ার চুক্তি।',
    doc3Title: 'সাম্প্রতিক ছবি: ',
    doc3Desc: 'পাসপোর্ট সাইজের রঙিন ছবি (পরিষ্কার মুখ, সাদা ব্যাকগ্রাউন্ড)।',
    doc4Title: 'চিকিৎসা সংক্রান্ত নথি: ',
    doc4Desc: 'ইতিমধ্যেই জারি করা হয়ে থাকলে কোনো পুরানো অফলাইন শারীরিক প্রতিবন্ধকতার শংসাপत्र বা হাসপাতালের চিকিৎসার রেকর্ড।',
    doc5Title: 'স্বাক্ষর/বুড়ো আঙুলের ছাপ: ',
    doc5Desc: 'সাদা কাগজে আপনার স্বাক্ষর বা কালির বুড়ো আঙুলের ছাপের একটি পরিষ্কারデジタル ছবি (অনলাইনে আবেদন করার ক্ষেত্রে)।',
    backBtn: 'সাইন আপে ফিরে যান',
    selectLang: 'ভাষা চয়ন করুন'
  },
  Marathi: {
    title: 'मूल्यांकन केंद्र शोधा',
    subtitle: 'तुमचे अधिकृत UID/UDID कार्ड मिळवण्यासाठी किंवा नूतनीकरण करण्यासाठी, तुम्हाला अधिकृत वैद्यकीय मंडळाकडे पडताळणी करावी लागेल। तुम्ही कसे पुढे जाऊ इच्छिता ते निवडा:',
    mapsTitle: 'गूगल मॅपवर जवळील केंद्रे शोधा',
    mapsDesc: 'तुमच्या वर्तमान स्थानाजवळील सरकारी रुग्णालये आणि स्थानिक वैद्यकीय मंडळांचे रीअल-टाइम मार्ग पहा।',
    portalTitle: 'अधिकृत सरकारी नोंदणी',
    portalDesc: 'अधिकृत स्वावलंबन वेबसाइटवर थेट विशिष्ट राज्य, जिल्हा किंवा ब्लॉक पातळीवरील वैद्यकीय तज्ञांचा शोध घ्या।',
    checklistTitle: 'सोबत आणायची किंवा डिजिटल प्रत ठेवायची कागदपत्रे:',
    doc1Title: 'ओळखपत्राचा पुरावा: ',
    doc1Desc: 'आधार कार्ड, मतदार ओळखपत्र, पासपोर्ट किंवा ड्रायव्हिंग लायसन्स।',
    doc2Title: 'पत्याचा पुरावा: ',
    doc2Desc: 'रेशन कार्ड, युटिलिटी बिले (वीज/पाणी) किंवा वैध भाडे करार।',
    doc3Title: 'अलीकडील छायाचित्रे: ',
    doc3Desc: 'पासपोर्ट आकाराचा रंगीत फोटो (स्पष्ट चेहरा, पांढरी पार्श्वभूमी)।',
    doc4Title: 'वैद्यकीय कागदपत्रे: ',
    doc4Desc: 'पूर्वी जारी केलेले असल्यास कोणतेही जुने ऑफलाइन शारीरिक अपंगत्व प्रमाणपत्र किंवा रुग्णालयातील उपचारांचे रेकॉर्ड।',
    doc5Title: 'स्वाक्षरी/अंगठ्याचा ठसा: ',
    doc5Desc: 'पांढऱ्या कागदावर तुमच्या स्वाक्षरीचा किंवा शाईच्या अंगठ्याच्या ठशाचा स्पष्ट डिजिटल फोटो (ऑनलाइन अर्ज करत असल्यास)।',
    backBtn: 'साइन अप वर परत जा',
    selectLang: 'भाषा निवडा'
  },
  Kannada: {
    title: 'ಮೌಲ್ಯಮಾಪನ ಕೇಂದ್ರವನ್ನು ಹುಡುಕಿ',
    subtitle: 'ನಿಮ್ಮ ಅಧಿಕೃತ UID/UDID ಕಾರ್ಡ್ ಪಡೆಯಲು ಅಥವಾ ನವೀಕರಿಸಲು, ನೀವು ಅಧಿಕೃತ ವೈದ್ಯಕೀಯ ಮಂಡಳಿಯಲ್ಲಿ ಪರಿಶೀಲನೆಗೆ ಒಳಪಡಬೇಕು. ನೀವು ಹೇಗೆ ಮುಂದುವರಿಯಬೇಕೆಂದು ಆಯ್ಕೆಮಾಡಿ:',
    mapsTitle: 'ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್‌ನಲ್ಲಿ ಹತ್ತಿರದ ಕೇಂದ್ರಗಳನ್ನು ಹುಡುಕಿ',
    mapsDesc: 'ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸ್ಥಳದ ಸಮೀಪವಿರುವ ಸರ್ಕಾರಿ ಆಸ್ಪತ್ರೆಗಳು ಮತ್ತು ಸ್ಥಳೀಯ ವೈದ್ಯಕೀಯ ಮಂಡಳಿಗಳ ನೈಜ-ಸಮಯದ ನಕ್ಷೆಯ ಮಾರ್ಗಗಳನ್ನು ವೀಕ್ಷಿಸಿ.',
    portalTitle: 'ಅಧಿಕೃತ ಸರ್ಕಾರಿ ನೋಂದಣಿ',
    portalDesc: 'ಅಧಿಕೃತ ಸ್ವಾವಲಂಬನ್ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ನೇರವಾಗಿ ನಿರ್ದಿಷ್ಟ ರಾಜ್ಯ, ಜಿಲ್ಲೆ ಅಥವಾ ಬ್ಲಾಕ್ ಮಟ್ಟದ ವೈದ್ಯಕೀಯ ತಜ್ಞರನ್ನು ಹುಡುಕಿ.',
    checklistTitle: 'ತರಬೇಕಾದ ಅಥವಾ ಡಿಜಿಟಲ್ ಪ್ರತಿಗಳನ್ನು ಹೊಂದಿರಬೇಕಾದ ದಾಖಲೆಗಳು:',
    doc1Title: 'ಗುರುತಿನ ಪುರಾವೆ: ',
    doc1Desc: 'ಆಧಾರ್ ಕಾರ್ಡ್, ವೋಟರ್ ಐಡಿ, ಪಾಸ್‌ಪೋರ್ಟ್ ಅಥವಾ ಡ್ರೈವಿಂಗ್ ಲೈಸೆನ್ಸ್.',
    doc2Title: 'ವಿಳಾಸದ ಪುರಾವೆ: ',
    doc2Desc: 'ರೇಷನ್ ಕಾರ್ಡ್, ಯುಟಿಲಿಟಿ ಬಿಲ್‌ಗಳು (ವಿದ್ಯುತ್/ನೀರು) ಅಥವಾ ಮಾನ್ಯ ಬಾಡಿಗೆ ಒಪ್ಪಂದ.',
    doc3Title: 'ಇತ್ತೀಚಿನ ಛಾಯಾಚಿತ್ರಗಳು: ',
    doc3Desc: 'ಪಾಸ್‌ಪೋರ್ಟ್ ಗಾತ್ರದ ಬಣ್ಣದ ಛಾಯಾಚಿತ್ರ (ಸ್ಪಷ್ಟ ಮುಖ, ಬಿಳಿ ಹಿನ್ನೆಲೆ).',
    doc4Title: 'ವೈದ್ಯಕೀಯ ದಾಖಲೆಗಳು: ',
    doc4Desc: 'ಈಗಾಗಲೇ ನೀಡಲಾಗಿದ್ದರೆ ಯಾವುದೇ ಹಳೆಯ ಆಫ್‌ಲೈನ್ ದೈಹಿಕ ಅಂಗವೈಕಲ್ಯ ಪ್ರಮಾಣಪತ್ರಗಳು ಅಥವಾ ಆಸ್ಪತ್ರೆ ಚಿಕಿತ್ಸೆಯ ದಾಖಲೆಗಳು.',
    doc5Title: 'ಸಹಿ/ಹೆಬ್ಬೆರಳ ಗುರುತು: ',
    doc5Desc: 'ಬಿಳಿ ಕಾಗದದ ಮೇಲೆ ನಿಮ್ಮ ಸಹಿ ಅಥವಾ ಶಾಯಿ ಹೆಬ್ಬೆರಳ ಗುರುತಿನ ಸ್ಪಷ್ಟ ಡಿಜಿಟಲ್ ಫೋಟೋ (ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿದರೆ).',
    backBtn: 'ಸೈನ್ ಅಪ್‌ಗೆ ಹಿಂತಿರುಗಿ',
    selectLang: 'ಭಾಷೆಯನ್ನು ಆರಿಸಿ'
  }
};

export default function UdidDiscoveryScreen() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const currentText = translations[selectedLanguage] || translations.English;

  const handleOpenGoogleMaps = () => {
    const query = encodeURIComponent('Government Hospital UDID card assessment center');
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const handleOpenSwavlambanPortal = () => {
    Linking.openURL('https://www.swavlambancard.gov.in/center-locator');
  };

  const availableLanguages = [
    { key: 'English', label: 'English' },
    { key: 'Hindi', label: 'हिन्दी' },
    { key: 'Tamil', label: 'தமிழ்' },
    { key: 'Telugu', label: 'తెలుగు' },
    { key: 'Bengali', label: 'বাংলা' },
    { key: 'Marathi', label: 'मराठी' },
    { key: 'Kannada', label: 'ಕನ್ನಡ' }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* Upper Navigation Bar Row */}
      <View style={styles.topBarRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <View style={styles.backButtonFlex}>
            <Ionicons name="arrow-back-outline" size={18} color="#2563eb" style={{ marginRight: 4 }} />
            <Text style={styles.backButtonText}>{currentText.backBtn}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.langSelectorBtn} 
          onPress={() => setLangMenuOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Select Language. Current selection is ${selectedLanguage}`}
          accessibilityHint="Double tap to open a menu and change the app language"
          accessibilityState={{ expanded: langMenuOpen }}
        >
          <View style={styles.langBtnContent}>
            <Ionicons name="language-outline" size={16} color="#4b5563" style={{ marginRight: 6 }} />
            <Text style={styles.langSelectorBtnText}>
              Language: <Text style={styles.activeLangText}>{availableLanguages.find(l => l.key === selectedLanguage)?.label || selectedLanguage} ▼</Text>
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.screenTitle} accessibilityRole="header">
        {currentText.title}
      </Text>
      
      <Text style={styles.screenSubtitle}>
        {currentText.subtitle}
      </Text>

      {/* CHOICE 1: MAPS - Ionicons */}
      <TouchableOpacity style={styles.actionCardMaps} onPress={handleOpenGoogleMaps}>
        <View style={styles.iconWrapperMaps}>
          <Ionicons name="location" size={32} color="#16a34a" />
        </View>
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>{currentText.mapsTitle}</Text>
          <Text style={styles.cardDescription}>{currentText.mapsDesc}</Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={18} color="#16a34a" />
      </TouchableOpacity>

      {/* CHOICE 2: PORTAL - Ionicons */}
      <TouchableOpacity style={styles.actionCardPortal} onPress={handleOpenSwavlambanPortal}>
        <View style={styles.iconWrapperPortal}>
          <Ionicons name="globe" size={32} color="#2563eb" />
        </View>
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>{currentText.portalTitle}</Text>
          <Text style={styles.cardDescription}>{currentText.portalDesc}</Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={18} color="#2563eb" />
      </TouchableOpacity>

      {/* Checklist View Container */}
      <View style={styles.checklistCard}>
        <View style={styles.checklistHeaderRow}>
          <Ionicons name="alert-circle" size={20} color="#dc2626" style={{ marginRight: 6 }} />
          <Text style={styles.checklistTitle}>{currentText.checklistTitle}</Text>
        </View>
        
        <View style={styles.checklistItem}>
          <Ionicons name="checkbox-outline" size={18} color="#4b5563" style={styles.checkIconSpacing} />
          <Text style={styles.checklistText}>
            <Text style={styles.boldText}>{currentText.doc1Title}</Text>{currentText.doc1Desc}
          </Text>
        </View>

        <View style={styles.checklistItem}>
          <Ionicons name="checkbox-outline" size={18} color="#4b5563" style={styles.checkIconSpacing} />
          <Text style={styles.checklistText}>
            <Text style={styles.boldText}>{currentText.doc2Title}</Text>{currentText.doc2Desc}
          </Text>
        </View>

        <View style={styles.checklistItem}>
          <Ionicons name="checkbox-outline" size={18} color="#4b5563" style={styles.checkIconSpacing} />
          <Text style={styles.checklistText}>
            <Text style={styles.boldText}>{currentText.doc3Title}</Text>{currentText.doc3Desc}
          </Text>
        </View>

        <View style={styles.checklistItem}>
          <Ionicons name="checkbox-outline" size={18} color="#4b5563" style={styles.checkIconSpacing} />
          <Text style={styles.checklistText}>
            <Text style={styles.boldText}>{currentText.doc4Title}</Text>{currentText.doc4Desc}
          </Text>
        </View>

        <View style={styles.checklistItem}>
          <Ionicons name="checkbox-outline" size={18} color="#4b5563" style={styles.checkIconSpacing} />
          <Text style={styles.checklistText}>
            <Text style={styles.boldText}>{currentText.doc5Title}</Text>{currentText.doc5Desc}
          </Text>
        </View>
      </View>

      {/* Language Selection Modal Sheet */}
      <Modal visible={langMenuOpen} transparent animationType="fade" onRequestClose={() => setLangMenuOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setLangMenuOpen(false)}>
          <View style={styles.modalCard} accessibilityViewIsModal={true}>
            <Text style={styles.modalTitle}>Select Language / भाषा चुनें</Text>
            <ScrollView>
              {availableLanguages.map((lang) => (
                <Pressable
                  key={lang.key}
                  style={[styles.optionButton, selectedLanguage === lang.key && styles.activeOption]}
                  onPress={() => {
                    setSelectedLanguage(lang.key); 
                    setLangMenuOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={lang.label}
                  accessibilityState={{ selected: selectedLanguage === lang.key }}
                >
                  <Text style={[styles.optionText, selectedLanguage === lang.key && styles.activeOptionText]}>
                    {lang.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  contentContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  topBarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 10 },
  backButton: { paddingVertical: 6 },
  backButtonFlex: { flexDirection: 'row', alignItems: 'center' },
  backButtonText: { color: '#2563eb', fontSize: 16, fontWeight: '600' },
  screenTitle: { fontSize: 26, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5, marginBottom: 10 },
  screenSubtitle: { fontSize: 15, color: '#475569', lineHeight: 22, marginBottom: 24 },
  
  actionCardMaps: { flexDirection: 'row', backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#bbf7d0', borderRadius: 14, padding: 16, marginBottom: 14, alignItems: 'center', shadowColor: '#16a34a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  actionCardPortal: { flexDirection: 'row', backgroundColor: '#eff6ff', borderWidth: 1.5, borderColor: '#bfdbfe', borderRadius: 14, padding: 16, marginBottom: 24, alignItems: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  iconWrapperMaps: { marginRight: 14, justifyContent: 'center', alignItems: 'center', width: 40 },
  iconWrapperPortal: { marginRight: 14, justifyContent: 'center', alignItems: 'center', width: 40 },
  cardTextContainer: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  cardDescription: { fontSize: 13, color: '#475569', lineHeight: 18 },
  
  checklistCard: { backgroundColor: '#f8fafc', borderRadius: 14, padding: 18, borderWidth: 1.5, borderColor: '#e2e8f0' },
  checklistHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  checklistTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', flex: 1 },
  checklistItem: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start' },
  checkIconSpacing: { marginRight: 8, marginTop: 1 },
  checklistText: { flex: 1, fontSize: 14, color: '#334155', lineHeight: 20 },
  boldText: { fontWeight: '600', color: '#0f172a' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.3)', justifyContent: 'center', paddingHorizontal: 20 },
  modalCard: { backgroundColor: '#ffffff', borderRadius: 16, paddingVertical: 14, maxHeight: '60%', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  optionButton: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  activeOption: { backgroundColor: '#eff6ff' },
  optionText: { fontSize: 16, color: '#334155', fontWeight: '500' },
  activeOptionText: { color: '#2563eb', fontWeight: '700' },

  langSelectorBtn: { 
    backgroundColor: '#f1f5f9', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8, 
    borderWidth: 1.5, 
    borderColor: '#cbd5e1',
    alignSelf: 'flex-start',
  },
  langBtnContent: { flexDirection: 'row', alignItems: 'center' },
  langSelectorBtnText: { 
    fontSize: 14, 
    fontWeight: '500', 
    color: '#475569' 
  },
  activeLangText: { 
    fontWeight: '700', 
    color: '#2563eb' 
  },
});