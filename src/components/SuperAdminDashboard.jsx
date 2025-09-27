import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Paper, Typography, Box, TextField, Button, Grid, Divider, List, ListItem, ListItemText, IconButton, CircularProgress } from '@mui/material';
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
                        <ListItem key={restaurant.id} divider secondaryAction={
                            // CONDITIONAL BUTTON LOGIC
                            restaurant.active ? (
                                // If the restaurant is active, show the Delete button
                                <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteRestaurant(restaurant.id)}>
                                    <DeleteIcon color="error" />
                                </IconButton>
                            ) : (
                                // If it's inactive, show the Activate button
                                <Button 
                                    size="small" 
                                    variant="outlined" 
                                    color="success" 
                                    onClick={() => handleReactivateRestaurant(restaurant.id)}
                                >
                                    Reactivate
                                </Button>
                            )
                        }>
                            <ListItemText 
                                primary={`${restaurant.name} (ID: ${restaurant.id})`}
                                // Dim the text for inactive restaurants
                                sx={{ textDecoration: restaurant.active ? 'none' : 'line-through' }}
                                secondary={restaurant.active ? 'Status: Active' : 'Status: INACTIVE/Archived'}
                            />
                        </ListItem>
                    ))}
                </List>
            )}
        </Box>
    );
}

export default SuperAdminDashboard;