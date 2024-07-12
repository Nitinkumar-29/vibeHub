import React, { useContext, useState } from "react";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { BsEye, BsEyeSlash } from "react-icons/bs";
import { doc, updateDoc } from "firebase/firestore";

const Login = () => {
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { dispatch } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordType, setPasswordType] = useState("password");
  const token = localStorage.getItem("token");

  const handleTogglePasswordType = () => {
    if (passwordType === "password") {
      setPasswordType("text");
    } else {
      setPasswordType("password");
    }
  };

  const updatePasswordStatus = async () => {
    // To update a doc with uid
    const user = doc(db, "users", auth.currentUser.uid);
    token &&
      (await updateDoc(user, {
        password: password,
      }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        setIsLoading(true);
        navigate("/");
        dispatch({ type: "LOGIN", payload: user });
        updatePasswordStatus();
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(errorCode, errorMessage);
        setIsLoading(false);
        setLoading(false);
        setError("Invalid credentials");
      });
  };

  // reset user password
  const handleResetPassword = async () => {
    await sendPasswordResetEmail(auth, email)
      .then(() => {
        console.log("Please check email");
      })
      .catch((error) => {
        console.log(error);
      });
  };
  return (
    <div
      className={`relative flex flex-col items-center justify-center min-h-screen w-screen max-w-[430px] text-white bg-zinc-950 space-y-3`}
    >
      <div className="flex items-center font-semibold h-12 fixed my-4  space-x-2 top-32">
        <span className="bg-gradient-to-tr from-red-500 via-blue-500 to-orange-500 text-3xl bg-clip-text text-transparent">
          Welcome to VibeHub
        </span>{" "}
        <img src={`/images/logo.png`} className="h-8 w-8 rounded-md" alt="" />
      </div>
      <div className="flex flex-col items-center h-fit">
        <h1 className="text-2xl font-semibold my-3">Log In</h1>
        <form onSubmit={handleLogin} className="flex flex-col space-y-4">
          <input
            className="border-[1px] rounded-md w-72 p-2 bg-inherit focus:outline-none"
            name="email"
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
          />
          <div className="flex items-center justify-between w-72 border-[1px] rounded-md">
            <input
              className="rounded-md w-72 p-2 bg-inherit focus:outline-none"
              name="password"
              onChange={(e) => setPassword(e.target.value)}
              type={passwordType}
              placeholder="Password"
            />
            <span
              className="mx-4 cursor-pointer"
              onClick={handleTogglePasswordType}
            >
              {passwordType === "password" ? <BsEye /> : <BsEyeSlash />}
            </span>{" "}
          </div>
          <span
            onClick={handleResetPassword}
            className="text-sm text-blue-600 cursor-pointer"
          >
            Reset Password
          </span>
          {!loading && (
            <span className="text-sm w-fit text-red-600">{error}</span>
          )}
          <button
            className="flex justify-center border-[1px] rounded-md w-72 p-2"
            type="submit"
          >
            {isLoading === false && "Submit"}
            {isLoading === true && (
              <AiOutlineLoading3Quarters className="animate-spin my-1" />
            )}
          </button>
          <span>
            New User? &nbsp;{" "}
            <Link className="text-blue-500 font-medium" to="/signup">
              Create Account
            </Link>
          </span>
        </form>
      </div>
    </div>
  );
};

export default Login;
