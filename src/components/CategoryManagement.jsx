import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
// --- ADDED: Import all necessary Material-UI components ---
import {
    Paper, Typography, Box, TextField, Button, Grid, CircularProgress,
    List, ListItem, ListItemText, IconButton,
    Select, MenuItem, FormControl, InputLabel, Collapse
} from '@mui/material';
// --- ADDED: Import Material-UI icons for a professional look ---
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ChevronRight from '@mui/icons-material/ChevronRight';

// --- ADDED: A recursive function to generate indented <MenuItem>s for the dropdown ---
// This makes the subcategory hierarchy clear when selecting a parent.
const renderCategoryOptions = (categories, level = 0) => {
    let options = [];
    categories.forEach(category => {
        options.push(
            <MenuItem key={category.id} value={category.id} sx={{ pl: level * 2 + 2 }}>
                {category.name}
            </MenuItem>
        );
        if (category.subCategories?.length > 0) {
            options = options.concat(renderCategoryOptions(category.subCategories, level + 1));
        }
    });
    return options;
};

// --- The CategoryListItem is now a modern, collapsible Material-UI component ---
const CategoryListItem = ({ category, level = 0, onUpdate, onDelete }) => {
    // --- ADDED: Get t function ---
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(category.name);
    const [isOpen, setIsOpen] = useState(false);

    const handleUpdate = () => {
        if (editedName.trim() === '') return toast.error(t("nameCannotBeEmpty"));
        onUpdate(category.id, { name: editedName });
        setIsEditing(false);
    };

    const hasSubcategories = category.subCategories && category.subCategories.length > 0;

    return (
        <>
            <ListItem sx={{ pl: level * 2, borderLeft: level > 0 ? '2px solid #eee' : 'none' }}>
                {isEditing ? (
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
                        <TextField
                            size="small"
                            variant="outlined"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            fullWidth
                            autoFocus
                        />
                        <IconButton onClick={handleUpdate} color="primary" title={t('save')}><SaveIcon /></IconButton>
                        <IconButton onClick={() => { setIsEditing(false); setEditedName(category.name); }} title={t('cancel')}><CancelIcon /></IconButton>
                    </Box>
                ) : (
                    <>
                        {hasSubcategories && (
                            <IconButton edge="start" onClick={() => setIsOpen(!isOpen)} size="small">
                                {isOpen ? <ExpandMore /> : <ChevronRight />}
                            </IconButton>
                        )}
                        <ListItemText primary={category.name} sx={{ ml: hasSubcategories ? 0 : 3.5 }} />
                        <IconButton onClick={() => setIsEditing(true)} title={t('edit')}><EditIcon fontSize="small" /></IconButton>
                        <IconButton onClick={() => onDelete(category.id)} color="error" title={t('delete')}><DeleteIcon fontSize="small" /></IconButton>
                    </>
                )}
            </ListItem>
            {hasSubcategories && (
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {category.subCategories.map(subCat => (
                            <CategoryListItem key={subCat.id} category={subCat} level={level + 1} onUpdate={onUpdate} onDelete={onDelete} />
                        ))}
                    </List>
                </Collapse>
            )}
        </>
    );
};


function CategoryManagement() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [parentCategoryId, setParentCategoryId] = useState(''); // For subcategories
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchCategories = useCallback(async () => {
        if (!user) return;
        setIsFetching(true);
        try {
            const data = await apiClient.get('/api/categories/by-restaurant');
            setCategories(data);
        } catch (error) {
            toast.error(t("loadingCategories"));
        } finally {
            setIsFetching(false);
        }
    }, [user, t]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return toast.error(t("nameCannotBeEmpty"));
        setIsSubmitting(true);
        const payload = { 
            name: newCategoryName,
            parentCategoryId: parentCategoryId ? parseInt(parentCategoryId) : null
        };
        const promise = apiClient.post('/api/categories', payload);
        toast.promise(promise, {
            loading: t('creatingCategory'),
            success: () => {
                setNewCategoryName('');
                setParentCategoryId('');
                fetchCategories();
                return t('categoryCreated');
            },
            error: (err) => err.message
        }).finally(() => setIsSubmitting(false));
    };
    
    const handleUpdateCategory = (categoryId, updatedData) => {
        const promise = apiClient.put(`/api/categories/${categoryId}`, updatedData);
        toast.promise(promise, {
            loading: t('updatingCategory'),
            success: () => {
                fetchCategories();
                return t('categoryUpdated');
            },
            error: (err) => err.message
        });
    };

    const handleDeleteCategory = (categoryId) => {
        if (!window.confirm(t("confirmDeleteCategory"))) return;
        const promise = apiClient.delete(`/api/categories/${categoryId}`);
        toast.promise(promise, {
            loading: t('deletingCategory'),
            success: () => {
                fetchCategories();
                return t('categoryDeleted');
            },
            error: (err) => err.message
        });
    };

    if (isFetching) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

    return (
        // --- Replaced plain div with Box for consistency ---
        <Box>
            <Typography variant="h4" gutterBottom>{t('manageCategoriesTitle')}</Typography>

            {/* --- Replaced plain form with a styled Paper component and Grid layout --- */}
            <Paper component="form" onSubmit={handleCreateCategory} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>{t('addNewCategoryTitle')}</Typography>
                
                {/* --- CHANGED: This Grid layout now directly mimics the working pattern from MenuManagement.jsx --- */}
                <Grid container spacing={2} direction={{ xs: "column", md: "row" }}>
                    <Grid item xs={12} md={5}>
                        <TextField
                        fullWidth
                        label={t('newCategoryName')}
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="E.g., Entrées, Vins Rouges"
                        />
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <FormControl fullWidth sx={{ minWidth: { md: 300 } }}>
                        <InputLabel id="parent-category-select-label">{t('parentCategory')}</InputLabel>
                        <Select
                            labelId="parent-category-select-label"
                            label={t('parentCategory')}
                            value={parentCategoryId}
                            onChange={(e) => setParentCategoryId(e.target.value)}
                            fullWidth
                            MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                        >
                            <MenuItem value="">{t('topLevelCategory')}</MenuItem>
                            {renderCategoryOptions(categories)}
                        </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={isSubmitting}
                        sx={{ height: { xs: "48px", md: "56px" } }}
                        >
                        {isSubmitting ? t('adding') : t('add')}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* --- List of categories is now inside a Paper component and uses Material-UI List --- */}
            <Paper sx={{ p: { xs: 1, sm: 2 } }}>
                <Typography variant="h6" sx={{ p: 2 }}>{t('existingCategories')}</Typography>
                {categories.length === 0 ? (
                    <Typography sx={{ p: 2, color: 'text.secondary' }}>{t('noCategoriesFound')}</Typography>
                ) : (
                    <List>
                        {categories.map(cat => (
                            <CategoryListItem 
                                key={cat.id} 
                                category={cat} 
                                onUpdate={handleUpdateCategory}
                                onDelete={handleDeleteCategory}
                            />
                        ))}
                    </List>
                )}
            </Paper>
        </Box>
    );
}

export default CategoryManagement;