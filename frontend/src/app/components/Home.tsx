import React, { useEffect, useState } from 'react';
import Nav from './Nav';
import Link from "next/link";
import { useWebSocket } from '../WebSocketContext';
import { useRouter } from 'next/navigation';

const HomePage: React.FC = () => {
    const notificationSocket = useWebSocket();
    const Router = useRouter();
    const [friends, setFriends] = useState<any[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [challenge, setChallenge] = useState<any | null>(null); // To track incoming challenge

    useEffect(() => {
        if (notificationSocket) {
            notificationSocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'notification') {
                    console.log('Notification:', data.message);
                } else if (data.type === 'challenge') {
                    // Handle incoming challenge
                    setChallenge(data);
                }
            };

            notificationSocket.onclose = () => {
                console.log('Disconnected from notifications');
            };
        }
    }, [notificationSocket]);

    const getFriends = async () => {
        const response = await fetch('http://localhost:5000/api/user/getFriends', {
            method: 'GET',
            headers: {
                'auth-Token': localStorage.getItem('auth-Token') || ''
            }
        });
        const data = await response.json();
        setFriends(data);
        console.log(data);
    };

    const sendChallenge = (id: string) => {
        console.log('Sending challenge to:', id);
        if (notificationSocket) {
            const message = {
                type: 'challenge',
                from: localStorage.getItem('id'),
                to: id,
                message: 'You have been challenged!',
            };
            Router.push('/friendChallenge');
            notificationSocket.send(JSON.stringify(message));
        }
    };
    
    const respondToChallenge = (accept: Boolean) => {
        console.log('Responding to challenge:', accept);
        if (notificationSocket && challenge) {
            const message = {
                type: 'challengeResponse',
                from: challenge.to,
                to: challenge.from,
                accept,
            };
            notificationSocket.send(JSON.stringify(message));
            if (accept) {
                console.log('Challenge accepted. Waiting for game...');
                notificationSocket.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    if (data.type === 'startGame') {
                        console.log('Game session started:', data.sessionId);
                        localStorage.setItem('sessionId', data.sessionId);
                        // Redirect to the game page
                        Router.push('/friendChallenge');
                    }
                };
            } else {
                setChallenge(null); // Reset challenge if declined
            }
        }
    };
    

    useEffect(() => {
        if (localStorage.getItem('auth-Token')) {
            setIsLoggedIn(true);
        }
        getFriends();
    }, []);

    return (
        <div>
            <Nav />
            <div className="mt-[10vh]">
                {isLoggedIn ? (
                    <>
                        {friends && (
                            <div>
                                Friends
                                <ul className="flex flex-col">
                                    {friends.map((friend) => (
                                        <li key={friend._id} className="text-xl text-black cursor-pointer">
                                            <span>{friend.username}</span>
                                            {friend.isOnline && (
                                                <button
                                                    onClick={() => sendChallenge(friend._id)}
                                                    className="ml-2 bg-blue-500 text-white px-2 py-1 rounded"
                                                >
                                                    Challenge
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                ) : null}
            </div>
            {challenge && (
                <div className="fixed bottom-10 right-10 bg-gray-800 text-white p-4 rounded">
                    <p>{challenge.message}</p>
                    <button
                        onClick={() => respondToChallenge(true)}
                        className="bg-green-500 px-4 py-2 mr-2 rounded"
                    >
                        Accept
                    </button>
                    <button
                        onClick={() => respondToChallenge(false, )}
                        className="bg-red-500 px-4 py-2 rounded"
                    >
                        Decline
                    </button>
                </div>
            )}
        </div>
    );
};

export default HomePage;
