import React, { useContext, useEffect } from "react";
import PostContext from "../context/PostContext/PostContext";
import { Link } from "react-router-dom";

const UserSavedPosts = () => {
  const { handleFetchSavedPosts, currentUser } = useContext(PostContext);
  useEffect(() => {
    handleFetchSavedPosts();
    // eslint-disable-next-line
  }, [currentUser.uid]);
  return (
    <div className="flex items-center h-20 w-full justify-center">
      {" "}
      0 posts? <Link to="/">Try saving a post now</Link>
    </div>
  );
};

export default UserSavedPosts;
