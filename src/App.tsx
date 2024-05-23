import React from "react";
import HomePage from "./Pages/HomePage";
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import CanvasPage from "./Pages/CanvasPage";
import Login from "./Pages/Login";
import SignUp from "./Pages/SignUp";
import DatasetPage from "./Pages/DatasetPage";

function App() {

    return (
        <Router>
            <Routes>
                <Route path="" element={<Login/>}/>
                <Route path="/login" element={ <Login />}/>
                <Route path="/signup" element={ <SignUp />}/>
                <Route path="/home" element={ <HomePage/>}/>
                <Route path='/canvas' element={<CanvasPage/>}/>
                <Route path='/dataset' element={<DatasetPage/>}/>
            </Routes>
        </Router>
    );
}

export default App;
