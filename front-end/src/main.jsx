import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import {Landing, Login, Register, CreateRecipe, EditAccount, RecipesHome, RecipeDetails, MyRecipes, ShoppingList} from "./pages"
import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar, Footer } from './components';
import ViewAccount from './pages/viewAccount';



function App() {
  const getAuth = () => {
    if(!localStorage.getItem("auth")){
      return null;
    }
    return JSON.parse(localStorage.getItem('auth'));        
  }
  
  return (
    <BrowserRouter>
        <Navbar/>
       <Routes>
        <Route exact path="/" element={<Landing getLoggedInUserInf={getAuth}/>} />
        <Route path="/account/login" element={<Login getAuth={getAuth}/>} />
        <Route path="/account/register" element={<Register getAuth={getAuth}/>} />
        <Route path="/accounts/:accountId" element={< ViewAccount getAuth={getAuth}/>} />
        <Route path = "/account/edit" element={<EditAccount getAuth={getAuth} />}/>
        <Route path = "/recipes" element={<RecipesHome getAuth={getAuth}/>}/>
        <Route path = "/my-recipes" element={<MyRecipes getAuth={getAuth}/>}/>
        <Route path = "/shopping-list" element={<ShoppingList getAuth={getAuth}/>}/>
        <Route path = "/recipes/:recipeId" element={<RecipeDetails getAuth={getAuth}/>}/>
        <Route path = "/recipes/create" element={<CreateRecipe getAuth={getAuth}/>}/>
        </Routes>
        <Footer/>
    </BrowserRouter>
  )
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);



