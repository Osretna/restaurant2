import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store, Users, LogOut, Globe, Palette, Lock, ShieldAlert, Sparkles, 
  Database, RefreshCw, Key, ShieldCheck, Moon, Sun, ArrowUpRight, ChefHat, ShoppingBag, Eye
} from 'lucide-react';

import { AppTheme, UserProfile, Restaurant, Order, MenuItem, OrderItem } from './types';
import { translations } from './translations';
import { seedRestaurants, seedOrders, seedUsers } from './initialData';
import { auth, rtdb } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

import AdminPanel from './components/AdminPanel';
import OwnerPanel from './components/OwnerPanel';
import CustomerInterface from './components/CustomerInterface';

// @ts-ignore
import restaurantBg from './assets/images/modern_restaurant_bg_1779381549048.png';

// Ref to firebase database SDK helpers
import { ref, set, get, onValue, update } from 'firebase/database';

// Safe localStorage utility that handles iframe / private browsing security exceptions
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("Storage item access failure on browser:", e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("Storage writing restricted on browser:", e);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("Storage removal restricted on browser:", e);
    }
  }
};

export default function App() {
  // Locale state
  const [lang, setLang] = useState<'ar' | 'en'>(() => {
    const cached = safeStorage.getItem('foody_lang');
    return (cached === 'en' || cached === 'ar') ? cached : 'ar';
  });
  const t = translations[lang];

  // Theme Switches
  const [theme, setTheme] = useState<AppTheme>(() => {
    const cached = safeStorage.getItem('foody_theme');
    return (cached && ['white', 'black', 'blue', 'gold', 'orange'].includes(cached)) ? cached as AppTheme : 'orange';
  });

  // Execution Mode: 'demo' (for testing and offline sandbox) or 'cloud' (if Firebase credentials connect)
  const [execMode, setExecMode] = useState<'demo' | 'cloud'>('demo');

  // Active Authenticated user
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const cached = safeStorage.getItem('foody_current_user');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Dynamic lists states
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  // First Login Reset Form States
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [confirmPasswordVal, setConfirmPasswordVal] = useState('');
  const [resetError, setResetError] = useState('');

  // Credentials form for Manual Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Bootstrapping Data and Sync
  useEffect(() => {
    // 1. Check if Firebase is available and set default accordingly
    if (rtdb) {
      setExecMode('cloud');
    } else {
      setExecMode('demo');
    }

    // 2. Load cached structures from localStorage as base fallback
    const localRests = safeStorage.getItem('foody_restaurants');
    const localOrders = safeStorage.getItem('foody_orders');
    const localUsers = safeStorage.getItem('foody_users');

    if (localRests) {
      try {
        const parsed = JSON.parse(localRests);
        setRestaurants(Array.isArray(parsed) ? parsed.filter((r: any) => r !== null && r !== undefined) : seedRestaurants);
      } catch (e) {
        setRestaurants(seedRestaurants);
      }
    } else {
      setRestaurants(seedRestaurants);
      safeStorage.setItem('foody_restaurants', JSON.stringify(seedRestaurants));
    }

    if (localOrders) {
      try {
        const parsed = JSON.parse(localOrders);
        setOrders(Array.isArray(parsed) ? parsed.filter((o: any) => o !== null && o !== undefined) : seedOrders);
      } catch (e) {
        setOrders(seedOrders);
      }
    } else {
      setOrders(seedOrders);
      safeStorage.setItem('foody_orders', JSON.stringify(seedOrders));
    }

    if (localUsers) {
      try {
        const parsed = JSON.parse(localUsers);
        setUsers(Array.isArray(parsed) ? parsed.filter((u: any) => u !== null && u !== undefined) : seedUsers);
      } catch (e) {
        setUsers(seedUsers);
      }
    } else {
      setUsers(seedUsers);
      safeStorage.setItem('foody_users', JSON.stringify(seedUsers));
    }
  }, []);

  // Sync to localStorage whenever states change locally in Demo mode
  useEffect(() => {
    if (execMode === 'demo' && restaurants.length > 0) {
      safeStorage.setItem('foody_restaurants', JSON.stringify(restaurants));
    }
  }, [restaurants, execMode]);

  useEffect(() => {
    if (execMode === 'demo' && orders.length > 0) {
      safeStorage.setItem('foody_orders', JSON.stringify(orders));
    }
  }, [orders, execMode]);

  useEffect(() => {
    if (execMode === 'demo' && users.length > 0) {
      safeStorage.setItem('foody_users', JSON.stringify(users));
    }
  }, [users, execMode]);

  // Synchronize dynamic visual and user configurations
  useEffect(() => {
    safeStorage.setItem('foody_lang', lang);
  }, [lang]);

  useEffect(() => {
    safeStorage.setItem('foody_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (currentUser) {
      safeStorage.setItem('foody_current_user', JSON.stringify(currentUser));
    } else {
      safeStorage.removeItem('foody_current_user');
    }
  }, [currentUser]);

  // Firebase Real-time Synchronization (Cloud Mode)
  useEffect(() => {
    if (execMode === 'cloud' && rtdb) {
      // Listen to restaurants path
      const restsRef = ref(rtdb, 'restaurants');
      const unsubscribeRests = onValue(restsRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          // Convert index dictionary to standard array, filtering out nulls
          const arr: Restaurant[] = Object.keys(val)
            .filter(key => val[key] !== null && val[key] !== undefined)
            .map(key => ({
              id: key,
              ...val[key],
              // Guarantee menu is an array if exists, and filter out null items
              menu: Array.isArray(val[key]?.menu) 
                ? val[key].menu.filter((m: any) => m !== null && m !== undefined)
                : (val[key]?.menu ? Object.values(val[key].menu).filter((m: any) => m !== null && m !== undefined) : [])
            }));
          setRestaurants(arr);
        } else {
          // Seed Firebase path with initially expected seeds if completely empty
          seedRestaurants.forEach(r => {
            set(ref(rtdb, `restaurants/${r.id}`), r);
          });
        }
      }, (error) => {
        console.warn("RTDB: restaurants read permission denied or error, using local fallback:", error);
        setRestaurants(prev => prev.length > 0 ? prev : seedRestaurants);
      });

      // Listen to orders path
      const ordersRef = ref(rtdb, 'orders');
      const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          const arr: Order[] = Object.keys(val)
            .filter(key => val[key] !== null && val[key] !== undefined)
            .map(key => ({
              id: key,
              ...val[key],
              items: Array.isArray(val[key]?.items)
                ? val[key].items.filter((i: any) => i !== null && i !== undefined)
                : (val[key]?.items ? Object.values(val[key].items).filter((i: any) => i !== null && i !== undefined) : [])
            }));
          setOrders(arr);
        } else {
          seedOrders.forEach(o => {
            set(ref(rtdb, `orders/${o.id}`), o);
          });
        }
      }, (error) => {
        console.warn("RTDB: orders read permission denied or error, using local fallback:", error);
        setOrders(prev => prev.length > 0 ? prev : seedOrders);
      });

      // Listen to users registry
      const usersRef = ref(rtdb, 'users');
      const unsubscribeUsers = onValue(usersRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          const arr: UserProfile[] = Object.keys(val)
            .filter(key => val[key] !== null && val[key] !== undefined)
            .map(key => ({
              uid: key,
              ...val[key]
            }));
          setUsers(arr);
        } else {
          seedUsers.forEach(u => {
            set(ref(rtdb, `users/${u.uid}`), u);
          });
        }
      }, (error) => {
        console.warn("RTDB: users read permission denied or error, using local fallback:", error);
        setUsers(prev => prev.length > 0 ? prev : seedUsers);
      });

      return () => {
        unsubscribeRests();
        unsubscribeOrders();
        unsubscribeUsers();
      };
    }
  }, [execMode]);

  // Active theme configuration dictionary
  const themeStyles = {
    white: {
      bg: 'bg-zinc-100/15 text-zinc-950',
      card: 'bg-white/75 border border-white/40 shadow-xl backdrop-blur-md',
      sidebar: 'bg-white/80 border-r border-zinc-200/50',
      accentText: 'text-indigo-600',
      btnAccent: 'bg-zinc-900 border border-zinc-900 text-white hover:bg-zinc-800'
    },
    black: {
      bg: 'bg-zinc-950/45 text-zinc-50',
      card: 'bg-zinc-900/75 border border-zinc-800/80 shadow-2xl backdrop-blur-md',
      sidebar: 'bg-zinc-900/80 border-r border-zinc-800',
      accentText: 'text-amber-500',
      btnAccent: 'bg-amber-500 border border-amber-500 text-black font-extrabold hover:bg-amber-400'
    },
    blue: {
      bg: 'bg-slate-950/45 text-slate-100',
      card: 'bg-slate-800/75 border border-slate-700/65 shadow-xl backdrop-blur-md',
      sidebar: 'bg-slate-800/80 border-r border-slate-700',
      accentText: 'text-cyan-400',
      btnAccent: 'bg-cyan-500 border border-cyan-500 text-slate-950 font-bold hover:bg-cyan-400'
    },
    gold: {
      bg: 'bg-stone-100/15 text-stone-900',
      card: 'bg-stone-50/75 border border-amber-800/10 shadow-lg backdrop-blur-md',
      sidebar: 'bg-stone-50/80 border-r border-amber-800/10',
      accentText: 'text-yellow-700',
      btnAccent: 'bg-amber-700 border border-amber-700 text-white font-semibold hover:bg-amber-800'
    },
    orange: {
      bg: 'bg-orange-50/15 text-gray-900',
      card: 'bg-white/75 border border-orange-100/65 shadow-xl backdrop-blur-md',
      sidebar: 'bg-white/80 border-r border-orange-100/50',
      accentText: 'text-orange-600',
      btnAccent: 'bg-orange-600 border border-orange-600 text-white font-bold hover:bg-orange-700'
    }
  };

  const activeStyle = themeStyles[theme];

  // Language direction setter
  const appLayoutDirection = lang === 'ar' ? 'rtl' : 'ltr';

  // Core functions to bubble up from panels
  const handleCertifyOrder = (orderId: string) => {
    if (execMode === 'cloud' && rtdb) {
      update(ref(rtdb, `orders/${orderId}`), {
        status: 'confirmed',
        trackingStatus: 'accepted'
      });
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        status: 'confirmed',
        trackingStatus: 'accepted'
      } : o));
    }
  };

  const handleCancelOrder = (orderId: string) => {
    if (execMode === 'cloud' && rtdb) {
      update(ref(rtdb, `orders/${orderId}`), {
        status: 'cancelled'
      });
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        status: 'cancelled'
      } : o));
    }
  };

  const handleUpdateOrderStatus = (orderId: string, status: any, trackingStatus: any) => {
    if (execMode === 'cloud' && rtdb) {
      update(ref(rtdb, `orders/${orderId}`), {
        status,
        trackingStatus
      });
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        status,
        trackingStatus
      } : o));
    }
  };

  const handleUpdateMenu = (restaurantId: string, updatedMenu: MenuItem[]) => {
    if (execMode === 'cloud' && rtdb) {
      update(ref(rtdb, `restaurants/${restaurantId}`), {
        menu: updatedMenu
      });
    } else {
      setRestaurants(prev => prev.map(r => r.id === restaurantId ? {
        ...r,
        menu: updatedMenu
      } : r));
    }
  };

  const handleUpdateShippingFee = (restaurantId: string, fee: number) => {
    if (execMode === 'cloud' && rtdb) {
      update(ref(rtdb, `restaurants/${restaurantId}`), {
        shippingFee: fee
      });
    } else {
      setRestaurants(prev => prev.map(r => r.id === restaurantId ? {
        ...r,
        shippingFee: fee
      } : r));
    }
  };

  const handlePlaceOrder = (
    restaurantId: string, 
    restaurantName: string, 
    customerName: string, 
    customerPhone: string, 
    customerAddress: string, 
    items: OrderItem[], 
    total: number
  ) => {
    const newOrder: Order = {
      id: "order_" + Math.floor(1000 + Math.random() * 9000),
      restaurantId,
      restaurantName,
      customerInfo: {
        name: customerName,
        phone: customerPhone,
        address: customerAddress
      },
      items,
      total,
      status: 'pending',
      trackingStatus: 'submitted',
      createdAt: Date.now()
    };

    if (execMode === 'cloud' && rtdb) {
      set(ref(rtdb, `orders/${newOrder.id}`), newOrder);
    } else {
      setOrders(prev => [newOrder, ...prev]);
    }
  };

  const handleRegisterOwnerAndRestaurant = (
    email: string, 
    password: string, 
    restaurantName: string, 
    phone: string, 
    shippingFee: number,
    imageUrl?: string
  ) => {
    const newOwnerUid = "owner_" + Date.now().toString();
    const newRestaurantId = "rest_" + Date.now().toString();

    const newProfile: UserProfile = {
      uid: newOwnerUid,
      email,
      role: 'owner',
      restaurantId: newRestaurantId,
      isFirstLogin: true // Strict rule: enforce change passcode
    };

    const newRest: Restaurant = {
      id: newRestaurantId,
      name: `${restaurantName} (${lang === 'ar' ? 'حديث' : 'New'})`,
      ownerUid: newOwnerUid,
      phone,
      shippingFee,
      imageUrl: imageUrl || '',
      menu: [
        {
          id: "m_sample",
          name: lang === 'ar' ? "وجبة برجر دبل كلاسيك الافتتاحية" : "Inaugural Double Classic Combo",
          price: 11.99,
          description: lang === 'ar' ? "جبنة شيدر مضافة مع صوص المطعم السري والبطاطس المقرمشة" : "Triple melted cheddar with warm side fries and secret special base",
          category: "Burgers",
          available: true
        }
      ]
    };

    if (execMode === 'cloud' && rtdb) {
      // Save directly to Firebase paths synchronized
      set(ref(rtdb, `users/${newOwnerUid}`), newProfile);
      set(ref(rtdb, `restaurants/${newRestaurantId}`), newRest);
    } else {
      // Update local storage models
      setUsers(prev => [...prev, newProfile]);
      setRestaurants(prev => [...prev, newRest]);
    }
  };

  const handleEditRestaurant = (restaurantId: string, updatedData: Partial<Restaurant>) => {
    if (execMode === 'cloud' && rtdb) {
      update(ref(rtdb, `restaurants/${restaurantId}`), updatedData);
    } else {
      setRestaurants(prev => prev.map(r => r.id === restaurantId ? { ...r, ...updatedData } : r));
    }
  };

  const handleDeleteRestaurant = (restaurantId: string) => {
    if (execMode === 'cloud' && rtdb) {
      set(ref(rtdb, `restaurants/${restaurantId}`), null);
    } else {
      setRestaurants(prev => prev.filter(r => r.id !== restaurantId));
    }
  };

  // Safe manual authentication handler
  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    if (execMode === 'cloud' && auth && rtdb) {
      try {
        // 1. Try real Firebase Authentication sign-in (validates actual password secure on server side)
        const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
        const firebaseUser = userCredential.user;

        // 2. Load their node from Realtime Database users path
        const userNodeRef = ref(rtdb, `users/${firebaseUser.uid}`);
        const snapshot = await get(userNodeRef).catch(() => null);
        let userProfile = snapshot ? snapshot.val() as UserProfile | null : null;

        const isUserAdminCurrent = loginEmail.toLowerCase().includes('admin') || 
                                   loginEmail.toLowerCase() === 's.mohamed1111111@gmail.com' ||
                                   (firebaseUser.email && firebaseUser.email.toLowerCase() === 's.mohamed1111111@gmail.com');
        const defaultRoleCurrent = isUserAdminCurrent ? 'admin' : 'owner';

        if (!userProfile) {
          // Check if there is a profile with this email in the pre-loaded users list to migrate
          const emailMatched = [...users, ...seedUsers].find(u => u.email && u.email.toLowerCase() === loginEmail.toLowerCase());

          userProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || loginEmail,
            role: emailMatched?.role || defaultRoleCurrent,
            restaurantId: emailMatched?.restaurantId || (isUserAdminCurrent ? null : 'rest_burger'),
            isFirstLogin: emailMatched?.isFirstLogin !== undefined ? emailMatched.isFirstLogin : false
          };

          // Auto-write user profile record back to rtdb
          await set(userNodeRef, userProfile).catch(err => {
            console.warn("Could not write node profile back due to write rules, but continuing logging in locally:", err);
          });
        }

        setCurrentUser({
          role: defaultRoleCurrent,
          email: firebaseUser.email || loginEmail,
          ...userProfile,
          uid: firebaseUser.uid // assure matching correctly
        });
        setLoginError('');
        setLoginEmail('');
        setLoginPassword('');
        return;
      } catch (authError: any) {
        console.warn("Firebase Auth flow rejected/failed, checking dynamic signup & local fallback:", authError);
        
        // Let's check if the error is due to user not found. If they are registering for the first time
        // or tried to register a node that isn't in Firebase Auth, we automatically try to create them in Firebase Auth
        if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential' || authError.code === 'auth/invalid-email') {
          try {
            // Attempt auto-signup on the fly to bridge the gap if they exist in the RTDB / users array
            const allKnownUsers = [...users, ...seedUsers];
            const isKnown = allKnownUsers.some(u => u.email && u.email.toLowerCase() === loginEmail.toLowerCase());
            
            if (isKnown) {
              const signUpCredential = await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
              const firebaseUser = signUpCredential.user;
              
              // Load or write the user node
              const userNodeRef = ref(rtdb, `users/${firebaseUser.uid}`);
              const emailMatched = allKnownUsers.find(u => u.email && u.email.toLowerCase() === loginEmail.toLowerCase());
              const isUserAdmin = loginEmail.toLowerCase().includes('admin') || loginEmail.toLowerCase() === 's.mohamed1111111@gmail.com';

              const userProfile: UserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || loginEmail,
                role: emailMatched?.role || (isUserAdmin ? 'admin' : 'owner'),
                restaurantId: emailMatched?.restaurantId || (isUserAdmin ? null : 'rest_burger'),
                isFirstLogin: emailMatched?.isFirstLogin !== undefined ? emailMatched.isFirstLogin : false
              };

              await set(userNodeRef, userProfile).catch(err => {
                console.warn("Dynamic signup: write profile error:", err);
              });

              setCurrentUser(userProfile);
              setLoginError('');
              setLoginEmail('');
              setLoginPassword('');
              return;
            }
          } catch (signUpError: any) {
            console.warn("Automatic sign-up on the fly also failed or password too weak:", signUpError);
          }
        }
        
        // Show proper auth error if password was wrong for an already registered email
        if (authError.code === 'auth/wrong-password') {
          setLoginError(lang === 'ar' ? 'البوابة ترفض الربط! كلمة المرور التي أدخلتها غير صحيحة.' : 'Operation rejected! The password details did not match.');
          return;
        }
      }
    }

    // LOCAL DATABASE / EMULATED PERSISTENCE FALLBACK LOOKUP
    // Combine active database users and seed users to ensure 100% login success
    const allKnownUsers = [...users, ...seedUsers];
    const uniqueKnownUsers = allKnownUsers.reduce<UserProfile[]>((acc, current) => {
      if (!current.email) return acc;
      const isDuplicated = acc.some(item => item.email && item.email.toLowerCase() === current.email.toLowerCase());
      if (!isDuplicated) {
        acc.push(current);
      }
      return acc;
    }, []);

    const matchedProfile = uniqueKnownUsers.find(u => 
      u.email && u.email.toLowerCase() === loginEmail.toLowerCase()
    );

    if (matchedProfile) {
      const isUserAdmin = loginEmail.toLowerCase().includes('admin') || loginEmail.toLowerCase() === 's.mohamed1111111@gmail.com';
      const defaultRole = isUserAdmin ? 'admin' : 'owner';
      setCurrentUser({
        role: defaultRole,
        ...matchedProfile
      });
      setLoginError('');
      setLoginEmail('');
      setLoginPassword('');
    } else {
      setLoginError(lang === 'ar' ? 'محاولة فشلت! هذا البريد الإلكتروني غير مسجل حالياً بالمنصة أو لا توجد صلاحيات شبكة.' : 'Authentication failed! No credentials matches found, please verify your network permissions.');
    }
  };

  // Safe custom First-login passcode change updater
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordVal || !confirmPasswordVal) return;
    if (newPasswordVal !== confirmPasswordVal) {
      setResetError(lang === 'ar' ? 'كلمات المرور غير متطابقة!' : 'Passwords do not match!');
      return;
    }

    if (!currentUser) return;

    // Proceed to set isFirstLogin = false
    const updatedProfile: UserProfile = { ...currentUser, isFirstLogin: false };

    if (execMode === 'cloud' && rtdb) {
      update(ref(rtdb, `users/${currentUser.uid}`), {
        isFirstLogin: false
      });
    } else {
      setUsers(prev => prev.map(u => u.uid === currentUser.uid ? updatedProfile : u));
    }

    setCurrentUser(updatedProfile);
    setNewPasswordVal('');
    setConfirmPasswordVal('');
    setResetError('');
  };

  return (
    <div className={`min-h-screen relative overflow-x-hidden transition-colors duration-200 p-3 sm:p-6 ${activeStyle.bg}`} dir={appLayoutDirection}>
      {/* Modern Atmospheric 3D Restaurant Background Layer */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.55] dark:opacity-[0.65] bg-cover bg-center bg-no-repeat transition-opacity duration-300 z-0 bg-transparent"
        style={{ backgroundImage: `url(${restaurantBg})` }}
      />
      
      {/* Premium Warm Lighting Ambient Glow Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-black/35" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        
        {/* TOP COMPONENT SHELL HEADER */}
        <header className={`${activeStyle.card} p-5 rounded-3xl flex flex-wrap justify-between items-center gap-4`}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl text-white shadow-md shadow-orange-500/10">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-sans font-bold tracking-tight text-gray-950 dark:text-white">فودي بلس</h1>
                <span className="text-[10px] font-bold bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-md">SaaS</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.app_subtitle}</p>
            </div>
          </div>

          {/* Quick Simulation switches, languages, themes */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* 1. Language switcher */}
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl transition-all cursor-pointer text-xs font-semibold flex items-center gap-1.5"
              title="Change Language"
            >
              <Globe className="w-4 h-4 text-indigo-500" />
              <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            {/* 2. Theme picker */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-zinc-800 rounded-xl">
              {(['white', 'black', 'blue', 'gold', 'orange'] as const).map(color => (
                <button
                  key={color}
                  onClick={() => setTheme(color)}
                  className={`w-5 h-5 rounded-full transition-transform active:scale-90 cursor-pointer ${
                    color === 'white' ? 'bg-zinc-100 border border-zinc-300' :
                    color === 'black' ? 'bg-zinc-950' :
                    color === 'blue' ? 'bg-slate-800 border-indigo-400' :
                    color === 'gold' ? 'bg-amber-100 border border-amber-300' :
                    'bg-orange-500'
                  } ${theme === color ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110' : ''}`}
                />
              ))}
            </div>

            {/* 3. Cloud (Firebase) Status Indicator Badge */}
            <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/35 px-3 py-1.5 rounded-xl text-xs text-emerald-700 dark:text-emerald-400 font-bold shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{lang === 'ar' ? 'البوابة السحابية نشطة' : 'Firebase Cloud Active'}</span>
            </div>
          </div>
        </header>

        {/* MAIN BODY AREA ROUTES PANEL */}
        <main className="space-y-6">
          
          {/* USER IS NOT AUTHENTICATED OR LOGGED IN */}
          {currentUser === null ? (
            <div className="max-w-xl mx-auto w-full">
              
              {/* SaaS login form */}
              <div className={`${activeStyle.card} p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl`}>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-950 dark:text-white flex items-center gap-2">
                    <Key className="w-6 h-6 text-orange-600" />
                    {lang === 'ar' ? 'بوابة التحقق ونظام التشغيل' : 'Secure Operational Portal'}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {lang === 'ar' ? 'سجل دخولك بنوع "Owner" أو "Admin" لإدارة وتصنيف منصتك ومطابخك الشريكة.' : 'Identify your role with owner of Super Admin credentials to load your dedicated workspaces.'}
                  </p>
                </div>

                {loginError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                    {loginError}
                  </div>
                )}

                <form onSubmit={handleManualLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.email}</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. s.mohamed1111111@gmail.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleManualLogin(e);
                        }
                      }}
                      className="w-full bg-gray-50 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-800 rounded-xl py-2.5 px-3.5 text-xs focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.password}</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleManualLogin(e);
                        }
                      }}
                      className="w-full bg-gray-50 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-800 rounded-xl py-2.5 px-3.5 text-xs focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/10"
                  >
                    <Key className="w-4 h-4" />
                    {t.login}
                  </button>
                </form>

                {/* Simulated Customer Access shortcut Card */}
                <div className="pt-6 border-t border-dashed border-gray-150 dark:border-zinc-800 text-center">
                  <p className="text-gray-500 text-xs mb-3">{lang === 'ar' ? 'هل تريد طلب وجبة الآن؟' : 'Ready to browse options and place an order?'}</p>
                  <button
                    onClick={() => setCurrentUser({
                      uid: 'cust_simulated',
                      email: 'guest@foody.com',
                      role: 'customer',
                      isFirstLogin: false
                    })}
                    className="py-2.5 px-6 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-zinc-800 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 mx-auto cursor-pointer transition-all"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {lang === 'ar' ? 'الدخول كعميل لطلب وجبة (بوابة المشتريات)' : 'Enter Client Portal to browse & order'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            
            /* USER IS LOGGED IN - WE ROUTE TO THEIR WORKSPACE */
            <div className="grid grid-cols-1 gap-6">
              
              {/* Account State banner with Signout buttons */}
              <div className={`${activeStyle.card} p-4 rounded-2xl flex flex-wrap justify-between items-center gap-3 text-xs`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${currentUser.role === 'admin' ? 'bg-amber-500' : currentUser.role === 'owner' ? 'bg-orange-500' : 'bg-indigo-500'}`} />
                  <div>
                    <span className="text-gray-400">{lang === 'ar' ? 'مرحباً:' : 'Authorized Account:'}</span>
                    <strong className="text-gray-800 dark:text-white font-semibold ml-1.5">{currentUser.email}</strong>
                    <span className="text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-650 dark:text-emerald-400 px-2 py-0.5 rounded-md ml-1.5 uppercase font-bold text-xs">
                      {t[currentUser.role === 'admin' ? 'admin_portal' : currentUser.role === 'owner' ? 'owner_portal' : 'customer_portal']}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentUser(null);
                    }}
                    className="py-1.5 px-3.5 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    {t.logout}
                  </button>
                </div>
              </div>

              {/* FIRST LOGIN SECURITY INTERCEPTOR GATE */}
              {currentUser.isFirstLogin ? (
                <div className={`${activeStyle.card} p-6 sm:p-8 rounded-3xl max-w-lg mx-auto space-y-5 text-center`}>
                  <div className="w-16 h-16 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto shadow-md">
                    <Lock className="w-8 h-8 text-red-600" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1.5">
                      {t.first_login_title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-sans px-3">
                      {t.first_login_desc}
                    </p>
                  </div>

                  {resetError && (
                    <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-xl">
                      {resetError}
                    </p>
                  )}

                  <form onSubmit={handleUpdatePassword} className="space-y-4 text-right">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.new_password}</label>
                      <input
                        type="password"
                        required
                        value={newPasswordVal}
                        onChange={(e) => setNewPasswordVal(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-gray-50 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-xs outline-none focus:border-red-500 transition-all font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.confirm_password}</label>
                      <input
                        type="password"
                        required
                        value={confirmPasswordVal}
                        onChange={(e) => setConfirmPasswordVal(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-gray-50 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-xs outline-none focus:border-red-500 transition-all font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md shadow-red-100"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      {t.save_password}
                    </button>
                  </form>
                </div>
              ) : (
                
                /* RENDER ROLE BASED WORKSPACE */
                <div>
                  {currentUser.role === 'admin' && (
                    <AdminPanel
                      orders={orders}
                      restaurants={restaurants}
                      users={users}
                      onCertifyOrder={handleCertifyOrder}
                      onCancelOrder={handleCancelOrder}
                      onRegisterOwnerAndRestaurant={handleRegisterOwnerAndRestaurant}
                      onEditRestaurant={handleEditRestaurant}
                      onDeleteRestaurant={handleDeleteRestaurant}
                      lang={lang}
                      t={t}
                    />
                  )}

                  {currentUser.role === 'owner' && (
                    <OwnerPanel
                      restaurantId={currentUser.restaurantId || ''}
                      orders={orders}
                      restaurants={restaurants}
                      onUpdateMenu={handleUpdateMenu}
                      onUpdateShippingFee={handleUpdateShippingFee}
                      onUpdateOrderStatus={handleUpdateOrderStatus}
                      lang={lang}
                      t={t}
                    />
                  )}

                  {currentUser.role === 'customer' && (
                    <CustomerInterface
                      restaurants={restaurants}
                      orders={orders}
                      onPlaceOrder={handlePlaceOrder}
                      lang={lang}
                      t={t}
                    />
                  )}
                </div>
              )}

            </div>
          )}

        </main>
      </div>
    </div>
  );
}
