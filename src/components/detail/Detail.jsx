import { arrayRemove, arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import { useChatStore } from "../../lib/chatStore";
import { auth, db,  storage} from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import "./detail.css";
import { useState, useEffect } from "react";
import upload from "../../lib/upload";
import { getDownloadURL, ref } from "firebase/storage";

const Detail = () => {
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock } = useChatStore();
  const { currentUser } = useUserStore();
  const [openSection, setOpenSection] = useState(null);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [showMoreFiles, setShowMoreFiles] = useState(false);

   useEffect(() => {
    const fetchSharedFiles = async () => {
      try {
        const userChatsRef = doc(db, "userchats", currentUser.id);
        const userChatsSnapshot = await getDoc(userChatsRef);

        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();
          const chatIndex = userChatsData.chats.findIndex((c) => c.chatId === chatId);

          if (chatIndex !== -1) {
            const chat = userChatsData.chats[chatIndex];

            // Get shared files without URLs initially
            const sharedFilesWithoutUrls = chat.sharedFiles || [];

            // Fetch URLs for shared files concurrently
            const filesWithUrls = await Promise.all(
              sharedFilesWithoutUrls.map(async (file) => {
                const fileRef = ref(storage, file.path);
                const url = await getDownloadURL(fileRef);
                return { ...file, url };
              })
            );

            // Update state with files including URLs
            setSharedFiles(filesWithUrls);
          }
        }
      } catch (error) {
        console.error("Error fetching shared files:", error);
      }
    };

    fetchSharedFiles();
  }, [chatId, currentUser.id]);
  

  const handleBlock = async () => {
    if (!user) return;

    const userDocRef = doc(db, "users", currentUser.id);

    try {
      await updateDoc(userDocRef, {
        blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
      });
      changeBlock();
    } catch (err) {
      console.log(err);
    }
  };

  const handleOpenFile = (file) => {
    const mimeType = file.type;
    console.log("MIME type:", mimeType);

    if (mimeType.startsWith("image/")) {
      window.open(file.url, "_blank"); // Open images in a new tab
    } else if (mimeType === "application/pdf") {
      window.open(file.url, "_blank"); // Open PDFs in a new tab
    } else {
      // Handle other file types (consider external programs or custom logic)
      console.log("Unhandled file type:", mimeType);
    }
  };

  return (
    <div className='detail'>
      <div className="user">
        <img src={user?.avatar || "./avatar.png"} alt="" />
        <h2>{user?.username}</h2>
      </div>
      <div className="info">
        <div className="option">
          <div className="title">
            <span>Chat Settings</span>
            <img
              src={openSection === "chatSettings" ? "./arrowUp.png" : "./arrowDown.png"}
              alt=""
              className="add"
              onClick={() => setOpenSection(openSection === "chatSettings" ? null : "chatSettings")}
            />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Privacy % help</span>
            <img
              src={openSection === "privacyHelp" ? "./arrowUp.png" : "./arrowDown.png"}
              alt=""
              className="add"
              onClick={() => setOpenSection(openSection === "privacyHelp" ? null : "privacyHelp")}
            />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Shared files and photos</span>
            <img
            src={openSection === "sharedFiles" ? "./arrowUp.png" : "./arrowDown.png"}
            alt=""
            className="add"
            onClick={() => setOpenSection(openSection === "sharedFiles" ? null : "sharedFiles")}
            />
          </div>
          {openSection === "sharedFiles" && sharedFiles.length > 0 ? (
            <div className="photoContainer">
                {sharedFiles.slice(0, showMoreFiles ? sharedFiles.length : 5).map((file, index) => (
                  <div className="photoItem" key={index}>
                    <div className="photoDetail">
                      {console.log("File URL:", file.url)}
                       <img src={file.url} alt={file.name} />
                       <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={file.name}
                      >
                        {file.name}
                      </a>
                </div>
                <img
                  src="./download.png"
                  alt="Download"
                  className="icon"
                  onClick={() => handleOpenFile(file)}
                />
            </div>
            ))}
            {sharedFiles.length > 5 && !showMoreFiles && (
              <button onClick={() => setShowMoreFiles(true)}>Show more</button>
            )}
            {sharedFiles.length > 5 && showMoreFiles && (
              <button onClick={() => setShowMoreFiles(false)}>Show less</button>
            )}
          </div>
        ) : (
          <p></p>
        )}
      </div>
        <button onClick={handleBlock}>
          {isCurrentUserBlocked
            ? "You are Blocked!"
            : isReceiverBlocked
            ? "User blocked"
            : "Block User"}
        </button>
        <button className="logout" onClick={() => auth.signOut()}>Logout</button>
      </div>
    </div>
  )
}

export default Detail;
