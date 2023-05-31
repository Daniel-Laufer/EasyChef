import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Dropdown, InputGroup, Form, DropdownButton } from "react-bootstrap";
import Spinner from 'react-bootstrap/Spinner';
import { useNavigate } from "react-router-dom";
import { CustomSpinner, RecipeCard } from "../components";
import axios from 'axios';
import styled from "styled-components";
import "../../index.css";
import "./myRecipes.css";

const apiURL = "http://localhost:8000";
axios.defaults.headers.post['Content-Type'] = 'application/json';


const MyRecipes = ({ getAuth }) => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState(null);

  useEffect(() => {
    // user is not logged in
    if (!getAuth()) {
      navigate("/account/login");
      return;
    };

    axios
      .get(`${apiURL}/recipes/my-recipes/`, {
        headers: {
          Authorization: `Bearer ${getAuth().tokens.access}`
        }
      })
      .then(res => {
        setRecipes(res.data);
      })
      .catch(error => console.error(error));
  },
    []);


  return recipes === null ?

    (
      <Container className="d-flex justify-content-center mt-5 my-recipes-container">
        <CustomSpinner />
      </Container>
    )
    :

    (
      <Container className="my-recipes-container">
        <h1 className="mt-5 mb-4">Liked Recipes</h1>
        <div className="my-recipe-list-wrapper">
          <div className="recipe-list">
            {
              recipes.liked.length ? recipes.liked.map((recipe, index) =>
                <RecipeCard key={index} recipe={recipe} />
              )
                : "You haven't liked any recipes yet."

            }
          </div>

        </div>
        <h1 className="mt-5 mb-4">Favourited Recipes</h1>
        <div className="my-recipe-list-wrapper">
          <div className="recipe-list">
            {
              recipes.favourited.length ? recipes.favourited.map((recipe, index) =>
                <RecipeCard key={index} recipe={recipe} />
              )
                : "You haven't favourited any recipes yet."

            }
          </div>

        </div>
        <h1 className="mt-5 mb-4">Recipes I've Commented on</h1>
        <div className="my-recipe-list-wrapper">
          <div className="recipe-list">
            {
              recipes.commented.length ? recipes.commented.map((recipe, index) =>
                <RecipeCard key={index} recipe={recipe} />
              )
                : "You haven't commented on any recipes yet."

            }
          </div>

        </div>


      </Container>
    )


};




export default MyRecipes;

