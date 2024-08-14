import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Main from "./pages/Main";
import Login from "./authentication/Login";
import SignUp from "./authentication/SignUp";
import { AuthContextProvider } from "./context/AuthContext";
import UserProfile from "./pages/UserProfile";
import { Toaster } from "react-hot-toast";
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
import Chat from "./components/Chat";
import Notifications from "./components/Notifications";
import EditUserProfile from "./components/EditUserProfile";
import AccountSettings from "./components/AccountSettings";
import { ThemeProvider } from "./context/Theme/ThemeContext";
import { ChatProvider } from "./context/ChatContext/ChatContext";
import Accessibility from "./components/Accessibility";
import ChatSettings from "./components/ChatSettings";

function App() {
  return (
    <>
      <Router>
        <ThemeProvider>
          <AuthContextProvider>
            <ChatProvider>
              <PostProvider>
                <Toaster position="top-left" />
                <Routes>
                  <Route exact path="/" element={<Main />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/createPost" element={<CreatePost />} />
                    <Route path="/userProfile" element={<UserProfile />}>
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
                      path="/user/:userId?/notifications"
                      element={<Notifications />}
                    />
                    <Route
                      path="/users/:userId?/profile/"
                      element={<OtherUsersProfile />}
                    >
                      <Route path="followers" element={<FollowersList />} />
                      <Route path="following" element={<FollowingList />} />
                    </Route>
                    <Route path="/user/:Id?/chats" element={<Chats />} />
                    <Route path="/chat/:userId?/messages" element={<Chat />} />
                    <Route
                      path="/chat/:chatId?/settings"
                      element={<ChatSettings />}
                    />
                    <Route path="/explore" element={<Explore />} />
                    <Route path="/posts/:id" element={<Post />} />
                    <Route path="/userProfile/settings/" element={<Settings />}>
                      <Route path="edit" element={<EditUserProfile />} />
                      <Route path="account" element={<AccountSettings />} />
                      <Route path="accessibility" element={<Accessibility />} />
                    </Route>
                  </Route>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/*" element={<Notfound />} />
                </Routes>
              </PostProvider>
            </ChatProvider>
          </AuthContextProvider>
        </ThemeProvider>
      </Router>
    </>
  );
}

export default App;
