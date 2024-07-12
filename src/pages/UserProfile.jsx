import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
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
import { FaEdit, FaPencilAlt, FaUserPlus } from "react-icons/fa";
import { FaPencil } from "react-icons/fa6";
import { VscLoading } from "react-icons/vsc";
import { TfiEmail, TfiLocationPin, TfiMobile } from "react-icons/tfi";
import { BiImageAdd, BiLogOut } from "react-icons/bi";
import { CgUserRemove } from "react-icons/cg";
import PostContext from "../context/PostContext/PostContext";
import { TbBackground } from "react-icons/tb";
import UserLikedPosts from "../components/UserLikedPosts";
import ThemeContext from "../context/Theme/ThemeContext";

const UserProfile = () => {
  const imageRef = useRef();
  const [file, setFile] = useState("");
  const [bgImg, setBgImg] = useState("");
  const [bgImgPreview, setBgImgPreview] = useState("");
  const { currentUser } = useContext(AuthContext);
  const [fetchedUserData, setFetchedUserData] = useState(null);
  const { dispatch } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const {
    handleFetchUserPosts,
    handleFetchLikedPosts,
    handleFetchSavedPosts,
    userPosts,
    savedPosts,
    likedPosts,
  } = useContext(PostContext);
  const location = useLocation();
  const bgImgRef = useRef();
  const { theme } = useContext(ThemeContext);

  const handleImageOnChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleBgImageOnChange = (e) => {
    bgImgPreview.current.click();
    if (e.target.files && e.target.files[0]) {
      setBgImgPreview(e.target.files[0]);
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

  const handleFetchUserData = async () => {
    if (currentUser && currentUser.email) {
      const q = query(
        collection(db, "users"),
        where("email", "==", currentUser.email)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        setFetchedUserData(userData, currentUser.uid);
        localStorage.setItem(
          "loggedInUserData",
          JSON.stringify(userData, currentUser.uid)
        );
      });
    }
  };

  useEffect(() => {
    if (currentUser) {
      handleFetchUserData();
    }
    // eslint-disable-next-line
  }, [currentUser]);

  useEffect(() => {
    if (file) {
      handleUploadFile();
    }
    // eslint-disable-next-line
  }, [file]);

  useEffect(() => {
    handleFetchUserPosts();
    handleFetchLikedPosts();
    handleFetchSavedPosts();
    // eslint-disable-next-line
  }, [currentUser.uid]);

  return (
    <div className={`flex flex-col items-center space-y-6 ${theme==="dark"?"bg-gray-900 text-white":"bg-white text-black"} min-h-screen w-full max-w-[430px] py-1`}>
      {fetchedUserData && (
        <div className="flex flex-col items-center w-full py-4 space-y-4 h-full">
          {fetchedUserData?.img ? (
            <div
              className={`flex flex-col items-center space-y-12 h-fit w-full`}
            >
              <div className=" flex flex-col items-center justify-center w-full space-y-3">
                <div className="relative">
                  {!isLoading && (
                    <img
                      src={fetchedUserData?.img}
                      className={`h-36 w-36 hover:h-56 cursor-pointer hover:w-56 touch-pinch-zoom touch duration-300 rounded-full object-right-top ${
                        fetchedUserData?.img
                          ? "border-[1px] border-blue-900"
                          : ""
                      }`}
                      alt=""
                    />
                  )}
                </div>
                <span className="text-2xl">{fetchedUserData?.name}</span>
              </div>
              {/* </div> */}
            </div>
          ) : (
            <FaUserPlus size={45} />
          )}
          <div className="flex justify-between w-full my-4 px-4">
            <span>Personal Information</span>
            <Link to="/userProfile/settings">
              <FaEdit />
            </Link>
          </div>
          <div className="flex flex-col w-full space-y-4 rounded-md p-4 text-sm">
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
          <div className="flex justify-between w-full px-4">
            <button
              className="shadow-sm shadow-blue-800 border-[1px] border-blue-800 px-4 py-2 rounded-md duration-200"
              onClick={handleLogOut}
            >
              <BiLogOut size={20} />
            </button>
            <button
              className="shadow-sm shadow-blue-800 border-[1px] border-blue-800 px-4 py-2 rounded-md duration-200"
              onClick={handleDeleteAccount}
            >
              <CgUserRemove size={20} />
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-col items-center w-full">
        <div className="w-full flex justify-evenly border-t-[1px] border-blue-950">
          <Link
            to={`/userProfile/yourPosts`}
            className={`${
              location.pathname === "/userProfile/yourPosts"
                ? "bg-zinc-700"
                : ""
            } p-2 w-full flex justify-center text-center`}
          >
            <div className="flex items-center justify-center w-fit space-x-2">
              <span>Posts</span>
              <span>{userPosts?.length}</span>
            </div>
          </Link>
          <Link
            to={`/userProfile/savedPosts`}
            className={`${
              location.pathname === "/userProfile/savedPosts"
                ? "bg-zinc-700"
                : ""
            } p-2 w-full flex justify-center text-center`}
          >
            <div className="flex items-center justify-center w-fit space-x-2">
              <span>Saved</span>
              <span>{savedPosts?.length}</span>
            </div>
          </Link>
          <Link
            to={`/userProfile/likedPosts`}
            className={`${
              location.pathname === "/userProfile/likedPosts"
                ? "bg-zinc-700"
                : ""
            } p-2 w-full flex justify-center text-center`}
          >
            <div className="flex items-center justify-center w-fit space-x-2">
              <span>Liked</span>
              <span>{likedPosts?.length}</span>
            </div>
          </Link>
        </div>
        <div className="w-full h-full">
          <Outlet />
        </div>
      </div>
      {error && <div className="text-red-500">{error}</div>}
    </div>
  );
};

export default UserProfile;
