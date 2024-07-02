import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Main from "./pages/Main";
import Login from "./authentication/Login";
import SignUp from "./authentication/SignUp";
import { AuthContext } from "./context/AuthContext";
import { useContext } from "react";
import UserProfile from "./pages/UserProfile";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Home";
import CreatePost from "./components/CreatePost";

function App() {
  const { currentUser } = useContext(AuthContext);
  // const currentUser = null
  const RequireAuth = ({ children }) => {
    return currentUser ? children : <Navigate to="/login" />;
  };
  return (
    <>
      <Router>
        <Toaster position="top-left" />
        <Routes>
          <Route
            exact
            path="/"
            element={
              <RequireAuth>
                <Main />
              </RequireAuth>
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/createPost" element={<CreatePost />} />
            <Route
              path="/userProfile"
              element={
                <RequireAuth>
                  <UserProfile />
                </RequireAuth>
              }
            />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
