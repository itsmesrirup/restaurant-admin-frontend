import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import OrderDashboard from './components/OrderDashboard';
import MenuManagement from './components/MenuManagement';
import ReservationManagement from './components/ReservationManagement';
import SettingsPage from './components/SettingsPage';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import CategoryManagement from './components/CategoryManagement';
import AnalyticsPage from './components/AnalyticsPage';
import { Toaster } from 'react-hot-toast';

// MUI components for the new layout
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Divider, Button } from '@mui/material';

// MUI Icons for the sidebar
import DashboardIcon from '@mui/icons-material/Dashboard';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import CategoryIcon from '@mui/icons-material/Category';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import SupervisedUserCircleIcon from '@mui/icons-material/SupervisedUserCircle';
import LogoutIcon from '@mui/icons-material/Logout';

const drawerWidth = 240;

function App() {
    const { token, user, isLoading, logout } = useAuth();
    const [view, setView] = useState(user?.role === 'SUPER_ADMIN' ? 'super' : 'orders');

    if (isLoading) {
        return <div>Loading Application...</div>;
    }

    if (!token) {
        return (
            <>
                <Toaster position="top-center" />
                <LoginPage />
            </>
        );
    }

    const isSuperAdmin = user && user.role === 'SUPER_ADMIN';

    const adminNavItems = [
        { text: 'Live Orders', view: 'orders', icon: <DashboardIcon /> },
        { text: 'Analytics', view: 'analytics', icon: <BarChartIcon /> },
        { text: 'Menu Management', view: 'menu', icon: <RestaurantMenuIcon /> },
        { text: 'Category Management', view: 'category', icon: <CategoryIcon /> },
        { text: 'Reservations', view: 'reservations', icon: <EventSeatIcon /> },
        { text: 'Settings', view: 'settings', icon: <SettingsIcon /> },
    ];

    const superAdminNavItems = [
        { text: 'Admin Panel', view: 'super', icon: <SupervisedUserCircleIcon /> },
    ];

    const drawerContent = (
        <div>
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {isSuperAdmin ? 'Tablo' : user?.restaurantName}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {isSuperAdmin ? 'Super Admin' : 'Restaurant Management'}
                </Typography>
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
            <List>
                {(isSuperAdmin ? superAdminNavItems : adminNavItems).map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton selected={view === item.view} onClick={() => setView(item.view)}>
                            <ListItemIcon sx={{ color: 'white' }}>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Box sx={{ position: 'absolute', bottom: 0, width: '100%', p: 2 }}>
                <Button onClick={logout} variant="contained" fullWidth startIcon={<LogoutIcon />}>
                    Logout
                </Button>
            </Box>
        </div>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <Toaster position="top-center" />
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        backgroundColor: '#333',
                        color: 'white',
                    },
                }}
            >
                {drawerContent}
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 }, backgroundColor: '#f4f4f4', minHeight: '100vh', overflowX: 'auto', width: `calc(100vw - ${drawerWidth}px)` }}>
                {isSuperAdmin && <SuperAdminDashboard />}
                {!isSuperAdmin && view === 'orders' && <OrderDashboard />}
                {!isSuperAdmin && view === 'menu' && <MenuManagement />}
                {!isSuperAdmin && view === 'reservations' && <ReservationManagement />}
                {!isSuperAdmin && view === 'settings' && <SettingsPage />}
                {!isSuperAdmin && view === 'category' && <CategoryManagement />}
                {!isSuperAdmin && view === 'analytics' && <AnalyticsPage />}
            </Box>
        </Box>
    );
}

export default App;