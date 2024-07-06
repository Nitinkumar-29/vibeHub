import React from "react";
import { BiArrowBack } from "react-icons/bi";
import { useNavigate } from "react-router-dom";

const Notfound = () => {
  const navigate = useNavigate();
  return (
    <div className="relative flex justify-center items-center h-screen w-full text-5xl text-zinc-300 bg-zinc-950">
      <BiArrowBack
        className="absolute top-4 left-4 cursor-pointer"
        onClick={() => {
          navigate(-1);
          window.scrollTo(0, 0);
        }}
      />
      <span>404 Not found</span>
    </div>
  );
};

export default Notfound;
