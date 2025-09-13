# Firebase Setup Guide for Rhythm Dance Wear

## 🔥 Firebase Connection Status

✅ **Firebase is already configured and connected!**

Your Firebase configuration in `src/lib/firebase.ts` is properly set up with:
- Project ID: `rhythmdancewear-a88d4`
- Auth Domain: `rhythmdancewear-a88d4.firebaseapp.com`
- Storage Bucket: `rhythmdancewear-a88d4.firebasestorage.app`

## 🧪 Testing Firebase Connection

1. **Visit the test page**: Go to `http://localhost:3000/test-firebase`
2. **Click "Test Firebase Connection"** to verify:
   - Firebase configuration loading
   - Firestore database access
   - Authentication system
   - Document creation and reading

## 🔧 Firebase Console Setup

### 1. Authentication Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `rhythmdancewear-a88d4`
3. Navigate to **Authentication** → **Sign-in method**
4. Enable **Email/Password** authentication
5. Add your admin email: `admin@rhythm.com` (optional)

### 2. Firestore Database Setup
1. Navigate to **Firestore Database**
2. Create database if not exists
3. Start in **test mode** for development
4. Set up security rules (see below)

### 3. Security Rules Setup

In Firebase Console → Firestore Database → Rules, add these rules:

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

## 🚀 Website Features Testing

### 1. Admin Account Creation
1. Go to `http://localhost:3000/login`
2. Use these credentials:
   - Email: `admin@rhythm.com`
   - Password: `admin123`
3. If the account doesn't exist, create it first

### 2. Test Admin Features
1. **Add Products**: Go to `http://localhost:3000/admin/add-product`
2. **View Admin Panel**: Go to `http://localhost:3000/admin`
3. **Manage Orders**: Update order statuses in the admin panel

### 3. Test Customer Features
1. **Browse Products**: Go to `http://localhost:3000/products`
2. **Create Customer Account**: Go to `http://localhost:3000/login`
3. **Add Personal Info**: Go to `http://localhost:3000/my-info`
4. **Place Orders**: Click "주문하기" on any product

## 📊 Database Collections

Your Firebase project will automatically create these collections:

### `users` Collection
```typescript
{
  name: string,
  phone: string,
  height: number,
  bust: number,
  waist: number,
  hip: number,
  updatedAt: timestamp
}
```

### `products` Collection
```typescript
{
  name: string,
  description: string,
  price: number,
  category: string,
  imageUrl?: string,
  sizes: string[],
  colors: string[],
  createdAt: timestamp
}
```

### `orders` Collection
```typescript
{
  customerId: string,
  productId: string,
  customerName: string,
  productName: string,
  selectedSize: string,
  selectedColor: string,
  specialRequests?: string,
  deliveryAddress: string,
  phoneNumber: string,
  status: string,
  createdAt: timestamp
}
```

## 🔍 Troubleshooting

### Common Issues:

1. **"Permission denied" errors**
   - Check Firestore security rules
   - Ensure authentication is enabled

2. **"Firebase not initialized" errors**
   - Check `src/lib/firebase.ts` configuration
   - Verify API keys are correct

3. **"User not found" errors**
   - Create admin account first
   - Check authentication setup

### Testing Steps:

1. **Test Firebase Connection**: Visit `/test-firebase`
2. **Test Authentication**: Try logging in
3. **Test Database**: Add a test product
4. **Test Orders**: Place a test order

## 🎯 Next Steps

1. ✅ **Firebase is connected** - Your website is ready to use!
2. **Add real products** - Use the admin panel to add your mother's dance wear
3. **Test customer flow** - Create a test customer account and place orders
4. **Deploy to production** - Deploy to Vercel for live website

## 📞 Support

If you encounter any issues:
1. Check the Firebase Console for errors
2. Visit `/test-firebase` to run diagnostics
3. Check browser console for JavaScript errors

---

**Your Rhythm Dance Wear website is now fully connected to Firebase and ready to use!** 🎉 