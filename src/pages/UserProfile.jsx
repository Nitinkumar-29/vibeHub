import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, storage } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { deleteObject, listAll, ref, } from "firebase/storage";
import { AuthContext } from "../context/AuthContext";
import {
  signOut,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";

const UserProfile = () => {
  const { currentUser } = useContext(AuthContext);
  const [fetchedUserData, setFetchedUserData] = useState(null);

  const { dispatch } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogOut = async () => {
    await signOut(auth)
      .then(() => {
        // console.log("User logged out");
        dispatch({ type: "LOGOUT" });
        localStorage.removeItem("user");
        navigate("/login");
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleDeleteAccount = async () => {
    try {
      // Re-authenticate the user
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(
        user.email,
        prompt("Please enter your password to confirm deletion:")
      );

      await reauthenticateWithCredential(user, credential);
      // Delete user documents from Firestore
      const userDocRef = doc(db, "users", currentUser.uid);
      await deleteDoc(userDocRef);

       // 2. Optionally delete user-related files from Storage
       const userStorageRef = ref(storage, `users/${currentUser.uid}`);
       const listResult = await listAll(userStorageRef);
 
       const deletePromises = listResult.items.map((itemRef) => {
         return deleteObject(itemRef);
       });
       await Promise.all(deletePromises);

      // Delete the user
      await deleteUser(user);
      // console.log("Successfully deleted user");
      dispatch({ type: "DELETE" });
      localStorage.removeItem("user");
      navigate("/signUp"); // Redirect to sign-up
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleFetchUserData = async () => {
    if (currentUser && currentUser.email) {
      const q = query(
        collection(db, "users"),
        where("email", "==", currentUser.email)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        // console.log(doc.id, " => ", doc.data());
        const userData = doc.data();
        // console.log(userData);
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
      {fetchedUserData && (
        <div>
          <img
            src={fetchedUserData.img}
            className="h-20 w-20 rounded-full border-2 border-black"
            alt=""
          />
          <h3>User Data:</h3>
          <p>Name: {fetchedUserData.name}</p>
          <p>Email: {fetchedUserData.email}</p>
          <p>Mobile Number: {fetchedUserData.mobileNumber}</p>
          <p>Address: {fetchedUserData.address}</p>

          <div className="flex space-x-4 ">
            <button
              className="shadow-sm shadow-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 duration-200"
              onClick={handleLogOut}
            >
              Logout
            </button>
            <button
              className="shadow-sm shadow-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 duration-200"
              onClick={handleDeleteAccount}
            >
              Delete Account
            </button>
          </div>
          {/* Display other user data as needed */}
        </div>
      )}
    </>
  );
};

export default UserProfile;
