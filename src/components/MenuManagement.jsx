import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Switch, FormControlLabel, Checkbox } from '@mui/material'; // I've kept Checkbox here as you were using it
import MenuItemOptionsModal from './MenuItemOptionsModal';

// Helper function to render categories and subcategories in the dropdown
const renderCategoryOptions = (categories, level = 0) => {
    let options = [];
    for (const category of categories) {
        options.push(
            <option key={category.id} value={category.id}>
                {'\u00A0'.repeat(level * 4)} {/* Indent with spaces */}
                {category.name}
            </option>
        );
        if (category.subCategories && category.subCategories.length > 0) {
            options = options.concat(renderCategoryOptions(category.subCategories, level + 1));
        }
    }
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

    // State for the options modal
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
        } catch (error) {
            toast.error("Failed to load menu data.");
        } finally {
            setIsFetching(false);
        }
    }, [user]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

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
        if (!formData.categoryId) {
            toast.error("Please select a category for the item.");
            return;
        }
        setIsSubmitting(true);
        
        // ✅ THE MINIMAL FIX: Map the state 'isBundle' to the payload property 'bundle'
        const payload = { 
            name: formData.name,
            price: parseFloat(formData.price),
            description: formData.description,
            restaurantId: user.restaurantId,
            categoryId: parseInt(formData.categoryId),
            bundle: formData.isBundle // This is the key change
        };
        
        const promise = editingId 
            ? apiClient.put(`/api/menu-items/${editingId}`, payload)
            : apiClient.post('/api/menu-items', payload);

        toast.promise(promise, {
            loading: editingId ? 'Updating item...' : 'Adding item...',
            success: () => {
                resetForm();
                fetchAllData();
                return editingId ? 'Item updated!' : 'Item added!';
            },
            error: (err) => `Error: ${err.message}`
        }).finally(() => setIsSubmitting(false));
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setFormData({ 
            name: item.name, 
            price: item.price, 
            description: item.description || '', 
            categoryId: item.categoryId ? String(item.categoryId) : '',
            // ✅ THE MINIMAL FIX: Read from 'item.bundle' which comes from the backend
            isBundle: item.bundle || false 
        });
    };
    
    const handleDelete = async (itemId) => {
        // Your original, more descriptive confirmation message
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        
        const promise = apiClient.delete(`/api/menu-items/${itemId}`);
        
        toast.promise(promise, {
            loading: 'Deleting item...',
            success: () => {
                fetchAllData();
                return 'Item deleted!';
            },
            error: (err) => `Error: ${err.message}`
        });
    };

    const handleAvailabilityToggle = async (itemId, currentStatus) => {
        const promise = apiClient.patch(`/api/menu-items/${itemId}/availability`, { available: !currentStatus });
        
        toast.promise(promise, {
            loading: 'Updating availability...',
            success: () => {
                fetchAllData();
                return 'Availability updated!';
            },
            error: (err) => err.message
        });
    };

    const openOptionsManager = (item) => {
        setCurrentItemForOptions(item);
        setOptionsModalOpen(true);
    };
    
    if (!user || isFetching) {
        return <p>Loading menu...</p>;
    }

    return (
        <div>
            <h2>Menu Management for {user.restaurantName}</h2>
            {/* Your original HTML form structure */}
            <form onSubmit={handleSubmit} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem', borderRadius: '8px' }}>
                <h3>{editingId ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
                <select name="categoryId" value={formData.categoryId} onChange={handleInputChange} required>
                    <option value="">-- Select a Category --</option>
                        {renderCategoryOptions(categories)}
                </select>
                <br/>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Item Name" required /><br/>
                <input type="number" name="price" value={formData.price} onChange={handleInputChange} placeholder="Price" step="0.01" required /><br/>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description (optional)"></textarea><br/>
                
                <FormControlLabel
                    control={<Checkbox checked={formData.isBundle} onChange={handleInputChange} name="isBundle" />}
                    label="This is a 'Formule' / Bundle Item (with choices)"
                />
                <br/>
                
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : (editingId ? 'Update Item' : 'Add Item')}
                </button>
                {editingId && <button type="button" onClick={resetForm} disabled={isSubmitting}>Cancel</button>}
            </form>
            <h3>Existing Menu Items</h3>
            {menuItems.length > 0 ? (
                menuItems.map(item => (
                    <div key={item.id} style={{ borderBottom: '1px solid #eee', padding: '1rem 0.5rem' }}>
                        <strong>{item.name}</strong> 
                        {/* ✅ THE MINIMAL FIX: Check 'item.bundle' from backend */}
                        {item.bundle && <span style={{fontSize: '0.8rem', color: 'gray', marginLeft: '8px'}}>(Formule/Bundle)</span>}
                        ({item.categoryName || 'Uncategorized'}) - ${item.price ? item.price.toFixed(2) : '0.00'}
                        <p>{item.description || 'No description'}</p>
                        <button onClick={() => handleEdit(item)}>Edit</button>
                        <button onClick={() => handleDelete(item.id)}>Delete</button>
                        
                        {/* ✅ THE MINIMAL FIX: Check 'item.bundle' from backend */}
                        {item.bundle && (
                            <button type="button" onClick={() => openOptionsManager(item)}>Manage Choices</button>
                        )}

                        <FormControlLabel
                            control={<Switch checked={item.isAvailable} onChange={() => handleAvailabilityToggle(item.id, item.isAvailable)} color="success" />}
                            label={item.isAvailable ? "Available" : "Out of Stock"}
                        />
                    </div>
                ))
            ) : (
                <p>No menu items found. Add one using the form above to get started!</p>
            )}

            <MenuItemOptionsModal 
                open={optionsModalOpen}
                handleClose={() => setOptionsModalOpen(false)}
                menuItem={currentItemForOptions}
                onUpdate={fetchAllData}
            />
        </div>
    );
}

export default MenuManagement;