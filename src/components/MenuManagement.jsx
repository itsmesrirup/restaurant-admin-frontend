import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Switch, FormControlLabel, Checkbox, Paper, Typography, Box, TextField, Button, Select, MenuItem, Grid, FormControl, InputLabel, Divider, Chip } from '@mui/material';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import MenuItemOptionsModal from './MenuItemOptionsModal';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '../utils/formatPrice';
import usePageTitle from '../hooks/usePageTitle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DeleteIcon from '@mui/icons-material/Delete';

const renderCategoryOptions = (categories, level = 0) => {
    let options = [];
    categories.forEach(category => {
        options.push(<MenuItem key={category.id} value={category.id} sx={{ pl: level * 2 + 2 }}>{category.name}</MenuItem>);
        if (category.subCategories?.length > 0) {
            options = options.concat(renderCategoryOptions(category.subCategories, level + 1));
        }
    });
    return options;
};

const INITIAL_FORM_STATE = { name: '', price: '', description: '', categoryId: '', isBundle: false, imageUrl: '', priceUnit: '', advanceOrderLeadTimeHours: 0 };

function MenuManagement() {
    const { t } = useTranslation();
    usePageTitle(t('menuManagement'));
    const { user } = useAuth();
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [optionsModalOpen, setOptionsModalOpen] = useState(false);
    const [currentItemForOptions, setCurrentItemForOptions] = useState(null);
    const [isModalLoading, setIsModalLoading] = useState(false);

    // --- ADDED: Dialog State ---
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

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

    // ✅ SMART GROUPING & SORTING ALGORITHM
    const groupedMenuItems = useMemo(() => {
        const groups = {};
        
        // 1. Group items by Category
        menuItems.forEach(item => {
            const catName = item.categoryName || t('uncategorized', 'Uncategorized');
            if (!groups[catName]) {
                groups[catName] = [];
            }
            groups[catName].push(item);
        });

        // 2. Sort items alphabetically inside each group
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => a.name.localeCompare(b.name));
        });

        return groups;
    }, [menuItems, t]);

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
            restaurantId: user.restaurantId, categoryId: parseInt(formData.categoryId), bundle: formData.isBundle,
            imageUrl: formData.imageUrl, priceUnit: formData.priceUnit, advanceOrderLeadTimeHours: parseInt(formData.advanceOrderLeadTimeHours) || 0
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
            categoryId: item.categoryId ? String(item.categoryId) : '', isBundle: item.bundle || false,
            imageUrl: item.imageUrl || '', priceUnit: item.priceUnit || '', advanceOrderLeadTimeHours: item.advanceOrderLeadTimeHours || 0
        });
    };

    // --- UPDATED: Open Dialog ---
    const handleDeleteClick = (itemId) => {
        setItemToDelete(itemId);
        setDeleteDialogOpen(true);
    };

    // --- NEW: Confirm Delete ---
    const confirmDelete = () => {
        if (itemToDelete) {
            const promise = apiClient.delete(`/api/menu-items/${itemToDelete}`);
            toast.promise(promise, {
                loading: t('deleting'),
                success: () => { fetchAllData(); return t('itemDeleted'); },
                error: (err) => err.message
            });
        }
        setDeleteDialogOpen(false);
        setItemToDelete(null);
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

    // --- NEW LOGIC for managing modal state ---
    const updateCurrentItemOptions = (updateFn) => {
        setCurrentItemForOptions(currentItem => {
            const newItem = { ...currentItem, options: updateFn(currentItem.options) };
            return newItem;
        });
    };

    const handleAddOptionGroup = () => {
        const newOption = { name: 'New Choice Group', minChoices: 1, maxChoices: 1 };
        toast.promise(apiClient.post(`/api/menu-items/${currentItemForOptions.id}/options`, newOption), {
            loading: 'Adding...',
            success: (savedOption) => { fetchAllData(); setCurrentItemForOptions(prev => ({ ...prev, options: [...(prev.options || []), savedOption] })); return "Group added!"; },
            error: "Failed to add group."
        });
    };
    
    const handleUpdateOption = (optionId, field, value) => {
        updateCurrentItemOptions(options => options.map(opt => opt.id === optionId ? { ...opt, [field]: value } : opt));
    };

    const handleSaveOption = (option) => {
        const payload = { name: option.name, minChoices: option.minChoices, maxChoices: option.maxChoices };
        toast.promise(apiClient.put(`/api/menu-item-options/${option.id}`, payload), {
            loading: 'Saving...', success: 'Saved!', error: 'Failed to save.'
        });
    };

    const handleDeleteOption = (optionId) => {
        if (!window.confirm("Delete group?")) return;
        toast.promise(apiClient.delete(`/api/menu-item-options/${optionId}`), {
            loading: 'Deleting...',
            success: () => { fetchAllData(); updateCurrentItemOptions(options => options.filter(opt => opt.id !== optionId)); return 'Group deleted!'; },
            error: (err) => err.message
        });
    };
    
    const handleAddChoice = (optionId) => {
        const newChoice = { name: 'New Choice', priceAdjustment: 0.0 };
        toast.promise(apiClient.post(`/api/menu-item-options/${optionId}/choices`, newChoice), {
            loading: 'Adding...',
            success: (savedChoice) => { fetchAllData(); updateCurrentItemOptions(options => options.map(opt => opt.id === optionId ? { ...opt, choices: [...(opt.choices || []), savedChoice] } : opt)); return "Choice added!"; },
            error: "Failed to add choice."
        });
    };

    const handleUpdateChoice = (optionId, choiceId, field, value) => {
        updateCurrentItemOptions(options => options.map(opt => {
            if (opt.id !== optionId) return opt;
            return { ...opt, choices: opt.choices.map(ch => ch.id === choiceId ? { ...ch, [field]: value } : ch) };
        }));
    };
    
    const handleSaveChoice = (choice) => {
        const payload = { name: choice.name, priceAdjustment: choice.priceAdjustment };
        toast.promise(apiClient.put(`/api/menu-item-option-choices/${choice.id}`, payload), {
            loading: 'Saving...', success: 'Saved!', error: 'Failed to save.'
        });
    };

    const handleDeleteChoice = (optionId, choiceId) => {
        if (!window.confirm("Delete choice?")) return;
        toast.promise(apiClient.delete(`/api/menu-item-option-choices/${choiceId}`), {
            loading: 'Deleting...',
            success: () => { fetchAllData(); updateCurrentItemOptions(options => options.map(opt => opt.id === optionId ? { ...opt, choices: opt.choices.filter(ch => ch.id !== choiceId) } : opt)); return 'Choice deleted!'; },
            error: 'Failed to delete.'
        });
    };

    if (!user || isFetching) return <p>{t('loadingMenu')}</p>;

    return (
        <Box>
            <Typography variant="h4" gutterBottom>{t('manageMenuTitle', { restaurantName: user.restaurantName })}</Typography>
            <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>{editingId ? t('editMenuItem') : t('addNewMenuItem')}</Typography>
                <Grid container spacing={2} alignItems="center">
                    {/* Row 1: Category, Name, Price */}
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth required>
                            <InputLabel id="category-select-label" shrink>
                                {t('category')}
                            </InputLabel>
                            <Select
                                labelId="category-select-label"
                                id="category-select"
                                label={t('category')}
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleInputChange}
                                size="medium"
                                fullWidth
                                displayEmpty
                                MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                            >
                                <MenuItem value="">
                                    <em>{t('selectACategory')}</em>
                                </MenuItem>
                                {renderCategoryOptions(categories)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField label={t('itemName')} name="name" value={formData.name} onChange={handleInputChange} required fullWidth size="medium" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField label={t('price')} name="price" type="number" value={formData.price} onChange={handleInputChange} required fullWidth size="medium" InputProps={{ inputProps: { step: "0.01", min: "0" } }} />
                        <TextField label="Unit (e.g. KG)" name="priceUnit" value={formData.priceUnit} onChange={handleInputChange} fullWidth size="medium" placeholder="Optional" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField label={t('descriptionOptional')} name="description" value={formData.description} onChange={handleInputChange} fullWidth size="medium" multiline rows={2} />
                    </Grid>
                    <Grid item xs={12} sm={12} md={9}>
                        <TextField 
                            label={t('imageUrlOptional')} 
                            name="imageUrl" 
                            value={formData.imageUrl} 
                            onChange={handleInputChange} 
                            fullWidth 
                            size="medium"
                            helperText={t('imageUrlHelper')}
                        />
                    </Grid>
                    {/* ✅ ONLY SHOW FOR BAKERIES OR RETAIL */}
                    {(user.businessType === 'BAKERY' || user.businessType === 'RETAIL') && (
                        <Grid item xs={12} sm={4} md={3}>
                            <TextField 
                                label="Prep Time (Hours)" 
                                name="advanceOrderLeadTimeHours" 
                                type="number"
                                value={formData.advanceOrderLeadTimeHours} 
                                onChange={handleInputChange} 
                                fullWidth 
                                size="medium"
                                helperText="0 for immediate. E.g., 48 for cakes."
                            />
                        </Grid>
                    )}
                    {/* Row 2: Bundle & Button */}
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControlLabel 
                            control={<Checkbox checked={formData.isBundle} onChange={handleInputChange} name="isBundle" />} 
                            label={t('isBundleLabel')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Button type="submit" variant="contained" color="primary" fullWidth disabled={isSubmitting}>
                            {isSubmitting ? t('saving') : (editingId ? t('updateItem') : t('addItem'))}
                        </Button>
                        {editingId && <Button onClick={resetForm} disabled={isSubmitting} sx={{ mt: 1 }} color="secondary" fullWidth>{t('cancel')}</Button>}
                    </Grid>
                </Grid>
            </Paper>
            <Typography variant="h5" sx={{ mt: 5, mb: 2 }}>{t('existingMenuItems')}</Typography>
            <Divider sx={{ mb: 3 }} />

            {/* ✅ RENDER GROUPED AND SORTED ITEMS */}
            {Object.keys(groupedMenuItems).sort().map(categoryName => (
                <Box key={categoryName} sx={{ mb: 5 }}>
                    {/* Category Header */}
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            backgroundColor: 'primary.main', 
                            color: 'white', 
                            py: 1, 
                            px: 2, 
                            borderRadius: 1, 
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}
                    >
                        {categoryName}
                    </Typography>

                    {/* Items inside this Category */}
                    {groupedMenuItems[categoryName].map(item => (
                        <Paper key={item.id} sx={{ p: 2, my: 1, borderLeft: '4px solid #1976d2' }}>
                            <Grid container alignItems="center" spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
                                        <Typography variant="body1" sx={{ mr: 1 }}>
                                            <strong>{item.name}</strong>
                                        </Typography>

                                        {item.advanceOrderLeadTimeHours > 0 && (
                                            <Chip 
                                                icon={<AccessTimeIcon sx={{ fontSize: '14px !important' }} />} 
                                                label={`${item.advanceOrderLeadTimeHours}h Prep`} 
                                                size="small" color="warning" sx={{ height: '22px', fontSize: '0.75rem', fontWeight: 'bold' }} 
                                            />
                                        )}

                                        {item.bundle && (
                                            <Chip 
                                                label={item.options?.length > 0 ? `${item.options.length} Option Group(s)` : "Formule (No Options Set)"} 
                                                size="small" color="info" variant="outlined" sx={{ height: '22px', fontSize: '0.75rem' }} 
                                            />
                                        )}
                                    </Box>

                                    <Typography variant="caption" color="text.secondary">
                                        {formatPrice(item.price, 'EUR')}
                                        {item.priceUnit && (
                                            <span style={{ fontWeight: 'bold', color: '#444', marginLeft: '4px' }}>
                                                / {item.priceUnit}
                                            </span>
                                        )}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <FormControlLabel control={<Switch size="small" checked={item.isAvailable} onChange={() => handleAvailabilityToggle(item.id, item.isAvailable)}/>} label={t('available')} />
                                    <Button size="small" variant="outlined" onClick={() => handleEdit(item)}>{t('edit')}</Button>
                                    {item.bundle && <Button size="small" variant="contained" onClick={() => openOptionsManager(item)}>{t('manageChoices')}</Button>}
                                    <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteClick(item.id)}>{t('delete')}</Button>
                                </Grid>
                            </Grid>
                        </Paper>
                    ))}
                </Box>
            ))}

            {/* --- ADDED: The Dialog Component --- */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>{t('delete')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {t("confirmDeleteItemPrompt")} {/* "Are you sure you want to delete this item?" */}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>{t('cancel')}</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained" autoFocus>
                        {t('delete')}
                    </Button>
                </DialogActions>
            </Dialog>

            <MenuItemOptionsModal 
                open={optionsModalOpen} 
                handleClose={() => setOptionsModalOpen(false)} 
                menuItem={currentItemForOptions} 
                isLoading={isModalLoading}
                onAddOptionGroup={handleAddOptionGroup} 
                onUpdateOption={handleUpdateOption} 
                onSaveOption={handleSaveOption} 
                onDeleteOption={handleDeleteOption}
                onAddChoice={handleAddChoice} 
                onUpdateChoice={handleUpdateChoice} 
                onSaveChoice={handleSaveChoice} 
                onDeleteChoice={handleDeleteChoice}
            />
        </Box>
    );
}

export default MenuManagement;