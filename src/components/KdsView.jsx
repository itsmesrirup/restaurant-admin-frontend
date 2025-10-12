import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Box, Typography, Button, Paper, Grid, CircularProgress, Chip, Divider } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import notificationSound from '/notification.mp3'; 
import { useTranslation } from 'react-i18next';

function KdsView() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const audio = useMemo(() => new Audio(notificationSound), []);
    const previousOrderCount = useRef(0);

    const fetchKitchenOrders = useCallback(async () => {
        if (!user) return;
        try {
            const data = await apiClient.get('/api/orders/by-restaurant/kitchen');
            data.sort((a, b) => a.id - b.id);
            
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
    }, [user, audio, orders.length]); // Depends on orders.length to check for new orders

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            fetchKitchenOrders();
            const interval = setInterval(fetchKitchenOrders, 10000);
            return () => clearInterval(interval);
        }
    }, [user, fetchKitchenOrders]);
    
    const handleUpdateStatus = (orderId, newStatus) => {
        // ✅ RESTORED: Optimistic UI update for an instant feel
        const originalOrders = orders;
        const newOrders = orders.filter(o => o.id !== orderId);
        setOrders(newOrders); // Remove the card from the screen immediately

        const promise = apiClient.patch(`/api/orders/${orderId}/status`, { status: newStatus });
        
        toast.promise(promise, {
            loading: 'Updating status...',
            success: 'Status updated!',
            error: () => {
                // If the API call fails, revert the change and show an error
                setOrders(originalOrders);
                return 'Failed to update status. Order restored.';
            }
        });
    };

    if (isLoading) return <CircularProgress />;

    return (
        <Box>
            <Typography variant="h4" gutterBottom>{t('kitchenDisplayTitle')}</Typography>
            {orders.length === 0 ? (
                <Typography>{t('noActiveOrders')}</Typography>
            ) : (
                <Grid container spacing={2}>
                    {orders.map(order => (
                        <Grid item xs={12} sm={6} md={4} key={order.id}>
                            <Paper 
                                elevation={3} 
                                sx={{ 
                                    p: 2, height: '100%',
                                    backgroundColor: order.status === 'PREPARING' ? 'secondary.light' : 'background.paper'
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h5" fontWeight="bold">{t('orderNum', { orderId: order.id })}</Typography>
                                    {order.tableNumber && <Chip label={t('tableNum', { tableNumber: order.tableNumber })} color="secondary" />}
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
                                <Box sx={{ mt: 'auto', pt: 2 }}>
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