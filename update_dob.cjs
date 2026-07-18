const fs = require('fs');

// 1. src/db/models/index.ts
let modelsCode = fs.readFileSync('src/db/models/index.ts', 'utf8');
modelsCode = modelsCode.replace(/dob: \{ type: String, required: true \},\n\s*/g, '');
fs.writeFileSync('src/db/models/index.ts', modelsCode);

// 2. server.ts
let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace(/, dob/g, '');
serverCode = serverCode.replace(/dob,\n\s*/g, '');
serverCode = serverCode.replace(/dob: string;\n\s*/g, '');
serverCode = serverCode.replace(/dob: user\.dob,\n\s*/g, '');
fs.writeFileSync('server.ts', serverCode);

// 3. src/components/RegistrationFormView.tsx
let regCode = fs.readFileSync('src/components/RegistrationFormView.tsx', 'utf8');
regCode = regCode.replace(/const \[dob, setDob\] = useState\(''\);\n\s*/, '');
regCode = regCode.replace(/\|\| errorMessage\.toLowerCase\(\)\.includes\('dob'\) /, '');
regCode = regCode.replace(/\|\| errorMessage\.toLowerCase\(\)\.includes\('date of birth'\) /, '');
regCode = regCode.replace(/const trimmedDob = dob\.trim\(\);\n\s*/, '');
regCode = regCode.replace(/dob: trimmedDob,\n\s*/, '');
regCode = regCode.replace(/scopedStorage\.setItem\('booran_personal_dob', trimmedDob\);\n\s*/, '');
regCode = regCode.replace(/\|\| !dob/g, '');
regCode = regCode.replace(/\{\/\* Date of Birth \*\/\}\s*<div className="space-y-1">[\s\S]*?<\/div>\s*\{\/\* Checkbox \*\/\}/, '{/* Checkbox */}');

// Also remove dob check in registration
regCode = regCode.replace(/\|\| dob\.length < 10 /g, '');

fs.writeFileSync('src/components/RegistrationFormView.tsx', regCode);

console.log('Fixed basic files');
