import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Box, Typography, Button, Paper, Grid, CircularProgress, Chip, Divider } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime'; // Import
import notificationSound from '/notification.mp3'; 
import { useTranslation } from 'react-i18next';
import usePageTitle from '../hooks/usePageTitle';

function KdsView() {
    const { t } = useTranslation();
    usePageTitle(t('kitchenView')); // "Kitchen View | Tablo"
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const audio = useMemo(() => new Audio(notificationSound), []);
    const previousOrderCount = useRef(0);

    const fetchKitchenOrders = useCallback(async () => {
        if (!user) return;
        try {
            const data = await apiClient.get('/api/orders/by-restaurant/kitchen');
            
            // --- IMPROVED SORTING ---
            // 1. Scheduled items closest to pickup time first
            // 2. Then ASAP items by ID
            data.sort((a, b) => {
                if (a.pickupTime && b.pickupTime) return new Date(a.pickupTime) - new Date(b.pickupTime);
                if (a.pickupTime) return 1; // Push scheduled to the end (or -1 to put them first, your choice)
                if (b.pickupTime) return -1;
                return a.id - b.id;
            });
            
            if (previousOrderCount.current > 0 && data.length > orders.length) {
                audio.play().catch(e => console.error("Audio playback failed:", e));
            }
            
            setOrders(data);
            previousOrderCount.current = data.length;

        } catch (error) {
            console.error("Failed to fetch KDS orders:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user, audio, orders.length]);

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            fetchKitchenOrders();
            const interval = setInterval(fetchKitchenOrders, 10000);
            return () => clearInterval(interval);
        }
    }, [user, fetchKitchenOrders]);
    
    const handleUpdateStatus = (orderId, newStatus) => {
        const originalOrders = orders;
        const newOrders = orders.filter(o => o.id !== orderId);
        setOrders(newOrders); 

        const promise = apiClient.patch(`/api/orders/${orderId}/status`, { status: newStatus });
        
        toast.promise(promise, {
            loading: t('updatingStatus'),
            success: t('statusUpdated'),
            error: () => {
                setOrders(originalOrders);
                return t('statusUpdateFailed');
            }
        });
    };

    if (isLoading) return <CircularProgress />;

    return (
        <Box sx={{ pb: 4 }}>
            <Typography variant="h4" gutterBottom>{t('kitchenDisplayTitle')}</Typography>
            {orders.length === 0 ? (
                <Typography>{t('noActiveOrders')}</Typography>
            ) : (
                // --- FIX: Use alignItems="stretch" here as well ---
                <Grid container spacing={2} alignItems="stretch">
                    {orders.map(order => (
                        // --- FIX: Add display: flex to the Grid item ---
                        <Grid item xs={12} sm={6} md={4} key={order.id} sx={{ display: 'flex' }}>
                            <Paper 
                                elevation={3} 
                                sx={{ 
                                    p: 2, 
                                    // --- FIX: width 100% and flex column layout ---
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    backgroundColor: order.pickupTime ? '#f3e5f5' : (order.status === 'PREPARING' ? 'secondary.light' : 'background.paper'),
                                    border: order.pickupTime ? '2px solid #9c27b0' : 'none'
                                }}
                            >
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="h5" fontWeight="bold">{t('orderNum', { orderId: order.orderNumber })}</Typography>
                                        
                                        {order.tableNumber && <Chip label={t('tableNum', { tableNumber: order.tableNumber })} color="secondary" />}

                                        {/* --- NEW: Payment Status Chip --- */}
                                        {order.paymentIntentId ? (
                                            <Chip label="PAID" color="success" size="small" sx={{ fontWeight: 'bold' }} />
                                        ) : (
                                            <Chip label="UNPAID" color="warning" size="small" variant="outlined" />
                                        )}

                                    </Box>

                                    {/* Date Display (already improved in previous step) */}
                                    <Box sx={{ mt: 1, mb: 1 }}>
                                        {order.pickupTime ? (
                                            <Chip 
                                                icon={<AccessTimeIcon />} 
                                                label={new Date(order.pickupTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })} 
                                                color="secondary" 
                                                variant="outlined"
                                                sx={{ fontWeight: 'bold' }}
                                            />
                                        ) : (
                                            <Chip label={t('pickupAsap')} color="primary" size="small" />
                                        )}
                                    </Box>

                                    <Divider sx={{ my: 1 }} />
                                    <Box component="ul" sx={{ listStyle: 'none', p: 0, my: 2 }}>
                                        {order.items?.map((item, index) => {
                                            let selectedOptions = [];
                                            if (item.selectedOptions) try { selectedOptions = JSON.parse(item.selectedOptions); } catch (e) {}
                                            return (
                                                <li key={`${item.menuItemId}-${index}`}>
                                                    <Typography variant="h6">{item.quantity} x {item.name}</Typography>
                                                    {selectedOptions.length > 0 && (
                                                        <Box component="ul" sx={{ pl: 2, fontSize: '1rem', color: 'text.secondary' }}>
                                                            {selectedOptions.map((opt, i) => <li key={i}>{opt}</li>)}
                                                        </Box>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </Box>
                                </Box>
                                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                                    {order.status === 'CONFIRMED' && (
                                        <Button fullWidth variant="contained" color="warning" onClick={() => handleUpdateStatus(order.id, 'PREPARING')}>{t('startPreparing')}</Button>
                                    )}
                                    {order.status === 'PENDING' && (
                                        <Button fullWidth variant="contained" color="warning" onClick={() => handleUpdateStatus(order.id, 'PREPARING')}>{t('acceptAndPrepare')}</Button>
                                    )}
                                    {order.status === 'PREPARING' && (
                                        <Button fullWidth variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => handleUpdateStatus(order.id, 'READY_FOR_PICKUP')}>{t('markAsReady')}</Button>
                                    )}
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
}

export default KdsView;