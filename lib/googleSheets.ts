// googleSheets.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const SHEET_ID = '1XxDcZp8vjgADsMW6sUjc2r2RbL6u8QLm_SXQXfmBMW4';
const API_KEY = 'AIzaSyDne_8Q_RtQw74h74Z-O9GMp5JzYT54clc'; // existing API key
const BASE = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values`;
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwQrpJuBbxob2il_yZwOcfG34jyBArDl7I4RYsfH4RKW7q4n7xtBzhQxLpRXdGZPDGPIQ/exec';

// ── DATA TYPE METADATA DEFINITIONS ──
export type SuggestedSchemeRef = {
  phone: string; // Unified database relation key mapping
  schemeId: string;
  suggestedByOperatorId: string;
  operatorNotes: string;
  timestamp: string;
  ngoId?: string;        // Enforces structural multitenant multi-tenant isolation
};

export const getSchemes = async (forceLang?: string, explicitPhone?: string) => {
  try {
    const rawUser = await AsyncStorage.getItem('loggedInUser');
    const parsedUser = rawUser ? JSON.parse(rawUser) : {};
    const selectedLanguage = forceLang || parsedUser.language || 'English';
    
    // Priority goes to the passed argument to eliminate async loading race conditions
    const userPhone = explicitPhone || parsedUser.phone || ''; 

    const url = `${SCRIPT_URL}?action=getSchemes&lang=${encodeURIComponent(selectedLanguage)}&phone=${encodeURIComponent(userPhone)}&_cb=${Date.now()}`;
    
    const response = await fetch(url);
    const json = await response.json();
    
    // Return the entire object so the client can pull out both schemes and rawSuggestions
    if (json.success) {
      return json;
    }
    return { success: false, schemes: [], rawSuggestions: [] };
  } catch (error) {
    console.error("Multilingual fetch engine failure error:", error);
    return { success: false, schemes: [], rawSuggestions: [] };
  }
};

// ── WRITE user via Apps Script
export async function registerUser(user: {
  name: string; phone: string; email: string;
  disabilityType: string; dob: string; state: string;
  language: string; uid: string; onboardingType?: string;
  registeredBy?: string;
  ngoId?: string;
}) {
  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ 
      sheet: 'Users', 
      userId: `usr-${user.phone}`,
      ...user 
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error('Failed to register');
}

// ── READ user by phone (Centralized App Engine Lookup Helper)
export async function getUserByPhone(phone: string) {
  try {
    const response = await fetch(`${SCRIPT_URL}?action=getUsers&_cb=${Date.now()}`, { 
      method: 'GET' 
    });
        if (response.ok) {
      const data = await response.json();
      if (data.success && Array.isArray(data.users)) {
        const cleanInput = String(phone).trim();
        const found = data.users.find((u: any) => String(u.phone).trim() === cleanInput);
        
        if (found) {
          return {
            userId: found.userId || `usr-${found.phone}`,
            name: found.name || '',
            phone: found.phone || '',
            email: found.email || '',
            disabilityType: found.disabilityType || '',
            dob: found.dob || '',
            state: found.state || '',
            language: found.language || '',
            uid: found.uid || '',
            ngoId: found.ngoId || 'CENTRAL_POOL'
          };
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error executing user phone index query lookup:', error);
    return null;
  }
}

// ── WRITE document via Apps Script
export async function saveDocument(doc: {
  userId: string; documentType: string;
  fileName: string; status: string; fileUrl?: string;
}) {
  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ sheet: 'Documents', ...doc }),
  });
  const data = await res.json();
  if (!data.success) throw new Error('Failed to save document');
}

export async function getNgoContactDetails(ngoId: string) {
  try {
    const response = await fetch(
      `${SCRIPT_URL}?action=getNgoDetails&ngoId=${ngoId}`,
      { method: 'GET', redirect: 'follow' }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data && !data.error) {
        return data; // Returns columns: { ngoId, ngoName, helpline, email }
      }
    }
    return null;
  } catch (error) {
    console.error("Failed to query multi-tenant dynamic configuration metrics:", error);
    return null;
  }
}

export async function trackAnalytics(
  schemeId: string, 
  schemeName: string, 
  disabilityType: string,
  action: 'viewed' | 'saved' | 'apply_clicked' | 'i_applied' | 'shared'
) {
  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        sheet: 'Analytics',
        schemeId: schemeId,                        // ➔ Column B (e.g., S11)
        schemeName: schemeName || 'Welfare Program', // ➔ Column C (True English Name text string)
        disabilityType: disabilityType || 'General',// ➔ Column D (Beneficiary Category)
        action: action,                            // ➔ Column E (viewed, apply_clicked, etc.)
        englishSchemeName: ''                      // ➔ Column F (Safety placeholder)
      }),
    });
  } catch (err) {
    console.error('Analytics tracking failed:', err);
  }
}

// ── NEW FEATURE: VERIFY PASSPHRASE GATEWAY ──
export async function verifyNgoAdmin(passwordInput: string,ngoIdInput :string): Promise<{ success: boolean; ngoDetails?: { ngoId: string; ngoName: string }; message?: string }> {
  try {
    const response = await fetch(`${SCRIPT_URL}?action=verifyNgoAdmin&password=${encodeURIComponent(passwordInput.trim())}&ngoId=${ngoIdInput}`, {
      method: 'GET'
    });
    if (response.ok) {
      return await response.json();
    }
    return { success: false, message: 'Server connection issues.' };
  } catch (error) {
    return { success: false, message: 'Network lookup timeout.' };
  }
}

// ── SELF-SERVICE NGO SIGN UP ──
export async function registerNewNgoOrganization(ngoPayload: {
  ngoId: string;
  ngoName: string;
  helpline: string;
  email: string;
  passwordInput: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        sheet: 'NGORegistry',
        ngoId:ngoPayload.ngoId,
        ngoName: ngoPayload.ngoName,
        helpline: ngoPayload.helpline,
        email: ngoPayload.email,
        password: ngoPayload.passwordInput,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: data.success, message: data.success ? 'Registration complete!' : 'Failed to register.' };
    }
    return { success: false, message: 'Server communication error.' };
  } catch (error) {
    return { success: false, message: 'Network connection failed.' };
  }
}

// ── NEW FEATURE: READ SCHEME CURATION RECOMMENDATIONS ──
export async function getSuggestedSchemes(): Promise<SuggestedSchemeRef[]> {
  try {
    const response = await fetch(`${SCRIPT_URL}?action=getSuggestions`, {
      method: 'GET',
    });

    if (response.ok) {
      const rawData = await response.json();
      return Array.isArray(rawData) ? rawData : [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching scheme suggestions row data clusters:', error);
    return [];
  }
}




// ── SELF-SERVICE NGO SIGN UP ──
export async function addSchemes(addScheme: {

  schemeName:string,
  issuingBody:string,
  disabilityType:string,
  schemeSummary:string,
  eligibility:string,
  howToApply:string,
  applicationUrl:string,

}): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        //action:'AddScheme',
        sheet: 'AddScheme',
        schemeName:addScheme.schemeName,
        issuingBody: addScheme.issuingBody,
        disabilityType: addScheme.disabilityType,
        schemeSummary: addScheme.schemeSummary,
        eligibility: addScheme.eligibility,
        howToApply:addScheme.howToApply,
        applicationUrl:addScheme.applicationUrl,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: data.success, message: data.success ? 'Scheme Posted!' : 'Failed to post.' };
    }
    return { success: false, message: 'Server communication error.' };
  } catch (error) {
    return { success: false, message: 'Network connection failed.' };
  }
}


// ── NEW FEATURE: WRITE CURATION RECO ROW ──


export async function submitSchemeSuggestion(payload: {
  phone: string; 
  schemeId: string;
  operatorId: string;
  operatorNotes: string;
  ngoId: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'suggestScheme',
        ...payload,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return {
        success: result.success || false,
        message: result.message || 'Action executed successfully.',
      };
    }
    return { success: false, message: 'Server responded with an error.' };
  } catch (error) {
    console.error('Failed to submit suggestion:', error);
    return { success: false, message: 'Network connection failed.' };
  }
}