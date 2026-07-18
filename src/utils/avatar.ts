export function getHumanAvatar(username: string): string {
  if (!username) {
    return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=1200&h=1200&fit=crop";
  }

  // 1. Decode percent-encoding (e.g. "Sofia%20Chen" -> "Sofia Chen")
  let decoded = username;
  try {
    decoded = decodeURIComponent(username);
  } catch (e) {}

  // 2. Remove leading/trailing spaces, leading @ characters, and convert to lowercase
  const rawClean = decoded.replace(/^@+/, '').toLowerCase().trim();

  // 3. Normalize spaces, underscores, and hyphens to spaces and underscores
  const normalizedSpace = rawClean.replace(/[_\s-]+/g, ' ').trim();
  const normalizedUnderscore = normalizedSpace.replace(/\s+/g, '_');

  // Map bots (Connects) to their distinctive, high-fidelity robot avatars from DiceBear Bottts
  if (normalizedSpace === 'alpha echo' || normalizedUnderscore === 'alpha_echo' || normalizedSpace === 'alpha') {
    return 'https://api.dicebear.com/7.x/bottts/svg?seed=Alpha%20Echo';
  }
  if (normalizedSpace === 'booran prime' || normalizedUnderscore === 'booran_prime' || normalizedSpace === 'booran') {
    return 'https://api.dicebear.com/7.x/bottts/svg?seed=Booran%20Prime';
  }
  if (normalizedSpace === 'shopi patron' || normalizedUnderscore === 'shopi_patron' || normalizedSpace === 'shopi') {
    return 'https://api.dicebear.com/7.x/bottts/svg?seed=Shopi%20Patron';
  }

  // Map human connections to unique, beautiful, high-quality, non-overlapping portraits
  if (
    normalizedSpace === 'raj patel' || 
    normalizedUnderscore === 'raj_patel' || 
    normalizedSpace === 'raj' || 
    normalizedSpace === 'rajm 99' || 
    normalizedUnderscore === 'rajm_99' || 
    normalizedSpace === 'raj pat'
  ) {
    return 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1200&h=1200&fit=crop';
  }
  if (normalizedSpace === 'sofia chen' || normalizedUnderscore === 'sofia_chen' || normalizedSpace === 'sofia') {
    return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&h=1200&fit=crop';
  }
  if (
    normalizedSpace === 'user 1978' || 
    normalizedUnderscore === 'user_1978' || 
    normalizedSpace === '1978' || 
    normalizedSpace === 'user1978'
  ) {
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&h=1200&fit=crop';
  }
  if (
    normalizedSpace === 'user 455' || 
    normalizedUnderscore === 'user_455' || 
    normalizedSpace === '455' || 
    normalizedSpace === 'user455'
  ) {
    return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1200&h=1200&fit=crop';
  }

  const avatarMap: Record<string, string> = {
    snaps: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&h=1200&fit=crop",
    wanderlust_2024: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=1200&fit=crop",
    comedy_central: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&h=1200&fit=crop",
    animation_junkie: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&h=1200&fit=crop",
    classic_dreamer: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=1200&h=1200&fit=crop",
    auto_enthusiast: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1200&h=1200&fit=crop",
    tech_reviewer: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=1200&h=1200&fit=crop",
    dragon_tales: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1200&h=1200&fit=crop",
    offroad_adventures: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1200&h=1200&fit=crop",
    sci_fi_hub: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=1200&h=1200&fit=crop",
    alpha_sonics: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&h=1200&fit=crop",
    lofi_shutter: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=1200&h=1200&fit=crop",
    hardware_junkie: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1200&h=1200&fit=crop",
    focus_guild: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=1200&fit=crop",
    synth_wave: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=1200&h=1200&fit=crop",
    cyber_nomad: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1200&h=1200&fit=crop",
    neon_dreams: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=1200&h=1200&fit=crop",
    bunny_hop: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&h=1200&fit=crop",
    dreamer: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=1200&h=1200&fit=crop",
    sintel_magic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1200&h=1200&fit=crop",
    steel_vfx: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=1200&fit=crop"
  };

  if (avatarMap[normalizedUnderscore]) return avatarMap[normalizedUnderscore];
  if (avatarMap[normalizedSpace]) return avatarMap[normalizedSpace];
  if (avatarMap[rawClean]) return avatarMap[rawClean];

  const fallbackAvatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&h=1200&fit=crop",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1200&h=1200&fit=crop",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&h=1200&fit=crop",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1200&h=1200&fit=crop",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&h=1200&fit=crop",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1200&h=1200&fit=crop",
    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=1200&h=1200&fit=crop",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=1200&h=1200&fit=crop"
  ];

  let hash = 0;
  const nameToHash = normalizedSpace || rawClean;
  for (let i = 0; i < nameToHash.length; i++) {
    hash = nameToHash.charCodeAt(i) + ((hash << 5) - hash);
  }
  return fallbackAvatars[Math.abs(hash) % fallbackAvatars.length];
}
