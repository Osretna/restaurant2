import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store, ShoppingBag, MapPin, Phone, User, Check, Trash2, ArrowLeft, 
  ChevronRight, Bike, ShieldCheck, Soup, Compass, Sparkles, Clock, X, Plus, Minus, Heart, Star
} from 'lucide-react';
import { Restaurant, Order, MenuItem, OrderItem } from '../types';

const getRestaurantImage = (rest: Restaurant) => {
  if (rest.imageUrl && rest.imageUrl.trim() !== '') {
    return rest.imageUrl;
  }
  const name = (rest.name || '').toLowerCase();
  if (name.includes('burger') || name.includes('برجر')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=60';
  }
  if (name.includes('italian') || name.includes('إيطاليا') || name.includes('pasta') || name.includes('بيتزا') || name.includes('pizza')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=60';
  }
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=60';
};

interface CustomerInterfaceProps {
  restaurants: Restaurant[];
  orders: Order[];
  onPlaceOrder: (
    restaurantId: string, 
    restaurantName: string, 
    customerName: string, 
    customerPhone: string, 
    customerAddress: string, 
    items: OrderItem[], 
    total: number
  ) => void;
  lang: 'ar' | 'en';
  t: any;
}

export default function CustomerInterface({
  restaurants,
  orders,
  onPlaceOrder,
  lang,
  t
}: CustomerInterfaceProps) {
  const [selectedRestId, setSelectedRestId] = useState<string | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);

  // Guest Personal Favorites state
  const [personalFavorites, setPersonalFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('foody_personal_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const togglePersonalFavorite = (foodId: string) => {
    let updated;
    if (personalFavorites.includes(foodId)) {
      updated = personalFavorites.filter(id => id !== foodId);
    } else {
      updated = [...personalFavorites, foodId];
    }
    setPersonalFavorites(updated);
    try {
      localStorage.setItem('foody_personal_favorites', JSON.stringify(updated));
    } catch (e) {}
  };

  // Sync active category if language changes
  React.useEffect(() => {
    setActiveCategory(lang === 'ar' ? 'الكل' : 'All');
  }, [lang]);
  
  // Checkout Details Form
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  
  // Active placed order state for live tracking
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  // Selected product details modal
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [selectedProductQty, setSelectedProductQty] = useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Keep a reference to the last generated WhatsApp URL in case they want to open it explicitly
  const [lastWhatsAppUrl, setLastWhatsAppUrl] = useState<string | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Currency utility helper
  const formatPrice = (price: number) => {
    return lang === 'ar' ? `${price.toFixed(2)} ج.م` : `${price.toFixed(2)} EGP`;
  };

  // Selected restaurant info
  const selectedRest = restaurants.find(r => r.id === selectedRestId);

  // Track the user's active order to display tracking status
  const userActiveOrder = orders.find(o => o.id === activeOrderId);

  // Clear tracking if completed
  const handleClearTracking = () => {
    setActiveOrderId(null);
  };

  // Cart operations
  const handleAddToCart = (item: MenuItem) => {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      setCart(cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { id: item.id, name: item.name, price: item.price, quantity: 1 }]);
    }
  };

  const handleDecreaseQuantity = (itemId: string) => {
    const existing = cart.find(i => i.id === itemId);
    if (existing && existing.quantity > 1) {
      setCart(cart.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i));
    } else {
      setCart(cart.filter(i => i.id !== itemId));
    }
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart(cart.filter(i => i.id !== itemId));
  };

  const menuTotalCost = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const activeShipping = selectedRest ? selectedRest.shippingFee : 0;
  const grandTotalCost = menuTotalCost + activeShipping;

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestId || !selectedRest) return;
    if (cart.length === 0) {
      alert(lang === 'ar' ? 'سلة المشتريات فارغة!' : 'Your tray is empty!');
      return;
    }
    if (!custName || !custPhone || !custAddress) {
      alert(lang === 'ar' ? 'يرجى إدخال جميع بيانات التوصيل!' : 'Please complete checkout details!');
      return;
    }

    // Generate safe custom ID
    const newId = "order_" + Math.floor(1000 + Math.random() * 9000);
    
    onPlaceOrder(
      selectedRestId,
      selectedRest.name,
      custName,
      custPhone,
      custAddress,
      cart,
      grandTotalCost
    );

    // Prepare WhatsApp Message invoice details
    const orderItemsStr = cart.map((i, idx) => `${idx + 1}- ${i.name} (x${i.quantity}) -> ${formatPrice(i.price * i.quantity)}`).join('\n');
    const whatsappMsg = `*🚨 طلب جديد من Foody Plus - فوودى بلس* \n\n` +
      `*رقم الفاتورة:* ${newId}\n` +
      `*المطعم:* ${selectedRest.name}\n\n` +
      `*👤 اسم العميل:* ${custName}\n` +
      `*📞 رقم هاتف للتواصل:* ${custPhone}\n` +
      `*📍 عنوان التوصيل:* ${custAddress}\n\n` +
      `*🍔 الوجبات المطلوبة:*\n${orderItemsStr}\n\n` +
      `*🚚 تكلفة خدمة الدليفري التوصيل:* ${formatPrice(activeShipping)}\n` +
      `*💰 الإجمالي النهائي للفاتورة:* ${formatPrice(grandTotalCost)}\n\n` +
      `_تم إرسال هذا الطلب لتنسيق واستلام الفاتورة وتأكيد الشحن الفوري._`;

    // Clean restaurant phone structure
    let cleanPhone = selectedRest.phone ? selectedRest.phone.replace(/[^0-9]/g, '') : '';
    if (cleanPhone.startsWith('01')) {
      cleanPhone = '20' + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith('1')) {
      cleanPhone = '20' + cleanPhone;
    }

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(whatsappMsg)}`;
    
    setLastWhatsAppUrl(whatsappUrl);
    setShowWhatsAppModal(true);

    // Attempt automatic popup
    try {
      window.open(whatsappUrl, '_blank');
    } catch (err) {
      console.warn("Popup blocked, showing fallback modal link", err);
    }

    setActiveOrderId(newId);
    setCart([]);
  };

  // Support categories grouping
  const categories = lang === 'ar'
    ? ['الكل', '🌟 المفضلة', 'Burgers', 'Pizza', 'Pasta', 'Sides', 'Desserts', 'Drinks']
    : ['All', '🌟 Favorites', 'Burgers', 'Pizza', 'Pasta', 'Sides', 'Desserts', 'Drinks'];
  
  const [activeCategory, setActiveCategory] = useState(lang === 'ar' ? 'الكل' : 'All');

  const filteredMenuItems = selectedRest?.menu?.filter(item => {
    if (!item) return false;
    if (!item.available) return false;
    
    const isFavoritesCategory = activeCategory === '🌟 Favorites' || activeCategory === '🌟 المفضلة';
    if (isFavoritesCategory) {
      return item.isFavorite === true || personalFavorites.includes(item.id);
    }

    if (activeCategory === 'All' || activeCategory === 'الكل') return true;
    
    const catStr = item.category || '';
    return catStr.toLowerCase() === activeCategory.toLowerCase();
  }) || [];

  return (
    <div className="space-y-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* 1. REAL-TIME TRACKING OVERLAY IF CURRENT ORDER EXISTS */}
      <AnimatePresence>
        {userActiveOrder && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-900 text-white p-6 rounded-3xl border border-gray-800 shadow-xl space-y-6"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-orange-600 px-3 py-1 rounded-full text-white inline-block">
                  {lang === 'ar' ? 'تتبع فوري للطلب' : 'REAL-TIME TRACKING DISPATCH'}
                </span>
                <h3 className="text-xl font-bold mt-2 font-sans flex items-center gap-2">
                  <Compass className="w-5 h-5 text-orange-500 animate-spin" />
                  {t.active_order_tracking}
                </h3>
              </div>
              <button
                onClick={handleClearTracking}
                className="cursor-pointer text-xs font-semibold bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-750 transition-colors"
              >
                {lang === 'ar' ? 'إغلاق التتبع' : 'Dismiss Tracking'}
              </button>
            </div>

            <div className="p-4 bg-gray-850 rounded-2xl border border-gray-800 flex justify-between flex-wrap gap-2 text-xs">
              <div>
                <p className="text-gray-400">{lang === 'ar' ? 'الرمز التعريفي لطلبك:' : 'Order Identifier:'}</p>
                <p className="text-sm font-mono font-bold text-white mt-1">#{userActiveOrder.id}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400">{lang === 'ar' ? 'المطعم المسول:' : 'Fulfillment Brand:'}</p>
                <p className="text-sm font-semibold text-orange-400 mt-1">{userActiveOrder.restaurantName}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400">{lang === 'ar' ? 'القيمة الشاملة للشحن:' : 'Pricing Tariff:'}</p>
                <p className="text-sm font-bold text-green-400 mt-1">${userActiveOrder.total.toFixed(2)}</p>
              </div>
            </div>

            {/* Live Interactive Progression Timeline Stepper */}
            <div>
              <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                <Clock className="w-4 h-4 text-orange-400" />
                {t.tracking_current_status}
              </p>
              
              <div className="relative mt-8 mb-4">
                {/* Connecting track line */}
                <div className="absolute top-1/2 left-4 right-4 sm:left-12 sm:right-12 h-0.5 bg-gray-800 -translate-y-1/2 -z-0"></div>
                
                {/* Completed track highlighted */}
                <div 
                  className="absolute top-1/2 left-4 sm:left-12 h-0.5 bg-gradient-to-r from-orange-500 to-green-500 -translate-y-1/2 -z-0 transition-all duration-1000"
                  style={{
                    width: 
                      userActiveOrder.trackingStatus === 'submitted' ? '0%' :
                      userActiveOrder.trackingStatus === 'accepted' ? '25%' :
                      userActiveOrder.trackingStatus === 'preparing' ? '50%' :
                      userActiveOrder.trackingStatus === 'on_the_way' ? '75%' : '100%'
                  }}
                ></div>

                {/* Tracking Dots Loop */}
                <div className="relative z-10 flex justify-between">
                  {(['submitted', 'accepted', 'preparing', 'on_the_way', 'delivered'] as const).map((step, idx) => {
                    const stepStatuses = {
                      submitted: 0,
                      accepted: 1,
                      preparing: 2,
                      on_the_way: 3,
                      delivered: 4
                    };

                    const currentIdx = stepStatuses[userActiveOrder.trackingStatus];
                    const isDone = idx < currentIdx;
                    const isActive = idx === currentIdx;

                    return (
                      <div key={step} className="flex flex-col items-center">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                          isDone ? 'bg-green-500 text-white' :
                          isActive ? 'bg-orange-500 text-white scale-110 shadow-lg shadow-orange-500/50' :
                          'bg-gray-800 text-gray-500'
                        }`}>
                          {idx === 0 && <Compass className="w-4 h-4 sm:w-5 sm:h-5" />}
                          {idx === 1 && <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />}
                          {idx === 2 && <Soup className="w-4 h-4 sm:w-5 sm:h-5" />}
                          {idx === 3 && <Bike className="w-4 h-4 sm:w-5 sm:h-5" />}
                          {idx === 4 && <Check className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </div>

                        {/* Step Description labels - hidden on precise small scales */}
                        <span className={`hidden sm:block text-[9px] mt-2 font-medium tracking-wide ${
                          isActive ? 'text-orange-400 font-bold' : isDone ? 'text-green-400' : 'text-gray-500'
                        }`}>
                          {t.tracking_steps[step]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="sm:hidden text-center text-xs mt-3 bg-gray-850 p-2.5 rounded-xl border border-gray-800">
                <span className="font-bold text-orange-400">
                  {t.tracking_steps[userActiveOrder.trackingStatus]}
                </span>
              </div>
            </div>

            {/* Special status hints */}
            {userActiveOrder.status === 'pending' && (
              <div className="bg-amber-950/40 border border-amber-900/50 p-3.5 rounded-xl text-center text-xs text-amber-300">
                ⚠️ {t.order_submitted_success}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. MAIN FRONTSTORE ROOT SCREEN */}
      {selectedRestId === null ? (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h3 className="text-2xl font-bold text-gray-900 font-sans tracking-tight">{t.browse_restaurants}</h3>
            <p className="text-xs text-gray-500 font-sans leading-relaxed">
              {lang === 'ar' ? 'تصفح وجبات منوعة من المأكولات الشرقية والغربية وتابع طلبك في الوقت الفعلي خطوة بخطوة !' : 'Select from elite SaaS local brands. Complete safety loops and checkout tracking built-in.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {restaurants.filter(r => r && r.id && r.name).map(rest => {
              const rImage = getRestaurantImage(rest);
              return (
                <motion.div
                  key={rest.id}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="bg-white rounded-3xl border border-gray-150 shadow-sm hover:shadow-md overflow-hidden transition-all flex flex-col justify-between"
                >
                  {/* Restaurant Cover Image */}
                  <div className="h-44 w-full relative overflow-hidden bg-gray-100">
                    <img 
                      src={rImage} 
                      alt={rest.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                    <span className="absolute bottom-3 right-3 text-[10px] font-bold bg-white text-gray-900 rounded-full px-2.5 py-1 shadow-sm">
                      📍 {lang === 'ar' ? 'متاح للتسليم' : 'Instant Dispatch'}
                    </span>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="text-lg font-bold text-gray-950">{rest.name}</h4>
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-2.5 py-0.5 whitespace-nowrap">
                          {lang === 'ar' ? 'سرعة فائقة' : 'SaaS Network'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed min-h-[36px]">
                        {rest.description || (lang === 'ar' ? 'وجبات مطهوة طازجة ممتازة التوصيل سريعة.' : 'Highly delicious recipes and combos ready for fast dispatch.')}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                      <div className="space-y-1">
                        <p className="text-gray-500 flex items-center gap-1 font-sans">
                          <Phone className="w-3.5 h-3.5 text-gray-400" /> {rest.phone}
                        </p>
                        <p className="font-bold text-gray-800 flex items-center gap-1">
                          <Bike className="w-3.5 h-3.5 text-indigo-500 animate-bounce" />
                          {lang === 'ar' ? 'التوصيل لعنوانك:' : 'Shipping:'} <span className="text-indigo-650 font-mono">{formatPrice(rest.shippingFee ?? 0)}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedRestId(rest.id);
                          setCart([]); // Clear catalog tray for new restaurants
                        }}
                        className="cursor-pointer hover:bg-indigo-700 bg-indigo-600 text-white rounded-xl py-2 px-4.5 font-bold flex items-center gap-1 transition-all text-xs"
                      >
                        {lang === 'ar' ? 'عرض الوجبات' : 'Explore Menu'}
                        <ChevronRight className="w-4 h-4 ml-0.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 3. RESTAURANT DETAIL & MENU VIEW */
        <div className="space-y-6">
          {/* Detailed Restaurant header */}
          <div className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-sm">
            {/* Beautiful Banner Image for Selected Restaurant */}
            <div className="h-44 w-full relative overflow-hidden bg-gray-100">
              <img 
                src={getRestaurantImage(selectedRest!)} 
                alt={selectedRest?.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent pointer-events-none" />
              <button
                onClick={() => setSelectedRestId(null)}
                className="absolute top-4 left-4 p-2 cursor-pointer bg-white/95 hover:bg-white text-gray-900 rounded-xl transition-colors shadow-md flex items-center gap-1 text-xs font-bold"
                title={lang === 'ar' ? 'العودة للمطاعم' : 'Back to stores'}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{lang === 'ar' ? 'رجوع' : 'Back'}</span>
              </button>
            </div>

            <div className="p-5 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedRest?.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{selectedRest?.description || selectedRest?.phone}</p>
                </div>
              </div>

              <div className="text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl py-2 px-3.5">
                🚀 {lang === 'ar' ? 'أجرة الشحن والمندوب لهذا الطلب:' : 'Target Delivery Charge:'} {formatPrice(selectedRest?.shippingFee ?? 0)}
              </div>
            </div>
          </div>

          {/* Catalog content splitting grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Menu Items panel (8 columns) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Educational info panel answering user's direct questions on Cart and Favorites */}
              <div className="p-4 bg-orange-50/20 border border-orange-100 rounded-2xl text-xs space-y-2.5">
                <div className="flex items-center gap-1.5 text-orange-700 font-bold">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>{lang === 'ar' ? '💡 كيف تعمل حقيبة الوجبات والمفضلة في منصتنا؟' : '💡 How do Meal Tray & Favorites function in Foody Plus?'}</span>
                </div>
                <div className="text-gray-650 leading-relaxed font-sans text-[11px]">
                  {lang === 'ar' ? (
                    <div className="space-y-1">
                      <p>• <strong>حقيبة وجباتك والطلب الحالي:</strong> هي سلة الشراء الذكية. عند تصفح القائمة، يمكنك إضافة وجباتك المفضلة هنا لترى المجموع النهائي وتكاليف التوصيل فوراً، ثم إرسال الفاتورة جاهزة للمطعم بضغطة واحدة لتأكيد شحنها لك.</p>
                      <p>• <strong>الوجبات المفضلة (من يضيفها؟):</strong> تعمل من الجهتين بطريقة تعاونية:</p>
                      <div className="pr-3 space-y-0.5">
                        <p>• <strong>من المطعم:</strong> يبرز صاحب المطبخ الوجبات الفاخرة والأكثر طلباً بقلب مذهب <span className="text-amber-600 font-bold">★ مفضل المطعم</span> لترشدك لأجود أطباقهم الفريدة.</p>
                        <p>• <strong>من العميل (أنت):</strong> بالضغط على أيقونة القلب على أي وجبة، تحفظها فوراً في مفضلاتك الشخصية لتصل إليها سريعاً عبر قسم <span className="text-indigo-650 font-bold">🌟 المفضلة</span> وإعادة طلبها بضغطة واحدة!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p>• <strong>Your Meal Tray & Checkout:</strong> This is your custom-pricing slate. As you browse, meals are added here to calculate immediate tariffs & shipping fees before sending files direct to manager via WhatsApp.</p>
                      <p>• <strong>Popular Favorites (Who configures them?):</strong> Works via dual pathways:</p>
                      <div className="pl-3 space-y-0.5">
                        <p>• <strong>By Restaurant:</strong> Marked with <span className="text-amber-500 font-bold">★ Chef's Rated</span> tag to showcase premium signature recipes.</p>
                        <p>• <strong>By Client (You):</strong> Click any Heart icon on high-end plates to add to your personal shelf, filtered instantly under <span className="text-indigo-600 font-bold">🌟 Favorites</span> tab.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Category tabs filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`py-1.5 px-3.5 cursor-pointer rounded-full text-xs font-bold transition-all shadow-xs ${
                      activeCategory === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white hover:bg-gray-150 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Menu items grid list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMenuItems.length === 0 ? (
                  <div className="col-span-2 py-12 text-center text-gray-400 bg-white border border-gray-100 rounded-3xl">
                    <Soup className="w-12 h-12 text-gray-150 mx-auto mb-2" />
                    <p className="text-sm">{lang === 'ar' ? 'لا يجد وجبات نشطة في هذا القسم حالياً!' : 'No items match this category tag.'}</p>
                  </div>
                ) : (
                  filteredMenuItems.map(item => {
                    const cartItem = cart.find(ci => ci.id === item.id);
                    const imagesList = item.imageUrls || (item.imageUrl ? [item.imageUrl] : []);
                    const primaryImage = imagesList[0] || '';

                    return (
                      <div
                        key={item.id}
                        className="group bg-white rounded-3xl border border-gray-150 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
                        onClick={() => {
                          setSelectedProduct(item);
                          setSelectedProductQty(1);
                          setActiveImageIndex(0);
                        }}
                      >
                        {/* High-end Professional Image section */}
                        <div className="relative h-44 w-full bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-100/55">
                          {primaryImage ? (
                            <img
                              src={primaryImage}
                              alt={item.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-50/20 to-orange-50/20 flex flex-col items-center justify-center text-gray-400 gap-1">
                              <Soup className="w-9 h-9 text-indigo-500/50" />
                              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400/80">Foody Product</span>
                            </div>
                          )}

                          {/* Category Tag overlay */}
                          <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-xs text-gray-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-gray-100/80 shadow-xs">
                            {item.category}
                          </div>

                          {/* Personal favorite client heart icon toggle */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePersonalFavorite(item.id);
                            }}
                            className="absolute top-2.5 right-2.5 z-10 bg-white/90 backdrop-blur-md p-1.5 rounded-full border border-gray-100 shadow-xs hover:text-red-500 hover:scale-110 active:scale-90 transition-all cursor-pointer"
                            title={lang === 'ar' ? 'إضافة لمفضلاتي' : 'Add to personal favorites'}
                          >
                            <Heart className={`w-4 h-4 transition-transform ${personalFavorites.includes(item.id) ? 'fill-red-500 text-red-500 scale-105' : 'text-gray-400'}`} />
                          </button>

                          {/* Restaurant choice golden badge overlay */}
                          {item.isFavorite && (
                            <div className="absolute bottom-2.5 left-2.5 bg-amber-500/95 backdrop-blur-xs text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full border border-amber-400 shadow-sm flex items-center gap-1">
                              <Star className="w-3 h-3 fill-white text-white" />
                              <span>{lang === 'ar' ? 'مفضل المطعم' : "Chef's Rated"}</span>
                            </div>
                          )}

                          {/* Multi-image indicators overlay */}
                          {imagesList.length > 1 && (
                            <div className="absolute bottom-2.5 right-2.5 bg-gray-900/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                              📸 {imagesList.length} {lang === 'ar' ? 'صور' : 'pics'}
                            </div>
                          )}
                        </div>

                        {/* Product details and rates area */}
                        <div className="p-4.5 flex-1 flex flex-col justify-between space-y-3" onClick={(e) => e.stopPropagation()/* prevent card triggering details on action click */}>
                          <div className="space-y-1">
                            <h4 className="font-bold text-gray-900 text-[13px] group-hover:text-indigo-600 transition-colors hover:underline">
                              {item.name}
                            </h4>
                            {item.description && (
                              <p className="text-[11px] text-gray-500 font-sans tracking-wide leading-relaxed line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-gray-100/60 flex justify-between items-center">
                            <span className="font-extrabold text-orange-650 text-[13px] font-mono">
                              {formatPrice(item.price)}
                            </span>

                            {cartItem ? (
                              <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl border border-gray-200/50">
                                <button
                                  onClick={() => handleDecreaseQuantity(item.id)}
                                  className="w-6 h-6 bg-white hover:bg-gray-200 text-gray-750 font-bold text-xs rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                                >
                                  -
                                </button>
                                <span className="text-xs font-bold text-gray-900 min-w-[18px] text-center">
                                  {cartItem.quantity}
                                </span>
                                <button
                                  onClick={() => handleAddToCart(item)}
                                  className="w-6 h-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedProduct(item);
                                    setSelectedProductQty(1);
                                    setActiveImageIndex(0);
                                  }}
                                  className="py-1 px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                >
                                  {lang === 'ar' ? 'التفاصيل' : 'Details'}
                                </button>
                                <button
                                  onClick={() => handleAddToCart(item)}
                                  className="py-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                  {lang === 'ar' ? 'طلب' : 'Order'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Shopping Cart Drawer Checkout (4 columns) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-150">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                  <ShoppingBag className="w-5 h-5 text-indigo-600 animate-bounce" />
                  {t.shopping_cart}
                </h3>

                {/* Cart Items list */}
                {cart.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 space-y-2 text-xs">
                    <ShoppingBag className="w-12 h-12 text-gray-150 mx-auto" />
                    <p>{t.cart_empty}</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <div className="max-h-[220px] overflow-y-auto space-y-2">
                      {cart.map(item => (
                        <div key={item.id} className="text-xs bg-gray-50/50 p-2.5 rounded-xl flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-800">{item.name}</p>
                            <p className="text-[10px] text-gray-400">
                              {formatPrice(item.price)} x {item.quantity}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRemoveFromCart(item.id)}
                              className="text-gray-400 hover:text-red-500 p-1 rounded-md"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Check out form inputs */}
                    <form onSubmit={handleSubmitOrder} className="pt-4 border-t border-gray-100 space-y-3">
                      <h4 className="text-xs font-bold text-gray-800">{t.checkout_form}</h4>
                      
                      <div>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            required
                            placeholder={t.customer_name}
                            value={custName}
                            onChange={(e) => setCustName(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 pl-9 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            required
                            placeholder={t.customer_phone}
                            value={custPhone}
                            onChange={(e) => setCustPhone(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 pl-9 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all font-sans"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            required
                            placeholder={t.customer_address}
                            value={custAddress}
                            onChange={(e) => setCustAddress(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 pl-9 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Tariffs summary prices */}
                      <div className="pt-3 border-t border-dashed border-gray-150 space-y-1.5 text-xs">
                        <div className="flex justify-between text-gray-505">
                          <span>{t.items_total}</span>
                          <span className="font-mono">{formatPrice(menuTotalCost)}</span>
                        </div>
                        <div className="flex justify-between text-gray-505">
                          <span>{t.shipping}</span>
                          <span className="font-mono">{formatPrice(activeShipping)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-gray-900 pt-1 text-sm border-t border-gray-105">
                          <span>{t.grand_total}</span>
                          <span className="font-mono text-indigo-600">{formatPrice(grandTotalCost)}</span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full border-0 cursor-pointer py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-indigo-100 mt-2"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        {t.place_order_btn}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* A. DEEPLY DETAILED PRODUCT SPECIFICATION MODAL (AMAZON/NOON/ALIBABA STYLE) */}
      <AnimatePresence>
        {selectedProduct && (() => {
          const imagesList = selectedProduct.imageUrls || (selectedProduct.imageUrl ? [selectedProduct.imageUrl] : []);
          const activeImg = imagesList[activeImageIndex] || '';

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedProduct(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              />

              {/* Card Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-150 relative z-10 flex flex-col md:flex-row overflow-hidden"
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-4 right-4 z-20 p-2 text-gray-505 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Left Side: Professional Picture Deck & Carousels */}
                <div className="md:w-1/2 p-6 bg-gray-50 flex flex-col justify-between border-r border-gray-150">
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
                    {activeImg ? (
                      <img
                        src={activeImg}
                        alt={selectedProduct.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Soup className="w-16 h-16 text-gray-200" />
                    )}

                    <div className="absolute top-3 left-3 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {selectedProduct.category}
                    </div>
                  </div>

                  {/* Thumbnail Deck Slider if multi images exist (Amazon/Noon style) */}
                  {imagesList.length > 1 && (
                    <div className="flex gap-2.5 overflow-x-auto py-3 mt-3 scrollbar-none justify-center">
                      {imagesList.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setActiveImageIndex(i)}
                          className={`w-14 h-14 rounded-lg overflow-hidden border-2 cursor-pointer transition-all flex-shrink-0 bg-white ${
                            activeImageIndex === i ? 'border-indigo-600 scale-103' : 'border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Side: Information Deck, Quantity Select, Add Button */}
                <div className="md:w-1/2 p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full inline-block">
                      {lang === 'ar' ? 'تفاصيل الوجبة الفاخرة' : 'PREMIUM MEAL DETAILS'}
                    </span>
                    <h3 className="text-2xl font-black text-gray-905 tracking-tight leading-tight">
                      {selectedProduct.name}
                    </h3>

                    <div className="py-2.5 border-y border-dashed border-gray-150 flex items-center justify-between">
                      <span className="text-xs text-gray-505 font-bold">
                        {lang === 'ar' ? 'سعر القطعة المعتمد:' : 'Unit Price:'}
                      </span>
                      <span className="text-xl font-black text-orange-600 font-mono">
                        {formatPrice(selectedProduct.price)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                        {lang === 'ar' ? 'الوصف والمكونات:' : 'About this item:'}
                      </h4>
                      <p className="text-xs text-gray-505 leading-relaxed font-sans max-h-[150px] overflow-y-auto">
                        {selectedProduct.description || (lang === 'ar' ? 'وصف شهي متكامل محضر طازج ومميز مع نكهات المطبخ الفريدة من نوعها.' : 'No description specified for this delicious recipe.')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    {/* Quantity selectors */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700">
                        {lang === 'ar' ? 'الكمية المطلوبة:' : 'Quantity:'}
                      </span>

                      <div className="flex items-center gap-3 bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
                        <button
                          type="button"
                          onClick={() => setSelectedProductQty(prev => Math.max(1, prev - 1))}
                          className="w-8 h-8 rounded-xl bg-white hover:bg-gray-200 text-gray-805 flex items-center justify-center font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-extrabold text-gray-905 min-w-[28px] text-center font-sans">
                          {selectedProductQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedProductQty(prev => prev + 1)}
                          className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Total projection cost */}
                    <div className="flex justify-between items-center text-xs text-gray-550">
                      <span>{lang === 'ar' ? 'إجمالي السعر للكمية:' : 'Subtotal:'}</span>
                      <span className="font-extrabold text-gray-805 text-sm font-mono">
                        {formatPrice(selectedProduct.price * selectedProductQty)}
                      </span>
                    </div>

                    {/* Submit Add button */}
                    <button
                      type="button"
                      onClick={() => {
                        const existing = cart.find(i => i.id === selectedProduct.id);
                        if (existing) {
                          setCart(cart.map(i => i.id === selectedProduct.id ? { ...i, quantity: i.quantity + selectedProductQty } : i));
                        } else {
                          setCart([...cart, { id: selectedProduct.id, name: selectedProduct.name, price: selectedProduct.price, quantity: selectedProductQty }]);
                        }
                        setSelectedProduct(null);
                      }}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-3.5 px-5 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-100 transition-all active:scale-99"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      {lang === 'ar' ? 'إضافة الوجبة لسلة المشتريات' : 'Add quantities to Tray'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* B. WHATSAPP DETAILED CONFIRMATION REDIRECT MODAL */}
      <AnimatePresence>
        {showWhatsAppModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setShowWhatsAppModal(false)}
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-7 max-w-md w-full shadow-2xl relative z-10 text-center space-y-6 border border-gray-150"
            >
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-505 animate-pulse">
                <Check className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-gray-905 tracking-tight">
                  {lang === 'ar' ? 'تم تسجيل الطلب بنجاح! 🎉' : 'Order Placed Successfully! 🎉'}
                </h3>
                <p className="text-xs text-gray-505 leading-relaxed">
                  {lang === 'ar' 
                    ? 'تم تسجيل طلبك فورياً في النظام الفوري للمطعم. لضمان التوصيل السريع، يرجى إرسال الفاتورة عبر واتساب إلى المطعم لتأكيد الطلب وشحن الوجبات.' 
                    : 'Your order is recorded in the restaurant queue! To guarantee rapid dispatch, kindly send the instant WhatsApp invoice to the manager.'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4.5 border border-gray-150 flex items-center justify-between text-xs font-semibold">
                <span className="text-gray-600">{lang === 'ar' ? 'رقم الفاتورة:' : 'Order ID:'}</span>
                <span className="font-mono text-gray-950 font-bold">{activeOrderId}</span>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <a
                  href={lastWhatsAppUrl ?? '#'}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShowWhatsAppModal(false)}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-99 hover:-translate-y-0.5 cursor-pointer text-center decoration-transparent"
                >
                  <Phone className="w-4 h-4 animate-bounce" />
                  {lang === 'ar' ? 'إرسال الفاتورة عبر واتساب (تأكيد فوري)' : 'Submit Invoice on WhatsApp'}
                </a>

                <button
                  type="button"
                  onClick={() => setShowWhatsAppModal(false)}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-205 text-gray-655 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {lang === 'ar' ? 'متابعة التصفح والتتبع' : 'Keep browsing & Track'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
