import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Store, ClipboardList, TrendingUp, HandCoins, Check, X, Plus, 
  RefreshCw, Layers, ShieldCheck, Mail, Phone, MapPin, Search, Pencil, Trash2
} from 'lucide-react';
import { Order, Restaurant, UserProfile } from '../types';

interface AdminPanelProps {
  orders: Order[];
  restaurants: Restaurant[];
  users: UserProfile[];
  onCertifyOrder: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
  onRegisterOwnerAndRestaurant: (
    email: string, 
    password: string, 
    restaurantName: string, 
    phone: string, 
    shippingFee: number,
    imageUrl?: string
  ) => void;
  onEditRestaurant: (restaurantId: string, updatedData: Partial<Restaurant>) => void;
  onDeleteRestaurant: (restaurantId: string) => void;
  lang: 'ar' | 'en';
  t: any;
}

export default function AdminPanel({
  orders,
  restaurants,
  users,
  onCertifyOrder,
  onCancelOrder,
  onRegisterOwnerAndRestaurant,
  onEditRestaurant,
  onDeleteRestaurant,
  lang,
  t
}: AdminPanelProps) {
  // Creation States
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRestName, setNewRestName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newShipping, setNewShipping] = useState(5);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Editing States for Restaurant Management
  const [editingRestId, setEditingRestId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editShipping, setEditShipping] = useState<number>(0);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [deletingRestId, setDeletingRestId] = useState<string | null>(null);

  // New interactive details modal state
  const [activeStatModal, setActiveStatModal] = useState<'sales' | 'commission' | 'orders' | 'kitchens' | 'monthlySalesStatement' | null>(null);
  const [selectedRestInvoice, setSelectedRestInvoice] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [copiedInvoiceText, setCopiedInvoiceText] = useState<boolean>(false);

  // Smooth scroll with element highlight helper
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-4', 'ring-indigo-600/30', 'dark:ring-indigo-500/40');
        setTimeout(() => {
          element.classList.remove('ring-4', 'ring-indigo-600/30', 'dark:ring-indigo-500/40');
        }, 2000);
      }, 150);
    }
  };

  // Currency Formatter Helper
  const formatPrice = (price: number) => {
    return lang === 'ar' 
      ? `${price.toFixed(2)} ج.م` 
      : `${price.toFixed(2)} EGP`;
  };

  // Auto-generate safe password
  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let generated = "";
    for (let i = 0; i < 10; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(generated);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || !newRestName || !newPhone) {
      alert(lang === 'ar' ? 'الرجاء ملء جميع الحقول المطلوبة!' : 'Please fill all fields!');
      return;
    }
    onRegisterOwnerAndRestaurant(newEmail, newPassword, newRestName, newPhone, newShipping, newImageUrl);
    
    // Reset and alert
    setNewEmail('');
    setNewPassword('');
    setNewRestName('');
    setNewPhone('');
    setNewShipping(5);
    setNewImageUrl('');
    setNotification(lang === 'ar' ? 'تم إنشاء حساب المالك والمطعم بنجاح!' : 'Owner and restaurant created successfully!');
    setTimeout(() => setNotification(null), 4000);
  };

  // Financial calculations
  const totalSalesVolume = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.total, 0);

  const platformCommission = totalSalesVolume * 0.15; // 15% platform fee
  
  const totalUnifiedOrders = orders.length;
  const activeKitchensCount = restaurants.length;

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const certifiedOrders = orders.filter(o => o.status !== 'pending');

  const filteredRestaurants = restaurants.filter(r => {
    if (!r) return false;
    const nameStr = r.name || '';
    const phoneStr = r.phone || '';
    const searchVal = searchTerm || '';
    return nameStr.toLowerCase().includes(searchVal.toLowerCase()) ||
           phoneStr.includes(searchVal);
  });

  return (
    <div className="space-y-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* SaaS Consolidated Metrics Grid */}
      <div>
        <h2 className="text-xl md:text-2xl font-sans font-semibold text-gray-800 mb-5 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-indigo-600" />
          {t.recent_financials}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          {/* Card 1: Gross Volume */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            onClick={() => setActiveStatModal('sales')}
            className="relative bg-white dark:bg-zinc-900/90 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800/80 flex items-center justify-between cursor-pointer hover:shadow-xl hover:border-indigo-400 dark:hover:border-indigo-500/60 active:scale-[0.98] transition-all duration-200 group"
          >
            <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3">
              {lang === 'ar' ? 'عرض التحليلات ✦' : 'View Analytics ✦'}
            </span>
            <div className="pt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t.total_sales}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-zinc-50 mt-1">{formatPrice(totalSalesVolume)}</h3>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                <span>↑ 12.5%</span> {lang === 'ar' ? 'هذا الأسبوع' : 'this week'}
              </p>
            </div>
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/35 text-indigo-600 dark:text-indigo-400 rounded-xl transition-transform group-hover:scale-110">
              <HandCoins className="w-6 h-6" />
            </div>
          </motion.div>

          {/* Card 2: Platform Revenue */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ delay: 0.1 }}
            onClick={() => setActiveStatModal('commission')}
            className="relative bg-white dark:bg-zinc-900/90 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800/80 flex items-center justify-between cursor-pointer hover:shadow-xl hover:border-emerald-400 dark:hover:border-emerald-500/60 active:scale-[0.98] transition-all duration-200 group"
          >
            <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3">
              {lang === 'ar' ? 'الأرباح والنسب ✦' : 'Profits & Rates ✦'}
            </span>
            <div className="pt-2">
              <p className="text-sm text-gray-400 dark:text-gray-300 font-medium">{t.commission_rate}</p>
              <h3 className="text-2xl font-bold text-indigo-600 dark:text-amber-500 mt-1">{formatPrice(platformCommission)}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {lang === 'ar' ? 'معدل ثابت: 15%' : 'Fixed Rate: 15%'}
              </p>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/35 text-emerald-600 dark:text-emerald-400 rounded-xl transition-transform group-hover:scale-110">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </motion.div>

          {/* Card 3: Unified Orders */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ delay: 0.2 }}
            onClick={() => setActiveStatModal('orders')}
            className="relative bg-white dark:bg-zinc-900/90 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800/80 flex items-center justify-between cursor-pointer hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500/60 active:scale-[0.98] transition-all duration-200 group"
          >
            <span className="text-[9px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3">
              {lang === 'ar' ? 'حالة الطلبات ✦' : 'Order Status ✦'}
            </span>
            <div className="pt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t.total_orders_platform}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-zinc-50 mt-1">{totalUnifiedOrders}</h3>
              <p className="text-xs text-indigo-500 dark:text-cyan-400 mt-2">
                {pendingOrders.length} {lang === 'ar' ? 'في انتظار التعميد' : 'pending validation'}
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/35 text-blue-600 dark:text-cyan-400 rounded-xl transition-transform group-hover:scale-110">
              <ClipboardList className="w-6 h-6" />
            </div>
          </motion.div>

          {/* Card 4: Active Kitchens */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ delay: 0.3 }}
            onClick={() => setActiveStatModal('kitchens')}
            className="relative bg-white dark:bg-zinc-900/90 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800/80 flex items-center justify-between cursor-pointer hover:shadow-xl hover:border-orange-400 dark:hover:border-orange-500/60 active:scale-[0.98] transition-all duration-200 group"
          >
            <span className="text-[9px] bg-orange-50 dark:bg-orange-950/40 text-orange-650 dark:text-orange-400 px-2 py-0.5 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3">
              {lang === 'ar' ? 'المطاعم والشركاء ✦' : 'Hubs & Partners ✦'}
            </span>
            <div className="pt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t.active_partners}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-zinc-50 mt-1">{activeKitchensCount}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {users.filter(u => u.role === 'owner').length} {lang === 'ar' ? 'ملاك مطاعم نشطين' : 'registered managers'}
              </p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-950/35 text-orange-500 dark:text-orange-400 rounded-xl transition-transform group-hover:scale-110">
              <Store className="w-6 h-6" />
            </div>
          </motion.div>

          {/* Card 5: Restaurant 5% Commission / Billing */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ delay: 0.4 }}
            onClick={() => {
              setActiveStatModal('monthlySalesStatement');
              if (restaurants.length > 0) {
                setSelectedRestInvoice(restaurants[0].id);
              } else {
                setSelectedRestInvoice('all');
              }
            }}
            className="relative bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-955/20 dark:to-orange-955/20 p-6 rounded-2xl shadow-sm border border-orange-200/60 dark:border-zinc-800/80 flex items-center justify-between cursor-pointer hover:shadow-xl hover:border-orange-500 active:scale-[0.98] transition-all duration-200 group"
          >
            <span className="text-[9px] bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 px-2.5 py-0.5 rounded-full font-bold opacity-100 absolute top-3 right-3 animate-pulse">
              {lang === 'ar' ? 'أرباح الـ 5% ✦' : '5% Revenue ✦'}
            </span>
            <div className="pt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{lang === 'ar' ? 'صافي أرباحك الـ 5%' : 'Your 5% Profit'}</p>
              <h3 className="text-2xl font-black text-orange-600 dark:text-orange-450 mt-1">{formatPrice(totalSalesVolume * 0.05)}</h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2">
                {lang === 'ar' ? 'تفصيل مبيعات كل مطبخ شريك' : 'Click to view individual invoices'}
              </p>
            </div>
            <div className="p-4 bg-orange-100 dark:bg-orange-950/45 text-orange-600 dark:text-orange-400 rounded-xl transition-transform group-hover:scale-110">
              <HandCoins className="w-6 h-6" />
            </div>
          </motion.div>
        </div>
      </div>

      {notification && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center gap-2"
        >
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium">{notification}</span>
        </motion.div>
      )}

      {/* Main SaaS Administration Splitting Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Certification / Approval Feed (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          <div id="certification-section" className="bg-white dark:bg-zinc-900/90 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800/80 transition-all duration-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b border-gray-100">
              <ClipboardList className="w-5 h-5 text-amber-500" />
              {t.admin_orders_approval}
              <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold">
                {pendingOrders.length}
              </span>
            </h3>

            <AnimatePresence mode="popLayout">
              {pendingOrders.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-12 text-center text-gray-400"
                >
                  <ShieldCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm">{lang === 'ar' ? 'لا توجد طلبات معلقة بانتظار التعميد حالياً.' : 'No pending orders in certification queue.'}</p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {pendingOrders.map(order => (
                    <motion.div
                      key={order.id}
                      layoutId={`order-card-${order.id}`}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="border border-amber-100 bg-amber-50/20 p-5 rounded-xl space-y-4 hover:border-amber-200 transition-colors"
                    >
                      {/* Order and Customer Header */}
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <div>
                          <span className="text-xs font-mono bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-md">
                            #{order.id}
                          </span>
                          <h4 className="font-semibold text-gray-800 mt-2 text-sm">{order.restaurantName}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{formatPrice(order.total)}</p>
                          <span className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      {/* Customer Info Box */}
                      <div className="bg-white/80 rounded-lg p-3 text-xs space-y-1 text-gray-600 border border-amber-50">
                        <p className="font-medium text-gray-800 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {order.customerInfo?.name || (lang === 'ar' ? 'عميل زائر' : 'Guest Customer')}
                        </p>
                        <p className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> {order.customerInfo?.phone || '—'}
                        </p>
                        <p className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 animate-bounce text-red-400" /> {order.customerInfo?.address || '—'}
                        </p>
                      </div>

                      {/* Items loop */}
                      <div className="text-xs space-y-1.5 pt-1 border-t border-dashed border-gray-100">
                        {(order.items || []).map(item => (
                          <div key={item?.id || Math.random().toString()} className="flex justify-between text-gray-700">
                            <span>{item?.name || ''} <strong className="text-gray-900">x{item?.quantity || 1}</strong></span>
                            <span>{formatPrice((item?.price || 0) * (item?.quantity || 0))}</span>
                          </div>
                        ))}
                      </div>

                      {/* Fast Certify / Reject Controls */}
                      <div className="flex gap-2.5 pt-2">
                        <button
                          onClick={() => onCertifyOrder(order.id)}
                          className="flex-1 cursor-pointer py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {t.certify_order}
                        </button>
                        <button
                          onClick={() => onCancelOrder(order.id)}
                          className="cursor-pointer py-2 px-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                          {t.cancel_order}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Certified Platform Order History log */}
          <div id="certified-orders-section" className="bg-white dark:bg-zinc-900/90 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800/80 transition-all duration-500">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              {lang === 'ar' ? 'سجل تتبع ومتابعة الطلبات المعتمدة بالمنصة' : 'Certified SaaS Order Dispatch Logs'}
            </h3>
            
            <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1">
              {certifiedOrders.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">
                  {lang === 'ar' ? 'لا توجد طلبات معتمدة بعد.' : 'No certified orders dispatch log.'}
                </p>
              ) : (
                certifiedOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors text-xs text-gray-600"
                  >
                    <div>
                      <span className="font-mono font-bold text-gray-700 block">#{order.id}</span>
                      <span className="font-medium text-gray-800">{order.restaurantName}</span>
                    </div>
                    <div className="text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold block ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                        order.status === 'cooking' ? 'bg-indigo-100 text-indigo-800' :
                        order.status === 'delivering' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {t[order.status === 'confirmed' ? 'status_certified' : `status_${order.status}`] || order.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{formatPrice(order.total)}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* User Account Registry and Restaurant Creations (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 pb-3 border-b border-gray-100">
              <Plus className="w-5 h-5 text-indigo-600" />
              {t.admin_new_user_form}
            </h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">{t.owner_email} *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="partner@restaurant.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 pl-10 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">{t.password} *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Create passcode"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-mono focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-[10px] sm:text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {t.gen_random_password}
                  </button>
                </div>
                <p className="text-[10px] text-orange-500 mt-1">
                  💡 {lang === 'ar' ? 'سيتعين على المالك تغيير هذا الرمز إجبارياً في أول تسجيل دخول له.' : 'First-login passcode reset rule will enforce change for owner safety.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">{t.restaurant_name} *</label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Damascus Delight"
                    value={newRestName}
                    onChange={(e) => setNewRestName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 pl-10 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
              </div>

               <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">{t.restaurant_phone} *</label>
                  <input
                    type="text"
                    required
                    placeholder="+966 500000000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">{t.restaurant_shipping} *</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newShipping}
                    onChange={(e) => setNewShipping(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">{lang === 'ar' ? 'رابط صورة المطعم (اختياري/لينك)' : 'Restaurant Image Link (Optional URL)'}</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full cursor-pointer py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-indigo-100"
              >
                <Plus className="w-4 h-4" />
                {t.admin_add_user_btn}
              </button>
            </form>
          </div>

          {/* Active Partner Outlets Grid list with instant filter */}
          <div id="partners-section" className="bg-white dark:bg-zinc-900/90 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800/80 transition-all duration-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-indigo-600" />
                {lang === 'ar' ? 'المطاعم الشريكة النشطة' : 'Active Kitchen Partners'}
              </h3>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 font-bold">
                {restaurants.length}
              </span>
            </div>

            <div className="relative mb-3.5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={lang === 'ar' ? 'البحث عن مطعم أو هاتف...' : 'Search hub or line...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-indigo-50 focus:border-indigo-600 transition-all"
              />
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {filteredRestaurants.map(rest => {
                if (!rest) return null;
                const isEditing = editingRestId === rest.id;

                if (isEditing) {
                  return (
                    <motion.div 
                      key={rest.id} 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3.5 border border-indigo-200 bg-indigo-50/10 rounded-2xl space-y-3"
                    >
                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">{lang === 'ar' ? 'اسم المطعم:' : 'Restaurant Name:'}</label>
                          <input 
                            type="text" 
                            required
                            value={editName} 
                            onChange={e => setEditName(e.target.value)} 
                            className="w-full p-2 rounded-xl border border-gray-200 bg-white focus:border-indigo-600 outline-none text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">{lang === 'ar' ? 'رقم الهاتف:' : 'Phone Line:'}</label>
                          <input 
                            type="text" 
                            required
                            value={editPhone} 
                            onChange={e => setEditPhone(e.target.value)} 
                            className="w-full p-2 rounded-xl border border-gray-200 bg-white focus:border-indigo-600 outline-none text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">{lang === 'ar' ? 'رسوم التوصيل الشحن (ج.م):' : 'Shipping Fee (EGP):'}</label>
                          <input 
                            type="number" 
                            required
                            value={editShipping} 
                            onChange={e => setEditShipping(Number(e.target.value) || 0)} 
                            className="w-full p-2 rounded-xl border border-gray-200 bg-white focus:border-indigo-600 outline-none text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">{lang === 'ar' ? 'رابط صورة المطعم:' : 'Restaurant Image URL:'}</label>
                          <input 
                            type="url" 
                            value={editImageUrl} 
                            onChange={e => setEditImageUrl(e.target.value)} 
                            placeholder="https://images.unsplash.com/..."
                            className="w-full p-2 rounded-xl border border-gray-200 bg-white focus:border-indigo-600 outline-none text-xs"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2 justify-end pt-1">
                        <button 
                          onClick={() => {
                            if (!editName || !editPhone) {
                              alert(lang === 'ar' ? 'الرجاء ملء الاسم والهاتف!' : 'Please fill all fields!');
                              return;
                            }
                            onEditRestaurant(rest.id, {
                              name: editName,
                              phone: editPhone,
                              shippingFee: editShipping,
                              imageUrl: editImageUrl
                            });
                            setEditingRestId(null);
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white p-1.5 px-3 rounded-lg text-[11px] font-bold cursor-pointer transition-all active:scale-95"
                        >
                          {lang === 'ar' ? 'حفظ التعديل' : 'Save Details'}
                        </button>
                        <button 
                          onClick={() => setEditingRestId(null)}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-1.5 px-3 rounded-lg text-[11px] font-bold cursor-pointer transition-all"
                        >
                          {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                      </div>
                    </motion.div>
                  );
                }

                if (deletingRestId === rest.id) {
                  return (
                    <motion.div 
                      key={rest.id} 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3.5 border border-red-250 bg-red-500/5 dark:bg-red-500/10 rounded-2xl space-y-3"
                    >
                      <p className="text-xs text-red-700 dark:text-red-400 font-bold leading-relaxed">
                        {lang === 'ar' 
                          ? `هل أنت متأكد من حذف مطعم "${rest.name}" نهائياً من المنصة؟` 
                          : `Are you sure you want to delete "${rest.name}" permanently?`}
                      </p>
                      
                      <div className="flex gap-2 justify-end pt-1">
                        <button 
                          onClick={() => {
                            onDeleteRestaurant(rest.id);
                            setDeletingRestId(null);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white p-1.5 px-3 rounded-lg text-[11.5px] font-bold cursor-pointer transition-all active:scale-95"
                        >
                          {lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
                        </button>
                        <button 
                          onClick={() => setDeletingRestId(null)}
                          className="bg-gray-200 dark:bg-zinc-850 hover:bg-gray-350 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300 p-1.5 px-3 rounded-lg text-[11.5px] font-bold cursor-pointer transition-all"
                        >
                          {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <div key={rest.id} className="p-3.5 border border-gray-100 bg-gray-50/30 hover:bg-gray-50 rounded-2xl space-y-1.5 transition-colors">
                    <div className="flex justify-between items-center gap-1">
                      <h4 className="font-semibold text-gray-800 text-xs">{rest.name || ''}</h4>
                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
                        {formatPrice(rest.shippingFee ?? 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5" /> {rest.phone || ''}
                      </span>
                      <span className="text-gray-400">
                        {rest.menu?.length || 0} {lang === 'ar' ? 'وجبة بالمنيو' : 'menu items'}
                      </span>
                    </div>
                    
                    <div className="flex justify-end gap-1.5 pt-1.5 mt-1 border-t border-gray-100/50">
                      <button
                        onClick={() => {
                          setEditingRestId(rest.id);
                          setEditName(rest.name || '');
                          setEditPhone(rest.phone || '');
                          setEditShipping(rest.shippingFee ?? 0);
                          setEditImageUrl(rest.imageUrl || '');
                        }}
                        className="py-1 px-2 hover:bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title={lang === 'ar' ? 'تعديل بيانات المطعم' : 'Edit details'}
                      >
                        <Pencil className="w-3 h-3" />
                        {lang === 'ar' ? 'تعديل' : 'Edit'}
                      </button>
                      <button
                        onClick={() => {
                          setDeletingRestId(rest.id);
                        }}
                        className="py-1 px-2 hover:bg-red-50 text-red-650 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title={lang === 'ar' ? 'حذف المطعم نهائياً' : 'Delete restaurant'}
                      >
                        <Trash2 className="w-3 h-3" />
                        {lang === 'ar' ? 'حذف' : 'Delete'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Interactive Stats Details Drawer / Pop-up Modals */}
      <AnimatePresence>
        {activeStatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveStatModal(null)}
              className="absolute inset-0 bg-zinc-950/70 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Body Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl w-full max-h-[90vh] overflow-y-auto z-10 space-y-6 text-gray-800 dark:text-zinc-200 animate-in fade-in zoom-in-95 duration-150 ${
                activeStatModal === 'monthlySalesStatement' ? 'max-w-3xl' : 'max-w-lg'
              }`}
              style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}
            >
              {/* Close Button top-corner */}
              <button 
                onClick={() => setActiveStatModal(null)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800/80 cursor-pointer transition-colors"
                title={lang === 'ar' ? 'إغلاق' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>

              {/* SALES METRICS DETAILS CARD */}
              {activeStatModal === 'sales' && (
                <div className="space-y-4 pt-1">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                      <HandCoins className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                        {lang === 'ar' ? 'تقرير المبيعات والعمليات الناجحة' : 'Sales Revenue & Analytics Details'}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{lang === 'ar' ? 'إجمالي المدفوعات للطلب المكتمل ومجموع مبيعات المطابخ النشطة' : 'Total payments captured for successfully delivered orders'}</p>
                    </div>
                  </div>

                  <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/40">
                    <p className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">{lang === 'ar' ? 'إجمالي المبيعات المحققة' : 'Gross Sales Volume'}</p>
                    <p className="text-2xl font-black text-indigo-700 dark:text-indigo-400 mt-1">{formatPrice(totalSalesVolume)}</p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-gray-600 dark:text-zinc-400">
                      {lang === 'ar' ? 'آخر العمليات المكتملة' : 'Recent Completed Orders'}
                    </h5>
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {orders.filter(o => o.status === 'completed').length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">{lang === 'ar' ? 'لا توجد طلبات مكتملة بالمنصة حتى الآن.' : 'No completed receipts recorded yet.'}</p>
                      ) : (
                        orders.filter(o => o.status === 'completed').map(order => (
                          <div key={order.id} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-850 border border-gray-100 dark:border-zinc-800">
                            <div>
                              <span className="font-mono font-bold block text-gray-800 dark:text-zinc-250">#{order.id}</span>
                              <span className="text-[10px] text-gray-400">{order.restaurantName}</span>
                            </div>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatPrice(order.total)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setActiveStatModal(null);
                      scrollToSection('certified-orders-section');
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm shadow-indigo-100 text-center"
                  >
                    <span>{lang === 'ar' ? 'الذهاب إلى سجل سجل الطلبات المعتمدة بالمنصة 🔍' : 'Show Registered Deliveries Dispatch Log 🔍'}</span>
                  </button>
                </div>
              )}

              {/* COMMISSION METRICS DETAILS CARD */}
              {activeStatModal === 'commission' && (
                <div className="space-y-4 pt-1">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                        {lang === 'ar' ? 'أرباح وعمولات المنصة المستهدفة' : 'Platform Commissions Breakdown'}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{lang === 'ar' ? 'تُقدر العمولات بنسبة ثابتة 15% من مبيعات كل مطبخ شريك' : 'Calculated commission target based on 15% flat rate'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/40">
                      <p className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase">{lang === 'ar' ? 'نسبة العمولة' : 'Platform Rate'}</p>
                      <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">15%</p>
                    </div>
                    <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/40">
                      <p className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase">{lang === 'ar' ? 'مجموع العمولات' : 'Est. Earnings'}</p>
                      <p className="text-xl font-bold text-indigo-700 dark:text-indigo-400 mt-1">{formatPrice(platformCommission)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-gray-600 dark:text-zinc-405">{lang === 'ar' ? 'تفصيل العمولات حسب المطبخ الشريك:' : 'Commission split by operational kitchen:'}</h5>
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {restaurants.map(r => {
                        const restOrders = orders.filter(o => o.restaurantId === r.id && o.status === 'completed');
                        const totalSales = restOrders.reduce((sum, o) => sum + o.total, 0);
                        const commissionAmount = totalSales * 0.15;
                        return (
                          <div key={r.id} className="flex justify-between items-center text-xs p-3 rounded-xl bg-gray-50 dark:bg-zinc-850 border border-gray-100 dark:border-zinc-800">
                            <div>
                              <span className="font-bold block text-gray-800 dark:text-zinc-200">{r.name}</span>
                              <span className="text-[10px] text-gray-450">
                                {lang === 'ar' ? `المبيعات: ${formatPrice(totalSales)}` : `Volume: ${formatPrice(totalSales)}`}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-indigo-600 dark:text-indigo-400 block">{formatPrice(commissionAmount)}</span>
                              <span className="text-[9px] text-emerald-500">{lang === 'ar' ? 'مستحق للفصل' : '15% fee'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setActiveStatModal(null);
                      scrollToSection('partners-section');
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm shadow-emerald-100 text-center"
                  >
                    <span>{lang === 'ar' ? 'الذهاب إلى قائمة المطاعم الشريكة 🏢' : 'Go to Partners Settings 🏢'}</span>
                  </button>
                </div>
              )}

              {/* UNIFIED ORDERS DETAILS CARD */}
              {activeStatModal === 'orders' && (
                <div className="space-y-4 pt-1">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-cyan-400 rounded-2xl">
                      <ClipboardList className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                        {lang === 'ar' ? 'متابعة الطلبات الموحدة وحالتها' : 'Unified Orders Pipeline Details'}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{lang === 'ar' ? 'قائمة بحالة الطلبات الحالية بداخل وخارج التنفيذ بقسم التعميد والتحضير' : 'Summary of system order pipeline and validation metrics'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center font-sans">
                    <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100/50 dark:border-amber-900/30 text-amber-700 dark:text-amber-400">
                      <p className="text-2xl font-black">{pendingOrders.length}</p>
                      <p className="text-[10px] font-bold mt-1 text-amber-800 dark:text-amber-300">{lang === 'ar' ? 'معلق للتعميد' : 'Pending'}</p>
                    </div>
                    <div className="p-3.5 bg-blue-50 dark:bg-blue-950/20 rounded-2xl border border-blue-100/50 dark:border-blue-900/30 text-blue-700 dark:text-blue-400">
                      <p className="text-2xl font-black">{orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'pending').length}</p>
                      <p className="text-[10px] font-bold mt-1 text-blue-800 dark:text-blue-300">{lang === 'ar' ? 'قيد التحضير' : 'Active'}</p>
                    </div>
                    <div className="p-3.5 bg-green-50 dark:bg-green-950/20 rounded-2xl border border-green-100/50 dark:border-green-900/30 text-green-700 dark:text-green-400">
                      <p className="text-2xl font-black">{orders.filter(o => o.status === 'completed').length}</p>
                      <p className="text-[10px] font-bold mt-1 text-green-800 dark:text-green-300">{lang === 'ar' ? 'مكتمل' : 'Completed'}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-gray-600 dark:text-zinc-400">{lang === 'ar' ? 'توزيع العمليات الإحصائية' : 'Order Distribution Overview'}</h5>
                    <div className="space-y-2 bg-gray-50 dark:bg-zinc-850 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 text-xs text-gray-650 dark:text-zinc-350">
                      <div className="flex justify-between items-center">
                        <span>{lang === 'ar' ? 'طلبات غير معمدة' : 'Validation Queue'}</span>
                        <strong className="text-amber-650">{pendingOrders.length} / {totalUnifiedOrders}</strong>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full" style={{ width: `${(pendingOrders.length / (totalUnifiedOrders || 1)) * 100}%` }} />
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span>{lang === 'ar' ? 'طلبات منجزة بنجاح' : 'Success Completed'}</span>
                        <strong className="text-emerald-500">{orders.filter(o => o.status === 'completed').length} / {totalUnifiedOrders}</strong>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-green-505 h-full" style={{ width: `${(orders.filter(o => o.status === 'completed').length / (totalUnifiedOrders || 1)) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setActiveStatModal(null);
                        scrollToSection('certification-section');
                      }}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm shadow-amber-100 text-center"
                    >
                      <span>{lang === 'ar' ? 'إلى قسم التعميد 📋' : 'Go to Certification 📋'}</span>
                    </button>
                    <button 
                      onClick={() => {
                        setActiveStatModal(null);
                        scrollToSection('certified-orders-section');
                      }}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm shadow-indigo-100 text-center"
                    >
                      <span>{lang === 'ar' ? 'إلى السجل المكتمل 📋' : 'Go to History 📋'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ACTIVE KITCHENS DETAILS CARD */}
              {activeStatModal === 'kitchens' && (
                <div className="space-y-4 pt-1">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-2xl">
                      <Store className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                        {lang === 'ar' ? 'قائمة الشركاء والمطاعم المسجلة' : 'Registered Kitchen Outlets Details'}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{lang === 'ar' ? 'نظرة عامة على البيانات والقدرات التشغيلية وشحن المطاعم' : 'General metrics concerning local hubs and performance'}</p>
                    </div>
                  </div>

                  <div className="bg-orange-50/50 dark:bg-orange-950/20 p-4 rounded-2xl border border-orange-100/50 dark:border-orange-900/40">
                    <p className="text-[11px] font-bold text-orange-850 dark:text-orange-350 tracking-wider uppercase">{lang === 'ar' ? 'المطابع الشريكة النشطة' : 'Total Operational Hubs'}</p>
                    <p className="text-2xl font-black text-orange-600 dark:text-orange-450 mt-1">{activeKitchensCount} {lang === 'ar' ? 'مطعم شريك' : 'SaaS Partners'}</p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-gray-600 dark:text-zinc-450">{lang === 'ar' ? 'قائمة المطاعم والهواتف' : 'Registered Outlets Directory'}</h5>
                    <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                      {restaurants.map(rest => (
                        <div key={rest.id} className="text-xs p-3 rounded-xl bg-gray-50 dark:bg-zinc-850 border border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                          <div>
                            <strong className="block text-gray-800 dark:text-zinc-200">{rest.name}</strong>
                            <span className="text-[10px] text-gray-400">{lang === 'ar' ? 'الهاتف: ' : 'Phone: '} {rest.phone}</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-1 bg-orange-100/65 dark:bg-orange-950/40 text-orange-750 dark:text-orange-400 rounded-lg">
                            {rest.menu?.length || 0} {lang === 'ar' ? 'وجبة' : 'items'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setActiveStatModal(null);
                      scrollToSection('partners-section');
                    }}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm shadow-orange-100 text-center"
                  >
                    <span>{lang === 'ar' ? 'التوجه إلى قسم إدارة وتعديل المطاعم ⚙️' : 'Manage and configure kitchen hubs ⚙️'}</span>
                  </button>
                </div>
              )}

              {/* MONTHLY SALES STATEMENT & 5% COMMISSION INVOICING */}
              {activeStatModal === 'monthlySalesStatement' && (() => {
                const invoiceOrders = orders.filter(order => {
                  if (order.status !== 'completed') return false;
                  if (selectedRestInvoice !== 'all' && order.restaurantId !== selectedRestInvoice) {
                    return false;
                  }
                  if (selectedMonth) {
                    const orderDate = new Date(order.createdAt);
                    const orderYearMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
                    if (orderYearMonth !== selectedMonth) return false;
                  }
                  return true;
                });

                const invoiceGrossSales = invoiceOrders.reduce((sum, o) => sum + o.total, 0);
                const invoiceCommission = invoiceGrossSales * 0.05;

                const targetRest = restaurants.find(r => r.id === selectedRestInvoice);
                const targetRestName = selectedRestInvoice === 'all'
                  ? (lang === 'ar' ? 'جميع المطاعم بالمنصة' : 'All Platform Restaurants')
                  : (targetRest?.name || selectedRestInvoice);

                const targetRestPhone = targetRest?.phone || '';

                interface SoldProductDetail {
                  id: string;
                  name: string;
                  price: number;
                  quantity: number;
                  orderId: string;
                  orderTime: number;
                }

                const soldProducts: SoldProductDetail[] = [];
                invoiceOrders.forEach(order => {
                  if (order.items) {
                    order.items.forEach(item => {
                      soldProducts.push({
                        id: item.id || `i_${Math.random()}`,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        orderId: order.id,
                        orderTime: order.createdAt
                      });
                    });
                  }
                });

                // Sort newest items first
                soldProducts.sort((a, b) => b.orderTime - a.orderTime);

                const generateInvoiceShareText = () => {
                  const monthNamesAr: Record<string, string> = {
                    '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'أبريل', '05': 'مايو', '06': 'يونيو',
                    '07': 'يوليو', '08': 'أغسطس', '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر'
                  };
                  const [yr, mn] = selectedMonth.split('-');
                  const monthStr = lang === 'ar' ? `${monthNamesAr[mn] || mn} ${yr}` : `${mn}/${yr}`;
                  
                  let text = lang === 'ar' 
                    ? `🧾 *فاتورة مستحقات منصة فودي بلس - عمولة الـ 5%*\n`
                    : `🧾 *Foody Plus Platform Invoice - 5% Revenue Statement*\n`;
                    
                  text += lang === 'ar'
                    ? `🏢 *المطعم شريك:* ${targetRestName}\n`
                    : `🏢 *Partner Restaurant:* ${targetRestName}\n`;
                    
                  text += lang === 'ar'
                    ? `🗓️ *الفترة الزمنية:* لشهر ${monthStr}\n`
                    : `🗓️ *Billing Period:* For ${monthStr}\n`;
                    
                  text += `-------------------------------------------\n`;
                  
                  text += lang === 'ar'
                    ? `📊 *إجمالي المبيعات المحققة:* ${formatPrice(invoiceGrossSales)}\n`
                    : `📊 *Total Sales Volume:* ${formatPrice(invoiceGrossSales)}\n`;
                    
                  text += lang === 'ar'
                    ? `💵 *عمولة المنصة المستحقة للتحصيل (5%):* ${formatPrice(invoiceCommission)}\n`
                    : `💵 *Due Commission (5%):* ${formatPrice(invoiceCommission)}\n`;
                    
                  text += `-------------------------------------------\n`;
                  text += lang === 'ar'
                    ? `🛍️ *عدد السلع المباعة بالتفصيل:* ${soldProducts.reduce((sum, item) => sum + item.quantity, 0)} قطعة\n`
                    : `🛍️ *Total Items Sold:* ${soldProducts.reduce((sum, item) => sum + item.quantity, 0)} items\n`;
                    
                  if (soldProducts.length > 0) {
                    text += lang === 'ar' ? `\n📋 *تفاصيل المنتجات المباعة:*\n` : `\n📋 *Sold Products Breakdown:*\n`;
                    soldProducts.forEach((p) => {
                      const pTime = new Date(p.orderTime);
                      const timeStr = pTime.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
                      const dateStr = pTime.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US');
                      text += `• ${p.name} (عدد ${p.quantity}) - ${formatPrice(p.price * p.quantity)} | [${dateStr} - ${timeStr}] | طلب #${p.orderId}\n`;
                    });
                  }
                  
                  text += `-------------------------------------------\n`;
                  text += lang === 'ar'
                    ? `⚠️ *ملاحظة:* يرجى سداد عمولة المنصة (5%) لتجنب إيقاف الخدمة مؤقتاً. شكراً لكم!`
                    : `⚠️ *Notice:* Please clear platform dues (5%) to keep services fully active. Thank you!`;
                    
                  return text;
                };

                const handleCopyText = () => {
                  try {
                    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(generateInvoiceShareText());
                    } else {
                      const textArea = document.createElement("textarea");
                      textArea.value = generateInvoiceShareText();
                      textArea.style.position = "fixed";
                      document.body.appendChild(textArea);
                      textArea.focus();
                      textArea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textArea);
                    }
                  } catch (err) {
                    console.warn('Fallback copy failed', err);
                  }
                  setCopiedInvoiceText(true);
                  setTimeout(() => setCopiedInvoiceText(false), 3000);
                };

                return (
                  <div className="space-y-6 pt-1">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-orange-100 dark:bg-orange-950/40 text-orange-600 rounded-2xl animate-pulse">
                        <HandCoins className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                          {lang === 'ar' ? 'تقرير المبيعات والعمولات الشهرية (5%)' : 'Monthly Sales & 5% Commissions Report'}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {lang === 'ar' 
                            ? 'حساب وتحصيل عمولة المبيعات للمطاعم بنسبة 5% وإعداد كشف مفصل بالوجبات والتواريخ' 
                            : 'Calculate and draft 5% sales invoices for each restaurant, detailing sold items, date and time'}
                        </p>
                      </div>
                    </div>

                    {/* Filter controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-zinc-850 p-4 rounded-2xl border border-gray-150 dark:border-zinc-800">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">
                          {lang === 'ar' ? 'المطعم الشريك' : 'Partner Restaurant'}
                        </label>
                        <select
                          value={selectedRestInvoice}
                          onChange={(e) => setSelectedRestInvoice(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-orange-100 focus:border-orange-600 outline-none transition-all"
                        >
                          <option value="all">{lang === 'ar' ? 'جميع المطاعم بالمنصة' : 'All Restaurants'}</option>
                          {restaurants.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">
                          {lang === 'ar' ? 'الشهر المستهدف' : 'Target Month'}
                        </label>
                        <input
                          type="month"
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-orange-100 focus:border-orange-600 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-orange-50/50 dark:bg-orange-950/25 p-4 rounded-2xl border border-orange-100/50 dark:border-orange-900/40 text-center">
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 block uppercase">
                          {lang === 'ar' ? 'عدد الطلبات المكتملة' : 'Completed Receipts'}
                        </span>
                        <strong className="text-xl font-black text-gray-900 dark:text-white block mt-1">
                          {invoiceOrders.length}
                        </strong>
                      </div>

                      <div className="bg-indigo-50/55 dark:bg-indigo-950/25 p-4 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/40 text-center">
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 block uppercase">
                          {lang === 'ar' ? 'إجمالي مبيعات الفترة' : 'Gross Store Sales'}
                        </span>
                        <strong className="text-xl font-black text-indigo-700 dark:text-indigo-400 block mt-1">
                          {formatPrice(invoiceGrossSales)}
                        </strong>
                      </div>

                      <div className="bg-green-50/60 dark:bg-green-950/25 p-4 rounded-2xl border border-green-200/50 dark:border-green-900/40 text-center ring-2 ring-green-500/15">
                        <span className="text-[10px] font-bold text-green-700 dark:text-green-400 block uppercase">
                          {lang === 'ar' ? 'عمولتك المستحقة (5%)' : 'Admin Share (5%)'}
                        </span>
                        <strong className="text-2xl font-black text-green-600 dark:text-green-400 block mt-1">
                          {formatPrice(invoiceCommission)}
                        </strong>
                      </div>
                    </div>

                    {/* Itemized Detailed Breakdown Table */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h5 className="text-xs font-bold text-gray-600 dark:text-zinc-400">
                          {lang === 'ar' ? '📋 تفاصيل المنتجات المباعة ووقت البيع' : '📋 Sold Products Breakdown, Date and Time'}
                        </h5>
                        <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-350 px-2 py-0.5 rounded-md font-bold">
                          {soldProducts.length} {lang === 'ar' ? 'صنف تم بيعه' : 'items'}
                        </span>
                      </div>

                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 border border-gray-100 dark:border-zinc-800 rounded-2xl p-2.5 bg-gray-50/30">
                        {soldProducts.length === 0 ? (
                          <div className="py-8 text-center text-gray-400">
                            <Store className="w-8 h-8 text-gray-350 mx-auto mb-2" />
                            <p className="text-xs">
                              {lang === 'ar' 
                                ? 'لا توجد بيانات مبيعات متوفرة لهذا الفلتر في هذا الشهر.' 
                                : 'No transaction records found for this helper combination.'}
                            </p>
                          </div>
                        ) : (
                          soldProducts.map((p, index) => {
                            const dateObj = new Date(p.orderTime);
                            const localeDate = dateObj.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US');
                            const localeTime = dateObj.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            });

                            return (
                              <div key={`${p.orderId}-${index}`} className="flex flex-col sm:flex-row justify-between sm:items-center text-xs p-3 rounded-xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 hover:shadow-xs transition-shadow gap-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-gray-900 dark:text-white">{p.name}</span>
                                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-950 px-1.5 py-0.2 rounded-md">
                                      {lang === 'ar' ? `عدد ${p.quantity}` : `Qty ${p.quantity}`}
                                    </span>
                                    {selectedRestInvoice === 'all' && (
                                      <span className="text-[10px] text-gray-400">
                                        ({orders.find(o => o.id === p.orderId)?.restaurantName})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-gray-400 font-mono flex items-center gap-2 flex-wrap">
                                    <span>#{p.orderId}</span>
                                    <span>•</span>
                                    <span className="text-gray-500 dark:text-zinc-400 font-bold">{localeDate} - {localeTime}</span>
                                  </div>
                                </div>
                                <div className="text-right flex sm:flex-col justify-between items-center sm:items-end gap-1 border-t sm:border-0 pt-1.5 sm:pt-0 border-gray-55">
                                  <span className="text-[10px] text-gray-400">{lang === 'ar' ? 'القيمة والمجموع:' : 'Subtotal:'}</span>
                                  <span className="font-bold text-gray-905 dark:text-white">{formatPrice(p.price * p.quantity)}</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Copy and share actions */}
                    {invoiceOrders.length > 0 && (
                      <div className="space-y-3.5 bg-orange-50/20 dark:bg-orange-950/10 p-4 rounded-2xl border border-orange-100/55 dark:border-orange-900/30">
                        <div className="flex items-center justify-between">
                          <h6 className="text-[11px] font-extrabold text-orange-700 dark:text-orange-400 uppercase tracking-widest">
                            {lang === 'ar' ? '💬 معاينة مطالبة الدفع الجاهزة للإرسال:' : '💬 Draft Payment Demand Memo Preview:'}
                          </h6>
                          <button
                            onClick={handleCopyText}
                            className={`cursor-pointer text-[11px] font-bold p-1.5 px-3 rounded-lg flex items-center gap-1 transition-all active:scale-95 ${
                              copiedInvoiceText 
                                ? 'bg-green-600 text-white' 
                                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm'
                            }`}
                          >
                            <Check className={`w-3.5 h-3.5 ${copiedInvoiceText ? 'block' : 'hidden'}`} />
                            <span>{copiedInvoiceText ? (lang === 'ar' ? 'تم نسخ الطلب! 📋' : 'Copied Invoice!') : (lang === 'ar' ? 'نسخ المطالبة 📋' : 'Copy Invoice 📋')}</span>
                          </button>
                        </div>

                        {/* Direct WhatsApp Trigger if target has phone */}
                        <div className="flex flex-col gap-2.5">
                          <pre className="text-[10px] font-mono text-gray-650 dark:text-gray-300 bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-gray-150 dark:border-zinc-850 whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                            {generateInvoiceShareText()}
                          </pre>
                          
                          {selectedRestInvoice !== 'all' && targetRestPhone && (
                            <a
                              href={`https://wa.me/${targetRestPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(generateInvoiceShareText())}`}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-100 text-center decoration-none"
                            >
                              <span>{lang === 'ar' ? 'إرسال الفاتورة بالتفاصيل إلى المالك عبر واتساب 💬' : 'Direct Send Statement via WhatsApp 💬'}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
