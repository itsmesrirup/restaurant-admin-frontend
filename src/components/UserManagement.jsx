import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Paper, Typography, Box, TextField, Button, Grid, Divider, List, ListItem, ListItemText, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

function UserManagement() {
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
            loading: 'Creating user...',
            success: () => {
                setFormData({ email: '', password: '' });
                fetchStaff();
                return 'Kitchen staff account created!';
            },
            error: (err) => err.message || "Failed to create user."
        });
    };

    const handleDelete = (userId) => {
        if (!window.confirm("Delete this user account?")) return;
        toast.promise(apiClient.delete(`/api/users/my-staff/${userId}`), {
            loading: 'Deleting user...',
            success: () => { fetchStaff(); return 'User deleted!'; },
            error: (err) => err.message || "Failed to delete user."
        });
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>User Management</Typography>
            <Paper component="form" onSubmit={handleSubmit} sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6">Add New Kitchen Staff</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={5}><TextField label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} fullWidth required /></Grid>
                    <Grid item xs={12} sm={5}><TextField label="Password" name="password" type="password" value={formData.password} onChange={handleInputChange} fullWidth required /></Grid>
                    <Grid item xs={12} sm={2}><Button type="submit" variant="contained" fullWidth sx={{ height: '100%' }}>Add Staff</Button></Grid>
                </Grid>
            </Paper>
            
            <Typography variant="h6">Current Users</Typography>
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