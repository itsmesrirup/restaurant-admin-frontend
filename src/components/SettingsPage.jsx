import React, { useState, useEffect } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
// Import a Switch component from MUI for a nice toggle UI
import { Switch, FormControlLabel } from '@mui/material';

function SettingsPage() {
    const { user } = useAuth();
    const [settings, setSettings] = useState({
        name: '',
        address: '',
        email: '',
        reservationsEnabled: false,
        qrCodeOrderingEnabled: false
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // You need to create this GET /api/restaurants/me endpoint
        apiClient.get('/api/restaurants/me')
            .then(data => {
                setSettings(data);
                setIsLoading(false);
            });
    }, []);

    const handleToggleChange = (event) => {
        const { name, checked } = event.target;
        setSettings(prev => ({ ...prev, [name]: checked }));
    };

    const handleSave = async () => {
        const promise = apiClient.put(`/api/restaurants/${user.restaurantId}`, settings);
        toast.promise(promise, {
            loading: 'Saving settings...',
            success: 'Settings updated!',
            error: 'Failed to save settings.'
        });
    };
    
    if (isLoading) return <p>Loading settings...</p>;

    return (
        <div>
            <h2>Restaurant Settings</h2>
            {/* Form for name, address, email... */}
            
            <h3>Feature Management</h3>
            <FormControlLabel
                control={
                    <Switch
                        checked={settings.reservationsEnabled}
                        onChange={handleToggleChange}
                        name="reservationsEnabled"
                    />
                }
                label="Enable Online Table Reservations"
            />
            <br />
            <FormControlLabel
                control={
                    <Switch
                        checked={settings.qrCodeOrderingEnabled}
                        onChange={handleToggleChange}
                        name="qrCodeOrderingEnabled"
                    />
                }
                label="Enable QR Code Ordering"
            />
            <br />
            <button onClick={handleSave}>Save Settings</button>
        </div>
    );
}

export default SettingsPage;