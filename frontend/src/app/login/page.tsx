"use client";

import React, { useState, useEffect } from 'react'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../css/login.css';  
import { useRouter } from 'next/navigation';

// import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
    
    const [value, setValue] = useState('');
    const router = useRouter();

    useEffect(() => {
        setValue(localStorage.getItem('email') || '');
    
    }, [])


    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCredentials({ ...credentials, [e.target.name]: e.target.value })
    }

    // const navigate = useNavigate();
    const [credentials, setCredentials] = useState({ email: "", password: "" })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:5000/api/auth/login", {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email: credentials.email, password: credentials.password })
            });

            const json = await response.json();
            console.log(json);
            if (!json.success) {
                // alert('Invaid Credentials')
                // calltoast("Incorrect Credentials!", "error")
            }

            if (json.success) {
                localStorage.setItem('auth-Token', json.authToken)
                localStorage.setItem('email', credentials.email);
                localStorage.setItem('id', json.id);
                // calltoast("Logged In successfully!", "success")
                // navigate('/')
                router.push('/')
            }
        } catch (error) {
            console.log(error);
        }

    }

    // const showPass = () => {
    //     const cont = document.getElementById('exampleCheck1');
    //     const passCont = document.getElementById('pass');
    //     if (cont.checked)
    //         passCont.type = 'text';
    //     else
    //         passCont.type = 'password'
    // }

    useEffect(() => {
        AOS.init({ duration: 1000, });
    }, [])
    return (
        <div>        <>
            <ToastContainer
                position="bottom-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
            />
            <div className='login-grandfather-cont'>
                <div className='login-container' data-aos='fade-right'>
                    <div className='container my-3 inner-login-container' >
                        <h2 className='my-4'>Login</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="exampleInputEmail1">Email address</label>
                                <input type="email" className="form-control" id="exampleInputEmail1" name='email' value={credentials.email} aria-describedby="emailHelp" onChange={onChange} placeholder="Enter email" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="exampleInputPassword1">Password</label>
                                <input type="password" className="form-control" id="pass" value={credentials.password} name='password' onChange={onChange} placeholder="Password" />
                            </div>
                            <div className="form-check">
                                <input type="checkbox" className="form-check-input forgot" id="exampleCheck1" />
                                <label className="form-check-label" htmlFor="exampleCheck1">Show Password</label>
                                {/* <Link to='/Forgotpassword' className='forgotpass'>Forgot Password?</Link> */}
                            </div>

                            <center>
                                <button type="submit" className="btn btn-primary mt-2">Log In</button>
                            </center>
                        </form>
                        <hr />
                        <div>

                              {/* {value ? navigate('/') :
                                  // <button onClick={handleClick}>Continue With Google</button>
                                  <div className='google-cont'>

                                      <div className="google-btn" onClick={handleClickk}>
                                          <div className="google-icon-wrapper">
                                              <img className="google-icon" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-iaTPCofiaWU6mMEEj_2zaxn_7Taor_oLiw&usqp=CAU" alt='google-icon' />
                                          </div>
                                          <p className="btn-text text-right"><b>Sign in with google</b></p>
                                      </div>

                                  </div>
                              } */}
                        </div>
                        <center>

                            <div className='form-caption my-4'>
                                {/* <p style={{ marginTop: '0px' }}><b> Don't Have An Account?<Link to="/Signup" style={{ color: 'black' }}> Signup</Link></b></p> */}
                            </div>
                        </center>

                    </div>
                </div>
            </div>
        </>
        </div>
    )
}

export default Login