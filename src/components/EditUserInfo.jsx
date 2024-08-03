import React, { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";

const EditUserInfo = () => {
  const { handleFetchCurrentUserData } = useContext(AuthContext);
  const currentUser = localStorage.getItem("currentUser");

  useEffect(() => {
    handleFetchCurrentUserData();
    // eslint-disable-next-line
  }, [currentUser]);
  return <div>EditUserInfo</div>;
};

export default EditUserInfo;
