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
import { PostProvider } from "./context/PostContext/PostContext";
import Post from "./components/Post";
import UserProfileSub from "./components/UserPosts";
import Settings from "./pages/Settings";
import UserPosts from "./components/UserPosts";
import UserSavedPosts from "./components/UserSavedPosts";
import Explore from "./pages/Explore";
import Notfound from "./pages/Notfound";
import OtherUsersProfile from "./pages/OtherUsersProfile";

function App() {
  const { currentUser } = useContext(AuthContext);
  // const currentUser = null
  const RequireAuth = ({ children }) => {
    return currentUser ? children : <Navigate to="/login" />;
  };
  return (
    <>
      <Router>
        <PostProvider>
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
              >
                <Route path="/userProfile/yourPosts" element={<UserPosts />} />
                <Route
                  path="/userProfile/savedPosts"
                  element={<UserSavedPosts />}
                />
                <Route
                  path="/userProfile/likedPosts"
                  element={<UserProfileSub />}
                />
              </Route>
              <Route
                path="/users/:user_name/profile"
                element={<OtherUsersProfile />}
              />
              <Route path="/explore" element={<Explore />} />
              <Route path="/post/:id" element={<Post />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/*" element={<Notfound />} />
          </Routes>
        </PostProvider>
      </Router>
    </>
  );
}

export default App;
