import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Switch, FormControlLabel, TextField, Button, Paper, Typography, Box, Grid, CircularProgress, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import OpeningHoursEditor from './OpeningHoursEditor';

function SettingsPage() {
    const { user } = useAuth();
    const { t } = useTranslation();
    // Initialize state with all possible fields to prevent runtime errors
    const [fullSettings, setFullSettings] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchAllSettings = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await apiClient.get('/api/restaurants/me');
            setFullSettings(data); // Store the complete object
        } catch (error) {
            toast.error(t("failedToLoadSettings"));
        } finally {
            setIsLoading(false);
        }
    }, [user, t]);

    useEffect(() => {
        fetchAllSettings();
    }, [fetchAllSettings]);

    const handleInputChange = (event) => {
        setFullSettings(prev => ({ ...prev, [event.target.name]: event.target.value }));
    };

    const handleToggleChange = (event) => {
        setFullSettings(prev => ({ ...prev, [event.target.name]: event.target.checked }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        // --- CHANGED: Send the complete `fullSettings` object ---
        const promise = apiClient.put(`/api/restaurants/${user.restaurantId}`, fullSettings);
        toast.promise(promise, {
            loading: t('savingSettings'),
            success: t('settingsUpdated'),
            error: t('failedToSaveSettings')
        }).finally(() => setIsSaving(false));
    };

    // Handler specifically for the Opening Hours component
    const handleOpeningHoursChange = (newJsonString) => {
        setFullSettings(prev => ({ ...prev, openingHoursJson: newJsonString }));
    };
    
    if (isLoading || !fullSettings) {
        return <p>{t('loadingSettings')}</p>;
    }

    // --- Helper variables to check for feature availability for cleaner JSX ---
    const canUseReservations = user.availableFeatures?.includes('RESERVATIONS');
    const canUseQrOrdering = user.availableFeatures?.includes('QR_ORDERING');
    const canUseRecommendations = user.availableFeatures?.includes('RECOMMENDATIONS');

    return (
        <Paper sx={{ p: 3, maxWidth: '800px', margin: 'auto' }}>
            <Typography variant="h5" gutterBottom>{t('settingsTitle')}</Typography>
            
            {/* --- SECTION 1: Basic Info (Name, Address, Email, Phone) --- */}
            <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>General Information</Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                    <TextField label={t('restaurantName')} name="name" value={fullSettings.name || ''} onChange={handleInputChange} fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField label={t('address')} name="address" value={fullSettings.address || ''} onChange={handleInputChange} fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField label={t('contactEmail')} name="email" value={fullSettings.email || ''} onChange={handleInputChange} fullWidth />
                </Grid>
                {/* --- MOVED: Phone Number is now here for better alignment --- */}
                <Grid item xs={12} sm={6}>
                    <TextField label={t('phoneLabelAdmin')} name="phoneNumber" value={fullSettings.phoneNumber || ''} onChange={handleInputChange} fullWidth />
                </Grid>
            </Grid>

            {/* --- SECTION 2: Operating Hours (Full Width) --- */}
            <Box sx={{ mt: 4 }}>
                {/* The component handles its own header, or we can add one here */}
                <OpeningHoursEditor 
                    value={fullSettings.openingHoursJson} 
                    onChange={handleOpeningHoursChange} 
                />
            </Box>

            {/* --- SECTION 3: Branding --- */}
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>{t('brandingDisplay')}</Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                    <TextField label={t('logoUrl')} name="logoUrl" value={fullSettings.logoUrl || ''} onChange={handleInputChange} fullWidth helperText={t('logoUrlHelper')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField label={t('menuImageUrl')} name="heroImageUrl" value={fullSettings.heroImageUrl || ''} onChange={handleInputChange} fullWidth helperText={t('menuImageUrlHelper')} />
                </Grid>
            </Grid>

            {/* --- SECTION 4: Features --- */}
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>{t('featureManagement')}</Typography>
            <Box>
                <FormControlLabel
                    control={<Switch checked={fullSettings.useDarkTheme} onChange={handleToggleChange} name="useDarkTheme" />}
                    label={t('useDarkTheme')}
                />
                <br/>
                <Tooltip title={!canUseReservations ? t('upgradeToPro', 'Upgrade to PRO plan to enable this feature') : ""}>
                    {/* The outer span is necessary for the Tooltip to work on a disabled element */}
                    <span>
                        <FormControlLabel
                            control={
                                <Switch 
                                    // The `checked` prop now respects the feature flag.
                                    // It's only checked if the feature is available AND the setting is true.
                                    checked={canUseReservations && fullSettings.reservationsEnabled} 
                                    onChange={handleToggleChange} 
                                    name="reservationsEnabled" 
                                />
                            }
                            label={t('enableReservations')}
                            // The `disabled` prop remains the same.
                            disabled={!canUseReservations}
                        />
                    </span>
                </Tooltip>
                <br />
                
                <Tooltip title={!canUseQrOrdering ? t('upgradeToPro', 'Upgrade to PRO plan to enable this feature') : ""}>
                    <span>
                        <FormControlLabel
                            control={
                                <Switch 
                                    checked={canUseQrOrdering && fullSettings.qrCodeOrderingEnabled} 
                                    onChange={handleToggleChange} 
                                    name="qrCodeOrderingEnabled" 
                                />
                            }
                            label={t('enableQrOrdering')}
                            disabled={!canUseQrOrdering}
                        />
                    </span>
                </Tooltip>
                 <br />

                <Tooltip title={!canUseRecommendations ? t('upgradeToPremium', 'Upgrade to PREMIUM plan to enable this feature') : ""}>
                    <span>
                        <FormControlLabel
                            control={
                                <Switch 
                                    checked={canUseRecommendations && fullSettings.recommendationsEnabled} 
                                    onChange={handleToggleChange} 
                                    name="recommendationsEnabled" 
                                />
                            }
                            label={t('enableRecommendations')}
                            disabled={!canUseRecommendations}
                        />
                    </span>
                </Tooltip>
            </Box>
            
            <Box sx={{ mt: 3, position: 'relative' }}>
                <Button variant="contained" onClick={handleSave} disabled={isSaving}>
                    {t('saveSettings')}
                </Button>
                {isSaving && <CircularProgress size={24} sx={{ position: 'absolute', top: '50%', left: '50%', mt: '-12px', ml: '-40px' }} />}
            </Box>
        </Paper>
    );
}

export default SettingsPage;