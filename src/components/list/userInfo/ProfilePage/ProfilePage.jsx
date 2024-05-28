import React, { useState } from 'react';
import { useUserStore } from "../../../../lib/userStore"
import "./profilePage.css";
import DocumentList from "../ProfilePage/DocumentList/DocumentList"

const ProfilePage = () => {
  const { currentUser } = useUserStore();
  const [showDocumentList, setShowDocumentList] = useState(false);

  const toggleDocumentList = () => {
    setShowDocumentList(!showDocumentList);
  };

  return (
    <div className="profilePage">
      <div className="userProfile">
        <img src={currentUser.avatar || "./avatar.png"} alt="User Avatar" className="avatar" />
        <div className="namerow">
          <img src="./profile.png" alt="" />
          <div><h2>{currentUser.username}</h2></div>
        </div>
      </div>
      <div className="documentContainer">
        <img src="./folder.png" alt="" />
        <div className="documentLink">
          <a href="#" onClick={toggleDocumentList}><h2>My Documents</h2></a>
        </div>
      </div>
      {showDocumentList && <DocumentList onClose={toggleDocumentList} />}
      <div className="profileActions">
        <button className="edit">Edit</button>
        <button className="logout">Logout</button>
      </div>
    </div>
  );
};
export default ProfilePage;