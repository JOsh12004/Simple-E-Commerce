import { BrowserRouter, Routes, Route } from "react-router-dom";
import Main from "./pages/Main";
import Shoes from "./pages/Shoes";
import Add from "./pages/Add";
import Update from "./pages/Update";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Orders from "./pages/Orders";
import "./style.css";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/"           element={<Main />} />
          <Route path="/item"       element={<Shoes />} />
          <Route path="/add"        element={<Add />} />
          <Route path="/update/:id" element={<Update />} />
          <Route path="/orders"     element={<Orders />} />
          <Route path="/login"      element={<Login />} />
          <Route path="/signup"     element={<Signup />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;