import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Screen, UserPreferences, Trip, DayPlan, SubscriptionTier, BillingCycle } from './types';
import { generateTrip } from './services/geminiService';
import { Navigation as BottomNav } from './components/Navigation';
import { Moon, ArrowLeft, RefreshCw, ShieldAlert, X, MapPin, User, ChevronRight, Settings, Check, Circle, Play, HelpCircle, Wind, Zap, Coffee, Map, Navigation, Compass, Crown, Star, Lock, CreditCard, CheckCircle2 } from './components/Icons';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- STYLES & TOKENS ---
// Black: #000000
// White: #FFFFFF
// Moon Gray: #BFC7CC
// Card Bg: bg-white/5

const MOON_GRAY = '#BFC7CC';

// Defined outside components to be shared
const QUIZ_TYPES = [
  {
    id: 'zen',
    title: "The Zen Wanderer",
    desc: "You flow through cities like water. No rush, just pure vibes and observation.",
    icon: Wind,
    tags: ["Mindful", "Observant", "Slow-paced"]
  },
  {
    id: 'adrenaline',
    title: "The Adrenaline Hunter",
    desc: "You chase sunrises and new experiences. Sleep is for when you're back home.",
    icon: Zap,
    tags: ["Energetic", "Bold", "Restless"]
  },
  {
    id: 'local',
    title: "The Local Spirit",
    desc: "You don't just visit; you live there. Coffee shops and small talk are your gateway.",
    icon: Coffee,
    tags: ["Social", "Authentic", "Connector"]
  },
  {
    id: 'deep',
    title: "The Deep Diver",
    desc: "You seek the stories hidden in plain sight. Museums, history, and solitude fuel you.",
    icon: Map,
    tags: ["Analytical", "Curious", "Detailed"]
  }
];

export default function App() {
  const [screen, setScreen] = useState<Screen>(Screen.SPLASH);
  const [preferences, setPreferences] = useState<UserPreferences>({
    vibes: [],
    energy: 50,
    toggles: { busyPlaces: true, avoidNightlife: false, dayOnly: false, firstTime: true },
    destination: '',
    character: { morning: '', navigation: '' },
    subscription: 'FREE'
  });
  const [trip, setTrip] = useState<Trip | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
  // Persist quiz result
  const [quizResultId, setQuizResultId] = useState<string | null>(null);

  const handleGenerateTrip = async () => {
    setScreen(Screen.GENERATING);
    const generatedTrip = await generateTrip(preferences);
    setTrip(generatedTrip);
    setScreen(Screen.PRESENTING);
  };

  const handleSubscriptionUpdate = (tier: SubscriptionTier) => {
      setPreferences(prev => ({ ...prev, subscription: tier }));
      setToast({ message: `Welcome to LUNO+ ${tier}`, type: 'success' });
      setScreen(Screen.HOME);
  };

  const renderContent = () => {
    switch (screen) {
      case Screen.SPLASH:
        return <SplashScreen onStart={() => setScreen(Screen.WALKTHROUGH)} />;
      case Screen.WALKTHROUGH:
        return <WalkthroughScreen onComplete={() => setScreen(Screen.AUTH)} />;
      case Screen.AUTH:
        return <AuthScreen onComplete={() => setScreen(Screen.ONBOARDING)} />;
      case Screen.ONBOARDING:
        return <OnboardingScreen preferences={preferences} setPreferences={setPreferences} onComplete={handleGenerateTrip} />;
      case Screen.GENERATING:
        return <GeneratingScreen />;
      case Screen.PRESENTING:
        return <PresentingScreen trip={trip} onContinue={() => setScreen(Screen.HOME)} onRetry={handleGenerateTrip} />;
      case Screen.HOME:
        return <HomeScreen trip={trip} onSelectDay={(id: string) => { setSelectedDayId(id); setScreen(Screen.DAY_DETAIL); }} onOpenMood={() => setShowMoodModal(true)} onStartQuiz={() => setScreen(Screen.QUIZ)} onPlanTrip={() => setScreen(Screen.ONBOARDING)} />;
      case Screen.DAY_DETAIL:
        return <DayDetailScreen day={trip?.days?.find(d => d.id === selectedDayId)} onBack={() => setScreen(Screen.HOME)} onOpenMood={() => setShowMoodModal(true)} subscription={preferences.subscription} onUpgrade={() => setScreen(Screen.PRICING)} />;
      case Screen.INSIGHTS:
        return <InsightsScreen subscription={preferences.subscription} onUpgrade={() => setScreen(Screen.PRICING)} />;
      case Screen.MAP:
        return <MapScreen trip={trip} />;
      case Screen.PROFILE:
        return <ProfileScreen onStartQuiz={() => setScreen(Screen.QUIZ)} quizResultId={quizResultId} subscription={preferences.subscription} onUpgrade={() => setScreen(Screen.PRICING)} />;
      case Screen.QUIZ:
        return <QuizScreen onBack={() => setScreen(Screen.HOME)} onFinish={(id: string) => setQuizResultId(id)} />;
      case Screen.PRICING:
        return <PricingScreen onBack={() => setScreen(Screen.HOME)} onPurchase={handleSubscriptionUpdate} currentTier={preferences.subscription} />;
      default:
        return null;
    }
  };

  return (
    // Mobile Layout Wrapper
    <div className="min-h-screen bg-black text-white selection:bg-[#BFC7CC] selection:text-black overflow-hidden relative flex justify-center">
      <div className="w-full max-w-md relative bg-black shadow-2xl min-h-screen flex flex-col">
        
        {/* Global Safety Header Icon (visible on main app screens) */}
        {[Screen.HOME, Screen.DAY_DETAIL, Screen.MAP].includes(screen) && (
          <div className="absolute top-4 right-4 z-40">
             <button 
                onClick={() => setShowSafetyModal(true)} 
                aria-label="Safety Tools"
                className="p-2 rounded-full bg-white/10 text-[#BFC7CC] hover:bg-white/20 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#BFC7CC]"
             >
                <ShieldAlert size={20} aria-hidden="true" />
             </button>
          </div>
        )}

        {renderContent()}

        {/* Navigation visible on core screens */}
        {[Screen.HOME, Screen.INSIGHTS, Screen.PROFILE, Screen.MAP].includes(screen) && (
          <BottomNav current={screen} onNavigate={setScreen} />
        )}

        {/* Modals */}
        {showMoodModal && <MoodModal onClose={() => setShowMoodModal(false)} />}
        {showSafetyModal && <SafetyModal onClose={() => setShowSafetyModal(false)} />}

        {/* Global Toast */}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        
      </div>
    </div>
  );
}

// --- COMPONENTS ---

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl animate-slide-up ${type === 'success' ? 'bg-[#BFC7CC] text-black' : 'bg-red-500 text-white'}`}>
            {type === 'success' ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
            <span className="text-sm font-bold">{message}</span>
        </div>
    );
};

// --- SCREENS ---

const SplashScreen = ({ onStart }: { onStart: () => void }) => (
  <div className="h-screen flex flex-col items-center justify-between bg-black animate-fade-in relative p-6" aria-label="Welcome to Luno">
    <div className="flex-1 flex flex-col items-center justify-center w-full relative">
       <div className="relative">
          <h1 className="text-6xl font-bold tracking-tighter text-white z-10 relative">LUNO<span className="text-[#BFC7CC]">.</span></h1>
          <div className="absolute -inset-4 bg-white/5 blur-3xl rounded-full z-0 animate-pulse"></div>
       </div>
    </div>
    
    <div className="w-full pb-8 z-20 animate-slide-up">
        <button 
            onClick={onStart}
            className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-[#BFC7CC] transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#BFC7CC] focus:ring-offset-2 focus:ring-offset-black shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
            Get Started
        </button>
    </div>
  </div>
);

const WalkthroughScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [page, setPage] = useState(0);
  const slides = [
    {
      title: "Solo, Not Alone",
      desc: "Travel on your own terms with a companion that knows your vibe.",
      icon: User
    },
    {
      title: "Adaptive Plans",
      desc: "Feeling chill or energetic? LUNO shifts your itinerary instantly.",
      icon: RefreshCw
    },
    {
      title: "Safe Exploring",
      desc: "Curated safe spots and emergency tools always one tap away.",
      icon: ShieldAlert
    },
    {
      title: "Go LUNO+",
      desc: "Unlock offline access, unlimited replans, and deeper travel insights.",
      icon: Crown,
      isPremium: true
    }
  ];

  return (
    <div className="h-screen flex flex-col p-8 pt-20 bg-black animate-fade-in relative">
      <div className="flex-1 flex flex-col justify-center items-center text-center">
         {slides.map((slide, index) => {
           const Icon = slide.icon;
           const isPremium = (slide as any).isPremium;
           
           return (
             <div key={index} className={`absolute inset-0 flex flex-col items-center justify-center p-8 transition-all duration-500 ease-in-out transform ${index === page ? 'opacity-100 translate-x-0' : index < page ? 'opacity-0 -translate-x-full' : 'opacity-0 translate-x-full'}`}>
                 <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 border transition-all duration-500 ${isPremium ? 'bg-gradient-to-br from-yellow-500/20 to-transparent border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)]' : 'bg-white/5 border-white/10'}`}>
                    <Icon size={48} className={isPremium ? "text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" : "text-[#BFC7CC]"} aria-hidden="true" />
                 </div>
                 <h2 className={`text-3xl font-bold mb-4 ${isPremium ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500' : 'text-white'}`}>{slide.title}</h2>
                 <p className="text-white/60 leading-relaxed">{slide.desc}</p>
             </div>
           );
         })}
      </div>

      <div className="flex flex-col items-center gap-8 mb-8 z-10">
        <div className="flex gap-2" role="tablist">
          {slides.map((_, i) => (
             <button
                key={i}
                role="tab"
                aria-selected={i === page}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setPage(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === page ? (i === 3 ? 'w-8 bg-yellow-400' : 'w-8 bg-[#BFC7CC]') : 'w-2 bg-white/20'}`}
             />
          ))}
        </div>

        <button 
          onClick={() => {
            if (page < slides.length - 1) setPage(page + 1);
            else onComplete();
          }}
          className={`w-full py-4 font-bold rounded-xl transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black ${page === 3 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] focus:ring-yellow-500' : 'bg-white text-black hover:bg-[#BFC7CC] focus:ring-[#BFC7CC]'}`}
        >
          {page === slides.length - 1 ? "Join LUNO" : "Next"}
        </button>
      </div>
    </div>
  );
};

const AuthScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  
  return (
    <div className="h-screen flex flex-col p-6 pt-20 bg-black animate-slide-in-right">
        <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2">LUNO<span className="text-[#BFC7CC]">.</span></h1>
            <p className="text-white/60">Your personal travel companion.</p>
        </div>

        {/* Toggle */}
        <div className="flex bg-white/5 p-1 rounded-xl mb-8">
            <button 
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all active:scale-95 duration-200 ${isLogin ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
            >
                Log In
            </button>
            <button 
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all active:scale-95 duration-200 ${!isLogin ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}
            >
                Sign Up
            </button>
        </div>

        {/* Form */}
        <div className="space-y-4 mb-8">
            {!isLogin && (
                <div className="animate-fade-in">
                    <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Name</label>
                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#BFC7CC]" placeholder="Your name" />
                </div>
            )}
            <div>
                <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Email</label>
                <input type="email" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#BFC7CC]" placeholder="hello@example.com" />
            </div>
             <div>
                <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Password</label>
                <input type="password" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#BFC7CC]" placeholder="••••••••" />
            </div>
        </div>

        <button 
            onClick={onComplete}
            className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-[#BFC7CC] transition-all duration-200 active:scale-95 mb-6"
        >
            {isLogin ? "Log In" : "Create Account"}
        </button>
        
        <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <div className="relative flex justify-center text-xs"><span className="px-2 bg-black text-white/40">or</span></div>
        </div>

        <button 
            onClick={onComplete}
            className="w-full py-4 bg-transparent border border-white/10 text-white font-medium rounded-xl hover:bg-white/5 transition-all duration-200 active:scale-95"
        >
            Continue as Guest
        </button>
    </div>
  );
};

const OnboardingScreen = ({ preferences, setPreferences, onComplete }: any) => {
  const [step, setStep] = useState(0);
  
  const vibes = ['Calm', 'Social', 'Adventure', 'Chill', 'Reset', 'Culture'];

  const toggleVibe = (vibe: string) => {
    const current = preferences.vibes;
    if (current.includes(vibe)) {
      setPreferences({ ...preferences, vibes: current.filter((v: string) => v !== vibe) });
    } else {
      if (current.length < 3) {
        setPreferences({ ...preferences, vibes: [...current, vibe] });
      }
    }
  };

  const handleNext = () => {
     if (step < 3) setStep(step + 1);
     else onComplete();
  };

  const setCharacterAnswer = (key: string, val: string) => {
      setPreferences({ ...preferences, character: { ...preferences.character, [key]: val }});
      setTimeout(handleNext, 150); // Auto advance slightly faster
  };

  return (
    <div className="h-screen flex flex-col p-6 pt-12 pb-10 bg-black">
      {/* Step Indicator */}
      <div className="flex gap-1 mb-8">
         {[0,1,2,3].map(s => (
             <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-[#BFC7CC]' : 'bg-white/10'}`}></div>
         ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {step === 0 && (
          <div className="animate-slide-up">
            <h2 className="text-3xl font-light mb-2">How are you <br /><span className="text-[#BFC7CC] font-bold">feeling?</span></h2>
            <p className="text-white/60 mb-8">Pick up to 3 vibes for your trip.</p>
            <div className="grid grid-cols-2 gap-4" role="group" aria-label="Vibe selection">
              {vibes.map(vibe => {
                const isSelected = preferences.vibes.includes(vibe);
                return (
                  <button
                    key={vibe}
                    onClick={() => toggleVibe(vibe)}
                    aria-pressed={isSelected}
                    className={`p-6 rounded-2xl border transition-all duration-200 active:scale-95 text-left focus:outline-none focus:ring-1 focus:ring-[#BFC7CC] ${
                      isSelected
                        ? 'border-[#BFC7CC] bg-white/10 text-white' 
                        : 'border-white/10 bg-transparent text-white/50 hover:border-white/30'
                    }`}
                  >
                    <span className="text-lg font-medium">{vibe}</span>
                  </button>
                );
              })}
            </div>
            
            <div className="mt-8">
                <label htmlFor="destination" className="block text-white/60 mb-2">Where to?</label>
                <input 
                    id="destination"
                    type="text" 
                    value={preferences.destination}
                    onChange={(e) => setPreferences({...preferences, destination: e.target.value})}
                    placeholder="City or Country"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#BFC7CC] placeholder-white/30"
                />
            </div>
          </div>
        )}

        {/* Character Quiz Q1 */}
        {step === 1 && (
           <div className="animate-slide-in-right">
              <h2 className="text-3xl font-light mb-2">Morning <br /><span className="text-[#BFC7CC] font-bold">routine?</span></h2>
              <p className="text-white/60 mb-8">Set the tone for your day.</p>
              <div className="space-y-3">
                 {['Slow coffee & read', 'Sunrise mission', 'Sleep in late'].map((opt) => (
                    <button 
                       key={opt}
                       onClick={() => setCharacterAnswer('morning', opt)}
                       className={`w-full p-6 text-left rounded-2xl border transition-all duration-200 active:scale-95 focus:outline-none focus:ring-1 focus:ring-[#BFC7CC] ${preferences.character?.morning === opt ? 'bg-white/10 border-[#BFC7CC] text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                    >
                       <span className="text-lg">{opt}</span>
                    </button>
                 ))}
              </div>
           </div>
        )}

        {/* Character Quiz Q2 */}
        {step === 2 && (
           <div className="animate-slide-in-right">
              <h2 className="text-3xl font-light mb-2">Getting <br /><span className="text-[#BFC7CC] font-bold">around?</span></h2>
              <p className="text-white/60 mb-8">How do you navigate a new city?</p>
              <div className="space-y-3">
                 {['Wander aimlessly', 'Planned route', 'Local transport pro'].map((opt) => (
                    <button 
                       key={opt}
                       onClick={() => setCharacterAnswer('navigation', opt)}
                       className={`w-full p-6 text-left rounded-2xl border transition-all duration-200 active:scale-95 focus:outline-none focus:ring-1 focus:ring-[#BFC7CC] ${preferences.character?.navigation === opt ? 'bg-white/10 border-[#BFC7CC] text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                    >
                       <span className="text-lg">{opt}</span>
                    </button>
                 ))}
              </div>
           </div>
        )}

        {step === 3 && (
          <div className="animate-slide-in-right">
            <h2 className="text-3xl font-light mb-2">Energy <br /><span className="text-[#BFC7CC] font-bold">Level</span></h2>
            <p className="text-white/60 mb-12">How active do you want to be?</p>
            
            <div className="relative h-64 flex items-center justify-center">
               <div className="absolute inset-0 flex items-center" aria-hidden="true">
                 <div className="w-full h-1 bg-white/10 rounded-full"></div>
               </div>
               <label htmlFor="energy-slider" className="sr-only">Energy Level</label>
               <input 
                  id="energy-slider"
                  type="range" 
                  min="0" 
                  max="100" 
                  value={preferences.energy}
                  onChange={(e) => setPreferences({...preferences, energy: parseInt(e.target.value)})}
                  className="w-full appearance-none bg-transparent cursor-pointer z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#BFC7CC] [&::-webkit-slider-thumb]:shadow-[0_0_20px_rgba(191,199,204,0.5)] focus:outline-none focus:ring-2 focus:ring-[#BFC7CC] rounded-full"
               />
            </div>
            <div className="flex justify-between text-sm font-medium text-white/50 mt-4">
              <span>Low key</span>
              <span>Full send</span>
            </div>
            <div className="mt-12 text-center">
              <span className="text-6xl font-bold text-white">{preferences.energy}</span>
              <span className="text-[#BFC7CC]">%</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-4">
         {(step === 0 || step === 3) && (
            <button
            onClick={handleNext}
            disabled={step === 0 && (!preferences.vibes.length || !preferences.destination)}
            className={`w-full py-4 rounded-xl font-semibold text-black transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#BFC7CC] ${
                step === 0 && (!preferences.vibes.length || !preferences.destination)
                ? 'bg-white/20 cursor-not-allowed' 
                : 'bg-white hover:bg-[#BFC7CC]'
            }`}
            >
            {step === 3 ? 'Create my LUNO' : 'Next'}
            </button>
         )}
         {(step === 1 || step === 2) && (
             <div className="text-center text-white/20 text-sm">Select an option to continue</div>
         )}
      </div>
    </div>
  );
};

const GeneratingScreen = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-black p-6 text-center" aria-live="polite">
    <div className="w-16 h-16 border-2 border-white/10 border-t-[#BFC7CC] rounded-full animate-spin mb-8" role="status"></div>
    <h3 className="text-xl font-light mb-2">Curating your vibe...</h3>
    <p className="text-white/40 text-sm">Finding quiet corners and perfect spots.</p>
  </div>
);

const PresentingScreen = ({ trip, onContinue, onRetry }: { trip: Trip | null, onContinue: () => void, onRetry: () => void }) => {
  // FALLBACK for missing data
  if (!trip || !trip.days || trip.days.length === 0) {
      return (
          <div className="h-screen flex flex-col items-center justify-center bg-black p-6 text-center animate-fade-in">
              <ShieldAlert size={48} className="text-[#BFC7CC] mb-6 opacity-50" />
              <h2 className="text-xl font-bold mb-2">Trip Generation Failed</h2>
              <p className="text-white/50 text-sm mb-8 max-w-xs">We couldn't generate a trip for this destination. Please try again.</p>
              <div className="space-y-4 w-full">
                  <button onClick={onRetry} className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-[#BFC7CC] transition-all active:scale-95">
                      Try Again
                  </button>
                  <button onClick={onContinue} className="w-full py-4 bg-white/5 text-white font-medium rounded-xl hover:bg-white/10 transition-all active:scale-95">
                      Continue anyway (Mock)
                  </button>
              </div>
          </div>
      );
  }
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setActiveIndex(index);
          }
        });
      },
      {
        root: container,
        threshold: 0.5, // 50% visibility to trigger focus
      }
    );

    const elements = container.querySelectorAll('[data-card]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [trip]);

  return (
    <div className="h-screen bg-black flex flex-col pt-12 animate-fade-in relative overflow-hidden">
        {/* Header */}
        <div className="px-6 text-center mb-6 animate-slide-up z-20">
            <h2 className="text-white/60 text-xs uppercase tracking-[0.2em] mb-2">Ready to explore</h2>
            {/* Added line-clamp to prevent long text from breaking the layout */}
            <h1 className="text-3xl font-bold text-white mb-2 line-clamp-2 overflow-hidden px-4">{trip.destination}</h1>
            <div className="w-12 h-1 bg-[#BFC7CC] rounded-full mx-auto shadow-[0_0_10px_rgba(191,199,204,0.3)]"></div>
        </div>

        {/* Carousel */}
        <div 
            ref={scrollRef}
            className="flex-1 flex overflow-x-auto snap-x snap-mandatory gap-4 px-[10vw] items-center no-scrollbar scroll-smooth z-10 pb-8"
            role="region"
            aria-label="Trip overview carousel"
        >
            {(trip.days || []).map((day, index) => {
                const isActive = index === activeIndex;
                return (
                    <div 
                        key={day.id}
                        data-index={index}
                        data-card
                        className={`
                            snap-center shrink-0 w-[80vw] max-w-[320px] h-[55vh] rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-500 ease-out
                            ${isActive 
                                ? 'bg-gradient-to-br from-white/10 to-transparent border-white/30 scale-100 opacity-100 shadow-[0_0_30px_rgba(191,199,204,0.15)] z-10' 
                                : 'bg-white/5 border-white/5 scale-90 opacity-40 blur-[1px] grayscale z-0'}
                            border
                        `}
                    >
                         <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity pointer-events-none">
                             <span className="text-8xl font-bold text-white">{index + 1}</span>
                         </div>
                        
                        <div className="relative z-10 mt-4">
                           <span className="text-[#BFC7CC] text-sm font-medium uppercase tracking-wide mb-2 block">{day.date}</span>
                           <h3 className="text-3xl font-light text-white mb-4 leading-tight">{day.vibeLabel}</h3>
                           <p className="text-white/80 text-sm leading-relaxed line-clamp-4">{day.summary}</p>
                        </div>

                        <div className="relative z-10 space-y-3 mt-6">
                            <div className="text-xs uppercase text-white/40 tracking-widest">Highlights</div>
                            {(day.mainActivities || []).slice(0, 2).map(act => (
                                <div key={act.id} className="bg-black/40 p-3 rounded-xl border border-white/5 backdrop-blur-sm">
                                    <div className="text-white font-medium text-sm truncate">{act.title}</div>
                                    <div className="text-white/40 text-xs">{act.time}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}
             {/* Spacer for end of list padding to ensure last item can center */}
             <div className="w-[5vw] shrink-0"></div>
        </div>

        {/* Indicators */}
        <div className="flex justify-center gap-2 mb-8 z-20">
            {(trip.days || []).map((_, i) => (
                <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? 'w-6 bg-[#BFC7CC] shadow-[0_0_8px_rgba(191,199,204,0.5)]' : 'w-1.5 bg-white/20'}`}
                />
            ))}
        </div>

        {/* Footer Action */}
        <div className="px-6 pb-8 z-20">
            <button 
                onClick={onContinue}
                className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-[#BFC7CC] transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#BFC7CC] shadow-lg"
            >
                Start Journey
            </button>
        </div>
    </div>
  );
};

const HomeScreen = ({ trip, onSelectDay, onOpenMood, onStartQuiz, onPlanTrip }: any) => {
  // FALLBACK for missing data
  if (!trip || !trip.days || trip.days.length === 0) {
      return (
          <div className="h-screen bg-black flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                  <Map size={32} className="text-white/30" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No Trip Planned</h2>
              <p className="text-white/50 text-sm mb-8">Ready to discover your next destination?</p>
              <button onClick={onPlanTrip} className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-[#BFC7CC] transition-all active:scale-95">
                  Plan a Trip
              </button>
          </div>
      );
  }

  const today = trip.days[0];

  return (
    <div className="min-h-screen bg-black pb-24 animate-fade-in overflow-y-auto">
      <div className="p-6 pt-12">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold truncate max-w-[250px]">{trip.destination}</h1>
            <p className="text-white/50 text-sm">Oct 24 - Oct 27</p>
          </div>
          <div className="px-3 py-1 bg-white/10 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#BFC7CC]"></div>
            <span className="text-xs font-medium uppercase tracking-wide">Chill</span>
          </div>
        </div>

        {/* Today Card */}
        <div className="mb-8">
            <h2 className="text-sm uppercase tracking-widest text-white/40 mb-3">Happening Now</h2>
            <button 
              onClick={() => onSelectDay(today.id)} 
              className="w-full text-left bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-200 active:scale-95 cursor-pointer group focus:outline-none focus:ring-1 focus:ring-[#BFC7CC]"
              aria-label={`View details for today, ${today.date}. Vibe: ${today.vibeLabel}`}
            >
              <div className="flex justify-between items-center mb-4">
                 <span className="text-[#BFC7CC] font-medium">{today.date}</span>
                 <ArrowLeft className="rotate-180 text-white/30 group-hover:text-white transition-colors" size={20} aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-light mb-2">{today.vibeLabel}</h3>
              <p className="text-white/60 leading-relaxed mb-6 line-clamp-3">{today.summary}</p>
              
              <div className="flex gap-2">
                 <div 
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); onOpenMood(); }} 
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenMood()}
                  className="flex-1 py-3 text-center border border-white/20 rounded-xl text-sm font-medium hover:bg-white/5 transition-all duration-200 active:scale-95 focus:bg-white/10 focus:outline-none"
                 >
                   Change Mood
                 </div>
                 <div className="px-4 py-3 bg-white text-black rounded-xl hover:bg-[#BFC7CC] transition-all duration-200 active:scale-90 flex items-center justify-center">
                   <RefreshCw size={18} aria-hidden="true" />
                 </div>
              </div>
            </button>
        </div>

        {/* Quiz Prompt */}
        <div className="mb-8">
          <button 
             onClick={onStartQuiz}
             className="w-full bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:border-white/30 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-1 focus:ring-[#BFC7CC]"
          >
             <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-full">
                  <HelpCircle size={20} className="text-[#BFC7CC]" />
                </div>
                <div className="text-left">
                   <h3 className="font-medium text-sm">Discover your Style</h3>
                   <p className="text-xs text-white/50">Take the traveler personality quiz</p>
                </div>
             </div>
             <ChevronRight className="text-white/30" size={16} />
          </button>
        </div>

        {/* Upcoming List */}
        <div>
           <h2 className="text-sm uppercase tracking-widest text-white/40 mb-3">Coming Up</h2>
           <div className="flex flex-col gap-3">
              {(trip.days || []).slice(1).map((day: any) => (
                <button 
                  key={day.id} 
                  onClick={() => onSelectDay(day.id)} 
                  className="w-full text-left bg-white/5 border border-white/5 rounded-xl p-4 flex justify-between items-center transition-all duration-200 active:scale-95 cursor-pointer hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-[#BFC7CC]"
                  aria-label={`View details for ${day.date}`}
                >
                   <div>
                      <span className="block text-xs text-[#BFC7CC] mb-1">{day.date}</span>
                      <span className="text-lg">{day.vibeLabel}</span>
                   </div>
                   <ArrowLeft className="rotate-180 text-white/20" size={16} aria-hidden="true" />
                </button>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

const QuizScreen = ({ onBack, onFinish }: { onBack: () => void, onFinish: (id: string) => void }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);

  const questions = [
    {
      q: "Ideally, your morning starts with...",
      options: ["Sleeping in late", "A sunrise hike", "Coffee at a local spot", "Hitting a museum early"]
    },
    {
      q: "Your social battery is...",
      options: ["Needs recharging often", "Always 100%", "Good for small groups", "Strictly solo mode"]
    },
    {
      q: "A perfect souvenir is...",
      options: ["Just photos", "A new friendship", "Local art", "A weird antique"]
    }
  ];

  const handleAnswer = (index: number) => {
    // Immediate state update for responsiveness
    setAnswers(prev => [...prev, index]);
    
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
    } else {
      setFinished(true);
    }
  };

  const result = useMemo(() => {
    if (!finished) return null;
    
    // Fallback logic if answers array isn't fully populated yet in this render cycle
    const currentAnswers = answers;

    const counts = [0, 0, 0, 0];
    currentAnswers.forEach(a => {
        if (a >= 0 && a < 4) counts[a]++;
        else counts[0]++; // fallback
    });
    
    let maxIdx = 0;
    let maxVal = -1;
    for(let i=0; i<4; i++){
        if(counts[i] > maxVal){
            maxVal = counts[i];
            maxIdx = i;
        }
    }

    return QUIZ_TYPES[maxIdx] || QUIZ_TYPES[0];
  }, [finished, answers]);

  // Persist result when calculation finishes
  useEffect(() => {
      if (finished && result) {
          onFinish(result.id);
      }
  }, [finished, result, onFinish]);


  if (finished && result) {
    const ResultIcon = result.icon;

    return (
        <div className="h-screen bg-black p-6 flex flex-col items-center justify-center relative overflow-hidden animate-fade-in">
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0 opacity-50">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-[#BFC7CC]/20 to-transparent rounded-full blur-[100px] animate-pulse"></div>
            </div>

            {/* The Card */}
            <div className="w-full max-w-sm relative z-10 animate-scale-in">
                <div className="bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center text-center relative overflow-hidden">
                    
                    {/* Decorative Top Gradient */}
                    <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                    
                    {/* Icon with Ring */}
                    <div className="relative mb-8 mt-4 group">
                        <div className="absolute inset-0 bg-[#BFC7CC] rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                        <div className="w-24 h-24 rounded-full bg-[#111] border border-white/10 flex items-center justify-center relative z-10 ring-1 ring-white/5 shadow-2xl">
                             <ResultIcon size={40} className="text-[#BFC7CC] drop-shadow-[0_0_10px_rgba(191,199,204,0.3)]" />
                        </div>
                    </div>
                    
                    {/* Text Content */}
                    <div className="space-y-3 mb-8 w-full">
                        <div className="text-[10px] uppercase tracking-[0.3em] text-[#BFC7CC] font-medium opacity-0 animate-slide-up" style={{animationDelay: '0.2s'}}>Archetype Unlocked</div>
                        <h2 className="text-4xl font-bold text-white tracking-tight opacity-0 animate-slide-up" style={{animationDelay: '0.3s'}}>{result.title}</h2>
                        <p className="text-white/60 text-sm leading-relaxed px-2 opacity-0 animate-slide-up" style={{animationDelay: '0.4s'}}>
                            {result.desc}
                        </p>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap justify-center gap-2 mb-10 w-full px-2 opacity-0 animate-slide-up" style={{animationDelay: '0.5s'}}>
                       {result.tags.map((tag: string) => (
                           <span key={tag} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[11px] font-medium uppercase tracking-wider text-white/80 shadow-sm">
                               {tag}
                           </span>
                       ))}
                    </div>

                    {/* Actions */}
                    <div className="w-full space-y-4 opacity-0 animate-slide-up" style={{animationDelay: '0.6s'}}>
                        <button 
                            onClick={onBack}
                            className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-[#BFC7CC] transition-all duration-300 active:scale-95 shadow-lg shadow-white/5 flex items-center justify-center gap-2 group"
                        >
                            <span>Continue Journey</span>
                            <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                        </button>
                        
                        <button 
                            onClick={() => { setFinished(false); setCurrentQ(0); setAnswers([]); }}
                            className="text-xs text-white/30 hover:text-white transition-colors uppercase tracking-widest active:scale-95"
                        >
                            Retake Analysis
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  const q = questions[currentQ];

  return (
    <div className="h-screen bg-black p-6 pt-12 flex flex-col animate-slide-in-right">
      <button onClick={onBack} className="self-start p-2 -ml-2 rounded-full hover:bg-white/10 mb-8 transition-all active:scale-90" aria-label="Exit Quiz">
        <X size={24} />
      </button>

      <div className="w-full bg-white/10 h-1 rounded-full mb-8 overflow-hidden">
        <div 
          className="h-full bg-[#BFC7CC] transition-all duration-300 ease-out" 
          style={{ width: `${((currentQ) / questions.length) * 100}%` }}
        ></div>
      </div>

      <div className="mb-2 text-[#BFC7CC] text-sm font-mono">0{currentQ + 1} / 0{questions.length}</div>
      <h2 className="text-3xl font-light mb-8 leading-tight">{q.q}</h2>

      <div className="space-y-4">
        {q.options.map((opt, i) => (
          <button 
            key={i} 
            onClick={() => handleAnswer(i)}
            className="w-full p-6 rounded-2xl border border-white/10 bg-white/5 text-left hover:border-[#BFC7CC] hover:bg-white/10 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-1 focus:ring-[#BFC7CC]"
          >
            <span className="text-lg">{opt}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const PricingScreen = ({ onBack, onPurchase, currentTier }: { onBack: () => void, onPurchase: (tier: SubscriptionTier) => void, currentTier: SubscriptionTier | undefined }) => {
    const [billing, setBilling] = useState<BillingCycle>('MONTHLY');
    const [processing, setProcessing] = useState(false);

    const handleBuy = async (tier: SubscriptionTier) => {
        setProcessing(true);
        // Mock payment delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        setProcessing(false);
        onPurchase(tier);
    };

    const restorePurchases = async () => {
        setProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setProcessing(false);
        // Mock restore
        onPurchase('PLUS'); 
    };

    const tiers = [
        {
            id: 'FREE',
            name: 'Basic',
            price: '$0',
            period: '',
            features: ['Daily Itinerary', 'Basic Mood Swaps', 'Standard Support'],
            icon: User,
            color: 'text-white/60'
        },
        {
            id: 'PLUS',
            name: 'LUNO+',
            price: billing === 'MONTHLY' ? '$4.99' : '$49.99',
            period: billing === 'MONTHLY' ? '/mo' : '/yr',
            features: ['Unlimited Re-plans', 'Offline Access', 'Smart Alternatives'],
            icon: Star,
            color: 'text-[#BFC7CC]'
        },
        {
            id: 'PRO',
            name: 'LUNO Pro',
            price: billing === 'MONTHLY' ? '$9.99' : '$99.99',
            period: billing === 'MONTHLY' ? '/mo' : '/yr',
            features: ['All Plus Features', 'AI Concierge', 'Advanced Insights', 'Exclusive Content'],
            icon: Crown,
            color: 'text-yellow-400'
        }
    ];

    return (
        <div className="min-h-screen bg-black p-6 pt-12 animate-slide-up overflow-y-auto pb-24">
             <button onClick={onBack} className="absolute top-12 left-6 p-2 -ml-2 rounded-full hover:bg-white/10 transition-all active:scale-90" aria-label="Close">
                <X size={24} />
             </button>

             <div className="text-center mb-8 mt-4">
                 <h1 className="text-3xl font-bold mb-2">Unlock Full Access</h1>
                 <p className="text-white/50 text-sm">Choose the plan that fits your journey.</p>
             </div>

             {/* Billing Toggle */}
             <div className="flex justify-center mb-8">
                 <div className="bg-white/10 p-1 rounded-full flex relative">
                     <div className={`absolute top-1 bottom-1 w-[48%] bg-[#BFC7CC] rounded-full transition-all duration-300 ${billing === 'MONTHLY' ? 'left-1' : 'left-[51%]'}`}></div>
                     <button 
                        onClick={() => setBilling('MONTHLY')}
                        className={`px-6 py-2 rounded-full text-sm font-medium relative z-10 transition-transform active:scale-95 duration-200 ${billing === 'MONTHLY' ? 'text-black' : 'text-white/60'}`}
                     >
                         Monthly
                     </button>
                     <button 
                        onClick={() => setBilling('YEARLY')}
                        className={`px-6 py-2 rounded-full text-sm font-medium relative z-10 transition-transform active:scale-95 duration-200 ${billing === 'YEARLY' ? 'text-black' : 'text-white/60'}`}
                     >
                         Yearly <span className="text-[9px] ml-1 opacity-70">-15%</span>
                     </button>
                 </div>
             </div>

             {/* Cards */}
             <div className="space-y-4">
                 {tiers.map((tier) => {
                     const isCurrent = currentTier === tier.id;
                     const isPro = tier.id === 'PRO';
                     const Icon = tier.icon;
                     
                     return (
                         <div 
                            key={tier.id} 
                            className={`relative rounded-3xl p-6 border transition-all duration-300 ${isCurrent ? 'bg-white/10 border-[#BFC7CC]' : 'bg-white/5 border-white/5 hover:bg-white/10'} ${isPro ? 'shadow-[0_0_20px_rgba(255,215,0,0.1)]' : ''}`}
                         >
                             {isCurrent && <div className="absolute top-4 right-4 text-[#BFC7CC]"><CheckCircle2 size={24} /></div>}
                             
                             <div className="flex items-center gap-4 mb-4">
                                 <div className={`p-3 rounded-full bg-white/5 ${tier.color}`}>
                                     <Icon size={24} />
                                 </div>
                                 <div>
                                     <h3 className="font-bold text-lg">{tier.name}</h3>
                                     <div className="text-sm text-white/50">{tier.price}<span className="text-[10px]">{tier.period}</span></div>
                                 </div>
                             </div>

                             <ul className="space-y-2 mb-6">
                                 {tier.features.map((feat, i) => (
                                     <li key={i} className="flex items-center gap-2 text-sm text-white/80">
                                         <Check size={14} className="text-[#BFC7CC]" /> {feat}
                                     </li>
                                 ))}
                             </ul>

                             <button 
                                disabled={isCurrent || processing}
                                onClick={() => handleBuy(tier.id as SubscriptionTier)}
                                className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                                    isCurrent 
                                    ? 'bg-white/10 text-white/40 cursor-default' 
                                    : 'bg-white text-black hover:bg-[#BFC7CC]'
                                }`}
                             >
                                 {processing && !isCurrent ? 'Processing...' : isCurrent ? 'Active Plan' : `Upgrade to ${tier.name}`}
                             </button>
                         </div>
                     )
                 })}
             </div>

             <button onClick={restorePurchases} className="w-full text-center text-xs text-white/30 mt-8 hover:text-white transition-colors active:scale-95">
                 Restore Purchases
             </button>
        </div>
    );
};

const DayDetailScreen = ({ day, onBack, onOpenMood, subscription, onUpgrade }: any) => {
  // FALLBACK if day is missing
  if (!day) {
      return (
          <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <ShieldAlert size={48} className="text-white/20 mb-6" />
              <h2 className="text-xl font-bold mb-2">Day Not Found</h2>
              <button onClick={onBack} className="mt-6 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-[#BFC7CC] transition-all active:scale-95">
                  Go Back
              </button>
          </div>
      );
  }

  const isFree = !subscription || subscription === 'FREE';

  return (
    <div className="min-h-screen bg-black pb-24 animate-slide-in-right overflow-y-auto">
       {/* Header */}
       <div className="sticky top-0 bg-black/80 backdrop-blur-md z-30 p-6 pt-12 border-b border-white/5 flex justify-between items-center">
          <button 
            onClick={onBack} 
            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-all active:scale-90 focus:outline-none focus:ring-1 focus:ring-white"
            aria-label="Back to itinerary"
          >
            <ArrowLeft size={24} aria-hidden="true" />
          </button>
          <span className="font-medium" id="day-header">{day.date}</span>
          <div className="w-8"></div> {/* Spacer */}
       </div>

       <div className="p-6" aria-labelledby="day-header">
          <div className="mb-8 text-center">
             <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-[#BFC7CC] text-xs mb-4">{day.vibeLabel}</span>
             <h2 className="text-3xl font-light">{day.summary}</h2>
          </div>

          <div className="space-y-6 relative">
             {/* Timeline Line */}
             <div className="absolute left-4 top-4 bottom-4 w-px bg-white/10"></div>

             {(day.mainActivities || []).map((act: any) => (
                <div key={act.id} className="relative pl-12 group">
                   <div className="absolute left-[13px] top-6 w-1.5 h-1.5 rounded-full bg-[#BFC7CC] ring-4 ring-black"></div>
                   <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/30 transition-transform active:scale-[0.99] duration-200" tabIndex={0}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-white/50 bg-white/5 px-2 py-0.5 rounded">{act.time}</span>
                        <span className="text-[10px] uppercase tracking-wider text-[#BFC7CC] opacity-60">{act.type}</span>
                      </div>
                      <h3 className="text-lg font-medium mb-1">{act.title}</h3>
                      <p className="text-sm text-white/60 mb-3">{act.description}</p>
                      <div className="flex items-center gap-1 text-xs text-white/40">
                         <MapPin size={12} aria-hidden="true" />
                         <span>{act.location}</span>
                      </div>
                   </div>
                </div>
             ))}
          </div>

          <div className="mt-12 relative">
             <div className="flex justify-between items-center mb-4">
                 <h3 className="text-sm text-white/40 uppercase tracking-widest">Alternatives</h3>
                 {isFree && <Lock size={14} className="text-[#BFC7CC]" />}
             </div>
             
             <div className={`grid grid-cols-2 gap-3 transition-all ${isFree ? 'opacity-50 blur-sm select-none' : ''}`}>
                {(day.alternatives || []).slice(0, 2).map((alt: any) => (
                   <div key={alt.id} className="bg-white/5 border border-white/5 rounded-xl p-4">
                      <h4 className="font-medium text-sm mb-1">{alt.title}</h4>
                      <p className="text-xs text-white/50 line-clamp-2">{alt.description}</p>
                   </div>
                ))}
             </div>

             {isFree && (
                 <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
                     <button onClick={onUpgrade} className="px-6 py-3 bg-white text-black font-bold rounded-xl shadow-lg hover:bg-[#BFC7CC] transition-all active:scale-95 duration-200">
                         Unlock Alternatives
                     </button>
                 </div>
             )}

             {!isFree && (
                <button 
                  onClick={onOpenMood} 
                  className="mt-3 w-full border border-dashed border-white/20 rounded-xl p-4 flex flex-col items-center justify-center text-white/40 hover:text-white hover:border-white/40 transition-all duration-200 active:scale-95 focus:outline-none focus:ring-1 focus:ring-[#BFC7CC]"
                >
                   <span className="text-xs">I feel different (Re-plan)</span>
                </button>
             )}
          </div>
       </div>
    </div>
  );
};

const MoodModal = ({ onClose }: { onClose: () => void }) => {
   const moods = [
     { label: 'Low Key', color: 'bg-blue-900/20' },
     { label: 'Normal', color: 'bg-white/10' },
     { label: 'Alive', color: 'bg-yellow-900/20' },
     { label: 'Social', color: 'bg-purple-900/20' },
     { label: 'Need Space', color: 'bg-red-900/20' }
   ];

   return (
     <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="mood-title">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true"></div>
        <div className="bg-[#111] border-t sm:border border-white/10 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative animate-slide-up z-10">
           <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6"></div>
           <h3 id="mood-title" className="text-xl font-bold mb-6">Check in with yourself</h3>
           
           <div className="space-y-3">
              {moods.map(m => (
                <button key={m.label} className="w-full p-4 flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all duration-200 active:scale-95 group focus:outline-none focus:ring-1 focus:ring-[#BFC7CC]">
                   <span>{m.label}</span>
                   <div className={`w-3 h-3 rounded-full ${m.label === 'Normal' ? 'bg-[#BFC7CC]' : 'bg-white/20 group-hover:bg-[#BFC7CC]'}`}></div>
                </button>
              ))}
           </div>
           
           <button onClick={onClose} className="mt-6 w-full py-4 bg-white text-black font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BFC7CC] active:scale-95 transition-transform">
             Update Plan
           </button>
        </div>
     </div>
   );
};

const SafetyModal = ({ onClose }: { onClose: () => void }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-labelledby="safety-title">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} aria-hidden="true"></div>
      <div className="bg-[#111] border border-red-900/30 w-full max-w-sm rounded-3xl p-6 relative z-10 animate-scale-in">
         <div className="flex justify-between items-center mb-6">
            <h3 id="safety-title" className="text-xl font-bold text-red-400 flex items-center gap-2">
              <ShieldAlert aria-hidden="true" /> Emergency
            </h3>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/20 transition-all active:scale-90" aria-label="Close safety modal"><X size={16} /></button>
         </div>
         <div className="space-y-3">
            <button className="w-full p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl font-medium flex justify-between items-center transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500">
               <span>Call Local Emergency</span>
               <span>911</span>
            </button>
            <button className="w-full p-4 bg-white/5 border border-white/10 rounded-xl font-medium flex justify-between items-center transition-all duration-200 active:scale-95 focus:outline-none focus:ring-1 focus:ring-white">
               <span>Nearest Safe Spot</span>
               <MapPin size={16} aria-hidden="true" />
            </button>
            <button className="w-full p-4 bg-white/5 border border-white/10 rounded-xl font-medium flex justify-between items-center transition-all duration-200 active:scale-95 focus:outline-none focus:ring-1 focus:ring-white">
               <span>Share Live Location</span>
               <User size={16} aria-hidden="true" />
            </button>
         </div>
         <p className="text-xs text-white/30 text-center mt-6">LUNO Safety Hub</p>
      </div>
    </div>
);

const InsightsScreen = ({ subscription, onUpgrade }: any) => {
  const isPro = subscription === 'PRO';

  const data = [
    { name: 'Mon', energy: 40 },
    { name: 'Tue', energy: 60 },
    { name: 'Wed', energy: 85 },
    { name: 'Thu', energy: 50 },
    { name: 'Fri', energy: 70 },
    { name: 'Sat', energy: 90 },
    { name: 'Sun', energy: 65 },
  ];

  return (
    <div className="min-h-screen bg-black p-6 pt-12 pb-24 animate-fade-in flex flex-col">
       <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Weekly Energy</h1>
          <p className="text-white/50 text-sm">Your travel rhythm analysis</p>
       </div>

       <div className="w-full h-64 bg-white/5 rounded-2xl p-4 border border-white/5 mb-8 relative">
           {!isPro && (
               <div className="absolute inset-0 z-10 backdrop-blur-sm bg-black/50 rounded-2xl flex flex-col items-center justify-center">
                    <Lock size={32} className="text-[#BFC7CC] mb-2" />
                    <button onClick={onUpgrade} className="px-4 py-2 bg-white text-black font-bold text-xs rounded-lg hover:bg-[#BFC7CC] transition-all active:scale-95">Unlock Analytics</button>
               </div>
           )}
           <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#ffffff40" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="energy" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.energy > 75 ? '#BFC7CC' : 'rgba(255,255,255,0.2)'} />
                    ))}
                  </Bar>
              </BarChart>
           </ResponsiveContainer>
       </div>

       <div className="grid grid-cols-2 gap-4">
           <div className="bg-white/5 rounded-xl p-5 border border-white/5">
              <div className="text-[#BFC7CC] mb-2"><Zap size={20} /></div>
              <div className="text-2xl font-bold mb-1">68%</div>
              <div className="text-xs text-white/40">Avg. Energy</div>
           </div>
           <div className="bg-white/5 rounded-xl p-5 border border-white/5">
              <div className="text-[#BFC7CC] mb-2"><MapPin size={20} /></div>
              <div className="text-2xl font-bold mb-1">12</div>
              <div className="text-xs text-white/40">Places Visited</div>
           </div>
       </div>
    </div>
  );
};

const MapScreen = ({ trip }: { trip: Trip | null }) => {
  const [selectedPin, setSelectedPin] = useState<string | null>(null);

  // Mock locations for demo purposes
  const locations = [
      { id: '1', lat: 50, lng: 50, title: 'Safe Hub', type: 'safety' },
      { id: '2', lat: 30, lng: 60, title: 'Coffee', type: 'place' },
      { id: '3', lat: 70, lng: 30, title: 'Museum', type: 'place' },
  ];

  return (
    <div className="h-screen bg-[#111] relative animate-fade-in overflow-hidden">
        {/* Map UI Layer */}
        <div className="absolute inset-0 z-0 opacity-20">
           {/* Abstract Grid Pattern simulating a dark map */}
           <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                 <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3"/>
                 </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              {/* Fake roads */}
              <path d="M 0 200 Q 150 250 400 200" stroke="white" strokeWidth="2" fill="none" opacity="0.1" />
              <path d="M 100 0 Q 120 200 150 800" stroke="white" strokeWidth="2" fill="none" opacity="0.1" />
           </svg>
        </div>

        {/* Floating UI */}
        <div className="absolute top-12 left-6 z-10 flex gap-2">
            <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
               <span className="text-xs font-medium">Online</span>
            </div>
        </div>

        <div className="absolute top-12 right-6 z-10 flex flex-col gap-3">
             <button className="p-3 bg-black/80 border border-white/10 rounded-full text-white/80 hover:text-white shadow-lg transition-transform active:scale-90">
                <Navigation size={20} />
             </button>
             <button className="p-3 bg-black/80 border border-white/10 rounded-full text-white/80 hover:text-white shadow-lg transition-transform active:scale-90">
                <Compass size={20} />
             </button>
        </div>

        {/* Pins */}
        <div className="absolute inset-0 flex items-center justify-center">
            {locations.map((loc) => (
                <button
                   key={loc.id}
                   onClick={() => setSelectedPin(loc.id)}
                   className={`absolute transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                      selectedPin === loc.id ? 'z-20 scale-150' : 'z-10 scale-100 hover:scale-110'
                   }`}
                   style={{ 
                       top: `${loc.lat}%`, 
                       left: `${loc.lng}%`,
                       transform: `translate(-50%, -50%) ${selectedPin === loc.id ? 'scale(1.5)' : 'scale(1)'}`
                   }}
                >
                   <div className="relative group">
                       <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl ${loc.type === 'safety' ? 'bg-green-900/90 text-green-200' : 'bg-white text-black'}`}>
                           {loc.type === 'safety' ? <ShieldAlert size={20} /> : <MapPin size={20} />}
                       </div>
                       {/* Ripple for selected */}
                       {selectedPin === loc.id && (
                           <div className="absolute inset-0 rounded-full border-2 border-white/50 animate-ping"></div>
                       )}
                   </div>
                </button>
            ))}
            
            {/* User Location Pulse */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg relative z-10"></div>
                <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ping z-0 scale-150"></div>
            </div>
        </div>

        {/* Bottom Card for Selection */}
        {selectedPin && (
            <div className="absolute bottom-24 left-6 right-6 z-30 animate-slide-up">
                <div className="bg-[#111] border border-white/10 p-5 rounded-3xl shadow-2xl relative">
                    <button onClick={() => setSelectedPin(null)} className="absolute top-4 right-4 text-white/30 hover:text-white transition-all active:scale-90"><X size={16}/></button>
                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-[#BFC7CC]">
                            <MapPin size={24} />
                        </div>
                        <div>
                            <div className="text-xs text-green-400 uppercase tracking-wider font-bold mb-1">Safe Zone</div>
                            <h3 className="text-lg font-bold">Kyoto Station Hub</h3>
                            <p className="text-xs text-white/50">0.4 miles away • Open 24h</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <button className="py-3 rounded-xl bg-white text-black font-semibold text-xs flex flex-col items-center gap-1 active:scale-95 transition-transform">
                           <Navigation size={14} /> Navigate
                        </button>
                        <button className="py-3 rounded-xl bg-white/10 text-white font-medium text-xs flex flex-col items-center gap-1 active:scale-95 transition-transform">
                           <MapPin size={14} /> Save
                        </button>
                        <button className="py-3 rounded-xl bg-red-500/20 text-red-200 font-medium text-xs flex flex-col items-center gap-1 active:scale-95 transition-transform border border-red-500/20">
                           <ShieldAlert size={14} /> Report
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

const ProfileScreen = ({ onStartQuiz, quizResultId, subscription, onUpgrade }: { onStartQuiz: () => void, quizResultId: string | null, subscription?: SubscriptionTier, onUpgrade: () => void }) => {
    // Find result object
    const quizResult = useMemo(() => {
        if (!quizResultId) return null;
        return QUIZ_TYPES.find(t => t.id === quizResultId);
    }, [quizResultId]);

    const ResultIcon = quizResult?.icon || User;
    const isPremium = subscription && subscription !== 'FREE';

    return (
        <div className="min-h-screen bg-black p-6 pt-12 animate-fade-in pb-24 overflow-y-auto">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center">
                    <User size={32} className="text-[#BFC7CC]" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Traveler</h1>
                    <p className="text-white/40 text-sm">Member since 2024</p>
                </div>
            </div>

            {/* LUNO+ Status */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-sm uppercase tracking-widest text-white/40">LUNO+ Status</h2>
                </div>
                <div 
                    onClick={onUpgrade}
                    className={`rounded-2xl p-4 border flex items-center justify-between cursor-pointer active:scale-95 transition-transform ${isPremium ? 'bg-[#BFC7CC]/10 border-[#BFC7CC]' : 'bg-white/5 border-white/10'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isPremium ? 'bg-[#BFC7CC] text-black' : 'bg-white/10 text-white/40'}`}>
                           {isPremium ? <Crown size={18} /> : <Lock size={18} />}
                        </div>
                        <div>
                            <div className="font-bold">{isPremium ? `LUNO ${subscription}` : 'Free Plan'}</div>
                            <div className="text-xs text-white/50">{isPremium ? 'Premium Active' : 'Upgrade to unlock features'}</div>
                        </div>
                    </div>
                    {!isPremium && <ChevronRight className="text-white/30" />}
                </div>
            </div>

            {/* Travel Identity Card */}
            {quizResult ? (
                <div className="mb-8">
                   <div className="flex justify-between items-center mb-4">
                       <h2 className="text-sm uppercase tracking-widest text-white/40">Travel Identity</h2>
                       <button onClick={onStartQuiz} className="text-xs text-[#BFC7CC] hover:underline active:scale-95 transition-transform">Retake</button>
                   </div>
                   <div className="bg-gradient-to-br from-[#1A1A1A] to-black border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-20">
                             <ResultIcon size={100} className="text-white rotate-12" />
                        </div>
                        
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
                                <ResultIcon size={24} className="text-[#BFC7CC]" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{quizResult.title}</h3>
                            <div className="flex flex-wrap gap-2">
                                {quizResult.tags.map(tag => (
                                    <span key={tag} className="text-[10px] px-2 py-1 rounded-md bg-white/5 border border-white/5 text-white/70 uppercase tracking-wide">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                   </div>
                </div>
            ) : (
                <div className="mb-8 p-6 bg-white/5 border border-dashed border-white/10 rounded-2xl text-center">
                    <p className="text-white/50 text-sm mb-4">Unlock your travel persona to get better recommendations.</p>
                    <button onClick={onStartQuiz} className="px-6 py-2 bg-white text-black rounded-xl font-medium text-sm hover:bg-[#BFC7CC] transition-all active:scale-95">
                        Take Quiz
                    </button>
                </div>
            )}

            {/* Account Settings */}
            <h2 className="text-sm uppercase tracking-widest text-white/40 mb-3">Settings</h2>
            <div className="space-y-2">
                {['Notifications', 'Privacy', 'Offline Mode', 'Help & Support'].map((item) => (
                    <button key={item} className="w-full flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all active:scale-[0.99] group">
                        <span>{item}</span>
                        <ChevronRight size={16} className="text-white/20 group-hover:text-white transition-colors" />
                    </button>
                ))}
            </div>

            <button className="w-full mt-8 py-4 text-red-400 text-sm font-medium hover:bg-red-500/10 rounded-xl transition-all active:scale-95">
                Log Out
            </button>
        </div>
    );
};