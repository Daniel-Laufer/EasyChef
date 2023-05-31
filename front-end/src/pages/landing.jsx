import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import "../../index.css";
import "./landing.css";

const Landing = () => {
  const navigate = useNavigate();
  return (
    <StyledContainer className="landing-container">
          <h1>Welcome to Easy Chef</h1>
          <p>
          Search through millions of different recipes from various diets and ingredients from all over the world! You can also share your custom recipe with everyone! You don't need to worry about the shopping list either; Easy Chef takes care of that as well!
          </p>
          <Button variant="primary" id="sign-up-button" onClick={()=>navigate("/account/register")}>
            Join Now
          </Button>
    </StyledContainer>
  );
};

const StyledContainer = styled(Container)`
    display: flex;
    flex-direction: column;
    align-items:center;
    width:70%;
    text-align:center;
    justify-content:center;
    background-color: #f8f9fa;
  padding: 2rem 1rem;
  margin-bottom: 2rem;
  border-radius: 0.375rem;
`;


export default Landing;

