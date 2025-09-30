import React, { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import OrderDashboard from './components/OrderDashboard';
import MenuManagement from './components/MenuManagement';
import ReservationManagement from './components/ReservationManagement';
import SettingsPage from './components/SettingsPage';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import CategoryManagement from './components/CategoryManagement';
import SpecialsManagement from './components/SpecialsManagement';
import UserManagement from './components/UserManagement';
import AnalyticsPage from './components/AnalyticsPage';
import { Toaster } from 'react-hot-toast';

// MUI components for the new responsive layout
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Divider, Button, AppBar, Toolbar, IconButton, useTheme, useMediaQuery } from '@mui/material';

// MUI Icons
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import CategoryIcon from '@mui/icons-material/Category';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import SupervisedUserCircleIcon from '@mui/icons-material/SupervisedUserCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import StarIcon from '@mui/icons-material/Star';
import KdsView from './components/KdsView'; 
import DvrIcon from '@mui/icons-material/Dvr'; // Icon for KDS
import PeopleIcon from '@mui/icons-material/People'; // Icon for User Management

const drawerWidth = 240;

function App() {
    const { token, user, isLoading, logout } = useAuth();
    //const [view, setView] = useState(user?.role === 'SUPER_ADMIN' ? 'super' : 'orders');
    const [mobileOpen, setMobileOpen] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md')); // Check for medium screens and down

    const rolesConfig = {
        SUPER_ADMIN: {
            views: { super: <SuperAdminDashboard /> },
            navItems: [{ text: 'Admin Panel', view: 'super', icon: <SupervisedUserCircleIcon /> }],
            defaultView: 'super'
        },
        ADMIN: {
            views: {
                orders: <OrderDashboard />, kds: <KdsView />, analytics: <AnalyticsPage />,
                menu: <MenuManagement />, category: <CategoryManagement />, specials: <SpecialsManagement />,
                reservations: <ReservationManagement />, users: <UserManagement />, settings: <SettingsPage />
            },
            navItems: [
                { text: 'Live Orders', view: 'orders', icon: <DashboardIcon /> },
                { text: 'Kitchen View', view: 'kds', icon: <DvrIcon /> },
                { text: 'Analytics', view: 'analytics', icon: <BarChartIcon /> },
                { text: 'Menu Management', view: 'menu', icon: <RestaurantMenuIcon /> },
                { text: 'Category Management', view: 'category', icon: <CategoryIcon /> },
                { text: 'Specials', view: 'specials', icon: <StarIcon /> },
                { text: 'Reservations', view: 'reservations', icon: <EventSeatIcon /> },
                { text: 'User Management', view: 'users', icon: <PeopleIcon /> },
                { text: 'Settings', view: 'settings', icon: <SettingsIcon /> }
            ],
            defaultView: 'orders'
        },
        KITCHEN_STAFF: {
            views: { kds: <KdsView /> },
            navItems: [{ text: 'Kitchen View', view: 'kds', icon: <DvrIcon /> }],
            defaultView: 'kds'
        }
    };

    // Determine the current user's config
    const currentRole = user?.role || 'GUEST'; // Fallback for safety
    const config = rolesConfig[currentRole] || { views: {}, navItems: [], defaultView: '' };

    const [view, setView] = useState(config.defaultView);

    // When the user changes, reset the view to their role's default
    useEffect(() => {
        if (user) {
            setView(rolesConfig[user.role]?.defaultView);
        }
    }, [user]);
    
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

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const currentViewTitle = config.navItems.find(item => item.view === view)?.text;

    /*const isSuperAdmin = user && user.role === 'SUPER_ADMIN';
    const isAdmin = user && user.role === 'ADMIN';
    const isKitchenStaff = user && user.role === 'KITCHEN_STAFF';

    const adminNavItems = [
        { text: 'Live Orders', view: 'orders', icon: <DashboardIcon /> },
        { text: 'Kitchen View', view: 'kds', icon: <DvrIcon /> },
        { text: 'Analytics', view: 'analytics', icon: <BarChartIcon /> },
        { text: 'Menu Management', view: 'menu', icon: <RestaurantMenuIcon /> },
        { text: 'Category Management', view: 'category', icon: <CategoryIcon /> },
        { text: 'Specials', view: 'specials', icon: <StarIcon /> },
        { text: 'Reservations', view: 'reservations', icon: <EventSeatIcon /> },
        { text: 'User Management', view: 'users', icon: <PeopleIcon /> },
        { text: 'Settings', view: 'settings', icon: <SettingsIcon /> },
    ];

    const superAdminNavItems = [
        { text: 'Admin Panel', view: 'super', icon: <SupervisedUserCircleIcon /> },
    ];

    const currentNavItems = isSuperAdmin ? superAdminNavItems : adminNavItems;
    const currentViewTitle = currentNavItems.find(item => item.view === view)?.text;*/

    const drawerContent = (
        <div>
            <Toolbar sx={{ backgroundColor: '#222', display: 'flex', justifyContent: 'center' }}>
                <Typography variant="h5">{user?.restaurantName || 'Tablo'}</Typography>
            </Toolbar>
            <Divider />
            <List>
                {/* ✅ The nav items are now dynamically generated based on role */}
                {config.navItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton selected={view === item.view} onClick={() => { setView(item.view); if(isMobile) handleDrawerToggle(); }}>
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Box sx={{ position: 'absolute', bottom: 0, width: '100%', p: 2 }}>
                <Button onClick={logout} variant="contained" fullWidth startIcon={<LogoutIcon />} color="error">
                    Logout
                </Button>
            </Box>
        </div>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <Toaster position="top-center" />
            <AppBar
                position="fixed"
                sx={{
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    ml: { md: `${drawerWidth}px` },
                    display: { md: 'none' } // Only display the top bar on mobile
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div">
                        {currentViewTitle}
                    </Typography>
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
            >
                {/* Temporary Drawer for Mobile */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, backgroundColor: '#333', color: 'white' },
                    }}
                >
                    {drawerContent}
                </Drawer>
                {/* Permanent Drawer for Desktop */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, backgroundColor: '#333', color: 'white' },
                    }}
                    open
                >
                    {drawerContent}
                </Drawer>
            </Box>
            <Box component="main"
                sx={{ flexGrow: 1, p: 3, width: { md: `calc(100% - ${drawerWidth}px)` } }}>
                <Toolbar sx={{ display: { md: 'none' } }} />
                {/* ✅ The view is now rendered from the config object */}
                {config.views[view]}
            </Box>
        </Box>
    );
}

export default App;