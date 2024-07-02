import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./pages/Home";
import Login from "./authentication/Login";
import SignUp from "./authentication/SignUp";
import { AuthContext } from "./context/AuthContext";
import { useContext } from "react";
import UserProfile from "./pages/UserProfile";

function App() {
  const { currentUser } = useContext(AuthContext);
  // const currentUser = null
  const RequireAuth = ({ children }) => {
    return currentUser ? children : <Navigate to="/login" />;
  };
  return (
    <>
      <Router>
        <Routes>
          <Route
            exact
            path="/"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <UserProfile />
              </RequireAuth>
            }
          />
        </Routes>
      </Router>
    </>
  );
}

export default App;
