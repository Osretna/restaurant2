import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store, ClipboardList, ChefHat, Truck, CheckCircle, Save, Plus, Trash2, 
  Eye, Volume2, Phone, DollarSign, Tag, Info, AlertTriangle, ToggleLeft, ToggleRight, Pencil, Heart,
  FileSpreadsheet, Upload, Download, FileUp, FileDown, Check
} from 'lucide-react';
import { Order, MenuItem, Restaurant } from '../types';
import { playNotificationSound } from '../firebase';

interface OwnerPanelProps {
  restaurantId: string;
  orders: Order[];
  restaurants: Restaurant[];
  onUpdateMenu: (restaurantId: string, updatedMenu: MenuItem[]) => void;
  onUpdateShippingFee: (restaurantId: string, fee: number) => void;
  onUpdateOrderStatus: (orderId: string, status: any, trackingStatus: any) => void;
  lang: 'ar' | 'en';
  t: any;
}

export default function OwnerPanel({
  restaurantId,
  orders,
  restaurants,
  onUpdateMenu,
  onUpdateShippingFee,
  onUpdateOrderStatus,
  lang,
  t
}: OwnerPanelProps) {
  // Find current restaurant
  const currentRestaurant = restaurants.find(r => r.id === restaurantId);

  // Form states for menu creation
  const [shippingInput, setShippingInput] = useState(currentRestaurant?.shippingFee || 0);
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [foodPrice, setFoodPrice] = useState('');
  const [foodCategory, setFoodCategory] = useState('Burgers');
  const [foodDesc, setFoodDesc] = useState('');
  const [foodImageUrlsInput, setFoodImageUrlsInput] = useState(''); // Multiple image links state

  // Form states for menu item editing
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [deletingFoodId, setDeletingFoodId] = useState<string | null>(null);
  const [editFoodName, setEditFoodName] = useState('');
  const [editFoodPrice, setEditFoodPrice] = useState('');
  const [editFoodCategory, setEditFoodCategory] = useState('Burgers');
  const [editFoodDesc, setEditFoodDesc] = useState('');
  const [editFoodImageUrls, setEditFoodImageUrls] = useState('');

  // Excel bulk import & export states
  const [showExcelManager, setShowExcelManager] = useState(false);
  const [excelSuccess, setExcelSuccess] = useState<string | null>(null);
  const [excelError, setExcelError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Currency utility helper
  const formatPrice = (price: number) => {
    return lang === 'ar' ? `${price.toFixed(2)} ج.م` : `${price.toFixed(2)} EGP`;
  };

  // Local sync settings values
  useEffect(() => {
    if (currentRestaurant) {
      setShippingInput(currentRestaurant.shippingFee);
    }
  }, [currentRestaurant]);

  // Filter orders for this owner's restaurant that are certified/accepted
  const activeRestaurantOrders = orders.filter(o => 
    o.restaurantId === restaurantId && o.status !== 'pending'
  );

  // Trigger real-time sound notification when a confirmed order comes in
  const confirmedOrdersCount = activeRestaurantOrders.filter(o => o.status === 'confirmed').length;
  
  useEffect(() => {
    if (confirmedOrdersCount > 0) {
      playNotificationSound();
    }
  }, [confirmedOrdersCount]);

  if (!currentRestaurant) {
    return (
      <div className="bg-red-50 text-red-800 p-6 rounded-2xl text-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
        <p className="font-semibold">{lang === 'ar' ? 'عذراً! لم يتم العثور على مطعم مرتبط بحسابك.' : 'No restaurant associated with this Owner account.'}</p>
        <p className="text-xs text-red-600 mt-1">Please register your restaurant outlet with the platform administrator.</p>
      </div>
    );
  }

  // EXCEL CSV Parsing helper
  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentValue = '';

    // Normalize newlines and strip potential BOM from beginning of file
    const cleanText = text.replace(/^\ufeff/, '').replace(/\r/g, '');

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped double quote
          currentValue += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentValue);
        currentValue = '';
      } else if (char === '\n' && !inQuotes) {
        row.push(currentValue);
        lines.push(row);
        row = [];
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    if (currentValue || row.length > 0) {
      row.push(currentValue);
      lines.push(row);
    }
    return lines;
  };

  // EXCEL CSV Template Exporter
  const handleDownloadTemplate = () => {
    const headers = lang === 'ar'
      ? ['المعرف_id', 'الاسم_name', 'السعر_price', 'الفئة_category', 'الوصف_description', 'روابط_الصور_imageurls']
      : ['id', 'name', 'price', 'category', 'description', 'imageurls'];
    
    const rows = [headers];
    const menuItems = currentRestaurant.menu || [];
    
    if (menuItems.length > 0) {
      menuItems.forEach(item => {
        rows.push([
          item.id,
          item.name,
          item.price.toString(),
          item.category || 'Burgers',
          item.description || '',
          (item.imageUrls || (item.imageUrl ? [item.imageUrl] : [])).join('; ')
        ]);
      });
    } else {
      // Dummy sample row
      if (lang === 'ar') {
        rows.push([
          '',
          'برجر كلاسيك لحم شيدر',
          '135.00',
          'Burgers',
          'شريحة لحم مشوي مع جبنة شيدر غنية والخس الطازج',
          'https://images.unsplash.com/photo-1568901346375-23c9450c58cd'
        ]);
      } else {
        rows.push([
          '',
          'Classic Cheddar Beef Burger',
          '135.00',
          'Burgers',
          'Grilled beef patty with rich cheddar cheese and fresh lettuce',
          'https://images.unsplash.com/photo-1568901346375-23c9450c58cd'
        ]);
      }
    }

    const csvContent = "\ufeff" + rows.map(r => r.map(val => {
      const cleanVal = val.toString().replace(/"/g, '""');
      if (cleanVal.includes(',') || cleanVal.includes('\n') || cleanVal.includes('"') || cleanVal.includes(';')) {
        return `"${cleanVal}"`;
      }
      return cleanVal;
    }).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const filename = `${currentRestaurant.name.replace(/\s+/g, '_')}_menu_sheet.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Drag and Drop File Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error("Empty file content");
        
        const rows = parseCSV(text);
        if (rows.length < 2) {
          setExcelError(lang === 'ar' ? 'الملف فارغ أو لا يحتوي على صفوف بيانات!' : 'Classified CSV template has empty rows!');
          setExcelSuccess(null);
          return;
        }

        const headers = rows[0];
        let idIdx = -1;
        let nameIdx = -1;
        let priceIdx = -1;
        let categoryIdx = -1;
        let descIdx = -1;
        let imageIdx = -1;

        headers.forEach((h, idx) => {
          const lower = h.toLowerCase().trim();
          if (lower.includes('معرف') || lower.includes('id')) idIdx = idx;
          else if (lower.includes('اسم') || lower.includes('name')) nameIdx = idx;
          else if (lower.includes('سعر') || lower.includes('price')) priceIdx = idx;
          else if (lower.includes('فئة') || lower.includes('category')) categoryIdx = idx;
          else if (lower.includes('وصف') || lower.includes('description') || lower.includes('desc')) descIdx = idx;
          else if (lower.includes('رابط') || lower.includes('صورة') || lower.includes('صور') || lower.includes('image') || lower.includes('img') || lower.includes('url')) imageIdx = idx;
        });

        // Smart fallbacks if header names were slightly modified
        if (nameIdx === -1) {
          nameIdx = headers.findIndex(h => h.trim().length > 0 && !h.toLowerCase().includes('id') && !h.toLowerCase().includes('price') && !h.toLowerCase().includes('category'));
        }
        if (priceIdx === -1) {
          priceIdx = headers.findIndex(h => h.toLowerCase().includes('price') || h.toLowerCase().includes('سعر') || h.toLowerCase().includes('cost'));
        }

        // Complete standard template fallback if all fails to match
        if (nameIdx === -1) nameIdx = 1;
        if (priceIdx === -1) priceIdx = 2;
        if (categoryIdx === -1) categoryIdx = 3;
        if (descIdx === -1) descIdx = 4;
        if (imageIdx === -1) imageIdx = 5;

        const importedItems: MenuItem[] = [];
        const currentMenu = currentRestaurant.menu || [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length === 0 || (row.length === 1 && !row[0])) continue;

          let parsedId = (idIdx !== -1 && row[idIdx]) ? row[idIdx].trim() : '';
          if (!parsedId || parsedId === '') {
            parsedId = "food_" + (Date.now() + i).toString();
          }

          const name = nameIdx !== -1 && row[nameIdx] ? row[nameIdx].trim() : '';
          if (!name) continue; // Skip unnamed items

          let rawPrice = priceIdx !== -1 && row[priceIdx] ? row[priceIdx].trim() : '0';
          rawPrice = rawPrice.replace(/[^0-9.]/g, '');
          const price = parseFloat(rawPrice) || 0;

          const category = categoryIdx !== -1 && row[categoryIdx] ? row[categoryIdx].trim() : 'Burgers';
          const description = descIdx !== -1 && row[descIdx] ? row[descIdx].trim() : '';
          
          const rawImagesString = imageIdx !== -1 && row[imageIdx] ? row[imageIdx].trim() : '';
          const urlsArray = rawImagesString
            ? rawImagesString.split(/[;\n,]+/).map(u => u.trim()).filter(u => u.length > 0)
            : [];

          importedItems.push({
            id: parsedId,
            name,
            price,
            category,
            description,
            available: true,
            imageUrl: urlsArray[0] || '',
            imageUrls: urlsArray
          });
        }

        if (importedItems.length === 0) {
          setExcelError(lang === 'ar' ? 'لم نتمكن من العثور على وجبات صالحة مضافة بالملف لتحديثها.' : 'No eligible meal items discovered in uploaded sheet.');
          setExcelSuccess(null);
          return;
        }

        const updatedCatalog = [...currentMenu];
        let updatedCount = 0;
        let addedCount = 0;

        importedItems.forEach(imported => {
          const existingIndex = updatedCatalog.findIndex(item => item.id === imported.id);
          if (existingIndex !== -1) {
            updatedCatalog[existingIndex] = {
              ...updatedCatalog[existingIndex],
              ...imported
            };
            updatedCount++;
          } else {
            updatedCatalog.push(imported);
            addedCount++;
          }
        });

        onUpdateMenu(restaurantId, updatedCatalog);
        setExcelSuccess(
          lang === 'ar'
            ? `🎉 تم ملء وتحديث المنيو بنجاح! تم إضافة ${addedCount} وجبة جديدة وتحديث بيانات ${updatedCount} وجبة موجودة بالدقة المطلوبة دون أي تداخل يدويا.`
            : `🎉 SaaS Menu populated successfully! Added ${addedCount} brand new recipes and optimized ${updatedCount} existing entries seamless.`
        );
        setExcelError(null);
      } catch (err: any) {
        setExcelError(lang === 'ar' ? 'حدث خطأ أثناء قراءة البيانات. يرجى مراجعة تناسق الملف المرفوع.' : 'An error occurred. Check consistency of uploaded matrix values.');
        setExcelSuccess(null);
      }
    };
    reader.readAsText(file);
  };

  // Update shipping fee
  const handleSaveShipping = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateShippingFee(restaurantId, shippingInput);
    alert(lang === 'ar' ? 'تم تحديث قيمة الشحن وجدول الشحنات بنجاح!' : 'Shipping tariff updated successfully!');
  };

  // Add menu item
  const handleAddFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName || !foodPrice) {
      alert(lang === 'ar' ? 'الرجاء ملء اسم الطعام وسعره!' : 'Please specify dish name and pricing!');
      return;
    }

    const urlsArray = foodImageUrlsInput
      .split(/[\n,]+/)
      .map(u => u.trim())
      .filter(u => u.length > 0);

    const newItem: MenuItem = {
      id: "food_" + Date.now().toString(),
      name: foodName,
      price: parseFloat(foodPrice),
      description: foodDesc,
      category: foodCategory,
      available: true,
      imageUrl: urlsArray[0] || '',
      imageUrls: urlsArray
    };

    const updatedCatalog = [...(currentRestaurant.menu || []), newItem];
    onUpdateMenu(restaurantId, updatedCatalog);

    // Reset states
    setFoodName('');
    setFoodPrice('');
    setFoodDesc('');
    setFoodImageUrlsInput('');
    setIsAddingFood(false);
  };

  // Edit menu item submit
  const handleEditFoodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFoodId || !editFoodName || !editFoodPrice) {
      alert(lang === 'ar' ? 'الرجاء ملء اسم الطعام وسعره!' : 'Please specify dish name and pricing!');
      return;
    }

    const editUrlsArray = editFoodImageUrls
      .split(/[\n,]+/)
      .map(u => u.trim())
      .filter(u => u.length > 0);

    const updatedCatalog = (currentRestaurant.menu || []).map(item => {
      if (item.id === editingFoodId) {
        return {
          ...item,
          name: editFoodName,
          price: parseFloat(editFoodPrice),
          category: editFoodCategory,
          description: editFoodDesc,
          imageUrl: editUrlsArray[0] || '',
          imageUrls: editUrlsArray
        };
      }
      return item;
    });

    onUpdateMenu(restaurantId, updatedCatalog);
    setEditingFoodId(null);
  };

  // Delete menu item
  const handleDeleteFood = (foodId: string) => {
    const filteredCatalog = (currentRestaurant.menu || []).filter(item => item.id !== foodId);
    onUpdateMenu(restaurantId, filteredCatalog);
  };

  // Toggle availability of food items
  const handleToggleAvailability = (foodId: string) => {
    const updatedCatalog = (currentRestaurant.menu || []).map(item => {
      if (item.id === foodId) {
        return { ...item, available: !item.available };
      }
      return item;
    });
    onUpdateMenu(restaurantId, updatedCatalog);
  };

  // Toggle favorite of food items
  const handleToggleFavorite = (foodId: string) => {
    const updatedCatalog = (currentRestaurant.menu || []).map(item => {
      if (item.id === foodId) {
        return { ...item, isFavorite: !item.isFavorite };
      }
      return item;
    });
    onUpdateMenu(restaurantId, updatedCatalog);
  };

  return (
    <div className="space-y-8 animate-fade-in" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Brand Header Banner */}
      <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 p-6 rounded-3xl border border-orange-100 flex flex-wrap justify-between items-center gap-4">
        <div>
          <span className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-bold">
            {lang === 'ar' ? 'صاحب مطعم شريك' : 'SaaS Active Partner Kitchen'}
          </span>
          <h2 className="text-2xl font-bold text-gray-900 mt-2">{currentRestaurant.name}</h2>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" /> {currentRestaurant.phone}
          </p>
        </div>

        {/* Real-time sound notification testing */}
        <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-orange-50 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </div>
            <span className="text-xs font-semibold text-gray-700">{t.sound_notify_label}</span>
          </div>
          <button
            onClick={() => {
              playNotificationSound();
            }}
            className="p-1 px-2 text-[10px] sm:text-xs font-bold border border-orange-200 text-orange-600 bg-orange-50 hover:bg-orange-100 active:scale-95 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
          >
            <Volume2 className="w-4 h-4" />
            {t.sound_test_btn}
          </button>
        </div>
      </div>

      {/* Main SaaS Kitchen Grid Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Dynamic Orders Queue Feed (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2 pb-3 border-b border-gray-100">
              <ClipboardList className="w-5 h-5 text-orange-600" />
              {t.owner_orders_list}
              {confirmedOrdersCount > 0 && (
                <span className="bg-red-500 text-white animate-bounce text-xs font-bold px-2.5 py-1 rounded-full">
                  {confirmedOrdersCount} {lang === 'ar' ? 'جديد' : 'new'}
                </span>
              )}
            </h3>

            <AnimatePresence mode="popLayout">
              {activeRestaurantOrders.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-16 text-center text-gray-400"
                >
                  <ChefHat className="w-14 h-14 text-orange-100 mx-auto mb-3" />
                  <p className="text-sm font-medium">{lang === 'ar' ? 'قائمة الطلبات المعتمدة فارغة حالياً.' : 'Your verified kitchen dispatch queue is empty.'}</p>
                  <p className="text-xs text-gray-400 mt-1">{lang === 'ar' ? 'بمجرد أن يقوم الأدمن بتعميد طلب جديد لك، سيظهر هنا فوراً مع رنين إشغار.' : 'Once orders are certified by the support admin, they pop here instantly.'}</p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {activeRestaurantOrders.map(order => {
                    const isNew = order.status === 'confirmed';
                    return (
                      <motion.div
                        key={order.id}
                        layoutId={`owner-order-${order.id}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`p-5 rounded-2xl border transition-all space-y-4 ${
                          isNew 
                            ? 'bg-amber-50/20 border-amber-200 shadow-md ring-1 ring-amber-200' 
                            : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
                        }`}
                      >
                        {/* Order Header */}
                        <div className="flex justify-between items-start gap-2 flex-wrap">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold bg-gray-100 text-gray-800 px-2.5 py-1 rounded-md">
                                #{order.id}
                              </span>
                              {isNew && (
                                <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md animate-pulse">
                                  {lang === 'ar' ? 'مطلوب تحضيرها!' : 'ACTION REQUIRED'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(order.createdAt).toLocaleString()}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full inline-block ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'confirmed' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              order.status === 'cooking' ? 'bg-orange-100 text-orange-850' :
                              order.status === 'delivering' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-850'
                            }`}>
                              {t[order.status === 'confirmed' ? 'status_certified' : `status_${order.status}`] || order.status}
                            </span>
                            <p className="text-sm font-bold text-gray-900 mt-1">{formatPrice(order.total)}</p>
                          </div>
                        </div>

                        {/* Customer Box Details */}
                        <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1 text-gray-600 border border-gray-100">
                          <p className="font-semibold text-gray-800 flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
                            {order.customerInfo?.name || (lang === 'ar' ? 'عميل زائر' : 'Guest Customer')}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {order.customerInfo?.phone || '—'}
                          </p>
                          <p className="flex items-center gap-1.5 font-sans">
                            <span className="font-semibold">{lang === 'ar' ? 'العنوان:' : 'Addr:'}</span>
                            {order.customerInfo?.address || '—'}
                          </p>
                        </div>

                        {/* Items summary */}
                        <div className="text-xs space-y-1.5 pt-1 border-t border-dashed border-gray-100">
                          {(order.items || []).map(item => (
                            <div key={item?.id || Math.random().toString()} className="flex justify-between items-center text-gray-700">
                              <span>
                                {item?.name || ''} 
                                <strong className="text-orange-600 font-bold ml-1.5">x{item?.quantity || 1}</strong>
                              </span>
                              <span>{formatPrice((item?.price || 0) * (item?.quantity || 0))}</span>
                            </div>
                          ))}
                        </div>

                        {/* Order Phase Advance Controls */}
                        <div className="pt-3 border-t border-gray-100 flex gap-2 overflow-x-auto">
                          {/* Prepare action */}
                          {order.status === 'confirmed' && (
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, 'cooking', 'preparing')}
                              className="flex-1 cursor-pointer py-2 px-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all shadow-sm"
                            >
                              <ChefHat className="w-4 h-4" />
                              {t.status_cooking}
                            </button>
                          )}

                          {/* Dispatch action */}
                          {order.status === 'cooking' && (
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, 'delivering', 'on_the_way')}
                              className="flex-1 cursor-pointer py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all shadow-sm"
                            >
                              <Truck className="w-4 h-4" />
                              {t.status_delivering}
                            </button>
                          )}

                          {/* Complete action */}
                          {order.status === 'delivering' && (
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, 'completed', 'delivered')}
                              className="flex-1 cursor-pointer py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all shadow-sm"
                            >
                              <CheckCircle className="w-4 h-4" />
                              {t.status_completed}
                            </button>
                          )}

                          {/* Fallback info when complete */}
                          {order.status === 'completed' && (
                            <div className="w-full flex items-center justify-center text-green-600 text-xs font-semibold gap-1 py-1.5 bg-green-50 rounded-lg">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              {lang === 'ar' ? 'تم تسليم الطلب وتحصيل المبلغ!' : 'Order transferred and completed successfully!'}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Menu Catalog & Rates Management (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Dynamic delivery Fee Setup */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-600" />
              {t.owner_restaurant_settings}
            </h3>

            <form onSubmit={handleSaveShipping} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">{t.shipping_fee_label}</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[10px]">{lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={shippingInput}
                      onChange={(e) => setShippingInput(parseFloat(e.target.value) || 0)}
                      className={`w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-orange-100 focus:border-orange-600 outline-none transition-all font-mono ${lang === 'ar' ? 'pr-12 pl-3' : 'pl-12 pr-3'}`}
                    />
                  </div>
                  <button
                    type="submit"
                    className="py-2 px-4 cursor-pointer bg-gray-900 text-white text-xs font-bold rounded-xl flex items-center gap-1 hover:bg-gray-850 active:scale-95 transition-all shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    {t.save_settings}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Menu items list config */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-orange-600" />
                {t.menu_management}
              </h3>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {/* Manual Add Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingFood(!isAddingFood);
                    setShowExcelManager(false);
                  }}
                  className={`py-1.5 px-3 cursor-pointer rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                    isAddingFood 
                      ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-sm' 
                      : 'bg-gray-100 text-gray-750 hover:bg-gray-200'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t.add_food_btn}
                </button>

                {/* Excel Hub Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setShowExcelManager(!showExcelManager);
                    setIsAddingFood(false);
                    setExcelSuccess(null);
                    setExcelError(null);
                  }}
                  className={`py-1.5 px-3 cursor-pointer rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                    showExcelManager 
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm' 
                      : 'bg-emerald-50 text-emerald-750 hover:bg-emerald-100'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  {lang === 'ar' ? 'استيراد/تصدير إكسل' : 'Excel Tools'}
                </button>
              </div>
            </div>

            {/* Interactive Excel Manager Panel */}
            <AnimatePresence>
              {showExcelManager && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-emerald-50/20 p-4 border border-emerald-100/55 rounded-2xl space-y-4 mb-5 overflow-hidden text-xs text-gray-850"
                >
                  <div className="flex items-start gap-2 bg-emerald-500/5 p-3 rounded-xl border border-emerald-100/30 text-emerald-800 dark:text-emerald-350">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] leading-relaxed">
                      {lang === 'ar'
                        ? 'يمكنك تنزيل تمبليت المنيو المخصص لمطعمك (بصيغة إكسل CSV المتوافقة بالكامل)، حيث يحتوي على البيانات الحالية لتسهيل تعديلها وإضافة أكلات جديدة دفعة واحدة، ثم إعادة رفعه هنا لتمتلئ البيانات آلياً بدون أي تداخل يدوي.'
                        : 'Download a pre-filled matching menu template for your kitchen, update it in Excel with new prices, categories or images, then re-upload it right here for instant automated processing.'}
                    </p>
                  </div>

                  {/* Feedback Blocks */}
                  {excelSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-emerald-100/80 text-emerald-900 duration-155 p-3 rounded-xl border border-emerald-200 text-xs flex items-start gap-2 font-medium"
                    >
                      <Check className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0" />
                      <span>{excelSuccess}</span>
                    </motion.div>
                  )}

                  {excelError && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-red-50 text-red-905 border border-red-200 duration-155 p-3 rounded-xl text-xs flex items-start gap-2 font-medium"
                    >
                      <AlertTriangle className="w-4 h-4 text-red-650 mt-0.5 flex-shrink-0" />
                      <span>{excelError}</span>
                    </motion.div>
                  )}

                  {/* Excel Actions Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Action 1: Export Sheet */}
                    <div className="bg-white p-3.5 rounded-xl border border-gray-150/85 flex flex-col justify-between space-y-3 shadow-2xs">
                      <div>
                        <h4 className="font-bold text-gray-800 flex items-center gap-1">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          {lang === 'ar' ? '1. تحميل التمبليت الشامل' : '1. Get Excel Template'}
                        </h4>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {lang === 'ar' 
                            ? `يحتوي حالياً على (${currentRestaurant.menu?.length || 0}) وجبة جاهزة للتعديل.` 
                            : `Preloaded with (${currentRestaurant.menu?.length || 0}) recipes.`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="w-full py-2 px-3 cursor-pointer bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 font-bold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {lang === 'ar' ? 'تصدير النموذج الممتلئ' : 'Export Template'}
                      </button>
                    </div>

                    {/* Action 2: Import Sheet */}
                    <div className="bg-white p-3.5 rounded-xl border border-gray-150/85 flex flex-col justify-between space-y-3 shadow-2xs">
                      <div>
                        <h4 className="font-bold text-gray-800 flex items-center gap-1">
                          <Upload className="w-4 h-4 text-emerald-600" />
                          {lang === 'ar' ? '2. استيراد ورفع التمبليت' : '2. Send Completed Template'}
                        </h4>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {lang === 'ar' 
                            ? 'سيتم مطابقة الحقول وتحديث المنيو آلياً بالبيانات الجديدة.' 
                            : 'Smart mapped columns will update live instantly.'}
                        </p>
                      </div>

                      <div 
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
                          dragActive 
                            ? 'border-emerald-500 bg-emerald-50/50' 
                            : 'border-emerald-100 hover:border-emerald-400 hover:bg-emerald-50/10'
                        }`}
                      >
                        <input 
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          onChange={handleFileInputChange}
                          className="hidden"
                        />
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600 mx-auto mb-1 animate-pulse" />
                        <p className="text-[10px] font-bold text-gray-700">
                          {lang === 'ar' ? 'اسحب ملف التمبليت هنا أو تصفح' : 'Drop template here or click'}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inline creation modal */}
            <AnimatePresence>
              {isAddingFood && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddFood}
                  className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3 mb-5 overflow-hidden text-xs"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">{t.food_name} *</label>
                      <input
                        type="text"
                        required
                        value={foodName}
                        onChange={(e) => setFoodName(e.target.value)}
                        placeholder="e.g. Garlic bread"
                        className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-2 text-xs outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">{t.food_price} (ج.م) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        required
                        value={foodPrice}
                        onChange={(e) => setFoodPrice(e.target.value)}
                        placeholder="e.g. 5.99"
                        className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-2 text-xs outline-none focus:border-orange-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">{t.food_category}</label>
                      <select
                        value={foodCategory}
                        onChange={(e) => setFoodCategory(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-2 text-xs outline-none focus:border-orange-500"
                      >
                        <option value="Burgers">Burgers</option>
                        <option value="Pizza">Pizza</option>
                        <option value="Pasta">Pasta</option>
                        <option value="Sides">Sides</option>
                        <option value="Desserts">Desserts</option>
                        <option value="Drinks">Drinks</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">{t.food_desc}</label>
                      <input
                        type="text"
                        value={foodDesc}
                        onChange={(e) => setFoodDesc(e.target.value)}
                        placeholder="Short description"
                        className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-2 text-xs outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      {lang === 'ar' ? 'روابط صور المنتج (رابط لكل سطر أو مفصولة بفاصلة):' : 'Product Image Links (One link per line or comma-separated):'}
                    </label>
                    <textarea
                      rows={2}
                      value={foodImageUrlsInput}
                      onChange={(e) => setFoodImageUrlsInput(e.target.value)}
                      placeholder={lang === 'ar' ? 'أدخل روابط صور الأطعمة الممتازة هنا...' : 'Enter premium item image HTTP links here...'}
                      className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-2 text-xs outline-none focus:border-orange-500 font-sans"
                    />
                  </div>

                  <div className="flex gap-2 pt-1.5">
                    <button
                      type="submit"
                      className="flex-1 cursor-pointer py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold"
                    >
                      {lang === 'ar' ? 'إضافة الوجبة' : 'Save Dish'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingFood(false)}
                      className="py-1.5 px-3 cursor-pointer bg-gray-200 hover:bg-gray-300 rounded-lg"
                    >
                      {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Menu Items Table list */}
            <div className="space-y-3.5 max-h-[450px] overflow-y-auto">
              {(!currentRestaurant.menu || currentRestaurant.menu.length === 0) ? (
                <p className="text-xs text-gray-400 text-center py-6">
                  {lang === 'ar' ? 'لا توجد أطعمة مضافة بالمنيو للبيع حالياً.' : 'No items registered in your menu catalog.'}
                </p>
              ) : (
                currentRestaurant.menu.map((item) => {
                  const isEditingThisFood = editingFoodId === item.id;

                  if (isEditingThisFood) {
                    return (
                      <motion.form
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onSubmit={handleEditFoodSubmit}
                        className="p-4 border border-orange-200 bg-orange-50/10 rounded-2xl space-y-3.5 text-xs"
                      >
                        <div className="font-bold text-orange-900 border-b border-orange-100 pb-1 flex justify-between items-center">
                          <span>{lang === 'ar' ? 'تعديل الوجبة' : 'Edit Meal Details'}</span>
                          <span className="text-[9px] bg-orange-100 text-orange-850 px-2 py-0.5 rounded-full font-mono">#{item.id}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block font-bold text-gray-700 mb-1">{t.food_name} *</label>
                            <input
                              type="text"
                              required
                              value={editFoodName}
                              onChange={(e) => setEditFoodName(e.target.value)}
                              className="w-full bg-white border border-gray-250 rounded-lg py-1.5 px-2 text-xs outline-none focus:border-orange-500"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-gray-700 mb-1">{t.food_price} (ج.م) *</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0.1"
                              required
                              value={editFoodPrice}
                              onChange={(e) => setEditFoodPrice(e.target.value)}
                              className="w-full bg-white border border-gray-250 rounded-lg py-1.5 px-2 text-xs outline-none focus:border-orange-500 font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block font-bold text-gray-700 mb-1">{t.food_category}</label>
                            <select
                              value={editFoodCategory}
                              onChange={(e) => setEditFoodCategory(e.target.value)}
                              className="w-full bg-white border border-gray-250 rounded-lg py-1.5 px-2 text-xs outline-none focus:border-orange-500"
                            >
                              <option value="Burgers">Burgers</option>
                              <option value="Pizza">Pizza</option>
                              <option value="Pasta">Pasta</option>
                              <option value="Sides">Sides</option>
                              <option value="Desserts">Desserts</option>
                              <option value="Drinks">Drinks</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-bold text-gray-700 mb-1">{t.food_desc}</label>
                            <input
                              type="text"
                              value={editFoodDesc}
                              onChange={(e) => setEditFoodDesc(e.target.value)}
                              className="w-full bg-white border border-gray-250 rounded-lg py-1.5 px-2 text-xs outline-none focus:border-orange-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-gray-700 mb-1">
                            {lang === 'ar' ? 'تعديل روابط الصور (رابط لكل سطر أو مفصولة بفاصلة):' : 'Edit Image Links (One per line or comma-separated):'}
                          </label>
                          <textarea
                            rows={2}
                            value={editFoodImageUrls}
                            onChange={(e) => setEditFoodImageUrls(e.target.value)}
                            className="w-full bg-white border border-gray-250 rounded-lg py-1.5 px-2 text-xs outline-none focus:border-orange-500 font-sans"
                          />
                        </div>

                        <div className="flex gap-2 pt-1.5 border-t border-gray-100">
                          <button
                            type="submit"
                            className="flex-1 cursor-pointer py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold"
                          >
                            {lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingFoodId(null)}
                            className="py-1.5 px-3 cursor-pointer bg-gray-200 hover:bg-gray-300 rounded-lg"
                          >
                            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                          </button>
                        </div>
                      </motion.form>
                    );
                  }

                   if (deletingFoodId === item.id) {
                    return (
                      <div 
                        key={item.id}
                        className="p-3.5 border border-red-200 bg-red-500/5 dark:bg-red-500/10 rounded-xl flex items-center justify-between text-xs gap-4 w-full"
                      >
                        <p className="text-red-700 dark:text-red-400 font-bold">
                          {lang === 'ar' ? `هل أنت متأكد من حذف وجبة "${item.name}"؟` : `Delete "${item.name}" permanently?`}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              handleDeleteFood(item.id);
                              setDeletingFoodId(null);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2.5 rounded-lg text-xs transition-all cursor-pointer"
                          >
                            {lang === 'ar' ? 'تأكيد الحذف' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setDeletingFoodId(null)}
                            className="bg-gray-200 dark:bg-zinc-850 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-zinc-805 font-bold py-1 px-2.5 rounded-lg text-xs transition-all cursor-pointer"
                          >
                            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 border border-gray-100 bg-gray-50/50 rounded-xl flex items-center justify-between text-xs transition-shadow hover:shadow-xs gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-gray-800">{item.name}</span>
                          <span className="text-[9px] bg-orange-100 text-orange-850 px-1.5 py-0.5 rounded-full font-bold">
                            {item.category}
                          </span>
                          {(item.imageUrls && item.imageUrls.length > 0) && (
                            <span className="text-[8px] bg-gray-200 text-gray-650 px-1 py-0.5 rounded-md font-mono">
                              📸 {item.imageUrls.length} {lang === 'ar' ? 'صور' : 'imgs'}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-[10px] text-gray-400 font-sans line-clamp-1">{item.description}</p>
                        )}
                        <p className="font-bold text-orange-600 font-mono">{formatPrice(item.price)}</p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Favorite toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(item.id)}
                          className="p-1 px-1.5 cursor-pointer rounded-lg transition-all hover:bg-red-50"
                          title={lang === 'ar' ? 'تمييز كوجبة مفضلة' : 'Mark as Favorite/Popular'}
                        >
                          <Heart className={`w-3.5 h-3.5 transition-all ${item.isFavorite ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-400 hover:text-red-500'}`} />
                        </button>

                        {/* Availability toggle */}
                        <button
                          onClick={() => handleToggleAvailability(item.id)}
                          className="cursor-pointer transition-all"
                          title={lang === 'ar' ? 'متاح للطلب' : 'Available for ordering'}
                        >
                          {item.available ? (
                            <span className="text-[9px] bg-green-100 border border-green-200 text-green-700 font-bold px-1.5 py-0.5 rounded-md">
                              {lang === 'ar' ? 'نشط' : 'Active'}
                            </span>
                          ) : (
                            <span className="text-[9px] bg-gray-100 border border-gray-200 text-gray-500 font-bold px-1.5 py-0.5 rounded-md">
                              {lang === 'ar' ? 'مغلق' : 'Paused'}
                            </span>
                          )}
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setEditingFoodId(item.id);
                            setEditFoodName(item.name);
                            setEditFoodPrice(item.price.toString());
                            setEditFoodCategory(item.category || 'Burgers');
                            setEditFoodDesc(item.description || '');
                            setEditFoodImageUrls((item.imageUrls || (item.imageUrl ? [item.imageUrl] : [])).join(', '));
                          }}
                          className="p-1 px-1.5 cursor-pointer text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title={lang === 'ar' ? 'تعديل الوجبة' : 'Edit item'}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeletingFoodId(item.id)}
                          className="p-1 px-1.5 cursor-pointer text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title={lang === 'ar' ? 'حذف الوجبة' : 'Delete item'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
