# 🔧 Firebase Permissions Fix Guide

## 🚨 Error: "Missing or insufficient permissions"

This error occurs because Firebase Firestore security rules are not properly configured. Here's how to fix it:

## 📋 Step-by-Step Fix

### 1. Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `rhythmdancewear-a88d4`

### 2. Create Firestore Database (if not exists)
1. Go to **Firestore Database** in the left sidebar
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a location (choose the closest to your region)
5. Click **Done**

### 3. Set Security Rules
1. In Firestore Database, click on the **Rules** tab
2. Replace the existing rules with this code:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all reads and writes for development
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Click **Publish**

### 4. Enable Authentication
1. Go to **Authentication** in the left sidebar
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Enable **Email/Password**
5. Click **Save**

## 🧪 Test the Fix

### Option 1: Test via Browser
1. Go to `http://localhost:3000/login`
2. Try to create an account or login
3. Check if the error is gone

### Option 2: Test via Firebase Console
1. Go to Firestore Database
2. Try to manually create a document
3. If it works, the permissions are fixed

## 🔒 Production Security Rules

Once everything works, replace the test rules with secure rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Anyone can read products
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.email == "admin@rhythm.com";
    }
    
    // Users can read/write their own orders
    match /orders/{orderId} {
      allow read, write: if request.auth != null && 
        (resource.data.customerId == request.auth.uid || 
         request.auth.token.email == "admin@rhythm.com");
    }
    
    // Admin can read all users
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.token.email == "admin@rhythm.com";
    }
  }
}
```

## 🚨 Common Issues & Solutions

### Issue 1: "Database not found"
**Solution**: Create the Firestore database first

### Issue 2: "Authentication not enabled"
**Solution**: Enable Email/Password authentication

### Issue 3: "Rules not published"
**Solution**: Make sure to click "Publish" after updating rules

### Issue 4: "Wrong project selected"
**Solution**: Verify you're in the correct Firebase project: `rhythmdancewear-a88d4`

## 📱 Quick Test Commands

After fixing permissions, test these features:

1. **Create Admin Account**:
   - Go to `/login`
   - Email: `admin@rhythm.com`
   - Password: `admin123`

2. **Add Test Product**:
   - Login as admin
   - Go to `/admin/add-product`
   - Add a test product

3. **Test Customer Flow**:
   - Create customer account
   - Browse products
   - Place test order

## ✅ Success Indicators

You'll know it's fixed when:
- ✅ No more "Missing or insufficient permissions" errors
- ✅ Can create user accounts
- ✅ Can add products as admin
- ✅ Can place orders as customer
- ✅ Can view orders in admin panel

## 🆘 Still Having Issues?

If the error persists:

1. **Check Firebase Console** for any error messages
2. **Verify Project ID** matches `rhythmdancewear-a88d4`
3. **Clear Browser Cache** and try again
4. **Check Network Tab** in browser dev tools for specific error details

---

**After following these steps, your Firebase permissions should be resolved and the website will work perfectly!** 🎉 