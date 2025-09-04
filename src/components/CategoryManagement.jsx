import React, { useState, useEffect } from 'react';
import { apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

function CategoryManagement() {
    const [categories, setCategories] = useState([]);
    // State and handlers for a form to add a new category
    // would go here (similar to MenuManagement)

    useEffect(() => {
        apiClient.get('/api/categories/by-restaurant')
            .then(setCategories)
            .catch(() => toast.error("Could not load categories."));
    }, []);

    const renderCategory = (category) => (
        <li key={category.id}>
            {category.name}
            {category.subCategories && category.subCategories.length > 0 && (
                <ul>
                    {category.subCategories.map(renderCategory)}
                </ul>
            )}
        </li>
    );

    return (
        <div>
            <h2>Manage Menu Categories</h2>
            {/* Form to add a new category */}
            <hr />
            <h3>Existing Categories</h3>
            <ul>
                {categories.map(renderCategory)}
            </ul>
        </div>
    );
}

export default CategoryManagement;