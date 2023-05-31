import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Dropdown, InputGroup, Form, DropdownButton } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { CustomSpinner, RecipeCard } from "../components";
import axios from 'axios';
import styled from "styled-components";
import "../../index.css";
import "./recipesHome.css";

const apiURL = "http://localhost:8000";
axios.defaults.headers.post['Content-Type'] = 'application/json';


const RecipesHome = ({ getAuth }) => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState(null);
  const [recipePaginationUrls, setRecipePaginationUrls] = useState({});
  const [popularRecipes, setPopularRecipes] = useState(null);
  const [popularRecipePaginationUrls, setPopularRecipePaginationUrls] = useState({});
  const [searchInputValue, setSearchInputValue] = useState("");
  const [searchType, setSearchType] = useState("name");
  const [cuisineFilterValue, setCuisineFilterValue] = useState("");
  const [dietFilterValue, setDietFilterValue] = useState("");
  const [cookTimeFilterValue, setCookTimeFilterValue] = useState("");


  useEffect(() => {
    const auth = getAuth();
    // user is not logged in
    if (!auth) {
      navigate("/account/login");
      return;
    };
    const accessToken = auth.tokens.access;

    axios
      .get(`${apiURL}/recipes/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
      .then(res => {
        const new_pagination_urls = {
          next: res.data.next === "null" ? null : res.data.next,
          previous: res.data.previous === "null" ? null : res.data.previous,
        };
        setRecipePaginationUrls(new_pagination_urls);

        setRecipes(res.data.results);
      })
      .catch(error => console.error(error));

    axios
      .get(`${apiURL}/recipes/?popularityDesc=true`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
      .then(res => {
        const new_pagination_urls = {
          next: res.data.next === "null" ? null : res.data.next,
          previous: res.data.previous === "null" ? null : res.data.previous,
        };
        setPopularRecipePaginationUrls(new_pagination_urls);

        setPopularRecipes(res.data.results);
      })
      .catch(error => console.error(error));
  },
    []);


  useEffect(() => {
    filterRecipes(null);
  }, [searchInputValue, dietFilterValue, cookTimeFilterValue, cuisineFilterValue]);


  const prepareSearchValueForRequest = () => {
    if(searchInputValue){
      return searchInputValue.replace(/^[,\s]+|[,\s]+$/g, '').replace(/\s{2,}/g, ' ').trim().replace(/\s/g, '%20');
    }
    return "";
  }

  const filterRecipes = (pageNumber) => {
    const auth = getAuth();
    let queryParams = "?";

    if(pageNumber){
      queryParams = queryParams.concat(`page=${pageNumber}&`);
    }
    
    if(searchInputValue){
      const search_value = prepareSearchValueForRequest();
      if(search_value){
        queryParams = queryParams.concat(`${searchType}=${search_value}&`);
      } 
    }
    if(dietFilterValue){
      queryParams = queryParams.concat(`diet=${dietFilterValue}&`);
    }
    if(cuisineFilterValue){
      queryParams = queryParams.concat(`cuisine=${cuisineFilterValue}&`);
    }
    if(cookTimeFilterValue){
      queryParams = queryParams.concat(`maxCookTime=${cookTimeFilterValue}`);
    }

    if (!auth) {
      navigate("/account/login");
      return;
    };
    const accessToken = auth.tokens.access;

    axios
      .get(`${apiURL}/recipes/search/${queryParams}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
      .then(res => {
        const new_pagination_urls = {
          next: res.data.next === "null" ? null : res.data.next,
          previous: res.data.previous === "null" ? null : res.data.previous,
        };
  
        setRecipePaginationUrls(new_pagination_urls);
        setRecipes(res.data.results);
      })
      .catch(error => console.error(error));

  }

  const handleCuisineSelect = (eventKey) => {
    setCuisineFilterValue(eventKey);
  }
  const handleDietSelect = (eventKey) => {
    setDietFilterValue(eventKey);
  }
  const handleCookTimeSelect = (eventKey) => {
    setCookTimeFilterValue(eventKey);
  }
  const handleSearchTypeSelect = (eventKey) => {
    setSearchInputValue("");
    setSearchType(eventKey);
  }

  const handleSearchInputChange = (event) => {
    setSearchInputValue(event.target.value);
  }

  const getSearchBarPlaceHolderText = () => {
    switch(searchType){
      case "name":
        return "filter by recipe name"
      case "ingredients":
        return "filter by a comma-seperated list of recipe ingredients"
      case "username":
        return "filter by recipe author usernames"
      default:
        return "invalid filter value"
    }
  }

  const handlePaginationButtonClick = (paginationData, stateUpdateFn, paginationStateUpdateFn, whichButton) => {
    if((whichButton !== "previous" && whichButton !== "next") ||  !paginationData[whichButton]){
      return;
    }
    const auth = getAuth();

    if (!auth) {
      navigate("/account/login");
      return;
    };
    const accessToken = auth.tokens.access;

    axios
      .get(paginationData[whichButton], {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
      .then(res => {
        const new_pagination_urls = {
          next: res.data.next === "null" ? null : res.data.next,
          previous: res.data.previous === "null" ? null : res.data.previous,
        };
        paginationStateUpdateFn(new_pagination_urls);
        stateUpdateFn(res.data.results);
      })
      .catch(error => console.error(error));

  }


  return recipes === null || popularRecipes === null  ? 
  
    (
      <Container className="d-flex justify-content-center mt-5 recipes-home-container">
      <CustomSpinner/>
      </Container>
    )
  
  : (


    <Container className="recipes-home-container">
      <div className="all-recipes">
        <div className="search-bar-filter-container">
          <h1 className="mb-4">All Recipes</h1>
          <div className="d-flex recipe-filter-controls justify-content-start">
            <div id="search-type-dropdown-container">

              <DropdownButton id="search-type-dropdown" title="Search Type" onSelect={handleSearchTypeSelect}>
                <Dropdown.Item eventKey="name" active={searchType == "name"}>Recipe Name</Dropdown.Item>
                <Dropdown.Item eventKey="ingredients" active={searchType == "ingredients"}>Ingredients</Dropdown.Item>
                <Dropdown.Item eventKey="username" active={searchType == "username"}>Username</Dropdown.Item>
              </DropdownButton>
            </div>
            <InputGroup className="mb-3">
              <Form.Control id="recipe-filter-search-bar" type="text" onChange={handleSearchInputChange} value={searchInputValue} placeholder={getSearchBarPlaceHolderText()} aria-label={getSearchBarPlaceHolderText()} />
            </InputGroup>

            <div id="cuisine-dropdown-container">


              <DropdownButton id="cuisine-dropdown" title="Cuisine" onSelect={handleCuisineSelect}>
                {
                  [["No selection", ""], ["Italian", "italian"], ["Greek", "greek"], ["Mexican", "mexican"], ["Chinese", "chinese"], ["Indian", "indian"], ["Japanese", "japanese"], ["Korean", "korean"], ["Thai", "thai"], ["German", "german"]].map(([value, eventKey]) =>
                    <Dropdown.Item eventKey={eventKey} active={cuisineFilterValue === eventKey}>{value}</Dropdown.Item>
                  )
                }

              </DropdownButton>
            </div>

            <div id="diet-dropdown-container">
              <DropdownButton id="diet-dropdown" title="Diet Restriction" onSelect={handleDietSelect}>
                {
                  [["No selection", ""], ["Vegetarian", "vegetarian"], ["Vegan", "vegan"], ["Halal", "halal"], ["Kosher", "kosher"], ["Unrestricted", "unrestricted"]].map(([value, eventKey]) =>
                    <Dropdown.Item eventKey={eventKey} active={dietFilterValue === eventKey}>{value}</Dropdown.Item>
                  )
                }
              </DropdownButton>
            </div>
            <div id="max-cooking-time-dropdown-container">
              <DropdownButton id="cook-time-dropdown" title="Cooking Time" onSelect={handleCookTimeSelect}>
                {
                  [["No selection", ""], ["≤ 10min", "10"], ["≤ 30min", "30"], ["≤ 1h", "60"], ["≤ 1.5h", "90"], ["≤ 2h", "120"]].map(([value, eventKey]) =>
                    <Dropdown.Item eventKey={eventKey} active={cookTimeFilterValue === eventKey}>{value}</Dropdown.Item>
                  )
                }
              </DropdownButton>
            </div>


          </div>

        </div>
        <div className="recipe-list-wrapper">

        
        <div className="recipe-list">
          {
            recipes.length ? recipes.map((recipe, index) =>
              <RecipeCard key={index} recipe={recipe} />
            )
              : "No recipes"

          }
        </div>
        
          <div className="d-flex justify-content-between recipe-pagination-button-container">

          <Button disabled={!recipePaginationUrls.previous} onClick={() => handlePaginationButtonClick(recipePaginationUrls, setRecipes, setRecipePaginationUrls, "previous")}>Previous</Button>
          <Button disabled={!recipePaginationUrls.next} onClick={() => handlePaginationButtonClick(recipePaginationUrls, setRecipes, setRecipePaginationUrls, "next")}>Next</Button>
          </div>
          </div>
      </div>
      <h1 className="mt-5 mb-4">Popular Recipes</h1>
      <div className="popular-recipe-list-wrapper">
      <div className="popular-recipe-list">
          {
            popularRecipes.length ? popularRecipes.map((recipe, index) =>
              <RecipeCard key={index} recipe={recipe} />
            )
              : "No recipes"

          }
        </div>
        <div className="d-flex justify-content-between recipe-pagination-button-container">

          <Button disabled={!popularRecipePaginationUrls.previous} onClick={() => handlePaginationButtonClick(popularRecipePaginationUrls, setPopularRecipes, setPopularRecipePaginationUrls, "previous")}>Previous</Button>
          <Button disabled={!popularRecipePaginationUrls.next} onClick={() => handlePaginationButtonClick(popularRecipePaginationUrls, setPopularRecipes, setPopularRecipePaginationUrls, "next")}>Next</Button>
          </div>
        </div>


    </Container>
  );
};




export default RecipesHome;

