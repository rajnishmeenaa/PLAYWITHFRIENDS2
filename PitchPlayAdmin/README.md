# PitchPlay Admin App 📱

A dedicated **React Native (Expo)** admin app to manage your PitchPlay fantasy cricket platform directly from your Android/iOS phone.

---

## 📲 Features

| Screen | What you can do |
|--------|----------------|
| **Dashboard** | Live stats — revenue, contests, users, pending payouts |
| **Contests** | Create / settle / delete contests, view fill rate |
| **Users** | Search users, block/unblock, adjust wallet balance |
| **Payouts** | Approve/reject withdrawal requests with UPI info |
| **Settings** | Set Razorpay keys, UPI ID, withdrawal limits |

---

## ⚙️ Setup

### 1. Set Your Backend URL

Edit [`src/api.js`](./src/api.js) and change `BASE_URL`:

```js
// Local development
export const BASE_URL = 'http://192.168.x.x:8000'; // your phone's WiFi IP

// Production (Render/Railway)
export const BASE_URL = 'https://your-backend.onrender.com';
```

> **Important:** When testing on a physical phone, use your PC's **local WiFi IP** (e.g. `192.168.1.5`), not `localhost`.

### 2. Install Dependencies

```powershell
cd PitchPlayAdmin
npm install --legacy-peer-deps
```

### 3. Run in Expo Go (Quick Test)

```powershell
npx expo start
```

Scan the QR code with **Expo Go** app on your phone.

---

## 📦 Build APK (Install on Phone)

### Option A: EAS Build (Cloud — Recommended)

1. Create free account at [expo.dev](https://expo.dev)
2. Login: `npx eas login`
3. Build APK: `npx eas build --platform android --profile apk`
4. Download the `.apk` file and install on your phone

### Option B: Local Build (Requires Android Studio)

```powershell
npx expo prebuild
npx expo run:android
```

---

## 🔐 Admin Login

- **Mobile:** `9602341799`
- **Password:** `admin123`

You can change these in your backend `.env` file:
```
ADMIN_MOBILE=9602341799
ADMIN_PASSWORD=your_new_password
```

---

## 🏗️ Project Structure

```
PitchPlayAdmin/
├── app/
│   ├── _layout.jsx          # Root layout
│   ├── index.jsx            # Redirect to login
│   ├── login.jsx            # Admin login screen
│   └── (tabs)/
│       ├── _layout.jsx      # Tab navigator
│       ├── dashboard.jsx    # 📊 Stats dashboard
│       ├── contests.jsx     # 🏆 Contest management
│       ├── users.jsx        # 👥 User management
│       ├── withdrawals.jsx  # 💰 Payout approvals
│       └── settings.jsx     # ⚙️ Payment settings
├── src/
│   ├── api.js               # Axios client
│   └── theme.js             # Design tokens
├── app.json                 # Expo config
├── eas.json                 # EAS build profiles
└── package.json
```

---

## 🔄 Updating Backend URL for Production

Once your backend is deployed (e.g. on Render), update `src/api.js`:

```js
export const BASE_URL = 'https://pitchplay-backend.onrender.com';
```

Then rebuild the APK.
