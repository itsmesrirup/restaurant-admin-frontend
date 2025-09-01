// File: restaurant-admin-frontend/src/components/OrderDashboard.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

function OrderDashboard() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [isFetchingInitial, setIsFetchingInitial] = useState(true); // Renamed for clarity
    const [filter, setFilter] = useState('PENDING');

    // This function is stable and will not cause re-renders.
    const fetchOrders = useCallback(async () => {
        if (!user) return;
        
        try {
            const data = await apiClient.get(`/api/orders/byRestaurant/${user.restaurantId}`);
            data.sort((a, b) => b.id - a.id);
            setOrders(data);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            // Only show a toast if the initial fetch fails. Background refresh failures can be silent.
            if (isFetchingInitial) {
                toast.error("Could not load orders.");
            }
        } finally {
            // This ensures the main "Loading..." message only appears once.
            if (isFetchingInitial) {
                setIsFetchingInitial(false);
            }
        }
    }, [user, isFetchingInitial]); // Depends on these stable or one-time-change variables

    // This effect handles the initial load and sets up the polling.
    useEffect(() => {
        if (user) { // Only start fetching once the user profile is available
            fetchOrders(); // Initial fetch
            const interval = setInterval(fetchOrders, 15000); // Background refresh
            return () => clearInterval(interval); // Cleanup on unmount
        }
    }, [user, fetchOrders]); // Re-run if the user changes


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

    // Show loading indicator until the initial user profile AND the initial order fetch are done.
    if (!user || isFetchingInitial) {
        return <p>Loading live orders...</p>;
    }

    return (
        <div>
            <h2>Live Orders for {user.restaurantName}</h2>
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '10px' }}>
                <strong>Filter:</strong>
                <button onClick={() => setFilter('PENDING')} disabled={filter === 'PENDING'}>Pending</button>
                <button onClick={() => setFilter('CONFIRMED')} disabled={filter === 'CONFIRMED'}>Confirmed</button>
                <button onClick={() => setFilter('PREPARING')} disabled={filter === 'PREPARING'}>Preparing</button>
                <button onClick={() => setFilter('ALL')} disabled={filter === 'ALL'}>Show All</button>
            </div>
            {filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                    <div key={order.id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px', borderRadius: '8px' }}>
                        <h4>
                            Order #{order.id}
                            {order.tableNumber && ` - For Table #${order.tableNumber}`}
                        </h4>
                        <p><strong>Status: {order.status}</strong></p>
                        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                            {order.items && order.items.map(item => (
                                <li key={item.menuItemId}>
                                    {item.quantity} x {item.name}
                                </li>
                            ))}
                        </ul>
                        <p><strong>Total: ${order.totalPrice ? order.totalPrice.toFixed(2) : '0.00'}</strong></p>
                        <div>
                            <button onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}>Confirm</button>
                            <button onClick={() => handleUpdateStatus(order.id, 'PREPARING')}>Preparing</button>
                            <button onClick={() => handleUpdateStatus(order.id, 'READY_FOR_PICKUP')}>Ready</button>
                            <button onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}>Deliver</button>
                        </div>
                    </div>
                ))
            ) : (
                <p>No orders match the current filter.</p>
            )}
        </div>
    );
}

export default OrderDashboard;