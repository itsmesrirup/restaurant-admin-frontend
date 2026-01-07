import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import MenuImporter from './components/MenuImporter';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import StripeCallbackPage from './components/StripeCallbackPage';
import { Toaster } from 'react-hot-toast';

// MUI components
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
import DvrIcon from '@mui/icons-material/Dvr';
import PeopleIcon from '@mui/icons-material/People';
import GlobeIcon from '@mui/icons-material/Language';
import WebsitePage from './components/WebsitePage';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import CommissionPage from './components/CommissionPage';
import SuperAdminCommissionReport from './components/SuperAdminCommissionReport';

const drawerWidth = 240;

// --- Language Switcher Component ---
const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    return (
        <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
                variant={i18n.language === 'en' ? 'contained' : 'outlined'} 
                onClick={() => i18n.changeLanguage('en')}
                size="small"
                sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.5)', minWidth: '40px' }}
            >
                EN
            </Button>
            <Button 
                variant={i18n.language === 'fr' ? 'contained' : 'outlined'} 
                onClick={() => i18n.changeLanguage('fr')}
                size="small"
                sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.5)', minWidth: '40px' }}
            >
                FR
            </Button>
        </Box>
    );
};

function App() {
    const { t } = useTranslation();
    const { token, user, isLoading, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // --- 1. DEFINE STATE FIRST ---
    // We need to initialize this first, but we can't use config.defaultView yet.
    // So we initialize with a safe default or null.
    const [view, setView] = useState('orders'); // Initialize with default

    // --- 2. DEFINE CONFIG AFTER ---
    // Now `setView` exists, so we can use it in the JSX inside `views`.
    const rolesConfig = {
        SUPER_ADMIN: {
            views: { 
                super: <SuperAdminDashboard />,
                commissions: <SuperAdminCommissionReport />,
                importMenu: <MenuImporter />
             },
            navItems: [
                { textKey: 'adminPanel', view: 'super', icon: <SupervisedUserCircleIcon /> },
                { textKey: 'globalCommissions', view: 'commissions', icon: <MonetizationOnIcon /> },
                { textKey: 'importMenu', view: 'importMenu', icon: <CloudUploadIcon /> }
            ],
            defaultView: 'super'
        },
        ADMIN: {
            views: {
                orders: <OrderDashboard />, kds: <KdsView />, analytics: <AnalyticsPage />,
                menu: <MenuManagement />, category: <CategoryManagement />, specials: <SpecialsManagement />,
                reservations: <ReservationManagement />, users: <UserManagement />, website: <WebsitePage />, settings: <SettingsPage />,
                // --- ADDED: The hidden view for the callback ---
                stripeCallback: <StripeCallbackPage onViewChange={setView} />,
                commissions: <CommissionPage />
            },
            navItems: (user = {}) => {
                const features = user.availableFeatures || [];
                const model = user.paymentModel;

                return [
                    { textKey: 'liveOrders', view: 'orders', icon: <DashboardIcon />, feature: 'ORDERS' },
                    { textKey: 'kitchenView', view: 'kds', icon: <DvrIcon />, feature: 'ORDERS' },
                    { textKey: 'analytics', view: 'analytics', icon: <BarChartIcon />, feature: 'ANALYTICS' },
                    { textKey: 'menuManagement', view: 'menu', icon: <RestaurantMenuIcon />, feature: 'MENU' },
                    { textKey: 'categoryManagement', view: 'category', icon: <CategoryIcon />, feature: 'MENU' },
                    { textKey: 'specials', view: 'specials', icon: <StarIcon />, feature: 'SPECIALS' },
                    { textKey: 'reservations', view: 'reservations', icon: <EventSeatIcon />, feature: 'RESERVATIONS' },
                    { textKey: 'userManagement', view: 'users', icon: <PeopleIcon />, feature: 'ORDERS' },
                    { textKey: 'websitePage', view: 'website', icon: <GlobeIcon />, feature: 'WEBSITE_BUILDER' },
                    { textKey: 'commissions', view: 'commissions', icon: <MonetizationOnIcon />, feature: 'ORDERS', model: 'COMMISSION' },
                    { textKey: 'settings', view: 'settings', icon: <SettingsIcon />, feature: 'ORDERS' }
                ].filter(item => 
                    features.includes(item.feature) && (!item.model || item.model === model)
                );
            },
            defaultView: 'orders'
        },
        KITCHEN_STAFF: {
            views: { kds: <KdsView /> },
            navItems: [{ textKey: 'kitchenView', view: 'kds', icon: <DvrIcon /> }],
            defaultView: 'kds'
        }
    };

    // --- 3. HANDLE DEFAULT VIEW ---
    // Now we can calculate the real default view
    const currentRole = user?.role || 'GUEST'; 
    const config = rolesConfig[currentRole] || { views: {}, navItems: [], defaultView: '' };

    useEffect(() => {
        if (user) {
            // Check for Stripe code FIRST
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('code')) {
                setView('stripeCallback');
            } else {
                setView(rolesConfig[user.role]?.defaultView || 'orders');
            }
        }
    }, [user]); // We rely on useEffect to set the correct initial view
    
    // --- ADDED: Check for Stripe Redirect on Initial Load ---
    // If the URL has ?code=..., it means we are coming back from Stripe.
    // We should set the initial view to 'stripeCallback'.
    const getInitialView = () => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('code')) {
            return 'stripeCallback';
        }
        // Default behavior
        if (user?.role === 'SUPER_ADMIN') return 'super';
        if (user?.role === 'KITCHEN_STAFF') return 'kds';
        return 'orders';
    };
    
    if (isLoading) {
        return <div>{t('loadingApp', 'Loading Application...')}</div>;
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

    const navItems = user?.role === 'ADMIN' 
        ? config.navItems(user) 
        : rolesConfig[user?.role]?.navItems || [];

    const currentViewTitle = t(navItems.find(item => item.view === view)?.textKey);

    const drawerContent = (
        <Box 
            sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%' 
            }}
        >
            {/* --- CHANGED: Mobile Header Layout --- */}
            {/* Switched to 'column' layout so Name and Language Switcher stack nicely */}
            <Toolbar sx={{ 
                backgroundColor: '#222', 
                display: 'flex', 
                flexDirection: 'column', // Stack vertical
                alignItems: 'center',    // Center horizontal
                justifyContent: 'center',
                py: 2,                   // Add padding top/bottom
                gap: 1.5                 // Gap between name and buttons
            }}>
                <Typography variant="h5" sx={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
                    {user?.restaurantName || 'Tablo'}
                </Typography>
                
                {/* Only show Language Switcher in Drawer on Mobile */}
                <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                    <LanguageSwitcher />
                </Box>
            </Toolbar>
            
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
            
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                <List>
                    {navItems.map((item) => (
                        <ListItem key={item.textKey} disablePadding>
                            <ListItemButton selected={view === item.view} onClick={() => { setView(item.view); if(isMobile) handleDrawerToggle(); }}>
                                <ListItemIcon sx={{ color: 'white' }}>{item.icon}</ListItemIcon>
                                <ListItemText primary={t(item.textKey)} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Box>

            <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
                <Button onClick={logout} variant="contained" fullWidth startIcon={<LogoutIcon />} color="error">
                    {t('logout')}
                </Button>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <Toaster position="top-center" />
            <AppBar
                position="fixed"
                sx={{
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    ml: { md: `${drawerWidth}px}` },
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { md: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        {currentViewTitle}
                    </Typography>
                    {/* Desktop Language Switcher (Top Right) */}
                    <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                         <LanguageSwitcher />
                    </Box>
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
            >
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
                <Toolbar />
                {config.views[view]}
            </Box>
        </Box>
    );
}

export default App;