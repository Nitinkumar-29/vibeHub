import { collection, getDocs } from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import { db } from "../firebase";
import { FaUser } from "react-icons/fa";
import { Link } from "react-router-dom";
import PostContext from "../context/PostContext/PostContext";
import { GiSpinningSword } from "react-icons/gi";

const Explore = () => {
  const [allUsers, setAllUsers] = useState([]);
  const { posts } = useContext(PostContext);
  const [query, setQuery] = useState(" ");
  const handleFetchUsersData = async () => {
    try {
      const queryUsersData = await getDocs(collection(db, "users"));
      const allUsersData = [];

      queryUsersData.forEach((dataDoc) => {
        const userData = dataDoc.data();
        const userId = dataDoc.id;
        allUsersData.push({ id: userId, ...userData });
      });

      console.log(allUsersData);
      setAllUsers(allUsersData);
      return allUsersData;
    } catch (error) {
      console.error("Error fetching users data: ", error);
      return [];
    }
  };

  const keys = ["name", "email", "user_name"];

  useEffect(() => {
    handleFetchUsersData();
  }, []);
  return (
    <>
      {allUsers && posts ? (
        <div className="relative w-full bg-inherit border-t-[1px] border-blue-950 space-y-2 pb-20 min-h-screen">
          <div className="fixed top-14 flex justify-between items-center border-y-[1px] border-blue-950 bg-zinc-900 w-full max-w-[430px] h-16">
            <input
              type="text"
              className="bg-inherit w-full focus:outline-none placeholder:text-zinc-500 focus:placeholder:text-zinc-300 text-sky-600 px-4 py-2"
              placeholder="Search @username, name...."
              onChange={(e) => {
                setQuery(e.target.value);
              }}
            />
            {/* <button className="hover:text-white text-zinc-500 mx-4 rounded-md">Search</button> */}
          </div>
          <div className="flex w-full items-center px-2 pt-20">
            {query.length > 1 &&
            allUsers?.filter((user) =>
              keys?.some((key) =>
                user[key]?.toLowerCase()?.includes(query?.trim()?.toLowerCase())
              )
            ).length > 1
              ? "All Users"
              : ""}
          </div>
          <div className="grid grid-cols-3 gap-1 px-2 pb-2">
            {query.length > 1 &&
              allUsers
                ?.filter((user) =>
                  keys?.some((key) =>
                    user[key]
                      ?.toLowerCase()
                      ?.includes(query.trim().toLowerCase())
                  )
                )
                ?.map((user) => {
                  return (
                    <Link
                      key={user.id}
                      to={`/users/${user?.user_name}/profile`}
                    >
                      <div className="flex flex-col w-full space-y-2">
                        {user.img ? (
                          <img
                            src={user.img}
                            className="w-40 border-[1px] border-blue-950 object-cover h-40 rounded-sm"
                            alt=""
                          />
                        ) : (
                          <FaUser
                            size={40}
                            className="w-[134px] h-40 object-cover border-[1px] border-blue-950 rounded-sm"
                          />
                        )}
                        <span className="text-sm w-full text-center">
                          {user?.user_name}
                        </span>
                        {/* <span> {user.email}</span> */}
                      </div>
                    </Link>
                  );
                })}
          </div>
          <div className="flex w-full items-center px-2">
            <span>
              {posts?.filter((post) =>
                keys?.some((key) =>
                  post.userData[key]
                    ?.toLowerCase()
                    ?.includes(query?.trim()?.toLowerCase())
                )
              ).length > 0
                ? "All Posts"
                : ""}
              &nbsp;
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 px-2">
            {posts
              ?.filter((post) =>
                keys?.some((key) =>
                  post?.userData[key]
                    ?.toLowerCase()
                    ?.includes(query?.trim()?.toLowerCase())
                )
              )
              .map((post) => {
                return (
                  <Link
                    className="flex flex-col w-full space-y-2"
                    key={post.id}
                    to={`/post/${post.id}`}
                  >
                    {post?.fileURLs && post?.fileURLs.length > 0 && (
                      <div key={post.id}>
                        {post?.fileURLs[0].endsWith(".mp4") ? (
                          <video
                            controls
                            className="h-full w-full object-cover rounded-sm border-[1px] border-blue-950"
                          >
                            <source src={post.fileURLs[0]} type="video/mp4" />
                          </video>
                        ) : (
                          <img
                            src={post?.fileURLs[0]}
                            alt="post media"
                            className="h-40 w-40 object-cover rounded-sm border-[1px] border-blue-950"
                          />
                        )}
                      </div>
                    )}
                  </Link>
                );
              })
              .slice(0, 50)}
          </div>
        </div>
      ) : (
        <div className="max-h-screen">
          <GiSpinningSword className="text-red-600 h-50 w-50 animate-spin" />
        </div>
      )}
    </>
  );
};

export default Explore;
