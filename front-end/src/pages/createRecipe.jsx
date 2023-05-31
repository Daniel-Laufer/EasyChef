import { Container, Form, Button, ToggleButtonGroup, ToggleButton, Card, Image, Carousel, Row, Col } from 'react-bootstrap';
import React, { useState, useEffect } from "react";
import Spinner from 'react-bootstrap/Spinner';
import * as EmailValidator from 'email-validator';
import styled from "styled-components";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { ReactSearchAutocomplete } from 'react-search-autocomplete'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import "../../index.css";
import "./createRecipe.css";


axios.defaults.headers.post['Content-Type'] = 'application/json';

const apiURL = "http://localhost:8000";

function CreateRecipe({getAuth}) {
    const navigate = useNavigate();
    const allEntires = new Set(["name",  "description", "diet", "cuisine", "cook_time_minutes", "prep_time_minutes"]);
    const requiredEntries = new Set(["name", "description", "diet", "cuisine", "cook_time_minutes", "prep_time_minutes"]);
    const [steps, setSteps] = useState([]);



    /* Ingredient state and associated functions*/
    const [ingredients, setIngredients] = useState([
    ]);

    const [ingredientSearchResults, setIngredientSearchResults] = useState([]);

    const handleAddNewIngredient = () => {
        const newIngredient = {
            "name": "",
            "quantity_serving_one": "",
            "quantity_serving_two": "",
            "quantity_units": "",
            validationErrors: {
                "name": "",
                "quantity_serving_one": "",
                "quantity_serving_two": "",
                "quantity_units": "",
            }
        }
        setIngredients([...ingredients, newIngredient])
    }
    const handleIngredientChange = (event, whichData, ingredientIndex) => {
        const updatedIngredientValidationErrors = {...ingredients[ingredientIndex].validationErrors};
        updatedIngredientValidationErrors[whichData] = ""; 
        const updatedIngredient = { ...ingredients[ingredientIndex], [whichData]: event.target.value, validationErrors: {...updatedIngredientValidationErrors}};
        const updatedIngredientsState = [...ingredients];
        updatedIngredientsState[ingredientIndex] = updatedIngredient;
        setIngredients(updatedIngredientsState);
    }
    const handleIngredientDelete = (event, ingredientIndex) => {
        const updatedIngredientsState = [...ingredients];
        updatedIngredientsState.splice(ingredientIndex, 1);
        setIngredients(updatedIngredientsState);
    }

    const handleOnIngredientSearch = (string, results, ingredientIndex) => {
        const updatedIngredients = [...ingredients];
        const updatedIngredient = updatedIngredients[ingredientIndex];
        updatedIngredient.validationErrors.name = "";
        updatedIngredient.name = string;
        setIngredients([...updatedIngredients]);

        const auth = getAuth();
        if (!auth) return;
        const accessToken = auth.tokens.access;

        axios
            .get(`${apiURL}/recipes/ingredients/search/?q=${string}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })
            .then(res => {
                const newResults = [];
                res.data.slice(0, 5).map((item, index) => {
                    newResults.push({ id: index.toString(), name: item })
                });
                setIngredientSearchResults(newResults);
            })
            .catch(error => console.error(error));
    };

    const handleIngredientSelectSearchResult = (result, ingredientIndex) => {
        const updatedIngredient = ingredients[ingredientIndex];
        const updatedIngredients = [...ingredients];
        updatedIngredient.name = result.name;
        updatedIngredients[ingredientIndex] = updatedIngredient;
        setIngredients([...updatedIngredients])
    }


    const [formData, setFormData] = useState({
        name: "",
        description: "",
        cook_time_minutes: "",
        prep_time_minutes: "",
        cuisine: "",
        diet: "",
    });


    const [validationErrors, setValidationErrors] = useState({
        name: "",
        description: "",
        cook_time_minutes: "",
        prep_time_minutes: "",
        cuisine: "",
        diet: "",
        media: ""
    });



    const handleAddNewStep = () => {
        const newStep = {
            "instructions": "",
            "cookTimeMinutes": 5,
            "prepTimeMinutes": 5,
            "media": null,
            "validationErrors": {
                "instructions": "",
                "cookTimeMinutes": "",
                "prepTimeMinutes": "",
                "media":""
            }
        }
        setSteps([...steps, newStep])
    }

    const [backEndErrorMessage, setBackEndErrorMessage] = useState("");
    const [waitingForNetworkResponse, setWaitingForNetworkResponse] = useState(false);
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [recipeMediaFiles, setRecipeMediaFiles] = useState(null);


    const handleRecipeMediaFilesChange = (event) => {
        const updatedValidationErrors = {...validationErrors};
        updatedValidationErrors.media = "";
        setValidationErrors(updatedValidationErrors);
        setRecipeMediaFiles(event.target.files)
    }

    const handleStepChange = (event, whichData, stepIndex) => {
        const updatedStep = { ...steps[stepIndex], [whichData]: event.target.value };
        const updatedStepsState = [...steps];
        updatedStepsState[stepIndex] = updatedStep;
        setSteps(updatedStepsState);
    }
    const handleStepMediaFilesChange = (event, stepIndex) => {
        const updatedStep = { ...steps[stepIndex], "media": event.target.files };
        const updatedStepsState = [...steps];
        updatedStepsState[stepIndex] = updatedStep;
        setSteps(updatedStepsState);
    }
    const handleStepDelete = (event, stepIndex) => {
        const updatedStepsState = [...steps];
        updatedStepsState.splice(stepIndex, 1);
        
        setSteps(updatedStepsState);
    }

    const handleChange = (event, whichData) => {
        if (!allEntires.has(whichData)) {
            return;
        }
        setValidationErrors({...validationErrors, [whichData]: ""})
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

    const validateStepData = () => {
        let at_least_one_invalid = false;
        const updatedSteps = [];
        steps.forEach((step, index) => {
            const updatedStep = {...step};
            if(!step.instructions){
                updatedStep.validationErrors.instructions = "This field cannot be left blank";
                at_least_one_invalid = true;
            }
            if (!step.cookTimeMinutes || isNaN(step.cookTimeMinutes)) {
                updatedStep.validationErrors.cookTimeMinutes = "Please enter the total amount of cook time in minutes (positive integer).";
                at_least_one_invalid = true;
            }
            else if(!isNaN(!step.cookTimeMinutes) && parseInt(step.cookTimeMinutes) > 480){
                updatedStep.validationErrors.cookTimeMinutes = "Please enter a valid number of cook time minutes (maximum 480 minutes)";
                at_least_one_invalid = true;
            }

            if (!step.prepTimeMinutes || isNaN(step.prepTimeMinutes)) {
                updatedStep.validationErrors.prepTimeMinutes = "Please enter the total amount of prep time in minutes (positive integer).";
                at_least_one_invalid = true;
            }
            else if(!isNaN(!step.prepTimeMinutes) && parseInt(step.prepTimeMinutes) > 480){
                updatedStep.validationErrors.prepTimeMinutes = "Please enter a valid number of prep time minutes (maximum 480 minutes)";
                at_least_one_invalid = true;
            }
            updatedSteps.push(updatedStep);

        });
        setSteps([...updatedSteps])
        
        return at_least_one_invalid;
    }
    const validateIngredientData = () => {
        let at_least_one_invalid = false;
        const updatedIngredientsState = [];
        ingredients.forEach((ingredient, index) => {
            const updatedIngredient = {...ingredient};
            if(!ingredient.name){
                updatedIngredient.validationErrors.name = "The ingredient name field cannot be left blank.";
                at_least_one_invalid = true;
            }
            if(ingredient.quantity_units && ingredient.quantity_units.length > 4){
                updatedIngredient.validationErrors.quantity_units = "This field must be at most four characters. Example: g, kg, oz";
                at_least_one_invalid = true;
            }

            if (!ingredient.quantity_serving_one || isNaN(ingredient.quantity_serving_one)) {
                updatedIngredient.validationErrors.quantity_serving_one = "Please enter the quantity of this ingredient needed for one serving (positive integer).";
                at_least_one_invalid = true;
            }
            if (!ingredient.quantity_serving_two || isNaN(ingredient.quantity_serving_two)) {
                updatedIngredient.validationErrors.quantity_serving_two = "Please enter the quantity of this ingredient needed for two servings (positive integer).";
                at_least_one_invalid = true;
            }

            
            updatedIngredientsState.push(updatedIngredient);

        });
        setIngredients([...updatedIngredientsState])
        
        return at_least_one_invalid;
    }

    const prepareStepsData = () => {
        const all_steps = [];
        steps.forEach((step, index) => {
            const step_obj = {};
            step_obj.instructions = step.instructions;
            step_obj.cook_time_minutes = step.cookTimeMinutes;
            step_obj.prep_time_minutes = step.prepTimeMinutes;    
            step_obj.step_number = index;
            all_steps.push(step_obj);
        })
        return all_steps;
    }
    const prepareIngredientData = () => {
        const all_ingredients = [];
        ingredients.forEach((ingredient) => {
            const ingredient_obj= {};
            ingredient_obj.name = ingredient.name;
            ingredient_obj.quantity_serving_one = ingredient.quantity_serving_one;
            ingredient_obj.quantity_serving_two = ingredient.quantity_serving_two;
            ingredient_obj.quantity_units = ingredient.quantity_units;
            all_ingredients.push(ingredient_obj);
        }); 

        return all_ingredients;
    }

    const handleSubmit = (event) => {
        const auth = getAuth();
        if (!auth) return;
        const accessToken = auth.tokens.access;
        
        const form = event.currentTarget;
        event.preventDefault();
        event.stopPropagation();

        const updatedValidationErrors = { ...validationErrors };

        if (!formData.name) {
            updatedValidationErrors.name = "Please enter a recipe name.";
        }
        if (!formData.description) {
            updatedValidationErrors.description = "Please enter a description.";
        }
        if (!formData.cook_time_minutes || isNaN(formData.cook_time_minutes)) {
            updatedValidationErrors.cook_time_minutes = "Please enter the total amount of cook time in minutes (positive integer).";
        }
        else if(!isNaN(!formData.cook_time_minutes) && parseInt(formData.cook_time_minutes) > 480){
            updatedValidationErrors.cook_time_minutes = "Please enter a valid number of cook time minutes (maximum 480 minutes)";
        }

        if (!formData.prep_time_minutes || isNaN(formData.prep_time_minutes)) {
            updatedValidationErrors.prep_time_minutes = "Please enter the total amount of prep time in minutes (positive integer).";
        }
        else if(!isNaN(!formData.prep_time_minutes) && parseInt(formData.prep_time_minutes) > 480){
            updatedValidationErrors.prep_time_minutes = "Please enter a valid number of prep time minutes (maximum 480 minutes)";
        }

        if(!recipeMediaFiles){
            updatedValidationErrors.media = "You need to upload at least one image for this recipe";
        }

        setValidationErrors({ ...validationErrors, ...updatedValidationErrors });





        let no_unresolved_validation_errors = !Object.values(updatedValidationErrors).find(val => val !== "");
        const anyStepsInvalid = validateStepData();
        const anyIngredientsInvalid = validateIngredientData();
        if (no_unresolved_validation_errors && !anyStepsInvalid && !anyIngredientsInvalid) {
            setWaitingForNetworkResponse(true);

            const to_submit = {}
            // const ingredientsFormData = convertIngredientsStateToFormData();
            
            to_submit.name = formData.name;
            to_submit.description = formData.description;
            to_submit.cook_time_minutes = formData.cook_time_minutes;
            to_submit.prep_time_minutes = formData.prep_time_minutes;
            to_submit.cuisine = formData.cuisine;
            to_submit.diet = formData.diet;
            to_submit.steps = prepareStepsData();
            to_submit.ingredients = prepareIngredientData();

            axios
                .post(`http://localhost:8000/recipes/create/`, to_submit,{
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                })
                .then((res) => {
                    const created_recipe_id = res.data.recipe_id;
                    const recipe_step_ids = res.data.step_ids;
                    let to_submit =  new FormData();
                    const uploadRequests = [];
                    // upload all the recipeMedia
                    for (let i = 0; i < recipeMediaFiles.length; i++) {
                        const file_form_data = new FormData();
                        file_form_data.append('image', recipeMediaFiles[i]);
                        file_form_data.append('recipe_id', created_recipe_id);
                      
                        const fileUploadRequest = axios.post(`${apiURL}/recipes/media/`, file_form_data, {
                          headers: {
                            'Content-Type': 'multipart/form-data',
                            Authorization: `Bearer ${accessToken}`,
                          }
                        });
                        uploadRequests.push(fileUploadRequest);
                      }
                    // upload all the recipeStepMedia
                    steps.forEach((step, stepIndex) => {
                        let curr_step_id = recipe_step_ids[stepIndex];
                        for (let i = 0; i < step.media.length; i++) {
                            const file = step.media[i];
                            const file_form_data = new FormData();

                            file_form_data.append('image', file);
                            file_form_data.append('recipe_step_id', curr_step_id);
                          
                            const fileUploadRequest = axios.post(`${apiURL}/recipes/media/step/`, file_form_data, {
                              headers: {
                                'Content-Type': 'multipart/form-data',
                                Authorization: `Bearer ${accessToken}`,
                              }
                            });
                            uploadRequests.push(fileUploadRequest);
                          }

                    });
                    Promise.all(uploadRequests);
                })
                .then((results) => {
                    console.log('All files uploaded successfully:', results);
                    navigate("/recipes/");
                  })
                .catch((err) => {
                    if (!err.response) {
                        setBackEndErrorMessage(err.message);
                    }
                    else {
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
        <Container className="create-recipe">
            <h1 className="mb-3">Create a New Recipe</h1>
            <Form noValidate onSubmit={handleSubmit}>

                <Form.Group>
                    <Form.Label htmlFor="edit-name-input">Recipe Name</Form.Label>
                    <Form.Control
                        type="text"
                        id="edit-name-input"
                        placeholder="Mom's Spaghetti"
                        required
                        onChange={(event) => handleChange(event, "name")}
                    />
                </Form.Group>

                <Form.Group className="mt-3">
                    <Form.Label htmlFor="new-recipe-description">
                        Recipe Description
                    </Form.Label>
                    <Form.Control
                        as="textarea"
                        id="new-recipe-description"
                        placeholder="His palms are sweaty, knees weak, arms are heavy..."
                        rows={3}
                        onChange={(event) => handleChange(event, "description")}
                        required
                    />
                </Form.Group>
                <hr />
                <Form.Group>
                    {
                        !ingredients.length ?
                            <>
                                <Form.Label>Ingredients</Form.Label>
                                <p>This recipe currently has no ingredients.</p></>
                            :
                            ingredients.map((ingredient, index) => (
                                <div key={index} className="mt-2">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <Form.Label>Ingredient {index + 1}</Form.Label>
                                        <button id="delete-ingredient-button" className="btn" onClick={(event) => handleIngredientDelete(event, index)}>
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                    </div>
                                    <Form.Group as={Row} className="mb-3 mt-3">
                                        <Col ssm={4}>
                                            <ReactSearchAutocomplete
                                                items={ingredientSearchResults}
                                                onSearch={(string, results) => handleOnIngredientSearch(string, results, index)}
                                                onSelect={(result) => handleIngredientSelectSearchResult(result, index)}
                                                clearIcon={false}
                                                showIcon={false}
                                                inputDebounce={100}
                                                placeholder="Ingredient"
                                                styling={{
                                                    borderRadius: ".375rem",
                                                    borderColor: "#ced4da",
                                                    boxShadow: "none",
                                                    padding: ".375rem .75rem",
                                                    height: "38px",
                                                    zIndex: 9999 - index
                                                }}
                                                containerStyle={{ zIndex: 9999 - index }}
                                            />
                                        </Col>
                                        <Col sm={3}>
                                            <Form.Control type="text" onChange={(event) => handleIngredientChange(event, "quantity_serving_one", index)} placeholder="Quantity (for one serving)" />
                                            
                                        </Col>
                                        <Col sm={3}>
                                            <Form.Control type="text" onChange={(event) => handleIngredientChange(event, "quantity_serving_two", index)} placeholder="Quantity (for two servings)" />

                                        </Col>
                                        <Col sm={2}>
                                            <Form.Control type="text" onChange={(event) => handleIngredientChange(event, "quantity_units", index)} placeholder="Units (ex. 'g', 'kg')" />
                                           
                                        </Col>
                                    </Form.Group>
                                    <ErrorMessage className="mb-2" error={ingredient.validationErrors['name']}>{ingredient.validationErrors.name}</ErrorMessage>
                                    <ErrorMessage className="mb-2" error={ingredient.validationErrors['quantity_serving_one']}>{ingredient.validationErrors.quantity_serving_one}</ErrorMessage>
                                    <ErrorMessage className="mb-2" error={ingredient.validationErrors['quantity_serving_two']}>{ingredient.validationErrors.quantity_serving_two}</ErrorMessage>
                                    <ErrorMessage className="mb-2" error={ingredient.validationErrors['quantity_units']}>{ingredient.validationErrors.quantity_units}</ErrorMessage>
                                </div>


                            ))
                    }
                    <a id="add-ingredient" className="mt-2" onClick={handleAddNewIngredient}>Add Ingredient</a>
                </Form.Group>
                <hr />

                <Form.Group className="mt-3">
                    <Form.Label id="new-recipe-cuisine-type-label" htmlFor="new-recipe-cuisine-type">
                        Cuisine
                    </Form.Label>
                    <Form.Control
                        as="select"
                        id="new-recipe-cuisine-type"
                        onChange={(event) => handleChange(event, "cuisine")}
                        required
                    >
                        <option value="">Choose...</option>
                        <option value="italian">Italian</option>
                        <option value="greek">Greek</option>
                        <option value="mexican">Mexican</option>
                        <option value="chinese">Chinese</option>
                        <option value="indian">Indian</option>
                        <option value="japanese">Japanese</option>
                        <option value="korean">Korean</option>
                        <option value="thai">Thai</option>
                        <option value="german">German</option>
                    </Form.Control>
                </Form.Group>

                <Form.Group className="mt-3">
                    <Form.Label id="new-recipe-diet-type-label" htmlFor="new-recipe-diet-type">
                        Diet Restriction
                    </Form.Label>
                    <Form.Control
                        as="select"
                        id="new-recipe-diet-type"
                        onChange={(event) => handleChange(event, "diet")}
                        required
                    >
                        <option value="">Choose...</option>
                        <option value="vegetarian">Vegetarian</option>
                        <option value="vegan">Vegan</option>
                        <option value="halal">Halal</option>
                        <option value="kosher">Kosher</option>
                        <option value="unrestricted">Unrestricted</option>
                    </Form.Control>
                </Form.Group>
                <Form.Group className="mt-3">
                                    <Form.Label>Cook time (minutes)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={formData.cook_time_minutes}
                                        onChange={(event) => handleChange(event, "cook_time_minutes")}
                                    />
                                </Form.Group>
                                <ErrorMessage className="mt-1" error={validationErrors['cook_time_minutes']}>{validationErrors.cook_time_minutes}</ErrorMessage>
                <Form.Group className="mt-3">
                                    <Form.Label>Prep time (minutes)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={formData.prep_time_minutes}
                                        onChange={(event) => handleChange(event, "prep_time_minutes")}
                                    />
                                </Form.Group>
                                <ErrorMessage className="mt-1" error={validationErrors['prep_time_minutes']}>{validationErrors.prep_time_minutes}</ErrorMessage>

                <Form.Group controlId="profile-picture-file-input" className="mb-3 mt-3">
                    <div>

                        <Form.Label style={{ marginRight: '10px' }}>  Recipe Media</Form.Label>
                        <Form.Control type="file" multiple onChange={handleRecipeMediaFilesChange} />
                        <ErrorMessage className="mt-1" error={validationErrors['media']}>{validationErrors.media}</ErrorMessage>

                    </div>
                    {
                        recipeMediaFiles ?

                            <div className="mt-1">
                                <p>Preview:</p>
                                <StyledCarousel interval={null}>
                                    {
                                        Array.from(recipeMediaFiles).map((file, fileIndex) => {
                                            const fileUrl = URL.createObjectURL(file);
                                            const fileType = file.type.split('/')[0];
                                            if (fileType === 'image') {
                                                return (
                                                    <Carousel.Item key={fileIndex}>
                                                        <img
                                                            height="300"
                                                            className="d-block w-100"
                                                            src={fileUrl}
                                                            alt="First slide"
                                                        />
                                                    </Carousel.Item>
                                                )
                                            }
                                            else if (fileType == 'video') {
                                                const videoFormat = file.type.split('/')[1];;
                                                return (
                                                    <Carousel.Item key={fileIndex}>
                                                        <video height="300" className="d-block w-100" controls>
                                                            <source src={fileUrl} type={`video/${videoFormat}`} />
                                                        </video>
                                                    </Carousel.Item>
                                                );
                                            }
                                            else {
                                                return <p>Error displaying media.</p>
                                            }
                                        })
                                    }

                                </StyledCarousel>
                            </div>


                            :
                            null
                    }
                    <ErrorMessage error={validationErrors['uploadedImageUrl']}>{validationErrors.uploadedImageUrl}</ErrorMessage>
                </Form.Group>


                <hr />
                {
                    !steps.length ?
                    <>
                    <Form.Label>  Steps</Form.Label>
                    <p>This recipe currently has no steps.</p>
                    </>
                        :
                        steps.map((step, index) => (
                            <div key={index} className="mt-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <Form.Label>  Step {index + 1}</Form.Label>
                                    <button id="delete-step-button" className="btn" onClick={(event) => handleStepDelete(event, index)}>
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </div>
                                <Form.Group >
                                    <Form.Label>Instructions</Form.Label>
                                    <Form.Control onChange={(event) => handleStepChange(event, "instructions", index)} value={step.instructions} type="text" placeholder="Instructions" required />
                                    <ErrorMessage className="mb-2" error={step.validationErrors['instructions']}>{step.validationErrors.instructions}</ErrorMessage>
                                </Form.Group>
                                <Form.Group >
                                    <Form.Label>Cook time (minutes)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={step.cookTimeMinutes}
                                        onChange={(event) => handleStepChange(event, "cookTimeMinutes", index)}
                                    />
                                     <ErrorMessage className="mb-2" error={step.validationErrors['cookTimeMinutes']}>{step.validationErrors.cookTimeMinutes}</ErrorMessage>
                                </Form.Group>
                                <Form.Group >
                                    <Form.Label>Prep time (minutes)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={step.prepTimeMinutes}
                                        onChange={(event) => handleStepChange(event, "prepTimeMinutes", index)}
                                    />
                                     <ErrorMessage className="mb-2" error={step.validationErrors['prepTimeMinutes']}>{step.validationErrors.prepTimeMinutes}</ErrorMessage>
                                </Form.Group>
                                <Form.Group controlId="step-media-upload-container" className="mb-3 mt-2">
                                    <div>
                                        <Form.Label style={{ marginRight: '10px' }}>  (Optional) Recipe Step Media </Form.Label>
                                        <Form.Control type="file" multiple onChange={(event) => handleStepMediaFilesChange(event, index)} />
                                    </div>
                                    {
                                        step.media ?

                                            <div className="mt-1">
                                                <p>Preview:</p>
                                                <StyledCarousel interval={null}>
                                                    {
                                                        Array.from(step.media).map((file, fileIndex) => {
                                                            const fileUrl = URL.createObjectURL(file);
                                                            const fileType = file.type.split('/')[0];
                                                            if (fileType === 'image') {
                                                                return (
                                                                    <Carousel.Item key={fileIndex}>
                                                                        <img
                                                                            height="300"
                                                                            className="d-block w-100"
                                                                            src={fileUrl}
                                                                            alt="First slide"
                                                                        />
                                                                    </Carousel.Item>
                                                                )
                                                            }
                                                            else if (fileType == 'video') {
                                                                const videoFormat = file.type.split('/')[1];;
                                                                return (
                                                                    <Carousel.Item key={fileIndex}>
                                                                        <video height="300" className="d-block w-100" controls>
                                                                            <source src={fileUrl} type={`video/${videoFormat}`} />
                                                                        </video>
                                                                    </Carousel.Item>
                                                                );
                                                            }
                                                            else {
                                                                return <p>Error displaying media.</p>
                                                            }
                                                        })
                                                    }

                                                </StyledCarousel>
                                            </div>


                                            :
                                            null
                                    }
                                    <ErrorMessage error={validationErrors['uploadedImageUrl']}>{validationErrors.uploadedImageUrl}</ErrorMessage>
                                </Form.Group>
                            </div>


                        ))
                }
                <a id="add-instruction-step" className="mt-2" onClick={handleAddNewStep}>Add Step</a>

                <hr />
                <div className="d-flex flex-wrap mt-3" style={{ gap: '10px' }}>
                    <Button disabled={waitingForNetworkResponse} type="submit">
                        Create Recipe
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

const StyledCarousel = styled(Carousel)`
width:900px;
height:300px;
margin: auto;
`;
const ErrorMessage = styled.div`
    display: ${(props) => props.error ? 'block' : 'none'} !important;
    color: red;
`;

export default CreateRecipe;