import React, { useContext, useEffect, useState } from 'react';
import Nav from './Nav';
import { useWebSocket } from '../WebSocketContext';
import { useRouter } from 'next/navigation';
import { useToastContext } from '../Context/CreateStates';


const HomePage: React.FC = () => {
    const notificationSocket = useWebSocket();
    const Router = useRouter();
    const [friends, setFriends] = useState<any[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [challenge, setChallenge] = useState<any | null>(null); // To track incoming challenge

    const { calltoast } = useToastContext();

    useEffect(() => {
        if (notificationSocket) {
            notificationSocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'notification') {
                    console.log('Notification:', data.message);
                } else if (data.type === 'challenge') {
                    // Handle incoming challenge
                    setChallenge(data);
                } else if (data.type === 'statusUpdate') {
                    console.log(data)
                    setFriends((prev) => {
                        return prev.map((friend) => {
                            if (friend._id === data.friendId) {
                                return { ...friend, isOnline: data.isOnline, isFree: data.isFree };
                            }
                            return friend;
                        });
                    })
                    console.log(friends)
                }
            };

            notificationSocket.onclose = () => {
                notificationSocket.onmessage = null; // Clean up listener on unmount
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
        calltoast("Friends Loaded", "success");
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
            notificationSocket.send(JSON.stringify(message));
            // Redirect the challenger to the challenge waiting page
            Router.push('/friendChallenge');
        }
    };

    const respondToChallenge = (accept: Boolean) => {
        console.log('Responding to challenge:', accept);
        if (notificationSocket && challenge) {
            const message = {
                type: 'challengeResponse',
                from: challenge.from,
                to: challenge.to,
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
                // Decline logic: Redirect the challenger back to home
                notificationSocket.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    if (data.type === 'challengeDeclined') {
                        console.log("Challenge Declined");
                        Router.push('/'); // Redirect to home page
                    }
                };
                setChallenge(null); // Reset the challenge state
            }
        }
    };


    useEffect(() => {
        if (localStorage.getItem('auth-Token')) {
            setIsLoggedIn(true);
            getFriends();
        }
    }, []);

    useEffect(() => {
        if (challenge) {
          calltoast(
              <div className=" text-white p-4 rounded " key={challenge.from}>
                <p>{challenge.message}</p>
                <button
                  onClick={() => respondToChallenge(true)}
                  className="bg-green-500 px-2 py-1 mr-2 rounded"
                >
                  Accept
                </button>
                <button
                  onClick={() => respondToChallenge(false)}
                  className="bg-red-500 px-2 py-1 rounded"
                >
                  Decline
                </button>
              </div>,
            "info"
          );
        }
      }, [challenge]);

    return (
        <>

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
                                                {friend.isOnline && friend.isFree && (
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


                {/* {challenge && (
                    <div className="fixed bottom-10 right-10 bg-gray-800 text-white p-4 rounded">
                        <p>{challenge.message}</p>
                        <button
                            onClick={() => respondToChallenge(true)}
                            className="bg-green-500 px-4 py-2 mr-2 rounded"
                        >
                            Accept
                        </button>
                        <button
                            onClick={() => respondToChallenge(false)}
                            className="bg-red-500 px-4 py-2 rounded"
                        >
                            Decline
                        </button>
                    </div>
                )} */}
            </div>
        </>
    );
};

export default HomePage;
