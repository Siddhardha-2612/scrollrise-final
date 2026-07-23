import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, ArrowRight, Calendar, KeyRound, Smartphone } from 'lucide-react';
import { scopedStorage } from "../utils/storage";

interface VerifyPhoneViewProps {
  onBack: () => void;
  onVerified: () => void;
}

export default function VerifyPhoneView({ onBack, onVerified }: VerifyPhoneViewProps) {
  const [mobileNumber, setMobileNumber] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = () => {
    if (mobileNumber.length < 10 || secretCode.length < 8) {
      setError('Please fill in all fields completely.');
      return;
    }
    setError('');
    setIsLoading(true);
    // Simulated validation delay
    setTimeout(() => {
      setIsLoading(false);
      onVerified();
    }, 1500);
  };

  return (
    <div className="absolute inset-0 bg-neutral-950 z-[100] flex flex-col font-sans animate-fade-in">
      <div className="sticky top-0 z-10 bg-neutral-950/90 backdrop-blur-md px-4 py-4 flex items-center border-b border-white/5 safe-area-top">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white active:scale-95 transition-all mr-3"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-white text-lg font-semibold tracking-tight">Security Check</h2>
      </div>

      <div className="flex-1 px-6 pt-12 pb-8 flex flex-col">
        <div className="w-16 h-16 bg-blue-500/10 rounded-full mx-auto flex items-center justify-center mb-6">
          <ShieldCheck className="w-8 h-8 text-blue-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-white text-center mb-10">
          Verify your identity
        </h1>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 text-sm px-4 py-3 rounded-xl text-center">
            {error}
          </div>
        )}

        <div className="space-y-6 flex-1">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300 ml-1">Mobile Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Smartphone className="w-5 h-5 text-neutral-500" />
              </div>
              <input
                type="text"
                maxLength={11}
                value={mobileNumber}
                onChange={(e) => {
                  setMobileNumber(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                placeholder="Enter 11 digits"
                className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-blue-500 transition-all font-mono tracking-widest"
              />
            </div>
          </div>

          

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300 ml-1">8-Digit Secret Code</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <KeyRound className="w-5 h-5 text-neutral-500" />
              </div>
              <input
                type="password"
                maxLength={8}
                value={secretCode}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  if(val.length > 8) val = val.substring(0, 8);
                  setSecretCode(val);
                  setError('');
                }}
                placeholder="00000000"
                className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-blue-500 transition-all font-mono tracking-widest"
              />
            </div>
          </div>

          <button
            onClick={handleVerify}
            disabled={mobileNumber.length < 10 || secretCode.length < 8 || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-semibold py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Verify & Proceed
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
