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
import {
  TfiEmail,
  TfiLayoutListPost,
  TfiLocationPin,
  TfiMobile,
} from "react-icons/tfi";
import { BiArrowBack, BiImageAdd, BiLogOut } from "react-icons/bi";
import { CgUserRemove } from "react-icons/cg";
import PostContext from "../context/PostContext/PostContext";
import { TbBackground } from "react-icons/tb";
import UserLikedPosts from "../components/UserLikedPosts";
import ThemeContext from "../context/Theme/ThemeContext";
import { MdSavedSearch } from "react-icons/md";
import { IoSaveSharp } from "react-icons/io5";
import { BsHeartFill } from "react-icons/bs";
import { FiSettings } from "react-icons/fi";

const UserProfile = () => {
  const imageRef = useRef();
  const [file, setFile] = useState("");
  const [bgImg, setBgImg] = useState("");
  const [bgImgPreview, setBgImgPreview] = useState("");
  const { currentUser } = useContext(AuthContext);
  const [fetchedUserData, setFetchedUserData] = useState(null);
  const { dispatch } = useContext(AuthContext);
  const navigate = useNavigate();
  const [position, setPosition] = useState("static");
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
    <div
      className={`flex flex-col items-center space-y-6 h-full overflow-auto hideScrollbar w-full max-w-[430px]`}
    >
      <div
        className={`z-10 sticky top-0 right-0 flex items-center py-2 justify-between w-full px-4 ${
          theme === "dark" ? "bg-black text-white" : "bg-white text-black"
        }`}
      >
        <div className="flex space-x-2 items-center">
          <BiArrowBack size={20} className="cursor-pointer" />
          <span className={` `}>
            {fetchedUserData?.user_name && (
              <span className={`text-xl font-semibold`}>
                {fetchedUserData?.user_name}
              </span>
            )}
          </span>
        </div>
        <Link
          to={`/userProfile/settings`}
          onClick={() => {
            window.scrollTo(0, 0);
          }}
        >
          <FiSettings size={20} />
        </Link>
      </div>
      {fetchedUserData && (
        <div className="relative flex flex-col items-center justify-center h-fit space-y-3 px-4 w-full">
          <div className="flex items-start justify-between px-4 w-full">
            <div className="flex flex-col items-center space-y-1">
              <img
                src={fetchedUserData?.img}
                className="h-16 w-16 object-cover rounded-full duration-300"
                alt=""
              />
              <span>{fetchedUserData.name}</span>
            </div>
            <div className="flex justify-between">
              <div className="flex flex-col items-center">
                <span className="text-3xl">{userPosts?.length || 0}</span>
                <Link
                  to="/userProfile/yourPosts"
                  className={`text-sm font-semibold px-3 py-1 `}
                >
                  Posts
                </Link>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-3xl">
                  {fetchedUserData?.followers?.length || 0}
                </span>
                <Link
                  to={`/userProfile/${currentUser.uid}/followers`}
                  className={`text-sm font-semibold px-3 py-1 `}
                >
                  Followers
                </Link>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-3xl">
                  {fetchedUserData?.following?.length || 0}
                </span>
                <Link
                  to={`/userProfile/${currentUser.uid}/following`}
                  className={`text-sm font-semibold px-3 py-1 `}
                >
                  Following
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col items-center w-full">
        {location.pathname === `/userProfile/yourPosts` ||
        location.pathname === `/userProfile/likedPosts` ||
        location.pathname === `/userProfile/savedPosts` ? (
          <div className="w-full flex justify-evenly border-y-[1px] border-gray-400">
            <span className="w-full flex justify-center">
              <Link
                to={`/userProfile/yourPosts`}
                className={`${
                  location.pathname === "/userProfile/yourPosts"
                    ? `${theme === "dark" ? "text-white" : "text-black"}`
                    : "text-gray-400"
                } p-2  text-center`}
              >
                <TfiLayoutListPost size={25} />
              </Link>
            </span>
            <span className="w-full flex justify-center">
              <Link
                to={`/userProfile/savedPosts`}
                className={`${
                  location.pathname === "/userProfile/savedPosts"
                    ? `${theme === "dark" ? "text-white" : "text-black"}`
                    : "text-gray-400"
                } p-2 text-center`}
              >
                <IoSaveSharp size={23} />
              </Link>
            </span>
            <span className="w-full flex justify-center">
              <Link
                to={`/userProfile/likedPosts`}
                className={`${
                  location.pathname === "/userProfile/likedPosts"
                    ? `${theme === "dark" ? "text-white" : "text-black"}`
                    : "text-gray-400"
                } p-2 text-center`}
              >
                <BsHeartFill size={22} />
              </Link>
            </span>
          </div>
        ) : (
          <div className="w-full flex justify-evenly border-y-[1px] border-gray-400">
            <span className="w-full flex justify-center">
              <Link
                to={`/userProfile/${currentUser.uid}/followers`}
                className={`${
                  location.pathname ===
                  `/userProfile/${currentUser.uid}/followers`
                    ? `${theme === "dark" ? "text-white" : "text-black"}`
                    : "text-gray-400"
                } p-2  text-center`}
              >
                {/* <TfiLayoutListPost size={25} /> */}
                Followers
              </Link>
            </span>
            <span className="w-full flex justify-center">
              <Link
                to={`/userProfile/${currentUser.uid}/following`}
                className={`${
                  location.pathname ===
                  `/userProfile/${currentUser.uid}/following`
                    ? `${theme === "dark" ? "text-white" : "text-black"}`
                    : "text-gray-400"
                } p-2  text-center`}
              >
                {/* <TfiLayoutListPost size={25} /> */}
                Following
              </Link>
            </span>
          </div>
        )}
        <div className="w-full h-full">
          <Outlet />
        </div>
      </div>
      {error && <div className="text-red-500">{error}</div>}
    </div>
  );
};

export default UserProfile;
