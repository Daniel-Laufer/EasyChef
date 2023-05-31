import React, { useEffect } from "react";
import { Container, Row, Col, Button, Card, ToggleButton } from "react-bootstrap";
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup'
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faUtensils } from '@fortawesome/free-solid-svg-icons';
import StarRatings from 'react-star-ratings';
import "../../index.css";
import "./recipeCard.css";

const apiURL = "http://localhost:8000";

const RecipeCard = ({ getAuth, recipe, selectedServing, handleServingUpdate }) => {
  const navigate = useNavigate();

  const getTimeDisplayText = (num) => {
    if (num < 60) {
      return `${num} mins`
    }
    const hours = Math.floor(num / 60);
    const minutes = num % 60;
    return `${hours} ${hours === 1 ? "Hour" : "Hours"} ${minutes ? `, ${minutes}mins` : ""}`;
  }

  const get_image_url = (url) => {
    if (!url.includes(apiURL)) {
      url = apiURL.concat(url);
    }
    return url;
  }

  return (
    <Card className="recipe-card" onClick={() => navigate(`/recipes/${recipe.id}`)}>
      <Card.Img variant="top" style={{ height: "150px", objectFit: "cover" }} src={recipe.media.length ? get_image_url(recipe.media[0].image) : ""} alt="image of dish" />
      <Card.Body>
        <Card.Title>{recipe.name}</Card.Title>
        <Card.Text>
          Juicy plums in balsamic and drizzled them with a chicken pan jus!
          Thyme-roasted potatoes and fresh-picked basil bring this dish
          together for a refined take on chicken thighs!
        </Card.Text>
        <hr className="recipe-card-divider" />
        <div className="recipe-quick-facts">
          <p>
            <FontAwesomeIcon icon={faClock} /> Cook time: {getTimeDisplayText(recipe.cook_time_minutes)}
          </p>
          <p>
            <FontAwesomeIcon icon={faClock} /> Prep time: {getTimeDisplayText(recipe.prep_time_minutes)}
          </p>
          <p className="mt-2 ">
            <FontAwesomeIcon icon={faUtensils} /> Servings: 1 or 2
          </p>
          <div className="recipe-star-container">
            <p>Average Rating: </p>
            <StarRatings
              rating={recipe.interaction_stats.avg_rating || 0}
              starRatedColor="var(--easy-chef-brown)"
              starDimension="22px"
              starSpacing="2px"
              //   changeRating={this.changeRating}
              numberOfStars={5}
              name='rating'
            />
          </div>
        </div>
        <Button className="mt-3" variant="primary">
          View Details
        </Button>
        {
          handleServingUpdate && (
            <ToggleButtonGroup
              type="radio"
              name={`${recipe.id}`}
              value={selectedServing}
              className="mt-3 mb-3 btn-group btn-group-toggle num-servings-toggle"
            >
              <ToggleButton className="serving-toggle" value="1" onClick={(event) => {
                event.stopPropagation()
                handleServingUpdate("1", recipe.id)
              }} variant="light">
                1 Serving
              </ToggleButton>
              <ToggleButton className="serving-toggle" value="2" onClick={(event) => {
                event.stopPropagation();
                handleServingUpdate("2", recipe.id)
              }} variant="light">
                2 Servings
              </ToggleButton>
            </ToggleButtonGroup>
          )
        }
      </Card.Body>
    </Card>
  );
};


export default RecipeCard;

