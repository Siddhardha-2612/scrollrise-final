import * as fs from 'fs';
import * as path from 'path';

const filePaths = [
  'src/components/ShopiCommerceModule.tsx',
  'src/components/BlockedUsersListView.tsx',
  'src/components/ChannelFeedDashboard.tsx',
  'src/components/DesignSheetView.tsx',
  'src/components/ReelsView.tsx',
  'src/components/SalesMarketView.tsx',
  'src/components/StoriesView.tsx',
  'src/components/NotificationsView.tsx',
  'src/utils/insights.ts',
  'src/App.tsx',
  'src/components/ExploreRequestsPanel.tsx',
  'src/components/VideoFeedItem.tsx'
];

filePaths.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('dicebear.com')) {
    if (!content.includes('getHumanAvatar')) {
      const importRegex = /import\s+.*?;?\n/g;
      let lastIndex = 0;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        lastIndex = importRegex.lastIndex;
      }
      
      const depth = filePath.split('/').length - 2;
      const prefix = depth === 1 ? '../' : depth === 0 ? './' : '../../';
      const importStmt = `import { getHumanAvatar } from '${prefix}utils/avatar';\n`;
      
      content = content.slice(0, lastIndex) + importStmt + content.slice(lastIndex);
    }
    
    content = content.replace(/["']https:\/\/api\.dicebear\.com\/[^"']*?\?seed=([^"']+)["']/g, (m, seed) => {
      const cleanSeed = decodeURIComponent(seed).replace(/_avatar$/, '');
      return `getHumanAvatar("${cleanSeed}")`;
    });
    
    content = content.replace(/`https:\/\/api\.dicebear\.com\/[^`]*?\?seed=\$\{([^}]+)\}([^`]*)`/g, (m, expr, suffix) => {
      return `getHumanAvatar(String(${expr}))`;
    });

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + filePath);
  }
});
