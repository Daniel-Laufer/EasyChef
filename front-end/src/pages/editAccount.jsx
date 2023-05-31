import { Container, Form, Button } from 'react-bootstrap';
import React, { useState, useEffect} from "react";
import Spinner from 'react-bootstrap/Spinner';
import * as EmailValidator from 'email-validator';
import styled from "styled-components";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import "../../index.css";
import "./editAccount.css";
import { CustomSpinner } from '../components';


const apiURL = "http://localhost:8000";

function EditAccount({getAuth}) {
    const navigate = useNavigate();
    const allEntires = new Set(["username", "firstName", "lastName", "email", "phone", "password1", "password2"]);
    const requiredEntries = new Set(["username", "firstName", "lastName", "email", "phone"]);
    const [formData, setFormData] = useState(null);
    const [validationErrors, setValidationErrors] = useState({
        username: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password1: "",
        password2: "",
    });
    const [backEndErrorMessage, setBackEndErrorMessage ] = useState("");
    const [waitingForNetworkResponse, setWaitingForNetworkResponse] = useState(false);
    const [profilePictureFile, setProfilePictureFile] = useState(null);

    const format_phone_number = (phone) => {
        const matched_sections = phone.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (matched_sections) return matched_sections[1] + '-' + matched_sections[2] + '-' + matched_sections[3];
        return phone;
    } 


    useEffect(() => {
        // user is not logged in
        if (!getAuth()) {
            navigate("/account/login");
            return;
        };

        axios
        .get(`${apiURL}/accounts/${getAuth().loggedInUserId}/`, {
            headers: {
                Authorization: `Bearer ${getAuth().tokens.access}`
            }
        })
        .then(res => {
            const newFormData = {};
            newFormData.username = res.data.username;
            newFormData.firstName = res.data.first_name;
            newFormData.lastName = res.data.last_name;
            newFormData.email = res.data.email;
            newFormData.phone = format_phone_number(res.data.phone_number);
            newFormData.password1 = "";
            newFormData.password2 = "";            
            setFormData({...newFormData});
        })
        .catch(error => console.error(error));
    }
    , []);

    const handleFileChange = (event) => {
        const file_to_upload = event.target.files[0];
        setProfilePictureFile(file_to_upload);
    }

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
        if(!formData.firstName){
            updatedValidationErrors.firstName = "Please enter your first name";
        }
        if(!formData.lastName){
            updatedValidationErrors.lastName = "Please enter your last name";
        }

        if (!EmailValidator.validate(formData.email)) {
            updatedValidationErrors.email = "Please enter a valid email";
        }

        let phone_regex = /^\d{3}-\d{3}-\d{4}$/;
        if(!formData.phone.match(phone_regex)){
            updatedValidationErrors.phone = "Please enter a valid phone number";
        }

    
        if(formData.password1 || formData.password2){
            if(formData.password1.length < 8){
                updatedValidationErrors.password1 = "Password must be longer than 8 characters"
            }
            
            if(formData.password2 !== formData.password1){
                updatedValidationErrors.password2 = "Passwords don't match."
            }
        }
       
        

        setValidationErrors({...validationErrors, ...updatedValidationErrors});


        
        let no_unresolved_validation_errors = !Object.values(updatedValidationErrors).find(val => val !== "");
        if(no_unresolved_validation_errors ){
            setWaitingForNetworkResponse(true);
            const to_submit =  new FormData();
            to_submit.append("username", formData.username);
            to_submit.append("first_name", formData.firstName);
            to_submit.append("last_name", formData.lastName);
            if(formData.password1){
                to_submit.append("password", formData.password1);
            }
            to_submit.append("email", formData.email);
            to_submit.append("phone_number", formData.phone.replaceAll("-", ""));
            if(profilePictureFile)
                to_submit.append("profile_picture", profilePictureFile);
            axios
                .patch(`http://localhost:8000/accounts/${getAuth().loggedInUserId}/edit/`, to_submit, {
                    headers: {
                        'Authorization': `Bearer ${getAuth().tokens.access}`,
                        'Content-Type': 'multipart/form-data'
                    }
                })
                .then((res) => {
                    window.dispatchEvent(new Event("storage"));
                    navigate("/recipes");
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

    return formData === null ? 
    (
        <Container className="d-flex justify-content-center mt-5 register-account">
                <CustomSpinner />
            </Container>
    )
    :(
        <Container className="register-account">
            <Form noValidate onSubmit={handleSubmit}>
                <Form.Group controlId="register-username-input">
                    <Form.Label>Username</Form.Label>
                    <Form.Control onChange={(event) => handleChange(event, "username")} value={formData.username}  type="text" placeholder="Enter username" required />
                    <ErrorMessage error={validationErrors['username']}>{validationErrors.username}</ErrorMessage>
                </Form.Group>
                <Form.Group controlId="register-first-name-input" className="mt-2">
                    <Form.Label>First Name</Form.Label>
                    <Form.Control onChange={(event) => handleChange(event, "firstName")} value={formData.firstName}  type="text" placeholder="Enter first name" required />
                    <ErrorMessage error={validationErrors['firstName']}>{validationErrors.firstName}</ErrorMessage>
                </Form.Group>
                <Form.Group controlId="register-last-name-input" className="mt-2">
                    <Form.Label>Last Name</Form.Label>
                    <Form.Control onChange={(event) => handleChange(event, "lastName")} value={formData.lastName}  type="text" placeholder="Enter last name" required />
                    <ErrorMessage error={validationErrors['lastName']}>{validationErrors.lastName}</ErrorMessage>
                </Form.Group>

                <Form.Group controlId="register-email-input" className="mt-2">
                    <Form.Label>Email address</Form.Label>
                    <Form.Control
                        onChange={(event) => handleChange(event, "email")} value={formData.email} type="email" placeholder="Enter email" required />
                    <ErrorMessage error={validationErrors['email']}>{validationErrors.email}</ErrorMessage>
                </Form.Group>

                <Form.Group controlId="register-phone-number-input" className="mt-2">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                        onChange={(event) => handleChange(event, "phone")}
                        value={formData.phone} 
                        type="tel"
                        placeholder="Enter your phone number"
                        required
                        pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                        autoComplete="off"
                        
                    />
                    <Form.Text className="text-muted">
                        Required Format: xxx-xxx-xxxx
                    </Form.Text>
                    <ErrorMessage error={validationErrors['phone']}>{validationErrors.phone}</ErrorMessage>
                </Form.Group>

                <Form.Group controlId="register-password-input-1" className="mt-2">
                    <Form.Label>(Optional) New Password</Form.Label>
                    <Form.Control
                        onChange={(event) => handleChange(event, "password1")}
                        value={formData.password1} 
                        type="password"
                        placeholder="Password"
                    />
                    <ErrorMessage error={validationErrors['password1']}>{validationErrors.password1}</ErrorMessage>
                </Form.Group>
                <Form.Group controlId="register-password-input-2" className="mt-2">
                    <Form.Label>(Optional) Confirm New Password</Form.Label>
                    <Form.Control
                        onChange={(event) => handleChange(event, "password2")}
                        value={formData.password2} 
                        type="password"
                        placeholder="Confirm password"
                    />
                    <ErrorMessage error={validationErrors['password2']}>{validationErrors.password2}</ErrorMessage>
                </Form.Group>
                <Form.Group controlId="profile-picture-file-input" className="mb-3 mt-2">
                    <div>

                        <Form.Label style={{ marginRight: '10px' }}>  (Optional) Profile Picture</Form.Label>
                        <Form.Control type="file" onChange={(event) => handleFileChange(event)} />
                        <Form.Text className="text-muted">If you don't upload an image, your profile picture will not change.</Form.Text>
                        <p></p>
                    </div>
                    <ErrorMessage error={validationErrors['uploadedImageUrl']}>{validationErrors.uploadedImageUrl}</ErrorMessage>
                </Form.Group>

                <div className="d-flex flex-wrap" style={{ gap: '10px' }}>
                    <Button disabled={waitingForNetworkResponse} type="submit">
                        Update Account
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

export default EditAccount;