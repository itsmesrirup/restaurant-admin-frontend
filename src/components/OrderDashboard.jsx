import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth, apiClient } from '../context/AuthContext'; // Import apiClient
import { toast } from 'react-hot-toast';

function OrderDashboard() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [filter, setFilter] = useState('PENDING');

    const fetchOrders = useCallback(async () => {
        if (!user) return;
        try {
            // Use the imported apiClient directly. It knows the full URL.
            const data = await apiClient.get(`/api/orders/byRestaurant/${user.restaurantId}`);
            data.sort((a, b) => b.id - a.id);
            setOrders(data);
        } catch (error) {
            // Only show the toast on the initial load, not on silent background refreshes.
            if(isFetching) toast.error("Could not load orders.");
        } finally {
            setIsFetching(false);
        }
    }, [user, isFetching]); // Re-run if user changes

    useEffect(() => {
        setIsFetching(true); // Set loading to true when user becomes available
        fetchOrders();
        const interval = setInterval(fetchOrders, 15000);
        return () => clearInterval(interval);
    }, [fetchOrders]);


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

    if (!user || isFetching) {
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
                <p>No orders match the current filter.</p>
            )}
        </div>
    );
}

export default OrderDashboard;