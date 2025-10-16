import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { Paper, Typography, Box, TextField, Button, Grid, CircularProgress, Alert } from '@mui/material';

function WebsitePage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        aboutUsText: '', phoneNumber: '', openingHours: '', googleMapsUrl: '', slug: ''
    });
    const [fullSettings, setFullSettings] = useState(null); 
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // This is a protected component, so we can check the user's features
    const hasWebsiteFeature = user.availableFeatures?.includes('WEBSITE_BUILDER');
    
    const fetchAllSettings = useCallback(async () => {
        if (!user) { 
            setIsLoading(false); 
            return; 
        }
        setIsLoading(true);
        try {
            const data = await apiClient.get('/api/restaurants/me');
            setFullSettings(data);
        } catch (error) {
            toast.error(t("failedToLoadRestaurantData"));
        } finally {
            setIsLoading(false);
        }
    }, [user, t]);

    useEffect(() => {
        fetchAllSettings();
    }, [fetchAllSettings]);

    const handleInputChange = (e) => {
        setFullSettings(prev => ({ ...prev, [e.target.name]: e.target.value }));

    };

    const handleSave = () => {
        setIsSaving(true);
        // --- CHANGED: Send the complete `fullSettings` object ---
        const promise = apiClient.put(`/api/restaurants/${user.restaurantId}`, fullSettings);
        toast.promise(promise, {
            loading: t('saving'),
            success: t('websiteContentSaved'),
            error: t('failedToSaveContent')
        }).finally(() => setIsSaving(false));
    };

    if (isLoading || !fullSettings) return <CircularProgress />;

    // If user doesn't have the feature, show an "upgrade" message
    if (!hasWebsiteFeature) {
        return (
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>{t('websiteBuilderTitle')}</Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                    {t('readOnlyUpgradePrompt')}
                </Alert>
                {/* A read-only view so the user knows their data is safe */}
                <Box mt={3}>
                    <Typography gutterBottom><strong>{t('readOnlySlug')}</strong> {fullSettings.slug || t('notSet')}</Typography>
                    <Typography gutterBottom><strong>{t('readOnlyPhone')}</strong> {fullSettings.phoneNumber || t('notSet')}</Typography>
                    <Typography gutterBottom><strong>{t('readOnlyHours')}</strong> {fullSettings.openingHours || t('notSet')}</Typography>
                </Box>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>{t('managePublicWebsite')}</Typography>
            <Grid container spacing={3}>
                 {/* --- FIX: All `value` and `helperText` props now correctly read from `fullSettings` --- */}
                <Grid item xs={12}>
                    <TextField
                        name="metaTitle"
                        label={t('seoPageTitle')}
                        value={fullSettings.metaTitle || ''}
                        onChange={handleInputChange}
                        fullWidth
                        helperText={t('seoPageTitleHelper')}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        name="metaDescription"
                        label={t('seoPageDescription')}
                        value={fullSettings.metaDescription || ''}
                        onChange={handleInputChange}
                        fullWidth
                        multiline
                        rows={2}
                        helperText={t('seoPageDescriptionHelper')}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        name="slug"
                        label={t('websiteSlugLabel')}
                        value={fullSettings.slug || ''}
                        onChange={handleInputChange}
                        fullWidth
                        helperText={t('websiteSlugHelper', { slug: fullSettings.slug || '...' })}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        name="aboutUsText"
                        label={t('aboutUs')}
                        value={fullSettings.aboutUsText || ''}
                        onChange={handleInputChange}
                        fullWidth
                        multiline
                        rows={6}
                        helperText={t('aboutUsHelper')}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField name="phoneNumber" label={t('phoneLabelAdmin')} value={fullSettings.phoneNumber || ''} onChange={handleInputChange} fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField name="openingHours" label={t('hoursLabel')} value={fullSettings.openingHours || ''} onChange={handleInputChange} fullWidth helperText={t('openingHoursHelper')} />
                </Grid>
                <Grid item xs={12}>
                    <TextField name="googleMapsUrl" label="Google Maps URL" value={fullSettings.googleMapsUrl || ''} onChange={handleInputChange} fullWidth helperText={t('googleMapsHelper')} />
                </Grid>
                <Grid item xs={12}>
                    <Button variant="contained" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? t('saving') : t('saveWebsiteContent')}
                    </Button>
                </Grid>
            </Grid>
        </Paper>
    );
}

export default WebsitePage;