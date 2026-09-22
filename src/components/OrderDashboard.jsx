import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Box, Typography, Button, Paper, Grid, Pagination, CircularProgress, Divider, Chip, Alert, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText } from '@mui/material';
import { useTranslation } from 'react-i18next';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale'; 
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import CloseIcon from '@mui/icons-material/Close';
import { useOrderWebSocket } from '../hooks/useOrderWebSocket';
import usePageTitle from '../hooks/usePageTitle';

export default function OrderDashboard() {
    const { t, i18n } = useTranslation(); // ✅ EXTRACTED i18n for Date Formatting
    usePageTitle(t('liveOrders'));
    const { user } = useAuth();
    
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const ordersPerPage = 12;

    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [delayDialogOpen, setDelayDialogOpen] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState(null);
    const [delayOrderId, setDelayOrderId] = useState(null);
    const [selectedOrderId, setSelectedOrderId] = useState(null);

    const [notifPermission, setNotifPermission] = useState(
        "Notification" in window ? Notification.permission : "denied"
    );

    const fetchOrders = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await apiClient.get('/api/orders/by-restaurant');
            data.sort((a, b) => {
                if (a.pickupTime && b.pickupTime) return new Date(a.pickupTime) - new Date(b.pickupTime);
                if (!a.pickupTime && b.pickupTime) return -1;
                if (a.pickupTime && !b.pickupTime) return 1;
                return a.id - b.id;
            });
            setOrders(data);
        } catch (error) {
            toast.error(t('failedToLoadOrders', 'Could not load order history.'));
        } finally {
            setIsLoading(false);
        }
    }, [user, t]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);
    useOrderWebSocket(setOrders, false);

    const requestNotificationPermission = async () => {
        if (!("Notification" in window)) {
            toast.error("This browser does not support desktop notification");
            return;
        }
        const permission = await Notification.requestPermission();
        setNotifPermission(permission);
        if (permission === 'granted') toast.success("Push notifications enabled!");
    };

    const handleUpdateStatus = (orderId, newStatus) => {
        const promise = apiClient.patch(`/api/orders/${orderId}/status`, { status: newStatus });
        toast.promise(promise, {
            loading: t('updatingStatus', 'Updating status...'),
            success: (updatedOrder) => {
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: updatedOrder.status } : o));
                return t('statusUpdated', 'Order status updated!');
            },
            error: t('statusUpdateFailed', 'Failed to update status.')
        });
    };

    const confirmCancel = () => {
        if (orderToCancel) handleUpdateStatus(orderToCancel, 'CANCELLED');
        setCancelDialogOpen(false);
        setOrderToCancel(null);
        setSelectedOrderId(null); 
    };

    const sendDelayNotification = (minutes) => {
        const promise = apiClient.post(`/api/orders/${delayOrderId}/notify-delay`, { delayMinutes: minutes });
        toast.promise(promise, { loading: 'Sending delay notification...', success: `Customer notified.`, error: 'Failed.' });
        setDelayDialogOpen(false);
    };
    
    const filteredOrders = useMemo(() => {
        if (filter === 'SCHEDULED') return orders.filter(o => o.pickupTime !== null && o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
        if (filter === 'ALL') return orders;
        return orders.filter(o => o.status === filter);
    }, [orders, filter]);
    
    const paginatedOrders = useMemo(() => {
        const startIndex = (page - 1) * ordersPerPage;
        return filteredOrders.slice(startIndex, startIndex + ordersPerPage);
    }, [filteredOrders, page, ordersPerPage]);

    const selectedOrder = orders.find(o => o.id === selectedOrderId);

    const handlePageChange = (event, value) => {
        setPage(value);
        window.scrollTo(0, 0);
    };

    const showPagination = filteredOrders.length > ordersPerPage;

    return (
        <Box sx={{ pb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4" sx={{ m: 0 }}>{t('liveOrdersTitle')}</Typography>
                <Button variant="outlined" color="primary" startIcon={<RefreshIcon />} onClick={fetchOrders} disabled={isLoading}>
                    {t('refresh', 'Refresh')}
                </Button>
            </Box>

            {notifPermission === 'default' && (
                <Alert severity="info" sx={{ mb: 3 }} action={<Button color="inherit" size="small" variant="outlined" onClick={requestNotificationPermission}>{t('enable', 'Enable')}</Button>}>
                    {t('enablePush', 'Enable Push Notifications to get instantly alerted when a new order arrives!')}
                </Alert>
            )}

            <Box sx={{ mb: 4, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="body1"><strong>{t('filter')}:</strong></Typography>
                <Button variant={filter === 'SCHEDULED' ? 'contained' : 'outlined'} color="secondary" startIcon={<AccessTimeIcon />} onClick={() => { setFilter('SCHEDULED'); setPage(1); }}>{t('scheduledFilter')}</Button>
                <Button variant={filter === 'PENDING' ? 'contained' : 'outlined'} onClick={() => { setFilter('PENDING'); setPage(1); }}>{t('pending')}</Button>
                <Button variant={filter === 'CONFIRMED' ? 'contained' : 'outlined'} onClick={() => { setFilter('CONFIRMED'); setPage(1); }}>{t('confirmed')}</Button>
                <Button variant={filter === 'PREPARING' ? 'contained' : 'outlined'} onClick={() => { setFilter('PREPARING'); setPage(1); }}>{t('preparing')}</Button>
                <Button variant={filter === 'ALL' ? 'contained' : 'outlined'} onClick={() => { setFilter('ALL'); setPage(1); }}>{t('showAll')}</Button>
            </Box>
            
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
            ) : filteredOrders.length > 0 ? (
                <>
                    <Grid container spacing={3} alignItems="stretch">
                        {paginatedOrders.map(order => {
                            const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

                            return (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={order.id} sx={{ display: 'flex' }}>
                                    <Paper 
                                        elevation={2} 
                                        sx={{ 
                                            p: 2, width: '100%', display: 'flex', flexDirection: 'column', 
                                            borderRadius: 2, cursor: 'pointer', transition: 'all 0.2s',
                                            borderTop: order.status === 'PENDING' ? '4px solid #ff9800' : (order.status === 'READY_FOR_PICKUP' ? '4px solid #4caf50' : '4px solid transparent'),
                                            '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
                                        }}
                                        onClick={() => setSelectedOrderId(order.id)}
                                    >
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                <Typography variant="h6" fontWeight="bold">#{order.orderNumber}</Typography>
                                                <Typography variant="caption" sx={{ fontWeight: 'bold', color: order.status === 'PENDING' ? '#ff9800' : 'text.secondary', textAlign: 'right' }}>
                                                    {t(`orderStatus.${order.status}`, { defaultValue: order.status })}
                                                </Typography>
                                            </Box>
                                            
                                            {/* ✅ TRANSLATED CHIPS */}
                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                                                {order.source === 'POS' ? (
                                                    <Chip icon={<PointOfSaleIcon />} label={t('orderSource_POS')} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />
                                                ) : (
                                                    <Chip icon={<PhoneIphoneIcon />} label={t('orderSource_ONLINE')} size="small" color="info" sx={{ fontWeight: 'bold' }} />
                                                )}

                                                {order.paymentIntentId ? (
                                                    <Chip label={t('payment_PAID')} color="success" size="small" sx={{ fontWeight: 'bold' }} />
                                                ) : (
                                                    <Chip label={t('payment_UNPAID')} color="warning" size="small" variant="outlined" />
                                                )}

                                                {order.diningOption === 'DINE_IN' ? <Chip label={t('dining_DINE_IN')} color="secondary" size="small" sx={{ fontWeight: 'bold' }} /> : 
                                                 order.diningOption === 'DELIVERY' ? <Chip label={t('dining_DELIVERY')} color="secondary" size="small" sx={{ fontWeight: 'bold' }} /> : 
                                                 <Chip label={t('dining_TAKEAWAY')} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />}

                                                {order.tableNumber && <Chip label={t('tableNum', { tableNumber: order.tableNumber })} color="primary" size="small" sx={{ fontWeight: 'bold' }} />}
                                            </Box>

                                            {/* ✅ TRANSLATED DATE FORMAT */}
                                            {order.pickupTime ? (
                                                <Typography variant="body2" sx={{ color: 'secondary.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <AccessTimeIcon fontSize="small"/> 
                                                    {new Date(order.pickupTime).toLocaleString(i18n.language, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                                                </Typography>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <AccessTimeIcon fontSize="small"/> {t('pickupAsap', 'ASAP')}
                                                </Typography>
                                            )}
                                        </Box>

                                        <Box sx={{ mt: 'auto', pt: 2 }}>
                                            <Divider sx={{ mb: 1.5 }} />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                {/* ✅ TRANSLATED ITEMS PLURALIZATION */}
                                                <Typography variant="body2" color="text.secondary">{t('itemCount', { count: itemCount })}</Typography>
                                                <Typography variant="subtitle1" fontWeight="bold">{t('total')} : €{order.totalPrice?.toFixed(2)}</Typography>
                                            </Box>
                                        </Box>
                                    </Paper>
                                </Grid>
                            );
                        })}
                    </Grid>

                    {showPagination && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <Pagination count={Math.ceil(filteredOrders.length / ordersPerPage)} page={page} onChange={handlePageChange} color="primary" />
                        </Box>
                    )}
                </>
            ) : (
                <Typography color="text.secondary">{t('noOrdersMatchFilter', 'No orders match this filter.')}</Typography>
            )}

            {/* ✅ THE ORDER DETAILS DIALOG (POP-UP) */}
            <Dialog 
                open={!!selectedOrder} 
                onClose={() => setSelectedOrderId(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                {selectedOrder && (
                    <>
                        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                            <Box>
                                {/* ✅ TRANSLATED ORDER NUMBER & SUBHEADER */}
                                <Typography variant="h5" fontWeight="bold">{t('orderNum', { orderId: selectedOrder.orderNumber })}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <AccessTimeIcon fontSize="inherit"/> 
                                    {selectedOrder.pickupTime 
                                        ? new Date(selectedOrder.pickupTime).toLocaleString(i18n.language, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' }) 
                                        : t('pickupAsap', 'ASAP')}
                                </Typography>
                            </Box>
                            <IconButton onClick={() => setSelectedOrderId(null)}><CloseIcon /></IconButton>
                        </DialogTitle>
                        
                        <DialogContent sx={{ p: 3 }}>
                            
                            {selectedOrder.specialInstructions && (
                                <Box sx={{ mb: 3, p: 2, bgcolor: '#fff3cd', borderLeft: '4px solid #ff9800', borderRadius: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#e65100' }}>⚠️ Special Instructions:</Typography>
                                    <Typography variant="body2" sx={{ color: '#e65100' }}>{selectedOrder.specialInstructions}</Typography>
                                </Box>
                            )}

                            {selectedOrder.diningOption === 'DELIVERY' && selectedOrder.deliveryAddress && (
                                <Box sx={{ mb: 3, p: 2, bgcolor: '#e3f2fd', borderLeft: '4px solid #2196f3', borderRadius: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0d47a1' }}>🛵 Delivery Address:</Typography>
                                    <Typography variant="body2" sx={{ color: '#0d47a1' }}>{selectedOrder.deliveryAddress}</Typography>
                                </Box>
                            )}

                            {/* ✅ TRANSLATED ORDER ITEMS TITLE */}
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>{t('orderItemsLabel')}</Typography>
                            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, mb: 3 }}>
                                {selectedOrder.items?.map((item, index) => {
                                    let selectedOptions = [];
                                    if (item.selectedOptions) try { selectedOptions = JSON.parse(item.selectedOptions); } catch (e) {}
                                    return (
                                        <Box component="li" key={index} sx={{ mb: 1.5, pb: 1.5, borderBottom: '1px dashed #eee' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body1" fontWeight="bold">{item.quantity}x {item.name}</Typography>
                                            </Box>
                                            {selectedOptions.length > 0 && (
                                                <Box component="ul" sx={{ pl: 2, mt: 0.5, fontSize: '0.9rem', color: 'text.secondary' }}>
                                                    {selectedOptions.map((opt, i) => <li key={i}><strong>{opt.optionName}:</strong> {opt.choices.join(', ')}</li>)}
                                                </Box>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Box>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                <Typography variant="h6">{t('total')}</Typography>
                                <Typography variant="h6" fontWeight="bold">€{selectedOrder.totalPrice?.toFixed(2)}</Typography>
                            </Box>

                            {/* ✅ TRANSLATED CUSTOMER INFO TITLE */}
                            {selectedOrder.customerName && (
                                <Box sx={{ p: 2, bgcolor: '#f0f4f8', borderRadius: 2, border: '1px solid #d9e2ec' }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>{t('customerDetailsLabel')}</Typography>
                                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold', color: '#334e68' }}>
                                        <PersonIcon fontSize="small" /> {selectedOrder.customerName}
                                    </Typography>
                                    {selectedOrder.customerPhone && (
                                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, color: '#334e68' }}>
                                            <PhoneIcon fontSize="small" /> 
                                            <a href={`tel:${selectedOrder.customerPhone}`} style={{ color: '#005cc5', textDecoration: 'none', fontWeight: 'bold' }}>
                                                {selectedOrder.customerPhone}
                                            </a>
                                        </Typography>
                                    )}
                                </Box>
                            )}

                        </DialogContent>
                        
                        <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa', borderTop: '1px solid #eee', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
                                    <>
                                        <Button size="small" variant="outlined" color="error" onClick={() => { setOrderToCancel(selectedOrder.id); setCancelDialogOpen(true); }}>
                                            {t('cancel')}
                                        </Button>
                                        <Button size="small" variant="outlined" color="warning" onClick={() => { setDelayOrderId(selectedOrder.id); setDelayDialogOpen(true); }}>
                                            {t('notifyDelay', 'Delay')}
                                        </Button>
                                    </>
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {selectedOrder.status === 'PENDING' && <Button variant="contained" color="warning" onClick={() => handleUpdateStatus(selectedOrder.id, 'CONFIRMED')}>{t('confirm')}</Button>}
                                {selectedOrder.status === 'CONFIRMED' && <Button variant="contained" color="warning" onClick={() => handleUpdateStatus(selectedOrder.id, 'PREPARING')}>{t('preparing')}</Button>}
                                {selectedOrder.status === 'PREPARING' && <Button variant="contained" color="success" onClick={() => handleUpdateStatus(selectedOrder.id, 'READY_FOR_PICKUP')}>{t('ready')}</Button>}
                                {selectedOrder.status === 'READY_FOR_PICKUP' && <Button variant="contained" color="primary" onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERED')}>{t('deliver')}</Button>}
                            </Box>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Cancel Confirm Dialog */}
            <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
                <DialogTitle>{t('confirmCancellationTitle', 'Cancel Order?')}</DialogTitle>
                <DialogContent><DialogContentText>{t('confirmCancellationText', 'Are you sure you want to cancel this order?')}</DialogContentText></DialogContent>
                <DialogActions>
                    <Button onClick={() => setCancelDialogOpen(false)}>{t('keepOrder', 'Keep Order')}</Button>
                    <Button onClick={confirmCancel} color="error" variant="contained">{t('confirmCancel', 'Yes, Cancel')}</Button>
                </DialogActions>
            </Dialog>

            {/* Delay Dialog */}
            <Dialog open={delayDialogOpen} onClose={() => setDelayDialogOpen(false)}>
                <DialogTitle>{t('notifyDelayTitle', 'Notify Customer of Delay')}</DialogTitle>
                <DialogContent><DialogContentText>{t('notifyDelayMessage', 'How many minutes late will this order be?')}</DialogContentText></DialogContent>
                <DialogActions>
                    <Button onClick={() => setDelayDialogOpen(false)}>{t('cancel', 'Cancel')}</Button>
                    <Button onClick={() => sendDelayNotification(15)} color="warning" variant="contained">+15 {t('mins', 'Mins')}</Button>
                    <Button onClick={() => sendDelayNotification(30)} color="warning" variant="contained">+30 {t('mins', 'Mins')}</Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}