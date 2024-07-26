import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, storage } from "../firebase";
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
} from "firebase/auth";
import { AuthContext } from "../context/AuthContext";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { deleteObject, listAll, ref } from "firebase/storage";
import { IoSunnyOutline } from "react-icons/io5";
import { MdDarkMode } from "react-icons/md";
import ThemeContext from "../context/Theme/ThemeContext";

const Settings = () => {
  const [error, setError] = useState("");
  const { toggleTheme, theme } = useContext(ThemeContext);
  const { dispatch, currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const handleLogOut = async () => {
    await signOut(auth)
      .then(() => {
        dispatch({ type: "LOGOUT" });
        localStorage.removeItem("user");
        localStorage.removeItem("loggedInUserData");
        navigate("/login");
      })
      .catch((error) => {
        console.error(error);
        setError("Logout failed. Please try again.");
      });
  };

  const handleDeleteAccount = async () => {
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(
        user.email,
        prompt("Please enter your password to confirm deletion:")
      );

      await reauthenticateWithCredential(user, credential);

      // Delete user document from Firestore
      const userDocRef = doc(db, "users", currentUser.uid);
      await deleteDoc(userDocRef);

      // Delete all files in the user's storage directory
      const userStorageRef = ref(storage, `users/${currentUser.uid}`);
      const userListResult = await listAll(userStorageRef);

      const userDeletePromises = userListResult.items.map((itemRef) => {
        return deleteObject(itemRef);
      });
      await Promise.all(userDeletePromises);

      // Delete all files in the user's posts directory
      const postStorageRef = ref(storage, `posts/${currentUser.uid}`);
      const postListResult = await listAll(postStorageRef);

      const postDeletePromises = postListResult.items.map((itemRef) => {
        return deleteObject(itemRef);
      });
      await Promise.all(postDeletePromises);

      // Delete posts from Firestore
      const postsCollectionRef = collection(db, "posts");
      const postsQuery = query(
        postsCollectionRef,
        where("userId", "==", currentUser.uid)
      );
      const postsSnapshot = await getDocs(postsQuery);

      const postDeleteDocPromises = postsSnapshot.docs.map((doc) => {
        return deleteDoc(doc.ref);
      });
      await Promise.all(postDeleteDocPromises);

      // Delete user account from Firebase Auth
      await deleteUser(user);

      dispatch({ type: "DELETE" });
      localStorage.removeItem("user");
      navigate("/login");
    } catch (error) {
      console.error("Error deleting user:", error);
      setError("Failed to delete account. Please try again.");
    }
  };
  return (
    <div className={`min-h-[86.5vh] bg-black border-t-[1px] border-blue-950`}>
      <div className="flex space-x-6 w-full justify-center">
        <button
          className="border-[1px] rounded-md px-4 py-2"
          onClick={handleLogOut}
        >
          Logout
        </button>
        <button
          className="border-[1px] rounded-md px-4 py-2"
          onClick={handleDeleteAccount}
        >
          Delete Account
        </button>
        <button
          onClick={toggleTheme}
          className={`relative flex items-center p-2 rounded-md border-[1px] ${
            theme === "dark" ? "border-zinc-300" : "border-zinc-950"
          }`}
        >
          <IoSunnyOutline
            className={`${theme === "light" ? "hidden" : "flex"}`}
            size={20}
          />
          <MdDarkMode
            className={`${theme === "dark" ? "hidden" : "flex"}`}
            size={20}
          />
        </button>
      </div>
    </div>
  );
};

export default Settings;
