import React from "react";
import { FaHome, FaPlusCircle, FaUser } from "react-icons/fa";
import { Link, Outlet } from "react-router-dom";

const Home = () => {
  return (
    <div className="relative w-screen max-w-[430px] h-full bg-zinc-950 text-white">
      <Outlet />
      <div className="text-white absolute bottom-0 h-16 w-full bg-zinc-950 p-2 ">
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
              <FaUser size={25} />
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Home;
