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
import GlobeIcon from '@mui/icons-material/Language'; // Icon for Website
import WebsitePage from './components/WebsitePage';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'; // New Icon
import CommissionPage from './components/CommissionPage';
import SuperAdminCommissionReport from './components/SuperAdminCommissionReport';

const drawerWidth = 240;

// --- Language Switcher Component ---
// This can be a separate component file, but for simplicity, it's here.
const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    return (
        <Box>
            <Button 
                variant={i18n.language === 'en' ? 'contained' : 'outlined'} 
                onClick={() => i18n.changeLanguage('en')}
                size="small"
                sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.5)' }}
            >
                EN
            </Button>
            <Button 
                variant={i18n.language === 'fr' ? 'contained' : 'outlined'} 
                onClick={() => i18n.changeLanguage('fr')}
                size="small"
                sx={{ ml: 1, color: 'white', borderColor: 'rgba(255, 255, 255, 0.5)' }}
            >
                FR
            </Button>
        </Box>
    );
};

function App() {
    const { t } = useTranslation();
    const { token, user, isLoading, logout } = useAuth();
    //const [view, setView] = useState(user?.role === 'SUPER_ADMIN' ? 'super' : 'orders');
    const [mobileOpen, setMobileOpen] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md')); // Check for medium screens and down

    const rolesConfig = {
        SUPER_ADMIN: {
            views: { 
                super: <SuperAdminDashboard />,
                commissions: <SuperAdminCommissionReport />
             },
            navItems: [
                { textKey: 'adminPanel', view: 'super', icon: <SupervisedUserCircleIcon /> },
                { textKey: 'globalCommissions', view: 'commissions', icon: <MonetizationOnIcon /> }
            ],
            defaultView: 'super'
        },
        ADMIN: {
            views: {
                orders: <OrderDashboard />, kds: <KdsView />, analytics: <AnalyticsPage />,
                menu: <MenuManagement />, importMenu: <MenuImporter />, category: <CategoryManagement />, specials: <SpecialsManagement />,
                reservations: <ReservationManagement />, users: <UserManagement />, website: <WebsitePage />, settings: <SettingsPage />,
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
                    { textKey: 'importMenu', view: 'importMenu', icon: <CloudUploadIcon />, feature: 'MENU' },
                    { textKey: 'categoryManagement', view: 'category', icon: <CategoryIcon />, feature: 'MENU' },
                    { textKey: 'specials', view: 'specials', icon: <StarIcon />, feature: 'MENU' },
                    { textKey: 'reservations', view: 'reservations', icon: <EventSeatIcon />, feature: 'RESERVATIONS' },
                    { textKey: 'userManagement', view: 'users', icon: <PeopleIcon />, feature: 'ORDERS' },
                    { textKey: 'websitePage', view: 'website', icon: <GlobeIcon />, feature: 'WEBSITE_BUILDER' },
                    // --- ADDED: This item is specific to the COMMISSION model ---
                    { textKey: 'commissions', view: 'commissions', icon: <MonetizationOnIcon />, feature: 'ORDERS', model: 'COMMISSION' },
                    { textKey: 'settings', view: 'settings', icon: <SettingsIcon />, feature: 'ORDERS' }
                ].filter(item => 
                    // An item is shown if:
                    // 1. The user's plan has the required feature AND
                    // 2. The item either has no specific model, OR its model matches the user's payment model.
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

    // This is the variable that correctly gets the array of nav items for the current user
    const navItems = user?.role === 'ADMIN' 
        ? config.navItems(user) 
        : rolesConfig[user?.role]?.navItems || [];

    //const currentViewTitle = t(config.navItems.find(item => item.view === view)?.textKey);
    const currentViewTitle = t(navItems.find(item => item.view === view)?.textKey);

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
            {/* --- CHANGED: This Toolbar is now a vertical flex container to stack its children --- */}
            <Toolbar sx={{ 
                backgroundColor: '#222', 
                flexDirection: 'column',
                alignItems: 'center',
                py: 2
            }}>
                <Typography variant="h5" sx={{ color: 'white' }}>
                    {user?.restaurantName || 'Tablo'}
                </Typography>
                
                {/* --- CHANGED: Conditionally render the switcher ONLY if it's mobile view --- */}
                {/* This is the key fix to prevent the duplicate on desktop. */}
                {isMobile && (
                    <Box sx={{ mt: 1.5 }}>
                        <LanguageSwitcher />
                    </Box>
                )}
            </Toolbar>

            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
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
            <Box sx={{ position: 'absolute', bottom: 0, width: '100%', p: 2 }}>
                <Button onClick={logout} variant="contained" fullWidth startIcon={<LogoutIcon />} color="error">
                    {t('logout')}
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
                    {/* --- REMOVED: No change needed here, it works perfectly on desktop --- */}
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
                <Toolbar /> {/* This Toolbar is a spacer for under the AppBar */}
                {config.views[view]}
            </Box>
        </Box>
    );
}

export default App;