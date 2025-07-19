import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import Loader from "../../components/loader/Loader";
import { auth } from "../../firebase/config";
import { sendPasswordResetEmail } from "firebase/auth";

const Reset = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errEmail, setErrEmail] = useState("");

  const handleEmail = (e) => {
    setEmail(e.target.value);
    setErrEmail("");
  };

  const EmailValidation = (email) => {
    return String(email)
      .toLowerCase()
      .match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i);
  };

  const handleReset = (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (email === "") {
      setIsLoading(false);
      setErrEmail("Enter your email");
      toast.error("Enter your email");
      return;
    }

    if (!EmailValidation(email)) {
      setIsLoading(false);
      toast.error("Enter a Valid email");
      setErrEmail("Enter a Valid email");
      return;
    }

    sendPasswordResetEmail(auth, email)
      .then(() => {
        toast.success("Check your email for a reset link");
        setIsLoading(false);
      })
      .catch((error) => {
        setIsLoading(false);
        toast.error(error.message);
      });
  };

  return (
    <>
      <ToastContainer />
      {isLoading && <Loader />}
      <div className="flex items-center justify-center w-full h-screen bg-gray-100">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <form onSubmit={handleReset} className="space-y-6">
            <h1 className="text-3xl font-bold text-center text-gray-800">
              Reset Password
            </h1>
            <p className="text-center text-sm text-gray-500">
              Enter your email to reset your password
            </p>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                onChange={handleEmail}
                value={email}
                className="w-full px-4 py-2 text-gray-800 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
              {errEmail && <p className="text-sm text-red-600">{errEmail}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-2 text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Reset Password
            </button>

            <div className="flex items-center justify-between">
              <Link
                to="/signin"
                className="text-sm text-blue-600 hover:underline"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="text-sm text-blue-600 hover:underline"
              >
                Sign Up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Reset;
