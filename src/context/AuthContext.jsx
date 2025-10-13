import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const apiClient = {
    handleResponse: async (response) => {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
            throw new Error(errorData.message || 'A network error occurred.');
        }
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return response.json();
        }
        return response.text();
    },

    getAuthHeaders: () => {
        // --- FIX 1: Use the correct localStorage key 'authToken' ---
        const token = localStorage.getItem('authToken');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    },
    
    // Define the HTTP methods. They all use the API_BASE_URL.
    get: async function(path) {
        const response = await fetch(`${API_BASE_URL}${path}`, { headers: this.getAuthHeaders() });
        return this.handleResponse(response);
    },
    post: async function(path, body) {
        const response = await fetch(`${API_BASE_URL}${path}`, { method: 'POST', headers: this.getAuthHeaders(), body: JSON.stringify(body) });
        return this.handleResponse(response);
    },
    patch: async function(path, body) {
        const response = await fetch(`${API_BASE_URL}${path}`, { method: 'PATCH', headers: this.getAuthHeaders(), body: JSON.stringify(body) });
        return this.handleResponse(response);
    },
    put: async function(path, body) {
        const response = await fetch(`${API_BASE_URL}${path}`, { method: 'PUT', headers: this.getAuthHeaders(), body: JSON.stringify(body) });
        return this.handleResponse(response);
    },
    delete: async function(path) {
        const response = await fetch(`${API_BASE_URL}${path}`, { method: 'DELETE', headers: this.getAuthHeaders() });
        return this.handleResponse(response);
    }
};

// --- Auth Context Setup ---
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserOnLoad = async () => {
            if (token) {
                // Because of FIX 1, the apiClient now sends the correct header.
                try {
                    const userData = await apiClient.get('/api/users/me');
                    
                    // --- FIX 3: Your apiClient returns data directly, not in a `.data` property like axios ---
                    if (userData.role === 'SUPER_ADMIN') {
                        setUser(userData);
                    } else {
                        const restaurantSettings = await apiClient.get('/api/restaurants/me');
                        setUser({ ...userData, ...restaurantSettings });
                    }
                } catch (error) {
                    console.error("Auth token is invalid, logging out:", error.message);
                    toast.error("Session expired. Please log in again.");
                    logout();
                }
            }
            setIsLoading(false);
        };
        fetchUserOnLoad();
    }, [token]);

    const login = async (email, password) => {
        try {
            // --- FIX 2: Make a direct `fetch` call for login ONLY. ---
            // This bypasses the apiClient's automatic header injection, ensuring no old token is sent.
            const response = await fetch(`${API_BASE_URL}/api/auth/authenticate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }, // No 'Authorization' header
                body: JSON.stringify({ email, password })
            });

            // Use our own handleResponse logic to check for errors and parse the JSON
            const data = await apiClient.handleResponse(response);
            
            const newToken = data.token;
            localStorage.setItem('authToken', newToken);
            
            // Now that we have a new token, we can update the state, which will
            // trigger the useEffect to run with the correct token.
            setToken(newToken);

        } catch (error) {
            throw new Error(error.message || 'Login failed. Please check your credentials.');
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
        // No need to delete from apiClient.defaults since you're not using it.
    };

    const value = { token, user, isLoading, login, logout };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};