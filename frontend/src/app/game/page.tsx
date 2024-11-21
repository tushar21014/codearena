'use client';

import { useEffect, useState, useRef } from 'react';

export default function Game() {
    const [uid, setUid] = useState('');
    const [status, setStatus] = useState('Connecting...');
    const [isReady, setIsReady] = useState(false);
    const [winner, setWinner] = useState(null);
    const [opponentUid, setOpponentUid] = useState(null);

    // Ref to store the WebSocket instance
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Generate a random UID for testing or replace it with real auth logic
        // localStorage.setItem('uid', userUid);
        const userUid = localStorage.getItem('id')

        // Initialize WebSocket and store in ref
        const ws = new WebSocket('ws://localhost:8080');
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'join', uid: userUid }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'status') {
                setStatus(data.message);
            } else if (data.type === 'ready') {
                setOpponentUid(data.opponentUid);
                setStatus('Game Started! Click the button!');
                setIsReady(true);
            } else if (data.type === 'result') {
                setWinner(data.winner);
                setStatus(data.winner === userUid ? 'You Win!' : 'You Lose!');
                setIsReady(false);
            }
        };

        ws.onclose = () => {
            setStatus('Connection closed. Refresh to reconnect.');
        };

        return () => {
            ws.close();
        };
    }, []);

    const handleClick = () => {
        // Ensure WebSocket is open before sending
        if (wsRef.current && (wsRef.current as WebSocket).readyState === WebSocket.OPEN) {
            (wsRef.current as WebSocket).send(JSON.stringify({ type: 'click', uid }));
        } else {
            setStatus('WebSocket not connected!');
        }
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>{status}</h1>
            {opponentUid && <p>Playing against: {opponentUid}</p>}
            {isReady && (
                <button
                    onClick={handleClick}
                    style={{
                        padding: '10px 20px',
                        fontSize: '20px',
                        cursor: 'pointer',
                    }}
                >
                    Click Me!
                </button>
            )}
            {winner && <p>Winner: {winner}</p>}
        </div>
    );
}
