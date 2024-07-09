import React, { useContext, useEffect, useState } from "react";
import {
  FaHome,
  FaPlusCircle,
  FaToggleOn,
  FaUser,
  FaWpexplorer,
} from "react-icons/fa";
import { Link, Outlet, useLocation } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import PostContext from "../context/PostContext/PostContext";
import { FiSettings } from "react-icons/fi";
import { MdDarkMode, MdOutlineExplore } from "react-icons/md";
import ThemeContext from "../context/Theme/ThemeContext";
import { IoSunnyOutline } from "react-icons/io5";
import { RxSwitch } from "react-icons/rx";

const Home = () => {
  const { posts, currentUser, postLoading } = useContext(PostContext);
  const location = useLocation();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [loggedInUserData, setLoggedInUserData] = useState({});
  const handleFetchUserData = async () => {
    if (currentUser && currentUser.email) {
      const q = query(
        collection(db, "users"),
        where("email", "==", currentUser.email)
      );
      const querySnapshot = await getDocs(q);
      console.log(querySnapshot);
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        console.log({ userData, uid: currentUser.uid });
        setLoggedInUserData(userData, currentUser.uid);
      });
    }
  };
  useEffect(() => {
    currentUser.uid && handleFetchUserData();
    // eslint-disable-next-line
  }, [currentUser.uid]);

  const [position, setPosition] = useState("static");
  const [lastScrollY, setLastScrollY] = useState(0);

  const handlePosition = () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY < lastScrollY) {
      // Scrolling down
      setPosition("fixed");
    } else {
      // Scrolling up
      setPosition("static");
    }

    setLastScrollY(currentScrollY);
  };

  useEffect(() => {
    window.addEventListener("scroll", handlePosition);

    return () => {
      window.removeEventListener("scroll", handlePosition);
    };
    // eslint-disable-next-line
  }, [lastScrollY]);
  return (
    <div
      className={`relative w-full max-w-[430px] h-fit ${
        theme === "dark"
          ? "bg-zinc-950 text-white"
          : "bg-gradient-to-t from-violet-50 via-green-50 to-red-50 text-black"
      }`}
    >
      <div
        className={`z-20 ${position} ${
          position === "fixed" ? "top-0" : ""
        } transition-all duration-300 ease-in-out transform ${
          position === "fixed"
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-80"
        } h-14 flex ${
          theme === "dark" ? "" : ""
        } justify-between items-center bg-zinc-950 bg-opacity-60 p-4 w-full max-w-[430px] backdrop-blur-3xl`}
      >
        <Link to="/">
          <img
            src={`/images/logo.png`}
            className="h-10 w-10 rounded-md"
            alt=""
          />
        </Link>
        {location.pathname === "/" && <span>Posts: {posts?.length}</span>}
        {location.pathname === "/createPost" && (
          <span>Share your thoughts</span>
        )}
        <button
          onClick={toggleTheme}
          className={`relative flex items-center p-2 rounded-md border-[1px] ${
            theme === "dark" ? "border-zinc-300" : "border-zinc-950"
          }`}
        >
          <IoSunnyOutline
            className={`${theme === "dark" ? "hidden" : "flex"}`}
            size={25}
          />
          <MdDarkMode
            className={`${theme === "light" ? "hidden" : "flex"}`}
            size={25}
          />
        </button>
        {location.pathname === "/explore" && <span>Explore</span>}
        {location.pathname === "/userProfile/yourPosts" && (
          <Link to="/userProfile/settings">
            <FiSettings className="cursor-pointer" size={20} />
          </Link>
        )}
        {location.pathname === "/userProfile/settings" && <span>Settings</span>}
      </div>
      <div
        className={`w-full ${postLoading ? "h-screen" : "h-full"} 
        pt-12 `}
      >
        <Outlet />
      </div>
      <div
        className={`z-10 ${position} bottom-0 h-12 flex justify-between items-center p-4 w-full max-w-[430px] ${
          theme === "dark"
            ? "bg-zinc-950"
            : "bg-gradient-to-tr from-violet-50 via-green-50 to-red-50"
        } bg-opacity-60 backdrop-blur-3xl `}
      >
        <span>
          <Link to="/">
            <FaHome size={25} />
          </Link>
        </span>
        <span>
          <Link
            to="/explore"
            onClick={() => {
              window.scrollTo(0, 0);
            }}
          >
            <MdOutlineExplore size={25} />
          </Link>
        </span>
        <span>
          <Link
            to="/createPost"
            onClick={() => {
              window.scrollTo(0, 0);
            }}
          >
            <FaPlusCircle size={25} />
          </Link>
        </span>
        <span>
          <Link
            to="/userProfile/yourPosts"
            onClick={() => {
              window.scrollTo(0, 0);
            }}
          >
            {loggedInUserData.img ? (
              <img
                src={loggedInUserData?.img}
                className="h-8 w-8 rounded-full"
                alt=""
              />
            ) : (
              <FaUser size={25} />
            )}
          </Link>
        </span>
      </div>
    </div>
  );
};

export default Home;
