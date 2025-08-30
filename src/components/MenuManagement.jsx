// File: restaurant-admin-frontend/src/components/MenuManagement.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

function MenuManagement() {
    // --- STATE MANAGEMENT ---
    const { user } = useAuth(); // Hooks must be inside the component body

    const [menuItems, setMenuItems] = useState([]);
    const [formData, setFormData] = useState({ name: '', price: '', description: '' });
    const [editingId, setEditingId] = useState(null);

    // Loading states for better UX
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    // --- DATA FETCHING ---
    const fetchMenuItems = useCallback(async () => {
        // Guard clause: Don't fetch if the user object isn't loaded yet
        if (!user) return;

        setIsFetching(true);
        try {
            //const data = await api.get(`${import.meta.env.VITE_API_BASE_URL}/api/restaurants/${user.restaurantId}/menu`);
            const data = await apiClient.get(`/api/restaurants/${user.restaurantId}/menu`);
            setMenuItems(data);
        } catch (error) {
            console.error("Failed to fetch menu items:", error);
            toast.error("Failed to load your menu. Please try again.");
        } finally {
            setIsFetching(false);
        }
    }, [user]); // Effect depends on user and api client

    useEffect(() => {
        fetchMenuItems();
    }, [fetchMenuItems]);

    // --- FORM HANDLERS ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({ name: '', price: '', description: '' });
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const payload = { ...formData, restaurantId: user.restaurantId };
        
        const promise = editingId 
            ? api.put(`${import.meta.env.VITE_API_BASE_URL}/api/menu-items/${editingId}`, payload)
            : api.post(`${import.meta.env.VITE_API_BASE_URL}/api/menu-items`, payload);

        toast.promise(promise, {
            loading: editingId ? 'Updating item...' : 'Adding item...',
            success: (response) => {
                resetForm();
                fetchMenuItems(); // Refresh list on success
                return editingId ? 'Item updated successfully!' : 'Item added successfully!';
            },
            error: (err) => `Error: ${err.message || 'Could not save item.'}`
        }).finally(() => setIsSubmitting(false));
    };

    // --- ACTION HANDLERS ---
    const handleEdit = (item) => {
        setEditingId(item.id);
        setFormData({
            name: item.name,
            price: item.price,
            description: item.description || '' // Ensure description is not null
        });
    };
    
    const handleDelete = async (itemId) => {
        if (!window.confirm("Are you sure you want to delete this menu item?")) return;
        
        const promise = api.delete(`${import.meta.env.VITE_API_BASE_URL}/api/menu-items/${itemId}`);
        
        toast.promise(promise, {
            loading: 'Deleting item...',
            success: () => {
                fetchMenuItems(); // Refresh list on success
                return 'Item deleted successfully!';
            },
            error: (err) => `Error: ${err.message || 'Could not delete item.'}`
        });
    };
    
    // --- RENDER LOGIC ---

    // Guard clause for the initial loading state of the user profile
    if (!user) {
        return <p>Loading user data...</p>;
    }

    return (
        <div>
            <h2>Menu Management for {user.restaurantName}</h2>
            
            {/* Form for adding/editing items */}
            <form onSubmit={handleSubmit} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem', borderRadius: '8px' }}>
                <h3>{editingId ? `Editing "${formData.name}"` : 'Add New Menu Item'}</h3>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Item Name" required /><br/>
                <input type="number" name="price" value={formData.price} onChange={handleInputChange} placeholder="Price" step="0.01" required /><br/>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description (optional)"></textarea><br/>
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : (editingId ? 'Update Item' : 'Add Item')}
                </button>
                {editingId && <button type="button" onClick={resetForm} disabled={isSubmitting}>Cancel</button>}
            </form>

            {/* Display a loading message specifically for the menu items */}
            {isFetching && <p>Loading menu items...</p>}

            {/* List of existing items */}
            {!isFetching && (
                <div>
                    {menuItems.length > 0 ? (
                        menuItems.map(item => (
                            <div key={item.id} style={{ borderBottom: '1px solid #eee', padding: '1rem 0.5rem' }}>
                                {/* Check for properties before rendering to prevent crashes */}
                                <strong>{item.name || 'No Name'}</strong> - ${item.price ? item.price.toFixed(2) : '0.00'}
                                <p style={{ margin: '0.5rem 0' }}>{item.description || 'No description available.'}</p>
                                <button onClick={() => handleEdit(item)}>Edit</button>
                                <button onClick={() => handleDelete(item.id)}>Delete</button>
                            </div>
                        ))
                    ) : (
                        // Empty state message when not loading and no items exist
                        <p>No menu items found. Add one using the form above to get started!</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default MenuManagement;