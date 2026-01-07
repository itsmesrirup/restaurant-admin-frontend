import React, { useEffect, useRef } from 'react';
import { apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Box, CircularProgress, Typography } from '@mui/material';

function StripeCallbackPage({ onViewChange }) {
    const processedRef = useRef(false); // Strict Ref to prevent double execution

    useEffect(() => {
        // 1. Get Code
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (!code) {
            // If no code, just go back immediately. Don't show error toast.
            onViewChange('settings');
            return;
        }

        if (processedRef.current) return; // Stop if already running
        processedRef.current = true;

        const connectStripe = async () => {
            try {
                await apiClient.post('/api/payments/authorize-merchant', { code });
                toast.success("Stripe Connected!");
            } catch (error) {
                console.error("Connection Error:", error);
                // We ignore the error here because if it's "Already Used", 
                // it means it succeeded in a previous/parallel request.
            } finally {
                // 3. CLEANUP & REDIRECT
                // Remove the ?code=... from the URL bar so it doesn't re-trigger on refresh
                //window.history.replaceState({}, document.title, window.location.pathname);
                window.history.replaceState({}, document.title, "/");
                // Force a small delay to allow DB update to propagate/settle
                setTimeout(() => {
                    // Force a reload of the entire app state by resetting the view
                    onViewChange('settings');
                    // Optional: Window reload ensures fresh data fetch if context is stale
                    // window.location.href = '/'; 
                }, 1000);
            }
        };

        connectStripe();

    }, [onViewChange]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 10 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Finalizing Stripe Connection...</Typography>
        </Box>
    );
}

export default StripeCallbackPage;