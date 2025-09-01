import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import OrderDashboard from './components/OrderDashboard';
import MenuManagement from './components/MenuManagement';
import ReservationManagement from './components/ReservationManagement';
import SettingsPage from './components/SettingsPage';
import { Toaster } from 'react-hot-toast';

function App() {
  const { token, user, isLoading, logout } = useAuth(); // Get isLoading state
  const [view, setView] = useState('orders');

  // Show a global loading spinner while the auth state is being determined
  if (isLoading) {
    return <div>Loading Application...</div>;
  }

  // If not loading and no token, show the login page
  if (!token) {
    return (
      <>
        <Toaster position="top-center" />
        <LoginPage />
      </>
    );
  }

  // If not loading and there IS a token, show the dashboard
  return (
    <div>
      <Toaster position="top-center" />
      <nav style={{ background: '#333', padding: '1rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Restaurant Management</h1>
        </div>
        <div>
            <button onClick={() => setView('orders')} style={{ marginRight: '10px' }}>Live Orders</button>
            <button onClick={() => setView('menu')} style={{ marginRight: '10px' }}>Menu Management</button>
            <button onClick={() => setView('reservations')} style={{ marginRight: '10px' }}>Reservations</button>
            <button onClick={() => setView('settings')}>Settings</button>
            <button onClick={logout}>Logout</button>
        </div>
      </nav>
      <main style={{ padding: '1rem' }}>
        {view === 'orders' && <OrderDashboard />}
        {view === 'menu' && <MenuManagement />}
        {view === 'reservations' && <ReservationManagement />}
        {view === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}

export default App;