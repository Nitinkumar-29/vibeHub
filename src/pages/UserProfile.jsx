import React, { useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { AuthContext } from "../context/AuthContext";

const UserProfile = () => {
  const { currentUser } = useContext(AuthContext);
  const [fetchedUserData, setFetchedUserData] = useState(null);

  const handleFetchUserData = async () => {
    if (currentUser && currentUser.email) {
      const q = query(
        collection(db, "users"),
        where("email", "==", currentUser.email)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        console.log(doc.id, " => ", doc.data());
        const userData = doc.data();
        console.log(userData);
        setFetchedUserData(userData);
      });
    }
  };

  useEffect(() => {
    if (currentUser) {
      handleFetchUserData();
    }
    // eslint-disable-next-line
  }, [currentUser]);

  return (
    <>
      <div className="text-3xl">UserProfile</div>
      <button onClick={handleFetchUserData}>Fetch</button>
      {fetchedUserData && (
        <div>
          <img src={fetchedUserData.img} className="h-20 w-20 rounded-full border-2 border-black" alt="" />
          <h3>User Data:</h3>
          <p>Name: {fetchedUserData.name}</p>
          <p>Email: {fetchedUserData.email}</p>
          <p>Mobile Number: {fetchedUserData.mobileNumber}</p>
          <p>Address: {fetchedUserData.address}</p>
          {/* Display other user data as needed */}
        </div>
      )}
    </>
  );
};

export default UserProfile;
