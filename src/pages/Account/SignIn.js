import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../Images/logo.png";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import Loader from "../../components/loader/Loader";
import { useDispatch } from "react-redux";
import { SET_ACTIVE_USER } from "../../redux/IchthusSlice";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errEmail, setErrEmail] = useState("");
  const [errPassword, setErrPassword] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleEmail = (e) => {
    setEmail(e.target.value);
    setErrEmail("");
  };

  const handlePassword = (e) => {
    setPassword(e.target.value);
    setErrPassword("");
  };

  const EmailValidation = (email) => {
    return String(email)
      .toLowerCase()
      .match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (email === "") {
      setIsLoading(false);
      setErrEmail("Enter your email");
      toast.error("Enter your email");
      return;
    }

    if (password === "") {
      setIsLoading(false);
      setErrPassword("Enter your password");
      toast.error("Enter your password");
      return;
    }

    if (!EmailValidation(email)) {
      setIsLoading(false);
      setErrEmail("Enter a valid email");
      toast.error("Enter a valid email");
      return;
    }

    if (password.length < 6) {
      setIsLoading(false);
      setErrPassword("Passwords must be at least 6 characters");
      toast.error("Passwords must be at least 6 characters");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      const userDocRef = doc(db, "user", user.uid); // Firestore doc ID is same as user.uid
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();

        dispatch(
          SET_ACTIVE_USER({
            fullName: userData.fullName || "Unknown User",
            email: user.email || "",
            imgUrl: userData.imgUrl || "",
            userID: user.uid,
            admin: userData.admin || false,
            roleName: userData.roleName || "",
            roleId: userData.roleId || "",
          })
        );

        toast.success("Login Successful...");
        navigate("/admin");
      } else {
        toast.error("No user document found.");
      }
    } catch (error) {
      toast.error("Please enter a valid email address and password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      {isLoading && <Loader />}
      <div className="min-h-screen flex">
        {/* Left section with background image */}
        <div
          className="hidden lg:block lg:w-1/2 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1546514714-df0ccc50d7bf?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=667&q=80')",
          }}
        ></div>

        {/* Right section with form */}
        <div className="flex items-center justify-center w-full lg:w-1/2 bg-gray-100 px-8 py-12">
          <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-lg">
            <div className="text-center">
              <img
                className="mx-auto h-20 w-auto"
                src={logo}
                alt="Ichthus Technology Logo"
              />
              <h2 className="mt-4 text-3xl font-bold text-gray-900">
                Ichthus Technology
              </h2>
              <p className="mt-2 text-sm text-gray-600">Welcome back, Admin!</p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSignIn}>
              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <label htmlFor="email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={handleEmail}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                    placeholder="Email address"
                  />
                  {errEmail && (
                    <p className="text-red-500 text-xs mt-1">{errEmail}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={handlePassword}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                    placeholder="Password"
                  />
                  {errPassword && (
                    <p className="text-red-500 text-xs mt-1">{errPassword}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link
                    to="/reset"
                    className="font-medium text-gray-600 hover:text-gray-500"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignIn;
