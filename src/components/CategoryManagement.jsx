import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

// --- Reusable Recursive Component for Displaying and Editing Categories ---
const CategoryListItem = ({ category, level = 0, onUpdate, onDelete, categories }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(category.name);

    const handleUpdate = () => {
        onUpdate(category.id, { name: editedName });
        setIsEditing(false);
    };

    return (
        <li style={{ marginLeft: `${level * 25}px`, listStyle: 'none', padding: '5px 0' }}>
            {isEditing ? (
                <>
                    <input type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)} />
                    <button onClick={handleUpdate}>Save</button>
                    <button onClick={() => setIsEditing(false)}>Cancel</button>
                </>
            ) : (
                <>
                    <span>{category.name}</span>
                    <button onClick={() => setIsEditing(true)} style={{ marginLeft: '10px' }}>Edit</button>
                    <button onClick={() => onDelete(category.id)}>Delete</button>
                </>
            )}

            {category.subCategories && category.subCategories.length > 0 && (
                <ul>
                    {category.subCategories.map(subCat => (
                        <CategoryListItem key={subCat.id} category={subCat} level={level + 1} onUpdate={onUpdate} onDelete={onDelete} />
                    ))}
                </ul>
            )}
        </li>
    );
};


function CategoryManagement() {
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
            toast.error("Could not load categories.");
        } finally {
            setIsFetching(false);
        }
    }, [user]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return toast.error("Category name is required.");
        
        setIsSubmitting(true);
        const payload = { 
            name: newCategoryName,
            // Only include parentCategoryId if one is selected
            parentCategoryId: parentCategoryId ? parseInt(parentCategoryId) : null
        };

        const promise = apiClient.post('/api/categories', payload);
        
        toast.promise(promise, {
            loading: 'Creating category...',
            success: () => {
                setNewCategoryName('');
                setParentCategoryId('');
                fetchCategories();
                return 'Category created successfully!';
            },
            error: (err) => err.message
        }).finally(() => setIsSubmitting(false));
    };
    
    const handleUpdateCategory = (categoryId, updatedData) => {
        const promise = apiClient.put(`/api/categories/${categoryId}`, updatedData);
        toast.promise(promise, {
            loading: 'Updating category...',
            success: () => {
                fetchCategories();
                return 'Category updated!';
            },
            error: (err) => err.message
        });
    };

    const handleDeleteCategory = (categoryId) => {
        if (!window.confirm("Are you sure? Deleting a category is permanent and only works if it's empty.")) return;
        
        const promise = apiClient.delete(`/api/categories/${categoryId}`);
        toast.promise(promise, {
            loading: 'Deleting category...',
            success: () => {
                fetchCategories();
                return 'Category deleted!';
            },
            error: (err) => err.message
        });
    };

    if (isFetching) return <p>Loading categories...</p>;

    return (
        <div>
            <h2>Manage Menu Categories</h2>

            <form onSubmit={handleCreateCategory} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '2rem' }}>
                <h3>Add New Category / Subcategory</h3>
                <input 
                    type="text" 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="E.g., Entrées, Vins Rouges"
                    style={{ marginRight: '10px' }}
                />
                <select value={parentCategoryId} onChange={(e) => setParentCategoryId(e.target.value)} style={{ marginRight: '10px' }}>
                    <option value="">-- (Top-Level Category) --</option>
                    {/* You can create a recursive function to render options with indents */}
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Add Category'}
                </button>
            </form>

            <h3>Existing Categories</h3>
            {categories.length === 0 ? (
                <p>No categories found. Add one using the form above.</p>
            ) : (
                <ul>
                    {categories.map(cat => (
                        <CategoryListItem 
                            key={cat.id} 
                            category={cat} 
                            onUpdate={handleUpdateCategory}
                            onDelete={handleDeleteCategory}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
}

export default CategoryManagement;