import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Switch, FormControlLabel } from '@mui/material'; // Import MUI components for the toggle

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

function MenuManagement() {
    const { user } = useAuth();
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({ name: '', price: '', description: '', categoryId: '' });
    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    const fetchAllData = useCallback(async () => {
        if (!user) return;
        setIsFetching(true);
        try {
            const [menuData, categoryData] = await Promise.all([
                // ✅ CORRECT ENDPOINT
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
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({ name: '', price: '', description: '', categoryId: '' });
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.categoryId) {
            toast.error("Please select a category for the item.");
            return;
        }
        setIsSubmitting(true);
        
        const payload = { 
            name: formData.name,
            price: parseFloat(formData.price), // Ensure price is a number
            description: formData.description,
            restaurantId: user.restaurantId,
            categoryId: parseInt(formData.categoryId)
        };
        
        const promise = editingId 
            ? apiClient.put(`/api/menu-items/${editingId}`, payload)
            : apiClient.post('/api/menu-items', payload);

        toast.promise(promise, {
            loading: editingId ? 'Updating item...' : 'Adding item...',
            success: () => {
                resetForm();
                fetchAllData(); // Refresh all data
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
            // The categoryId from the response will now be available
            categoryId: item.categoryId ? String(item.categoryId) : '' 
        });
    };
    
    const handleDelete = async (itemId) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        
        const promise = apiClient.delete(`/api/menu-items/${itemId}`);
        
        toast.promise(promise, {
            loading: 'Deleting item...',
            success: () => {
                fetchAllData(); // ✅ CORRECT FUNCTION
                return 'Item deleted!';
            },
            error: (err) => `Error: ${err.message}`
        });
    };

    // FUNCTION to handle the toggle
    const handleAvailabilityToggle = async (itemId, currentStatus) => {
        const promise = apiClient.patch(`/api/menu-items/${itemId}/availability`, { isAvailable: !currentStatus });
        
        toast.promise(promise, {
            loading: 'Updating availability...',
            success: () => {
                fetchAllData(); // Refresh the list to show the new status
                return 'Availability updated!';
            },
            error: (err) => err.message
        });
    };
    
    if (!user || isFetching) {
        return <p>Loading menu...</p>;
    }

    return (
        <div>
            <h2>Menu Management for {user.restaurantName}</h2>
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
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : (editingId ? 'Update Item' : 'Add Item')}
                </button>
                {editingId && <button type="button" onClick={resetForm} disabled={isSubmitting}>Cancel</button>}
            </form>
            <h3>Existing Menu Items</h3>
            {menuItems.length > 0 ? (
                menuItems.map(item => (
                    <div key={item.id} style={{ borderBottom: '1px solid #eee', padding: '1rem 0.5rem' }}>
                        <strong>{item.name}</strong> ({item.categoryName || 'Uncategorized'}) - ${item.price ? item.price.toFixed(2) : '0.00'}
                        <p>{item.description || 'No description'}</p>
                        <button onClick={() => handleEdit(item)}>Edit</button>
                        <button onClick={() => handleDelete(item.id)}>Delete</button>
                        {/* Availability Toggle Switch */}
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={item.isAvailable}
                                    onChange={() => handleAvailabilityToggle(item.id, item.isAvailable)}
                                    color="success"
                                />
                            }
                            label={item.isAvailable ? "Available" : "Out of Stock"}
                        />
                    </div>
                ))
            ) : (
                <p>No menu items found. Add one using the form above to get started!</p>
            )}
        </div>
    );
}

export default MenuManagement;