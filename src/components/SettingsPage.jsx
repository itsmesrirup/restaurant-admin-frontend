import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { TextField, Button, Paper, Typography, Switch, FormControlLabel } from '@mui/material';

function SettingsPage() {
    const { user } = useAuth();
    // Initialize with fallback values to prevent errors
    const [settings, setSettings] = useState({
        name: '', address: '', email: '',
        reservationsEnabled: false, qrCodeOrderingEnabled: false,
        themePrimaryColor: '', themeSecondaryColor: '', logoUrl: ''
    });
    const [isLoading, setIsLoading] = useState(true);

    const fetchSettings = useCallback(async () => {
        if (!user) return;
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
        const promise = apiClient.put(`/api/restaurants/${user.restaurantId}`, settings);
        toast.promise(promise, {
            loading: 'Saving settings...',
            success: 'Settings updated successfully!',
            error: 'Failed to save settings.'
        });
    };
    
    if (isLoading) return <p>Loading settings...</p>;

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Restaurant Settings</Typography>
            <TextField label="Restaurant Name" name="name" value={settings.name} onChange={handleInputChange} fullWidth margin="normal" />
            <TextField label="Address" name="address" value={settings.address} onChange={handleInputChange} fullWidth margin="normal" />
            <TextField label="Contact Email for Notifications" name="email" type="email" value={settings.email} onChange={handleInputChange} fullWidth margin="normal" />
            
            {/* Branding & Theme Section */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Branding & Theme</Typography>
            <TextField 
                label="Primary Color (Hex Code)" 
                name="themePrimaryColor" 
                value={settings.themePrimaryColor || ''} 
                onChange={handleInputChange} 
                fullWidth 
                margin="normal"
                helperText="e.g., #222222"
            />
            <TextField 
                label="Secondary/Accent Color (Hex Code)" 
                name="themeSecondaryColor" 
                value={settings.themeSecondaryColor || ''} 
                onChange={handleInputChange} 
                fullWidth 
                margin="normal"
                helperText="e.g., #D4AF37"
            />
            <TextField 
                label="Logo Image URL" 
                name="logoUrl" 
                value={settings.logoUrl || ''} 
                onChange={handleInputChange} 
                fullWidth 
                margin="normal"
                helperText="A direct link to your logo image (e.g., from your website)"
            />
            
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Feature Management</Typography>
            <FormControlLabel
                control={<Switch checked={settings.reservationsEnabled} onChange={handleToggleChange} name="reservationsEnabled" />}
                label="Enable Online Table Reservations"
            />
            <br />
            <FormControlLabel
                control={<Switch checked={settings.qrCodeOrderingEnabled} onChange={handleToggleChange} name="qrCodeOrderingEnabled" />}
                label="Enable QR Code Ordering"
            />
            <br />
            <Button variant="contained" onClick={handleSave} sx={{ mt: 3 }}>Save Settings</Button>
        </Paper>
    );
}

export default SettingsPage;