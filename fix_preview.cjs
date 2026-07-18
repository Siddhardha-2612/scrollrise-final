const fs = require('fs');
let content = fs.readFileSync('src/components/ExploreRequestsPanel.tsx', 'utf8');

// Replace the first occurrence (lines 1436-1439)
content = content.replace(
    /connectionList\.some\(c =>\s*c\.toLowerCase\(\) === previewAvatar\.name\.toLowerCase\(\) \|\|\s*c\.toLowerCase\(\) === `@\$\{previewAvatar\.name\.toLowerCase\(\)\.replace\(\/\\s\+\/g, '_'\)\}`\.toLowerCase\(\)\s*\)/g,
    'true'
);

fs.writeFileSync('src/components/ExploreRequestsPanel.tsx', content);
