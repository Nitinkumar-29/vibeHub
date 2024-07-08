import React from "react";
import { useParams } from "react-router-dom";

const OtherUsersProfile = () => {
  const {userId,username } = useParams();
  console.log(username, userId);
  return (
    <div className="min-h-screen bg-zinc-950">
      {username},{userId}
    </div>
  );
};

export default OtherUsersProfile;
