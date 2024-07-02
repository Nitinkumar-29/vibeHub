import React, { useContext } from "react";
import { Link } from "react-router-dom";


const Home = () => {
  
    return (
    <>
      <div>
        <span>home page</span>
        <Link to="/profile">user profile</Link>
      </div>
   
    </>
  );
};

export default Home;
