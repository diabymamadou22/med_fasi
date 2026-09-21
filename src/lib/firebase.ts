import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

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

// Configuration Firebase compatible Vite, Vercel et AI Studio
export const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
};

// Initialisation de Firebase
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Base de données Firestore avec cache local persistant (IndexedDB multi-onglets)
const databaseId = (import.meta as any).env?.VITE_FIREBASE_DATABASE_ID || DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId;

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

