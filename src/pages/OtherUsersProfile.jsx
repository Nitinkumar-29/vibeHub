import React from "react";
import { useParams } from "react-router-dom";

const OtherUsersProfile = () => {
  const { user_name } = useParams();
  console.log(user_name);
  return <div className="min-h-screen bg-zinc-950">{user_name}</div>;
};

export default OtherUsersProfile;
