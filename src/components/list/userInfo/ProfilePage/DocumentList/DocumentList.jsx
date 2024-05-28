import React, { useEffect, useState } from 'react';
import { useUserStore } from "../../../../../lib/userStore";
import { db, storage } from "../../.././../../lib/firebase";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { addDoc, collection, getDocs, query } from "firebase/firestore";
import upload from "../../../../../lib/upload"
import "./documentList.css";


const DocumentList = ({ onClose }) => {
  const { currentUser } = useUserStore();
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const getDocuments = async () => {
      if (!currentUser) return;  

      try {
        const q = query(collection(db, `users/${currentUser.id}/documents`));
        const querySnapshot = await getDocs(q);
        const documents = [];
        querySnapshot.forEach((doc) => {
          documents.push(doc.data());
        });
        setFiles(documents);
      } catch (error) {
        console.error('Error getting documents:', error);
      }
    };

    getDocuments();
  }, [currentUser.id]);

  const handleFileChange = (e) => {
    const fileList = e.target.files;
    const newFiles = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList.item(i);
      newFiles.push(file);
    }

    setFiles(newFiles);
  };


  const uploadFiles = async () => {
    const storageRef = ref(storage, `docs/${currentUser.id}`);

    files.forEach(async (file) => {
      try {
        const downloadURL = await upload(file);
        console.log("File uploaded successfully:", downloadURL);
        saveFileToProfile(currentUser.id, file.name, downloadURL);
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    });
    setFiles([]);
  };

  const saveFileToProfile = async (userId, fileName, downloadURL) => {
    try {
      const docRef = await addDoc(collection(db, `users/${userId}/documents`), {
        fileName,
        downloadURL,
        createdAt: new Date()
      });
      console.log("Document saved to user profile:", docRef.id);
    } catch (error) {
      console.error("Error saving document to user profile:", error);
    }
  };

  const openFile = (file) => {
    window.open(file.downloadURL, '_blank');
  };

  return (
    <div className="documentList">
      <img
        src="./close.png"
        alt="Close"
        className="closeButton"
        onClick={onClose}
      />
      <h2>My Documents</h2>
      <div className="documentInput">
        <input type="file" id="fileInput" multiple onChange={handleFileChange} />
        <button onClick={uploadFiles}>Upload Files</button>
      </div>
      <div className="documentContainer">
        {files.map((file, index) => (
          <div className="documentItem" key={index} onClick={() => openFile(file)}>
            <img src="./file.png" alt="File Icon" />
            <span>{file.fileName}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentList;