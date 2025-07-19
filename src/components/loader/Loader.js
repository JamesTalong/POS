import loaderImg from "./GIF/loader.gif";
import ReactDOM from "react-dom";

const Loader = () => {
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center">
      <div className="relative">
        <img src={loaderImg} alt="Loading..." className="mx-auto" />
      </div>
    </div>,
    document.getElementById("loader")
  );
};

export default Loader;
