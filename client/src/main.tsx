import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add global error handling to prevent page refreshes
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  console.error('Promise that was rejected:', event.promise);
  console.error('Stack trace:', event.reason?.stack || 'No stack trace available');
  
  // Prevent the default behavior (which might cause page refresh in some browsers)
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Don't let errors cause page refresh
  event.preventDefault();
});

createRoot(document.getElementById("root")!).render(<App />);
