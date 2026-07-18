const fs = require('fs');

// 1. src/components/RegistrationFormView.tsx
let regCode = fs.readFileSync('src/components/RegistrationFormView.tsx', 'utf8');
regCode = regCode.replace(/const handleDobChangeLocal = \([\s\S]*?\}\);\n\s*\}\n\n\s*/, '');
regCode = regCode.replace(/const isDobError = [\s\S]*?;\n\s*/, '');
regCode = regCode.replace(/if \(dob\.length > val\.length[\s\S]*?clean = val\.slice\(0, -1\);\n\s*\}/, '');
regCode = regCode.replace(/\{\/\* Date of Birth \*\/\}\s*<div className="space-y-1">[\s\S]*?<\/div>\s*\{\/\* Checkbox \*\/\}/, '{/* Checkbox */}');
regCode = regCode.replace(/<div className="space-y-1">\s*<label className="text-\[11px\] font-bold text-neutral-400 tracking-wider uppercase ml-1 block">\s*Date of Birth\s*<\/label>[\s\S]*?<\/div>/, ''); // try again just in case
// Just search and remove the Date of Birth div manually
let dobDivStart = regCode.indexOf('{/* Date of Birth */}');
if (dobDivStart > -1) {
  let dobDivEnd = regCode.indexOf('{/* Checkbox */}');
  if (dobDivEnd > -1) {
    regCode = regCode.slice(0, dobDivStart) + regCode.slice(dobDivEnd);
  }
}
fs.writeFileSync('src/components/RegistrationFormView.tsx', regCode);

// 2. src/components/PrivacySettingsView.tsx
let privCode = fs.readFileSync('src/components/PrivacySettingsView.tsx', 'utf8');
let dobDivStartPriv = privCode.indexOf('{/* Date of Birth */}');
if (dobDivStartPriv > -1) {
  let dobDivEndPriv = privCode.indexOf('{/* Delete Account */}');
  if (dobDivEndPriv > -1) {
    privCode = privCode.slice(0, dobDivStartPriv) + privCode.slice(dobDivEndPriv);
  }
}
fs.writeFileSync('src/components/PrivacySettingsView.tsx', privCode);

// 3. src/components/VerifyPhoneView.tsx
let vfyCode = fs.readFileSync('src/components/VerifyPhoneView.tsx', 'utf8');
vfyCode = vfyCode.replace(/const \[dob, setDob\] = useState\(''\);\n\s*/, '');
vfyCode = vfyCode.replace(/const handleDobChange = \([\s\S]*?\}\);\n\s*\};\n\s*/, '');
let dobDivStartVfy = vfyCode.indexOf('<div className="relative group">');
// wait, verify phone view has dob? Let's check with replace
vfyCode = vfyCode.replace(/<div className="relative group">\s*<input\s*type="text"\s*maxLength=\{10\}\s*value=\{dob\}[\s\S]*?<\/div>/, '');
vfyCode = vfyCode.replace(/\|\| dob\.length < 10 /g, '');
vfyCode = vfyCode.replace(/\|\| !dob/g, '');
vfyCode = vfyCode.replace(/dob\.length/g, '0'); // fallback
fs.writeFileSync('src/components/VerifyPhoneView.tsx', vfyCode);

// 4. src/components/ConnectionsHubView.tsx
let connCode = fs.readFileSync('src/components/ConnectionsHubView.tsx', 'utf8');
connCode = connCode.replace(/const \[personalDob, setPersonalDob\] = useState\(\(\) => scopedStorage\.getItem\('booran_personal_dob'\) \|\| ''\);\n\s*/, '');
connCode = connCode.replace(/scopedStorage\.setItem\('booran_personal_dob', personalDob\);\n\s*/, '');
connCode = connCode.replace(/actualDob = match\.dob \|\| '';\n\s*/, '');
connCode = connCode.replace(/const defaultDob = [\s\S]*?;\n\s*/, '');
connCode = connCode.replace(/const dob = actualDob \|\| defaultDob;\n\s*/, '');
connCode = connCode.replace(/dob, mockConns/g, 'mockConns');
let dobInfoStart = connCode.indexOf('{/* Date of Birth */}');
if (dobInfoStart > -1) {
  let dobInfoEnd = connCode.indexOf('{/* Privacy Checkbox */}');
  if (dobInfoEnd > -1) {
    connCode = connCode.slice(0, dobInfoStart) + connCode.slice(dobInfoEnd);
  }
}
fs.writeFileSync('src/components/ConnectionsHubView.tsx', connCode);

// 5. server.ts
let svrCode = fs.readFileSync('server.ts', 'utf8');
svrCode = svrCode.replace(/dob: user\.hideDetails: user\.hideDetails/g, 'hideDetails: user.hideDetails');
fs.writeFileSync('server.ts', svrCode);

console.log('Fixed more files');
