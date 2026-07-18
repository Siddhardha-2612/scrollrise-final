import * as fs from 'fs';
import * as path from 'path';

function walkDir(dir: string, callback: (filePath: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir('src', (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
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
    
    content = content.replace(/["'`]https:\/\/api\.dicebear\.com\/[^"'`]*?\?seed=([^"'`$]+)["'`]/g, (m, seed) => {
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
