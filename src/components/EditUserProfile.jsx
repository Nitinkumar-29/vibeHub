import React, { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import toast from "react-hot-toast";
import ThemeContext from "../context/Theme/ThemeContext";

import { BsPen } from "react-icons/bs";
import { IoCloseCircleOutline } from "react-icons/io5";
import { GoIssueClosed } from "react-icons/go";
import { CgSpinner } from "react-icons/cg";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

const EditUserProfile = () => {
  const { handleFetchCurrentUserData, currentUserData } =
    useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const currentUser = localStorage.getItem("currentUser");

  // Separate editing states for each field
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingUserName, setIsEditingUserName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);

  const [newImageURL, setNewImageURL] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [file, setFile] = useState("");
  const fileRef = useRef();
  const [updateUserData, setUpdateUserData] = useState({
    name: "",
    user_name: "",
    bio: "",
    gender: "",
  });

  // Handle input change for contentEditable spans
  const handleInputChange = (e) => {
    setUpdateUserData({
      ...updateUserData,
      [e.target.dataset.name]: e.target.textContent,
    });
  };

  // Reset all editing states
  const resetEditingStates = () => {
    setIsEditingName(false);
    setIsEditingUserName(false);
    setIsEditingBio(false);
  };

  // Updating profile photo
  const handleFileChange = (e) => {
    const selectedImage = e.target.files[0];
    selectedImage && setFile(selectedImage);
  };

  useEffect(() => {
    if (!file) return;

    const uploadFile = async () => {
      try {
        setIsUpdating(true);
        const storage = getStorage();
        const name = new Date().getTime() + "_" + file.name;
        const storageRef = ref(storage, name);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          "state_changed",
          (snapshot) => (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          (error) => {
            console.error("File upload error:", error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log("download url: ", downloadURL);
              setNewImageURL(downloadURL);
              setIsUpdating(false);
              setFile("");
            } catch (error) {
              console.error("Failed to get download URL:", error);
            }
          }
        );
      } catch (error) {
        console.error("File upload process error:", error);
      }
    };

    uploadFile();
  }, [file]);

  const handleUpdateUserPhoto = async () => {
    const userDoc = doc(db, "users", currentUser);
    await updateDoc(userDoc, {
      img: newImageURL,
    });
    setNewImageURL("");
  };

  useEffect(() => {
    newImageURL.length !== 0 && handleUpdateUserPhoto();
    // eslint-disable-next-line
  }, [newImageURL]);

  useEffect(() => {
    handleFetchCurrentUserData();
    // eslint-disable-next-line
  }, [currentUser]);

  return (
    <div className="flex flex-col space-y-3 items-center w-full rounded-md h-full p-4">
      <div className="relative">
        {isUpdating === false ? (
          <img
            src={currentUserData.img}
            className="h-20 w-20 rounded-full"
            alt=""
          />
        ) : (
          <CgSpinner size={80} className="animate-spin" />
        )}
        {isUpdating === false && (
          <span
            onClick={() => {
              fileRef.current.click();
            }}
            className={`cursor-pointer absolute top-[60%] right-0 p-2 rounded-full ${
              theme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
            }`}
          >
            <BsPen size={10} />
          </span>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFileChange}
      />
      <div className="flex flex-col space-y-2 w-full">
        {/* Name Field */}
        <div
          className={`flex justify-between items-end border-[1px] rounded-md p-2 border-black ${
            theme === "dark" ? "border-zinc-600" : "border-zinc-200"
          }`}
        >
          <div className="flex flex-col">
            <span
              className={`${
                theme === "dark" ? "text-zinc-400" : "text-zinc-800"
              }`}
            >
              Name
            </span>
            <div
              onClick={() => {
                resetEditingStates();
                setIsEditingName(true);
              }}
              onInput={handleInputChange}
              className="focus:outline-none"
              contentEditable={isEditingName}
              data-name="name"
            >
              {currentUserData.name}
            </div>
          </div>
          {isEditingName && (
            <div className="flex space-x-1">
              <button
                onClick={() => setIsEditingName(false)}
                className={`text-red-600`}
              >
                <IoCloseCircleOutline size={28} />
              </button>
              {updateUserData.name.length !== 0 && (
                <button
                  onClick={async () => {
                    setIsEditingName(false);
                    if (updateUserData.name.length === 0) return;
                    toast.loading("updating...");
                    const userDoc = doc(db, "users", currentUser);
                    await updateDoc(userDoc, {
                      name: updateUserData.name,
                    });
                    toast.dismiss();
                    toast.success("updated!");
                  }}
                  className={`text-green-600`}
                >
                  <GoIssueClosed size={25} />
                </button>
              )}
            </div>
          )}
        </div>
        {/* Username Field */}
        <div
          className={`flex justify-between items-end border-[1px] rounded-md p-2 border-black ${
            theme === "dark" ? "border-zinc-600" : "border-zinc-200"
          }`}
        >
          <div className="flex flex-col">
            <span
              className={`${
                theme === "dark" ? "text-zinc-400" : "text-zinc-800"
              }`}
            >
              UserName
            </span>
            <div
              onClick={() => {
                resetEditingStates();
                setIsEditingUserName(true);
              }}
              onInput={handleInputChange}
              className="focus:outline-none"
              contentEditable={isEditingUserName}
              data-name="user_name"
            >
              {currentUserData.user_name}
            </div>
          </div>
          {isEditingUserName && (
            <div className="flex space-x-1">
              <button
                onClick={() => setIsEditingUserName(false)}
                className={`text-red-600`}
              >
                <IoCloseCircleOutline size={28} />
              </button>
              {updateUserData.user_name.length !== 0 && (
                <button
                  onClick={async () => {
                    setIsEditingUserName(false);
                    if (updateUserData.user_name.length === 0) return;
                    toast.loading("updating...");
                    const userDoc = doc(db, "users", currentUser);
                    await updateDoc(userDoc, {
                      user_name: updateUserData.user_name,
                    });
                    toast.dismiss();
                    toast.success("updated!");
                  }}
                  className={`text-green-600`}
                >
                  <GoIssueClosed size={25} />
                </button>
              )}
            </div>
          )}
        </div>
        {/* Bio Field */}
        <div
          className={`flex justify-between items-end border-[1px] rounded-md p-2 border-black ${
            theme === "dark" ? "border-zinc-600" : "border-zinc-200"
          }`}
        >
          <div className="flex flex-col">
            <span
              className={`${
                theme === "dark" ? "text-zinc-400" : "text-zinc-800"
              }`}
            >
              Bio
            </span>
            <div
              onClick={() => {
                resetEditingStates();
                setIsEditingBio(true);
              }}
              onInput={handleInputChange}
              className="focus:outline-none"
              contentEditable={isEditingBio}
              data-name="bio"
            >
              {currentUserData.bio}
            </div>
          </div>
          {isEditingBio && (
            <div className="flex space-x-1">
              <button
                onClick={() => setIsEditingBio(false)}
                className={`text-red-600`}
              >
                <IoCloseCircleOutline size={28} />
              </button>
              {updateUserData.bio.length !== 0 && (
                <button
                  onClick={async () => {
                    setIsEditingBio(false);
                    if (updateUserData.bio.length === 0) return;
                    toast.loading("updating...");
                    const userDoc = doc(db, "users", currentUser);
                    await updateDoc(userDoc, {
                      bio: updateUserData.bio,
                    });
                    toast.dismiss();
                    toast.success("updated!");
                  }}
                  className={`text-green-600`}
                >
                  <GoIssueClosed size={25} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default EditUserProfile;
