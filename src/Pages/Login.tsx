import React from 'react'
import Form from 'react-bootstrap/Form';
import axios from "axios";
import {Alert} from "react-bootstrap";
import {redirect, useNavigate} from "react-router-dom";
import './Login.css'

export default function Login() {
    const navigate = useNavigate();

    function onSubmitFunction(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        axios.post('http://127.0.0.1:8000//api/login/', {
            username: formData.get('name'),
            password: formData.get('password'),
            headers: {
                "Content-type": "application/json"
            }
        }).then(res => {
            localStorage.setItem("token", res.data.key);
            console.log(res)
            navigate('../home/', {replace: true});
        })
            .catch(err => {
            })


    }

    return (
        <div className="login-container">
            <Form onSubmit={onSubmitFunction}>
                <h3 className="login-header">Login</h3>
                <div className="mb-3">
                    <label>Name</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Enter name"
                        name='name'
                    />
                </div>
                <div className="mb-3">
                    <label>Password</label>
                    <input
                        type="password"
                        className="form-control"
                        placeholder="Enter password"
                        name='password'
                    />
                </div>
                <div className="d-grid">
                    <button type="submit" className="btn login-btn">
                        Submit
                    </button>
                </div>
                <p className="signup-link"><a href={'signup'}>SignUp</a></p>
            </Form>
        </div>
    )
}