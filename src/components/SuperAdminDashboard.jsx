import React, { useState } from 'react';
import { apiClient } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

function SuperAdminDashboard() {
    // --- State for creating a new restaurant ---
    const [restaurantName, setRestaurantName] = useState('');
    const [restaurantAddress, setRestaurantAddress] = useState('');

    // --- State for creating a new admin user ---
    const [userEmail, setUserEmail] = useState('');
    const [userPassword, setUserPassword] = useState('');
    const [userRestaurantId, setUserRestaurantId] = useState('');

    const handleCreateRestaurant = async (e) => {
        e.preventDefault();
        const promise = apiClient.post('/api/restaurants', { name: restaurantName, address: restaurantAddress });
        toast.promise(promise, {
            loading: 'Creating restaurant...',
            success: (newRestaurant) => {
                setRestaurantName('');
                setRestaurantAddress('');
                return `Restaurant "${newRestaurant.name}" created with ID: ${newRestaurant.id}!`;
            },
            error: (err) => err.message,
        });
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        const promise = apiClient.post('/api/auth/register', { 
            email: userEmail, 
            password: userPassword, 
            restaurantId: parseInt(userRestaurantId) 
        });
        toast.promise(promise, {
            loading: 'Creating admin user...',
            success: () => {
                setUserEmail('');
                setUserPassword('');
                setUserRestaurantId('');
                return 'Admin user created successfully!';
            },
            error: (err) => err.message,
        });
    };

    return (
        <div>
            <h2>Super Admin Dashboard</h2>
            <div style={{ display: 'flex', gap: '2rem' }}>
                <form onSubmit={handleCreateRestaurant} style={{ border: '1px solid #ccc', padding: '1rem' }}>
                    <h3>Create New Restaurant</h3>
                    <input type="text" value={restaurantName} onChange={e => setRestaurantName(e.target.value)} placeholder="Restaurant Name" required />
                    <input type="text" value={restaurantAddress} onChange={e => setRestaurantAddress(e.target.value)} placeholder="Address" required />
                    <button type="submit">Create Restaurant</button>
                </form>

                <form onSubmit={handleCreateUser} style={{ border: '1px solid #ccc', padding: '1rem' }}>
                    <h3>Create New Restaurant Admin</h3>
                    <input type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="Admin Email" required />
                    <input type="password" value={userPassword} onChange={e => setUserPassword(e.target.value)} placeholder="Temporary Password" required />
                    <input type="number" value={userRestaurantId} onChange={e => setUserRestaurantId(e.target.value)} placeholder="Restaurant ID" required />
                    <button type="submit">Create Admin</button>
                </form>
            </div>
        </div>
    );
}

export default SuperAdminDashboard;