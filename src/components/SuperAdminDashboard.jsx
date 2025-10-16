import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Paper, Typography, Box, TextField, Button, Grid, Divider, List, ListItem, ListItemText, IconButton, CircularProgress, FormControl, InputLabel, Select, MenuItem, InputAdornment } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

function SuperAdminDashboard() {
    // --- State for the component ---
    const [restaurants, setRestaurants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [restaurantName, setRestaurantName] = useState('');
    const [restaurantAddress, setRestaurantAddress] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userPassword, setUserPassword] = useState('');
    const [userRestaurantId, setUserRestaurantId] = useState('');

    const fetchAllRestaurants = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await apiClient.get('/api/restaurants/all');
            setRestaurants(data);
        } catch (error) {
            toast.error("Could not fetch restaurants.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllRestaurants();
    }, [fetchAllRestaurants]);

    const handleCreateRestaurant = async (e) => {
        e.preventDefault();
        const promise = apiClient.post('/api/restaurants', { name: restaurantName, address: restaurantAddress });
        toast.promise(promise, {
            loading: 'Creating restaurant...',
            success: (newRestaurant) => {
                setRestaurantName('');
                setRestaurantAddress('');
                return `Restaurant "${newRestaurant.name}" created with ID: ${newRestaurant.id}!`;
            },
            error: (err) => err.message,
        });
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        const promise = apiClient.post('/api/auth/register', { 
            email: userEmail, 
            password: userPassword, 
            restaurantId: parseInt(userRestaurantId) 
        });
        toast.promise(promise, {
            loading: 'Creating admin user...',
            success: () => {
                setUserEmail('');
                setUserPassword('');
                setUserRestaurantId('');
                return 'Admin user created successfully!';
            },
            error: (err) => err.message,
        });
    };

    const handleModelChange = (restaurantId, newModel) => {
        const promise = apiClient.patch(`/api/restaurants/${restaurantId}/model`, { paymentModel: newModel });
        toast.promise(promise, {
            loading: 'Updating model...',
            success: () => {
                fetchAllRestaurants(); // Refetch from server to get the full, correct state
                return 'Payment model updated!';
            },
            error: (err) => err.message
        });
    };

    const handleCommissionChange = (restaurantId, newRate) => {
        if (isNaN(newRate) || newRate < 0) {
            toast.error("Please enter a valid, non-negative commission rate.");
            return;
        }
        const promise = apiClient.patch(`/api/restaurants/${restaurantId}/commission`, { commissionRate: newRate });
        toast.promise(promise, {
            loading: 'Updating commission...',
            success: () => {
                fetchAllRestaurants(); // Refetch to confirm the change
                return 'Commission rate updated!';
            },
            error: (err) => err.message
        });
    };

    // Handler for deleting a restaurant
    const handleDeleteRestaurant = (restaurantId) => {
        if (!window.confirm(`Are you sure you want to archive restaurant ID ${restaurantId}? This will deactivate it.`)) return;

        const promise = apiClient.delete(`/api/restaurants/${restaurantId}`);
        toast.promise(promise, {
            loading: 'Archiving restaurant...',
            success: () => {
                fetchAllRestaurants(); // Refresh the list
                return 'Restaurant archived successfully!';
            },
            error: (err) => err.message || 'Failed to archive restaurant.'
        });
    };

    // Handler for reactivating a restaurant
    const handleReactivateRestaurant = (restaurantId) => {
        if (!window.confirm(`Are you sure you want to reactivate restaurant ID ${restaurantId}?`)) return;

        const promise = apiClient.patch(`/api/restaurants/${restaurantId}/reactivate`);
        toast.promise(promise, {
            loading: 'Reactivating restaurant...',
            success: () => {
                fetchAllRestaurants(); // Refresh the list
                return 'Restaurant reactivated successfully!';
            },
            error: (err) => err.message || 'Failed to reactivate restaurant.'
        });
    };

    const handlePlanChange = (restaurantId, newPlan) => {
        const promise = apiClient.patch(`/api/restaurants/${restaurantId}/plan`, { plan: newPlan });
        toast.promise(promise, {
            loading: 'Updating plan...',
            success: () => {
                // Optimistically update the UI for an instant feel
                setRestaurants(prev => prev.map(r => r.id === restaurantId ? { ...r, plan: newPlan } : r));
                return 'Plan updated successfully!';
            },
            error: (err) => err.message || 'Failed to update plan.'
        });
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Super Admin Dashboard</Typography>

            {/* Forms for creating new restaurants and users */}
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Paper component="form" onSubmit={handleCreateRestaurant} sx={{ p: 2 }}>
                        <Typography variant="h6">Create New Restaurant</Typography>
                        <TextField fullWidth margin="normal" label="Restaurant Name" value={restaurantName} onChange={e => setRestaurantName(e.target.value)} required />
                        <TextField fullWidth margin="normal" label="Address" value={restaurantAddress} onChange={e => setRestaurantAddress(e.target.value)} required />
                        <Button type="submit" variant="contained">Create Restaurant</Button>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper component="form" onSubmit={handleCreateUser} sx={{ p: 2 }}>
                        <Typography variant="h6">Create New Restaurant Admin</Typography>
                        <TextField fullWidth margin="normal" label="Admin Email" type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} required />
                        <TextField fullWidth margin="normal" label="Temporary Password" type="password" value={userPassword} onChange={e => setUserPassword(e.target.value)} required />
                        <TextField fullWidth margin="normal" label="Restaurant ID" type="number" value={userRestaurantId} onChange={e => setUserRestaurantId(e.target.value)} required />
                        <Button type="submit" variant="contained">Create Admin</Button>
                    </Paper>
                </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />
            
            {/* List of all restaurants */}
            <Typography variant="h6">All Restaurants</Typography>
            {isLoading ? <CircularProgress /> : (
                <List>
                    {restaurants.map(restaurant => (
                        <ListItem key={restaurant.id} divider>
                            <ListItemText
                                primary={`${restaurant.name} (ID: ${restaurant.id})`}
                                sx={{ textDecoration: restaurant.active ? 'none' : 'line-through', flexGrow: 1, mr: 2 }}
                                secondary={`Status: ${restaurant.active ? 'Active' : 'INACTIVE/Archived'}`}
                            />
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                <FormControl sx={{ m: 1, minWidth: 140 }} size="small">
                                    <InputLabel>Billing Model</InputLabel>
                                    <Select
                                        value={restaurant.paymentModel || 'SUBSCRIPTION'}
                                        label="Billing Model"
                                        onChange={(e) => handleModelChange(restaurant.id, e.target.value)}
                                    >
                                        <MenuItem value={'SUBSCRIPTION'}>Subscription</MenuItem>
                                        <MenuItem value={'COMMISSION'}>Commission</MenuItem>
                                    </Select>
                                </FormControl>

                                {restaurant.paymentModel === 'COMMISSION' ? (
                                    <TextField
                                        size="small"
                                        label="Commission"
                                        type="number"
                                        defaultValue={(restaurant.commissionRate || 0) * 100}
                                        onBlur={(e) => handleCommissionChange(restaurant.id, parseFloat(e.target.value) / 100)}
                                        sx={{ width: 140 }}
                                        InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                                    />
                                ) : (
                                    <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                                        <InputLabel>Plan</InputLabel>
                                        <Select
                                            value={restaurant.plan || 'BASIC'}
                                            label="Plan"
                                            onChange={(e) => handlePlanChange(restaurant.id, e.target.value)}
                                        >
                                            <MenuItem value={'BASIC'}>Basic</MenuItem>
                                            <MenuItem value={'PRO'}>Pro</MenuItem>
                                            <MenuItem value={'PREMIUM'}>Premium</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}

                                {restaurant.active ? (
                                    <IconButton aria-label="delete" onClick={() => handleDeleteRestaurant(restaurant.id)}>
                                        <DeleteIcon color="error" />
                                    </IconButton>
                                ) : (
                                    <Button size="small" variant="outlined" color="success" onClick={() => handleReactivateRestaurant(restaurant.id)}>
                                        Reactivate
                                    </Button>
                                )}
                            </Box>
                        </ListItem>
                    ))}
                </List>
            )}
        </Box>
    );
}

export default SuperAdminDashboard;