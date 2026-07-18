import fs from 'fs';

const files = [
  'src/components/StoriesView.tsx',
  'src/components/ChannelFeedDashboard.tsx',
  'src/utils/avatar.ts',
  'src/components/CreateStoryFlow.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/w=[0-9]+/g, 'w=1200');
  content = content.replace(/q=[0-9]+/g, 'q=100');
  content = content.replace(/h=[0-9]+/g, 'h=1200');
  fs.writeFileSync(file, content);
}

console.log("Replaced image dimensions.");
