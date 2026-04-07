import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

try {
  console.log('Creating root');
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );

  console.log('main.tsx executed');
} catch (error) {
  console.error('Error in main.tsx:', error);
}
