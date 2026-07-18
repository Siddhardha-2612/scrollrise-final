const fs = require('fs');
let code = fs.readFileSync('src/components/VendorTrackerView.tsx', 'utf8');

// Remove IP fallback
code = code.replace(/useEffect\(\(\) => \{\n\s*if \(locationGranted\) return; \/\/ if precise location is granted, we already track it[\s\S]*?fetchIpLocation\(\);[\s\S]*?return \(\) => clearInterval\(interval\);\n\s*\}, \[\]\);/, '');

// Require location in handleSelectMode
code = code.replace(/if \(navigator\.geolocation\) \{[\s\S]*?navigator\.geolocation\.getCurrentPosition\([\s\S]*?\},[\s\S]*?\(err\) => \{[\s\S]*?setLocationGranted\(true\);[\s\S]*?proceed\(\);[\s\S]*?\},[\s\S]*?\{ enableHighAccuracy: true \}[\s\S]*?\);[\s\S]*?\} else \{[\s\S]*?setLocationGranted\(true\);[\s\S]*?proceed\(\);[\s\S]*?\}/, 
`if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              setMyLocation(loc);
              scopedStorage.setItem('lastLocationCache', JSON.stringify({ loc, timestamp: Date.now() }));
              setLocationGranted(true);
              proceed();
            },
            (err) => {
              console.warn("Location permission denied", err);
              // Do not proceed without exact location
            },
            { enableHighAccuracy: true, maximumAge: 0 }
          );
        } else {
          console.warn("Geolocation not supported");
        }`);

fs.writeFileSync('src/components/VendorTrackerView.tsx', code);
console.log('Fixed VendorTrackerView.tsx');
