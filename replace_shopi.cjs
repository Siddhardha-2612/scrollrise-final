const fs = require('fs');

let code = fs.readFileSync('src/components/ShopiCommerceModule.tsx', 'utf8');

code = code.replace(
  `import { scopedStorage } from '../utils/storage';`,
  `import { scopedStorage } from '../utils/storage';\nimport { api } from '../services/api';`
);

code = code.replace(
  `  useEffect(() => {
    const raw = scopedStorage.getItem('booran_shopi_products');
    if (raw) {
      try {
        setLocalProducts(JSON.parse(raw));
      } catch(e){}
    }
    
    const starredRaw = scopedStorage.getItem('booran_shopi_starred_ids');
    if (starredRaw) {
      try {
        setStarredProductIds(JSON.parse(starredRaw));
      } catch(e){}
    }

    const reportedRaw = scopedStorage.getItem('booran_shopi_reported_ids');
    if (reportedRaw) {
      try {
        setReportedProductIds(JSON.parse(reportedRaw));
      } catch(e){}
    }
  }, []);`,
  `  useEffect(() => {
    api.getShopi().then(data => {
      if (Array.isArray(data)) setLocalProducts(data);
    }).catch(console.error);
    
    const starredRaw = scopedStorage.getItem('booran_shopi_starred_ids');
    if (starredRaw) {
      try {
        setStarredProductIds(JSON.parse(starredRaw));
      } catch(e){}
    }

    const reportedRaw = scopedStorage.getItem('booran_shopi_reported_ids');
    if (reportedRaw) {
      try {
        setReportedProductIds(JSON.parse(reportedRaw));
      } catch(e){}
    }
  }, []);`
);

code = code.replace(
  `  // Save back whenever it changes
  useEffect(() => {
    if (localProducts.length > 0 || scopedStorage.getItem('booran_shopi_products')) {
      scopedStorage.setItem('booran_shopi_products', JSON.stringify(localProducts));
    }
  }, [localProducts]);`,
  ``
);

code = code.replace(
  `    const updated = [newProd, ...localProducts];
    setLocalProducts(updated);
    setNewTitle('');`,
  `    api.createShopi(newProd).then(saved => {
      setLocalProducts([saved, ...localProducts]);
      setNewTitle('');
    }).catch(err => alert("Error posting: " + err.message));`
);

// We need to also replace Delete for shopi, but wait, the API doesn't have delete for shopi? I didn't add delete for shopi. Let's add it in server.ts and api.ts.

fs.writeFileSync('src/components/ShopiCommerceModule.tsx', code);
