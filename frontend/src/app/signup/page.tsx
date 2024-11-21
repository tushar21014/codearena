"use client";
import axios from 'axios';
import React, { useState } from 'react'

const SignupPage = () => {
    
    const [user, setUser] = useState({ email: '', username: '', password: '' });

    const onSignup = async() => {
        try {
            const response = axios.post("http://localhost:5000/api/auth/createuser", user);
            const data = (await response).data;
            console.log(data);
            
        } catch (error: any) {
            console.log(error);
        }
    }
    return (
        <div className=''>
            <div className="m-auto w-3/4 flex-col justify-items-center content-center h-screen">
                <h1 className="text-4xl font-bold">Sign Up</h1>
                <p className="text-lg text-gray-600 mt-2">Create an account to get started.</p>
                <div className="form flex flex-col">
                    Username
                    <input required className='p-4 my-2 rounded-md focus:outline-none focus:border-gray-600 border border-gray-300 text-black' name='username' type='text' placeholder='Enter your username' value={user.username || ""} onChange={(e) => setUser({ ...user, username: e.target.value })} />
                    Email
                    <input required className='p-4 my-2 rounded-md focus:outline-none focus:border-gray-600 border border-gray-300 text-black' name='email' type='email' placeholder='Enter your Email' value={user.email || ""} onChange={(e) => setUser({ ...user, email: e.target.value })} />
                    Password
                    <input required className='p-4 my-2 rounded-md focus:outline-none focus:border-gray-600 border border-gray-300 text-black' name='password' type='password' placeholder='Enter your password' value={user.password || ""} onChange={(e) => setUser({ ...user, password: e.target.value })} />

                    <button className='p-4 my-2 rounded-md bg-blue-500 text-white' onClick={() => {console.log(user), onSignup(); }}>Sign Up</button>
                </div>
            </div>
        </div>
    )
}

export default SignupPage