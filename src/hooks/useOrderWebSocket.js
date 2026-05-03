import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast'; // ✅ IMPORT TOAST

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
                            
                            // 1. Play Audio Alert
                            if (playSound) {
                                audioRef.current.play().catch(e => console.log("Audio blocked by browser policy", e));
                            }

                            // 2. In-App Visual Alert (Guarantees they see it if app is open)
                            toast(`New Order #${updatedOrder.orderNumber}! \n Total: €${updatedOrder.totalPrice.toFixed(2)}`, {
                                icon: '🛎️',
                                duration: 8000, // Stays on screen for 8 seconds
                                style: {
                                    borderRadius: '10px',
                                    background: '#333',
                                    color: '#fff',
                                    padding: '16px',
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold'
                                },
                            });
                            
                            // 3. Native OS Push Notification (Banner/Vibration)
                            if ("Notification" in window && Notification.permission === "granted") {
                                const notifTitle = `New Order #${updatedOrder.orderNumber}!`;
                                const notifBody = `Total: €${updatedOrder.totalPrice.toFixed(2)}\nItems: ${updatedOrder.items.length}`;
                                
                                navigator.vibrate && navigator.vibrate([200, 100, 200]);

                                // Use Service Worker if available (iOS prefers this), fallback to standard
                                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                                    navigator.serviceWorker.ready.then(registration => {
                                        registration.showNotification(notifTitle, {
                                            body: notifBody,
                                            icon: '/vite.svg',
                                            vibrate:[200, 100, 200],
                                            requireInteraction: true
                                        });
                                    });
                                } else {
                                    new Notification(notifTitle, {
                                        body: notifBody,
                                        icon: '/vite.svg',
                                        requireInteraction: true 
                                    });
                                }
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