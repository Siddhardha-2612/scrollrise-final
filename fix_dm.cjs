const fs = require('fs');
let content = fs.readFileSync('src/components/DMDirectMessageThread.tsx', 'utf8');

content = content.replace(
    /<VoiceRecordingBar\s*onPauseToggle=\{isRecordingPaused \? resumeRecording : pauseRecording\}\s*onCancel=\{cancelRecording\}\s*onSend=\{stopRecording\}\s*\/>/g,
    '<VoiceRecordingBar recordingTime={recordingTime} onCancel={cancelRecording} onSend={stopRecording} />'
);

fs.writeFileSync('src/components/DMDirectMessageThread.tsx', content);
