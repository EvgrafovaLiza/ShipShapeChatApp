import { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { arrayUnion, collection, doc, getDoc, getDocs, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase"
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "../../lib/firebase";


const Chat = () => {
  const [chat, setChat] = useState([]);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]); 
  const [filesToSend, setFilesToSend] = useState([]);
  const maxFiles = 10;
  

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();

  const endRef = useRef(null);
  
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data()?.messages || []);
    })

    return () => {
      unSub();
    };
  }, [chatId]);

  const handleEmoji = e => {
    setText(prev => prev + e.emoji);
    setOpen(false);
  };

  const handleFile = e => {
  const selectedFiles = e.target.files;
  if (selectedFiles.length > 0) {
    const newFiles = Array.from(selectedFiles).slice(0, maxFiles);
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
    
    // Добавляем выбранные файлы в состояние filesToSend
    setFilesToSend(prevFiles => [...prevFiles, ...newFiles]);
  }
};

  const handleSend = async () => {
  try {
    if (text.trim() !== "") {
      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          senderId: currentUser.id,
          text,
          createdAt: new Date(),
        }),
      });
    }

    if (filesToSend.length > 0) {
      for (const file of filesToSend) {
        const fileUrl = await upload(file);
        await updateDoc(doc(db, "chats", chatId), {
          messages: arrayUnion({
            senderId: currentUser.id,
            file: { url: fileUrl, name: file.name },
            createdAt: new Date(),
          }),
        });
      }
    }

    const userIDs = [currentUser.id, user.id];

    userIDs.forEach(async (id) => {
      const userChatsRef = doc(db, "userchats", id);
      const userChatsSnapshot = await getDoc(userChatsRef);

      if (userChatsSnapshot.exists()) {
        const userChatsData = userChatsSnapshot.data();

        const chatIndex = userChatsData.chats.findIndex((c) => c.chatId === chatId);

        if (chatIndex !== -1) {
          userChatsData.chats[chatIndex].lastMessage =
            text || (filesToSend.length > 0 ? filesToSend[filesToSend.length - 1].name : "");
          userChatsData.chats[chatIndex].isSeen = id === currentUser.id ? true : false;
          userChatsData.chats[chatIndex].updatedAt = Date.now();

          await updateDoc(userChatsRef, {
            chats: userChatsData.chats,
          });
        }
      }
    });

    setText("");
    setFiles([]);
    setFilesToSend([]);
  } catch (err) {
    console.log(err);
  }
};


  const uploadFile = async (file) => {
    const fileRef = ref(storage, `files/${file.name}`);
    return uploadBytesResumable(fileRef, await fetch(file.url).then((response) => response.blob()));
  };


  const handleAttachAll = async () => {
  try {
    const userDocumentsRef = collection(db, `users/${currentUser.id}/documents`);
    const userDocumentsSnapshot = await getDocs(userDocumentsRef);

    const filesToSend = [];
    for (const doc of userDocumentsSnapshot.docs) {
      const documentData = doc.data();
      const fileUrl = documentData.fileUrl;
      const fileName = documentData.fileName;
      const existingFileIndex = chat.findIndex(
        (message) => message.file && message.file.url === fileUrl
      );

      if (existingFileIndex === -1 && !isCurrentUserBlocked) {
        filesToSend.push({ url: fileUrl, name: fileName });
      }
    }

    if (filesToSend.length === 0) {
      console.log("No new files to send.");
      return; 
    }

    for (const file of filesToSend) {
    const fileRef = ref(storage, `files/${file.name}`);
    const uploadTask = uploadBytesResumable(fileRef, await fetch(file.url).then((response) => response.blob()));

    uploadTask.on('state_changed',
      null,
      error => console.error(error),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

        await updateDoc(doc(db, "chats", chatId), {
          messages: arrayUnion({
            senderId: currentUser.id,
            file: {
              url: downloadURL,
              name: file.name,
              type: file.type || "application/octet-stream", 
            },
            createdAt: new Date(),
          }),
        });
      }
    );
  }

    // Update user chats with last message and seen status
    // ... (code remains the same as before)

    console.log("Documents sent to chat successfully");
  } catch (error) {
    console.error("Error sending documents to chat:", error);
  }
};



  return (
    <div className='chat'>
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{user?.username}</span>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="" />
          <img src="./info.png" alt="" />
        </div>
      </div>

      <div className="center">
        {chat.map((message, index) => (
          <div className={message.senderId === currentUser?.id ? "message own" : "message"} key={index}>
            <div className="texts">
              {message.img && <img src={message.img} alt="" />}
              {message.file && !message.img && (
                <div>
                  <img src="./file.png" alt="" className="fileimg"/>
                  <a href={message.file.url} target="_blank" rel="noopener noreferrer" download={message.file.name}>{message.file.name}</a>
                </div>
              )}
              <p>{message.text}</p>
            </div>
          </div>
        ))}
        <div ref={endRef}></div>
      </div>

      <div className="bottom">
        <div className="icons">
          <label htmlFor="file"><img src="./attach.png" alt="" /></label>
          <input type="file" id="file" style={{ display: "none" }} onChange={handleFile} multiple />
          <img src="./attach-all.png" alt="" onClick={handleAttachAll} disabled={isCurrentUserBlocked || isReceiverBlocked}/>
        </div>
        <input
          type="text"
          placeholder={(isCurrentUserBlocked || isReceiverBlocked)
            ? "You can't send a message"
            : "Type a message..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div className="emoji">
          <img src="./emoji.png" alt="" onClick={() => setOpen(prev => !prev)} />
          <div className="picker">
            <EmojiPicker open={open} onEmojiClick={handleEmoji} />
          </div>
        </div>
        <button className="sendButton" onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked}>Send</button>
      </div>
    </div>
  );
};

export default Chat;