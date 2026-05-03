import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '../context/AuthContext';

export const useOrderWebSocket = (setOrders, playSound = false, soundFile = '/notification.mp3') => {
    const { user } = useAuth();
    const clientRef = useRef(null);
    const audioRef = useRef(new Audio(soundFile));

    useEffect(() => {
        if (!user || !user.restaurantId) return;

        const client = new Client({
            webSocketFactory: () => new SockJS(`${import.meta.env.VITE_API_BASE_URL}/ws`),
            reconnectDelay: 5000,
            
            onConnect: () => {
                client.subscribe(`/topic/restaurant/${user.restaurantId}`, (message) => {
                    const updatedOrder = JSON.parse(message.body);
                    
                    setOrders((prevOrders) => {
                        const exists = prevOrders.find(o => o.id === updatedOrder.id);
                        if (exists) {
                            return prevOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
                        } else {
                            // ✅ IT'S A NEW ORDER!
                            
                            // 1. Play Sound
                            if (playSound) {
                                audioRef.current.play().catch(e => console.log("Audio blocked", e));
                            }
                            
                            // 2. Trigger Native OS Push Notification
                            if ("Notification" in window && Notification.permission === "granted") {
                                const notifTitle = `New Order #${updatedOrder.orderNumber}!`;
                                const notifBody = `Total: €${updatedOrder.totalPrice.toFixed(2)}\nItems: ${updatedOrder.items.length}`;
                                
                                // Vibrate phone if supported, show notification banner
                                navigator.vibrate && navigator.vibrate([200, 100, 200]);
                                new Notification(notifTitle, {
                                    body: notifBody,
                                    icon: '/vite.svg', // Optional: Replace with your actual app logo URL
                                    requireInteraction: true // Keeps notification on screen until tapped
                                });
                            }

                            return[updatedOrder, ...prevOrders];
                        }
                    });
                });
            }
        });

        client.activate();
        clientRef.current = client;

        return () => {
            if (clientRef.current) clientRef.current.deactivate();
        };
    }, [user, setOrders, playSound, soundFile]);
};