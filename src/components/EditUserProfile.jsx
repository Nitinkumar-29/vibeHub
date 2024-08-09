import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import toast from "react-hot-toast";
import ThemeContext from "../context/Theme/ThemeContext";

import { BsPen } from "react-icons/bs";
import { IoCloseCircleOutline } from "react-icons/io5";
import { GoIssueClosed } from "react-icons/go";
import { HighLightLinks } from "../utils/HighlightLinks";

const EditUserProfile = () => {
  const { handleFetchCurrentUserData, currentUserData } =
    useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const currentUser = localStorage.getItem("currentUser");
  const [updateUserData, setUpdateUserData] = useState({
    name: "",
    user_name: "",
    bio: "",
    gender: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (e) => {
    setUpdateUserData({
      ...updateUserData,
      [e.target.dataset.name]: e.target.textContent,
    });
  };

  useEffect(() => {
    handleFetchCurrentUserData();
    // eslint-disable-next-line
  }, [currentUser]);
  return (
    <>
      <div
        className={`flex flex-col space-y-3 items-center w-full rounded-md h-full p-4`}
      >
        <div className="relative ">
          <img
            src={currentUserData.img}
            className="h-20 w-20 rounded-full"
            alt=""
          />
          <span
            className={`absolute top-[60%] right-0 p-2 rounded-full ${
              theme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
            }`}
          >
            <BsPen size={10} />
          </span>
        </div>
        <div className="flex flex-col space-y-2 w-full">
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
              <span
                onClick={() => setIsEditing(true)}
                onInput={handleInputChange}
                className="focus:outline-none"
                contentEditable={isEditing === false ? false : true}
                data-name="name"
              >
                {currentUserData.name}
              </span>
            </div>
            {isEditing && (
              <div className="flex space-x-1">
                <button
                  onClick={() => {
                    setIsEditing(false);
                  }}
                  className={`text-red-600 `}
                >
                  <IoCloseCircleOutline size={28} />
                </button>
                {updateUserData.name.length !== 0 && (
                  <button
                    onClick={async () => {
                      setIsEditing(false);
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
              <span
                onClick={() => setIsEditing(true)}
                onInput={handleInputChange}
                className="focus:outline-none"
                contentEditable={isEditing === false ? false : true}
                data-name="user_name"
              >
                {currentUserData.user_name}
              </span>
            </div>
            {isEditing && (
              <div className="flex space-x-1">
                <button
                  onClick={() => {
                    setIsEditing(false);
                  }}
                  className={`text-red-600 `}
                >
                  <IoCloseCircleOutline size={28} />
                </button>
                {updateUserData.user_name.length !== 0 && (
                  <button
                    onClick={async () => {
                      setIsEditing(false);
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
              <span
                onClick={() => setIsEditing(true)}
                contentEditable={true}
                className="focus:outline-none w-full whitespace-pre-wrap"
                onInput={handleInputChange}
                data-name="bio"
                dangerouslySetInnerHTML={{
                  __html: HighLightLinks(currentUserData?.bio || ""),
                }}
              ></span>
            </div>
            {isEditing && (
              <div className="flex space-x-1">
                <button
                  onClick={() => {
                    setIsEditing(false);
                  }}
                  className={`text-red-600 `}
                >
                  <IoCloseCircleOutline size={28} />
                </button>
                {updateUserData?.bio.length !== 0 && (
                  <button
                    onClick={async () => {
                      setIsEditing(false);
                      if (updateUserData?.bio.length === 0) return;
                      toast.loading("updating...");
                      const userDoc = doc(db, "users", currentUser);
                      await updateDoc(userDoc, {
                        bio: updateUserData?.bio,
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
    </>
  );
};

export default EditUserProfile;
