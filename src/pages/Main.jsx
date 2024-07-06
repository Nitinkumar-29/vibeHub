import React, { useContext, useEffect, useState } from "react";
import { FaHome, FaPlusCircle, FaUser, FaWpexplorer } from "react-icons/fa";
import { Link, Outlet, useLocation } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import PostContext from "../context/PostContext/PostContext";
import { FiSettings } from "react-icons/fi";
import { MdOutlineExplore } from "react-icons/md";

const Home = () => {
  const { posts, currentUser, postLoading } = useContext(PostContext);
  const location = useLocation();
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
  return (
    <div className="relative w-full max-w-[430px] h-fit bg-zinc-950 text-white">
      <div className="z-20 fixed top-0 h-14 flex justify-between items-center p-4 w-full max-w-[430px] bg-inherit">
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
          <Link to="settings">
            <FiSettings className="cursor-pointer" size={20} />
          </Link>
        )}
      </div>
      <div
        className={`w-full ${
          postLoading ? "h-screen" : "h-full"
        } bg-zinc-950 mt-14`}
      >
        <Outlet />
      </div>
      <div className="z-10 fixed bottom-0 h-12 flex justify-between items-center p-4 w-full max-w-[430px] bg-inherit">
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
