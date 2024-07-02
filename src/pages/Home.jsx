import React, { useEffect, useState } from "react";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebase";

const Home = () => {
  const [posts, setPosts] = useState([]);

  const fetchAllPosts = async () => {
    const querySnapshot = await getDocs(collection(db, "posts"));
    const postsArray = [];
    querySnapshot.forEach((doc) => {
      postsArray.push({ id: doc.id, ...doc.data() });
    });
    setPosts(postsArray);
    console.log(postsArray);
  };

  useEffect(() => {
    fetchAllPosts();
  }, []);

  return (
    <div className="text-white flex flex-col items-center w-screen max-w-[430px] bg-zinc-950 h-screen ">
      <div className="flex items-center w-[95%] justify-between h-16">
        <span>Home</span>
        <span>{posts.length}</span>
      </div>
      <div className="flex flex-col space-y-3 w-[95%] overflow-y-auto pt-2 pb-20">
        {posts.map((post) => (
          <div
            key={post._id}
            className="h-full w-full border-[1px] border-blue-900 rounded-md"
          >
            <div className="h-fit flex space-x-4 w-full justify-start p-3">
              {post?.img && (
                <img
                  src={post.img}
                  className="h-12 w-12 duration-200 rounded-full border-[1px] border-blue-800"
                  alt=""
                />
              )}
              <div className="flex flex-col space-y-1">
                <span className="font-medium">{post?.name}</span>
                <span>{post?.email}</span>
              </div>
            </div>
            <div className="w-full h-fit p-2">
              <p>{post.postCaption}</p>
              <div className="grid grid-cols-2 gap-2 h-auto p-2 w-full overflow-y-auto mx-auto">
                {post.fileURLs.map((fileURL, index) => (
                  <div key={index} className="relative">
                    {fileURL ? (
                      <img
                        src={fileURL}
                        alt="post media"
                        className="w-[10rem] h-[10rem] object-cover rounded-md border-[1px] border-blue-950"
                      />
                    ) : fileURL ? (
                      <video
                        controls
                        className="h-[8rem] w-[8rem] object-cover rounded-md border-[1px] border-blue-950"
                      >
                        <source src={fileURL} type="video" />
                      </video>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
