import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";

const OtherUsersProfile = () => {
  const { userId, username } = useParams();
  console.log(username, userId);
  const [data, setData] = useState([]);
  // need to fetch a user all data and acivity

  const handleFetchUserData = async () => {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      console.log(userSnap.data());
      const userData = { ...userSnap.data(), userId };
        console.log(userData);
      setData(userData);
      console.log(data);
    }
  };

  useEffect(() => {
    handleFetchUserData();
    // eslint-disable-next-line
  }, []);
  return (
    <div className={`min-h-[85.9vh]`}>
      <div className="h-[60vh] border-2 px-4">
        <div>
          {data.user_name}
          {data?.userId}
        </div>
      </div>
    </div>
  );
};

export default OtherUsersProfile;
