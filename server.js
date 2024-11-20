var express = require("express");
let app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json());
app.set('json spaces', 3);
const path = require('path');
let PropertiesReader = require("properties-reader");

// Load properties from the file
let propertiesPath = path.resolve(__dirname, "./dbconnection.properties");
let properties = PropertiesReader(propertiesPath);

// Extract values from the properties file
const dbPrefix = properties.get('db.prefix');
const dbHost = properties.get('db.host');
const dbName = properties.get('db.name');
const dbUser = properties.get('db.user');
const dbPassword = properties.get('db.password');
const dbParams = properties.get('db.params');

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// MongoDB connection URL
const uri = `${dbPrefix}${dbUser}:${dbPassword}${dbHost}${dbParams}`;
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

let db1;
app.use(express.static(path.join(__dirname)));

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    db1 = client.db(dbName); // Connect to Lesson_Booking DB
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}

connectDB();


// Reference to the lessons collection
const lessonsCollection = () => db1.collection('lessons');

// Serve your index.html file when accessing the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Get all lessons
app.get('/lessons', async function (req, res) {
  try {
    const lessons = await lessonsCollection().find({}).toArray();
    res.json(lessons);
  } catch (err) {
    console.error('Error fetching lessons:', err);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// Get a single lesson by ID
app.get('/lessons/:id', async function (req, res) {
  try {
    const lesson = await lessonsCollection().findOne({ _id: new ObjectId(req.params.id) });
    if (lesson) {
      res.json(lesson);
    } else {
      res.status(404).json({ error: 'Lesson not found' });
    }
  } catch (err) {
    console.error('Error fetching lesson by ID:', err);
    res.status(500).json({ error: 'Failed to fetch lesson by ID' });
  }
});

// Add a new lesson
app.post('/lessons', async function (req, res) {
    try {
      const lesson = req.body;
      const result = await lessonsCollection().insertOne(lesson);
      if (result.acknowledged) {
        const insertedLesson = await lessonsCollection().findOne({ _id: result.insertedId });
        res.status(201).json(insertedLesson);
      } else {
        res.status(500).json({ error: 'Failed to add lesson' });
      }
    } catch (err) {
      console.error('Error adding lesson:', err);
      res.status(500).json({ error: 'Failed to add lesson' });
    }
  });

// Update a lesson by ID
app.put('/lessons/:id', async function (req, res) {
  try {
    const updatedLesson = req.body;
    const result = await lessonsCollection().updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedLesson }
    );
    if (result.modifiedCount > 0) {
      res.json({ message: 'Lesson updated successfully' });
    } else {
      res.status(404).json({ error: 'Lesson not found' });
    }
  } catch (err) {
    console.error('Error updating lesson:', err);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

// Delete a lesson by ID
app.delete('/lessons/:id', async function (req, res) {
  try {
    const result = await lessonsCollection().deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount > 0) {
      res.json({ message: 'Lesson deleted successfully' });
    } else {
      res.status(404).json({ error: 'Lesson not found' });
    }
  } catch (err) {
    console.error('Error deleting lesson:', err);
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'An error occurred' });
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
