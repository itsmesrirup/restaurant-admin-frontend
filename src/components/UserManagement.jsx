import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Paper, Typography, Box, TextField, Button, Grid, Divider, List, ListItem, ListItemText, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';

function UserManagement() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [staff, setStaff] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState({ email: '', password: '' });

    const fetchStaff = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await apiClient.get('/api/users/my-staff');
            setStaff(data);
        } catch (error) { toast.error("Could not load staff list."); }
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => { fetchStaff(); }, [fetchStaff]);

    const handleInputChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        toast.promise(apiClient.post('/api/users/my-staff', formData), {
            loading: t('creatingUser'),
            success: () => {
                setFormData({ email: '', password: '' });
                fetchStaff();
                return t('userCreated');
            },
            error: (err) => err.message || t("failedToCreateUser")
        });
    };

    const handleDelete = (userId) => {
        if (!window.confirm(t("confirmDeleteUserPrompt"))) return;
        toast.promise(apiClient.delete(`/api/users/my-staff/${userId}`), {
            loading: t('deletingUser'),
            success: () => { fetchStaff(); return t('userDeleted'); },
            error: (err) => err.message || t("failedToDeleteUser")
        });
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>{t('userManagementTitle')}</Typography>
            <Paper component="form" onSubmit={handleSubmit} sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6">{t('addKitchenStaff')}</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={5}><TextField label={t('email')} name="email" type="email" value={formData.email} onChange={handleInputChange} fullWidth required /></Grid>
                    <Grid item xs={12} sm={5}><TextField label={t('password')} name="password" type="password" value={formData.password} onChange={handleInputChange} fullWidth required /></Grid>
                    <Grid item xs={12} sm={2}><Button type="submit" variant="contained" fullWidth sx={{ height: '100%' }}>{t('addStaff')}</Button></Grid>
                </Grid>
            </Paper>
            
            <Typography variant="h6">{t('currentUsers')}</Typography>
            <List>
                {staff.map(staffMember => (
                    <ListItem key={staffMember.id} divider secondaryAction={
                        // Don't allow deleting your own account
                        user.email !== staffMember.email && (
                            <IconButton edge="end" onClick={() => handleDelete(staffMember.id)}>
                                <DeleteIcon />
                            </IconButton>
                        )
                    }>
                        <ListItemText primary={staffMember.email} secondary={staffMember.role} />
                    </ListItem>
                ))}
            </List>
        </Box>
    );
}

export default UserManagement;