import { scopedStorage } from "../utils/storage";
import { useState, useEffect } from 'react';
import { ArrowLeft, Inbox, Check, X, ShieldAlert, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getHumanAvatar } from '../utils/avatar';

interface NotificationsViewProps {
  onBack: () => void;
  connectionList: string[];
  onAddConnection: (name: string) => void;
}

interface PendingConnection {
  id: string;
  name: string;
  avatar: string;
  info: string;
  requested?: boolean;
}

export default function NotificationsView({
  onBack,
  connectionList,
  onAddConnection,
}: NotificationsViewProps) {
  const [pendingConnections, setPendingConnections] = useState<PendingConnection[]>(() => {
    const saved = scopedStorage.getItem('booran_pending_connections');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // ignore
      }
    }
    return [];
  });

  const [activityNotifications, setActivityNotifications] = useState<PendingConnection[]>(() => {
    let notifs: PendingConnection[] = [];
    
    // Check Explore Chats
    try {
      const savedExplore = scopedStorage.getItem('booran_explore_chat_histories');
      if (savedExplore) {
        const parsed = JSON.parse(savedExplore);
        Object.keys(parsed).forEach(key => {
          const msgs = parsed[key];
          if (Array.isArray(msgs)) {
            const others = msgs.filter(m => m.sender === 'them' || m.sender === 'user');
            if (others.length > 0) {
              const last = others[others.length - 1];
              notifs.push({
                id: 'exp_' + key + '_' + (last.id || Date.now()),
                name: last.senderName || key,
                avatar: getHumanAvatar(String(key)),
                info: `Sent a message: "${last.text ? last.text.substring(0, 30) : 'Media payload'}${last.text?.length > 30 ? '...' : ''}"`,
              });
            }
          }
        });
      }
    } catch {}

    // Check DMs 
    try {
      const savedDm = scopedStorage.getItem('booran_direct_message_history');
      if (savedDm) {
        const parsed = JSON.parse(savedDm);
        if (Array.isArray(parsed)) {
          const others = parsed.filter(m => m.sender === 'user' || m.sender === 'them');
          if (others.length > 0) {
            const last = others[others.length - 1];
            notifs.push({
              id: 'dm_' + (last.id || Date.now()),
              name: 'Direct Message',
              avatar: getHumanAvatar("dm"), 
              info: `Sent a message: "${last.text ? last.text.substring(0, 30) : 'Media payload'}${last.text?.length > 30 ? '...' : ''}"`,
            });
          }
        }
      }
    } catch {}

    // Check Feed Logs (System Connects)
    try {
      const savedLogs = scopedStorage.getItem('feed_logs');
      if (savedLogs) {
        const parsed = JSON.parse(savedLogs);
        if (Array.isArray(parsed)) {
          parsed.forEach((log, index) => {
             // Only include connect events
             if (log.text && log.text.toLowerCase().includes('connect')) {
                notifs.push({
                  id: 'log_' + index + '_' + Date.now(),
                  name: 'System Event',
                  avatar: getHumanAvatar("sys"),
                  info: log.text
                });
             }
          });
        }
      }
    } catch {}

    // Check Flashes (Story Groups)
    try {
      const savedStories = scopedStorage.getItem('booran_story_groups');
      if (savedStories) {
         const parsed = JSON.parse(savedStories);
         if (Array.isArray(parsed)) {
            parsed.forEach((group, index) => {
               if (group.userId !== 'you' && group.username !== 'your_story' && group.stories && group.stories.length > 0) {
                  notifs.push({
                    id: 'story_' + index + '_' + Date.now(),
                    name: group.username || 'Connection',
                    avatar: group.avatar || getHumanAvatar(`st${index}`),
                    info: `Posted a new flash recently.`
                  });
               }
            });
         }
      }
    } catch {}

    // Reverse to show newest first and limit to roughly top 20
    return notifs.reverse().slice(0, 20); 
  });

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    scopedStorage.setItem('booran_pending_connections', JSON.stringify(pendingConnections));
  }, [pendingConnections]);

  const handleAccept = (item: PendingConnection) => {
    // 1. Mark as accepted locally
    setPendingConnections(prev => prev.map(c => c.id === item.id ? { ...c, requested: false } : c));

    // 2. Add connection
    onAddConnection(item.name);

    // 3. Save to global feed logs
    const newLog = {
      id: Date.now().toString(),
      text: `Connected with ${item.name}! (Request Accepted)`,
      time: 'Just now'
    };
    try {
      const customLogs = JSON.parse(scopedStorage.getItem('feed_logs') || '[]');
      scopedStorage.setItem('feed_logs', JSON.stringify([newLog, ...customLogs]));
    } catch (e) {
      // ignore
    }

    // 4. Set toast feedback
    setFeedbackMsg(`Linked with ${item.name}! 🔗`);
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 2800);
  };

  const handleDecline = (item: PendingConnection) => {
    setPendingConnections(prev => prev.filter(c => c.id !== item.id));
    setFeedbackMsg(`Chat proposal deleted.`);
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 2000);
  };

  return (
    <div className="w-full min-h-full bg-black text-white flex flex-col relative" id="notifications-page-view">
      
      {/* Top Header */}
      <header className="px-6 py-5 flex items-center justify-between sticky top-0 z-30">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/5 flex items-center justify-center hover:bg-neutral-800 active:scale-95 transition-all text-neutral-400 hover:text-white cursor-pointer"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-lg font-bold tracking-tight text-white font-sans">Notifications</h1>

        {/* Empty placeholder to keep title centered */}
        <div className="w-10 h-10" />
      </header>

      {/* Main Content Pane */}
      <div className="flex-1 px-6 py-6 overflow-y-auto space-y-4">
        
        {/* Connection Action Status Toast */}
        <AnimatePresence>
          {feedbackMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-neutral-90/80 border border-white/10 text-brand-pink text-xs font-semibold rounded-xl text-center shadow-lg font-mono"
            >
              {feedbackMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between text-neutral-500 text-[10.5px] uppercase font-mono tracking-wider font-extrabold select-none">
          <span>Connects</span>
          <span className="text-neutral-400 font-mono">({pendingConnections.length})</span>
        </div>

        {/* Request List */}
        <div className="space-y-3.5">
          <AnimatePresence initial={false}>
            {pendingConnections.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-16 px-4 flex flex-col items-center justify-center text-center space-y-3.5"
              >
                <div className="w-12 h-12 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-500">
                  <Inbox className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-neutral-300">No new notifications</p>
                  <p className="text-xs text-neutral-500 max-w-[240px] leading-relaxed mx-auto">
                    Any connection invitations or system events will appear here in your secure mailbox.
                  </p>
                </div>
              </motion.div>
            ) : (
              pendingConnections.map((request) => (
                <motion.div
                  key={request.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30, height: 0, marginBottom: 0, padding: 0 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="p-2.5 bg-neutral-900/60 border border-white/5 rounded-[16px] flex items-center justify-between gap-2 overflow-hidden shadow-inner"
                >
                  {/* User Profile Info */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-neutral-800 shadow-sm relative">
                      <img 
                        src={request.avatar} 
                        alt={request.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white tracking-wide break-words">{request.name}</p>
                      <p className="text-[9.5px] text-neutral-400 line-clamp-1 mt-0.5">{request.info}</p>
                    </div>
                  </div>

                  {/* Actions Panel - Small Compact Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {request.requested ? (
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleAccept(request)}
                          className="text-[10px] font-mono bg-[#00b0ff] text-black px-2.5 py-1.5 rounded-md font-bold hover:bg-white cursor-pointer transition-colors"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleDecline(request)}
                          className="text-[10px] font-mono bg-neutral-800 text-neutral-400 hover:text-red-500 hover:bg-neutral-700 px-2.5 py-1.5 rounded-md font-bold cursor-pointer transition-colors"
                          title="Delete Chat Proposal"
                        >
                          Decline
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#00c853] font-mono font-bold tracking-wider mr-2">
                        Accepted
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Flash Notifications */}
        <div className="flex items-center justify-between text-neutral-500 text-[10.5px] uppercase font-mono tracking-wider font-extrabold select-none mt-8">
          <span>Flash Notifications</span>
          <span className="text-neutral-400 font-mono">({activityNotifications.length})</span>
        </div>

        <div className="space-y-3.5">
          <AnimatePresence initial={false}>
            {activityNotifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3.5"
              >
                <div className="space-y-1">
                  <p className="text-xs text-neutral-500 max-w-[240px] leading-relaxed mx-auto italic">
                    No recent flash notifications.
                  </p>
                </div>
              </motion.div>
            ) : (
              activityNotifications.map((msg) => (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-neutral-900/40 border border-white/5 rounded-[16px] flex items-center justify-between gap-3 overflow-hidden shadow-inner"
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center font-bold text-white uppercase overflow-hidden shrink-0">
                    <img src={msg.avatar} alt={msg.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white tracking-wide break-words">{msg.name}</p>
                    <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5 font-mono">{msg.info}</p>
                  </div>
                  <div className="shrink-0">
                     <div className="w-2 h-2 rounded-full bg-brand-pink animate-pulse" />
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
