import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import LegalPage from './LegalPage.jsx'

import './index.css' // <-- This line is essential. It loads all the styles.

const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
const isLegalPage = pathname === '/terms-and-licenses' || pathname === '/legal';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isLegalPage ? <LegalPage /> : <App />}
  </React.StrictMode>,
)
