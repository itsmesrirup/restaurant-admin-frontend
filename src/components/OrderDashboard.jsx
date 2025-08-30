// File: restaurant-admin-frontend/src/components/OrderDashboard.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

function OrderDashboard() {
    // --- STATE MANAGEMENT ---
    const { user, api } = useAuth(); // Hooks must be inside the component body

    const [orders, setOrders] = useState([]);
    
    // Loading state for the initial fetch
    const [isFetching, setIsFetching] = useState(true);
    
    // State for the active filter
    const [filter, setFilter] = useState('PENDING'); // Default to showing new orders first

    // --- DATA FETCHING ---
    const fetchOrders = useCallback(async (isInitial = false) => {
        if (!user) return;
        
        if (isInitial) {
            setIsFetching(true);
        }
        
        try {
            const data = await api.get(`/api/orders/byRestaurant/${user.restaurantId}`);
            data.sort((a, b) => b.id - a.id);
            setOrders(data);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            // Only show the toast on the initial load, not on silent background refreshes.
            if (isInitial) {
                toast.error("Could not load orders.");
            }
        } finally {
            // Always set isFetching to false after the initial load attempt.
            if (isInitial) {
                setIsFetching(false);
            }
        }
    }, [user, api]);

    // This effect runs the fetchOrders function on mount and sets up a polling interval
    useEffect(() => {
        fetchOrders(true); // Initial fetch
        const interval = setInterval(fetchOrders, 15000); // Refresh every 15 seconds
        
        // Cleanup function to clear the interval when the component unmounts
        return () => clearInterval(interval);
    }, [fetchOrders]);


    // --- ACTION HANDLERS ---
    const handleUpdateStatus = async (orderId, newStatus) => {
        const promise = api.patch(`${import.meta.env.VITE_API_BASE_URL}/api/orders/${orderId}/status`, { status: newStatus });
        
        toast.promise(promise, {
            loading: 'Updating order status...',
            success: (updatedOrder) => {
                // To make the UI feel faster, we can optimistically update the state
                // before waiting for the next fetch interval.
                setOrders(prevOrders => 
                    prevOrders.map(o => o.id === orderId ? { ...o, status: updatedOrder.status } : o)
                );
                return 'Order status updated successfully!';
            },
            error: (err) => `Error: ${err.message || 'Failed to update status.'}`
        });
    };
    
    // --- RENDER LOGIC ---

    // Memoize the filtered list to avoid re-calculating on every render
    const filteredOrders = useMemo(() => {
        if (filter === 'ALL') {
            return orders;
        }
        return orders.filter(order => order.status === filter);
    }, [orders, filter]);

    // Guard clause for the initial loading state of the user profile
    if (!user) {
        return <p>Loading user data...</p>;
    }

    return (
        <div>
            <h2>Live Orders for {user.restaurantName}</h2>
            
            {/* Filter Buttons */}
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '10px' }}>
                <strong>Filter:</strong>
                <button onClick={() => setFilter('PENDING')} disabled={filter === 'PENDING'}>Pending</button>
                <button onClick={() => setFilter('CONFIRMED')} disabled={filter === 'CONFIRMED'}>Confirmed</button>
                <button onClick={() => setFilter('PREPARING')} disabled={filter === 'PREPARING'}>Preparing</button>
                <button onClick={() => setFilter('ALL')} disabled={filter === 'ALL'}>Show All</button>
            </div>

            {/* Initial Loading State */}
            {isFetching && orders.length === 0 && <p>Loading live orders...</p>}

            {/* Main Content: Orders List or Empty State Message */}
            {!isFetching && (
                <div>
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map(order => (
                            <div key={order.id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px', borderRadius: '8px' }}>
                                <h4>Order #{order.id} - Status: {order.status}</h4>
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
                        // Empty state message when not loading and no items exist for the current filter
                        <p>No orders match the current filter.</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default OrderDashboard;