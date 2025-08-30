import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

function MenuManagement() {
    const { user } = useAuth();
    const [menuItems, setMenuItems] = useState([]);
    const [formData, setFormData] = useState({ name: '', price: '', description: '' });
    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    const fetchMenuItems = useCallback(async () => {
        if (!user) return;
        setIsFetching(true);
        try {
            const data = await apiClient.get(`/api/restaurants/${user.restaurantId}/menu`);
            setMenuItems(data);
        } catch (error) {
            toast.error("Failed to load your menu.");
        } finally {
            setIsFetching(false);
        }
    }, [user]);

    useEffect(() => {
        fetchMenuItems();
    }, [fetchMenuItems]);

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
            ? apiClient.put(`/api/menu-items/${editingId}`, payload) // ✅ Use apiClient
            : apiClient.post('/api/menu-items', payload); // ✅ Use apiClient

        toast.promise(promise, {
            loading: editingId ? 'Updating item...' : 'Adding item...',
            success: () => {
                resetForm();
                fetchMenuItems();
                return editingId ? 'Item updated!' : 'Item added!';
            },
            error: (err) => `Error: ${err.message}`
        }).finally(() => setIsSubmitting(false));
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setFormData({ name: item.name, price: item.price, description: item.description || '' });
    };
    
    const handleDelete = async (itemId) => {
        if (!window.confirm("Are you sure?")) return;
        
        const promise = apiClient.delete(`/api/menu-items/${itemId}`); // ✅ Use apiClient
        
        toast.promise(promise, {
            loading: 'Deleting item...',
            success: () => {
                fetchMenuItems();
                return 'Item deleted!';
            },
            error: (err) => `Error: ${err.message}`
        });
    };
    
    if (!user || isFetching) {
        return <p>Loading menu...</p>;
    }

    return (
        // ... The rest of the JSX is the same and correct
        <div>
            <h2>Menu Management for {user.restaurantName}</h2>
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
            {menuItems.length > 0 ? (
                menuItems.map(item => (
                    <div key={item.id} style={{ borderBottom: '1px solid #eee', padding: '1rem 0.5rem' }}>
                        <strong>{item.name || 'No Name'}</strong> - ${item.price ? item.price.toFixed(2) : '0.00'}
                        <p style={{ margin: '0.5rem 0' }}>{item.description || 'No description available.'}</p>
                        <button onClick={() => handleEdit(item)}>Edit</button>
                        <button onClick={() => handleDelete(item.id)}>Delete</button>
                    </div>
                ))
            ) : (
                <p>No menu items found. Add one using the form above to get started!</p>
            )}
        </div>
    );
}

export default MenuManagement;