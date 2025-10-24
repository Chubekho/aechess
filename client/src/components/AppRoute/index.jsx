import { BrowserRouter as Router, Routes, Route } from "react-router";
import DefaultLayout from "../../layouts/DefaultLayout";
import Lobby from "../../pages/Lobby/Index";
import GamePage from "../../pages/GamePage";
import PlayAI from "../../pages/PlayAI";

function AppRoute() {
    return (
       <Router>
            <Routes>
                <Route element={<DefaultLayout/>}>
                    <Route index element={<Lobby/>}/>
                    <Route path="/play/ai" element={<PlayAI/>}/>
                </Route>
            </Routes>
       </Router>
    )
}

export default AppRoute;