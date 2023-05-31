import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Row, Col, Button, Form, Image, Badge, ListGroup, Carousel, ProgressBar, OverlayTrigger, Tooltip, ToggleButton } from 'react-bootstrap';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup'
import styled from "styled-components";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faHeart, faHeartBroken, faPencil, faShoppingBasket, faThumbsDown, faThumbsUp, faTimes, faTrash, faUtensils } from '@fortawesome/free-solid-svg-icons';
import StarRatings from 'react-star-ratings';
import Slider from 'rc-slider';
import { CustomSpinner } from "../components";
import 'rc-slider/assets/index.css';
import axios from 'axios';
import "../../index.css";
import "./recipeDetails.css";

const apiURL = "http://localhost:8000";

const RecipeDetails = ({ getAuth }) => {
    const navigate = useNavigate();
    let { recipeId } = useParams();
    const [recipeData, setRecipeData] = useState(null);
    const [recipeAuthorDetails, setRecipeAuthorDetails] = useState(null);
    const [displayedStepNumber, setDisplayedStepNumber] = useState(0);
    const [selectedServing, setSelectedServing] = useState("1");
    const [comments, setComments] = useState(null);
    const [commentsPaginationUrls, setCommentsPaginationUrls] = useState(null);
    const [newComment, setNewComment] = useState("");

    useEffect(() => {
        // user is not logged in
        let temp_recipe_id = null;
        if (!getAuth()) {
            navigate("/account/login");
            return;
        };
        axios
            .get(`${apiURL}/recipes/${recipeId}/`, {
                headers: {
                    Authorization: `Bearer ${getAuth().tokens.access}`
                }
            })
            .then(res => {
                setRecipeData(res.data);
                temp_recipe_id = res.data.id;
                if (res.data.steps.length) {
                    setDisplayedStepNumber(1);
                }
                return axios.get(`${apiURL}/accounts/${res.data.user_id}/`, {
                    headers: {
                        Authorization: `Bearer ${getAuth().tokens.access}`
                    }
                });
            })
            .then(res => {
                setRecipeAuthorDetails(res.data);
                return axios.get(`${apiURL}/recipes/${temp_recipe_id}/comments/`, {
                    headers: {
                        Authorization: `Bearer ${getAuth().tokens.access}`
                    }
                });
            })
            .then(res => {
                const new_pagination_urls = {
                    next: res.data.next === "null" ? null : res.data.next,
                    previous: res.data.previous === "null" ? null : res.data.previous,
                };
                setCommentsPaginationUrls(new_pagination_urls);
                setComments(res.data.results);
                return axios.get(`${apiURL}/recipes/${temp_recipe_id}/likes/?user_id=${getAuth().loggedInUserId}`, {
                    headers: {
                        Authorization: `Bearer ${getAuth().tokens.access}`
                    }
                })
            })
            .catch(error => console.log(error));

    }, []);





    const getTimeDisplayText = (num) => {
        if (num < 60) {
            return `${num} mins`
        }
        const hours = Math.floor(num / 60);
        const minutes = num % 60;
        return `${hours} ${hours === 1 ? "Hour" : "Hours"} ${minutes ? `, ${minutes}mins` : ""}`;
    }

    const fileUrlGetFileType = (url) => {
        const videoExtensions = new Set(['mp4', 'avi', 'wmv', 'mov']);
        const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);
        const extension = url.split('.').pop().toLowerCase();
        if (imageExtensions.has(extension)) {
            return 'image';
        } else if (videoExtensions.has(extension)) {
            return 'video';
        }
        return "";
    }

    const handleStepNumberChange = (newStepNumber) => {
        setDisplayedStepNumber(newStepNumber);
    }


    const handleChangeRating = (rating) => {
        if (!recipeData.id) {
            return;
        }

        const request_body = {
            recipe_id: recipeData.id,
            amount: rating

        };
        axios
            .post(`${apiURL}/recipes/ratings/`, request_body, {
                headers: {
                    Authorization: `Bearer ${getAuth().tokens.access}`,
                }
            })
            .then((res) => {
                const updated_recipe_data = {...recipeData};
                updated_recipe_data.rating_given = rating;
                setRecipeData({...updated_recipe_data});
            })
            .catch(err => console.error(err))

    }

    const handleNewCommentChange = (event) => {
        setNewComment(event.target.value);
    }
    const handleNewCommentSubmit = (event) => {
        event.preventDefault();
        event.stopPropagation();

        axios
            .post(`${apiURL}/recipes/comments/`, {
                recipe_id: recipeData.id,
                content: newComment
            }, {
                headers: {
                    Authorization: `Bearer ${getAuth().tokens.access}`,
                }
            })
            .then((res) => {
                return axios.get(`${apiURL}/recipes/${recipeData.id}/comments/`, {
                    headers: {
                        Authorization: `Bearer ${getAuth().tokens.access}`
                    }
                });
            })
            .then((res) => {
                const new_pagination_urls = {
                    next: res.data.next === "null" ? null : res.data.next,
                    previous: res.data.previous === "null" ? null : res.data.previous,
                };
                setCommentsPaginationUrls(new_pagination_urls);
                setComments([...res.data.results]);
            })
            .catch(err => console.error(err.message))
    }

    const handleAddFavourite = () => {
        axios
            .post(`${apiURL}/recipes/favourites/`, { recipe_id: recipeData.id }, {
                headers: {
                    Authorization: `Bearer ${getAuth().tokens.access}`,
                }
            })
            .then((res) => {
                let updated_recipe_data = { ...recipeData };
                updated_recipe_data.is_favourited_by_user = true;
                updated_recipe_data.num_favourites += 1;
                setRecipeData(updated_recipe_data);
            })
            .catch(err => console.error(err))
    }

    const handleAddLike = () => {
        axios
            .post(`${apiURL}/recipes/likes/`, { recipe_id: recipeData.id }, {
                headers: {
                    Authorization: `Bearer ${getAuth().tokens.access}`,
                }
            })
            .then((res) => {
                let updated_recipe_data = { ...recipeData };
                updated_recipe_data.is_liked_by_user = true;
                updated_recipe_data.num_likes += 1;
                setRecipeData(updated_recipe_data);
            })
            .catch(err => console.error(err))
    }
    const handleRemoveFavourite = () => {
        axios
            .delete(`${apiURL}/recipes/favourites/${recipeData.id}/`, {
                headers: {
                    Authorization: `Bearer ${getAuth().tokens.access}`,
                }
            })
            .then((res) => {
                let updated_recipe_data = { ...recipeData };
                updated_recipe_data.is_favourited_by_user = false;
                updated_recipe_data.num_favourites -= 1;
                setRecipeData(updated_recipe_data);
            })
            .catch(err => console.error(err))
    }

    const handleRemoveLike = () => {
        axios
            .delete(`${apiURL}/recipes/likes/${recipeData.id}/`, {
                headers: {
                    Authorization: `Bearer ${getAuth().tokens.access}`,
                }
            })
            .then((res) => {
                let updated_recipe_data = { ...recipeData };
                updated_recipe_data.is_liked_by_user = false;
                updated_recipe_data.num_likes -= 1;
                setRecipeData(updated_recipe_data);
            })
            .catch(err => console.error(err))
    }


    const handleAddToShopppingList = () => {
        axios
            .post(`${apiURL}/recipes/shopping-list/add/`, { id: recipeData.id }, {
                headers: {
                    Authorization: `Bearer ${getAuth().tokens.access}`,
                }
            })
            .then((res) => {
                let updated_recipe_data = { ...recipeData };
                updated_recipe_data.is_in_user_shopping_list = true;
                setRecipeData(updated_recipe_data);
            })
            .catch(err => console.error(err))
    }

    const handleRemoveFromShoppingList = () => {
        axios
            .delete(`${apiURL}/recipes/shopping-list/${recipeData.id}/`, {
                headers: {
                    Authorization: `Bearer ${getAuth().tokens.access}`,
                }
            })
            .then((res) => {
                let updated_recipe_data = { ...recipeData };
                updated_recipe_data.is_in_user_shopping_list = false;
                setRecipeData(updated_recipe_data);
            })
            .catch(err => console.error(err))
    }
    const handleDeleteRecipe = () => {
        axios
            .delete(`${apiURL}/recipes/${recipeData.id}/delete/`, {
                headers: {
                    Authorization: `Bearer ${getAuth().tokens.access}`,
                }
            })
            .then((res) => {
                navigate("/recipes/");
            })
            .catch(err => console.error(err))
    }


    const handlePaginationButtonClick = (paginationData, stateUpdateFn, paginationStateUpdateFn, whichButton) => {
        if ((whichButton !== "previous" && whichButton !== "next") || !paginationData[whichButton]) {
 
            return;
        }

        axios
            .get(paginationData[whichButton], {
                headers: {
                    Authorization: `Bearer ${getAuth().tokens.access}`
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



    return (

        !recipeData || !recipeAuthorDetails || !comments ?
            (
                <Container className="recipe-details d-flex justify-content-center mt-5">
                    <CustomSpinner />
                </Container>
            )
            :
            (
                <Container className="recipe-details align-items-center d-flex flex-column">
                    <h1 className="display-3 mb-4">{recipeData.name || ""}</h1>
                    <StyledCarousel>
                        {

                            Array.from(recipeData.media).map((media, mediaIndex) => {

                                const fileType = fileUrlGetFileType(media.image);
                                const fullUrl = `${apiURL}${media.image}`;
                                if (fileType === "video")
                                    return (
                                        <Carousel.Item key={mediaIndex}>
                                            <video height="300" className="d-block w-100" controls>
                                                <source src={fullUrl} />
                                            </video>
                                        </Carousel.Item>
                                    );

                                return (<Carousel.Item key={mediaIndex}>
                                    <img
                                        height="300"
                                        className="d-block w-100"
                                        src={fullUrl}
                                        alt="First slide"
                                        style={{ objectFit: "cover" }}
                                    />
                                </Carousel.Item>)


                            })


                        }

                    </StyledCarousel>

                    <div className="recipe-info my-3">
                        <a className="recipe-creator-info" onClick={() => navigate(`/accounts/${recipeData.user_id}/`)}>
                            <Image className="profile-pic" src={`${apiURL}${recipeAuthorDetails.profile_picture}`} alt="user profile picture" />
                            <strong>Author:</strong>{recipeAuthorDetails ? recipeAuthorDetails.username : ""}
                        </a>

                        <Form action="#" method="POST" enctype="multipart/form-data">

                            {
                                recipeData.user_id === getAuth().loggedInUserId ?

                                    (<div className="recipe-interaction-container mt-3 d-flex" style={{ gap: "5px" }}>
                                        <Button type="button" onClick={() => navigate(`/recipes/${recipeData.id}/edit`)}><FontAwesomeIcon icon={faPencil} style={{ marginRight: "6px" }} />Edit Recipe</Button>
                                        <Button type="button" onClick={handleDeleteRecipe}><FontAwesomeIcon icon={faTrash} style={{ marginRight: "6px" }} />Delete Recipe</Button>

                                    </div>) :
                                    (
                                        <div className="recipe-interaction-container mt-3 d-flex" style={{ gap: "5px" }}>
                                            {
                                                recipeData.is_favourited_by_user ?
                                                    (<Button type="button" onClick={handleRemoveFavourite}><FontAwesomeIcon icon={faHeartBroken} style={{ marginRight: "6px" }} />  Unfavourite</Button>)
                                                    :
                                                    (<Button type="button" onClick={handleAddFavourite}><FontAwesomeIcon icon={faHeart} style={{ marginRight: "6px" }} />  Favourite</Button>)
                                            }

                                            {
                                                recipeData.is_liked_by_user ?
                                                    (<Button type="button" onClick={handleRemoveLike}><FontAwesomeIcon icon={faTimes} style={{ marginRight: "6px" }} />  Unlike</Button>)
                                                    :
                                                    (<Button type="button" onClick={handleAddLike}><FontAwesomeIcon icon={faThumbsUp} style={{ marginRight: "6px" }} />  Like</Button>)
                                            }
                                            {
                                                recipeData.is_in_user_shopping_list ?
                                                    (<Button type="button" onClick={handleRemoveFromShoppingList}><FontAwesomeIcon icon={faTimes} style={{ marginRight: "6px" }} />  Remove from Shopping List</Button>)
                                                    :
                                                    (<Button type="button" onClick={handleAddToShopppingList}><FontAwesomeIcon icon={faShoppingBasket} style={{ marginRight: "6px" }} />  Add to Shopping List</Button>)
                                            }

                                        </div>
                                    )
                            }

                            <StarRatings
                                rating={recipeData.rating_given === null ? (recipeData.interaction_stats.avg_rating || 0) : recipeData.rating_given}
                                starRatedColor="var(--easy-chef-brown)"
                                starDimension="22px"
                                starSpacing="2px"
                                starHoverColor="#a05f24cc"
                                changeRating={recipeAuthorDetails.id === getAuth().loggedInUserId ? null : handleChangeRating}
                                numberOfStars={5}
                                name='rating'
                            />
                            <div className="mt-3 d-flex flex-column" style={{ gap: "2px" }}>
                                <div>{`${recipeData.num_likes} like${recipeData.num_likes === 1 ? '' : 's'}.`}</div>
                                <div>{`${recipeData.num_favourites} favourite${recipeData.num_favourites === 1 ? '' : 's'}.`}</div>
                            </div>

                        </Form>

                        <hr />
                        <div className="d-flex mb-2" style={{ gap: "10px" }}>

                            <Badge><FontAwesomeIcon icon={faClock} style={{ marginRight: "6px" }} />  Cook time: {getTimeDisplayText(recipeData.cook_time_minutes)}</Badge>
                            <Badge><FontAwesomeIcon icon={faClock} style={{ marginRight: "6px" }} />  Prep time: {getTimeDisplayText(recipeData.prep_time_minutes)}</Badge>
                        </div>
                        <p className="card-text">{recipeData.description}</p>
                        <hr />

                        <h4>Ingredients</h4>
                        <ToggleButtonGroup
                            type="radio"
                            name="options"
                            value={selectedServing}
                            className="mb-3 btn-group btn-group-toggle num-servings-toggle"
                        >
                            <ToggleButton className="serving-toggle" value="1" onClick={() => setSelectedServing("1")} variant="light">
                                1 Serving
                            </ToggleButton>
                            <ToggleButton className="serving-toggle" value="2" onClick={() => setSelectedServing("2")} variant="light">
                                2 Servings
                            </ToggleButton>
                        </ToggleButtonGroup>
                        <ListGroup>
                            {
                                recipeData.ingredients.map((ingredient, index) =>
                                    <ListGroup.Item key={index}>{`${selectedServing === '1' ? ingredient.quantity_serving_one : ingredient.quantity_serving_two}${ingredient.quantity_units} ${ingredient.name}`}</ListGroup.Item>
                                )
                            }
                        </ListGroup>

                        <hr />

                        <h4>Instructions</h4>
                        <p>Instructions</p>
                        <Row className="recipe-instructions d-flex flex-column">
                            <Col className="d-flex flex-row" style={{ gap: '30px' }}>

                                {

                                    recipeData.steps[displayedStepNumber - 1].media.length ?
                                        (
                                            <StyledCarousel controls={recipeData.steps[displayedStepNumber - 1].media.length > 1}>
                                                {

                                                    Array.from(recipeData.steps[displayedStepNumber - 1].media).map((media, index) => {

                                                        const fileType = fileUrlGetFileType(media.image);
                                                        const fullUrl = `${apiURL}${media.image}`;
                                                        if (fileType === "video") {
                                                            return (
                                                                <Carousel.Item key={index}>
                                                                    <video height="300" className="d-block w-100" controls>
                                                                        <source src={fullUrl} />
                                                                    </video>
                                                                </Carousel.Item>

                                                            )
                                                        }

                                                        return (

                                                            <Carousel.Item key={index}>
                                                                <img
                                                                    height="300"
                                                                    className="d-block w-100"
                                                                    src={fullUrl}
                                                                    alt="First slide"
                                                                    style={{ objectFit: "cover" }}
                                                                />

                                                            </Carousel.Item>
                                                        )


                                                    })

                                                }
                                            </StyledCarousel>
                                        )

                                        :
                                        null


                                }


                                <div className="recipe-instructions-text">
                                    <b>{`Prep time: ${getTimeDisplayText(recipeData.steps[displayedStepNumber - 1].prep_time_minutes)}, cook time: ${getTimeDisplayText(recipeData.steps[displayedStepNumber - 1].cook_time_minutes)}`}</b>
                                    <p><b>Instructions:</b> {recipeData.steps[displayedStepNumber - 1].instructions}</p>
                                </div>
                            </Col>
                            <p className="instruction-step-counter">Step {displayedStepNumber}/{recipeData.steps.length}</p>
                            <div className="mb-3 recipe-draggable-progress-bar-container">
                                <Slider
                                    min={1}
                                    max={recipeData.steps.length}
                                    defaultValue={1}
                                    marks={[...Array(recipeData.steps.length)].reduce((acc, curr, i) => {
                                        acc[i + 1] = " ";
                                        return acc;
                                    }, {})}
                                    value={displayedStepNumber}
                                    onChange={handleStepNumberChange}
                                />
                            </div>
                        </Row>
                        <hr />
                        <h3>Comments</h3>
                        <Form>
                            <Form.Group>
                                <Form.Label>Add a new comment:</Form.Label>
                                <Form.Control as="textarea" id="new-comment-input" placeholder="Enter your comment here." onChange={handleNewCommentChange} value={newComment} rows="1" required />
                            </Form.Group>
                            <Button style={{ marginTop: '10px' }} type="submit" disabled={newComment === ""} onClick={handleNewCommentSubmit} className="btn btn-primary">Submit</Button>
                        </Form>
                        <hr />
                        <div className="comments-container">
                            {
                                comments.map((comment, commentIndex) => {
                                    return (
                                        <div className="d-flex align-items-center mt-4" style={{ gap: "20px" }} key={`${commentIndex}`}>
                                            <OverlayTrigger placement="top" overlay={<div style={{ backgroundColor: 'white', border: "1px solid #f2f2f2", padding: "10px", borderRadius: "0.375rem" }}>{comment.user.username}</div>}>
                                                <Image className="profile-pic" src={comment.user.profile_picture} alt="user profile picture" />
                                            </OverlayTrigger>
                                            <div className="comment-text-bubble">{comment.content}</div>
                                        </div>)
                                })
                            }
                        </div>
                        <div className="mt-3 d-flex justify-content-between recipe-pagination-button-container">

                            <Button disabled={!commentsPaginationUrls.previous} onClick={() => handlePaginationButtonClick(commentsPaginationUrls, setComments, setCommentsPaginationUrls, "previous")}>Previous</Button>
                            <Button disabled={!commentsPaginationUrls.next} onClick={() => handlePaginationButtonClick(commentsPaginationUrls, setComments, setCommentsPaginationUrls, "next")}>Next</Button>
                        </div>
                        <hr />

                    </div>
                </Container >)

    );
};

const StyledCarousel = styled(Carousel)`
width:900px;
height:300px;
margin: auto;
`;


export default RecipeDetails;

