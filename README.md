# Handiman Project - פלטפורמה לחיבור לקוחות עם הנדימנים

פלטפורמה דיגיטלית שמחברת בין לקוחות לבין בעלי מקצוע (הנדימנים) לביצוע עבודות שירות ותיקונים.

## 🚀 טכנולוגיות

### Frontend

- **Vue.js 3** - Framework ל-frontend
- **Vue Router** - ניהול routing
- **Pinia/Vuex** - State management
- **Mapbox GL** - מפות ואיתור מיקום
- **Firebase** - Push notifications
- **Socket.io Client** - תקשורת בזמן אמת
- **Chart.js** - גרפים ודשבורד

### Backend

- **Node.js + Express** - שרת API
- **MongoDB** - מסד נתונים
- **Socket.io** - תקשורת בזמן אמת (צ'אט)
- **Stripe** - תשלומים ו-escrow
- **Passport.js** - אימות (Google OAuth)
- **AWS S3** - אחסון תמונות
- **OpenAI** - AI לניתוח עלויות
- **Resend** - שליחת אימיילים

## 📋 דרישות מקדימות

- Node.js (גרסה 14 ומעלה)
- npm או yarn
- MongoDB Atlas (או MongoDB מקומי)
- חשבונות שירות:
  - Google Maps API Key
  - Stripe API Keys
  - AWS S3 (לאופציונלי)
  - Firebase (לאופציונלי)
  - OpenAI API Key (לאופציונלי)

## 🔧 התקנה

1. שכפל את הפרויקט:

```bash
git clone <repository-url>
cd hendiman-project
```

2. התקן את התלויות:

```bash
npm install
```

3. צור קובץ `.env` בתיקיית `server/`:

```env
PORT=3003
MONGODB_URI=your_mongodb_connection_string
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BUCKET_NAME=your_bucket_name
OPENAI_API_KEY=your_openai_api_key
RESEND_API_KEY=your_resend_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
```

## 🏃 הרצת הפרויקט

### פיתוח (Development)

הרץ את השרת והקליינט במקביל:

**טרמינל 1 - Backend Server:**

```bash
npm run server
```

השרת ירוץ על פורט **3003** (או פורט פנוי אחר)

**טרמינל 2 - Frontend Client:**

```bash
npm run serve
```

הקליינט ירוץ על פורט **8080**

### ייצור (Production)

```bash
npm run build
npm start
```

## 📁 מבנה הפרויקט

```
hendiman-project/
├── server/                 # Backend - Express Server
│   ├── API/               # קבצי JSON (קטגוריות, נתונים)
│   ├── config/            # הגדרות (DB, Passport, S3)
│   ├── routes/            # Routes (auth, upload)
│   ├── services/          # שירותים (Stripe, Push, AI, Receipts)
│   └── server.js          # קובץ השרת הראשי
├── src/                   # Frontend - Vue.js
│   ├── components/        # קומפוננטות Vue
│   │   ├── Admin/         # פאנל ניהול
│   │   ├── Dashboard/     # דשבורד משתמשים
│   │   └── Global/        # קומפוננטות גלובליות
│   ├── views/             # דפים ראשיים
│   ├── router/            # הגדרות routing
│   ├── store/             # State management
│   └── utils/             # כלי עזר
├── public/                # קבצים סטטיים
└── package.json           # תלויות וסקריפטים
```

## 🎯 תכונות עיקריות

### לקוחות

- יצירת בקשות עבודה
- חיפוש הנדימנים לפי מיקום וקטגוריה
- צ'אט בזמן אמת עם הנדימנים
- תשלום מאובטח דרך Stripe
- דירוג והמלצות
- מעקב אחר עבודות

### הנדימנים

- ניהול פרופיל ומומחיות
- קבלת הצעות עבודה
- ניהול לוח זמנים
- תקשורת עם לקוחות
- קבלת תשלומים
- דשבורד הכנסות

### מנהלים

- ניהול משתמשים
- ניהול קטגוריות
- מעקב פיננסי
- ניהול ביטולים
- ניהול קבלות

## 🔐 אבטחה

- אימות באמצעות Passport.js (Google OAuth)
- Sessions מאובטחים
- תשלומים מאובטחים דרך Stripe Escrow
- CORS מוגדר
- Validation של קלט משתמש

## 📱 רספונסיביות

האפליקציה מותאמת לנייד ומסכי טאבלט, עם תמיכה מלאה ב-PWA.

## 🛠️ סקריפטים זמינים

- `npm run serve` - הרצת frontend בפיתוח
- `npm run server` - הרצת backend עם nodemon (auto-reload)
- `npm start` - הרצת backend בייצור
- `npm run build` - בניית frontend לייצור
- `npm run lint` - בדיקת קוד

## 📝 הערות

- השרת מחפש פורט פנוי אוטומטית אם 3003 תפוס
- הפורט נשמר ב-`src/Url/port.json` לפיתוח
- יש צורך בהגדרת משתני סביבה ב-`.env`

## 🌐 Production

האפליקציה מוכנה לפריסה ב-Heroku (ראה `Procfile`).

---

**גרסה:** 0.1.0  
**מצב:** בפיתוח
