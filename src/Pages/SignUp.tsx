import React from 'react'
import Form from 'react-bootstrap/Form';
import axios from "axios";
import {Alert} from "react-bootstrap";
import {useNavigate} from "react-router-dom";
import './SignUp.css'
export default function SignUp() {
    const navigate = useNavigate();

    function onSubmitFunction(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        axios.post('http://127.0.0.1:8000//api/register/', {
            username: formData.get("name"),
            password1: formData.get("password"),
            password2: formData.get("password"),
            headers: {
                "Content-type": "application/json"
            }
        }).catch((err) => {
            return <Alert>{err}</Alert>
        })
        navigate('./Login', {replace: true});
    }

    return (
        <div className="signup-container">
            <Form onSubmit={onSubmitFunction}>
                <h3 className="signup-header">Sign Up</h3>
                <div className="mb-3">
                    <label>Name</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Name"
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
                    <button type="submit" className="btn signup-btn">
                        Sign Up
                    </button>
                </div>
                <p className="login-link">
                    Already registered? <a href="/Login">Sign in</a>
                </p>
            </Form>
        </div>
    )
}