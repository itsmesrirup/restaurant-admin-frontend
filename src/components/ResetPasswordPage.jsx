import React, { useState } from 'react';
import { apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Paper, Typography, TextField, Button, Box } from '@mui/material';

function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('code'); // Or 'token' depending on your email link
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/api/auth/reset-password', { token, password });
            toast.success("Password updated! Please login.");
            navigate('/login');
        } catch (error) {
            toast.error("Failed to reset password.");
        }
    };

    return (
        <Container maxWidth="xs" sx={{ mt: 8 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom>Set New Password</Typography>
                <Box component="form" onSubmit={handleSubmit}>
                    <TextField 
                        label="New Password" 
                        type="password" 
                        fullWidth 
                        required 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        margin="normal" 
                    />
                    <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>Reset Password</Button>
                </Box>
            </Paper>
        </Container>
    );
}

export default ResetPasswordPage;