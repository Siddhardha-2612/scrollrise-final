import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Camera, Image as ImageIcon, Sliders, Play, Pause, 
  Trash2, RefreshCw, Layers, Crop, ZoomIn, Info, Check, 
  Heart, Save, Download, Eye, EyeOff, Brush, Sun, Contrast, 
  Tv, Film, Smile, Compass, Zap, Scissors, Award, Share2, 
  ChevronRight, Volume2, CloudLightning, Maximize2 
} from 'lucide-react';

// Preset Types
interface AdjustmentState {
  exposure: number;     // -100 to 100
  contrast: number;     // -100 to 100
  saturation: number;   // -100 to 100
  vignette: number;     // 0 to 100
  grain: number;        // 0 to 100
  temperature: number;  // -100 to 100
  blur: number;         // 0 to 100 (DSLR Bokeh)
  intensity: number;    // 0 to 200 (Filter overlay multiplier)
}

interface CustomPreset {
  id: string;
  name: string;
  adjustments: AdjustmentState;
  filter: string;
}

// AR Snap Mask definition
interface ARMask {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
  category: string;
  bgGradient: string;
  border: string;
  desc: string;
}

export default function StudioMediaEditor() {
  // Master target: uploaded file or preset sample
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string>('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'); // Cyberpunk player base
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(true);
  
  // Comparison state
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [compareProgress, setCompareProgress] = useState<number>(50); // Slid percentages
  const isHoldingBefore = React.useRef<boolean>(false);
  const [isHolding, setIsHolding] = useState<boolean>(false);

  // Active filter templates
  const [activePresetGroup, setActivePresetGroup] = useState<'lut' | 'vsco' | 'instagram' | 'tiktok'>('vsco');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('c-warm');

  // Sliders adjustments
  const [adjustments, setAdjustments] = useState<AdjustmentState>({
    exposure: 15,
    contrast: 10,
    saturation: 25,
    vignette: 15,
    grain: 20,
    temperature: 10,
    blur: 5,
    intensity: 100,
  });

  // Beauty Retouch parameters
  const [beautySmooth, setBeautySmooth] = useState<number>(40);
  const [beautyBlemish, setBeautyBlemish] = useState<number>(30);
  const [beautySlim, setBeautySlim] = useState<number>(20);
  const [beautyTeeth, setBeautyTeeth] = useState<number>(15);

  // CapCut motion effects
  const [capcutEffect, setCapcutEffect] = useState<'none' | 'motionblur' | 'velocity' | 'glowblast' | 'shake' | 'zoom'>('none');
  const [velocityCurve, setVelocityCurve] = useState<'standard' | 'bullet' | 'montage' | 'jump'>('standard');
  const [transitionSpeed, setTransitionSpeed] = useState<number>(0.8); // in seconds
  
  // AR Mask selected
  const [selectedMask, setSelectedMask] = useState<ARMask | null>(null);
  const [arSearchQuery, setArSearchQuery] = useState<string>('');
  const [selectedArCategory, setSelectedArCategory] = useState<string>('foryou');
  const [burgerScore, setBurgerScore] = useState<number>(0);
  const [hurdleDistance, setHurdleDistance] = useState<number>(0);
  const [hurdleSpeed, setHurdleSpeed] = useState<number>(10);
  const [grannyScareActive, setGrannyScareActive] = useState<boolean>(false);

  // AI Alterations
  const [bgRemoved, setBgRemoved] = useState<boolean>(false);
  const [selectedSky, setSelectedSky] = useState<'original' | 'nebula' | 'sunset' | 'aurora' | 'storm'>('original');
  const [objectRemovalActive, setObjectRemovalActive] = useState<boolean>(false);
  const [brushedPoints, setBrushedPoints] = useState<{ x: number; y: number }[]>([]);
  const isPaintingBrush = React.useRef<boolean>(false);

  // Custom presets
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([
    {
      id: 'custom-1',
      name: 'Sunset Lofi',
      filter: 'vintage',
      adjustments: { exposure: 25, contrast: -10, saturation: 40, vignette: 30, grain: 45, temperature: 40, blur: 15, intensity: 110 }
    }
  ]);
  const [newPresetName, setNewPresetName] = useState<string>('');

  // Export Modal state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'jpg' | 'png' | 'mp4'>('jpg');
  const [exportResolution, setExportResolution] = useState<'hd' | '2k' | '4k' | '8k'>('4k');

  // Interactive UI indicators
  const [activeToolBarTab, setActiveToolBarTab] = useState<'presets' | 'adjust' | 'ai-magic' | 'vsco-lgt' | 'ar-snap' | 'capcut'>('presets');
  const [notification, setNotification] = useState<string | null>(null);

  // Refs
  const editorWorkspaceRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Triggers self-dismissing notification banner
  const triggerNotification = (text: string) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 3000);
  };

  // Predefined social media presets
  const presetCollections = {
    vsco: [
      { id: 'v-portrait', name: 'Portra 160C', desc: 'Analog rich skin tones', filter: 'sepia(0.2) contrast(1.1) brightness(1.05) saturate(1.2)', changes: { temperature: 15, exposure: 5, contrast: 12, saturation: 8, vignette: 10, grain: 25, blur: 15, intensity: 100 } },
      { id: 'v-bando', name: 'B&W Matte', desc: 'Deep high contrast graphite', filter: 'grayscale(1) contrast(1.4) brightness(0.95)', changes: { temperature: -10, exposure: -5, contrast: 30, saturation: -100, vignette: 20, grain: 35, blur: 10, intensity: 120 } },
      { id: 'v-moody', name: 'Moody Woods', desc: 'Desaturated cinematic forest', filter: 'hue-rotate(-15deg) saturate(0.6) contrast(1.2) brightness(0.9)', changes: { temperature: -20, exposure: -10, contrast: 15, saturation: -35, vignette: 25, grain: 15, blur: 20, intensity: 90 } },
      { id: 'v-bright', name: 'Alpenglow', desc: 'Soft bright overexposed warmth', filter: 'saturate(1.4) brightness(1.15) contrast(0.9)', changes: { temperature: 25, exposure: 20, contrast: -10, saturation: 20, vignette: 5, grain: 10, blur: 5, intensity: 95 } }
    ],
    instagram: [
      { id: 'i-clarendon', name: 'Clarendon', desc: 'Cool intense highlights & warm midtones', filter: 'contrast(1.2) saturate(1.3) hue-rotate(5deg)', changes: { temperature: -15, exposure: 8, contrast: 15, saturation: 25, vignette: 12, grain: 0, blur: 5, intensity: 100 } },
      { id: 'i-lark', name: 'Lark', desc: 'Bright landscapes with desaturated reds', filter: 'brightness(1.1) saturate(1.25) contrast(1.05)', changes: { temperature: -5, exposure: 12, contrast: 5, saturation: 20, vignette: 0, grain: 5, blur: 0, intensity: 100 } },
      { id: 'i-valencia', name: 'Valencia', desc: 'Retro yellow cast with structural fade', filter: 'sepia(0.3) saturate(1.1) contrast(0.95) brightness(1.02)', changes: { temperature: 30, exposure: 5, contrast: -5, saturation: 10, vignette: 15, grain: 12, blur: 10, intensity: 110 } },
      { id: 'i-gingham', name: 'Gingham', desc: 'Vintage warm washed out light', filter: 'sepia(0.15) brightness(1.1) contrast(0.85) saturate(0.85)', changes: { temperature: 10, exposure: 15, contrast: -15, saturation: -15, vignette: 8, grain: 20, blur: 12, intensity: 100 } },
      { id: 'i-lomo', name: 'Lomo-Fi Instant', desc: 'Saturated high contrast vintage slide film', filter: 'saturate(1.45) contrast(1.25) brightness(0.95) sepia(0.1)', changes: { temperature: 8, exposure: -5, contrast: 25, saturation: 35, vignette: 28, grain: 15, blur: 0, intensity: 100 } },
      { id: 'i-aesthetic', name: 'Soft Pastel Cream', desc: 'Clean, airy, slightly pink cream aesthetic', filter: 'sepia(0.12) brightness(1.12) contrast(0.92) saturate(0.9)', changes: { temperature: 14, exposure: 15, contrast: -10, saturation: -5, vignette: 5, grain: 8, blur: 8, intensity: 100 } }
    ],
    lut: [
      { id: 'l-lalaland', name: 'La La Land', desc: 'Nostalgic warm golden hour dreamscape', filter: 'hue-rotate(-10deg) saturate(1.5) contrast(1.15) brightness(1.05)', changes: { temperature: 35, exposure: 10, contrast: 15, saturation: 45, vignette: 18, grain: 15, blur: 25, intensity: 120 } },
      { id: 'l-matrix', name: 'Matrix Digital', desc: 'Slightly green dystopian grade', filter: 'grayscale(0.2) hue-rotate(95deg) saturate(1.6) contrast(1.2) brightness(0.95)', changes: { temperature: -30, exposure: -5, contrast: 20, saturation: 10, vignette: 30, grain: 25, blur: 5, intensity: 130 } },
      { id: 'l-dune', name: 'Spice Desert', desc: 'Heavy warm amber sand and dust', filter: 'sepia(0.65) saturate(1.4) contrast(1.1) brightness(1.02)', changes: { temperature: 50, exposure: 5, contrast: 10, saturation: 15, vignette: 22, grain: 40, blur: 30, intensity: 115 } },
      { id: 'l-joker', name: 'Gotham Teal', desc: 'Icy dynamic contrast with skin punch', filter: 'hue-rotate(185deg) saturate(1.3) contrast(1.3) brightness(0.9)', changes: { temperature: -40, exposure: -10, contrast: 25, saturation: 20, vignette: 28, grain: 18, blur: 15, intensity: 100 } },
      { id: 'l-cyberretro', name: 'Cyber Synthwave', desc: 'Electric twilight purple and warm scanlines', filter: 'hue-rotate(280deg) saturate(1.9) contrast(1.2) brightness(1.05)', changes: { temperature: -25, exposure: 10, contrast: 15, saturation: 60, vignette: 20, grain: 25, blur: 10, intensity: 120 } }
    ],
    tiktok: [
      { id: 't-cyberpunk', name: 'Neon Shinjuku', desc: 'High saturation magenta and electric cyan', filter: 'hue-rotate(275deg) saturate(2.3) contrast(1.25) brightness(1.1)', changes: { temperature: -20, exposure: 12, contrast: 20, saturation: 75, vignette: 15, grain: 8, blur: 8, intensity: 140 } },
      { id: 't-anime', name: 'Makoto Spark', desc: 'Pastel saturation with dreamy clouds blur', filter: 'saturate(1.8) contrast(0.9) brightness(1.2)', changes: { temperature: 15, exposure: 25, contrast: -5, saturation: 50, vignette: 5, grain: 0, blur: 20, intensity: 100 } },
      { id: 't-vhs', name: 'VHS Tape 98', desc: 'Analog tape damage and color separation', filter: 'contrast(1.4) saturate(1.1) brightness(1.05) hue-rotate(-20deg)', changes: { temperature: 10, exposure: 5, contrast: 25, saturation: 15, vignette: 25, grain: 75, blur: 12, intensity: 110 } },
      { id: 't-retro', name: '70s Polaroid', desc: 'Over-tinted saturated instant camera film', filter: 'sepia(0.45) saturate(1.6) contrast(1.05) brightness(0.98)', changes: { temperature: 28, exposure: 2, contrast: 8, saturation: 35, vignette: 20, grain: 30, blur: 10, intensity: 100 } },
      { id: 't-y2k', name: 'Y2K Glitz', desc: 'Millennium bright bubblegum pink shimmer and soft blur', filter: 'hue-rotate(310deg) saturate(1.65) brightness(1.12) contrast(1.02)', changes: { temperature: -5, exposure: 18, contrast: 12, saturation: 45, vignette: 10, grain: 12, blur: 15, intensity: 110 } }
    ]
  };

  // Find active filter formula
  const getSelectedPresetMeta = () => {
    const list = [...presetCollections.vsco, ...presetCollections.instagram, ...presetCollections.lut, ...presetCollections.tiktok];
    const match = list.find(p => p.id === selectedPresetId);
    if (match) return match;
    const customMatch = customPresets.find(p => p.id === selectedPresetId);
    if (customMatch) {
      return {
        id: customMatch.id,
        name: customMatch.name,
        desc: 'Custom Parameter Formula',
        filter: customMatch.filter === 'vintage' ? 'sepia(0.4) contrast(1.1)' : 'none',
        changes: customMatch.adjustments
      };
    }
    return { id: 'none', name: 'Original RAW', desc: 'No presets active', filter: 'none', changes: { exposure: 0, contrast: 0, saturation: 0, vignette: 0, grain: 0, temperature: 0, blur: 0, intensity: 100 } };
  };

  // Apply a preset to adjustments
  const applyPresetId = (id: string) => {
    setSelectedPresetId(id);
    const list = [...presetCollections.vsco, ...presetCollections.instagram, ...presetCollections.lut, ...presetCollections.tiktok];
    const match = list.find(p => p.id === id);
    if (match) {
      setAdjustments({
        ...adjustments,
        ...match.changes,
        intensity: 100 // reset intensity
      });
      triggerNotification(`Applied ${match.name} Preset`);
    } else {
      const customMatch = customPresets.find(p => p.id === id);
      if (customMatch) {
        setAdjustments(customMatch.adjustments);
        triggerNotification(`Applied custom: ${customMatch.name}`);
      }
    }
  };

  // Handle Photo upload
  const handleUploadedFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedMediaUrl(url);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
      setSelectedSky('original');
      setBgRemoved(false);
      setBrushedPoints([]);
      triggerNotification(`Successfully loaded ${file.name}`);
    }
  };

  // Drag and drop mechanics
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedMediaUrl(url);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
      setSelectedSky('original');
      setBgRemoved(false);
      setBrushedPoints([]);
      triggerNotification(`Dropped ${file.name}`);
    }
  };

  // AI Auto-grade Algorithm
  const triggerAIAutoGrade = () => {
    setAdjustments({
      exposure: 8,
      contrast: 15,
      saturation: 30,
      temperature: 5,
      vignette: 12,
      grain: 10,
      blur: 8,
      intensity: 100
    });
    // Add beauty touches automatically
    setBeautySmooth(60);
    setBeautyBlemish(10);
    setBeautyTeeth(40);
    triggerNotification('✨ AI Auto-Correct & Color Grading Complete!');
  };

  // Save Custom Preset
  const handleCreateCustomPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    const item: CustomPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      filter: 'none',
      adjustments: { ...adjustments }
    };
    setCustomPresets([item, ...customPresets]);
    setSelectedPresetId(item.id);
    setNewPresetName('');
    triggerNotification(`Preset "${item.name}" registered safely!`);
  };

  // Quick Preset Sample triggers so user doesn't have to upload to see beauty
  const sampleMediaSet = [
    { name: 'Neon Rider', type: 'image' as const, url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80' },
    { name: 'Warm Portrait', type: 'image' as const, url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80' },
    { name: 'Dynamic Skyline', type: 'image' as const, url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80' },
    { name: 'Street Skate Video', type: 'video' as const, url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4' },
  ];

  // AR Masks defined
  const arMasks: ARMask[] = [
    { id: 'lens-burger', name: 'Catch Burgers Game', icon: '🍔', color: 'text-amber-500', type: 'game-burger', category: 'games', bgGradient: 'from-amber-600/10 to-yellow-600/10', border: 'border-yellow-500/20', desc: 'Open your mouth and catch falling burgers.' },
    { id: 'lens-runner', name: 'Infinite Hurdles 3D', icon: '🏃‍♂️', color: 'text-emerald-500', type: 'game-runner', category: 'games', bgGradient: 'from-emerald-600/10 to-teal-600/10', border: 'border-emerald-500/20', desc: 'Stadium hurdles racing simulator with score meter.' },
    { id: 'lens-visor', name: 'Hyper Visor Shades', icon: '🕶️', color: 'text-cyan-400', type: 'visor', category: 'aesthetic', bgGradient: 'from-cyan-600/10 to-blue-600/10', border: 'border-cyan-500/20', desc: 'Futuristic reflecting cyberglasses.' },
    { id: 'lens-hearts', name: 'Retro Pink Hearts', icon: '💖', color: 'text-pink-400', type: 'hearts', category: 'aesthetic', bgGradient: 'from-pink-600/10 to-rose-600/10', border: 'border-pink-500/20', desc: 'Blushing skin tone with floating halo hearts.' },
    { id: 'lens-alien', name: 'Luminous Alien Mask', icon: '👽', color: 'text-green-500', type: 'alien', category: 'avatars', bgGradient: 'from-green-600/10 to-emerald-800/10', border: 'border-green-500/20', desc: 'Luminescent neon green alien face outline.' },
    { id: 'lens-neko', name: 'Dancing Twin Neko', icon: '🐱', color: 'text-purple-400', type: 'dancing-neko', category: 'avatars', bgGradient: 'from-purple-600/10 to-indigo-600/10', border: 'border-purple-500/20', desc: 'Cartoon character kitty dances with your move.' },
    { id: 'lens-spidey', name: 'Spider Hero Web', icon: '🕸️', color: 'text-red-500', type: 'spidey', category: 'for-you', bgGradient: 'from-red-600/10 to-blue-850/10', border: 'border-rose-500/20', desc: 'Laced dark web mask with glowing spider-eyes.' },
    { id: 'lens-granny', name: 'Haunted Granny Chase', icon: '👵', color: 'text-rose-600', type: 'granny', category: 'games', bgGradient: 'from-red-950/20 to-neutral-900/10', border: 'border-red-500/20', desc: 'Run from scary retro granny chasing her hammer.' },
    { id: 'lens-squeeze', name: 'Hilarious Funny Face', icon: '🤪', color: 'text-yellow-500', type: 'squeeze', category: 'for-you', bgGradient: 'from-yellow-400/10 to-orange-500/10', border: 'border-orange-400/20', desc: 'Hilarious physical coordinate warp squeeze filter.' },
    { id: 'lens-monkey', name: 'Monkey Hug Swaddle', icon: '🐵', color: 'text-amber-600', type: 'monkey', category: 'for-you', bgGradient: 'from-amber-800/10 to-orange-950/10', border: 'border-amber-700/20', desc: 'Cozy chimp holding up funny swaddled baby face.' },
    { id: 'lens-anime', name: 'Sparkle Anime Eyes', icon: '⭐', color: 'text-blue-400', type: 'anime', category: 'aesthetic', bgGradient: 'from-indigo-600/10 to-pink-600/10', border: 'border-pink-500/20', desc: 'Flowing cute hair, giant anime sparkles and star blush.' },
    { id: 'lens-crown', name: 'Golden Tiara Crown', icon: '👑', color: 'text-amber-400', type: 'crown', category: 'aesthetic', bgGradient: 'from-yellow-500/10 to-amber-600/10', border: 'border-yellow-400/20', desc: 'Sparkly royal queen crown with particle aura.' },
    { id: 'lens-fisheye', name: 'Fisheye Bubble Lens', icon: '🧼', color: 'text-slate-400', type: 'fisheye', category: 'retro', bgGradient: 'from-slate-700/10 to-neutral-800/10', border: 'border-slate-500/20', desc: 'Curved glass tube distortion with high-spec chrome edge.' },
    { id: 'lens-hologram', name: 'Hologram Grid Lock', icon: '📡', color: 'text-teal-400', type: 'hologram', category: 'retro', bgGradient: 'from-teal-600/10 to-cyan-800/10', border: 'border-teal-500/20', desc: 'Locked cyber tracking scan lines HUD.' },
    { id: 'lens-cyberpunk', name: 'Vaporwave Twilight', icon: '🌃', color: 'text-fuchsia-400', type: 'cyberpunk', category: 'retro', bgGradient: 'from-fuchsia-600/10 to-violet-800/10', border: 'border-fuchsia-500/20', desc: 'Retro cyberpunk evening shades with grid line noise.' },
    { id: 'lens-vhs', name: 'Retro Camcorder VHS', icon: '📼', color: 'text-zinc-400', type: 'vhs', category: 'retro', bgGradient: 'from-zinc-700/10 to-neutral-800/10', border: 'border-zinc-500/20', desc: 'VCR recording mode with timestamp and horizontal static.' }
  ];

  // Dynamic Style calculations for rendering workspace
  const getCompositeFilterString = (forBeforePreview = false) => {
    if (forBeforePreview) {
      return ''; // No modifications
    }
    const preset = getSelectedPresetMeta();
    let filterString = preset.filter && preset.filter !== 'none' ? preset.filter : '';
    
    // Scale properties according to adjustments state
    const exp = 1 + adjustments.exposure / 100;
    const cont = 1 + adjustments.contrast / 100;
    const sat = 1 + adjustments.saturation / 100;
    const filterIntensity = adjustments.intensity / 100;

    // Build the master browser filter chain
    let finalFilters = `brightness(${exp}) contrast(${cont}) saturate(${sat})`;
    if (adjustments.temperature > 0) {
      finalFilters += ` sepia(${Math.abs(adjustments.temperature) / 250})`;
    } else if (adjustments.temperature < 0) {
      finalFilters += ` hue-rotate(${adjustments.temperature / 3}deg) saturate(${(100 + adjustments.saturation) / 100})`;
    }

    if (preset.filter && preset.filter !== 'none') {
      // Blend using opacity / intensity or combine directly
      finalFilters = ` ${finalFilters} ${preset.filter}`;
    }

    // Beauty smoothing blur sim helper
    if (beautySmooth > 10) {
      finalFilters += ` contrast(${1 - beautySmooth / 400}) brightness(${1 + beautySmooth / 500})`;
    }

    return finalFilters;
  };

  // Aesthetic metric generator scores based on sliders to make AI smart
  const calculateAestheticScores = () => {
    const expBalance = 100 - Math.abs(adjustments.exposure - 5);
    const saturationBalance = 100 - Math.abs(adjustments.saturation - 20);
    const overallAesthetic = Math.min(10, Math.max(1, ((expBalance + saturationBalance + (bgRemoved ? 95 : 80)) / 30)));
    
    return {
      score: overallAesthetic.toFixed(1),
      composition: bgRemoved ? "98%" : "89%",
      contrast: adjustments.contrast > 10 && adjustments.contrast < 30 ? "95%" : "84%",
      colorHarmony: Math.abs(adjustments.temperature) < 20 ? "94%" : "82%",
      viralScore: (overallAesthetic > 8.5) ? 'High (🔥 Trending)' : 'Moderate'
    };
  };

  const aestMetrics = calculateAestheticScores();

  // Sky Replacements simulation colors
  const getSkyBackdropStyle = () => {
    switch (selectedSky) {
      case 'nebula':
        return 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900';
      case 'sunset':
        return 'bg-gradient-to-t from-orange-600 via-red-500 to-indigo-800';
      case 'aurora':
        return 'bg-gradient-to-r from-emerald-900 via-teal-800 to-black';
      case 'storm':
        return 'bg-gradient-to-b from-slate-900 via-gray-800 to-indigo-950 animate-pulse';
      default:
        return 'bg-[#0f0f12]';
    }
  };

  // Handle Export Process Simulation
  const triggerExport = () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportSuccess(false);

    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 15) + 5;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setExportSuccess(true);
        triggerNotification(`💾 Saved high-precision ${exportResolution.toUpperCase()} asset!`);
      }
      setExportProgress(current);
    }, 200);
  };

  // Canvas drawing for simulated interactive brushed objects removal
  const handleBrushStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!objectRemovalActive) return;
    isPaintingBrush.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setBrushedPoints([{ x, y }]);
  };

  const handleBrushMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!objectRemovalActive || !isPaintingBrush.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setBrushedPoints(prev => [...prev, { x, y }]);
  };

  const handleBrushEnd = () => {
    isPaintingBrush.current = false;
    if (brushedPoints.length > 5) {
      triggerNotification("🪄 Object Removal simulated: cleaned blemish/object!");
      // clear brush after 1.5 seconds
      setTimeout(() => {
        setBrushedPoints([]);
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050508] text-white overflow-hidden text-xs font-sans">
      
      {/* Absolute top custom notification alert */}
      {notification && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-[#F52C68] border border-white/20 text-white font-mono text-[10px] font-bold tracking-wider py-2 px-4 rounded-xl shadow-2xl animate-bounce flex items-center gap-1.5 shrink-0 uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Editor Sub-Header Tabs */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-neutral-950 border-b border-white/5 shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 px-1.5 bg-[#F52C68]/10 border border-[#F52C68]/30 rounded-lg text-[#F52C68] font-mono text-[8px] tracking-widest uppercase font-bold shrink-0 animate-pulse">
            ★ STUDIO PRO
          </div>
          <span className="text-[10px] font-mono font-bold text-neutral-400 tracking-tight shrink-0 hidden sm:inline">MEDIA EDITING DESK</span>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={triggerAIAutoGrade}
            className="px-2.5 py-1.5 bg-neutral-900 hover:bg-[#00b0ff]/10 border border-white/10 hover:border-[#00b0ff]/40 text-neutral-200 hover:text-[#00b0ff] font-mono text-[9px] font-bold tracking-wider rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0 uppercase"
            title="AI Automatic Color grading and Curve optimization"
          >
            <Sparkles className="w-3 h-3 text-[#00b0ff] animate-pulse" />
            <span>AI Auto-Grade</span>
          </button>

          <button
            onClick={() => {
              setAdjustments({
                exposure: 0,
                contrast: 0,
                saturation: 0,
                vignette: 0,
                grain: 0,
                temperature: 0,
                blur: 0,
                intensity: 100,
              });
              setBeautySmooth(0);
              setBeautyBlemish(0);
              setBeautySlim(0);
              setBeautyTeeth(0);
              setSelectedSky('original');
              setBgRemoved(false);
              setSelectedMask(null);
              setCapcutEffect('none');
              triggerNotification("Fiducial states reset to RAW.");
            }}
            className="p-1.5 bg-neutral-900 border border-white/5 rounded-lg text-neutral-500 hover:text-white transition-colors cursor-pointer active:scale-95"
            title="Reset All Adjustments"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main split work bench */}
      <div className="flex-1 flex flex-col min-h-0">
        
        {/* VIEWPORT CONTROLLER DECK */}
        <div className="flex-1 min-h-0 bg-neutral-950 p-2.5 flex flex-col justify-between relative group/canvas">
          
          {/* Top Info Bar inside viewport */}
          <div className="flex items-center justify-between z-10 p-1">
            <div className="flex items-center gap-1 bg-black/20 backdrop-blur-md px-2 py-1 rounded-lg border border-white/5 text-[8.5px] font-mono text-neutral-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{mediaType.toUpperCase()} MODE: {selectedMediaUrl.includes('unsplash') ? 'NEON PRESET' : 'LOCAL ASSET'}</span>
            </div>

            {/* Quick Sample Trigger Pills */}
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-neutral-500 font-mono font-bold mr-1 hidden sm:inline">QUICK PROJECTS:</span>
              <div className="flex space-x-1 shrink-0">
                {sampleMediaSet.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setMediaType(s.type);
                      setSelectedMediaUrl(s.url);
                      setBgRemoved(false);
                      setSelectedSky('original');
                      triggerNotification(`Loaded preset sample: ${s.name}`);
                    }}
                    className={`text-[8.5px] font-mono font-bold px-2 py-0.5 rounded border transition-all truncate max-w-[80px] cursor-pointer ${
                      selectedMediaUrl === s.url 
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-black' 
                        : 'bg-black/20 text-neutral-400 border-white/5 hover:text-white'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Core Render Canvas Box */}
          <div 
            ref={editorWorkspaceRef}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onMouseDown={handleBrushStart}
            onMouseMove={handleBrushMove}
            onMouseUp={handleBrushEnd}
            className={`relative flex-1 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center transition-all ${getSkyBackdropStyle()} ${
              objectRemovalActive ? 'cursor-radial-brush' : ''
            }`}
          >
            {/* Simulation matrix backdrop lines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            {/* Simulated sky replacement clouds behind background removal */}
            {bgRemoved && selectedSky !== 'original' && (
              <div className="absolute inset-0 z-0">
                {/* Simulated clouds floating animation */}
                <div className="absolute inset-0 opacity-40 blur-xl animate-pulse mix-blend-color-dodge bg-gradient-to-r from-cyan-500 via-pink-500 to-amber-500" />
                <div className="absolute bottom-10 left-10 text-[9px] font-mono tracking-widest text-[#00b0ff]/80 font-bold bg-black/20 p-1 px-2 rounded-md border border-white/5">
                  ⛅ SKY: {selectedSky.toUpperCase()} REPLACED (SIMULATED)
                </div>
              </div>
            )}

            {/* Wrapper to handle visual contrast scale, CSS adjustments filters, and comparison overlays */}
            <div className="relative w-full h-full max-w-sm flex items-center justify-center p-3">
              
              {selectedMediaUrl ? (
                /* Media rendering elements */
                <div className="relative rounded-xl overflow-hidden max-h-full max-w-full shadow-2xl border border-white/10 group bg-neutral-900 transition-all">
                  {/* Absolute delete button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMediaUrl('');
                      triggerNotification('🗑️ Asset deleted/cleared in Editor.');
                    }}
                    className="absolute top-2.5 right-2.5 z-30 w-7 h-7 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center border border-white/30 text-white shadow-lg active:scale-90 transition-all cursor-pointer"
                    title="Delete Asset & Clear Workspace"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                {mediaType === 'image' ? (
                  <img
                    src={bgRemoved ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' : selectedMediaUrl}
                    alt="Core asset"
                    className="object-cover rounded-xl transition-all max-h-[350px] w-auto mx-auto select-none duration-100 pointer-events-none"
                    style={{
                      filter: getCompositeFilterString(isHolding),
                    }}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <video
                    src={selectedMediaUrl}
                    autoPlay={isPlayingVideo}
                    loop
                    muted
                    className="object-cover rounded-xl transition-all max-h-[350px] w-auto mx-auto select-none pointer-events-none"
                    style={{
                      filter: getCompositeFilterString(isHolding),
                    }}
                  />
                )}

                {/* Simulated Background Removal Overlay mask */}
                {bgRemoved && (
                  <div className="absolute inset-0 bg-transparent pointer-events-none flex items-center justify-center">
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/55 text-neutral-300 border border-white/5 text-[7px] font-mono py-1 px-2 rounded-md tracking-wider">
                      AI BG ERASER ACTIVE
                    </div>
                  </div>
                )}

                {/* DSLR Portrait Bokeh Blur vignette simulation border overlay */}
                {adjustments.blur > 0 && (
                  <div 
                    className="absolute inset-0 pointer-events-none rounded-xl"
                    style={{
                      boxShadow: `inset 0 0 ${adjustments.blur * 2}px rgba(0, 0, 0, ${adjustments.blur / 80})`,
                      backdropFilter: `blur(${adjustments.blur / 12}px)`
                    }}
                  />
                )}

                {/* CapCut motion filters simulated active displays */}
                {capcutEffect !== 'none' && (
                  <div className="absolute inset-0 pointer-events-none z-10 min-h-full min-w-full">
                    {capcutEffect === 'motionblur' && (
                      <div className="w-full h-full bg-white/5 backdrop-blur-[1px] animate-pulse flex items-center justify-center border-l-4 border-r-4 border-cyan-400" />
                    )}
                    {capcutEffect === 'glowblast' && (
                      <div className="w-full h-full bg-gradient-to-t from-transparent via-[#F52C68]/25 to-transparent mix-blend-screen animate-pulse ring-4 ring-[#F52C68]/30" />
                    )}
                    {capcutEffect === 'shake' && (
                      <div className="w-full h-full bg-transparent animate-bounce border-2 border-dashed border-yellow-400/45" />
                    )}
                    {capcutEffect === 'velocity' && (
                      <div className="absolute bottom-2 right-2 bg-[#F52C68]/95 px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest font-black text-white">
                        ⚡ VELOCITY: {velocityCurve.toUpperCase()} CURVED
                      </div>
                    )}
                  </div>
                )}

                {/* Snapchat Face AR Mask Overlay drawing rendering */}
                {selectedMask && (
                  <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-between p-4">
                    {/* Top Stats Indicator HUD to look exactly like rich AR apps */}
                    <div className="w-full flex items-center justify-between text-[8px] font-mono select-none">
                      <div className="bg-black/20 px-2 py-0.5 rounded border border-[#00b0ff]/30 text-[#00b0ff] font-bold tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-[#00b0ff] rounded-full animate-ping" />
                        <span>FACIAL MESH ACTIVE: {selectedMask.name.toUpperCase()}</span>
                      </div>
                      
                      {/* Interactive score dashboards */}
                      {selectedMask.type === 'game-burger' && (
                        <div className="bg-[#F52C68] text-white px-2.5 py-0.5 rounded-full font-black tracking-widest shadow shadow-brand-pink/30 flex items-center gap-1 animate-pulse">
                          <span>BURGERS CAUGHT: {burgerScore}</span>
                        </div>
                      )}

                      {selectedMask.type === 'game-runner' && (
                        <div className="bg-emerald-500 text-black px-2.5 py-0.5 rounded-full font-black tracking-widest shadow flex items-center gap-1">
                          <span>DISTANCE: {hurdleDistance}m</span>
                        </div>
                      )}

                      {selectedMask.type === 'granny' && (
                        <div className="bg-red-700 text-white px-2.5 py-0.5 rounded-full font-black tracking-widest animate-bounce flex items-center gap-1">
                          <span>WARNING: GRANNY CLOSE!</span>
                        </div>
                      )}
                    </div>

                    {/* Middle Core Interactive Render Simulation overlays */}
                    <div className="flex-1 w-full flex items-center justify-center relative overflow-hidden">
                      
                      {/* 1. Burger Mouth Game */}
                      {selectedMask.type === 'game-burger' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          {/* Animated descending burgers */}
                          <div className="text-2xl animate-bounce mb-24 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">🍔</div>
                          <div className="text-xl animate-pulse delay-75 mb-12">🍔</div>
                          {/* Face anchor mouth tracker */}
                          <div className="absolute bottom-16 w-14 h-10 border border-dashed border-[#00b0ff] rounded-full flex items-center justify-center bg-black/30">
                            <span className="text-[7.5px] text-[#00b0ff] font-extrabold uppercase animate-pulse">👄 OPEN MOUTH</span>
                          </div>
                          {/* Instructions Overlay */}
                          <p className="absolute bottom-1.5 text-[8px] bg-black/30 px-2 py-1 border border-yellow-500/30 rounded text-yellow-400 text-center uppercase tracking-wider font-bold">
                            Open mouth to catch - Tap click interactive!
                          </p>
                        </div>
                      )}

                      {/* 2. Infinite Hurdles Game */}
                      {selectedMask.type === 'game-runner' && (
                        <div className="absolute inset-x-0 bottom-0 top-6 flex flex-col items-center justify-end pointer-events-none">
                          {/* Running track lanes perspectived */}
                          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-emerald-900/30 to-transparent border-t border-emerald-500/20" />
                          {/* Speed hurdles moving */}
                          <div className="text-xl border-b-2 border-red-500/30 animate-pulse mb-8">🚧</div>
                          {/* Running character jumping */}
                          <div className="text-2xl mb-12 animate-bounce">🏃‍♂️</div>
                          <span className="absolute top-2.5 left-1/2 -translate-x-1/2 bg-black/20 px-2 py-0.5 text-neutral-400 rounded-md border border-white/5 text-[7px] font-mono tracking-widest uppercase">
                            Time: 9.13s • Bounces: 1
                          </span>
                        </div>
                      )}

                      {/* 3. Cyber Visor / Shades */}
                      {selectedMask.type === 'visor' && (
                        <div className="relative pointer-events-none">
                          <span className="text-5xl filter drop-shadow-[0_0_15px_#00b0ff] animate-pulse">🕶️</span>
                          <span className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                          <span className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        </div>
                      )}

                      {/* 4. Retro Hearts */}
                      {selectedMask.type === 'hearts' && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="absolute left-4 top-10 text-xl animate-bounce">💖</div>
                          <div className="absolute right-6 top-14 text-lg animate-ping">💗</div>
                          <div className="absolute left-16 bottom-16 text-xl animate-pulse">💝</div>
                          <div className="absolute right-12 bottom-10 text-lg animate-bounce">💓</div>
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-2xl animate-pulse">💖</div>
                          {/* Cute blush pink screen hue */}
                          <div className="absolute inset-0 bg-pink-500/10 mix-blend-color-burn" />
                        </div>
                      )}

                      {/* 5. Space Alien */}
                      {selectedMask.type === 'alien' && (
                        <div className="absolute inset-0 pointer-events-none border border-emerald-500/20 rounded-xl flex items-center justify-center">
                          <span className="text-6xl filter drop-shadow-[0_0_30px_#10b981] animate-pulse">👽</span>
                          <div className="absolute right-3 top-3 text-[7.5px] font-mono text-emerald-400 bg-black/65 p-1 border border-emerald-500/30 rounded uppercase">
                            Alien Retina Lock: 100%<br />Toxic Hue Applied
                          </div>
                          {/* Luminous toxic green screen color overlay */}
                          <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none mix-blend-color-dodge text-emerald-500/10" />
                        </div>
                      )}

                      {/* 6. Dancing Neko */}
                      {selectedMask.type === 'dancing-neko' && (
                        <div className="absolute bottom-4 right-4 pointer-events-none flex flex-col items-center select-none animate-bounce">
                          <span className="text-3xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">🐱</span>
                          <div className="flex gap-1 text-[7px] font-mono uppercase bg-purple-950 p-1 border border-purple-500/30 text-purple-300 rounded font-bold animate-pulse">
                            <span>NEKO DANCE CO-PILOT</span>
                          </div>
                        </div>
                      )}

                      {/* 7. Spider Hero Web */}
                      {selectedMask.type === 'spidey' && (
                        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                          <span className="text-6xl filter drop-shadow-[0_0_20px_rgba(239,68,68,0.7)] animate-pulse">🕸️</span>
                          <div className="text-4xl filter drop-shadow-[0_4px_10px_white] mt-1 text-black font-black select-none tracking-widest">🕷️</div>
                        </div>
                      )}

                      {/* 8. Haunted Granny Chase */}
                      {selectedMask.type === 'granny' && (
                        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
                          <div className="absolute top-2.5 right-2 text-red-500 text-[8.5px] font-mono tracking-widest font-black uppercase animate-pulse">
                            🔴 GRANNY HUNTING SENSE
                          </div>
                          <div className="relative w-full h-full flex items-center justify-between px-4">
                            {/* Running avatar character */}
                            <span className="text-3xl mb-8 animate-bounce">🏃‍♂️</span>
                            {/* Chasing grandmother holding mallet */}
                            <span className="text-3xl mb-12 animate-pulse transform -scale-x-100 hover:scale-130 duration-300">👵</span>
                          </div>
                          <div className="absolute bottom-1 left-1.5 bg-black/65 text-[7px] font-mono px-1.5 py-0.5 rounded border border-red-500/30 text-rose-500">
                            Granny proximity status: EXTREME DANGER
                          </div>
                        </div>
                      )}

                      {/* 9. Hilarious Funny Face */}
                      {selectedMask.type === 'squeeze' && (
                        <div className="absolute inset-0 pointer-events-none border-2 border-orange-500/10 flex items-center justify-center overflow-hidden">
                          {/* Radial Squeeze Wave scope rings */}
                          <div className="w-48 h-48 rounded-full border border-orange-500/30 border-dashed animate-spin flex items-center justify-center">
                            <div className="w-32 h-32 rounded-full border border-yellow-400/40 border-dotted flex items-center justify-center">
                              <span className="text-xl">🤪</span>
                            </div>
                          </div>
                          <span className="absolute bottom-1 md:bottom-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 text-[7px] font-mono tracking-wider px-2 py-0.5 rounded uppercase">
                            Coordinate Warp Mesh: SQUEEZED (PRO)
                          </span>
                        </div>
                      )}

                      {/* 10. Monkey Hug Swaddle */}
                      {selectedMask.type === 'monkey' && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none flex items-center gap-1 select-none">
                          <span className="text-3xl animate-bounce">🐵</span>
                          <div className="bg-amber-900/90 text-amber-200 border border-amber-600/35 p-1 px-2 text-[7px] font-mono tracking-wide rounded-md">
                            🐵 Chimp Swaddle Anchor Applied!
                          </div>
                        </div>
                      )}

                      {/* 11. Sparkle Anime Eyes */}
                      {selectedMask.type === 'anime' && (
                        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                          {/* Sparkling large anime eyes */}
                          <div className="flex gap-14 mb-8">
                            <span className="text-4xl animate-pulse filter drop-shadow-[0_0_10px_rgba(255,100,100,0.8)]">⭐</span>
                            <span className="text-4xl animate-pulse filter drop-shadow-[0_0_10px_rgba(255,100,100,0.8)]">⭐</span>
                          </div>
                          {/* Golden wig contour lines */}
                          <div className="text-4xl opacity-50 relative bottom-4">💁‍♀️</div>
                        </div>
                      )}

                      {/* 12. Golden Crown Tiara */}
                      {selectedMask.type === 'crown' && (
                        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-start py-8">
                          <span className="text-5xl filter drop-shadow-[0_4px_15px_rgba(251,191,36,0.9)] animate-bounce select-none">👑</span>
                          <span className="text-[7.5px] font-mono text-amber-400 mt-2 font-bold tracking-widest bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30 uppercase">
                            Golden Royalty Spark Aura
                          </span>
                        </div>
                      )}

                      {/* 13. Fisheye Bubble Lens */}
                      {selectedMask.type === 'fisheye' && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          {/* Spherical curvature framing shadow ring */}
                          <div className="w-full h-full border-[18px] border-black/95 rounded-xl shadow-[inset_0_0_80px_rgba(0,0,0,0.95)] flex items-center justify-center">
                            <div className="w-11/12 h-11/12 border border-white/10 rounded-full bg-transparent flex items-center justify-center">
                              <span className="text-[8px] font-mono text-neutral-400 font-extrabold uppercase bg-black/20 px-1 border border-white/5 whitespace-nowrap">
                                🧼 180° fisheye bubble tube
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 14. Hologram Grid Lock */}
                      {selectedMask.type === 'hologram' && (
                        <div className="absolute inset-0 pointer-events-none border border-teal-500/30 rounded-xl flex flex-col justify-between p-2 font-mono text-[7px] text-teal-400 uppercase select-none">
                          <div className="flex justify-between items-center bg-black/30 p-1 border border-teal-500/20 rounded">
                            <span>📡 HOST LOCK: SECURE</span>
                            <span>FREQ: 981.2 MHZ</span>
                          </div>
                          
                          {/* Target focal reticule */}
                          <div className="relative self-center w-28 h-28 border border-dashed border-teal-400/50 rounded-full flex items-center justify-center animate-spin">
                            <div className="w-20 h-20 border border-teal-400/80 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-teal-400 rounded-full animate-ping" />
                            </div>
                          </div>
                          
                          <p className="bg-black/20 p-0.5 text-center border border-teal-500/25 rounded tracking-widest text-[6.5px]">
                            REAL-TIME TRACKING HUD • MATRIX CAPTURED
                          </p>
                        </div>
                      )}

                      {/* 15. Cyberpunk Vaporwave */}
                      {selectedMask.type === 'cyberpunk' && (
                        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2">
                          <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-tr from-fuchsia-950/20 via-purple-950/15 to-transparent mix-blend-color-dodge" />
                          <div className="text-right text-[8px] font-mono text-fuchsia-400 font-bold bg-black/30 p-1 border border-fuchsia-500/20 rounded-md self-end tracking-wider">
                            SHINJUKU RETRO v3.1<br />SCAN ACTIVE
                          </div>
                          <div className="w-12 h-1 bg-fuchsia-500 animate-pulse relative bottom-4 self-center rounded-full opacity-60" />
                        </div>
                      )}

                      {/* 16. Retro Camcorder VHS */}
                      {selectedMask.type === 'vhs' && (
                        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 font-mono text-xs text-white uppercase select-none">
                          <div className="flex justify-between tracking-widest">
                            <span className="flex items-center gap-1 text-[9px] bg-red-600 px-1 py-0.5 rounded font-black text-white animate-pulse">
                              ● REC
                            </span>
                            <span className="text-[8.5px] text-neutral-400 font-bold">SP 0:13:05</span>
                          </div>
                          <div className="relative self-center text-center">
                            <p className="tracking-widest text-[11px] bg-black/20 p-1 rounded border border-white/5">PLAY 📼</p>
                          </div>
                          <div className="flex justify-between text-[8px] text-neutral-400 font-bold tracking-tighter">
                            <span>MON, JUNE 26, 2026</span>
                            <span>10:57:42 AM</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom controls panel when in active interactive AR simulation */}
                    <div className="w-full flex justify-center gap-1.5 z-20 pointer-events-auto select-none mt-1">
                      {selectedMask.type === 'game-burger' && (
                        <button
                          type="button"
                          onClick={() => {
                            setBurgerScore(prev => prev + 1);
                            triggerNotification("🍔 Delicious! Catched a burger.");
                          }}
                          className="px-4 py-1 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold font-mono text-[9px] tracking-widest rounded-full shadow-lg cursor-pointer transform hover:scale-105 active:scale-95 transition-all"
                        >
                          ⊞ OPEN MOUTH! (CATCH)
                        </button>
                      )}

                      {selectedMask.type === 'game-runner' && (
                        <button
                          type="button"
                          onClick={() => {
                            setHurdleDistance(prev => prev + Math.floor(Math.random() * 8) + 5);
                            triggerNotification("🏃‍♂️ Great jump! Obstacle cleared.");
                          }}
                          className="px-4 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold font-mono text-[9px] tracking-widest rounded-full shadow-lg cursor-pointer transform hover:scale-105 active:scale-95 transition-all"
                        >
                          🏃‍♂️ JUMP OVER HURDLE!
                        </button>
                      )}

                      {selectedMask.type === 'granny' && (
                        <button
                          type="button"
                          onClick={() => {
                            setGrannyScareActive(true);
                            triggerNotification("😱 BOO! Granny jumpscared you!");
                            setTimeout(() => setGrannyScareActive(false), 2000);
                          }}
                          className="px-4 py-1 bg-red-700 hover:bg-red-600 text-white font-extrabold font-mono text-[9px] tracking-widest rounded-full shadow-lg cursor-pointer transform hover:scale-105 active:scale-95 transition-all animate-pulse"
                        >
                          😱 RUN BACK CHASE!
                        </button>
                      )}
                    </div>

                    {/* Granny Horror Screamer Simulation absolute over image if active */}
                    {grannyScareActive && selectedMask.type === 'granny' && (
                      <div className="absolute inset-0 bg-black/55 z-40 flex flex-col items-center justify-center animate-ping pointer-events-none">
                        <span className="text-8xl">👵</span>
                        <h4 className="text-red-500 font-mono text-lg font-black tracking-widest uppercase animate-bounce mt-4">
                          SCARED YOU!
                        </h4>
                      </div>
                    )}
                  </div>
                )}

                {/* Brushed paint point drawings overlay */}
                {brushedPoints.length > 0 && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                    <path
                      d={`M ${brushedPoints.map(p => `${p.x},${p.y}`).join(' L ')}`}
                      fill="none"
                      stroke="rgba(245, 44, 104, 0.75)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            ) : (
              /* Beautiful empty/deleted workspace placeholder dropzone */
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-72 h-72 rounded-2xl border border-dashed border-neutral-800 hover:border-[#F52C68]/50 bg-neutral-950 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all space-y-3 group"
              >
                <div className="w-12 h-12 rounded-full bg-[#F52C68]/10 flex items-center justify-center border border-white/5 group-hover:scale-115 transition-transform duration-200">
                  <Trash2 className="w-5 h-5 text-neutral-400 group-hover:text-[#F52C68]" />
                </div>
                <div>
                  <h5 className="text-[10px] font-mono uppercase tracking-wider text-neutral-300 font-extrabold">WORKSPACE COMPENSATED</h5>
                  <p className="text-[8px] text-neutral-500 mt-1 max-w-[200px] leading-relaxed">
                    Active asset is empty or deleted. Drag/drop a new media or choose a quick project template from the top deck to initialize!
                  </p>
                </div>
                <span className="px-3 py-1 bg-[#F52C68]/15 text-[#F52C68] font-mono text-[9px] uppercase font-bold tracking-widest rounded-lg border border-[#F52C68]/20 hover:bg-[#F52C68] hover:text-white transition-all duration-150 animate-pulse">
                  Import Media
                </span>
              </div>
            )}

              {/* Before / After comparisons split layout slider bar */}
              {compareMode && (
                <div className="absolute inset-y-0 left-0 right-0 pointer-events-none flex items-center justify-center">
                  <div className="w-0.5 h-full bg-brand-pink/90 relative shadow-lg">
                    <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-[#121212] border-2 border-brand-pink flex items-center justify-center text-[10px] font-bold text-brand-pink select-none pointer-events-auto cursor-ew-resize">
                      ↔
                    </span>
                  </div>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/65 text-neutral-400 border border-white/5 font-mono text-[8px] p-1 rounded">
                    BEFORE
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#F52C68] text-white font-mono text-[8.5px] font-extrabold p-1 rounded shadow-md">
                    AFTER
                  </div>
                </div>
              )}
            </div>

            {/* Bottom floating workspace operations */}
            <div className="absolute bottom-2.5 inset-x-2.5 z-10 flex items-center justify-between gap-1.5 px-2">
              <button
                onMouseDown={() => {
                  setIsHolding(true);
                  triggerNotification("Holding RAW comparison");
                }}
                onMouseUp={() => setIsHolding(false)}
                onMouseLeave={() => setIsHolding(false)}
                onTouchStart={() => setIsHolding(true)}
                onTouchEnd={() => setIsHolding(false)}
                className="p-2 bg-black/65 hover:bg-black border border-white/10 hover:border-white/20 text-neutral-300 font-mono text-[9px] font-bold rounded-xl shadow-lg cursor-pointer flex items-center gap-1 uppercase select-none"
                title="Hold or Hold-down to inspect RAW original photo"
              >
                <Eye className="w-3.5 h-3.5 text-brand-pink animate-pulse" />
                <span className="hidden sm:inline">Hold to Compare RAW</span>
                <span className="inline sm:hidden">RAW</span>
              </button>

              <div className="flex gap-1.5">
                {mediaType === 'video' && (
                  <button
                    onClick={() => {
                      setIsPlayingVideo(!isPlayingVideo);
                    }}
                    className="p-2 bg-black/65 border border-white/10 rounded-xl hover:text-cyan-400 cursor-pointer flex items-center justify-center"
                    title={isPlayingVideo ? "Pause Video Stream" : "Play Video"}
                  >
                    {isPlayingVideo ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                )}

                {/* Drag / File Uploader trigger */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 bg-neutral-900 hover:bg-[#F52C68] border border-white/10 hover:border-[#F52C68] text-neutral-200 hover:text-white font-mono text-[9px] font-bold rounded-xl shadow-lg cursor-pointer transition-colors flex items-center gap-1.5 uppercase"
                  title="Upload custom portrait/scene file"
                >
                  <Crop className="w-3.5 h-3.5 shrink-0" />
                  <span>Import Media</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadedFiles}
                  className="hidden"
                  accept="image/*,video/*"
                />
              </div>
            </div>
          </div>
        </div>

        {/* WORK BENCH SIDE/BOTTOM CONTROL PANEL DESK */}
        <div className="bg-[#0b0b0e] border-t border-white/5 shrink-0 p-3 flex flex-col gap-3">
          
          {/* Horizontal control options switches */}
          <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0 border-b border-white/5">
            {[
              { id: 'presets', label: 'presets', icon: Compass },
              { id: 'vsco-lgt', label: 'Lightroom VSCO', icon: Sliders },
              { id: 'ai-magic', label: 'AI Magic Tools', icon: Sparkles },
              { id: 'capcut', label: 'CapCut FX', icon: Scissors },
              { id: 'ar-snap', label: 'Snap AR Mask', icon: Smile },
              { id: 'adjust', label: 'Detail Adjust', icon: Tv }
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveToolBarTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-mono text-[9.5px] uppercase tracking-wider font-extrabold flex items-center gap-1 cursor-pointer shrink-0 transition-all ${
                    activeToolBarTab === tab.id 
                      ? 'bg-[#F52C68]/20 text-white border border-[#F52C68]/40 shadow-sm' 
                      : 'bg-white/5 text-neutral-400 border border-transparent hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <TabIcon className="w-3 h-3 text-[#F52C68]" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ACTIVE DRAWER VIEW BLOCK */}
          <div className="min-h-[140px] max-h-[175px] overflow-y-auto custom-scrollbar pr-1">
            
            {/* TAB: PRESET CATEGORY STATIONS */}
            {activeToolBarTab === 'presets' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 font-bold">Trending LUTs & Presets</span>
                  <div className="flex space-x-1">
                    {[
                      { id: 'vsco', lbl: 'VSCO' },
                      { id: 'instagram', lbl: 'INS' },
                      { id: 'lut', lbl: 'LUTS' },
                      { id: 'tiktok', lbl: 'TIKTOK' }
                    ].map(g => (
                      <button
                        key={g.id}
                        onClick={() => setActivePresetGroup(g.id as any)}
                        className={`px-2 py-0.5 text-[8.5px] rounded font-mono font-bold ${
                          activePresetGroup === g.id 
                            ? 'bg-brand-pink text-white' 
                            : 'bg-white/5 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {g.lbl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {presetCollections[activePresetGroup].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyPresetId(preset.id)}
                      className={`text-left p-2 rounded-xl transition-all border ${
                        selectedPresetId === preset.id 
                          ? 'bg-[#F52C68]/15 border-[#F52C68]/50 ring-1 ring-[#F52C68]/20' 
                          : 'bg-neutral-900 hover:bg-neutral-800 border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-mono font-black text-[9.5px] text-white tracking-wide">{preset.name}</span>
                        {selectedPresetId === preset.id && <Check className="w-3 h-3 text-[#F52C68] font-black" />}
                      </div>
                      <p className="text-[8px] text-neutral-400 font-light truncate">{preset.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: VSCO LIGHTROOM PRO SLIDERS */}
            {activeToolBarTab === 'vsco-lgt' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-amber-400 font-extrabold">Professional Lightroom Deck</span>
                  <span className="text-[8px] text-neutral-500 font-mono">VSCO ENGINE PRO v4.1</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1">
                  {/* Slider: Exposure */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span className="text-neutral-400 uppercase tracking-wide flex items-center gap-1">
                        <Sun className="w-3 h-3 text-amber-400" /> EXPOSURE
                      </span>
                      <span className="text-white font-bold">{adjustments.exposure}%</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adjustments.exposure}
                      onChange={(e) => setAdjustments({ ...adjustments, exposure: Number(e.target.value) })}
                      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#F52C68]"
                    />
                  </div>

                  {/* Slider: Contrast */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span className="text-neutral-400 uppercase tracking-wide flex items-center gap-1">
                        <Contrast className="w-3 h-3 text-purple-400" /> CONTRAST
                      </span>
                      <span className="text-white font-bold">{adjustments.contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adjustments.contrast}
                      onChange={(e) => setAdjustments({ ...adjustments, contrast: Number(e.target.value) })}
                      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#F52C68]"
                    />
                  </div>

                  {/* Slider: Saturation */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span className="text-neutral-400 uppercase tracking-wide">🎨 SATURATION</span>
                      <span className="text-white font-bold">{adjustments.saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adjustments.saturation}
                      onChange={(e) => setAdjustments({ ...adjustments, saturation: Number(e.target.value) })}
                      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#F52C68]"
                    />
                  </div>

                  {/* Slider: Temperature */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span className="text-neutral-400 uppercase tracking-wide">🌡️ TEMP (TINT)</span>
                      <span className={adjustments.temperature > 0 ? 'text-orange-400 font-bold' : 'text-cyan-400 font-bold'}>
                        {adjustments.temperature > 0 ? `+${adjustments.temperature}K` : `${adjustments.temperature}K`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={adjustments.temperature}
                      onChange={(e) => setAdjustments({ ...adjustments, temperature: Number(e.target.value) })}
                      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#F52C68]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: AI MAGIC TRANSFORMATIONS */}
            {activeToolBarTab === 'ai-magic' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-mono uppercase tracking-widest text-cyan-400 font-extrabold">AI Generative Neural Tools</span>
                  <span className="text-[8px] bg-cyan-400/10 text-cyan-400 px-1.5 py-0.2 rounded font-mono font-bold">STABLE COGNITIVE</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Tool 1: BG Remover */}
                  <button
                    onClick={() => {
                      setBgRemoved(!bgRemoved);
                      triggerNotification(bgRemoved ? "Reinserted original backdrop content" : "🪄 AI background erased! Isolated main subject successfully.");
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      bgRemoved 
                        ? 'bg-cyan-500/10 border-cyan-400 text-white' 
                        : 'bg-[#121215] border-white/5 hover:border-white/10 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-mono font-black text-[9.5px] uppercase">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>AI BG Remover</span>
                    </div>
                    <p className="text-[8px] text-neutral-500 mt-0.5 truncate">Isolates face/body subject</p>
                  </button>

                  {/* Tool 2: Object Removal Brush Toggle */}
                  <button
                    onClick={() => {
                      setObjectRemovalActive(!objectRemovalActive);
                      triggerNotification(objectRemovalActive ? "Deactivated blemish pointer" : "✏️ Smart Object Eraser activated. Click / Drag on canvas to select object.");
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      objectRemovalActive 
                        ? 'bg-red-500/10 border-red-400 text-white' 
                        : 'bg-[#121215] border-white/5 hover:border-white/10 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-mono font-black text-[9.5px] uppercase">
                      <Brush className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                      <span>AI Object Eraser</span>
                    </div>
                    <p className="text-[8px] text-neutral-500 mt-0.5 truncate">{objectRemovalActive ? '🖌️ BRUSH ACTIVE NOW' : 'Brush out photobombers'}</p>
                  </button>
                </div>

                {/* AI Sky Replacer choices */}
                <div className="p-2 bg-neutral-900 border border-white/5 rounded-xl">
                  <p className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5">Generative AI Sky Replacement</p>
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                    {([
                      { id: 'original', label: 'Original' },
                      { id: 'nebula', label: '🌌 Nebula' },
                      { id: 'sunset', label: '🌅 Sunset' },
                      { id: 'aurora', label: '🇳🇴 Aurora' },
                      { id: 'storm', label: '⚡ Storm' }
                    ] as const).map(sky => (
                      <button
                        key={sky.id}
                        onClick={() => {
                          setSelectedSky(sky.id);
                          setBgRemoved(true); // Auto erase bg so sky shines
                          triggerNotification(`Sky replaced with simulated ${sky.label}`);
                        }}
                        className={`text-[8.5px] font-mono px-2 py-1 rounded border shrink-0 ${
                          selectedSky === sky.id 
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                            : 'bg-black/30 border-white/5 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {sky.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CAPCUT MOTION EFFECTS & GRAPH SPEED */}
            {activeToolBarTab === 'capcut' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#F52C68] font-bold">CapCut Video Effects Studio</span>
                  <span className="text-[8px] bg-[#F52C68]/15 text-[#F52C68] px-1.5 py-0.2 rounded font-mono font-bold">TRENDING</span>
                </div>

                {/* Horizontal row of effects presets */}
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'none', label: 'Clean RAW' },
                    { id: 'motionblur', label: 'Motion Blur' },
                    { id: 'velocity', label: 'Slow Velocity' },
                    { id: 'glowblast', label: 'Glow Wave' },
                    { id: 'shake', label: 'Screen Shake' },
                    { id: 'zoom', label: '3D Ken Burns' }
                  ].map(eff => (
                    <button
                      key={eff.id}
                      onClick={() => {
                        setCapcutEffect(eff.id as any);
                        triggerNotification(`Applied video filter: ${eff.label}`);
                      }}
                      className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                        capcutEffect === eff.id 
                          ? 'bg-[#F52C68]/20 border-[#F52C68] text-white font-bold' 
                          : 'bg-neutral-900 border-white/5 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <p className="font-mono text-[9px] truncate">{eff.label}</p>
                    </button>
                  ))}
                </div>

                {/* Velocity configuration if active */}
                {capcutEffect === 'velocity' && (
                  <div className="p-2 bg-neutral-900/60 border border-white/5 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[8px] text-neutral-400 uppercase font-mono">Velocity ramp format</p>
                      <p className="text-[7.5px] text-neutral-500 font-mono">Smooths transitions at critical beats</p>
                    </div>
                    <div className="flex space-x-1 shrink-0">
                      {(['standard', 'bullet', 'montage', 'jump'] as const).map(curveName => (
                        <button
                          key={curveName}
                          onClick={() => {
                            setVelocityCurve(curveName);
                            triggerNotification(`Velocity ramp set to ${curveName}`);
                          }}
                          className={`text-[8px] font-mono px-2 py-1 rounded ${
                            velocityCurve === curveName 
                              ? 'bg-amber-400 text-black font-extrabold' 
                              : 'bg-black/20 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {curveName.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: SNAPCHAT AR FACE MASK */}
            {activeToolBarTab === 'ar-snap' && (
              <div className="space-y-3">
                {/* Snapchat header with Search & Sub-categories precisely matching Image 2 */}
                <div className="flex flex-col gap-2 bg-neutral-950/60 p-2.5 rounded-xl border border-white/5 shadow-sm animate-fade">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#F52C68] font-extrabold flex items-center gap-1 leading-none">
                      <Sparkles className="w-3 h-3 text-[#F52C68] animate-pulse" />
                      Snapchat AR Lens Explorer
                    </span>
                    
                    {/* Active search bar with a cool input field */}
                    <div className="relative flex-1 max-w-[130px] sm:max-w-[200px]">
                      <input
                        type="text"
                        placeholder="Search Lenses..."
                        value={arSearchQuery}
                        onChange={(e) => setArSearchQuery(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/10 hover:border-[#F52C68]/40 focus:border-[#F52C68] text-[8.5px] rounded-lg px-2 py-1 text-white placeholder-neutral-500 font-mono transition-all pr-5 focus:outline-none"
                      />
                      {arSearchQuery && (
                        <button
                          onClick={() => setArSearchQuery('')}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-[8px] font-bold font-mono"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedMask(null);
                        setBurgerScore(0);
                        setHurdleDistance(0);
                        triggerNotification("Cleared all AR filters");
                      }}
                      className="px-2.5 py-1 bg-neutral-900 hover:bg-red-600 rounded-lg text-[8.5px] font-mono font-bold text-neutral-300 border border-white/10 hover:border-red-500 active:scale-95 transition-all uppercase cursor-pointer"
                      title="Clear currently active AR lens overlay"
                    >
                      ✕ Clear
                    </button>
                  </div>

                  {/* Horizontal pill navigation bar like snapchat (Image 2) */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none border-t border-white/5 pt-1.5 text-[8.5px]">
                    {[
                      { id: 'foryou', label: 'For You' },
                      { id: 'games', label: 'Play Games' },
                      { id: 'aesthetic', label: 'Aesthetic' },
                      { id: 'avatars', label: '3D Characters' },
                      { id: 'retro', label: 'Retro Film' },
                      { id: 'all', label: 'All Lenses' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setSelectedArCategory(tab.id)}
                        className={`px-2.5 py-1 rounded-full text-[8.5px] font-mono font-black uppercase whitespace-nowrap transition-all cursor-pointer ${
                          selectedArCategory === tab.id
                            ? 'bg-[#F52C68] text-white font-extrabold shadow-md shadow-[#F52C68]/20 scale-102'
                            : 'bg-white/5 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {tab.id === 'foryou' ? '🔥 ' : tab.id === 'games' ? '🎮 ' : tab.id === 'aesthetic' ? '🌸 ' : tab.id === 'avatars' ? '👽 ' : tab.id === 'retro' ? '📼 ' : '✨ '}
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter and display the rich 16 lenses in a dense 4-column responsive grid */}
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                  {arMasks
                    .filter(mask => {
                      // Apply category match
                      if (selectedArCategory !== 'all' && selectedArCategory !== 'foryou') {
                        if (mask.category !== selectedArCategory) return false;
                      }
                      // If 'foryou' selected, show standard handpicked items
                      if (selectedArCategory === 'foryou') {
                        if (mask.category !== 'for-you' && mask.category !== 'games' && mask.id !== 'lens-hearts') return false;
                      }
                      // Apply search query match
                      if (arSearchQuery.trim()) {
                        return mask.name.toLowerCase().includes(arSearchQuery.toLowerCase()) || 
                               mask.desc.toLowerCase().includes(arSearchQuery.toLowerCase());
                      }
                      return true;
                    })
                    .map(mask => {
                      const isActive = selectedMask?.id === mask.id;
                      return (
                        <button
                          key={mask.id}
                          onClick={() => {
                            setSelectedMask(mask);
                            setBurgerScore(0);
                            setHurdleDistance(0);
                            triggerNotification(`Activated AR effect: ${mask.name}`);
                          }}
                          className={`relative aspect-[3/4] rounded-2xl flex flex-col items-center justify-between p-2.5 overflow-hidden transition-all duration-350 border focus:outline-none cursor-pointer group ${
                            isActive 
                              ? 'bg-neutral-900 border-[#F52C68] shadow-lg shadow-[#F52C68]/20 bg-gradient-to-tr from-[#F52C68]/30 via-neutral-950 to-neutral-950 scale-[1.03]' 
                              : `bg-neutral-950 border-white/5 hover:border-neutral-700 hover:shadow-md bg-gradient-to-tr ${mask.bgGradient} to-neutral-950/80`
                          }`}
                          title={mask.desc}
                        >
                          {/* Soft particle aura on selected item */}
                          {isActive && (
                            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-pink animate-ping" />
                          )}

                          {/* Large centralized cartoon emoji illustration */}
                          <div className={`text-3xl my-auto select-none transition-transform duration-300 group-hover:scale-125 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] ${mask.color} ${
                            isActive ? 'animate-bounce' : ''
                          }`}>
                            {mask.icon}
                          </div>

                          {/* Beautiful glassmorphism name box entirely INSIDE the card button */}
                          <div className={`w-full py-1 px-1.5 rounded-lg text-center backdrop-blur-md transition-all truncate select-none border leading-none ${
                            isActive 
                              ? 'bg-[#F22965]/90 border-brand-pink/40 text-white font-black' 
                              : 'bg-black/55 border-white/5 text-neutral-300 font-bold'
                          }`}>
                            <p className="text-[8.5px] uppercase tracking-wide leading-none truncate font-mono">
                              {mask.name.replace(' Game', '').replace(' Mask', '').replace(' Crown', '').replace(' Lens', '')}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* TAB: GENERAL SLIDERS AND BOKEH */}
            {activeToolBarTab === 'adjust' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 leading-none">Photographer Optics Deck</span>
                  <span className="text-[8px] text-neutral-500 font-mono">BOKEH & GRAIN LAB</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1">
                  {/* Slider: Vignette */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono">
                      <span className="text-neutral-400 uppercase tracking-wide">🌑 VIGNETTE SHADOWS</span>
                      <span className="text-white font-bold">{adjustments.vignette}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={adjustments.vignette}
                      onChange={(e) => setAdjustments({ ...adjustments, vignette: Number(e.target.value) })}
                      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#F52C68]"
                    />
                  </div>

                  {/* Slider: Film Grain */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono">
                      <span className="text-neutral-400 uppercase tracking-wide">🎞️ RETRO FILM GRAIN</span>
                      <span className="text-white font-bold">{adjustments.grain}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={adjustments.grain}
                      onChange={(e) => setAdjustments({ ...adjustments, grain: Number(e.target.value) })}
                      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#F52C68]"
                    />
                  </div>

                  {/* Slider: DSLR Bokeh Blur */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono">
                      <span className="text-neutral-400 uppercase tracking-wide">👁️ DSLR BOKEH (BLUR)</span>
                      <span className="text-white font-bold">{adjustments.blur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      value={adjustments.blur}
                      onChange={(e) => setAdjustments({ ...adjustments, blur: Number(e.target.value) })}
                      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#00b0ff]"
                    />
                  </div>

                  {/* Slider: Preset/Filter Intensity */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono">
                      <span className="text-neutral-400 uppercase tracking-wide">🔥 FILTER INTENSITY</span>
                      <span className="text-[#F52C68] font-bold">{adjustments.intensity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={adjustments.intensity}
                      onChange={(e) => setAdjustments({ ...adjustments, intensity: Number(e.target.value) })}
                      className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#F52C68]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI AESTHETIC SCORER & INTELLIGENT COMPANION */}
          <div className="p-2.5 bg-neutral-950 border border-white/5 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-[#00b0ff]/10 flex items-center justify-center">
                  <Award className="w-3 h-3 text-[#00b0ff]" />
                </div>
                <h4 className="text-[10px] font-mono font-black text-white uppercase tracking-wider">AI Aesthetic Scorecard Analyzer</h4>
              </div>
              <div className="bg-[#00b0ff]/20 text-[#00b0ff] text-[10px] font-mono font-black px-2 py-0.5 rounded-full animate-pulse">
                SCORING: {aestMetrics.score} / 10
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1 text-center mb-2">
              <div className="p-1.5 bg-black/20 border border-white/5 rounded-xl">
                <p className="text-[7.5px] text-neutral-500 uppercase font-mono">Rule of Thirds</p>
                <p className="text-[10.5px] font-mono font-bold text-white tracking-tight">{aestMetrics.composition}</p>
              </div>
              <div className="p-1.5 bg-black/20 border border-white/5 rounded-xl">
                <p className="text-[7.5px] text-neutral-500 uppercase font-mono">Luminance</p>
                <p className="text-[10.5px] font-mono font-bold text-[#F52C68] tracking-tight">{aestMetrics.contrast}</p>
              </div>
              <div className="p-1.5 bg-black/20 border border-white/5 rounded-xl">
                <p className="text-[7.5px] text-neutral-500 uppercase font-mono">Color Harmony</p>
                <p className="text-[10.5px] font-mono font-bold text-cyan-400 tracking-tight">{aestMetrics.colorHarmony}</p>
              </div>
              <div className="p-1.5 bg-black/20 border border-[#00b0ff]/10 rounded-xl">
                <p className="text-[7.5px] text-neutral-500 uppercase font-mono">Viral Potency</p>
                <p className="text-[8.5px] font-mono font-bold text-yellow-400 tracking-tight leading-tighter uppercase whitespace-normal">{aestMetrics.viralScore}</p>
              </div>
            </div>

            <div className="flex items-start gap-1 p-2 bg-[#121214] border border-white/5 rounded-xl">
              <Info className="w-3.5 h-3.5 text-[#00b0ff] shrink-0 mt-0.5" />
              <p className="text-[8px] text-neutral-400 leading-normal font-sans">
                💡 <span className="font-bold text-white">AI Studio Recommendation:</span> COMPOSITION BALANCE IS RATED <span className="text-[#00b0ff] font-bold">EXCELLENT</span>.
                Applying the <span className="text-[#F52C68] font-bold">{getSelectedPresetMeta().name}</span> preset with <span className="text-yellow-400 font-bold">{adjustments.grain}% film grain</span> will maximize engagement rate for vertical swiping algorithms!
              </p>
            </div>
          </div>

          {/* MASTER PRESET REGISTRATION FORM & MASTER EXPORTS BAR */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch justify-between shrink-0 pt-1.5">
            {/* Custom preset form */}
            <form onSubmit={handleCreateCustomPreset} className="flex-1 flex gap-1.5 items-stretch">
              <input
                type="text"
                placeholder="Name current adjustment setup..."
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="flex-1 text-[9.5px] bg-black border border-white/10 focus:border-cyan-400 rounded-xl px-2.5 outline-none font-mono text-neutral-100 placeholder:text-neutral-600"
              />
              <button
                type="submit"
                className="px-3 bg-neutral-900 border border-white/10 hover:border-cyan-400/40 text-neutral-300 hover:text-[#00b0ff] font-mono text-[9px] uppercase font-bold tracking-wider rounded-xl transition-all hover:bg-[#00b0ff]/5 shrink-0 cursor-pointer"
              >
                Save Preset
              </button>
            </form>

            <button
              onClick={() => {
                setIsExporting(true);
                // restart export counters
                setExportProgress(0);
                triggerExport();
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-[#F52C68] to-[#FF4B88] hover:scale-102 active:scale-95 text-white font-mono text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-md shadow-[#F52C68]/20 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-white animate-bounce" />
              <span>4K/8K High Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* EXPORT WORKSPACE POPUP MODAL */}
      {isExporting && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in text-white text-left">
          <div className="absolute inset-0" onClick={() => setIsExporting(false)} />
          
          <div className="relative w-full max-w-sm bg-neutral-950 border border-white/10 rounded-3xl p-6 text-center z-10 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <span className="text-xs font-mono font-bold tracking-widest text-[#F52C68] uppercase">💾 Professional Export Config</span>
              <button 
                onClick={() => setIsExporting(false)}
                className="w-6 h-6 bg-white/10 hover:bg-white/20 text-xs rounded-full flex items-center justify-center cursor-pointer font-bold uppercase transition"
              >
                &times;
              </button>
            </div>

            <p className="text-[9.5px] text-neutral-400 leading-relaxed font-sans mt-1">
              Select target format vector and resolution payload to write high dynamic files directly to storage system:
            </p>

            {/* Resolution and Format settings */}
            <div className="space-y-3 p-3 bg-neutral-900 border border-white/5 rounded-2xl text-left font-mono">
              <div>
                <p className="text-[7.5px] text-neutral-500 uppercase mb-1">Target file format</p>
                <div className="flex space-x-1.5">
                  {(['jpg', 'png', 'mp4'] as const).map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setExportFormat(fmt)}
                      className={`text-[8.5px] px-2.5 py-1 rounded border capitalize ${
                        exportFormat === fmt 
                          ? 'bg-[#F52C68]/20 text-white border-[#F52C68]' 
                          : 'bg-black/30 text-neutral-500 border-white/5 hover:text-white'
                      }`}
                    >
                      {fmt.toUpperCase()} {fmt === 'mp4' ? '• (Video)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[7.5px] text-neutral-500 uppercase mb-1">Target precise resolution (DSLR Pro)</p>
                <div className="grid grid-cols-4 gap-1">
                  {(['hd', '2k', '4k', '8k'] as const).map(res => {
                    const pixels = {
                      hd: '1920 x 1080',
                      '2k': '2560 x 1440',
                      '4k': '3840 x 2160',
                      '8k': '7680 x 4320'
                    }[res];

                    return (
                      <button
                        key={res}
                        onClick={() => setExportResolution(res)}
                        className={`text-[8.5px] p-1.5 rounded border text-center font-bold ${
                          exportResolution === res 
                            ? 'bg-cyan-400/20 text-cyan-300 border-cyan-400' 
                            : 'bg-black/30 text-neutral-500 border-white/5 hover:text-white'
                        }`}
                        title={pixels}
                      >
                        <p>{res.toUpperCase()}</p>
                        <p className="text-[6.5px] text-neutral-500 leading-none">{res === '8k' ? 'ProMaster' : 'HQ'}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Simulated compile progress indicators */}
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center text-[9px] font-mono">
                <span className="text-neutral-400 uppercase">
                  {exportSuccess ? '✓ Render Completed' : '⚙ Baking Master Color Layers...'}
                </span>
                <span className="text-[#F52C68] font-black">{exportProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-[#F52C68] to-[#00b0ff] transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              
              {!exportSuccess ? (
                <p className="text-[7.5px] text-neutral-500 font-mono italic">
                  Compiling color LUT, upscaling vectors, and stitching real-time filter channels...
                </p>
              ) : (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                  <p className="text-[9.5px] font-mono font-bold text-emerald-400 flex items-center justify-center gap-1">
                    ✓ {exportResolution.toUpperCase()} MASTER FILE READY FOR SHARING
                  </p>
                  <p className="text-[7px] text-neutral-400 mt-0.5">Stored client-side. Triggering instant download payload now!</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5 pt-1.5">
              {!exportSuccess ? (
                <button
                  disabled
                  className="w-full py-2.5 bg-neutral-950/40 border border-white/5 text-neutral-600 font-bold text-xs rounded-xl cursor-not-allowed"
                >
                  Rendering...
                </button>
              ) : (
                <a
                  href={bgRemoved ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80' : selectedMediaUrl}
                  download={`booran-studio-${exportResolution.toUpperCase()}-${Date.now()}.${exportFormat}`}
                  onClick={() => setIsExporting(false)}
                  className="w-full py-2.5 bg-emerald-500 hover:scale-102 active:scale-95 text-white font-extrabold text-[10px] uppercase font-mono tracking-widest rounded-xl transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save to Local Machine
                </a>
              )}

              <button
                onClick={() => setIsExporting(false)}
                className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-neutral-300 font-bold font-mono text-[9px] uppercase tracking-wide rounded-xl transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
