import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Flame, Trophy, Clock, Search, Lock } from 'lucide-react';

interface StarsGraphViewProps {
  onBack: () => void;
}

// --- ARCHITECTURE SIMULATION TYPES & SCHEMAS ---
// In a real full-stack app, these models would live in Prisma/Drizzle (SQL) or Mongoose (NoSQL).
// DB Schema Definitions:
interface UserRecord {
  uid: string;
  displayName: string;
  avatarUrl: string;
  totalCurrentStars: number;
  totalLifetimeAccountLikes: number;
  accountCreationTimestampUTC: number;
}

interface PostRecord {
  id: string;
  authorUid: string;
  createdAtUTC: number;
  visibility: 'public' | 'private';
  likes: number;
  stars_calculated: boolean;
  contributedStars: number; // Stored here after 48h to handle deletion penalties
}

// Mock Database State for Simulation
const MOCK_DB_USERS: UserRecord[] = [
  { uid: 'u_dev_01', displayName: 'You', avatarUrl: 'https://ui-avatars.com/api/?name=You&background=eab308&color=000', totalCurrentStars: 0, totalLifetimeAccountLikes: 45000, accountCreationTimestampUTC: 1672531200000 },
];

const MOCK_DB_POSTS: PostRecord[] = [
  { id: 'p_5', authorUid: 'u_dev_01', createdAtUTC: Date.now() - (48.5 * 3600 * 1000), visibility: 'public', likes: 15400, stars_calculated: false, contributedStars: 0 },
];

export default function StarsGraphView({ 
  onBack
}: StarsGraphViewProps) {
  const [users, setUsers] = useState<UserRecord[]>(MOCK_DB_USERS);
  const [posts, setPosts] = useState<PostRecord[]>(MOCK_DB_POSTS);
  const [publicLeaderboard, setPublicLeaderboard] = useState<UserRecord[]>([]);
  const [privateLeaderboard, setPrivateLeaderboard] = useState<UserRecord[]>([]);
  const [viewMode, setViewMode] = useState<'public' | 'private'>('public');

  // Pull to refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [pullProgress, setPullProgress] = useState(0);

  const handlePointerDown = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop > 0) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setTouchStart(clientY);
  };

  const handlePointerMove = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    if (touchStart === null) return;
    if (isRefreshing) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const diff = clientY - touchStart;
    
    if (diff > 0) {
      setPullProgress(Math.min(diff, 80));
    } else {
      setPullProgress(0);
    }
  };

  const handlePointerUp = () => {
    if (touchStart === null) return;
    
    if (pullProgress > 60) {
      setIsRefreshing(true);
      setPullProgress(60); // Hold it open visually if we want
      
      // Simulate API Call
      setTimeout(() => {
        runBackgroundWorker();
        setIsRefreshing(false);
        setPullProgress(0);
      }, 1200);
    } else {
      setPullProgress(0);
    }
    setTouchStart(null);
  };

  // --- SYSTEM ARCHITECT WORKER LOGIC SIMULATION ---
  const runBackgroundWorker = () => {
    console.log("[CRON 1] Indexed Background Queue Running (5-min interval batch)");
    const nowUTC = Date.now();
    const fortyEightHoursMs = 48 * 3600 * 1000;
    
    // Using simple clones to simulate transactional mutation
    let nextPosts = [...posts];
    let nextUsers = [...users];

    // Transaction Query: WHERE timestamp <= (CurrentTime - 48 Hours) AND stars_calculated == false
    let batchProcessed = false;
    
    nextPosts.forEach((post) => {
      const isPast48h = (nowUTC - post.createdAtUTC) >= fortyEightHoursMs;
      if (isPast48h && !post.stars_calculated) {
        // [LOCK] Simulate DB Transaction Start
        batchProcessed = true;
        // Immutable Star Calculation: Math.floor(likes / 1000)
        // Note: checking live privacy state implicitly inside loop
        const earnedStars = Math.floor(post.likes / 1000);
        post.stars_calculated = true;
        post.contributedStars = earnedStars;

        // Apply to User Pool
        const author = nextUsers.find(u => u.uid === post.authorUid);
        if (author && post.visibility === 'public') {
          // Only add to public star pool if explicitly public at exact moment of calculation (Hour 48)
          author.totalCurrentStars += earnedStars;
        } else if (author && post.visibility === 'private') {
           // We track a hidden property for private stars or just isolate it if needed.
           // For this spec, we will assume "private stars" track separately for private leaderboard.
           (author as any).privateStars = ((author as any).privateStars || 0) + earnedStars;
        }
        // [LOCK] Simulate DB Transaction Commit
      }
    });

    if (batchProcessed) {
      setPosts(nextPosts);
      setUsers(nextUsers);
    }
    // Always update the leaderboard cache (Updater Refresher Gate)
    forceShuffle(nextUsers, nextPosts);
  };

  const forceShuffle = (currentUsers: UserRecord[], currentPosts: PostRecord[]) => {
    console.log("[CRON 2] Executing 3-Hour Scheduled Shuffle & Tie-breaker");
    
    // Filter users array to public vs private sorting
    // Re-verify the 4-Tier Absolute Tie-Breaker logic:
    const sorter = (isPublic: boolean) => (a: UserRecord, b: UserRecord) => {
      const aStars = isPublic ? a.totalCurrentStars : ((a as any).privateStars || 0);
      const bStars = isPublic ? b.totalCurrentStars : ((b as any).privateStars || 0);

      // 1. Primary: Total Current Stars (Descending)
      if (aStars !== bStars) return bStars - aStars;
      
      // 2. Secondary: Total Lifetime Account Likes (Descending)
      if (a.totalLifetimeAccountLikes !== b.totalLifetimeAccountLikes) {
        return b.totalLifetimeAccountLikes - a.totalLifetimeAccountLikes;
      }
      
      // 3. Tertiary: Account Creation Timestamp (Ascending / Oldest wins)
      if (a.accountCreationTimestampUTC !== b.accountCreationTimestampUTC) {
        return a.accountCreationTimestampUTC - b.accountCreationTimestampUTC;
      }
      
      // 4. Quaternary: Unique User ID (Alphabetical string sort)
      return a.uid.localeCompare(b.uid);
    };

    setPublicLeaderboard([...currentUsers].sort(sorter(true)));
    setPrivateLeaderboard([...currentUsers].sort(sorter(false)));
  };

  const simulateDeletePost = (postId: string) => {
    // Post Deletion Penalty Logic
    const nextPosts = [...posts];
    const targetPost = nextPosts.find(p => p.id === postId);
    
    if (targetPost && targetPost.stars_calculated) {
       const penalty = targetPost.contributedStars;
       setUsers(prevUsers => {
         return prevUsers.map(u => {
           if (u.uid === targetPost.authorUid) {
             let newStars = u.totalCurrentStars;
             if (targetPost.visibility === 'public') {
               newStars = Math.max(0, u.totalCurrentStars - penalty);
             } else {
               (u as any).privateStars = Math.max(0, ((u as any).privateStars || 0) - penalty);
             }
             return { ...u, totalCurrentStars: newStars };
           }
           return u;
         });
       });
    }

    setPosts(nextPosts.filter(p => p.id !== postId));
    forceShuffle(users, nextPosts.filter(p => p.id !== postId));
  };

  useEffect(() => {
    runBackgroundWorker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeBoard = viewMode === 'public' ? publicLeaderboard : privateLeaderboard;

  const currentUser = activeBoard.find(u => u.uid === 'u_dev_01') || activeBoard[0];
  const rank1User = activeBoard[0];
  const rivalUser = rank1User?.uid === currentUser?.uid ? activeBoard[1] : rank1User;

  const userStars = currentUser ? (viewMode === 'public' ? currentUser.totalCurrentStars : ((currentUser as any).privateStars || 0)) : 0;
  const rivalStars = rivalUser ? (viewMode === 'public' ? rivalUser.totalCurrentStars : ((rivalUser as any).privateStars || 0)) : 0;
  
  const totalGraphStars = Math.max(1, userStars + rivalStars);
  const userHeightPx = Math.max(15, (userStars / totalGraphStars) * 140);
  const rivalHeightPx = Math.max(15, (rivalStars / totalGraphStars) * 140);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#070707] text-white p-4 font-sans pb-10 flex flex-col">
      <header className="flex items-center space-x-3 mb-6 relative z-10 pt-2 border-b border-white/5 pb-4 shrink-0">
        <button 
          onClick={onBack}
          className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Stars Tracker <Star className="w-4 h-4 fill-amber-400 text-amber-500"/>
          </h1>
        </div>
      </header>

      {/* Controller Top Strip */}
      <div className="flex bg-[#121214] p-1 rounded-xl mb-5 shadow-sm border border-zinc-800/50 shrink-0">
        <button 
          onClick={() => setViewMode('public')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${viewMode === 'public' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500'}`}
        >
          <Trophy className="w-3.5 h-3.5" /> Public Global
        </button>
        <button 
          onClick={() => setViewMode('private')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${viewMode === 'private' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500'}`}
        >
          <Lock className="w-3.5 h-3.5" /> connections and connects only
        </button>
      </div>

      {/* Popularity Standings Map */}
      <div className="bg-[#121214] border border-zinc-800/50 shadow-sm rounded-2xl p-5 mb-5 relative flex flex-col justify-between shrink-0">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest block mb-4 flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5 text-amber-500" /> POPULARITY STANDINGS MAP
        </span>

        <div className="h-44 w-full flex items-end justify-around pb-4 border-b border-white/5 px-6 relative mt-4">
          
          {/* Bar 1 - "you" */}
          <div className="flex flex-col items-center w-16 group z-10">
            <div className="mb-2 relative">
              <Star className="w-6 h-6 text-amber-500 fill-amber-500 animate-bounce" />
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-amber-400">{userStars}</span>
            </div>
            <div 
              className="w-10 bg-gradient-to-t from-pink-500 to-amber-500 rounded-t-lg transition-all duration-700 ease-out shadow-[0_0_15px_rgba(245,158,11,0.3)]"
              style={{ height: `${userHeightPx}px` }}
            />
            <span className="text-[11px] font-semibold text-zinc-100 mt-2 tracking-wide font-display">you</span>
          </div>

          {/* Bar 2 - "Top Competitor" */}
          <div className="flex flex-col items-center w-16 group z-10">
            <div className="mb-2 relative">
              <Star className="w-5 h-5 text-zinc-600 fill-zinc-700" />
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-zinc-500">{rivalStars}</span>
            </div>
            <div 
              className="w-10 bg-zinc-800 rounded-t-lg transition-all duration-700 ease-out"
              style={{ height: `${rivalHeightPx}px` }}
            />
            <span className="text-[11px] font-semibold text-zinc-500 mt-2 font-display text-center truncate max-w-[80px]">
              {rivalUser?.displayName || 'N/A'}
            </span>
          </div>

          <span className="absolute bottom-1 right-2 text-[9px] font-mono tracking-widest uppercase text-zinc-600">Race Standings</span>
        </div>
      </div>

      {/* Leaderboard Array Display */}
      <div 
        className="flex-1 overflow-y-auto overscroll-y-contain custom-scrollbar bg-[#101012] border border-white/5 rounded-2xl p-1 mb-5 min-h-0 relative"
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
      >
        <div 
          className="w-full flex items-center justify-center transition-all duration-300 overflow-hidden"
          style={{ 
            height: isRefreshing ? '60px' : `${pullProgress}px`,
            opacity: pullProgress / 60 
          }}
        >
          {isRefreshing ? (
             <div className="w-5 h-5 border-2 border-zinc-500 border-t-amber-500 rounded-full animate-spin"></div>
          ) : (
             <span className="text-xs font-mono text-zinc-500">Pull to refresh</span>
          )}
        </div>
        
        <div 
          className="space-y-1 transition-transform"
          style={{ 
            transform: `translateY(${!isRefreshing ? 0 : 0}px)`
          }}
        >
          {activeBoard.map((u, i) => {
            const displayStars = viewMode === 'public' ? u.totalCurrentStars : ((u as any).privateStars || 0);

            return (
              <div 
                key={u.uid} 
                className={`flex items-center justify-between p-3 rounded-xl transition-colors
                  ${i === 0 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-[#18181a] border border-transparent'}
                `}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-5 font-mono text-xs font-bold text-zinc-500">
                    {i + 1}
                  </div>
                  {/* Strict UI Render Requirement: Display ONLY Profile Picture and Display Name */}
                  <img src={u.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover shadow-sm bg-zinc-800 border-2 border-[#18181a]" />
                  <div className="flex flex-col">
                    <span className={`font-semibold tracking-tight text-[15px] ${i === 0 ? 'text-amber-400' : 'text-zinc-200'}`}>
                      {u.displayName}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1.5 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
                  <span className="text-white font-bold font-mono text-[13px]">{displayStars}</span>
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

