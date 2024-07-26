import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  redirect,
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
import ThemeContext, { ThemeProvider } from "./context/Theme/ThemeContext";
import FollowersList from "./components/FollowersList";
import FollowingList from "./components/FollowingList";
import Chats from "./pages/Chats";
import { ChatProvider } from "./context/ChatContext/ChatContext";
import Chat from "./components/Chat";

function App() {
  const { currentUser } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [toastId, setToastId] = useState(null);
  // const currentUser = null
  const RequireAuth = ({ children }) => {
    return currentUser ? children : <Navigate to="/login" />;
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show the install promotion toast
      if (!toastId) {
        showInstallPromotion();
      }
    };

    const showInstallPromotion = () => {
      const id = toast(
        () => (
          <div className="flex space-x-2 w-full">
            <button
              className="text-blue-600"
              onClick={() => {
                hideInstallPromotion();
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                  if (choiceResult.outcome === "accepted") {
                    console.log("User accepted the install prompt");
                  } else {
                    console.log("User dismissed the install prompt");
                  }
                  setDeferredPrompt(null);
                });
              }}
            >
              Install App
            </button>
            <button
              className="bg-gray-200 border-[1px] rounded-md p-2"
              onClick={() => hideInstallPromotion()}
            >
              Dismiss
            </button>
          </div>
        ),
        { duration: Infinity }
      );
      setToastId(id);
    };

    const hideInstallPromotion = () => {
      toast.dismiss(toastId);
      setToastId(null); // Reset the toastId after dismissal
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, [deferredPrompt, toastId]);

  // Service worker registration
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            console.log(
              "ServiceWorker registration successful with scope: ",
              registration.scope
            );
          })
          .catch((error) => {
            console.log("ServiceWorker registration failed: ", error);
          });
      });
    }
  }, []);

  useEffect(() => {
    // Request full-screen mode when the component mounts
    const requestFullScreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.log("Error attempting to enable full-screen mode:", err);
        });
      }
    };

    requestFullScreen();
  }, []);

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
