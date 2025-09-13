import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Box, Typography, Button, Paper, Grid } from '@mui/material';

function OrderDashboard() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [isFetchingInitial, setIsFetchingInitial] = useState(true);
    const [filter, setFilter] = useState('PENDING');

    const fetchOrders = useCallback(async () => {
        if (!user) return;
        try {
            const data = await apiClient.get(`/api/orders/byRestaurant/${user.restaurantId}`);
            data.sort((a, b) => b.id - a.id);
            setOrders(data);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            if (isFetchingInitial) {
                toast.error("Could not load orders.");
            }
        } finally {
            if (isFetchingInitial) {
                setIsFetchingInitial(false);
            }
        }
    }, [user, isFetchingInitial]);

    useEffect(() => {
        if (user) {
            fetchOrders();
            const interval = setInterval(fetchOrders, 15000);
            return () => clearInterval(interval);
        }
    }, [user, fetchOrders]);

    const handleUpdateStatus = async (orderId, newStatus) => {
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

    if (!user || isFetchingInitial) {
        return <p>Loading live orders...</p>;
    }

    return (
        // ✅ Use Typography for consistent text styling
        <Box>
            <Typography variant="h4" gutterBottom>Live Orders for {user.restaurantName}</Typography>
            
            <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="body1"><strong>Filter:</strong></Typography>
                {/* ✅ Use MUI Buttons for consistent styling */}
                <Button variant={filter === 'PENDING' ? 'contained' : 'outlined'} onClick={() => setFilter('PENDING')}>Pending</Button>
                <Button variant={filter === 'CONFIRMED' ? 'contained' : 'outlined'} onClick={() => setFilter('CONFIRMED')}>Confirmed</Button>
                <Button variant={filter === 'PREPARING' ? 'contained' : 'outlined'} onClick={() => setFilter('PREPARING')}>Preparing</Button>
                <Button variant={filter === 'ALL' ? 'contained' : 'outlined'} onClick={() => setFilter('ALL')}>Show All</Button>
            </Box>
            
            {filteredOrders.length > 0 ? (
                // ✅ Use a Grid container for better responsive layout of order cards
                <Grid container spacing={2}>
                    {filteredOrders.map(order => (
                        <Grid item xs={12} sm={6} md={4} key={order.id}>
                            {/* ✅ Use a Paper component for the card */}
                            <Paper elevation={3} sx={{ p: 2, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6">Order #{order.id}</Typography>
                                        {order.tableNumber && <Typography variant="h6" color="secondary">For Table #{order.tableNumber}</Typography>}
                                    <Typography variant="body1" sx={{ mt: 1 }}><strong>Status: {order.status}</strong></Typography>
                                    
                                    <Box component="ul" sx={{ listStyle: 'none', p: 0, mt: 1 }}>
                                        {order.items && order.items.map(item => {
                                            // Logic to parse and display selected options
                                            let selectedOptions = [];
                                            if (item.selectedOptions) {
                                                try {
                                                    selectedOptions = JSON.parse(item.selectedOptions);
                                                } catch (e) {
                                                    console.error("Failed to parse selected options", e);
                                                }
                                            }
                                            
                                            return (
                                                <li key={item.menuItemId}>
                                                    {item.quantity} x {item.name}
                                                    {/* Render the choices if they exist */}
                                                    {selectedOptions.length > 0 && (
                                                        <Box component="ul" sx={{ pl: 2, fontSize: '0.9rem', color: 'text.secondary' }}>
                                                            {selectedOptions.map((opt, index) => <li key={index}>{opt}</li>)}
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
            ) : (
                <Typography>No orders match the current filter.</Typography>
            )}
        </Box>
    );
}

export default OrderDashboard;