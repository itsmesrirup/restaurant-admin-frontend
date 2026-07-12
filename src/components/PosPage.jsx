import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Box, Paper, Typography, Button, TextField, Chip, CircularProgress, IconButton, Drawer, Badge, useTheme, useMediaQuery, Fab, Stack } from '@mui/material';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
// ✅ IMPORT THE NEW MODAL
import PosCustomizeItemModal from './PosCustomizeItemModal';

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

    // ✅ MODAL STATE
    const [customizeModalOpen, setCustomizeModalOpen] = useState(false);
    const [itemToCustomize, setItemToCustomize] = useState(null);

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

    // ✅ NEW: Intercept the click to check for options
    const handleMenuItemClick = (item) => {
        if (item.bundle || (item.options && item.options.length > 0)) {
            // It has options! Open the customization modal
            setItemToCustomize(item);
            setCustomizeModalOpen(true);
        } else {
            // No options, just add the raw item directly to the ticket
            addConfiguredItemToOrder({ ...item, calculatedPrice: item.price, selectedOptions: [] });
        }
    };

    // ✅ NEW: Advanced Cart Logic that separates items based on their selected options
    const addConfiguredItemToOrder = (configuredItem) => {
        setCurrentOrder(prev => {
            // Check if we already have this EXACT configuration in the ticket
            const existingIndex = prev.findIndex(i => 
                i.id === configuredItem.id && 
                JSON.stringify(i.selectedOptions) === JSON.stringify(configuredItem.selectedOptions)
            );

            if (existingIndex >= 0) {
                // ✅ FIXED: Immutably update the quantity to prevent React Strict Mode doubling
                return prev.map((item, index) => 
                    index === existingIndex 
                        ? { ...item, qty: item.qty + 1 } 
                        : item
                );
            }

            // Otherwise, add it as a new distinct row on the ticket
            return [...prev, { ...configuredItem, qty: 1, ticketItemId: Date.now() + Math.random() }];
        });
        
        // Close modal and give feedback
        setCustomizeModalOpen(false);
        setItemToCustomize(null);
    };

    const updateQty = (ticketItemId, change) => {
        setCurrentOrder(prev => prev.map(item => {
            if (item.ticketItemId === ticketItemId) {
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

    // ✅ FIXED: Calculate total using the calculatedPrice (which includes modifier costs)
    const calculateTotal = () => currentOrder.reduce((sum, item) => sum + ((item.calculatedPrice || item.price) * item.qty), 0);
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
                selectedOptions: i.selectedOptions || [] // ✅ Pass the options to the backend!
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

        // 1. Find the parent category object the waiter just clicked
        const parentCategory = categories.find(cat => cat.id === selectedCategory);
        
        // 2. Start a list of valid IDs with the parent's ID
        let validCategoryIds = [selectedCategory];
        
        // 3. If this parent has subcategories, add all their IDs to our valid list!
        if (parentCategory && parentCategory.subCategories) {
            parentCategory.subCategories.forEach(sub => {
                validCategoryIds.push(sub.id);
            });
        }
        
        // 4. Return any menu item that matches ANY of those IDs
        return menuItems.filter(item => validCategoryIds.includes(item.categoryId));
    }, [menuItems, selectedCategory, categories]);

    // --- TICKET COMPONENT ---
    const TicketUI = (
        <Paper elevation={isMobile ? 0 : 6} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: isMobile ? 0 : 2, overflow: 'hidden', border: isMobile ? 'none' : undefined }}>
            <Box sx={{ p: 2, bgcolor: isTableOccupied ? '#fff3e0' : 'grey.100', borderBottom: '1px solid #ddd' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" noWrap>
                        {isTableOccupied ? t('posUpdatingTable', { number: tableNumber }) : t('posNewOrder')}
                    </Typography>
                    {isMobile && <IconButton onClick={() => setMobileTicketOpen(false)} size="small"><CloseIcon /></IconButton>}
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <TextField label={t('posTableNo')} value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} fullWidth size="small" sx={{ bgcolor: 'white' }} type="number" placeholder="5" color={isTableOccupied ? "warning" : "primary"} />
                    {isTableOccupied && <Chip icon={<TableRestaurantIcon />} label={t('posOccupied')} color="warning" size="small" />}
                </Box>
                {isTableOccupied && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{t('posAppendMessage')}</Typography>}
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
                {currentOrder.length === 0 ? (
                    <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>{t('posSelectItems')}</Typography>
                ) : (
                    currentOrder.map(item => (
                        <Box key={item.ticketItemId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 2, borderBottom: '1px dashed #eee' }}>
                            <Box sx={{ flex: 1, overflow: 'hidden', mr: 1 }}>
                                <Typography variant="body1" fontWeight="bold" noWrap>{item.name}</Typography>
                                
                                {/* ✅ RENDER THE CHOSEN OPTIONS ON THE TICKET SO THE WAITER CAN SEE THEM */}
                                {item.selectedOptions && item.selectedOptions.length > 0 && (
                                    <Box component="ul" sx={{ pl: 2, m: 0, color: 'text.secondary', fontSize: '0.8rem' }}>
                                        {item.selectedOptions.map((opt, i) => (
                                            <li key={i}><strong>{opt.optionName}:</strong> {opt.choices.join(', ')}</li>
                                        ))}
                                    </Box>
                                )}
                                
                                <Typography variant="caption" color="text.secondary">€{((item.calculatedPrice || item.price) * item.qty).toFixed(2)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                <IconButton size="small" onClick={() => updateQty(item.ticketItemId, -1)} color="error"><RemoveCircleOutlineIcon /></IconButton>
                                <Typography sx={{ mx: 1, fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{item.qty}</Typography>
                                <IconButton size="small" onClick={() => updateQty(item.ticketItemId, 1)} color="primary"><AddCircleOutlineIcon /></IconButton>
                            </Box>
                        </Box>
                    ))
                )}
            </Box>

            <Box sx={{ p: 2, borderTop: '1px solid #ddd', bgcolor: 'grey.50' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="subtitle1">{t('total')}:</Typography>
                    <Typography variant="h6" fontWeight="bold">€{calculateTotal().toFixed(2)}</Typography>
                </Box>
                <Stack spacing={1} direction="row">
                    <Button variant="outlined" color="error" onClick={clearOrder} startIcon={<DeleteIcon />} sx={{ flex: 1, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{t('posClear')}</Button>
                    <Button variant="contained" color={isTableOccupied ? "warning" : "success"} size="large" onClick={handleSendOrder} disabled={isSending || currentOrder.length === 0} startIcon={isSending ? <CircularProgress size={20} color="inherit"/> : <SendIcon />} sx={{ flex: 2, py: 1.2, fontSize: '1.1rem', fontWeight: 'bold' }}>
                        {isTableOccupied ? t('posAppend') : t('posSend')}
                    </Button>
                </Stack>
            </Box>
        </Paper>
    );

    if (isLoading) return <CircularProgress />;

    return (
        <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', width: '100%', maxWidth: '100vw', overflow: 'hidden' }}>
            
            {/* LEFT SIDE: MENU */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0, pr: isMobile ? 0 : 2 }}>
                <Box sx={{ mb: 2, overflowX: 'auto', display: 'flex', gap: 1, pb: 1, px: 1, flexShrink: 0, '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                    <Chip label="ALL" onClick={() => setSelectedCategory('ALL')} color={selectedCategory === 'ALL' ? "primary" : "default"} clickable sx={{ fontWeight: 'bold' }} />
                    {categories.map(cat => (
                        <Chip key={cat.id} label={cat.name} onClick={() => setSelectedCategory(cat.id)} color={selectedCategory === cat.id ? "primary" : "default"} clickable sx={{ fontWeight: 'bold' }} />
                    ))}
                </Box>

                <Box sx={{ flexGrow: 1, overflowY: 'auto', p: isMobile ? 1 : 2, pb: isMobile ? 10 : 2 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                        {displayedItems.map(item => (
                            <Paper 
                                key={item.id} elevation={2}
                                onClick={() => handleMenuItemClick(item)} // ✅ TRIGGER NEW LOGIC HERE
                                sx={{ p: 1.5, textAlign: 'center', cursor: 'pointer', height: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.1s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4, bgcolor: 'action.hover' }, borderLeft: '4px solid #1976d2', overflow: 'hidden' }}
                            >
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', lineHeight: 1.2, display: '-webkit-box', overflow: 'hidden', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3 }}>
                                    {item.name}
                                </Typography>
                                <Chip label={`€${item.price?.toFixed(2)}`} size="small" variant="outlined" color="primary" />
                            </Paper>
                        ))}
                    </Box>
                </Box>
            </Box>

            {/* RIGHT SIDE: TICKET (DESKTOP) */}
            {!isMobile && (
                <Box sx={{ width: '320px', flexShrink: 0 }}>
                    {TicketUI}
                </Box>
            )}

            {/* MOBILE DRAWER */}
            {isMobile && (
                <>
                    <Fab color="secondary" aria-label="cart" onClick={() => setMobileTicketOpen(true)} sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1300 }}>
                        <Badge badgeContent={totalItemsCount} color="error"><ShoppingCartIcon /></Badge>
                    </Fab>
                    <Drawer anchor="bottom" open={mobileTicketOpen} onClose={() => setMobileTicketOpen(false)} PaperProps={{ sx: { height: '80vh', borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' } }}>
                        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>{TicketUI}</Box>
                    </Drawer>
                </>
            )}

            {/* ✅ ADD THE CUSTOMIZATION MODAL */}
            <PosCustomizeItemModal 
                open={customizeModalOpen} 
                handleClose={() => setCustomizeModalOpen(false)} 
                menuItem={itemToCustomize} 
                onSave={addConfiguredItemToOrder} 
            />
        </Box>
    );
}

export default PosPage;