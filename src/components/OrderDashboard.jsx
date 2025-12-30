import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Box, Typography, Button, Paper, Grid, Pagination, CircularProgress, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

function OrderDashboard() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const ordersPerPage = 9;

    const fetchOrders = useCallback(async () => {
        if (!user) return;
        try {
            const data = await apiClient.get('/api/orders/by-restaurant');
            // Sort: Pending/Preparing first, then by ID
            data.sort((a, b) => b.id - a.id);
            setOrders(data);
        } catch (error) {
            // Only show toast on the initial load, not silent refreshes
            if (isLoading) toast.error("Could not load order history.");
        } finally {
            setIsLoading(false);
        }
    }, [user, isLoading]); // Dependency on isLoading ensures toast only shows once

    // ✅ RESTORED: useEffect for polling
    useEffect(() => {
        if (user) {
            fetchOrders(); // Initial fetch
            const interval = setInterval(fetchOrders, 15000); // Poll every 15 seconds
            return () => clearInterval(interval); // Cleanup
        }
    }, [user, fetchOrders]);

    const handleUpdateStatus = (orderId, newStatus) => {
        const promise = apiClient.patch(`/api/orders/${orderId}/status`, { status: newStatus });
        toast.promise(promise, {
            loading: 'Updating status...',
            success: (updatedOrder) => {
                setOrders(prevOrders => 
                    prevOrders.map(o => o.id === orderId ? { ...o, status: updatedOrder.status } : o)
                );
                return 'Order status updated!';
            },
            error: 'Failed to update status.'
        });
    };
    
    const filteredOrders = useMemo(() => {
        // --- ADDED: Scheduled Filter Logic ---
        if (filter === 'SCHEDULED') {
            // Show orders that HAVE a pickup time and are NOT completed/cancelled
            return orders.filter(order => 
                order.pickupTime !== null && 
                order.status !== 'DELIVERED' && 
                order.status !== 'CANCELLED'
            );
        }

        // For other tabs, generally hide the future scheduled ones to keep "Live" clean
        // (Optional: You can decide if "ALL" should include scheduled or not)
        if (filter === 'ALL') return orders;
        
        return orders.filter(order => order.status === filter);
    }, [orders, filter]);
    
    const paginatedOrders = useMemo(() => {
        const startIndex = (page - 1) * ordersPerPage;
        return filteredOrders.slice(startIndex, startIndex + ordersPerPage);
    }, [filteredOrders, page, ordersPerPage]);

    const handlePageChange = (event, value) => {
        setPage(value);
        window.scrollTo(0, 0);
    };

    const showPagination = filteredOrders.length > ordersPerPage;

    if (isLoading) {
        return <CircularProgress />;
    }

    return (
        <Box sx={{ pb: 4 }}>
            <Typography variant="h4" gutterBottom>{t('liveOrdersTitle')}</Typography>
            <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="body1"><strong>{t('filter')}:</strong></Typography>
                {/* --- ADDED: Scheduled Button --- */}
                <Button 
                    variant={filter === 'SCHEDULED' ? 'contained' : 'outlined'} 
                    color="secondary" // Distinct color
                    startIcon={<AccessTimeIcon />}
                    onClick={() => { setFilter('SCHEDULED'); setPage(1); }}
                >
                    {t('scheduledFilter')}
                </Button>

                <Button variant={filter === 'PENDING' ? 'contained' : 'outlined'} onClick={() => { setFilter('PENDING'); setPage(1); }}>{t('pending')}</Button>
                <Button variant={filter === 'CONFIRMED' ? 'contained' : 'outlined'} onClick={() => { setFilter('CONFIRMED'); setPage(1); }}>{t('confirmed')}</Button>
                <Button variant={filter === 'PREPARING' ? 'contained' : 'outlined'} onClick={() => { setFilter('PREPARING'); setPage(1); }}>{t('preparing')}</Button>
                <Button variant={filter === 'ALL' ? 'contained' : 'outlined'} onClick={() => { setFilter('ALL'); setPage(1); }}>{t('showAll')}</Button>
            </Box>
            
            {filteredOrders.length > 0 ? (
                <>
                    <Grid container spacing={3} alignItems="stretch">
                        {paginatedOrders.map(order => (
                            <Grid item xs={12} sm={6} lg={4} key={order.id} sx={{ display: 'flex' }}>
                                {/* --- FIX: The Paper component now fills the flex container --- */}
                                <Paper 
                                    elevation={3} 
                                    sx={{ 
                                        p: 2, 
                                        width: '100%',
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        justifyContent: 'space-between', // Push footer to bottom
                                        borderRadius: 2, 
                                        border: order.pickupTime ? '2px solid #9c27b0' : 'none',
                                        // Crucial: No fixed height here! Let content dictate height.
                                    }}
                                >
                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="h6">{t('orderNum', { orderId: order.id })}</Typography>
                                            {order.tableNumber && <Chip label={t('forTable', { tableNumber: order.tableNumber })} color="primary" size="small" />}
                                        </Box>
                                        
                                        {order.pickupTime ? (
                                            <Typography variant="body1" sx={{ mt: 1, color: 'secondary.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <AccessTimeIcon fontSize="small"/> 
                                                {new Date(order.pickupTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                                            </Typography>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{t('pickupAsap')}</Typography>
                                        )}

                                        <Typography variant="body1" sx={{ mt: 1 }}><strong>{t('statusLabel')}</strong> {t(`orderStatus.${order.status}`, { defaultValue: order.status })}</Typography>
                                        
                                        <Divider sx={{ my: 1 }} />
                                        <Box component="ul" sx={{ listStyle: 'none', p: 0, mt: 1 }}>
                                            {order.items?.map((item, index) => {
                                                let selectedOptions = [];
                                                if (item.selectedOptions) try { selectedOptions = JSON.parse(item.selectedOptions); } catch (e) {}
                                                return (
                                                    <li key={`${item.menuItemId}-${index}`}>
                                                        {item.quantity} x {item.name}
                                                        {selectedOptions.length > 0 && (
                                                            <Box component="ul" sx={{ pl: 2, fontSize: '0.9rem', color: 'text.secondary' }}>
                                                                {selectedOptions.map((opt, i) => <li key={i}>{opt}</li>)}
                                                            </Box>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </Box>
                                        <Typography variant="h6" sx={{ mt: 1 }}><strong>{t('total', { total: `€${order.totalPrice?.toFixed(2)}` })}</strong></Typography>
                                    </Box>
                                    
                                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        <Button size="small" variant="outlined" onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}>{t('confirm')}</Button>
                                        <Button size="small" variant="outlined" onClick={() => handleUpdateStatus(order.id, 'PREPARING')}>{t('preparing')}</Button>
                                        <Button size="small" variant="outlined" onClick={() => handleUpdateStatus(order.id, 'READY_FOR_PICKUP')}>{t('ready')}</Button>
                                        <Button size="small" variant="outlined" onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}>{t('deliver')}</Button>
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                    {showPagination && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <Pagination 
                                count={Math.ceil(filteredOrders.length / ordersPerPage)} 
                                page={page} 
                                onChange={handlePageChange}
                                color="primary"
                            />
                        </Box>
                    )}
                </>
            ) : (
                <Typography>{t('noOrdersMatchFilter')}</Typography>
            )}
        </Box>
    );
}

export default OrderDashboard;