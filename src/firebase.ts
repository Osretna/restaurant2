import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, set, get, onValue, update, child } from 'firebase/database';

export const firebaseConfig = {
  apiKey: "AIzaSyAzbuMVzDNcFFDZzUYqUVB9x7wAKitOI3Q",
  authDomain: "food-9cb69.firebaseapp.com",
  databaseURL: "https://food-9cb69-default-rtdb.firebaseio.com",
  projectId: "food-9cb69",
  storageBucket: "food-9cb69.firebasestorage.app",
  messagingSenderId: "191499198052",
  appId: "1:191499198052:web:86f0a16b9e263bec2d0971",
  measurementId: "G-V8ZQXL89PW"
};

// Initialize Firebase
let app;
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
} catch (error) {
  console.warn("Could not bootstrap Firebase App:", error);
}

export const auth = app ? getAuth(app) : null;
export const rtdb = app ? getDatabase(app) : null;

// Pure WebAudio API Chime Synthesizer
// Play a warm, clean notification sound without depending on remote audio elements
export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const context = new AudioContextClass();
    
    // Core chime parameters - warm bell synth
    const now = context.currentTime;
    
    // First high note
    const osc1 = context.createOscillator();
    const gain1 = context.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    
    osc1.connect(gain1);
    gain1.connect(context.destination);
    
    // Secondary harmony note
    const osc2 = context.createOscillator();
    const gain2 = context.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
    osc2.frequency.setValueAtTime(1046.5, now + 0.22); // C6
    gain2.gain.setValueAtTime(0.1, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    
    osc2.connect(gain2);
    gain2.connect(context.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.8);
    
    osc2.start(now + 0.08);
    osc2.stop(now + 1.2);
  } catch (err) {
    console.warn("Audio Context sound failed to boot, playing simple alert: ", err);
  }
}
