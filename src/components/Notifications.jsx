import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { FaRightFromBracket } from "react-icons/fa6";
import { TiTick } from "react-icons/ti";
import { BiCloset } from "react-icons/bi";
import { CgClose, CgCloseR } from "react-icons/cg";
import { TfiClose } from "react-icons/tfi";
import { GoIssueClosed } from "react-icons/go";
import { IoCloseCircleOutline } from "react-icons/io5";
import { arrayRemove, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import toast from "react-hot-toast";

const Notifications = () => {
  const { currentUser, fetchFollowRequests, acceptFollowRequest } =
    useContext(AuthContext);
  const [requestsData, setRequestsData] = useState([]);

  // reject follow request
  const rejectRequest = async (id) => {
    toast.loading("processing...");
    if (!id) return "not valid id";
    try {
      let updatedRequests = [];
      const docRef = doc(db, "users", currentUser.uid);
      await updateDoc(docRef, {
        followRequests: arrayRemove(id),
      });
      updatedRequests = requestsData.filter((request) => request === id);
      setRequestsData(updatedRequests);
      toast.dismiss();
      toast.success("request rejected!");
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    (async () => {
      const data = await fetchFollowRequests(currentUser);
      setRequestsData(data);
    })();
    // eslint-disable-next-line
  }, []);
  return (
    <>
      <div className="flex flex-col items-center w-full p-4">
        <div className="text-lg font-semibold">Notifications</div>

        {requestsData.map((data) => {
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
