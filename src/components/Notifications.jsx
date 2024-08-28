import React, { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { GoIssueClosed } from "react-icons/go";
import { IoCloseCircleOutline } from "react-icons/io5";
import { arrayRemove, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import toast from "react-hot-toast";
import { MdArrowBackIos, MdOutlineInfo } from "react-icons/md";
import ThemeContext from "../context/Theme/ThemeContext";
import { useNavigate } from "react-router-dom";

const Notifications = () => {
  const { setFollowRequestsData, followRequestsData, acceptFollowRequest } =
    useContext(AuthContext);
  const currentUser = localStorage.getItem("currentUser");
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [infoBoxOpen, setInfoBoxOpen] = useState(false);
  const infoBoxRef = useRef(null);

  // Handle outside click toggle
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside of the referenced element
      if (
        infoBoxOpen === true &&
        infoBoxRef.current &&
        !infoBoxRef.current.contains(event.target)
      ) {
        setInfoBoxOpen(false); // Set to false if clicked outside
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [infoBoxOpen]);

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
            <MdArrowBackIos
              onClick={() => {
                navigate(-1);
              }}
              className="cursor-pointer"
              size={20}
            />
            <div className="text-lg font-semibold">Notifications</div>
          </div>
          <MdOutlineInfo
            onClick={(event) => {
              event.stopPropagation(); // Prevents the click from closing the info box
              setInfoBoxOpen(!infoBoxOpen);
            }}
            className="cursor-pointer"
            size={25}
          />
          <div
            ref={infoBoxRef}
            className={`${
              infoBoxOpen === false ? "hidden" : "flex"
            } text-sm text-zinc-600 ${
              theme === "dark" ? "bg-zinc-900" : "bg-gray-200"
            } flex flex-wrap absolute top-12 max-w-[100%] border-[1px] border-zinc-600 rounded-md w-fit right-0 mx-auto min-h-20 p-2`}
          >
            <p>
              To keep UI clean, we will remove notifications once you have had a
              look. Let us know your opinion.
            </p>
            <div className="flex items-center space-x-2">
              <span>Email at:</span>
              <span className="cursor-pointer text-blue-500 hover:underline">
                nimble2905@gmail.com
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col w-full items-start mt-4 px-2">
          {followRequestsData.length !== 0 && (
            <span className="font-semibold my-2 text-zinc-300">Follow Requests</span>
          )}
          {followRequestsData.length > 0 ? (
            followRequestsData.map((data) => {
              return (
                <div
                  key={data.id}
                  className={`mt-2 flex items-center justify-start space-x-2 w-full`}
                >
                  <div className="flex space-x-2 justify-center items-center w-fit">
                    <img
                      src={data?.img}
                      alt=""
                      className="h-10 min-w-10 max-w-10 rounded-full"
                    />
                    <div className="flex items-center space-x-1 flex-wrap  justify-start leading-5">
                      <span className="font-medium"> {data?.user_name}</span>
                      <span className="text-zinc-300">
                        requested to follow you
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <IoCloseCircleOutline
                      className="cursor-pointer text-red-600"
                      onClick={() => rejectRequest(data.id)}
                      size={30}
                    />
                    <GoIssueClosed
                      className="cursor-pointer text-green-600"
                      size={27}
                      onClick={() => acceptFollowRequest(data.id)}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex h-40 w-full items-center justify-center text-zinc-400 ">
              <span>No Notification</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
export default Notifications;