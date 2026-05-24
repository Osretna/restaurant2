import { Restaurant, Order, UserProfile } from './types';

export const seedUsers: UserProfile[] = [
  {
    uid: "admin123",
    email: "s.mohamed1111111@gmail.com",
    role: "admin",
    isFirstLogin: false
  },
  {
    uid: "owner1",
    email: "burger@foody.com",
    role: "owner",
    restaurantId: "rest_burger",
    isFirstLogin: true // Will trigger the mandatory reset password UI
  },
  {
    uid: "owner2",
    email: "italian@foody.com",
    role: "owner",
    restaurantId: "rest_italian",
    isFirstLogin: false
  }
];

export const seedRestaurants: Restaurant[] = [
  {
    id: "rest_burger",
    name: "Burger Lab Express (برجر لاب إكسبريس)",
    ownerUid: "owner1",
    phone: "+966 11 405 1234",
    shippingFee: 4,
    description: "أقوى برجر مشوي على الفحم باختصاص ترافل أسود وصوصات مبتكرة دافئة.",
    menu: [
      {
        id: "b1",
        name: "Smokey Truffle Burger (ترافل برجر المدخن)",
        price: 12.5,
        description: "شريحة لحم بقري مغطاة بجبنة سويسري وفطر الترافل الأسود الفاخر",
        category: "Burgers",
        available: true
      },
      {
        id: "b2",
        name: "Classic Cheddar Burger (كلاسيك تشيدر برجر)",
        price: 9,
        description: "لحم بقري مشوي مع جبن التشيدر المميز والخس الطازج",
        category: "Burgers",
        available: true
      },
      {
        id: "b3",
        name: "Crunchy Chicken Supreme (كرانشي تشيكن سوبريم)",
        price: 10.5,
        description: "صدر دجاج مقرمش مع صلصة الأيولي الحارة وخس مقرمش",
        category: "Burgers",
        available: true
      },
      {
        id: "b4",
        name: "Loaded Cheesy Fries (بطاطس بالجبنة الفاخرة)",
        price: 5,
        description: "بطاطس مقرمشة مع الشيدر السائل المذاب وهالبينو",
        category: "Sides",
        available: true
      }
    ]
  },
  {
    id: "rest_italian",
    name: "Bella Italia (بيلا إيطاليا)",
    ownerUid: "owner2",
    phone: "+966 11 880 5678",
    shippingFee: 6,
    description: "الأطعمة والباستا الإيطالية المطهوة بأيدي إيطالية وأجود المكونات الطازجة.",
    menu: [
      {
        id: "i1",
        name: "Original Neapolitan Margarita (مارغريتا نابوليتان)",
        price: 11,
        description: "صلصة طماطم سان مارزانو، موزاريلا بوفالو، ريحان طازج",
        category: "Pizza",
        available: true
      },
      {
        id: "i2",
        name: "Creamy Fettuccine Alfredo (فيتوتشيني ألفريدو بالكريمة)",
        price: 13.5,
        description: "مكرونة إيطالية بصلصة الألفريدو الغنية، دجاج مشوي برسام",
        category: "Pasta",
        available: true
      },
      {
        id: "i3",
        name: "Spaghetti Bolognese (سباغيتي بولونيز)",
        price: 12,
        description: "لحم مفروم مطبوخ ببطء مع صلصة الطماطم وجبن البارميزان",
        category: "Pasta",
        available: true
      },
      {
        id: "i4",
        name: "Tiramisu della Casa (تيراميسو المنزل الفاخر)",
        price: 6.5,
        description: "تيراميسو إيطالي كريمي محضر بقهوة الإكسبريسو الأصلية والماسكاربوني",
        category: "Desserts",
        available: true
      }
    ]
  }
];

export const seedOrders: Order[] = [
  {
    id: "order_1001",
    restaurantId: "rest_burger",
    restaurantName: "Burger Lab Express (برجر لاب إكسبريس)",
    customerInfo: {
      name: "فيصل الحارثي",
      phone: "0554128930",
      address: "الرياض، حي الصحافة، شارع الملك فهد"
    },
    items: [
      { id: "b1", name: "Smokey Truffle Burger (ترافل برجر المدخن)", price: 12.5, quantity: 2 },
      { id: "b4", name: "Loaded Cheesy Fries (بطاطس بالجبنة الفاخرة)", price: 5, quantity: 1 }
    ],
    total: 34, // (12.5 * 2) + 5 + 4 shipping
    status: "pending", // Awaiting Admin Approval
    trackingStatus: "submitted",
    createdAt: Date.now() - 3600000 // 1 hour ago
  },
  {
    id: "order_1002",
    restaurantId: "rest_italian",
    restaurantName: "Bella Italia (بيلا إيطاليا)",
    customerInfo: {
      name: "عبد الرحمن الدوسري",
      phone: "0506392014",
      address: "جدة، حي الروضة، طريق الكورنيش"
    },
    items: [
      { id: "i1", name: "Original Neapolitan Margarita (مارغريتا نابوليتان)", price: 11, quantity: 1 },
      { id: "i2", name: "Creamy Fettuccine Alfredo (فيتوتشيني ألفريدو بالكريمة)", price: 13.5, quantity: 2 }
    ],
    total: 44, // 11 + 27 + 6 shipping
    status: "confirmed", // Approved by Admin, shows up for Owner
    trackingStatus: "preparing",
    createdAt: Date.now() - 1800000 // 30 mins ago
  }
];
