const fs = require('fs');

// src/components/ConnectionsHubView.tsx
let conn = fs.readFileSync('src/components/ConnectionsHubView.tsx', 'utf8');
conn = conn.replace(/value=\{isCurrentUserProfile \? personalDob : otherUserMockData\?\.dob \|\| ''\}/g, 'value={""}');
conn = conn.replace(/\/\/ mock dob/g, '');
fs.writeFileSync('src/components/ConnectionsHubView.tsx', conn);

// src/components/RegistrationFormView.tsx
let reg = fs.readFileSync('src/components/RegistrationFormView.tsx', 'utf8');
let regStart = reg.indexOf('{/* Date of Birth */}');
if (regStart > -1) {
  let regEnd = reg.indexOf('{/* Checkbox */}');
  if (regEnd > -1) {
    reg = reg.slice(0, regStart) + reg.slice(regEnd);
  }
}
fs.writeFileSync('src/components/RegistrationFormView.tsx', reg);

// src/components/PrivacySettingsView.tsx
let priv = fs.readFileSync('src/components/PrivacySettingsView.tsx', 'utf8');
let privStart = priv.indexOf('<div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-4 space-y-4">');
if (privStart > -1) {
  let privEnd = priv.indexOf('{/* Delete Account */}');
  if (privEnd > -1) {
    priv = priv.slice(0, privStart) + priv.slice(privEnd);
  }
}
fs.writeFileSync('src/components/PrivacySettingsView.tsx', priv);

// src/components/VerifyPhoneView.tsx
let vfy = fs.readFileSync('src/components/VerifyPhoneView.tsx', 'utf8');
let vfyStart = vfy.indexOf('<div className="relative group">');
if (vfyStart > -1) {
  let vfyEnd = vfy.indexOf('<button');
  if (vfyEnd > -1) {
    vfy = vfy.slice(0, vfyStart) + vfy.slice(vfyEnd);
  }
}
fs.writeFileSync('src/components/VerifyPhoneView.tsx', vfy);

console.log('Fixed more dob stuff');
