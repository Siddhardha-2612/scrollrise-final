const fs = require('fs');
let content = fs.readFileSync('src/components/VendorTrackerView.tsx', 'utf8');

const oldCheckoutPin = `            onClick={() => {
              setVendorPin({
                id: Math.random().toString(),
                vendorName: 'My Active Stall',
                desc: 'Freshly pinned',
                lat: myLocation.lat,
                lng: myLocation.lng,
                openTime: '09:00',
                closeTime: '22:00'
              });
              setScreen('vendorHome');
            }}`;

const newCheckoutPin = `            onClick={() => {
              const finalize = (lat: number, lng: number) => {
                setVendorPin({
                  id: Math.random().toString(),
                  vendorName: 'My Active Stall',
                  desc: 'Freshly pinned',
                  lat,
                  lng,
                  openTime: '09:00',
                  closeTime: '22:00'
                });
                setScreen('vendorHome');
              };
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  pos => finalize(pos.coords.latitude, pos.coords.longitude),
                  () => finalize(myLocation.lat, myLocation.lng),
                  { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
                );
              } else {
                finalize(myLocation.lat, myLocation.lng);
              }
            }}`;

content = content.replace(oldCheckoutPin, newCheckoutPin);
fs.writeFileSync('src/components/VendorTrackerView.tsx', content);
