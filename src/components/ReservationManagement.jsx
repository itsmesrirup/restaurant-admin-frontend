import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, apiClient } from '../context/AuthContext'; // ✅ Import apiClient
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

function ReservationManagement() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [reservations, setReservations] = useState([]);
    const [isFetching, setIsFetching] = useState(true);

    const fetchReservations = useCallback(async () => {
        if (!user) return;
        setIsFetching(true);
        try {
            const data = await apiClient.get('/api/reservations/by-restaurant'); // ✅ Use apiClient
            data.sort((a, b) => new Date(b.reservationTime) - new Date(a.reservationTime));
            setReservations(data);
        } catch (error) {
            toast.error(t("failedToLoadReservations"));
        } finally {
            setIsFetching(false);
        }
    }, [user]);

    useEffect(() => {
        fetchReservations();
    }, [fetchReservations]);

    const handleUpdateStatus = (reservationId, status) => {
        const promise = apiClient.patch(`/api/reservations/${reservationId}/status`, { status }); // ✅ Use apiClient
        toast.promise(promise, {
            loading: t('updatingStatus'),
            success: () => {
                fetchReservations();
                return t('reservationUpdated');
            },
            error: t('couldNotUpdateReservation')
        });
    };
    
    if (!user || isFetching) return <p>{t('loadingReservations')}</p>;

    return (
        // ... The rest of the JSX is the same and correct
        <div>
            <h2>{t('reservationsTitle', { restaurantName: user.restaurantName })}</h2>
            {reservations.length === 0 ? (
                <p>{t('noReservations')}</p>
            ) : (
                reservations.map(res => (
                    <div key={res.id} style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem 0', borderRadius: '8px' }}>
                        <p><strong>{t('reservationStatus')}</strong> {t(`reservationStatusValues.${res.status}`, { defaultValue: res.status })}</p>
                        <p><strong>{t('reservationDate')}</strong> {new Date(res.reservationTime).toLocaleString()}</p>
                        <p><strong>{t('reservationName')}</strong> {res.customerName}</p>
                        <p><strong>{t('reservationPartySize')}</strong> {res.partySize}</p>
                        <p><strong>{t('reservationEmail')}</strong> {res.customerEmail}</p>
                        <p><strong>{t('reservationPhone')}</strong> {res.customerPhone}</p>
                        {res.status === 'PENDING' && (
                            <div>
                                <button onClick={() => handleUpdateStatus(res.id, 'CONFIRMED')}>{t('confirm')}</button>
                                <button onClick={() => handleUpdateStatus(res.id, 'CANCELLED')}>{t('cancel')}</button>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}

export default ReservationManagement;