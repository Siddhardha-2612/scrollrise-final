const fs = require('fs');

let code = fs.readFileSync('src/components/RegistrationFormView.tsx', 'utf8');

// Replace handleUsernameCheck
code = code.replace(
  `        // Simulate network delay
        setTimeout(() => {
          const dbString = scopedStorage.getItem('booran_users');
          let users = [];
          if (dbString) {
            try {
              users = JSON.parse(dbString);
            } catch (err) {}
          }
          const alreadyExists = users.some(
            (u: any) => u.username.toLowerCase().trim() === username.trim().toLowerCase()
          );
          setUsernameAvailable(!alreadyExists);
          setIsCheckingUsername(false);
        }, 400); // 400ms simulate db delay`,
  `        // Simulate network delay or make a real API check. We will keep it simple for now, 
        // relying on submit to do the full validation, or just skip if we don't have an endpoint for check.
        // Actually since we don't have a check endpoint, let's just mark it available for now, 
        // and handle error on submit.
        setTimeout(() => {
          setUsernameAvailable(true);
          setIsCheckingUsername(false);
        }, 200);`
);

// Replace handleSubmit
const submitStart = `    // Retrieve registration ledger from localStorage`;
const submitEnd = `    onSuccess(trimmedUser);\n  };`;

const newSubmit = `    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trimmedUser,
          password: trimmedPass,
          secretCode: trimmedSecret,
          mobileNumber: trimmedMobile,
          dob: trimmedDob,
          hideDetails: hideDetails
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setErrorMessage(data.error || 'Registration failed');
        return;
      }
      
      // Keep local state aligned if needed by other components, though we should transition away
      scopedStorage.setItem('booran_personal_mobile', trimmedMobile);
      scopedStorage.setItem('booran_personal_dob', trimmedDob);
      scopedStorage.setItem('booran_hide_details', JSON.stringify(hideDetails));
      
      onSuccess(trimmedUser);
    } catch (err) {
      setErrorMessage('Network error during registration. Please try again.');
    }
  };`;

// We also need to add async to handleSubmit
code = code.replace(`const handleSubmit = (e: React.FormEvent) => {`, `const handleSubmit = async (e: React.FormEvent) => {`);

const startIndex = code.indexOf(submitStart);
const endIndex = code.indexOf(submitEnd) + submitEnd.length;

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + newSubmit + code.substring(endIndex);
}

fs.writeFileSync('src/components/RegistrationFormView.tsx', code);
console.log('Registration modified');
