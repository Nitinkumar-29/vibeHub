import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, storage } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  listAll,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { AuthContext } from "../context/AuthContext";
import {
  signOut,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { FaEdit, FaUserPlus } from "react-icons/fa";
import { FaPencil } from "react-icons/fa6";
import { VscLoading } from "react-icons/vsc";
import {
  TfiArrowCircleLeft,
  TfiEmail,
  TfiLocationPin,
  TfiMobile,
} from "react-icons/tfi";
import { CiSettings } from "react-icons/ci";
import { BiLogOut } from "react-icons/bi";
import { CgUserRemove } from "react-icons/cg";

const UserProfile = () => {
  const imageRef = useRef();
  const [file, setFile] = useState("");
  const { currentUser } = useContext(AuthContext);
  const [fetchedUserData, setFetchedUserData] = useState(null);
  const { dispatch } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageOnChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadFile = async () => {
    if (!file) return;
    setIsLoading(true);
    const name = new Date().getTime() + "_" + file.name;
    const storageRef = ref(storage, name);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");

        switch (snapshot.state) {
          case "paused":
            console.log("Upload is paused");
            break;
          case "running":
            console.log("Upload is running");
            break;
          default:
            break;
        }
      },
      (error) => {
        console.log(error);
        setError("File upload failed. Please try again.");
        setIsLoading(false);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log("File available at", downloadURL);
          await updateUserData({ img: downloadURL });
          setIsLoading(false);
        } catch (err) {
          console.error(err);
          setError("Failed to update user data. Please try again.");
          setIsLoading(false);
        }
      }
    );
  };

  const updateUserData = async (updatedData) => {
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, updatedData);
      setFetchedUserData((prevData) => ({ ...prevData, ...updatedData }));
    } catch (error) {
      console.error("Error updating user data:", error);
      setError("Failed to update user data. Please try again.");
    }
  };

  const handleLogOut = async () => {
    await signOut(auth)
      .then(() => {
        dispatch({ type: "LOGOUT" });
        localStorage.removeItem("user");
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

  const handleFetchUserData = async () => {
    if (currentUser && currentUser.email) {
      const q = query(
        collection(db, "users"),
        where("email", "==", currentUser.email)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
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
  }, [currentUser]);

  useEffect(() => {
    if (file) {
      handleUploadFile();
    }
    // eslint-disable-next-line
  }, [file]);

  return (
    <div className="flex flex-col items-center space-y-6 bg-zinc-950 text-white min-h-screen w-screen max-w-[430px] py-2">
      <div className="flex w-[95%] items-center justify-between shadow-sm rounded-md shadow-blue-900 border-[1px] border-blue-900 p-2">
        <TfiArrowCircleLeft
          onClick={() => {
            navigate(-1);
          }}
          size={28}
        />
        <div>UserProfile</div>
        <CiSettings size={32} />
      </div>
      {fetchedUserData && (
        <div className="flex flex-col items-center w-[95%] p-2 space-y-4 h-full">
          {fetchedUserData.img ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="flex justify-center relative w-fit">
                {!isLoading && (
                  <img
                    src={fetchedUserData.img}
                    className="h-20 w-20 hover:h-32 hover:w-32 duration-200 rounded-full border-[1px] border-blue-800"
                    alt=""
                  />
                )}
                {isLoading && <VscLoading className="animate-spin" size={60} />}
                <span
                  onClick={() => imageRef.current.click()}
                  className="absolute top-[60%] right-0 rounded-full p-2 bg-white h-fit w-fit cursor-pointer"
                >
                  <FaPencil color="black" size={12} />
                </span>
              </div>
              <span className="text-2xl">{fetchedUserData.name}</span>
            </div>
          ) : (
            <FaUserPlus size={45} />
          )}
          <div className="flex justify-between w-full my-4">
            <span>Personal Information</span>
            <FaEdit />
          </div>
          <div className="flex flex-col w-full space-y-4 rounded-md bg-zinc-900 p-4 text-sm">
            <div className="flex justify-between w-full">
              <div className="flex justify-between items-center space-x-2">
                <TfiEmail className="text-blue-700" />
                <span>Email</span>
              </div>
              <span>{fetchedUserData.email}</span>
            </div>
            <div className="flex justify-between w-full">
              <div className="flex justify-between items-center space-x-2">
                <TfiMobile className="text-blue-700" />
                <span>Phone</span>
              </div>
              <span>{fetchedUserData.mobileNumber}</span>
            </div>
            <div className="flex justify-between w-full">
              <div className="flex justify-between items-center space-x-2">
                <TfiLocationPin className="text-blue-700" />
                <span>Location</span>
              </div>
              <span>{fetchedUserData.address}</span>
            </div>
          </div>
          <div className="flex justify-between w-full">
            <button
              className="shadow-sm shadow-blue-800 border-[1px] border-blue-800 p-4 py-2 rounded-md duration-200"
              onClick={handleLogOut}
            >
              <BiLogOut size={25} />
            </button>
            <button
              className="shadow-sm shadow-blue-800 border-[1px] border-blue-800 px-4 py-2 rounded-md duration-200"
              onClick={handleDeleteAccount}
            >
              <CgUserRemove size={25} />
            </button>
          </div>
          <input
            type="file"
            ref={imageRef}
            style={{ display: "none" }}
            onChange={handleImageOnChange}
          />
        </div>
      )}
      {error && <div className="text-red-500">{error}</div>}
    </div>
  );
};

export default UserProfile;
