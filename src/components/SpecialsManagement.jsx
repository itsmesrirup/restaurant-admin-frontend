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
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useTranslation } from 'react-i18next';
import CloneMenuModal from './CloneMenuModal';

const INITIAL_MENU_FORM_STATE = { title: '', subtitle: '', startDate: '', endDate: '', isActive: true };
const INITIAL_ITEM_FORM_STATE = { dayTitle: '', name: '', description: '' };

function SpecialsManagement() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [specialMenus, setSpecialMenus] = useState([]);
    const [selectedMenu, setSelectedMenu] = useState(null);
    const [menuFormData, setMenuFormData] = useState(INITIAL_MENU_FORM_STATE);
    const [itemFormData, setItemFormData] = useState(INITIAL_ITEM_FORM_STATE);
    const [editingMenuId, setEditingMenuId] = useState(null);
    const [editingItemId, setEditingItemId] = useState(null); 
    const [isLoading, setIsLoading] = useState(true);
    // --- ADDED: State for the clone modal ---
    const [cloneModalOpen, setCloneModalOpen] = useState(false);
    const [menuToClone, setMenuToClone] = useState(null);

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

    // --- This handler now opens the modal ---
    const handleCopyMenu = (menu) => {
        setMenuToClone(menu);
        setCloneModalOpen(true);
    };

    // --- New handler to process the cloning after modal confirmation ---
    const handleConfirmClone = (cloneData) => {
        if (!menuToClone) return;

        const promise = apiClient.post(`/api/special-menus/${menuToClone.id}/clone`, cloneData);

        toast.promise(promise, {
            loading: t('cloningMenu'),
            success: () => {
                setCloneModalOpen(false);
                fetchSpecialMenus(); // Refresh the list
                return t('menuClonedSuccess');
            },
            error: (err) => err.message || t('failedToCloneMenu')
        });
    };

    // --- New handler for deleting an entire special menu ---
    const handleDeleteMenu = (menuId) => {
        if (!window.confirm(t("confirmDeleteMenu"))) return;

        const promise = apiClient.delete(`/api/special-menus/${menuId}`);
        toast.promise(promise, {
            loading: t('deletingMenu'),
            success: () => {
                fetchSpecialMenus(); // Refresh the list from the server
                return t('menuDeleted');
            },
            error: (err) => err.message || t('failedToDeleteMenu')
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
            return { text: t("hidden"), color: "warning" };
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
            return { text: t("upcoming"), color: "info" };
        }
        if (today > endDate) {
            return { text: t("expired"), color: "default" };
        }
        return { text: t("liveNow"), color: "success" };
    };

    if (isLoading) return <CircularProgress />;

    return (
        <Box>
            <Typography variant="h4" gutterBottom>{t('manageSpecialsTitle')}</Typography>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6">{t('yourSpecialMenus')}</Typography>
                <Box>
                    {specialMenus.map(menu => {
                        const status = getMenuStatus(menu);
                        return (
                            // Use a Paper for each item for better visual separation
                            <Paper key={menu.id} sx={{ p: 2, my: 1, border: '1px solid #eee' }}>
                                {/* Use a Grid container for a responsive row */}
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} sm>
                                        <ListItemText 
                                            primary={menu.title} 
                                            secondary={t('activeFromTo', { start: menu.startDate, end: menu.endDate })} 
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm="auto" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                        <Chip label={status.text} color={status.color} size="small" />
                                        <IconButton aria-label={t('copy')} title={t('copy')} onClick={() => handleCopyMenu(menu)}>
                                            <ContentCopyIcon />
                                        </IconButton>
                                        <IconButton aria-label="edit" onClick={() => handleEditMenu(menu)}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton aria-label={t('delete')} title={t('delete')} onClick={() => handleDeleteMenu(menu.id)} color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                        <Button 
                                            size="small" 
                                            variant={selectedMenu?.id === menu.id ? "outlined" : "contained"} 
                                            onClick={() => setSelectedMenu(menu)}
                                        >
                                            {t('manageItems')}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Paper>
                        );
                    })}
                </Box>
            </Paper>

            {selectedMenu && (
                <Paper sx={{ p: 2, mb: 3 }} elevation={3}>
                    <Typography variant="h6">
                        {editingItemId ? t('editItemFor') : t('manageItemsFor')} "{selectedMenu.title}"
                    </Typography>
                    {/* UPDATED FORM that now handles both Add and Edit */}
                    <Box component="form" onSubmit={handleSaveItem} sx={{ my: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}><TextField label={t('dayTitle')} name="dayTitle" value={itemFormData.dayTitle} onChange={handleItemFormChange} fullWidth required /></Grid>
                            <Grid item xs={12} sm={8}><TextField label={t('dishName')} name="name" value={itemFormData.name} onChange={handleItemFormChange} fullWidth required /></Grid>
                            <Grid item xs={12}><TextField label={t('description')} name="description" value={itemFormData.description} onChange={handleItemFormChange} fullWidth multiline rows={2} /></Grid>
                            <Grid item xs={12}>
                                <Button type="submit" variant="outlined">
                                    {editingItemId ? t('updateThisItem') : t('addItemToMenu')}
                                </Button>
                                {editingItemId && <Button onClick={() => { setEditingItemId(null); setItemFormData(INITIAL_ITEM_FORM_STATE); }} sx={{ ml: 1 }}>{t('cancelEdit')}</Button>}
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
                <Typography variant="h6">{editingMenuId ? t('editSpecialMenu') : t('createSpecialMenu')}</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}><TextField label={t('titleExample')} name="title" value={menuFormData.title} onChange={handleMenuFormChange} fullWidth required /></Grid>
                    <Grid item xs={12} sm={6}><TextField label={t('subtitleOptional')} name="subtitle" value={menuFormData.subtitle} onChange={handleMenuFormChange} fullWidth /></Grid>
                    <Grid item xs={12} sm={6}><TextField label={t('startDate')} name="startDate" type="date" value={menuFormData.startDate} onChange={handleMenuFormChange} fullWidth required InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12} sm={6}><TextField label={t('endDate')} name="endDate" type="date" value={menuFormData.endDate} onChange={handleMenuFormChange} fullWidth required InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12}>
                        <FormControlLabel
                            control={<Switch checked={menuFormData.isActive} onChange={handleMenuFormChange} name="isActive" />}
                            label={t('setMenuAsActive')}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Button type="submit" variant="contained">
                            {editingMenuId ? t('saveChanges') : t('createMenu')}
                        </Button>
                        {editingMenuId && <Button onClick={() => { setEditingMenuId(null); setMenuFormData(INITIAL_MENU_FORM_STATE); }} sx={{ ml: 1 }}>{t('cancelEdit')}</Button>}
                    </Grid>
                </Grid>
            </Paper>
            <CloneMenuModal
                open={cloneModalOpen}
                onClose={() => setCloneModalOpen(false)}
                menuToClone={menuToClone}
                onConfirm={handleConfirmClone}
            />
        </Box>
    );
}

export default SpecialsManagement;