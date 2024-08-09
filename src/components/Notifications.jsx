import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { GoIssueClosed } from "react-icons/go";
import { IoCloseCircleOutline } from "react-icons/io5";
import { arrayRemove, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import toast from "react-hot-toast";
import { MdArrowBackIos, MdOutlineInfo } from "react-icons/md";
import ThemeContext from "../context/Theme/ThemeContext";
import { Link } from "react-router-dom";

const Notifications = () => {
  const { setFollowRequestsData, followRequestsData, acceptFollowRequest } =
    useContext(AuthContext);
  const currentUser = localStorage.getItem("currentUser");
  const [infoToggle, setInfoToggle] = useState(true);
  const { theme } = useContext(ThemeContext);

  // reject follow request
  const rejectRequest = async (id) => {
    toast.loading("processing...");
    if (!id) return "not valid id";
    try {
      let updatedRequests = [];
      const docRef = doc(db, "users", currentUser);
      await updateDoc(docRef, {
        followRequests: arrayRemove(id),
      });
      updatedRequests = followRequestsData.filter((request) => request === id);
      setFollowRequestsData(updatedRequests);
      toast.dismiss();
      toast.success("request rejected!");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center w-full p-2">
        <div
          className={`relative flex w-full items-center justify-between p-2 ${
            theme === "dark" ? "bg-zinc-900" : "bg-zinc-200"
          } rounded-md`}
        >
          <div className="flex space-x-4 items-center w-full">
            <MdArrowBackIos size={20} />
            <div className="text-lg font-semibold">Notifications</div>
          </div>
          <MdOutlineInfo
            onClick={() => {
              setInfoToggle(!infoToggle);
            }}
            className="cursor-pointer"
            size={25}
          />
          <div
            className={`${
              infoToggle ? "hidden" : "flex"
            } text-sm text-zinc-600 ${
              theme === "dark" ? "bg-zinc-900" : "bg-gray-200"
            } flex flex-wrap absolute top-12 max-w-[100%] border-[1px]  rounded-md w-fit right-0 mx-auto min-h-20 p-2`}
          >
            <p>
              To keep UI clean, we will remove notifications once you have had a
              look. Let us know your opinion.
            </p>
            <div className="flex items-center space-x-2">
              <span>Email at:</span>
              <span className="cursor-pointer text-blue-500 hover:underline">
                vibeHub05@gmail.com
              </span>
            </div>
          </div>
        </div>

        {followRequestsData.map((data) => {
          return (
            <div
              key={data.id}
              className={`mt-10 flex items-center justify-between w-full `}
            >
              <div className="flex space-x-2 items-center">
                <img src={data?.img} alt="" className="h-8 w-8 rounded-full" />
                <span> {data?.user_name}</span>
                <span>requested you to follow</span>
              </div>
              <div className="flex items-center space-x-2">
                <IoCloseCircleOutline
                  className="cursor-pointer text-red-600"
                  onClick={() => rejectRequest(data.id)}
                  size={28}
                />
                <GoIssueClosed
                  className="cursor-pointer text-green-600"
                  size={25}
                  onClick={() => acceptFollowRequest(data.id)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default Notifications;
