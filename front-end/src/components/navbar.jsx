import React, { useState, useEffect, useRef} from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import { Dropdown, Container, Button } from "react-bootstrap"
import NavDropdown from 'react-bootstrap/NavDropdown';
import Image from 'react-bootstrap/Image';
import { useNavigate } from "react-router-dom";
import logo from "../images/logo-text.png";
import voldemort from "../images/fake-user-data/vold-selfie.webp"
import styled from "styled-components";
import axios from 'axios';
import "./navbar.css"

axios.defaults.headers.post['Content-Type'] ='application/x-www-form-urlencoded';

const apiURL = "http://localhost:8000";

function CustomNavbar() {
    const navigate = useNavigate();
    const [loggedInUserDetails, setLoggedInUserDetails] = useState(null);
    const [expanded, setExpanded] = useState(false);

    const handleLocalStorageAuthChange = () => {
        const auth =JSON.parse(localStorage.getItem('auth'));
        if(!auth){
            return;
        }

        const loggedInUserId = auth.loggedInUserId;
        const accessToken = auth.tokens.access;
        
        axios
        .get(`${apiURL}/accounts/${loggedInUserId}/`, {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          })
        .then((res) => {
            setLoggedInUserDetails({...res.data});
        })
        .catch((err) => {
            console.log(err)
        })
    };

    useEffect(() => {
        handleLocalStorageAuthChange();

        window.addEventListener('storage', handleLocalStorageAuthChange);
        return () => {
          window.removeEventListener('storage', handleLocalStorageAuthChange);
        };
      }, []);

    const handleRedirect = (url) => {
        setExpanded(false);
        navigate(url);
    }

    const handleLogout = () => {
        if(localStorage.getItem("auth")){
            localStorage.removeItem('auth');
        }
        setLoggedInUserDetails(null);
        handleRedirect("/");
    }

    return (
        <Navbar bg="light" expand="lg" expanded={expanded} >
            <Navbar.Brand id="easy-chef-nav-logo" onClick={() => navigate("/")} style={{"cursor": "pointer"}}>
                <Image src={logo} height="30" alt="" />
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="navbarSupportedContent" onClick={() => setExpanded(expanded ? false : "expanded")} />
            <Navbar.Collapse  id="navbarSupportedContent">
                <Nav className="mr-auto">
                    <Nav.Link onClick={() => handleRedirect("/recipes/")}>Recipes</Nav.Link>
                    <Nav.Link onClick={() => handleRedirect("/my-recipes/")}>My Recipes</Nav.Link>
                    <Nav.Link onClick={() => handleRedirect("/recipes/create")}>Create Recipe</Nav.Link>
                </Nav>

                {
                    loggedInUserDetails ?
                        (<Dropdown className="nav-item dropdown nav-account-dropdown dropdown-menu-right">
                            <Dropdown.Toggle style={{ background: 'none' }} className="nav-link" id="navbarDropdown">
                                <ProfilePicture style={{ backgroundPosition: 'center'}}imagePath={`${apiURL}/${loggedInUserDetails.profile_picture}`} />
                            </Dropdown.Toggle>

                            <Dropdown.Menu aria-labelledby="navbarDropdown">
                                <Dropdown.Item disabled style={{ color: 'black' }}>Hi {loggedInUserDetails.first_name} 👋</Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={() => handleRedirect(`/shopping-list/`)}>Shopping List</Dropdown.Item>
                                <Dropdown.Item onClick={() => handleRedirect(`/accounts/${loggedInUserDetails.id}`)}>View Profile</Dropdown.Item>
                                <Dropdown.Item onClick={() => handleRedirect("/account/edit")}>Edit Profile</Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>)
                        :
                        <div id="login-register-button-container">
                            <Button 
                                onClick={() => handleRedirect("/account/login")} id="login-button"
                            >
                                Login
                            </Button>
                            <Button 
                                onClick={() => handleRedirect("/account/register")} id="register-button"
                            >
                                Register
                            </Button>
                        </div>
                }


            </Navbar.Collapse>
        </Navbar>
    );
}

const ProfilePicture = styled.div`
    background-image: url(${(props) => props.imagePath});
    background-size: cover;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    padding-left: 0;
`;


export default CustomNavbar;