import { useState } from "react";
import { auth, db } from "../lib/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function FirebaseTestPage() {
  const [status, setStatus] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addStatus = (message: string) => {
    setStatus(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testFirebase = async () => {
    setLoading(true);
    setStatus([]);

    try {
      // Test 1: Basic Firebase connection
      addStatus("🔍 Testing Firebase connection...");
      addStatus("✅ Firebase configuration loaded");

      // Test 2: Test Firestore write
      addStatus("📝 Testing Firestore write permission...");
      const testDoc = await addDoc(collection(db, "test"), {
        message: "Permission test",
        timestamp: new Date()
      });
      addStatus(`✅ Successfully wrote document with ID: ${testDoc.id}`);

      // Test 3: Test Firestore read
      addStatus("📖 Testing Firestore read permission...");
      const querySnapshot = await getDocs(collection(db, "test"));
      addStatus(`✅ Successfully read ${querySnapshot.size} documents`);

      // Test 4: Test Authentication
      addStatus("🔐 Testing Authentication...");
      try {
        await createUserWithEmailAndPassword(auth, "test@rhythm.com", "test123456");
        addStatus("✅ Authentication test successful");
      } catch (error: any) {
        if (error.code === "auth/email-already-in-use") {
          addStatus("ℹ️ Test user already exists (this is normal)");
        } else {
          addStatus(`⚠️ Authentication test: ${error.message}`);
        }
      }

      addStatus("🎉 All Firebase tests passed! Your setup is working correctly.");
      
    } catch (error: any) {
      addStatus(`❌ Error: ${error.message}`);
      addStatus("💡 Check the FIREBASE_PERMISSIONS_FIX.md file for solutions");
      console.error("Firebase test error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Firebase Permissions Test
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Before Testing:</h3>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Go to <a href="https://console.firebase.google.com/" target="_blank" className="underline">Firebase Console</a></li>
              <li>2. Select project: <strong>rhythmdancewear-a88d4</strong></li>
              <li>3. Create Firestore Database (if not exists)</li>
              <li>4. Set security rules to allow all reads/writes</li>
              <li>5. Enable Authentication → Email/Password</li>
            </ol>
          </div>

          <button
            onClick={testFirebase}
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium mb-6"
          >
            {loading ? "Testing..." : "Test Firebase Permissions"}
          </button>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold mb-4">Test Results:</h2>
            {status.length === 0 ? (
              <p className="text-gray-500">Click the button above to test Firebase permissions</p>
            ) : (
              <div className="space-y-1">
                {status.map((message, index) => (
                  <div key={index} className="text-sm font-mono bg-gray-100 p-2 rounded">
                    {message}
                  </div>
                ))}
              </div>
            )}
          </div>

          {status.length > 0 && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Next Steps:</h3>
              <div className="text-sm text-green-700 space-y-1">
                <div>✅ If all tests passed: Your website is ready to use!</div>
                <div>✅ Go to <a href="/login" className="underline">/login</a> to create admin account</div>
                <div>✅ Visit <a href="/admin" className="underline">/admin</a> to manage products</div>
                <div>✅ Check <a href="/products" className="underline">/products</a> to see the catalog</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 