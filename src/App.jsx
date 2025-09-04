import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import OrderDashboard from './components/OrderDashboard';
import MenuManagement from './components/MenuManagement';
import ReservationManagement from './components/ReservationManagement';
import SettingsPage from './components/SettingsPage';
import { Toaster } from 'react-hot-toast';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import CategoryManagement from './components/CategoryManagement';

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

  const isSuperAdmin = user && user.role === 'SUPER_ADMIN';

  // If not loading and there IS a token, show the dashboard
  return (
    <div>
      <Toaster position="top-center" />
      <nav style={{ background: '#333', padding: '1rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{isSuperAdmin ? 'Tablo Super Admin' : 'Restaurant Management'}</h1>
        </div>
        <div>
            {/* Regular Admin Buttons */}
            {!isSuperAdmin && <button onClick={() => setView('orders')}>Live Orders</button>}
            {!isSuperAdmin && <button onClick={() => setView('menu')}>Menu Management</button>}
            {!isSuperAdmin && <button onClick={() => setView('reservations')}>Reservations</button>}
            {!isSuperAdmin && <button onClick={() => setView('settings')}>Settings</button>}
            {!isSuperAdmin && <button onClick={() => setView('category')}>Category Management</button>}
            
            {/* Super Admin Button */}
            {isSuperAdmin && <button onClick={() => setView('super')}>Admin Panel</button>}

            <button onClick={logout}>Logout</button>
        </div>
      </nav>
      <main style={{ padding: '1rem' }}>
        {/* Regular Admin Views */}
        {!isSuperAdmin && view === 'orders' && <OrderDashboard />}
        {!isSuperAdmin && view === 'menu' && <MenuManagement />}
        {!isSuperAdmin && view === 'reservations' && <ReservationManagement />}
        {!isSuperAdmin && view === 'settings' && <SettingsPage />}
        {!isSuperAdmin && view === 'category' && <CategoryManagement />}

        {/* Super Admin View */}
        {isSuperAdmin && <SuperAdminDashboard />}
      </main>
    </div>
  );
}

export default App;