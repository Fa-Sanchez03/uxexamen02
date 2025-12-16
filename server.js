require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { initializaApp} = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const app = express();
app.use(express.json());

app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

const user = process.env.MONGO_USER;
const contra = process.env.MONGO_PASS;
const dbName = process.env.MONGO_DB;
const port = process.env.PORT || 3000;

const uri = `mongodb+srv://${user}:${contra}@${dbName}.apsvp5k.mongodb.net/?retryWrites=true&w=majority&appName=${dbName}`;
const client = new MongoClient(uri, {serverApi: {version: ServerApiVersion.v1, strict: true, deprecationErrors: true}});

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

let db;
client.connect().then(() => {
    db = client.db(dbName);
    console.log('MongoDB conectado');
}).catch(err => {
    console.error('Error al conectar a MongoDB:', err);
});

app.get('/', (req,res) => {
    res.json({mensaje: 'Backend funcionado correctamnente' });
});

