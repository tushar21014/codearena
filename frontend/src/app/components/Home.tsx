"use client"
import React, { useEffect, useState } from 'react'
import Nav from './Nav'
import Link from "next/link";
import { useWebSocket } from '../WebSocketContext';


const HomePage: React.FC = () => {
    const notificationSocket = useWebSocket();

    const [friends, setFriends] = useState<string[]>([])
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)


    useEffect(() => {
        if (notificationSocket) {
            notificationSocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'notification') {
                    console.log('Notification:', data.message);
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
        })
        const data = await response.json()
        setFriends(data)
        console.log(data)
    }

    const sendNotification = (id: string) => {
        if (notificationSocket) {
            const message = {
                type: 'notification',
                message: 'This is a test notification sent from ' + localStorage.getItem('email'),
                uid: id
            };
            notificationSocket.send(JSON.stringify(message));
        }
    };

    useEffect(() => {
        if (localStorage.getItem('auth-Token')) {
            setIsLoggedIn(true)
        }
        getFriends();

    }, [])

    return (
        <div>
            <Nav />
            <div className='mt-[10vh]'>
                {isLoggedIn ? <>
                    {friends && (
                        <div>
                            Friends
                            <ul className='flex'>
                                {friends.map((friend) => (
                                    <li onClick={() => sendNotification(friend._id)} key={friend} className={`text-xl text-black cursor-pointer ${friend.isOnline ? 'border-b-2 border-green-500' : ''}`}>{friend.username}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* <button onClick={sendNotification}>Send Notification</button> */}

                </> : <></>}

            </div>
            <div className='mt-[10vh]'>

                <Link href={"/game"}>
                    <button type="button" className=" text-white mt-10 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" >Play Online</button>
                </Link>

            </div>
        </div>
    )
}

export default HomePage