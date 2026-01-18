import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { Paper, Typography, Box, TextField, Button, Grid, CircularProgress, Alert, IconButton, Stack, Divider } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import usePageTitle from '../hooks/usePageTitle';

function WebsitePage() {
    const { t } = useTranslation();
    usePageTitle(t('websitePage'));
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        aboutUsText: '', phoneNumber: '', openingHours: '', googleMapsUrl: '', slug: '', instagramUrl: '', facebookUrl: '', twitterUrl: ''
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

    // --- ADDED: Handlers for Gallery ---
    const handleAddGalleryImage = () => {
        const currentImages = fullSettings.galleryImageUrls || [];
        setFullSettings({ ...fullSettings, galleryImageUrls: [...currentImages, ''] });
    };

    const handleGalleryUrlChange = (index, value) => {
        const newImages = [...(fullSettings.galleryImageUrls || [])];
        newImages[index] = value;
        setFullSettings({ ...fullSettings, galleryImageUrls: newImages });
    };

    const handleRemoveGalleryImage = (index) => {
        const newImages = [...(fullSettings.galleryImageUrls || [])];
        newImages.splice(index, 1);
        setFullSettings({ ...fullSettings, galleryImageUrls: newImages });
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
                <Typography variant="body2" sx={{ mt: 2 }}>
                   Upgrade to access the Website Editor, SEO tools, and Gallery management.
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>{t('managePublicWebsite')}</Typography>
            
            {/* --- SECTION 1: SEO & BASIC CONTENT --- */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12}><Typography variant="h6" color="text.secondary">SEO Settings</Typography></Grid>
                <Grid item xs={12}>
                    <TextField name="metaTitle" label={t('seoPageTitle')} value={fullSettings.metaTitle || ''} onChange={handleInputChange} fullWidth helperText={t('seoPageTitleHelper')} />
                </Grid>
                <Grid item xs={12}>
                    <TextField name="metaDescription" label={t('seoPageDescription')} value={fullSettings.metaDescription || ''} onChange={handleInputChange} fullWidth multiline rows={2} helperText={t('seoPageDescriptionHelper')} />
                </Grid>

                <Grid item xs={12}><Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>Content</Typography></Grid>
                <Grid item xs={12}>
                    <TextField name="aboutUsText" label={t('aboutUs')} value={fullSettings.aboutUsText || ''} onChange={handleInputChange} fullWidth multiline rows={6} helperText={t('aboutUsHelper')} />
                </Grid>
            </Grid>

            <Divider />

            {/* --- SECTION 2: GALLERY --- */}
            <Box sx={{ my: 4 }}>
                <Typography variant="h6" gutterBottom>Gallery Images</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Add URLs for images you want to display in your About section.
                </Typography>
                
                {(fullSettings.galleryImageUrls || []).map((url, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <TextField
                            label={`Image URL #${index + 1}`}
                            value={url}
                            onChange={(e) => handleGalleryUrlChange(index, e.target.value)}
                            fullWidth
                            size="small"
                        />
                        <IconButton onClick={() => handleRemoveGalleryImage(index)} color="error">
                            <DeleteIcon />
                        </IconButton>
                    </Box>
                ))}
                <Button startIcon={<AddCircleOutlineIcon />} onClick={handleAddGalleryImage} variant="outlined" size="small">
                    Add Image URL
                </Button>
            </Box>

            <Divider />

            {/* --- SECTION 3: SOCIAL MEDIA --- */}
            <Box sx={{ my: 4 }}>
                <Typography variant="h6" gutterBottom>Social Media Links</Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                        <TextField name="instagramUrl" label="Instagram URL" value={fullSettings.instagramUrl || ''} onChange={handleInputChange} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField name="facebookUrl" label="Facebook URL" value={fullSettings.facebookUrl || ''} onChange={handleInputChange} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField name="twitterUrl" label="Twitter URL" value={fullSettings.twitterUrl || ''} onChange={handleInputChange} fullWidth />
                    </Grid>
                </Grid>
            </Box>

            <Divider />

            {/* --- SECTION 4: LOCATION --- */}
            <Box sx={{ my: 4 }}>
                <Typography variant="h6" gutterBottom>Location Map</Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <TextField name="googleMapsUrl" label="Google Maps URL" value={fullSettings.googleMapsUrl || ''} onChange={handleInputChange} fullWidth helperText={t('googleMapsHelper')} />
                    </Grid>
                </Grid>
            </Box>

            {/* --- SAVE BUTTON --- */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" onClick={handleSave} disabled={isSaving} size="large">
                    {isSaving ? t('saving') : t('saveWebsiteContent')}
                </Button>
            </Box>
        </Paper>
    );
}

export default WebsitePage;