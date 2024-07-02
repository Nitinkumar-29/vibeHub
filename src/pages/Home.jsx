import React, { useContext } from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="w-screen max-w-[430px] min-h-screen p-4">
      <span>home page</span>
      <Link to="/profile">user profile</Link>
    </div>
  );
};

export default Home;
