const fs = require('fs');
let content = fs.readFileSync('src/components/VendorTrackerView.tsx', 'utf8');

const oldHandlePin = `    const handlePin = () => {
      setIsDrawerOpen(false);
      setTimeout(() => {
        let expiresAt: number | undefined;
        try {
          const [hoursStr, minutesStr] = inputClose.split(':');
          let hours = parseInt(hoursStr) || 0;
          const minutes = parseInt(minutesStr) || 0;
          if (inputCloseAmPm === 'PM' && hours < 12) hours += 12;
          if (inputCloseAmPm === 'AM' && hours === 12) hours = 0;

          const now = new Date();
          const expiresDate = new Date();
          expiresDate.setHours(hours, minutes, 0, 0);

          if (expiresDate.getTime() <= now.getTime()) {
            expiresDate.setDate(expiresDate.getDate() + 1);
          }
          expiresAt = expiresDate.getTime();
        } catch (e) {}

        setVendorPin({
           id: "my-pin-" + Date.now(),
           vendorName: user?.name || "My Stall",
           desc: inputDesc || "Newly Pinned Stall",
           lat: myLocation.lat,
           lng: myLocation.lng,
           openTime: \`\${inputOpen} \${inputOpenAmPm}\`,
           closeTime: \`\${inputClose} \${inputCloseAmPm}\`,
           expiresAt
        });
        setIsDrawerOpen(true);
      }, 400); 
    };`;

const newHandlePin = `    const handlePin = () => {
      setIsDrawerOpen(false);
      const applyPin = (lat: number, lng: number) => {
        setTimeout(() => {
          let expiresAt: number | undefined;
          try {
            const [hoursStr, minutesStr] = inputClose.split(':');
            let hours = parseInt(hoursStr) || 0;
            const minutes = parseInt(minutesStr) || 0;
            if (inputCloseAmPm === 'PM' && hours < 12) hours += 12;
            if (inputCloseAmPm === 'AM' && hours === 12) hours = 0;

            const now = new Date();
            const expiresDate = new Date();
            expiresDate.setHours(hours, minutes, 0, 0);

            if (expiresDate.getTime() <= now.getTime()) {
              expiresDate.setDate(expiresDate.getDate() + 1);
            }
            expiresAt = expiresDate.getTime();
          } catch (e) {}

          setVendorPin({
             id: "my-pin-" + Date.now(),
             vendorName: user?.name || "My Stall",
             desc: inputDesc || "Newly Pinned Stall",
             lat,
             lng,
             openTime: \`\${inputOpen} \${inputOpenAmPm}\`,
             closeTime: \`\${inputClose} \${inputCloseAmPm}\`,
             expiresAt
          });
          setIsDrawerOpen(true);
        }, 400); 
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => applyPin(pos.coords.latitude, pos.coords.longitude),
          (err) => {
             console.warn("Could not fetch exact location", err);
             applyPin(myLocation.lat, myLocation.lng);
          },
          { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        );
      } else {
        applyPin(myLocation.lat, myLocation.lng);
      }
    };`;

content = content.replace(oldHandlePin, newHandlePin);
fs.writeFileSync('src/components/VendorTrackerView.tsx', content);
