import React, { useContext, useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { BsEye, BsEyeSlash } from "react-icons/bs";
import { FcGoogle } from "react-icons/fc";
import ThemeContext from "../context/Theme/ThemeContext";
import toast from "react-hot-toast";

const Login = () => {
  const { theme } = useContext(ThemeContext);
  const {
    login,
    loginCredentials,
    setLoginCredentials,
    loading,
    isLoading,
    handleSignInWithGoogle,
    error,
    setError,
  } = useContext(AuthContext);
  const [passwordType, setPasswordType] = useState("password");

  const handleOnChange = (e) => {
    setLoginCredentials({
      ...loginCredentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleTogglePasswordType = () => {
    if (passwordType === "password") {
      setPasswordType("text");
      setTimeout(() => {
        setPasswordType("password");
      }, 1000);
    } else {
      setPasswordType("password");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    login(auth);
  };

  // reset user password
  const handleResetPassword = async () => {
    if (!loginCredentials.email) return setError("Provide email address");
    try {
      toast.loading(
        `Sending password reset mail to ${loginCredentials.email} `
      );
      await sendPasswordResetEmail(auth, loginCredentials.email);
      console.log("Password reset email sent successfully.");
      toast.dismiss();
      toast.success("Please check your mail box", {
        duration: 1000,
      });
    } catch (error) {
      console.error("Error sending password reset email:", error);
    }
  };

  return (
    <>
      <div
        className={`flex items-center justify-center w-screen h-full ${
          theme === "dark" ? "bg-black text-zinc-100" : "bg-white text-black"
        }`}
      >
        <div
          className={`relative flex flex-col items-center justify-center min-h-screen ${
            theme === "dark" ? "bg-black text-zinc-100" : "bg-white text-black"
          } space-y-3`}
        >
          <div className="flex items-center font-semibold h-12 fixed my-4  space-x-2 top-10">
            <span className="bg-gradient-to-tr from-red-500 via-blue-500 to-orange-500 text-3xl bg-clip-text text-transparent">
              Welcome to VibeHub
            </span>{" "}
            <img
              src={`/images/logo.png`}
              className="h-8 w-8 rounded-md"
              alt=""
            />
          </div>
          <button
            className="hidden sm:flex items-center space-x-2 border-[1px] rounded-md border-zinc-600 px-4 py-2 w-72 justify-center"
            onClick={() => handleSignInWithGoogle()}
          >
            <FcGoogle /> <span>Sign in with Google</span>
          </button>
          <span className="hidden sm:flex">or</span>
          <div className="flex flex-col items-center h-fit">
            <h1 className="mb-3">Sign in with Email</h1>
            <form onSubmit={handleLogin} className="flex flex-col space-y-4">
              <input
                className="border-[1px] border-zinc-600 rounded-md w-72 p-2 bg-inherit focus:outline-none"
                name="email"
                onChange={handleOnChange}
                value={loginCredentials.email}
                type="email"
                placeholder="Email"
              />
              <div className="flex items-center justify-between w-72 border-[1px] border-zinc-600 rounded-md">
                <input
                  className="rounded-md w-72 p-2 bg-inherit focus:outline-none"
                  name="password"
                  onChange={handleOnChange}
                  type={passwordType}
                  value={loginCredentials.password}
                  placeholder="Password"
                />
                <span
                  className="mx-4 cursor-pointer"
                  onClick={handleTogglePasswordType}
                >
                  {passwordType === "password" ? <BsEye /> : <BsEyeSlash />}
                </span>
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
                disabled={
                  loginCredentials.email.length === 0 ||
                  loginCredentials.password.length === 0
                }
                className={`flex justify-center border-[1px] border-zinc-600 rounded-md w-72 p-2 ${
                  loginCredentials?.email?.length === 0 ||
                  loginCredentials.password.length === 0
                    ? "cursor-not-allowed text-zinc-400"
                    : "cursor-pointer text-white"
                }`}
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
      </div>
    </>
  );
};

export default Login;
