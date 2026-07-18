const fs = require('fs');
let code = fs.readFileSync('src/components/ConnectionsHubView.tsx', 'utf8');
code = code.replace(/const handleDobChange = \(e: React\.ChangeEvent<HTMLInputElement>\) => \{[\s\S]*?setPersonalDob\(formatted\);\n\s*\};\n\s*/, '');
fs.writeFileSync('src/components/ConnectionsHubView.tsx', code);
