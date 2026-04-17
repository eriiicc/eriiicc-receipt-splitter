import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAY8oIcons3ym5_kr2jWer6_HIOHHJuCKQ",
  authDomain: "YOUR_Areceipt-splitter-d03cb.firebaseapp.comUTH_DOMAIN",
  projectId: "receipt-splitter-d03cb",
  storageBucket: "YOUR_Sreceipt-splitter-d03cb.firebasestorage.appTORAGE_BUCKET",
  messagingSenderId: "351911635604",
  appId: "1:351911635604:web:4d78ab7c44c2f5f4302281"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);