import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
// --- ADDED: Material-UI Components ---
import { 
    Paper, Typography, Box, Button, CircularProgress, Grid, Chip, 
    Card, CardContent, CardActions, Divider, IconButton 
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import usePageTitle from '../hooks/usePageTitle';

function ReservationManagement() {
    const { t } = useTranslation();
    usePageTitle(t('reservations'));
    const { user } = useAuth();
    const [reservations, setReservations] = useState([]);
    const [isFetching, setIsFetching] = useState(true);

    const fetchReservations = useCallback(async () => {
        if (!user) return;
        setIsFetching(true);
        try {
            const data = await apiClient.get('/api/reservations/by-restaurant');
            // Sort: Pending first, then by date descending
            data.sort((a, b) => {
                if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
                if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
                return new Date(b.reservationTime) - new Date(a.reservationTime);
            });
            setReservations(data);
        } catch (error) {
            toast.error(t("failedToLoadReservations"));
        } finally {
            setIsFetching(false);
        }
    }, [user, t]);

    useEffect(() => {
        fetchReservations();
    }, [fetchReservations]);

    const handleUpdateStatus = (reservationId, status) => {
        const promise = apiClient.patch(`/api/reservations/${reservationId}/status`, { status });
        toast.promise(promise, {
            loading: t('updatingStatus'),
            success: () => {
                fetchReservations();
                return t('reservationUpdated');
            },
            error: t('couldNotUpdateReservation')
        });
    };
    
    // Helper to get status chip color
    const getStatusColor = (status) => {
        switch(status) {
            case 'CONFIRMED': return 'success';
            case 'CANCELLED': return 'error';
            case 'PENDING': return 'warning';
            default: return 'default';
        }
    };

    if (!user || isFetching) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

    return (
        <Box>
            <Typography variant="h4" gutterBottom>{t('reservationsTitle', { restaurantName: user.restaurantName })}</Typography>
            
            {reservations.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                    <Typography variant="h6">{t('noReservations')}</Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {reservations.map(res => (
                        <Grid item xs={12} md={6} lg={4} key={res.id}>
                            <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderLeft: res.status === 'PENDING' ? '6px solid #ed6c02' : 'none' }}>
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Chip 
                                            label={t(`reservationStatusValues.${res.status}`, { defaultValue: res.status })} 
                                            color={getStatusColor(res.status)}
                                            size="small"
                                            sx={{ fontWeight: 'bold' }}
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            #{res.id}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                        <EventIcon color="action" sx={{ mr: 1.5 }} />
                                        <Typography variant="h6">
                                            {new Date(res.reservationTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                        </Typography>
                                    </Box>

                                    <Divider sx={{ my: 1.5 }} />

                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <PeopleIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                                        <Typography>
                                            <strong>{res.customerName}</strong> ({res.partySize} ppl)
                                        </Typography>
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <PhoneIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                                        <Typography variant="body2">{res.customerPhone}</Typography>
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <EmailIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                                        <Typography variant="body2" noWrap title={res.customerEmail}>{res.customerEmail}</Typography>
                                    </Box>
                                </CardContent>

                                {res.status === 'PENDING' && (
                                    <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                                        <Button 
                                            variant="outlined" 
                                            color="error" 
                                            startIcon={<CancelIcon />}
                                            onClick={() => handleUpdateStatus(res.id, 'CANCELLED')}
                                            size="small"
                                        >
                                            {t('cancel')}
                                        </Button>
                                        <Button 
                                            variant="contained" 
                                            color="success" 
                                            startIcon={<CheckCircleIcon />}
                                            onClick={() => handleUpdateStatus(res.id, 'CONFIRMED')}
                                            disableElevation
                                        >
                                            {t('confirm')}
                                        </Button>
                                    </CardActions>
                                )}
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
}

export default ReservationManagement;