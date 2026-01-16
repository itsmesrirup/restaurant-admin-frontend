import React, { useState } from 'react';
import { apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Container, Paper, Typography, TextField, Button, Box, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // --- ADDED ---
import LanguageSwitcher from './LanguageSwitcher';

function ForgotPasswordPage() {
    const { t } = useTranslation(); // --- ADDED ---
    const [email, setEmail] = useState('');
    const [isSent, setIsSent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // --- ADDED ---

    // --- ADDED: Simple Email Validation Helper ---
    const isValidEmail = (email) => {
        return /\S+@\S+\.\S+/.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // --- ADDED: Validation ---
        if (!isValidEmail(email)) {
            toast.error(t('invalidEmailFormat'));
            return;
        }

        setIsSubmitting(true);
        try {
            await apiClient.post('/api/auth/forgot-password', { email });
            setIsSent(true);
            toast.success(t('resetLinkSent')); // --- CHANGED ---
        } catch (error) {
            // Check if it's a 404 (User not found) to give better feedback?
            // Usually for security we don't reveal if user exists, but general error is fine.
            toast.error(t('errorSendingEmail')); // --- CHANGED ---
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSent) {
        return (
            <Container maxWidth="xs" sx={{ mt: 8, textAlign: 'center' }}>
                <Typography variant="h5">{t('checkYourEmail')}</Typography>
                <Typography>{t('resetEmailSentMessage', { email })}</Typography>
                <Button component={RouterLink} to="/login" sx={{ mt: 2 }}>{t('backToLogin')}</Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="xs" sx={{ mt: 8 }}>
            <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                <LanguageSwitcher />
            </Box>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom>{t('forgotPasswordTitle')}</Typography>
                <Box component="form" onSubmit={handleSubmit}>
                    <TextField 
                        label={t('enterEmail')} 
                        fullWidth 
                        required 
                        value={email} 
                        type="email" // HTML5 validation trigger
                        onChange={(e) => setEmail(e.target.value)} 
                        margin="normal" 
                    />
                    <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={isSubmitting}>
                        {isSubmitting ? t('sendingRequest') : t('sendResetLink')}
                    </Button>
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                         <Link component={RouterLink} to="/login">{t('backToLogin')}</Link>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}

export default ForgotPasswordPage;