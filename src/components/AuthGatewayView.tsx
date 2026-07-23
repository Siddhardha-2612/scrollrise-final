import AppLogo from './AppLogo';

interface AuthGatewayViewProps {
  onLoginSelected: () => void;
  onRegisterSelected: () => void;
  onFaceLoginSelected: () => void;
  onBackToExisting?: () => void;
}

export default function AuthGatewayView({ onLoginSelected, onRegisterSelected, onFaceLoginSelected, onBackToExisting }: AuthGatewayViewProps) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden select-none safe-area-top">
      {/* Background Subtle White Blurs (Monochrome elegance) */}
      <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-white/5 rounded-full blur-[90px]" />
      <div className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-white/2.5 rounded-full blur-[90px]" />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center">
        <AppLogo size="md" />

        {/* Brand App Name */}
        <h2 className="mt-3 font-[family-name:--font-brush] text-white text-[25px] tracking-widest selection:bg-transparent inline-flex items-start">
          SCROLLRISE
          <span className="text-[9px] font-sans font-medium tracking-normal text-neutral-400 align-super -mt-1 select-none">TM</span>
        </h2>

        <div className="w-full mt-16 px-6 space-y-4">
          {/* Action Button: Login - Blue and White style */}
          <button
            onClick={onLoginSelected}
            className="w-full py-3 px-6 rounded-full bg-blue-600 text-white font-bold text-[15px] tracking-wide transition-all duration-300 transform active:scale-98 hover:bg-blue-500 shadow-md cursor-pointer flex items-center justify-center font-sans h-12"
          >
            Login
          </button>

          {/* Action Button: Create Account - Zinc-800 style */}
          <button
            onClick={onRegisterSelected}
            className="w-full py-3 px-6 rounded-full bg-zinc-800 text-white font-bold text-[15px] tracking-wide transition-all duration-300 transform active:scale-98 hover:bg-zinc-700 shadow-lg cursor-pointer flex items-center justify-center font-sans h-12"
          >
            Create account
          </button>

          {/* Symmetrical monochrome back button directly under the Create account option when returning back is valid */}
          {onBackToExisting && (
            <button
              type="button"
              onClick={onBackToExisting}
              className="w-full py-2.5 px-6 rounded-full bg-neutral-950 border border-dashed border-white/20 hover:border-white/40 text-neutral-400 hover:text-white font-mono text-[10.5px] tracking-widest uppercase transition-all duration-300 transform active:scale-98 cursor-pointer mt-3"
            >
              ← Back to Active Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
