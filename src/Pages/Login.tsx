import React from 'react'
import Form from 'react-bootstrap/Form';
import axios from "axios";
import {Alert} from "react-bootstrap";
import {redirect, useNavigate} from "react-router-dom";
export default function Login (){
  const navigate = useNavigate();
    function onSubmitFunction(e:React.FormEvent<HTMLFormElement>){
      e.preventDefault()
      const formData = new FormData(e.currentTarget)
      axios.post('http://127.0.0.1:8000//api/login/',{
        username: formData.get('name'),
        password: formData.get('password'),
        headers:{
        "Content-type": "application/json"
      }
      }).then(res=>{localStorage.setItem("token", res.data.key);
      console.log(res)})
          .catch(err=>{return <Alert>nope!</Alert>})

      navigate('../home/',{replace: true});
    }
    return (
        <>
      <Form onSubmit={onSubmitFunction}>
        <h3>Login</h3>
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
          <button type="submit" className="btn btn-primary">
            Submit
          </button>
        </div>
        <p className="forgot-password text-right">
          Forgot <a href="#">password?</a>
        </p>
        <p><a href={'signup'}>SignUp</a> </p>
      </Form>
    </>
    )
}