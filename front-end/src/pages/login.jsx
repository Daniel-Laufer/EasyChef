import { Container, Form, Button } from 'react-bootstrap';
import React, { useState } from "react";
import Spinner from 'react-bootstrap/Spinner';
import * as EmailValidator from 'email-validator';
import styled from "styled-components";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import "../../index.css";
import "./login.css";

axios.defaults.headers.post['Content-Type'] ='application/x-www-form-urlencoded';

const apiURL = "http://localhost:8000";

function Login() {
    const navigate = useNavigate();
    const allEntires = new Set(["username", "password"]);
    const requiredEntries = allEntires;
    const [formData, setFormData] = useState({
        username: "",
        password: ""
    });
    const [validationErrors, setValidationErrors] = useState({
      username: "",
      password: ""
    });
    const [backEndErrorMessage, setBackEndErrorMessage ] = useState("");
    const [waitingForNetworkResponse, setWaitingForNetworkResponse] = useState(false);

    const handleChange = (event, whichData) => {
        if (!allEntires.has(whichData)) {
            return;
        }
        if(whichData == "password1" || whichData == "password2"){
            setValidationErrors({...validationErrors, 'password1': "", 'password2': ""})
        }
        else{
            setValidationErrors({...validationErrors, [whichData]: ""})
        }
        setFormData({ ...formData, [whichData]: event.target.value });
    }

    const isAbleToSubmit = () => {
        for (const [key, value] of Object.entries(validationErrors)) {
            if (requiredEntries.has(key) && value != "") {
                return false;
            }
        }
        return true;
    }

    const handleSubmit = (event) => {
        const form = event.currentTarget;
        event.preventDefault();
        event.stopPropagation();  
        const updatedValidationErrors = {...validationErrors};     
        
        if(!formData.username){
            updatedValidationErrors.username = "Please enter a username";
        }
        if(!formData.password){
          updatedValidationErrors.password = "Please enter your password";
        }

        setValidationErrors({...validationErrors, ...updatedValidationErrors});


        let no_unresolved_validation_errors = !Object.values(updatedValidationErrors).find(val => val !== "");
        if(no_unresolved_validation_errors ){
            setWaitingForNetworkResponse(true);
            const to_submit =  new FormData();
            to_submit.append("username", formData.username);
            to_submit.append("password", formData.password);
            axios
                .post(`http://localhost:8000/accounts/login/`, to_submit)
                .then((res) => {
                    const toStore = {
                        'loggedInUserId': res.data.id,
                        'tokens': res.data.tokens
                    }
                    localStorage.setItem("auth", JSON.stringify(toStore));
                    window.dispatchEvent(new Event("storage"));
                    setTimeout( () => {
                        navigate("/recipes");
                    }, 300)
                })
                .catch((err) => {
                    if(!err.response){
                        setBackEndErrorMessage(err.message);
                    }
                    else{
                        let errorMessages = "";
                    for (let key in err.response.data) {
                        errorMessages += err.response.data[key].join(" ") + " ";
                    }
                    setBackEndErrorMessage(errorMessages);
                    }
                })
                .finally(() => {
                    setWaitingForNetworkResponse(false);
                })
        }


    }

    return (
        <Container className="login-account">
            <Form noValidate onSubmit={handleSubmit}>
                <Form.Group controlId="login-username-input">
                    <Form.Label>Username</Form.Label>
                    <Form.Control onChange={(event) => handleChange(event, "username")} value={formData.username}  type="text" placeholder="Enter username" required />
                    <ErrorMessage error={validationErrors['username']}>{validationErrors.username}</ErrorMessage>
                </Form.Group>
                <Form.Group controlId="login-password-input" className="mt-2">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                        onChange={(event) => handleChange(event, "password")}
                        value={formData.password} 
                        type="password"
                        placeholder="Password"
                        required
                    />
                    <ErrorMessage error={validationErrors['password']}>{validationErrors.password}</ErrorMessage>
                </Form.Group>

                <div className="d-flex flex-wrap mt-3" style={{ gap: '10px' }}>
                    <Button disabled={waitingForNetworkResponse} type="submit">
                        Login
                    </Button>
                    {waitingForNetworkResponse && (
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                    )}
                </div>
                <ErrorMessage className="mt-3" error={backEndErrorMessage}>{backEndErrorMessage}</ErrorMessage>
            </Form>
        </Container>
    );
}



const ErrorMessage = styled.div`
    display: ${(props) => props.error ? 'block' : 'none'} !important;
    color: red;
`;

export default Login;