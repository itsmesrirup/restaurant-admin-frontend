import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Switch, FormControlLabel, TextField, Button, Paper, Typography, Box, Grid } from '@mui/material';

function SettingsPage() {
    const { user } = useAuth();
    const [settings, setSettings] = useState({
        name: '', address: '', email: '',
        reservationsEnabled: false, qrCodeOrderingEnabled: false,
        themePrimaryColor: '', themeSecondaryColor: '',
        themeBackgroundColor: '', themePaperColor: '',
        themeTextColorPrimary: '', themeTextColorSecondary: '',
        themeBackgroundImageUrl: '', logoUrl: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchSettings = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await apiClient.get('/api/restaurants/me');
            setSettings(data);
        } catch (error) {
            toast.error("Failed to load settings.");
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
    
    if (isLoading) return <p>Loading settings...</p>;

    return (
        <Paper sx={{ p: 3, maxWidth: '800px', margin: 'auto' }}>
            <Typography variant="h5" gutterBottom>Restaurant Settings</Typography>
            
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <TextField label="Restaurant Name" name="name" value={settings.name || ''} onChange={handleInputChange} fullWidth margin="normal" />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField label="Address" name="address" value={settings.address || ''} onChange={handleInputChange} fullWidth margin="normal" />
                </Grid>
                <Grid item xs={12}>
                    <TextField label="Contact Email for Notifications" name="email" type="email" value={settings.email || ''} onChange={handleInputChange} fullWidth margin="normal" />
                </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Branding & Theme</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <TextField label="Logo Image URL" name="logoUrl" value={settings.logoUrl || ''} onChange={handleInputChange} fullWidth margin="normal" />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField label="Background Image URL" name="themeBackgroundImageUrl" value={settings.themeBackgroundImageUrl || ''} onChange={handleInputChange} fullWidth margin="normal" />
                </Grid>
                <Grid item xs={12} sm={6}><TextField label="Primary Color (Hex)" name="themePrimaryColor" value={settings.themePrimaryColor || ''} onChange={handleInputChange} fullWidth margin="normal" /></Grid>
                <Grid item xs={12} sm={6}><TextField label="Secondary/Accent Color (Hex)" name="themeSecondaryColor" value={settings.themeSecondaryColor || ''} onChange={handleInputChange} fullWidth margin="normal" /></Grid>
                <Grid item xs={12} sm={6}><TextField label="Background Color (Hex)" name="themeBackgroundColor" value={settings.themeBackgroundColor || ''} onChange={handleInputChange} fullWidth margin="normal" /></Grid>
                <Grid item xs={12} sm={6}><TextField label="Card/Paper Color (Hex)" name="themePaperColor" value={settings.themePaperColor || ''} onChange={handleInputChange} fullWidth margin="normal" /></Grid>
                <Grid item xs={12} sm={6}><TextField label="Primary Text Color (Hex)" name="themeTextColorPrimary" value={settings.themeTextColorPrimary || ''} onChange={handleInputChange} fullWidth margin="normal" /></Grid>
                <Grid item xs={12} sm={6}><TextField label="Secondary Text Color (Hex)" name="themeTextColorSecondary" value={settings.themeTextColorSecondary || ''} onChange={handleInputChange} fullWidth margin="normal" /></Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Feature Management</Typography>
            <Box>
                <FormControlLabel
                    control={<Switch checked={settings.reservationsEnabled} onChange={handleToggleChange} name="reservationsEnabled" />}
                    label="Enable Online Table Reservations"
                />
                <FormControlLabel
                    control={<Switch checked={settings.qrCodeOrderingEnabled} onChange={handleToggleChange} name="qrCodeOrderingEnabled" />}
                    label="Enable QR Code Ordering"
                />
            </Box>
            
            <Button variant="contained" onClick={handleSave} sx={{ mt: 3 }} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
        </Paper>
    );
}

export default SettingsPage;