// frontend/src/app/page.tsx
"use client";

import HomePage from "./components/Home";
import { WebSocketProvider } from './WebSocketContext';
import { useEffect, useState } from "react";

export default function Home() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

    useEffect(() => {
        if (localStorage.getItem('auth-Token')) {
            setIsLoggedIn(true);
        }
    }, []);

    return (
        <WebSocketProvider>
            <div>
                <HomePage />
            </div>
        </WebSocketProvider>
    );
}