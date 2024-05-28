import "./userInfo.css";
import ProfilePage from "./ProfilePage/ProfilePage";
import { useUserStore } from "../../../lib/userStore";
import { useState } from "react";


const Userinfo = () => {
  const { currentUser } = useUserStore();
  const [showProfilePage, setShowProfilePage] = useState(false); // State to control the visibility of ProfilePage

  const toggleProfilePage = () => {
    setShowProfilePage(!showProfilePage);
  };

    return (
    <div className='userInfo'>
      <div className="user">
        <img src={currentUser.avatar || "./avatar.png"} alt="" />
        <h2>{currentUser.username}</h2>
      </div>
      <div className="icons">
        <img src="./more.png" alt="" />
        <img src="./profile.png" alt="" onClick={toggleProfilePage}/> {/* Toggle ProfilePage visibility on click */}
        </div>
        {showProfilePage && <ProfilePage />}
    </div>
  );
};

export default Userinfo;