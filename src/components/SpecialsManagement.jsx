import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
    Paper, Typography, Box, TextField, Button, Grid, CircularProgress, 
    Divider, IconButton, List, ListItem, ListItemText, Switch, FormControlLabel,
    Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const INITIAL_MENU_FORM_STATE = { title: '', subtitle: '', startDate: '', endDate: '', isActive: true };
const INITIAL_ITEM_FORM_STATE = { dayTitle: '', name: '', description: '' };

function SpecialsManagement() {
    const { user } = useAuth();
    const [specialMenus, setSpecialMenus] = useState([]);
    const [selectedMenu, setSelectedMenu] = useState(null);
    const [menuFormData, setMenuFormData] = useState(INITIAL_MENU_FORM_STATE);
    const [itemFormData, setItemFormData] = useState(INITIAL_ITEM_FORM_STATE);
    const [editingMenuId, setEditingMenuId] = useState(null);
    const [editingItemId, setEditingItemId] = useState(null); 
    const [isLoading, setIsLoading] = useState(true);

    const sortItemsByDay = (items = []) => {
        const dayOrder = { "LUNDI": 1, "MARDI": 2, "MERCREDI": 3, "JEUDI": 4, "VENDREDI": 5, "SAMEDI": 6, "DIMANCHE": 7 };
        // Use slice() to create a copy before sorting
        return items.slice().sort((a, b) => dayOrder[a.dayTitle?.toUpperCase()] - dayOrder[b.dayTitle?.toUpperCase()]);
    };

    const fetchSpecialMenus = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await apiClient.get('/api/special-menus/my-restaurant');
            // ✅ Ensure items within each menu are sorted on fetch
            const sortedData = data.map(menu => ({ ...menu, items: sortItemsByDay(menu.items) }));
            setSpecialMenus(sortedData);
        } catch (error) { toast.error("Failed to load special menus."); }
        finally { setIsLoading(false); }
    }, [user]);

    useEffect(() => { fetchSpecialMenus(); }, [fetchSpecialMenus]);

    // Helper function to update both states consistently
    const updateBothStates = (updatedMenu) => {
        setSelectedMenu(updatedMenu);
        setSpecialMenus(prev => prev.map(m => m.id === updatedMenu.id ? updatedMenu : m));
    };

    const handleMenuFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setMenuFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    
    const handleItemFormChange = (e) => setItemFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSaveMenu = async (e) => {
        e.preventDefault();
        if (new Date(menuFormData.startDate) > new Date(menuFormData.endDate)) {
            toast.error("End date must be after the start date.");
            return;
        }

        const payload = {
            title: menuFormData.title,
            subtitle: menuFormData.subtitle,
            startDate: menuFormData.startDate,
            endDate: menuFormData.endDate,
            active: menuFormData.isActive // Map frontend state 'isActive' to backend DTO 'active'
        };

        const promise = editingMenuId 
            ? apiClient.put(`/api/special-menus/${editingMenuId}`, payload)
            : apiClient.post('/api/special-menus', payload);

        toast.promise(promise, {
            loading: editingMenuId ? 'Saving changes...' : 'Creating menu...',
            success: (updatedMenu) => {
                setMenuFormData(INITIAL_MENU_FORM_STATE);
                setEditingMenuId(null);
                fetchSpecialMenus();
                if (selectedMenu && selectedMenu.id === updatedMenu.id) {
                    setSelectedMenu(updatedMenu);
                }
                return editingMenuId ? 'Menu updated!' : 'Menu created!';
            },
            error: (err) => err.message || 'Failed to save menu.'
        });
    };

    const handleEditMenu = (menu) => {
        setEditingMenuId(menu.id);
        // Ensure every form field has a defined value to prevent "uncontrolled" warnings
        setMenuFormData({
            title: menu.title || '',
            subtitle: menu.subtitle || '',
            startDate: menu.startDate || '',
            endDate: menu.endDate || '',
            isActive: menu.isActive ?? true // Default to true if null/undefined
        });
    };

    const handleSaveItem = async (e) => {
        e.preventDefault();
        const promise = editingItemId
            ? apiClient.put(`/api/special-menus/items/${editingItemId}`, itemFormData)
            : apiClient.post(`/api/special-menus/${selectedMenu.id}/items`, itemFormData);

        toast.promise(promise, {
            loading: editingItemId ? 'Updating item...' : 'Adding item...',
            success: (newItem) => {
                let updatedItems;
                if (editingItemId) {
                    updatedItems = selectedMenu.items.map(i => i.id === editingItemId ? newItem : i);
                } else {
                    updatedItems = [...selectedMenu.items, newItem];
                }
                // ✅ Re-sort the list after updating/adding
                updateBothStates({ ...selectedMenu, items: sortItemsByDay(updatedItems) });
                setItemFormData(INITIAL_ITEM_FORM_STATE);
                setEditingItemId(null);
                return editingItemId ? 'Item updated!' : 'Item added!';
            },
            error: (err) => err.message
        });
    };
    
    const handleEditItem = (item) => {
        setEditingItemId(item.id);
        setItemFormData({ dayTitle: item.dayTitle, name: item.name, description: item.description });
    };
    
    const handleDeleteItem = (itemId) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        toast.promise(apiClient.delete(`/api/special-menus/items/${itemId}`), {
            loading: 'Deleting...',
            success: () => {
                const updatedItems = selectedMenu.items.filter(i => i.id !== itemId);
                // ✅ Re-sort is not needed on delete, but updating state is
                updateBothStates({ ...selectedMenu, items: updatedItems });
                return 'Item deleted!';
            },
            error: (err) => err.message
        });
    };
    
    const handleAddItem = async (e) => {
        e.preventDefault();
        toast.promise(apiClient.post(`/api/special-menus/${selectedMenu.id}/items`, itemFormData), {
            loading: 'Adding item...',
            success: (newItem) => {
                setItemFormData(INITIAL_ITEM_FORM_STATE);
                // ✅ FIX: Optimistically update the UI for an instant feel
                const updatedMenus = specialMenus.map(m => 
                    m.id === selectedMenu.id ? { ...m, items: [...m.items, newItem] } : m
                );
                setSpecialMenus(updatedMenus);
                setSelectedMenu(prev => ({ ...prev, items: [...prev.items, newItem] }));
                return 'Item added!';
            },
            error: (err) => err.message || 'Failed to add item.'
        });
    };

    const getMenuStatus = (menu) => {
        if (!menu.isActive) {
            return { text: "Hidden", color: "warning" };
        }

        // Create a 'today' date normalized to the start of the day in the user's time zone
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Robustly parse the date strings to avoid time zone issues
        const [startY, startM, startD] = menu.startDate.split('-').map(Number);
        const startDate = new Date(startY, startM - 1, startD);
        
        const [endY, endM, endD] = menu.endDate.split('-').map(Number);
        const endDate = new Date(endY, endM - 1, endD);

        if (today < startDate) {
            return { text: "Upcoming", color: "info" };
        }
        if (today > endDate) {
            return { text: "Expired", color: "default" };
        }
        return { text: "Live Now", color: "success" };
    };

    if (isLoading) return <CircularProgress />;

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Manage Weekly Specials</Typography>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6">Your Special Menus</Typography>
                <List>
                    {specialMenus.map(menu => {
                        const status = getMenuStatus(menu);
                        return (
                            <ListItem key={menu.id} secondaryAction={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {/* ✅ Use the Chip for a beautiful status badge */}
                                    <Chip label={status.text} color={status.color} size="small" />
                                    <IconButton edge="end" aria-label="edit" onClick={() => handleEditMenu(menu)}>
                                        <EditIcon />
                                    </IconButton>
                                    <Button size="small" variant="contained" onClick={() => setSelectedMenu(menu)}>Manage Items</Button>
                                </Box>
                            }>
                                <ListItemText 
                                    primary={menu.title} 
                                    secondary={`Active from ${menu.startDate} to ${menu.endDate}`} 
                                />
                            </ListItem>
                        );
                    })}
                </List>
            </Paper>

            {selectedMenu && (
                <Paper sx={{ p: 2, mb: 3 }} elevation={3}>
                    <Typography variant="h6">
                        {editingItemId ? 'Edit Item for' : 'Manage Items for'} "{selectedMenu.title}"
                    </Typography>
                    {/* UPDATED FORM that now handles both Add and Edit */}
                    <Box component="form" onSubmit={handleSaveItem} sx={{ my: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}><TextField label="Day Title (e.g., Lundi)" name="dayTitle" value={itemFormData.dayTitle} onChange={handleItemFormChange} fullWidth required /></Grid>
                            <Grid item xs={12} sm={8}><TextField label="Dish Name" name="name" value={itemFormData.name} onChange={handleItemFormChange} fullWidth required /></Grid>
                            <Grid item xs={12}><TextField label="Description" name="description" value={itemFormData.description} onChange={handleItemFormChange} fullWidth multiline rows={2} /></Grid>
                            <Grid item xs={12}>
                                <Button type="submit" variant="outlined">
                                    {editingItemId ? 'Update This Item' : 'Add Item to This Menu'}
                                </Button>
                                {editingItemId && <Button onClick={() => { setEditingItemId(null); setItemFormData(INITIAL_ITEM_FORM_STATE); }} sx={{ ml: 1 }}>Cancel Edit</Button>}
                            </Grid>
                        </Grid>
                    </Box>
                    <Divider />
                    <List>
                        {selectedMenu.items.map(item => (
                            <ListItem key={item.id} secondaryAction={
                                <Box>
                                    <IconButton onClick={() => handleEditItem(item)}><EditIcon /></IconButton>
                                    <IconButton onClick={() => handleDeleteItem(item.id)}><DeleteIcon /></IconButton>
                                </Box>
                            }>
                                <ListItemText primary={`${item.dayTitle}: ${item.name}`} secondary={item.description} />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}

            <Paper component="form" onSubmit={handleSaveMenu} sx={{ p: 2, mt: 4 }}>
                <Typography variant="h6">{editingMenuId ? 'Edit Special Menu' : 'Create New Special Menu'}</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}><TextField label="Title (e.g., Plats du Jour)" name="title" value={menuFormData.title} onChange={handleMenuFormChange} fullWidth required /></Grid>
                    <Grid item xs={12} sm={6}><TextField label="Subtitle (optional)" name="subtitle" value={menuFormData.subtitle} onChange={handleMenuFormChange} fullWidth /></Grid>
                    <Grid item xs={12} sm={6}><TextField label="Start Date" name="startDate" type="date" value={menuFormData.startDate} onChange={handleMenuFormChange} fullWidth required InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12} sm={6}><TextField label="End Date" name="endDate" type="date" value={menuFormData.endDate} onChange={handleMenuFormChange} fullWidth required InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12}>
                        <FormControlLabel 
                            control={<Switch checked={menuFormData.isActive} onChange={handleMenuFormChange} name="isActive" />} 
                            label="Set this menu as active and visible to customers" 
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Button type="submit" variant="contained">
                            {editingMenuId ? 'Save Changes' : 'Create Menu'}
                        </Button>
                        {editingMenuId && <Button onClick={() => { setEditingMenuId(null); setMenuFormData(INITIAL_MENU_FORM_STATE); }} sx={{ ml: 1 }}>Cancel Edit</Button>}
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}

export default SpecialsManagement;