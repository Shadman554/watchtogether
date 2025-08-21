import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add comprehensive error handling to prevent ANY page refreshes
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  console.error('Promise that was rejected:', event.promise);
  console.error('Stack trace:', event.reason?.stack || 'No stack trace available');
  
  // Prevent the default behavior (which might cause page refresh in some browsers)
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  console.error('Error source:', event.filename, 'Line:', event.lineno);
  // Don't let errors cause page refresh
  event.preventDefault();
});

// Prevent any accidental page refreshes from keyboard shortcuts or other events
window.addEventListener('beforeunload', (event) => {
  // Only show warning if there's actually a video playing
  const video = document.querySelector('video');
  const iframe = document.querySelector('iframe');
  
  if (video || iframe) {
    // Cancel the event to prevent refresh
    event.preventDefault();
    // Chrome requires setting returnValue
    event.returnValue = '';
    console.log('Prevented potential page refresh during video playback');
  }
});

// Monitor for reload attempts without overriding (since reload is read-only)
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function(...args) {
  console.log('Navigation intercepted:', args);
  return originalPushState.apply(history, args);
};

history.replaceState = function(...args) {
  console.log('History replacement intercepted:', args);
  return originalReplaceState.apply(history, args);
};

createRoot(document.getElementById("root")!).render(<App />);
