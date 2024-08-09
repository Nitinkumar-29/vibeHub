import React, { useContext, useEffect, useState } from "react";
import { FaHome, FaPlusCircle, FaUser } from "react-icons/fa";
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import PostContext from "../context/PostContext/PostContext";
import { MdDarkMode, MdOutlineExplore } from "react-icons/md";
import ThemeContext from "../context/Theme/ThemeContext";
import "../styles/overflow_scroll.css";

import { AiFillMessage } from "react-icons/ai";

const Main = () => {
  const { postLoading } = useContext(PostContext);
  const location = useLocation();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [loggedInUserData, setLoggedInUserData] = useState({});
  const navigate = useNavigate();
  const { userId } = useParams();
  const currentUser = localStorage.getItem("currentUser");
  const handleFetchUserData = async () => {
    if (currentUser) {
      try {
        const docRef = doc(db, "users", currentUser);
        const docSnap = await getDoc(docRef);
        const docSnapShot = docSnap.exists ? docSnap.data() : {};
        setLoggedInUserData(docSnapShot);
        console.log(docSnapShot);
        
        console.log(loggedInUserData);
      } catch (error) {
        console.error(error);
        if (error.code === "resource-exhausted") {
          console.error("Quota exceeded. Please try again later.");
        }
      }
    }
  };
  useEffect(() => {
    currentUser && handleFetchUserData();
    // eslint-disable-next-line
  }, [currentUser]);

  useEffect(() => {
    if (
      location.pathname === "/userProfile" ||
      location.pathname === "/userProfile/"
    ) {
      navigate("/userProfile/yourPosts");
    }
    // eslint-disable-next-line
  }, [location.pathname === "/userProfile"]);

  return (
    <div
      className={`relative w-full max-w-[430px] h-screen ${
        theme === "dark" ? "bg-black text-white" : "bg-white text-black"
      } backdrop-blur-3xl `}
    >
      <div
        className={`w-full h-[92vh] overflow-y-auto hideScrollbar
        `}
      >
        <Outlet />
      </div>
      {!(
        location.pathname === "/userChats/" ||
        location.pathname === "/userChats" ||
        location.pathname === `/chat/${userId}/messages`
      ) && (
        <div
          className={`flex z-10 fixed bottom-0 ${
            location.pathname === "/userChats/" ||
            location.pathname === "/userChats" ||
            location.pathname === `/userChats/${userId}/messages`
              ? "hidden"
              : "flex"
          } justify-between items-center px-4 pt-2 pb-6 w-full max-w-[430px] ${
            theme === "dark" ? "bg-black" : "bg-white"
          } bg-opacity-80 backdrop-blur-3xl border-gray-900 border-t-[.5px]`}
        >
          <Link className="flex flex-col items-center" to="/">
            <FaHome
              onClick={() => {
                if (location.pathname === "/") {
                  window.scrollTo(0, 0);
                }
              }}
              size={25}
            />
          </Link>
          <Link
            to="/explore"
            onClick={() => {
              window.scrollTo(0, 0);
            }}
          >
            <MdOutlineExplore size={28} />
          </Link>
          <Link
            to="/createPost"
            onClick={() => {
              window.scrollTo(0, 0);
            }}
          >
            <FaPlusCircle size={25} />
          </Link>
          <Link
            to={`/user/${currentUser}/chats`}
            onClick={() => {
              window.scrollTo(0, 0);
            }}
          >
            <AiFillMessage size={25} />
          </Link>
          <Link
            to="/userProfile/yourPosts"
            onClick={() => {
              window.scrollTo(0, 0);
            }}
          >
            {loggedInUserData?.img ? (
              <img
                src={loggedInUserData?.img}
                className="h-7 w-7 rounded-full object-cover"
                alt=""
              />
            ) : (
              <FaUser size={25} />
            )}
          </Link>
        </div>
      )}
    </div>
  );
};

export default Main;
