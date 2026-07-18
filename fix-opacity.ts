import fs from 'fs';
import path from 'path';

function walk(dir: string, callback: (filepath: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

walk('./src/components', (filepath) => {
  if (filepath.endsWith('.tsx') || filepath.endsWith('.ts')) {
    let content = fs.readFileSync(filepath, 'utf8');
    if (content.includes('backdrop-blur')) {
      content = content
        .replace(/bg-black\/95/g, 'bg-black/75')
        .replace(/bg-black\/90/g, 'bg-black/70')
        .replace(/bg-black\/85/g, 'bg-black/65')
        .replace(/bg-black\/80/g, 'bg-black/60')
        .replace(/bg-black\/75/g, 'bg-black/55')
        .replace(/bg-black\/70/g, 'bg-black/50')
        .replace(/bg-black\/60/g, 'bg-black/40')
        .replace(/bg-black\/50/g, 'bg-black/30')
        .replace(/bg-black\/40/g, 'bg-black/20')
        .replace(/bg-neutral-900\/90/g, 'bg-neutral-900/70')
        .replace(/bg-neutral-900\/80/g, 'bg-neutral-900/60');
      fs.writeFileSync(filepath, content, 'utf8');
      console.log(`Updated ${filepath}`);
    }
  }
});
