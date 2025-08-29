import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import OrderDashboard from './components/OrderDashboard';
import MenuManagement from './components/MenuManagement';
import { Toaster } from 'react-hot-toast';

function App() {
  // 1. Get the token from the AuthContext
  const { token, logout } = useAuth();
  
  // 2. State for managing the view
  const [view, setView] = useState('orders');

  // 3. This is the "Auth Guard". If there's no token, we ONLY render the LoginPage.
  // The rest of the component code does not execute.
  if (!token) {
    return (
      <>
        <Toaster position="top-center" />
        <LoginPage />
      </>
    );
  }

  // 4. If there IS a token, we render the main application layout.
  return (
    <div>
      <Toaster position="top-center" />

      {/* This is the navigation bar you are not seeing */}
      <nav style={{ background: '#333', padding: '1rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Restaurant Management</h1>
        </div>
        <div>
            <button onClick={() => setView('orders')} style={{ marginRight: '10px' }}>Live Orders</button>
            <button onClick={() => setView('menu')} style={{ marginRight: '10px' }}>Menu Management</button>
            <button onClick={logout}>Logout</button>
        </div>
      </nav>

      {/* This is the main content area where the dashboard is rendered */}
      <main style={{ padding: '1rem' }}>
        {view === 'orders' && <OrderDashboard />}
        {view === 'menu' && <MenuManagement />}
      </main>
    </div>
  );
}

export default App;