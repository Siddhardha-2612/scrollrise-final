const fs = require('fs');
let content = fs.readFileSync('src/components/ExploreRequestsPanel.tsx', 'utf8');

content = content.replace(
    /\{connectionList\.some\(c => \s*c\.toLowerCase\(\) === previewAvatar\.name\.toLowerCase\(\) \|\| \s*c\.toLowerCase\(\) === `\$\{previewAvatar\.name\.toLowerCase\(\)\.replace\(\/\\s\+\/g, \'_'\)\}`\.toLowerCase\(\)\s*\) \? \(/g,
    '{true ? ('
);

content = content.replace(
    /className={`px-4\.5 py-2 rounded-full text-xs font-bold font-sans transition-all flex items-center gap-2\s*\$\{\s*connectionList\.some\(c =>\s*c\.toLowerCase\(\) === previewAvatar\.name\.toLowerCase\(\) \|\|\s*c\.toLowerCase\(\) === `\@\$\{previewAvatar\.name\.toLowerCase\(\)\.replace\(\/\\s\+\/g, '_'\)\}`\.toLowerCase\(\)\s*\)\s*\?\s*'bg-\[\#0070f3\]\/20 text-\[\#0070f3\] border-\[\#0070f3\]\/30 hover:bg-\[\#0070f3\]\/30'\s*:\s*'bg-red-500\/10 text-red-400 border border-red-500\/20 hover:bg-red-500\/20'\s*\}`}/g,
    'className={`px-4.5 py-2 rounded-full text-xs font-bold font-sans transition-all flex items-center gap-2 ${true ? \'bg-[#0070f3]/20 text-[#0070f3] border-[#0070f3]/30 hover:bg-[#0070f3]/30\' : \'\'}`}'
);

fs.writeFileSync('src/components/ExploreRequestsPanel.tsx', content);
