import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

function ReservationManagement() {
    const { user, api } = useAuth();
    const [reservations, setReservations] = useState([]);
    const [isFetching, setIsFetching] = useState(true);

    const fetchReservations = useCallback(async () => {
        if (!user) return;
        setIsFetching(true);
        try {
            // Uses the new protected endpoint
            const data = await api.get('/api/reservations/by-restaurant');
            // Sort by reservation time, newest first
            data.sort((a, b) => new Date(b.reservationTime) - new Date(a.reservationTime));
            setReservations(data);
        } catch (error) {
            toast.error("Failed to load reservations.");
        } finally {
            setIsFetching(false);
        }
    }, [user, api]);

    useEffect(() => {
        fetchReservations();
    }, [fetchReservations]);

    const handleUpdateStatus = (reservationId, status) => {
        const promise = api.patch(`/api/reservations/${reservationId}/status`, { status });
        toast.promise(promise, {
            loading: 'Updating status...',
            success: () => {
                fetchReservations();
                return 'Reservation updated!';
            },
            error: 'Could not update reservation.'
        });
    };
    
    if (isFetching) return <p>Loading reservations...</p>;

    return (
        <div>
            <h2>Reservation Management for {user.restaurantName}</h2>
            {reservations.length === 0 ? (
                <p>You have no pending or confirmed reservations.</p>
            ) : (
                reservations.map(res => (
                    <div key={res.id} style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem 0', borderRadius: '8px' }}>
                        <p><strong>Status:</strong> {res.status}</p>
                        <p><strong>Date:</strong> {new Date(res.reservationTime).toLocaleString()}</p>
                        <p><strong>Name:</strong> {res.customerName}</p>
                        <p><strong>Party Size:</strong> {res.partySize}</p>
                        <p><strong>Email:</strong> {res.customerEmail}</p>
                        <p><strong>Phone:</strong> {res.customerPhone}</p>
                        {res.status === 'PENDING' && (
                            <div>
                                <button onClick={() => handleUpdateStatus(res.id, 'CONFIRMED')}>Confirm</button>
                                <button onClick={() => handleUpdateStatus(res.id, 'CANCELLED')}>Cancel</button>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}

export default ReservationManagement;