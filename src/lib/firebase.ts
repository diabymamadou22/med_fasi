import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
  disableNetwork,
} from 'firebase/firestore';

// Silence internal Firestore SDK retry and quota logs
try {
  setLogLevel('silent');
} catch {}

// Default configuration from provisioned Firebase project
const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'gen-lang-client-0642060417',
  appId: '1:1042153388421:web:8630a205913b53df62acec',
  apiKey: 'AIzaSyA2lVPrzPZxIrH6i3ITNVYUO7cOnKvni9w',
  authDomain: 'gen-lang-client-0642060417.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-medfasi-a61ace20-d640-4c42-8981-763ab243b0d7',
  storageBucket: 'gen-lang-client-0642060417.firebasestorage.app',
  messagingSenderId: '1042153388421',
};

const getEnvVar = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv && metaEnv[key]) return metaEnv[key];
  } catch {}
  return undefined;
};

// Configuration Firebase compatible Vite, Vercel et AI Studio
export const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY') || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN') || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID') || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET') || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID') || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: getEnvVar('VITE_FIREBASE_APP_ID') || DEFAULT_FIREBASE_CONFIG.appId,
};

// Initialisation de Firebase
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Base de données Firestore avec cache local persistant (IndexedDB multi-onglets)
const databaseId = getEnvVar('VITE_FIREBASE_DATABASE_ID') || DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId;

let firestoreInstance: any = null;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    },
    databaseId && databaseId !== '(default)' ? databaseId : undefined
  );
} catch {
  firestoreInstance = databaseId && databaseId !== '(default)'
    ? getFirestore(app, databaseId)
    : getFirestore(app);
}

export const db = firestoreInstance;

// Si le quota quotidien Firestore est atteint pour ce projet, couper immédiatement les requêtes réseau
// pour éviter le spam 429 et les boucles de backoff du SDK Firebase.
const QUOTA_STORAGE_KEY = 'nid_firestore_quota_exhausted_timestamp';
if (typeof window !== 'undefined' && db) {
  try {
    const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
    const isExhausted = raw ? Date.now() - parseInt(raw, 10) < 4 * 60 * 60 * 1000 : true;
    if (isExhausted) {
      localStorage.setItem(QUOTA_STORAGE_KEY, String(Date.now()));
      disableNetwork(db).catch(() => {});
    }
  } catch {}
}

