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
import { useContext, useEffect, useState } from "react";
import UserProfile from "./pages/UserProfile";
import toast, { Toaster } from "react-hot-toast";
import Home from "./pages/Home";
import CreatePost from "./components/CreatePost";
import { PostProvider } from "./context/PostContext/PostContext";
import Post from "./components/Post";
import Settings from "./pages/Settings";
import UserPosts from "./components/UserPosts";
import UserSavedPosts from "./components/UserSavedPosts";
import Explore from "./pages/Explore";
import Notfound from "./pages/Notfound";
import OtherUsersProfile from "./pages/OtherUsersProfile";
import UserLikedPosts from "./components/UserLikedPosts";
import FollowersList from "./components/FollowersList";
import FollowingList from "./components/FollowingList";
import Chats from "./pages/Chats";
import { ChatProvider } from "./context/ChatContext/ChatContext";
import Chat from "./components/Chat";

function App() {
  const { currentUser } = useContext(AuthContext);

  const RequireAuth = ({ children }) => {
    return currentUser ? children : <Navigate to="/login" />;
  };
  window.addEventListener("load", function () {
    setTimeout(function () {
      // This hides the address bar:
      window.scrollTo(0, 1);
    }, 0);
  });
  return (
    <>
      <Router>
        <ChatProvider>
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
                  <Route
                    path="/userProfile/yourPosts"
                    element={<UserPosts />}
                  />
                  <Route
                    path="/userProfile/savedPosts"
                    element={<UserSavedPosts />}
                  />
                  <Route
                    path="/userProfile/likedPosts"
                    element={<UserLikedPosts />}
                  />
                  <Route
                    path="/userProfile/:userId?/followers"
                    element={<FollowersList />}
                  />
                  <Route
                    path="/userProfile/:userId?/following"
                    element={<FollowingList />}
                  />
                </Route>
                <Route
                  path="/users/:userId?/profile/"
                  element={<OtherUsersProfile />}
                >
                  <Route path="followers" element={<FollowersList />} />
                  <Route path="following" element={<FollowingList />} />
                </Route>
                <Route path="/userChats" element={<Chats />} />
                <Route path="/userChats/:userId?/messages" element={<Chat />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/posts/:id" element={<Post />} />
                <Route path="/userProfile/settings" element={<Settings />} />
              </Route>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/*" element={<Notfound />} />
            </Routes>
          </PostProvider>
        </ChatProvider>
      </Router>
    </>
  );
}

export default App;
