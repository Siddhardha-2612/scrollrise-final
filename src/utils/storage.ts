export const getScopedKey = (baseKey: string) => {
  // Global keys that shouldn't be scoped
  if (
    baseKey === 'booran_users' || 
    baseKey === 'booran_token' || 
    baseKey === 'booran_username' || 
    baseKey === 'booran_profile_avatar' ||
    baseKey.startsWith('booran_profile_avatar_') ||
    baseKey === 'booran_ads_v3'
  ) {
    return baseKey;
  }
  
  try {
    const currentUsername = localStorage.getItem('booran_username');
    if (currentUsername) {
      if (baseKey.startsWith(`comments_`)) {
        return `${baseKey}_${currentUsername}`;
      }
      return `${baseKey}_${currentUsername}`;
    }
  } catch (e) {}

  return baseKey; // Fallback
};

// Generic in-memory cache to hold massive base64 media data when localStorage quota is full
const smartTrimJSON = (valueStr: string, baseKey: string): string => {
  try {
    const parsed = JSON.parse(valueStr);
    
    // Initialize global cache if not present
    if (typeof window !== 'undefined') {
      if (!(window as any).booran_ad_media_cache) {
        (window as any).booran_ad_media_cache = {};
      }
    }
    
    const cacheValue = (id: string, keyName: string, val: string) => {
      if (typeof window !== 'undefined' && (window as any).booran_ad_media_cache) {
        const cacheKey = `${baseKey}_${id}_${keyName}`;
        (window as any).booran_ad_media_cache[cacheKey] = val;
      }
    };

    if (Array.isArray(parsed)) {
      const trimmed = parsed.map(item => {
        if (item && typeof item === 'object') {
          const newItem = { ...item };
          const id = String(newItem.id || newItem.uid || Date.now());
          for (const k in newItem) {
            if (typeof newItem[k] === 'string' && newItem[k].length > 50000) {
              cacheValue(id, k, newItem[k]);
              newItem[k] = ''; // clear from localStorage payload
            }
          }
          return newItem;
        }
        return item;
      });
      return JSON.stringify(trimmed);
    } else if (parsed && typeof parsed === 'object') {
      const newItem = { ...parsed };
      const id = String(newItem.id || newItem.uid || Date.now());
      for (const k in newItem) {
        if (typeof newItem[k] === 'string' && newItem[k].length > 50000) {
          cacheValue(id, k, newItem[k]);
          newItem[k] = '';
        }
      }
      return JSON.stringify(newItem);
    }
  } catch (e) {}
  return valueStr;
};

const restoreTrimmedJSON = (valueStr: string, baseKey: string): string => {
  try {
    const parsed = JSON.parse(valueStr);
    
    const getCachedValue = (id: string, keyName: string): string | null => {
      if (typeof window !== 'undefined' && (window as any).booran_ad_media_cache) {
        const cacheKey = `${baseKey}_${id}_${keyName}`;
        return (window as any).booran_ad_media_cache[cacheKey] || null;
      }
      return null;
    };

    if (Array.isArray(parsed)) {
      let modified = false;
      const restored = parsed.map(item => {
        if (item && typeof item === 'object') {
          const newItem = { ...item };
          const id = String(newItem.id || newItem.uid || '');
          if (id) {
            for (const k in newItem) {
              if (newItem[k] === '') {
                const cached = getCachedValue(id, k);
                if (cached) {
                  newItem[k] = cached;
                  modified = true;
                }
              }
            }
          }
          return newItem;
        }
        return item;
      });
      if (modified) {
        return JSON.stringify(restored);
      }
    } else if (parsed && typeof parsed === 'object') {
      const newItem = { ...parsed };
      const id = String(newItem.id || newItem.uid || '');
      if (id) {
        let modified = false;
        for (const k in newItem) {
          if (newItem[k] === '') {
            const cached = getCachedValue(id, k);
            if (cached) {
              newItem[k] = cached;
              modified = true;
            }
          }
        }
        if (modified) {
          return JSON.stringify(newItem);
        }
      }
    }
  } catch (e) {}
  return valueStr;
};

export const scopedStorage = {
  getItem: (key: string) => {
    try {
      let val = localStorage.getItem(getScopedKey(key));
      if (!val && key === 'booran_token') {
        const username = localStorage.getItem('booran_username');
        if (username) {
           val = localStorage.getItem(`${key}_${username}`);
           if (val) {
             localStorage.setItem(key, val);
           }
        }
      }
      if (val) {
        return restoreTrimmedJSON(val, key);
      }
      return val;
    } catch (e) {
      console.warn("Storage getItem error", e);
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      return localStorage.setItem(getScopedKey(key), value);
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.message?.includes('exceeded the quota')) {
        console.warn('LocalStorage quota exceeded. Attempting to free space by truncating/caching massive payloads...');
        
        // Try trimming / caching massive base64 media values first
        try {
          const trimmed = smartTrimJSON(value, key);
          if (trimmed !== value) {
            try {
              localStorage.setItem(getScopedKey(key), trimmed);
              return;
            } catch (err2) {
              console.warn("Still quota exceeded after trimming", err2);
            }
          }
        } catch (innerErr) {}

        // Fallback to truncating array length if still quota exceeded
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed) && parsed.length > 3) {
            // Keep only the 3 most recent items
             const trimmedValue = JSON.stringify(parsed.slice(0, 3));
             try {
               localStorage.setItem(getScopedKey(key), trimmedValue);
               return;
             } catch (err3) {
               console.warn("Still quota exceeded after truncating", err3);
             }
          } else {
             // If array is tiny but still quota'd, the item itself is massive.
             // Just set empty array or ignore.
             try {
               localStorage.setItem(getScopedKey(key), "[]");
               return;
             } catch (err4) {
               console.warn("Still quota exceeded when setting empty array", err4);
             }
          }
        } catch (parseError) {
          // not an array or JSON. Clear it.
          try {
            localStorage.setItem(getScopedKey(key), "");
            return;
          } catch (err5) {
            console.warn("Still quota exceeded when clearing", err5);
          }
        }
      }
      console.warn("Storage setItem error", e);
    }
  },
  removeItem: (key: string) => {
    try {
      return localStorage.removeItem(getScopedKey(key));
    } catch (e) {
      console.warn("Storage removeItem error", e);
    }
  }
};

export const AD_STORAGE_KEY = 'booran_ads_v3';

export const getAds = (): any[] => {
  let localAds: any[] = [];
  try {
    const localStr = scopedStorage.getItem(AD_STORAGE_KEY) || '[]';
    localAds = JSON.parse(localStr);
    if (!Array.isArray(localAds)) {
      localAds = [];
    }
  } catch (e) {
    localAds = [];
  }

  // Retrieve volatile memory ads if available
  const volatileAds = (typeof window !== 'undefined' && (window as any).booran_volatile_ads) || [];
  
  // Merge lists to preserve all items, prioritizing volatile/newer ads first
  const combined = [...volatileAds];
  for (const ad of localAds) {
    if (ad && ad.id && !combined.some((x: any) => x.id === ad.id)) {
      combined.push(ad);
    }
  }

  return combined;
};

export const saveAds = (ads: any[]) => {
  // Save to volatile memory
  if (typeof window !== 'undefined') {
    (window as any).booran_volatile_ads = ads;
  }

  // Attempt to save to persistent storage
  try {
    scopedStorage.setItem(AD_STORAGE_KEY, JSON.stringify(ads));
  } catch (e) {
    console.warn("Storage quota exceeded or error saving ads to localStorage, kept in memory fallback:", e);
  }
};
