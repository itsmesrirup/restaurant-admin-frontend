import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '../context/AuthContext';

export const useOrderWebSocket = (setOrders, playSound = false, soundFile = '/notification.mp3') => {
    const { user } = useAuth();
    const clientRef = useRef(null);
    const audioRef = useRef(new Audio(soundFile)); // Ensure notification.mp3 is in /public

    useEffect(() => {
        if (!user || !user.restaurantId) return;

        // Create the STOMP Client
        const client = new Client({
            webSocketFactory: () => new SockJS(`${import.meta.env.VITE_API_BASE_URL}/ws`),
            reconnectDelay: 5000, // Auto reconnect
            onConnect: () => {
                console.log("Connected to WebSocket");

                // Subscribe to this restaurant's specific topic
                client.subscribe(`/topic/restaurant/${user.restaurantId}`, (message) => {
                    const updatedOrder = JSON.parse(message.body);
                    
                    // Update the State
                    setOrders((prevOrders) => {
                        // Check if order exists
                        const exists = prevOrders.find(o => o.id === updatedOrder.id);
                        
                        if (exists) {
                            // UPDATE existing order
                            return prevOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
                        } else {
                            // ADD new order (Play sound if it's new!)
                            if (playSound) {
                                audioRef.current.play().catch(e => console.log("Audio blocked", e));
                            }
                            // Add to top of list
                            return [updatedOrder, ...prevOrders];
                        }
                    });
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            if (clientRef.current) clientRef.current.deactivate();
        };
    }, [user, setOrders, playSound]);
};