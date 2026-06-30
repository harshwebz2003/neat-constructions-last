import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCMjf-Z__ACJ3I5iYwO1iYHD7uckmU8YDs",
  authDomain: "ai-agent-424ba.firebaseapp.com",
  projectId: "ai-agent-424ba",
  storageBucket: "ai-agent-424ba.firebasestorage.app",
  messagingSenderId: "789847240009",
  appId: "1:789847240009:web:dcbb3f56261bda44e57e88",
  measurementId: "G-N3E9XMZXX8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ImgBB API Key
const IMGBB_API_KEY = "8403cea9381e8e16db2f1308b4de0e82";

// Image Upload to ImgBB and then save to Firestore
async function handleImageUpload(fileInputId, firebaseFieldName) {
  const fileInput = document.getElementById(fileInputId);
  const file = fileInput?.files[0];
  
  if (!file) return;

  console.log("Uploading image to ImgBB...");
  
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      const directImageUrl = result.data.url;
      console.log("Upload Success! URL:", directImageUrl);

      await setDoc(doc(db, "siteData", "homePage"), {
        [firebaseFieldName]: directImageUrl,
        lastUpdated: new Date()
      }, { merge: true });

      alert("Image Uploaded & Saved Successfully!");
    } else {
      alert("Upload failed. Check ImgBB API Key.");
    }
  } catch (error) {
    console.error("Error uploading image:", error);
    alert("Error uploading image.");
  }
}

// Auto-Save logic to Firebase Firestore
async function saveFieldToFirebase(fieldName, value) {
  try {
    await setDoc(doc(db, "siteData", "homePage"), {
      [fieldName]: value,
      lastUpdated: new Date()
    }, { merge: true });
    console.log(`${fieldName} successfully saved to Firebase!`);
  } catch (error) {
    console.error("Firebase Save error: ", error);
  }
}

// Bind input/change event listeners once DOM is ready
function setupFirebaseListeners() {
  document.getElementById('heroTitleInput')?.addEventListener('input', (e) => {
    saveFieldToFirebase('heroTitle', e.target.value);
  });

  document.getElementById('testi1Input')?.addEventListener('input', (e) => {
    saveFieldToFirebase('testimonial1', e.target.value);
  });

  // Hero Background Upload
  document.getElementById('heroUpload')?.addEventListener('change', () => {
    handleImageUpload('heroUpload', 'heroBgImage');
  });

  // Construction Card Image Upload
  document.getElementById('constUpload')?.addEventListener('change', () => {
    handleImageUpload('constUpload', 'constructionImage');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupFirebaseListeners);
} else {
  setupFirebaseListeners();
}
