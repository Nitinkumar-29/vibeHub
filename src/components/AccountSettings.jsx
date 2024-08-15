import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db, storage } from "../firebase";
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import toast from "react-hot-toast";
import { deleteObject, listAll, ref } from "firebase/storage";
import { CgSpinner } from "react-icons/cg";
import { IoCaretDownOutline, IoCaretUpOutline } from "react-icons/io5";

const AccountSettings = () => {
  const [error, setError] = useState("");
  const currentUser = localStorage.getItem("currentUser");
  const navigate = useNavigate();
  const [currentUserData, setCurrentUserData] = useState([]);
  const [togglePrivacyNote, setTogglePrivacyNote] = useState(false);
  // Fetch current user data
  const fetchCurrentUserData = async () => {
    const docRef = doc(db, "users", currentUser);
    const docSnap = await getDoc(docRef);
    const docSnapShot = docSnap.exists() ? docSnap.data() : {};
    setCurrentUserData(docSnapShot);
  };

  // Update account type
  const updateAccountType = async () => {
    try {
      const docRef = doc(db, "users", currentUser);

      await updateDoc(docRef, {
        accountType: `${
          currentUserData.accountType === "public" ? "private" : "public"
        }`,
      });
      // Fetch the updated data
      fetchCurrentUserData();
    } catch (error) {
      toast.dismiss();
      toast.error("Error updating account type");
      console.error(error);
    }
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
      const userDocRef = doc(db, "users", currentUser);
      await deleteDoc(userDocRef);

      // Delete all files in the user's storage directory
      const userStorageRef = ref(storage, `users/${currentUser}`);
      const userListResult = await listAll(userStorageRef);

      const userDeletePromises = userListResult.items.map((itemRef) => {
        return deleteObject(itemRef);
      });
      await Promise.all(userDeletePromises);

      // Delete all files in the user's posts directory
      const postStorageRef = ref(storage, `posts/${currentUser}`);
      const postListResult = await listAll(postStorageRef);

      const postDeletePromises = postListResult.items.map((itemRef) => {
        return deleteObject(itemRef);
      });
      await Promise.all(postDeletePromises);

      // Delete posts from Firestore
      const postsCollectionRef = collection(db, "posts");
      const postsQuery = query(
        postsCollectionRef,
        where("userId", "==", currentUser)
      );
      const postsSnapshot = await getDocs(postsQuery);

      const postDeleteDocPromises = postsSnapshot.docs.map((doc) => {
        return deleteDoc(doc.ref);
      });
      await Promise.all(postDeleteDocPromises);

      // Delete user account from Firebase Auth
      await deleteUser(user);

      //   dispatch({ type: "DELETE" });
      localStorage.removeItem("user");
      navigate("/login");
    } catch (error) {
      console.error("Error deleting user:", error);
      setError("Failed to delete account. Please try again.");
    }
  };

  // Real-time updates for the user document
  useEffect(() => {
    if (currentUser) {
      const docRef = doc(db, "users", currentUser);

      const unsubscribe = onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          setCurrentUserData(doc.data());
        } else {
          console.log("No such document!");
        }
      });

      // Clean up the subscription on unmount
      return () => unsubscribe();
    }
  }, [currentUser]);

  // Fetch data on component mount and when currentUser changes
  useEffect(() => {
    if (currentUser) {
      fetchCurrentUserData();
    }
    // eslint-disable-next-line
  }, [currentUser]);
  return (
    <div className="flex flex-col items-center w-full justify-between">
      <div className="flex items-center w-full justify-between p-2">
        <div className="flex items-center space-x-1">
          <span>Privacy</span>
          {togglePrivacyNote === false ? (
            <IoCaretDownOutline
              size={15}
              className="cursor-pointer mt-1"
              onClick={() => setTogglePrivacyNote(!togglePrivacyNote)}
            />
          ) : (
            <IoCaretUpOutline
              className="cursor-pointer mt-1"
              size={15}
              onClick={() => setTogglePrivacyNote(!togglePrivacyNote)}
            />
          )}
        </div>
        <div>
          {currentUserData?.accountType && (
            <button
              className=""
              onClick={() => {
                updateAccountType();
              }}
            >
              {currentUserData.accountType ? (
                <span className=" border-[1px] px-2 py-1 rounded-md">
                  {currentUserData.accountType === "public" ? "OFF" : "ON"}
                </span>
              ) : (
                <span className=" border-[1px] px-2 py-1 rounded-md">
                  <CgSpinner size={20} className="animate-spin" />
                </span>
              )}
            </button>
          )}
        </div>
      </div>
      <div
        className={`${
          togglePrivacyNote === false ? "hidden" : "flex"
        } tracking-normal text-sm font-normal text-zinc-600  p-2`}
      >
        {currentUserData?.accountType === "public" ? (
          <div className="flex flex-col space-y-1 whitespace-pre-wrap">
            <p>
              Note: Currently your account is set to public, and will allow
              other users to see your posts and messages without your
              permission.{" "}
            </p>
            <p>
              However, you can change your account type to private if you need
              more privacy. We are making every effort to keep your personal
              data safe from every unauthorised access.
            </p>
          </div>
        ) : (
          <div className="flex flex-col space-y-1 whitespace-pre-wrap">
            <p>
              Note: Currently your account is private and will restrict other
              users to see your posts and messages who are not following you.{" "}
            </p>
            <p>
              We believe in considering user privacy on the platform and will
              make every effort to keep you, your data safe.
            </p>{" "}
            <p>
              However if you want engagement and allow messages, change account
              type to public.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSettings;
