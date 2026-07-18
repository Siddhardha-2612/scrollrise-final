const fs = require('fs');

// LoginFormView.tsx
let loginCode = fs.readFileSync('src/components/LoginFormView.tsx', 'utf8');
loginCode = loginCode.replace(/scopedStorage\.setItem\('booran_personal_dob', data\.user\.dob \|\| ''\);\n\s*/, '');
loginCode = loginCode.replace(/const \[dob, setDob\] = useState\(''\);\n\s*/, '');
loginCode = loginCode.replace(/const trimmedDob = dob\.trim\(\);\n\s*/, '');
loginCode = loginCode.replace(/dob: trimmedDob,\n\s*/, '');
loginCode = loginCode.replace(/\|\| !trimmedDob /g, '');
loginCode = loginCode.replace(/\{\/\* Date of Birth \*\/\}\s*<div className="space-y-1">[\s\S]*?<\/div>\s*\{\/\* New Password \*\/\}/, '{/* New Password */}');
fs.writeFileSync('src/components/LoginFormView.tsx', loginCode);

// PrivacySettingsView.tsx
let privCode = fs.readFileSync('src/components/PrivacySettingsView.tsx', 'utf8');
privCode = privCode.replace(/const \[dob, setDob\] = useState\(\(\) => \{\n\s*return scopedStorage\.getItem\('booran_dob'\) \|\| '';\n\s*\}\);\n\s*/, '');
privCode = privCode.replace(/scopedStorage\.setItem\('booran_dob', dob\);\n\s*/, '');
privCode = privCode.replace(/<div className="bg-neutral-900\/40 border border-white\/5 rounded-2xl p-4 space-y-4">[\s\S]*?Date of Birth[\s\S]*?<\/div>\n\s*/, '');
fs.writeFileSync('src/components/PrivacySettingsView.tsx', privCode);

console.log('Fixed LoginFormView and PrivacySettingsView');
