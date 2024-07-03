import React, { useContext, useEffect, useState } from "react";
import { FaHome, FaPlusCircle, FaUser } from "react-icons/fa";
import { Link, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

const Home = () => {
  const { currentUser } = useContext(AuthContext);
  const [loggedInUserData,setLoggedInUserData]=useState({})
  const handleFetchUserData = async () => {
    if (currentUser && currentUser.email) {
      const q = query(
        collection(db, "users"),
        where("email", "==", currentUser.email)
      );
      const querySnapshot = await getDocs(q);
      console.log(querySnapshot)
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        console.log({ userData, uid: currentUser.uid });
        setLoggedInUserData(userData, currentUser.uid);
      });
    }
  };
  useEffect(()=>{
    currentUser.uid&&handleFetchUserData()
    // eslint-disable-next-line
  },[currentUser.uid])
  return (
    <div className="relative w-screen max-w-[430px] h-fit bg-zinc-950 text-white">
      <Outlet />
      <div className="z-10 text-white absolute bottom-0 h-16 w-full bg-zinc-950 p-2 ">
        <div className="flex justify-between items-center h-full p-2 rounded-md w-full border-[1px] border-blue-700 bg-inherit">
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
    </div>
  );
};

export default Home;
