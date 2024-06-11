import React, { useContext } from "react";
import {
  signOut,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { doc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { auth, db, storage } from "../firebase";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { dispatch } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogOut = async () => {
    await signOut(auth)
      .then(() => {
        console.log("User logged out");
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
      const userCollectionRef = collection(db, "users", user.uid);
      const userDocs = await getDocs(userCollectionRef);
      userDocs.forEach(async (docSnapshot) => {
        await deleteDoc(doc(db, "users", user.uid, docSnapshot.id));
      });

      // Optionally delete user-related files from Storage
      const storageRef = ref(storage, `users/${user.uid}`);
      const listRef = await storageRef.listAll();
      listRef.items.forEach(async (fileRef) => {
        await deleteObject(fileRef);
      });

      // Delete the user
      await deleteUser(user);
      console.log("Successfully deleted user");
      dispatch({ type: "DELETE ACCOUNT" });
      localStorage.removeItem("user");
      navigate("/signUp"); // Redirect to sign-up
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  return (
    <>
      <div>Home page</div>
      <button onClick={handleLogOut}>Logout</button>
      <button onClick={handleDeleteAccount}>Delete Account</button>
    </>
  );
};

export default Home;
