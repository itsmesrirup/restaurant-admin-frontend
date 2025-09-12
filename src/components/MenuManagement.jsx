import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Switch, FormControlLabel, Checkbox, Paper, Typography, Box, TextField, Button, Select, MenuItem, Grid } from '@mui/material';
import MenuItemOptionsModal from './MenuItemOptionsModal';

const renderCategoryOptions = (categories, level = 0) => {
    let options = [];
    categories.forEach(category => {
        options.push(<MenuItem key={category.id} value={category.id} sx={{ pl: level * 2 }}>{category.name}</MenuItem>);
        if (category.subCategories?.length > 0) {
            options = options.concat(renderCategoryOptions(category.subCategories, level + 1));
        }
    });
    return options;
};

const INITIAL_FORM_STATE = { name: '', price: '', description: '', categoryId: '', isBundle: false };

function MenuManagement() {
    const { user } = useAuth();
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [optionsModalOpen, setOptionsModalOpen] = useState(false);
    const [currentItemForOptions, setCurrentItemForOptions] = useState(null);

    const fetchAllData = useCallback(async () => {
        if (!user) return;
        setIsFetching(true);
        try {
            const [menuData, categoryData] = await Promise.all([
                apiClient.get(`/api/menu-items/by-restaurant`),
                apiClient.get('/api/categories/by-restaurant')
            ]);
            setMenuItems(menuData);
            setCategories(categoryData);
        } catch (error) { toast.error("Failed to load menu data."); }
        finally { setIsFetching(false); }
    }, [user]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const resetForm = () => {
        setFormData(INITIAL_FORM_STATE);
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.categoryId) { return toast.error("Please select a category."); }
        setIsSubmitting(true);
        const payload = {
            name: formData.name, price: parseFloat(formData.price), description: formData.description,
            restaurantId: user.restaurantId, categoryId: parseInt(formData.categoryId), bundle: formData.isBundle
        };
        const promise = editingId ? apiClient.put(`/api/menu-items/${editingId}`, payload) : apiClient.post('/api/menu-items', payload);
        toast.promise(promise, {
            loading: editingId ? 'Updating item...' : 'Adding item...',
            success: () => { resetForm(); fetchAllData(); return editingId ? 'Item updated!' : 'Item added!'; },
            error: (err) => err.message
        }).finally(() => setIsSubmitting(false));
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setFormData({
            name: item.name, price: item.price, description: item.description || '',
            categoryId: item.categoryId ? String(item.categoryId) : '', isBundle: item.bundle || false
        });
    };

    const handleDelete = (itemId) => {
        if (!window.confirm("Are you sure?")) return;
        const promise = apiClient.delete(`/api/menu-items/${itemId}`);
        toast.promise(promise, {
            loading: 'Deleting...',
            success: () => { fetchAllData(); return 'Item deleted!'; },
            error: (err) => err.message
        });
    };
    
    const handleAvailabilityToggle = (itemId, currentStatus) => {
        const promise = apiClient.patch(`/api/menu-items/${itemId}/availability`, { available: !currentStatus });
        toast.promise(promise, {
            loading: 'Updating...',
            success: () => { fetchAllData(); return 'Availability updated!'; },
            error: (err) => err.message
        });
    };

    const openOptionsManager = (item) => {
        setCurrentItemForOptions(item);
        setOptionsModalOpen(true);
    };

    if (!user || isFetching) return <p>Loading menu...</p>;

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Menu Management for {user.restaurantName}</Typography>
            <Paper component="form" onSubmit={handleSubmit} sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6">{editingId ? 'Edit Menu Item' : 'Add New Menu Item'}</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                        <TextField select label="Category *" name="categoryId" value={formData.categoryId} onChange={handleInputChange} required fullWidth>
                            <MenuItem value="">-- Select a Category --</MenuItem>
                            {renderCategoryOptions(categories)}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Item Name *" name="name" value={formData.name} onChange={handleInputChange} required fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Price *" name="price" type="number" value={formData.price} onChange={handleInputChange} required fullWidth InputProps={{ inputProps: { step: "0.01" } }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Description (optional)" name="description" value={formData.description} onChange={handleInputChange} fullWidth multiline rows={2} />
                    </Grid>
                    <Grid item xs={12}>
                        <FormControlLabel 
                            control={<Checkbox checked={formData.isBundle} onChange={handleInputChange} name="isBundle" />} 
                            label="This is a 'Formule' / Bundle Item (with choices)" 
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Button type="submit" variant="contained" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : (editingId ? 'Update Item' : 'Add Item')}</Button>
                        {editingId && <Button onClick={resetForm} disabled={isSubmitting} sx={{ ml: 1 }}>Cancel</Button>}
                    </Grid>
                </Grid>
            </Paper>

            <Typography variant="h6">Existing Menu Items</Typography>
            {menuItems.map(item => (
                <Paper key={item.id} sx={{ p: 2, my: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1">
                            <strong>{item.name}</strong> 
                            {item.bundle && <span style={{fontSize: '0.8rem', color: 'gray', marginLeft: '8px'}}>(Formule/Bundle)</span>}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{item.categoryName || 'Uncategorized'} - ${item.price?.toFixed(2)}</Typography>
                    </Box>
                    <FormControlLabel control={<Switch checked={item.isAvailable} onChange={() => handleAvailabilityToggle(item.id, item.isAvailable)}/>} label={item.isAvailable ? "Available" : "Out of Stock"} />
                    <Button size="small" onClick={() => handleEdit(item)}>Edit</Button>
                    {item.bundle && <Button size="small" variant="outlined" onClick={() => openOptionsManager(item)}>Manage Choices</Button>}
                    <Button size="small" color="error" onClick={() => handleDelete(item.id)}>Delete</Button>
                </Paper>
            ))}
            
            <MenuItemOptionsModal open={optionsModalOpen} handleClose={() => setOptionsModalOpen(false)} menuItem={currentItemForOptions} onUpdate={fetchAllData} />
        </Box>
    );
}

export default MenuManagement;