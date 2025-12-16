require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { initializeApp} = require('firebase/app');
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
const port = process.env.PORT || 4000;

// Coneccion a MongoDatos

const uri = process.env.MONGO_URI || `mongodb+srv://${user}:${encodeURIComponent(contra)}@${process.env.MONGO_CLUSTER || process.env.MONGO_DB}.apsvp5k.mongodb.net/${dbName}?retryWrites=true&w=majority&appName=${dbName}`;
const client = new MongoClient(uri, {serverAPI: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
}})

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
    console.log(`Conectando a MongoDB en: ${uri}`);
}).catch(err => {
    console.error('Error al conectar a MongoDB:', err);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);  
});

app.get('/', (req,res) => {
    res.json({mensaje: 'Backend funcionado correctamnente' });
});

// Crear un nuevo post
app.post('/createPost', async (req, res) => {
  try {
    const { title, content, authorId } = req.body;
    if (!title || !content || !authorId) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    const result = await db.collection('post').insertOne({ title, content, authorId });
    res.status(201).json({ Mensaje: 'Post creado exitosamente', postId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear el post' });
  }
});

// Listar todos los posts
app.get('/listPost', async (req, res) => {
  try {
    const posts = await db.collection('post').find().toArray();
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener los posts' });
  }
});

// Editar un post existente
app.put('/editPost/:id', async (req, res) => {
  try {
    const { title, content, authorId } = req.body;
    const { id } = req.params;
    if (!title || !content || !authorId) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    const result = await db.collection('post').updateOne(
      { _id: new ObjectId(id) },
      { $set: { title, content, authorId } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }
    res.json({ mensaje: 'Post actualizado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar el post' });
  }
});

// Eliminar un post
app.delete('/deletePost/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.collection('post').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }
    res.json({ mensaje: 'Post eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar el post' });
  }
});

