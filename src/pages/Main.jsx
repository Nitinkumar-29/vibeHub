import React, { useContext, useEffect, useState } from "react";
import { FaHome, FaPlusCircle, FaUser } from "react-icons/fa";
import { Link, Outlet, useLocation } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import PostContext from "../context/PostContext/PostContext";
import { FiSettings } from "react-icons/fi";
import { MdDarkMode, MdOutlineExplore } from "react-icons/md";
import ThemeContext from "../context/Theme/ThemeContext";
import { IoSunnyOutline } from "react-icons/io5";

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
      setPosition("sticky");
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
      className={`relative w-full max-w-[430px] h-fit  ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"
      }`}
    >
      <div
        className={`z-20 ${position} top-0 h-14 flex ${
          theme === "dark" ? "bg-gray-900" : "bg-white"
        }  justify-between items-center bg-opacity-60 p-4 w-full max-w-[430px] backdrop-blur-3xl`}
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

        {location.pathname === "/explore" && <span>Explore</span>}
        {location.pathname === "/userProfile/yourPosts" && (
          <Link to="/userProfile/settings">
            <FiSettings className="cursor-pointer" size={20} />
          </Link>
        )}
        {location.pathname === "/userProfile/settings" && <span>Settings</span>}
        <button
          onClick={toggleTheme}
          className={`relative flex items-center p-2 rounded-md border-[1px] ${
            theme === "dark" ? "border-zinc-300" : "border-zinc-950"
          }`}
        >
          <IoSunnyOutline
            className={`${theme === "light" ? "hidden" : "flex"}`}
            size={20}
          />
          <MdDarkMode
            className={`${theme === "dark" ? "hidden" : "flex"}`}
            size={20}
          />
        </button>
      </div>
      <div
        className={`w-full ${postLoading ? "h-screen" : "h-full"} 
        `}
      >
        <Outlet />
      </div>
      <div
        className={`z-10 ${position} bottom-0 h-12 flex justify-between items-center p-4 w-full max-w-[430px] ${
          theme === "dark" ? "bg-gray-900" : "bg-white"
        } bg-opacity-60 backdrop-blur-3xl `}
      >
        <Link className="flex flex-col items-center" to="/">
          <FaHome size={25} />
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
          to="/userProfile/yourPosts"
          onClick={() => {
            window.scrollTo(0, 0);
          }}
        >
          {loggedInUserData.img ? (
            <img
              src={loggedInUserData?.img}
              className="h-7 w-7 rounded-full"
              alt=""
            />
          ) : (
            <FaUser size={25} />
          )}
        </Link>
      </div>
    </div>
  );
};

export default Home;
