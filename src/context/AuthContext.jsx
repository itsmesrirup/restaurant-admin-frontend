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

    // --- CHANGED: Added isFormData parameter ---
    getAuthHeaders: (isFormData = false) => {
        const token = localStorage.getItem('authToken');
        const headers = {
            'Authorization': `Bearer ${token}`,
        };
        // --- CHANGED: Only set JSON content type if it's NOT FormData ---
        // Let the browser set the Content-Type (including boundary) for FormData automatically.
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        return headers;
    },
    
    get: async function(path) {
        const response = await fetch(`${API_BASE_URL}${path}`, { headers: this.getAuthHeaders() });
        return this.handleResponse(response);
    },

    // --- CHANGED: Check for FormData and pass correct headers ---
    post: async function(path, body) {
        const isFormData = body instanceof FormData;
        const response = await fetch(`${API_BASE_URL}${path}`, { 
            method: 'POST', 
            headers: this.getAuthHeaders(isFormData), 
            body: isFormData ? body : JSON.stringify(body) 
        });
        return this.handleResponse(response);
    },

    // --- CHANGED: Check for FormData ---
    patch: async function(path, body) {
        const isFormData = body instanceof FormData;
        const response = await fetch(`${API_BASE_URL}${path}`, { 
            method: 'PATCH', 
            headers: this.getAuthHeaders(isFormData), 
            body: isFormData ? body : JSON.stringify(body) 
        });
        return this.handleResponse(response);
    },

    // --- CHANGED: Check for FormData ---
    put: async function(path, body) {
        const isFormData = body instanceof FormData;
        const response = await fetch(`${API_BASE_URL}${path}`, { 
            method: 'PUT', 
            headers: this.getAuthHeaders(isFormData), 
            body: isFormData ? body : JSON.stringify(body) 
        });
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
                try {
                    const userData = await apiClient.get('/api/users/me');
                    
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
            const response = await fetch(`${API_BASE_URL}/api/auth/authenticate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await apiClient.handleResponse(response);
            
            const newToken = data.token;
            localStorage.setItem('authToken', newToken);
            setToken(newToken);

        } catch (error) {
            throw new Error(error.message || 'Login failed. Please check your credentials.');
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
    };

    const value = { token, user, isLoading, login, logout };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};