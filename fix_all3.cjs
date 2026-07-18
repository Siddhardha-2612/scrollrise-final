const fs = require('fs');

// src/components/RegistrationFormView.tsx
let reg = fs.readFileSync('src/components/RegistrationFormView.tsx', 'utf8');
reg = reg.replace(/\{\/\* DATE OF BIRTH INPUT \*\/\}\s*<div className="space-y-2">[\s\S]*?<\/div>\s*<\/div>\s*<div className="flex items-center gap-3 mt-4 cursor-pointer"/, '<div className="flex items-center gap-3 mt-4 cursor-pointer"');
fs.writeFileSync('src/components/RegistrationFormView.tsx', reg);

// src/components/PrivacySettingsView.tsx
let priv = fs.readFileSync('src/components/PrivacySettingsView.tsx', 'utf8');
priv = priv.replace(/\{\/\* Date of birth input field \*\/\}\s*<div className="space-y-1\.5 font-sans">[\s\S]*?<\/div>\s*<\/div>\s*\{\/\* Selector: Lock \/ Unlock/, '{/* Selector: Lock / Unlock');
fs.writeFileSync('src/components/PrivacySettingsView.tsx', priv);

// src/components/VerifyPhoneView.tsx
let vfy = fs.readFileSync('src/components/VerifyPhoneView.tsx', 'utf8');
vfy = vfy.replace(/<div className="space-y-2">\s*<label className="text-sm font-medium text-neutral-300 ml-1">Date of Birth<\/label>\s*<div className="relative">[\s\S]*?<\/div>\s*<\/div>/, '');
vfy = vfy.replace(/const \[dob, setDob\] = useState\(''\);\n\s*/, '');
fs.writeFileSync('src/components/VerifyPhoneView.tsx', vfy);

console.log('Fixed remaining UI inputs');
