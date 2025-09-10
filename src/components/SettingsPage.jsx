import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Switch, FormControlLabel, TextField, Button, Paper, Typography, Box, Grid, CircularProgress } from '@mui/material';

function SettingsPage() {
    const { user } = useAuth();
    // Initialize state with all possible fields to prevent runtime errors
    const [settings, setSettings] = useState({
        name: '',
        address: '',
        email: '',
        reservationsEnabled: false,
        qrCodeOrderingEnabled: false,
        useDarkTheme: false,
        logoUrl: '',
        heroImageUrl: '',
        // Add other theme color fields here if you decide to bring them back
        // themePrimaryColor: '', 
        // themeSecondaryColor: '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchSettings = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            // This endpoint fetches the current restaurant's full details
            const data = await apiClient.get('/api/restaurants/me');
            // Ensure all fields have a value to avoid "uncontrolled component" warnings
            setSettings({
                name: data.name || '',
                address: data.address || '',
                email: data.email || '',
                reservationsEnabled: data.reservationsEnabled || false,
                qrCodeOrderingEnabled: data.qrCodeOrderingEnabled || false,
                useDarkTheme: data.useDarkTheme || false,
                logoUrl: data.logoUrl || '',
                heroImageUrl: data.heroImageUrl || '',
            });
        } catch (error) {
            toast.error("Failed to load restaurant settings.");
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleToggleChange = (event) => {
        const { name, checked } = event.target;
        setSettings(prev => ({ ...prev, [name]: checked }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        const promise = apiClient.put(`/api/restaurants/${user.restaurantId}`, settings);
        toast.promise(promise, {
            loading: 'Saving settings...',
            success: 'Settings updated successfully!',
            error: 'Failed to save settings.'
        }).finally(() => setIsSaving(false));
    };
    
    if (isLoading) {
        return <p>Loading settings...</p>;
    }

    return (
        <Paper sx={{ p: 3, maxWidth: '800px', margin: 'auto' }}>
            <Typography variant="h5" gutterBottom>Restaurant Settings</Typography>
            
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <TextField label="Restaurant Name" name="name" value={settings.name} onChange={handleInputChange} fullWidth margin="normal" />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField label="Address" name="address" value={settings.address} onChange={handleInputChange} fullWidth margin="normal" />
                </Grid>
                <Grid item xs={12}>
                    <TextField label="Contact Email for Notifications" name="email" type="email" value={settings.email} onChange={handleInputChange} fullWidth margin="normal" />
                </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Branding & Display</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <TextField label="Logo Image URL" name="logoUrl" value={settings.logoUrl} onChange={handleInputChange} fullWidth margin="normal" helperText="e.g., https://example.com/logo.png" />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField label="Decorative Menu Image URL" name="heroImageUrl" value={settings.heroImageUrl} onChange={handleInputChange} fullWidth margin="normal" helperText="Optional image for the menu page" />
                </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Feature Management</Typography>
            <Box>
                <FormControlLabel
                    control={<Switch checked={settings.useDarkTheme} onChange={handleToggleChange} name="useDarkTheme" />}
                    label="Use Dark Theme for Customer Page"
                />
                <br/>
                <FormControlLabel
                    control={<Switch checked={settings.reservationsEnabled} onChange={handleToggleChange} name="reservationsEnabled" />}
                    label="Enable Online Table Reservations"
                />
                <br />
                <FormControlLabel
                    control={<Switch checked={settings.qrCodeOrderingEnabled} onChange={handleToggleChange} name="qrCodeOrderingEnabled" />}
                    label="Enable QR Code Ordering"
                />
                <FormControlLabel
                    control={<Switch checked={settings.recommendationsEnabled} onChange={handleToggleChange} name="recommendationsEnabled" />}
                    label="Enable AI-Powered Recommendations"
                />
            </Box>
            
            <Box sx={{ mt: 3, position: 'relative' }}>
                <Button variant="contained" onClick={handleSave} disabled={isSaving}>
                    Save Settings
                </Button>
                {isSaving && <CircularProgress size={24} sx={{ position: 'absolute', top: '50%', left: '50%', mt: '-12px', ml: '-40px' }} />}
            </Box>
        </Paper>
    );
}

export default SettingsPage;