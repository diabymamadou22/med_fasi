import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './lib/pwaService';

// Graceful interception of Firestore daily quota exhausted rejections & console logs
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const combined = args.map((a) => (typeof a === 'object' ? (a?.message || JSON.stringify(a)) : String(a || ''))).join(' ').toLowerCase();
    if (
      combined.includes('resource-exhausted') ||
      combined.includes('quota limit exceeded') ||
      combined.includes('using maximum backoff delay') ||
      (combined.includes('@firebase/firestore') && combined.includes('quota'))
    ) {
      // Silence internal Firestore SDK retry loop errors when free tier quota limit is reached
      return;
    }
    originalConsoleError.apply(console, args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = (reason?.message || String(reason || '')).toLowerCase();
    const code = (reason?.code || '').toLowerCase();
    if (
      code === 'resource-exhausted' ||
      msg.includes('quota') ||
      msg.includes('resource-exhausted') ||
      msg.includes('limit exceeded')
    ) {
      event.preventDefault();
    }
  });
}

// Initialize PWA Service Worker for offline support and background web notifications
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
