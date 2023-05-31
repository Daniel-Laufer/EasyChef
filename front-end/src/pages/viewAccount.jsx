import { Container, Form, Button, Image } from 'react-bootstrap';
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Spinner from 'react-bootstrap/Spinner';
import * as EmailValidator from 'email-validator';
import styled from "styled-components";
import axios from 'axios';
import "../../index.css";
import "./viewAccount.css";
import { CustomSpinner } from '../components';

axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

const apiURL = "http://localhost:8000";

function ViewAccount({ getAuth }) {
    const navigate = useNavigate();
    let { accountId } = useParams();
    const [accountDetails, setAccountDetails] = useState(null);

    const get_image_url = (url) => {
        if(!url.includes(apiURL)){
          url = apiURL.concat(url);
        }
        return url;
      }

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
            .get(`${apiURL}/accounts/${accountId}/`, {
                headers: {
                    Authorization: `Bearer ${getAuth().tokens.access}`
                }
            })
            .then(res => {
                setAccountDetails(res.data);
            })
            .catch(error => console.error(error));
    },
        []);

    return accountDetails === null ?
        (
            <Container className="d-flex justify-content-center mt-5 recipes-home-container">
                <CustomSpinner />
            </Container>
        )
        :
        (
            <Container className="mt-5 view-account d-flex align-items-center flex-column ">
                <Image src={get_image_url(accountDetails.profile_picture)} roundedCircle className="mb-3" style={{ width: '200px', height: '200px', objectFit:'cover', objectPosition: 'center' }} />
                <h2>{accountDetails.username}</h2>
                {
                    accountDetails.first_name && accountDetails.last_name  && (<p>Full name: {`${accountDetails.first_name} ${accountDetails.last_name}`}</p>)
                }
                {
                    accountDetails.phone_number  && (<p>Email: {accountDetails.email}</p>)
                }
                {
                    accountDetails.phone_number  && (<p>Phone number: {format_phone_number(accountDetails.phone_number)}</p>)
                }
                {
                    getAuth().loggedInUserId === accountDetails.id ? 
                (<Button onClick={() => navigate(`/account/edit`)}>Edit Account</Button>) : null
                }
            </Container>
        );
}


export default ViewAccount;