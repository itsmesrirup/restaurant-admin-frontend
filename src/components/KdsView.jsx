import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Box, Typography, Button, Paper, Grid, CircularProgress, Chip, Divider } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime'; 
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'; 
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import notificationSound from '/notification.mp3'; 
import { useTranslation } from 'react-i18next';
import usePageTitle from '../hooks/usePageTitle';
import { useOrderWebSocket } from '../hooks/useOrderWebSocket';

export default function KdsView() {
    const { t, i18n } = useTranslation(); // ✅ EXTRACTED i18n for Date Formatting
    usePageTitle(t('kitchenView'));
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchKitchenOrders = async () => {
            try {
                const data = await apiClient.get('/api/orders/by-restaurant/kitchen');
                data.sort((a, b) => {
                    if (a.pickupTime && b.pickupTime) return new Date(a.pickupTime) - new Date(b.pickupTime);
                    if (!a.pickupTime && b.pickupTime) return -1;
                    if (a.pickupTime && !b.pickupTime) return 1;
                    return a.id - b.id; // Oldest ASAP first
                });
                setOrders(data);
            } catch (error) {
                console.error("Failed to fetch KDS orders:", error);
            } finally {
                setIsLoading(false);
            }
        };
        if (user) fetchKitchenOrders();
    }, [user]);

    useOrderWebSocket(setOrders, true, notificationSound);

    const handleUpdateStatus = (orderId, newStatus) => {
        const promise = apiClient.patch(`/api/orders/${orderId}/status`, { status: newStatus });
        
        toast.promise(promise, {
            loading: t('updatingStatus', 'Updating status...'),
            success: t('statusUpdated', 'Status updated!'),
            error: t('statusUpdateFailed', 'Failed to update status.')
        });
    };

    const activeOrders = useMemo(() => {
        return orders.filter(order => 
            order.status === 'CONFIRMED' || order.status === 'PREPARING' || order.status === 'PENDING'
        );
    }, [orders]);

    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ pb: 4 }}>
            <Typography variant="h4" gutterBottom>{t('kitchenDisplayTitle', 'Kitchen Display')}</Typography>
            
            {activeOrders.length === 0 ? (
                <Typography color="text.secondary">{t('noActiveOrders', 'No active orders right now.')}</Typography>
            ) : (
                <Grid container spacing={2}>
                    {activeOrders.map(order => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={order.id} sx={{ display: 'flex' }}>
                            <Paper 
                                elevation={3} 
                                sx={{ 
                                    p: 2, 
                                    width: '100%', // ✅ FORCES UNIFORM WIDTH
                                    display: 'flex',
                                    flexDirection: 'column',
                                    backgroundColor: order.pickupTime ? '#f3e5f5' : (order.status === 'PREPARING' ? '#fff9c4' : 'background.paper'),
                                    border: order.pickupTime ? '2px solid #9c27b0' : 'none',
                                    borderRadius: 2
                                }}
                            >
                                <Box sx={{ flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                        <Typography variant="h5" fontWeight="bold">{t('orderNum', { orderId: order.orderNumber })}</Typography>
                                        
                                        {/* ✅ FULLY TRANSLATED STATUS */}
                                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: order.status === 'PENDING' ? '#ff9800' : 'text.secondary', textAlign: 'right' }}>
                                            {t(`orderStatus.${order.status}`, { defaultValue: order.status })}
                                        </Typography>
                                    </Box>

                                    {/* ✅ FULLY TRANSLATED BADGES WITH WRAP TO PREVENT STRETCHING */}
                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                                        {order.source === 'POS' ? (
                                            <Chip icon={<PointOfSaleIcon />} label={t('orderSource_POS', 'POS')} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />
                                        ) : (
                                            <Chip icon={<PhoneIphoneIcon />} label={t('orderSource_ONLINE', 'Online')} size="small" color="info" sx={{ fontWeight: 'bold' }} />
                                        )}

                                        {order.paymentIntentId ? (
                                            <Chip label={t('payment_PAID', 'PAID')} color="success" size="small" sx={{ fontWeight: 'bold' }} />
                                        ) : (
                                            <Chip label={t('payment_UNPAID', 'UNPAID')} color="warning" size="small" variant="outlined" />
                                        )}

                                        {order.diningOption === 'DINE_IN' ? <Chip label={t('dining_DINE_IN', 'DINE-IN')} color="secondary" size="small" sx={{ fontWeight: 'bold' }} /> : 
                                         order.diningOption === 'DELIVERY' ? <Chip label={t('dining_DELIVERY', 'DELIVERY')} color="secondary" size="small" sx={{ fontWeight: 'bold' }} /> : 
                                         <Chip label={t('dining_TAKEAWAY', 'TAKEAWAY')} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />}

                                        {order.tableNumber && <Chip label={t('tableNum', { tableNumber: order.tableNumber })} color="primary" size="small" sx={{ fontWeight: 'bold' }} />}
                                    </Box>

                                    {/* ✅ TRANSLATED DATES */}
                                    <Box sx={{ mb: 1 }}>
                                        {order.pickupTime ? (
                                            <Chip 
                                                icon={<AccessTimeIcon />} 
                                                label={new Date(order.pickupTime).toLocaleString(i18n.language, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })} 
                                                color="secondary" 
                                                variant="outlined"
                                                sx={{ fontWeight: 'bold', width: '100%', justifyContent: 'flex-start' }}
                                            />
                                        ) : (
                                            <Chip icon={<AccessTimeIcon />} label={t('pickupAsap', 'ASAP')} color="primary" size="small" />
                                        )}
                                    </Box>

                                    <Divider sx={{ my: 1.5 }} />
                                    
                                    <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, mb: 2 }}>
                                        {order.items?.map((item, index) => {
                                            let selectedOptions = [];
                                            if (item.selectedOptions) try { selectedOptions = JSON.parse(item.selectedOptions); } catch (e) {}
                                            return (
                                                <Box component="li" key={`${item.menuItemId}-${index}`} sx={{ mb: 1 }}>
                                                    <Typography variant="h6" sx={{ lineHeight: 1.2 }}>{item.quantity} x {item.name}</Typography>
                                                    {selectedOptions.length > 0 && (
                                                        <Box component="ul" sx={{ pl: 2, fontSize: '0.95rem', color: 'text.secondary', mt: 0.5 }}>
                                                            {selectedOptions.map((opt, i) => <li key={i}><strong>{opt.optionName}:</strong> {opt.choices.join(', ')}</li>)}
                                                        </Box>
                                                    )}
                                                </Box>
                                            );
                                        })}
                                    </Box>

                                    {/* SPECIAL INSTRUCTIONS ALERT */}
                                    {order.specialInstructions && (
                                        <Box sx={{ mt: 1, p: 1.5, bgcolor: '#fff3cd', borderLeft: '4px solid #ff9800', borderRadius: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#e65100' }}>
                                                ⚠️ Notes: {order.specialInstructions}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>

                                {/* ✅ Pinned Action Buttons (Translated) */}
                                <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                                    {order.status === 'PENDING' && (
                                        <Button fullWidth variant="contained" color="warning" onClick={() => handleUpdateStatus(order.id, 'PREPARING')}>
                                            {t('acceptAndPrepare', 'Accept & Prepare')}
                                        </Button>
                                    )}
                                    {order.status === 'CONFIRMED' && (
                                        <Button fullWidth variant="contained" color="warning" onClick={() => handleUpdateStatus(order.id, 'PREPARING')}>
                                            {t('startPreparing', 'Start Preparing')}
                                        </Button>
                                    )}
                                    {order.status === 'PREPARING' && (
                                        <Button fullWidth variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => handleUpdateStatus(order.id, 'READY_FOR_PICKUP')}>
                                            {t('markAsReady', 'Mark as Ready')}
                                        </Button>
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