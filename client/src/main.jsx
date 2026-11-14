import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Unregister any leftover stale Service Workers registered on localhost:3000 by other local apps
// (this application does not use a service worker, and stale SWs break 206 video range caching).
if (
  typeof window !== 'undefined' &&
  /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname) &&
  'serviceWorker' in navigator
) {
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => {
      registrations.forEach((reg) => {
        reg.unregister().catch(() => {});
      });
    })
    .catch(() => {});
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

