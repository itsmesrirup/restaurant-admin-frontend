import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Box, Typography, Button, Paper, Grid, Pagination, CircularProgress } from '@mui/material';

function OrderDashboard() {
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

    if (isLoading) {
        return <CircularProgress />;
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Live Order Management</Typography>
            <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="body1"><strong>Filter:</strong></Typography>
                <Button variant={filter === 'PENDING' ? 'contained' : 'outlined'} onClick={() => { setFilter('PENDING'); setPage(1); }}>Pending</Button>
                <Button variant={filter === 'CONFIRMED' ? 'contained' : 'outlined'} onClick={() => { setFilter('CONFIRMED'); setPage(1); }}>Confirmed</Button>
                <Button variant={filter === 'PREPARING' ? 'contained' : 'outlined'} onClick={() => { setFilter('PREPARING'); setPage(1); }}>Preparing</Button>
                <Button variant={filter === 'ALL' ? 'contained' : 'outlined'} onClick={() => { setFilter('ALL'); setPage(1); }}>Show All</Button>
            </Box>
            
            {filteredOrders.length > 0 ? (
                <>
                    <Grid container spacing={2}>
                        {paginatedOrders.map(order => (
                            <Grid item xs={12} sm={6} lg={4} key={order.id}>
                                <Paper elevation={3} sx={{ p: 2, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="h6">Order #{order.id}</Typography>
                                        {order.tableNumber && <Typography variant="h6" color="secondary">For Table #{order.tableNumber}</Typography>}
                                        <Typography variant="body1" sx={{ mt: 1 }}><strong>Status: {order.status}</strong></Typography>
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
                                        <Typography variant="h6" sx={{ mt: 1 }}><strong>Total: ${order.totalPrice?.toFixed(2)}</strong></Typography>
                                    </Box>
                                    <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        <Button size="small" variant="outlined" onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}>Confirm</Button>
                                        <Button size="small" variant="outlined" onClick={() => handleUpdateStatus(order.id, 'PREPARING')}>Preparing</Button>
                                        <Button size="small" variant="outlined" onClick={() => handleUpdateStatus(order.id, 'READY_FOR_PICKUP')}>Ready</Button>
                                        <Button size="small" variant="outlined" onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}>Deliver</Button>
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <Pagination 
                            count={Math.ceil(filteredOrders.length / ordersPerPage)} 
                            page={page} 
                            onChange={handlePageChange}
                            color="primary"
                        />
                    </Box>
                </>
            ) : (
                <Typography>No orders match the current filter.</Typography>
            )}
        </Box>
    );
}

export default OrderDashboard;