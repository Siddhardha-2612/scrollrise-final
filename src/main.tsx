import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';
import { ErrorBoundary } from './ErrorBoundary';

window.addEventListener('error', (e) => {
  console.log("Global Error Caught:", e.message);
});

window.addEventListener('unhandledrejection', (e) => {
  console.log("Global Rejection Caught:", e.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

