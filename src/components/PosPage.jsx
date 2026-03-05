import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
    Box, Paper, Typography, Button, TextField, Chip, CircularProgress, 
    IconButton, Drawer, Badge, useTheme, useMediaQuery, Fab, Grid 
} from '@mui/material';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';

function PosPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md')); 

    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [currentOrder, setCurrentOrder] = useState([]); 
    const [tableNumber, setTableNumber] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [occupiedTables, setOccupiedTables] = useState([]);
    const [mobileTicketOpen, setMobileTicketOpen] = useState(false);

    const fetchData = async () => {
        try {
            const [menuRes, catRes, tablesRes] = await Promise.all([
                apiClient.get('/api/menu-items/by-restaurant'),
                apiClient.get('/api/categories/by-restaurant'),
                apiClient.get('/api/orders/active-tables')
            ]);
            setMenuItems(menuRes);
            setCategories(catRes);
            setOccupiedTables(tablesRes);
        } catch (error) {
            toast.error("Failed to load POS data.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => {
            apiClient.get('/api/orders/active-tables').then(setOccupiedTables).catch(console.error);
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const addToOrder = (item) => {
        setCurrentOrder(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { ...item, qty: 1 }];
        });
    };

    const updateQty = (itemId, change) => {
        setCurrentOrder(prev => prev.map(item => {
            if (item.id === itemId) {
                const newQty = Math.max(0, item.qty + change);
                return { ...item, qty: newQty };
            }
            return item;
        }).filter(item => item.qty > 0));
    };

    const clearOrder = () => {
        setCurrentOrder([]);
        setTableNumber('');
        if(isMobile) setMobileTicketOpen(false);
    };

    const calculateTotal = () => currentOrder.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const totalItemsCount = currentOrder.reduce((sum, item) => sum + item.qty, 0);

    const handleSendOrder = async () => {
        if (!tableNumber) return toast.error(t('posTableNo') + " is required.");
        if (currentOrder.length === 0) return toast.error("Order is empty.");

        setIsSending(true);
        const payload = {
            tableNumber: tableNumber,
            customerId: null, 
            items: currentOrder.map(i => ({
                menuItemId: i.id,
                quantity: i.qty,
                selectedOptions: [] 
            }))
        };

        try {
            await apiClient.post('/api/orders', payload);
            toast.success(`${t('posSend')}! (Table ${tableNumber})`);
            clearOrder();
            apiClient.get('/api/orders/active-tables').then(setOccupiedTables);
        } catch (error) {
            toast.error("Failed to send order.");
        } finally {
            setIsSending(false);
        }
    };

    const isTableOccupied = occupiedTables.includes(tableNumber);

    const displayedItems = useMemo(() => {
        if (selectedCategory === 'ALL') return menuItems;
        return menuItems.filter(item => item.categoryId === selectedCategory);
    }, [menuItems, selectedCategory]);

    // --- REUSABLE TICKET COMPONENT ---
    const TicketUI = (
        <Paper 
            elevation={isMobile ? 0 : 6} 
            sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                borderRadius: isMobile ? 0 : 2, 
                overflow: 'hidden',
                border: isMobile ? 'none' : undefined
            }}
        >
            {/* Header */}
            <Box sx={{ p: 2, bgcolor: isTableOccupied ? '#fff3e0' : 'grey.100', borderBottom: '1px solid #ddd' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" noWrap>
                        {isTableOccupied ? t('posUpdatingTable', { number: tableNumber }) : t('posNewOrder')}
                    </Typography>
                    {isMobile && (
                        <IconButton onClick={() => setMobileTicketOpen(false)} size="small">
                            <CloseIcon />
                        </IconButton>
                    )}
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <TextField 
                        label={t('posTableNo')} 
                        value={tableNumber} 
                        onChange={(e) => setTableNumber(e.target.value)} 
                        fullWidth 
                        size="small" 
                        sx={{ bgcolor: 'white' }}
                        type="number"
                        placeholder="5"
                        color={isTableOccupied ? "warning" : "primary"}
                    />
                    {isTableOccupied && (
                        <Chip icon={<TableRestaurantIcon />} label={t('posOccupied')} color="warning" size="small" />
                    )}
                </Box>
                
                {isTableOccupied && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {t('posAppendMessage')}
                    </Typography>
                )}
            </Box>

            {/* List */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
                {currentOrder.length === 0 ? (
                    <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
                        {t('posSelectItems')}
                    </Typography>
                ) : (
                    currentOrder.map(item => (
                        <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 2, borderBottom: '1px dashed #eee' }}>
                            <Box sx={{ flex: 1, overflow: 'hidden', mr: 1 }}>
                                <Typography variant="body1" fontWeight="bold" noWrap>{item.name}</Typography>
                                <Typography variant="caption" color="text.secondary">€{(item.price * item.qty).toFixed(2)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                <IconButton size="small" onClick={() => updateQty(item.id, -1)} color="error"><RemoveCircleOutlineIcon /></IconButton>
                                <Typography sx={{ mx: 1, fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{item.qty}</Typography>
                                <IconButton size="small" onClick={() => updateQty(item.id, 1)} color="primary"><AddCircleOutlineIcon /></IconButton>
                            </Box>
                        </Box>
                    ))
                )}
            </Box>

            {/* Footer - COMPACT LAYOUT */}
            <Box sx={{ p: 2, borderTop: '1px solid #ddd', bgcolor: 'grey.50' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="subtitle1">{t('posTotal')}</Typography>
                    <Typography variant="h6" fontWeight="bold">€{calculateTotal().toFixed(2)}</Typography>
                </Box>
                
                {/* Horizontal Grid Layout for buttons: [Clear (Small)] [Send (Big)] */}
                <Grid container spacing={1}>
                    <Grid item xs={4}>
                        <Button 
                            variant="outlined" 
                            color="error" 
                            fullWidth 
                            onClick={clearOrder} 
                            // Only show icon on very small screens if text is too long, 
                            // otherwise show text
                            sx={{ height: '100%', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                        >
                            {/* Shorten text if possible or use icon */}
                            {t('posClear')} 
                        </Button>
                    </Grid>
                    <Grid item xs={8}>
                        <Button 
                            variant="contained" 
                            color={isTableOccupied ? "warning" : "success"}
                            fullWidth 
                            size="large"
                            onClick={handleSendOrder}
                            disabled={isSending || currentOrder.length === 0}
                            startIcon={isSending ? <CircularProgress size={20} color="inherit"/> : <SendIcon />}
                            sx={{ py: 1.2, fontSize: '1.1rem', fontWeight: 'bold' }}
                        >
                            {isTableOccupied ? t('posAppend') : t('posSend')}
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </Paper>
    );

    if (isLoading) return <CircularProgress />;

    return (
        // ✅ FIX 1: MaxWidth 100vw and overflow: hidden on the ROOT container
        <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', width: '100%', maxWidth: '100vw', overflow: 'hidden' }}>
            
            {/* --- LEFT SIDE: MENU --- */}
            {/* ✅ FIX 2: Removed gap on mobile to prevent overflow (handled by padding inside children) */}
            <Box sx={{ 
                flexGrow: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%', 
                minWidth: 0, 
                pr: isMobile ? 0 : 2 
            }}>
                
                {/* Filter Bar */}
                <Box sx={{ mb: 2, overflowX: 'auto', display: 'flex', gap: 1, pb: 1, px: 1, flexShrink: 0, '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                    <Chip label="ALL" onClick={() => setSelectedCategory('ALL')} color={selectedCategory === 'ALL' ? "primary" : "default"} clickable sx={{ fontWeight: 'bold' }} />
                    {categories.map(cat => (
                        <Chip key={cat.id} label={cat.name} onClick={() => setSelectedCategory(cat.id)} color={selectedCategory === cat.id ? "primary" : "default"} clickable sx={{ fontWeight: 'bold' }} />
                    ))}
                </Box>

                {/* Grid */}
                {/* ✅ FIX 3: Reduced padding on mobile (p: 1) to gain space */}
                <Box sx={{ flexGrow: 1, overflowY: 'auto', p: isMobile ? 1 : 2, pb: isMobile ? 10 : 2 }}>
                    <Box sx={{ 
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: 'repeat(2, 1fr)',
                            sm: 'repeat(3, 1fr)',
                            md: 'repeat(2, 1fr)', 
                            lg: 'repeat(3, 1fr)', 
                            xl: 'repeat(4, 1fr)'
                        },
                        gap: 1.5
                    }}>
                        {displayedItems.map(item => (
                            <Paper 
                                key={item.id}
                                elevation={2}
                                onClick={() => addToOrder(item)}
                                sx={{ 
                                    p: 1.5, 
                                    textAlign: 'center', 
                                    cursor: 'pointer', 
                                    height: '140px', 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'all 0.1s',
                                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 4, bgcolor: 'action.hover' },
                                    borderLeft: '4px solid #1976d2',
                                    overflow: 'hidden'
                                }}
                            >
                                <Typography 
                                    variant="subtitle2" 
                                    sx={{ 
                                        fontWeight: 'bold', 
                                        lineHeight: 1.2,
                                        display: '-webkit-box',
                                        overflow: 'hidden',
                                        WebkitBoxOrient: 'vertical',
                                        WebkitLineClamp: 3,
                                    }}
                                >
                                    {item.name}
                                </Typography>
                                
                                <Chip 
                                    label={`€${item.price?.toFixed(2)}`} 
                                    size="small" 
                                    variant="outlined" 
                                    color="primary"
                                />
                            </Paper>
                        ))}
                    </Box>
                </Box>
            </Box>

            {/* --- RIGHT SIDE: TICKET (DESKTOP) --- */}
            {!isMobile && (
                <Box sx={{ width: '320px', flexShrink: 0 }}>
                    {TicketUI}
                </Box>
            )}

            {/* --- MOBILE DRAWER (BOTTOM SHEET) --- */}
            {isMobile && (
                <>
                    <Fab 
                        color="secondary" 
                        aria-label="cart" 
                        onClick={() => setMobileTicketOpen(true)}
                        sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1300 }}
                    >
                        <Badge badgeContent={totalItemsCount} color="error">
                            <ShoppingCartIcon />
                        </Badge>
                    </Fab>

                    <Drawer
                        anchor="bottom"
                        open={mobileTicketOpen}
                        onClose={() => setMobileTicketOpen(false)}
                        PaperProps={{
                            sx: { 
                                height: '80vh', 
                                borderTopLeftRadius: 16, 
                                borderTopRightRadius: 16,
                                overflow: 'hidden'
                            }
                        }}
                    >
                        {/* 
                           ✅ FIX 4: Explicit Height on the Drawer content box
                           This ensures the footer sticks to the bottom of the drawer
                           and the list scrolls within the remaining space.
                        */}
                        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            {TicketUI}
                        </Box>
                    </Drawer>
                </>
            )}
        </Box>
    );
}

export default PosPage;