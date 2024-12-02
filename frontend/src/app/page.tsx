// frontend/src/app/page.tsx
"use client";

import HomePage from "./components/Home";
import { ToastProvider } from "./Context/CreateStates";
import { WebSocketProvider } from './WebSocketContext';
import { useEffect, useState } from "react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Home() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

    useEffect(() => {
        if (localStorage.getItem('auth-Token')) {
            setIsLoggedIn(true);
        }
    }, []);

    return (

        <WebSocketProvider>
            <ToastProvider>
                <ToastContainer
                    position="bottom-right"
                    autoClose={15000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="dark"
                />
                <div>
                    <HomePage />
                </div>
            </ToastProvider>
        </WebSocketProvider>
    );
}