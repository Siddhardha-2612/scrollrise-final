const fs = require('fs');

let code = fs.readFileSync('src/components/LoginFormView.tsx', 'utf8');

const submitStart = `    // Retrieve registration ledger from localStorage`;
const submitEnd = `    onSuccess(matchedUser.username);\n  };`;

const newSubmit = `    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trimmedUser,
          password: trimmedPass
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setErrorMessage(data.error || 'Login failed');
        return;
      }
      
      scopedStorage.setItem('booran_token', data.token);
      scopedStorage.setItem('booran_personal_mobile', data.user.mobileNumber || '');
      scopedStorage.setItem('booran_personal_dob', data.user.dob || '');
      scopedStorage.setItem('booran_hide_details', JSON.stringify(!!data.user.hideDetails));
      onSuccess(data.user.username);
    } catch (err) {
      setErrorMessage('Network error during login. Please try again.');
    }
  };`;

code = code.replace(`const handleSubmit = (e: React.FormEvent) => {`, `const handleSubmit = async (e: React.FormEvent) => {`);

const startIndex = code.indexOf(submitStart);
const endIndex = code.indexOf(submitEnd) + submitEnd.length;

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + newSubmit + code.substring(endIndex);
}

// Now replace handleRequestRecovery
const recoveryStart = `    const dbString = scopedStorage.getItem('booran_users');`;
const recoveryEnd = `    setSuccessMessage(\`Account verified! Please choose a new password.\`);\n  };`;

const newRecovery = `    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trimmedUser,
          dob: trimmedDob,
          secretCode: trimmedSecret,
          mobileNumber: trimmedMobile
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setErrorMessage(data.error || 'Verification failed.');
        return;
      }
      
      setOtpRequested(true);
      setSuccessMessage(\`Account verified! Please choose a new password.\`);
    } catch (err) {
      setErrorMessage('Network error during recovery. Please try again.');
    }
  };`;

code = code.replace(`const handleRequestRecovery = (e: React.FormEvent) => {`, `const handleRequestRecovery = async (e: React.FormEvent) => {`);

const rStartIndex = code.indexOf(recoveryStart);
const rEndIndex = code.indexOf(recoveryEnd) + recoveryEnd.length;

if (rStartIndex !== -1 && rEndIndex !== -1) {
  code = code.substring(0, rStartIndex) + newRecovery + code.substring(rEndIndex);
}

// Now replace handleResetPassword
const resetStart = `    // Process password reset via localstorage`;
const resetEnd = `    setSuccessMessage('Password changed successfully! Loading login details...');\n    // Slide back to login screen with prefilled values`;

const newReset = `    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: recoveryUsername.trim(),
          dob: recoveryDob.trim(),
          secretCode: recoverySecret.trim(),
          mobileNumber: recoveryMobile.trim(),
          newPassword: newPassword
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setErrorMessage(data.error || 'Password reset failed.');
        return;
      }
      
      setSuccessMessage('Password changed successfully! Loading login details...');
      // Slide back to login screen with prefilled values`;

code = code.replace(`const handleResetPassword = (e: React.FormEvent) => {`, `const handleResetPassword = async (e: React.FormEvent) => {`);

const pStartIndex = code.indexOf(resetStart);
const pEndIndex = code.indexOf(resetEnd) + resetEnd.length;

if (pStartIndex !== -1 && pEndIndex !== -1) {
  code = code.substring(0, pStartIndex) + newReset + code.substring(pEndIndex);
}

fs.writeFileSync('src/components/LoginFormView.tsx', code);
console.log('Login modified');
