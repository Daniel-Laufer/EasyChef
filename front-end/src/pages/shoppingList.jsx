import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Dropdown, InputGroup, Form, DropdownButton, ListGroup, ListGroupItem  } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { CustomSpinner, RecipeCard } from "../components";
import axios from 'axios';
import styled from "styled-components";
import "../../index.css";
import "./shoppingList.css";

const apiURL = "http://localhost:8000";
axios.defaults.headers.post['Content-Type'] = 'application/json';


const ShoppingList = ({ getAuth }) => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState(null);
  const [ingredients, setIngredients] = useState(null);


useEffect(() => {
    if(!recipes)
        return;

    combined_all_recipe_ingredients();
}, [recipes]);


  const combined_all_recipe_ingredients = () => {
    const all_ingredients = recipes.reduce((acc, curr) => {
        let ingredients = curr.ingredients.reduce((acc2, curr2) => {
            const ingredient_name = curr2.name.trim().toLowerCase();
            acc2[ingredient_name] = {
                quantity: curr.selected_serving == 2 ? curr2.quantity_serving_two : curr2.quantity_serving_one,
                units: curr2.quantity_units
            }
            return acc2;
        }, {});

        for (const [key, value] of Object.entries(ingredients)) {
            const units = value.units ? value.units : "not specified";
            if(acc[key]){
                if(acc[key][units]){
                    acc[key][units] += value.quantity;
                }
                else{
                    acc[key][units] = value.quantity;
                }
            }
            else{
                acc[key] = {
                    [units]: value.quantity
                }
            }
        }
        return acc;
    }, {})
    console.log(all_ingredients)
    console.log(recipes);
    setIngredients(all_ingredients)
  }

  /*
const ingredient_name = curr2.name.trim().toLowerCase();
            if(acc2[ingredient_name]){
                acc2[ingredient_name].quantity_serving_one += curr2.quantity_serving_one;
                acc2[ingredient_name].quantity_serving_two += curr2.quantity_serving_two;
            }
            else{
                acc2[ingredient_name].quantity_serving_one = curr2.quantity_serving_one;
                acc2[ingredient_name].quantity_serving_two = curr2.quantity_serving_two;
            }
  */

  useEffect(() => {
    // user is not logged in
    if (!getAuth()) {
      navigate("/account/login");
      return;
    };
    const accessToken = getAuth().tokens.access;

    axios
      .get(`${apiURL}/recipes/shopping-list/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
      .then(res => {
        const  updated_recipes = res.data.reduce((acc, curr) => {
            const to_push = {...curr.recipe};
            to_push.selected_serving = "1";
            acc.push(to_push);
            
            return acc;
        }, [])
        setRecipes(updated_recipes);
      })
      .catch(error => console.error(error));
  },
    []);

const handleServingUpdate = (newServing, recipeId) => {
    console.log(newServing, recipeId);
    const updated_recipes = recipes.reduce((acc, curr) => {
        const to_push = {...curr};
        if(curr.id === recipeId){
            to_push.selected_serving = newServing;
        }
        return [...acc, to_push];
    }, []);

    setRecipes(updated_recipes);
}




  return recipes === null || ingredients === null ? 
  
    (
      <Container className="d-flex justify-content-center mt-5 shopping-list-container">
      <CustomSpinner/>
      </Container>
    )
  
  : (


    <Container className="recipes-home-container">

       <h1 className="mt-5 mb-4">Shopping List</h1>
       <p>A list of the combined totals for the ingredients needed for all recipes in your shopping list. The ingredient totals will update automatically when you select the change the seelcted serving for each reipe below.</p>
       <ListGroup>
        {Object.keys(ingredients).map((ingredient, ingrIndex) => 
            Object.keys(ingredients[ingredient]).sort().map((unit, unitIndex) => 
                <ListGroupItem key={`${ingrIndex}${unitIndex}`}>{`${ingredients[ingredient][unit]}${unit} ${ingredient}`}</ListGroupItem>
            )
        )}
        </ListGroup>

        <div className="mt-5 recipe-list">
          {
            recipes.length ? recipes.map((recipe, index) =>
              <RecipeCard key={index} recipe={recipe} handleServingUpdate={handleServingUpdate} selectedServing={recipe.selected_serving} />
            )
              : "No recipes"

          }
        </div>
      


    </Container>
  );
};




export default ShoppingList;

