import fs from 'fs';
import path from 'path';

const replaceInFiles = (dir: string, currentDepth: number = 0) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInFiles(fullPath, currentDepth + 1);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      if (fullPath.includes('utils/storage.ts')) continue;
      
      let content = fs.readFileSync(fullPath, 'utf8');
      const hasLocalStorage = content.includes('localStorage.getItem(') || content.includes('localStorage.setItem(') || content.includes('localStorage.removeItem(');
      
      if (hasLocalStorage) {
        content = content.replace(/localStorage\.getItem\(/g, 'scopedStorage.getItem(');
        content = content.replace(/localStorage\.setItem\(/g, 'scopedStorage.setItem(');
        content = content.replace(/localStorage\.removeItem\(/g, 'scopedStorage.removeItem(');
        
        const importPath = currentDepth === 0 ? './utils/storage' : '../utils/storage';
        if (!content.includes('scopedStorage')) {
            // we already replaced, so it will contain scopedStorage
        }
        
        // Add import at the top
       if (!content.includes(`import { scopedStorage } from '${importPath}';`) && !content.includes(`import { scopedStorage } from "${importPath}";`)) {
            // Find a good spot to insert, after the first few imports
            const importStatement = `import { scopedStorage } from "${importPath}";\n`;
            content = importStatement + content;
       }
       
       fs.writeFileSync(fullPath, content);
       console.log('Modified', fullPath);
      }
    }
  }
};

replaceInFiles(path.join(process.cwd(), 'src'));
