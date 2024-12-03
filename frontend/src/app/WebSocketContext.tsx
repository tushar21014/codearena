// frontend/src/app/WebSocketContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

const WebSocketContext = createContext<WebSocket | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notificationSocket, setNotificationSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8081');
        setNotificationSocket(socket);

        socket.onopen = () => {
            const uid = localStorage.getItem('id');
            socket.send(JSON.stringify({ type: 'register', uid }));
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'notification') {
                console.log('Notification:', data.message);
            }
        };

        socket.onclose = () => {
            console.log('Disconnected from notifications');
        };

        return () => {
            socket.close();
        };
    }, []);

    return (
        <WebSocketContext.Provider value={notificationSocket}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => useContext(WebSocketContext);