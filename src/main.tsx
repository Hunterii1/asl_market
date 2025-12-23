import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Initialize Firebase
import './config/firebase'

createRoot(document.getElementById("root")!).render(<App />);

// Register service workers for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Register main service worker
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
    
    // Register Firebase Messaging service worker
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('Firebase Messaging SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('Firebase Messaging SW registration failed: ', registrationError);
      });
  });
}
