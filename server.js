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
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
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

console.log('Firebase API Key:', process.env.FIREBASE_API_KEY);
console.log('Firebase Project ID:', process.env.FIREBASE_PROJECT_ID);


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

// Crear usuario en Firebase y MongoDB
app.post('/createUser', async (req, res) => {
  try {
    const { email, password, nombre, apellido } = req.body;
    if (!email || !password || !nombre || !apellido) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Guarda datos adicionales en MongoDB
    const result = await db.collection('baseExam').insertOne({
      email,
      nombre,
      apellido,
      firebaseId: userCredential.user.uid
    });
    res.status(201).json({
      mensaje: 'Usuario creado exitosamente en Firebase y MongoDB',
      idUsuarioMongo: result.insertedId,
      idUsuarioFirebase: userCredential.user.uid
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear el usuario', detalle: err.message });
  }
});

// Login de usuario
app.post('/logIn', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = await db.collection('baseExam').findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado en MongoDB' });
    }
    const posts = await db.collection('post').find({ authorId: user.firebaseId }).toArray();
    res.json({
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      posts
    });
  } catch (err) {
    res.status(401).json({ error: 'Credenciales inválidas o usuario no encontrado' });
  }
});

// Logout (solo mensaje)
app.post('/logOut', (req, res) => {
  res.json({ mensaje: 'Que tengas un lindo dia, hasta luego' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});