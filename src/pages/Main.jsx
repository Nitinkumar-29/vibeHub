import React, { useContext, useEffect, useState } from "react";
import { FaHome, FaPlusCircle, FaUser } from "react-icons/fa";
import { Link, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import PostContext from "../context/PostContext/PostContext";

const Home = () => {
  const { posts, currentUser } = useContext(PostContext);
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
      <div className="z-20 fixed top-0 h-14 flex justify-between items-center p-2 w-full max-w-[430px] bg-inherit">
        <img src={`/images/logo.png`} className="h-10 w-10 rounded-md" alt="" />
        <span>Posts: {posts?.length}</span>
      </div>
      <div
        // style={{ height: `calc(100vh - 104px)` }}
        className="w-full min-h-screen mt-14"
      >
        <Outlet />
      </div>
      <div className="z-10 fixed bottom-0 h-12 flex justify-between items-center p-2 w-full max-w-[430px] bg-inherit">
        <span>
          <Link to="/">
            <FaHome size={25} />
          </Link>
        </span>
        <span>
          <Link to="/createPost">
            <FaPlusCircle size={25} />
          </Link>
        </span>
        <span>
          <Link to="/userProfile">
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
