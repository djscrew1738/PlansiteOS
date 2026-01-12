import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';
import OfflineBanner from './components/OfflineBanner';
import useServiceWorker from './hooks/useServiceWorker';

function AppShell() {
  useServiceWorker();
  return (
    <>
      <OfflineBanner />
      <App />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  </React.StrictMode>
);
