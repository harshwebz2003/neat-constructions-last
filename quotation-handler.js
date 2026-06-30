/**
 * NEAT Construction & Hospitality Services
 * Contact Form and Quotation Processor – quotation-handler.js
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCMjf-Z__ACJ3I5iYwO1iYHD7uckmU8YDs",
  authDomain: "ai-agent-424ba.firebaseapp.com",
  projectId: "ai-agent-424ba",
  storageBucket: "ai-agent-424ba.firebasestorage.app",
  messagingSenderId: "789847240009",
  appId: "1:789847240009:web:dcbb3f56261bda44e57e98",
  measurementId: "G-N3E9XMZXX8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.handleSubmit = async function(e) {
  e.preventDefault();
  
  const form = document.getElementById('cform');
  const submitBtn = document.getElementById('sbtn');
  const submitText = document.getElementById('stxt');
  const submitArrow = document.getElementById('sarr');
  const successMessage = document.getElementById('fsuc');

  if (!form || !submitBtn) return;

  // Extract Form Data
  const rawName = form.name.value.trim();
  const rawEmail = form.email.value.trim();
  const rawPhone = form.phone.value.trim() || 'Not Provided';
  const rawServiceValue = form.service.value;
  const rawMessage = form.message.value.trim();

  // Get nice labels for services
  const serviceLabels = {
    construction: 'Construction of Buildings & Warehouses',
    renovation: 'Renovations & Remodeling',
    glass: 'Glass & Mirror Works',
    hospitality: 'Hospitality Services'
  };
  const serviceName = serviceLabels[rawServiceValue] || rawServiceValue;

  const formData = {
    name: rawName,
    email: rawEmail,
    phone: rawPhone,
    service: serviceName,
    message: rawMessage,
    timestamp: new Date().toISOString()
  };

  // UI state change to processing
  if (submitText) submitText.textContent = 'Processing...';
  if (submitArrow) submitArrow.style.display = 'none';
  submitBtn.style.opacity = '.7';
  submitBtn.disabled = true;

  // 1. Save to Firebase Firestore (leads collection)
  try {
    await addDoc(collection(db, "leads"), formData);
    console.log('Successfully saved lead to Firebase Firestore.');
  } catch (error) {
    console.error('Failed to save to Firebase:', error);
  }

  // 2. Log quotation query to localStorage for local trace
  try {
    const savedQuotations = JSON.parse(localStorage.getItem('neat_quotations') || '[]');
    savedQuotations.push(formData);
    localStorage.setItem('neat_quotations', JSON.stringify(savedQuotations));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }

  // 3. Sync quotation to backend local server database
  try {
    await fetch('/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
  } catch (err) {
    console.error('Error syncing quotation with backend server:', err);
  }

  // 4. Send email submission via Web3Forms
  try {
    const web3FormData = new FormData();
    web3FormData.append('access_key', 'fbcff3ff-b20a-4a13-880d-4f5d74c0629c');
    web3FormData.append('subject', `New Lead: ${rawName} (${serviceName})`);
    web3FormData.append('name', rawName);
    web3FormData.append('email', rawEmail);
    web3FormData.append('phone', rawPhone);
    web3FormData.append('service', serviceName);
    web3FormData.append('message', rawMessage);
    
    await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: web3FormData
    });
    console.log('Successfully submitted lead to Web3Forms (Email).');
  } catch (err) {
    console.error('Error submitting to Web3Forms:', err);
  }

  // Show success state
  submitBtn.style.display = 'none';
  if (successMessage) {
    successMessage.classList.remove('hidden');
    gsap.fromTo(successMessage, 
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    );
  }

  // 5. WhatsApp Redirection
  const waText = `Hello NEAT Construction & Hospitality Services, I would like to request a quote.

*Name:* ${rawName}
*Email:* ${rawEmail}
*Phone:* ${rawPhone}
*Service:* ${serviceName}
*Details:* ${rawMessage}`;

  const waUrl = `https://wa.me/97450507769?text=${encodeURIComponent(waText)}`;
  
  // Redirect to WhatsApp after 1 second so user sees success message
  setTimeout(() => {
    form.reset();
    window.location.href = waUrl;
  }, 1000);
}
