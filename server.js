const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// MongoDB setup
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const Schema = mongoose.Schema;

// MongoDB Schemas
const user = new Schema({
  username: { type: String, required: true }
}, { versionKey: false });
const User = mongoose.model("User", user);

const exercise = new Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { versionKey: false });
const Exercise = mongoose.model("Exercise", exercise);

// Controllers
app.post("/api/users", async (req, res) => {
  const { username } = req.body;

  // Create entry with the given url
  const createdUser = await User.create({ username });

  res.json(createdUser);

});

app.get("/api/users", async (req, res) => {

  // Return all users
  const allUsers = await User.find();

  res.json(allUsers);

});


app.post("/api/users/:_id/exercises", async (req, res) => {
  const userId = req.params._id;
  const { description } = req.body;
  const { duration } = req.body;
  let { date } = req.body;

  if (!date) {
    date = new Date();
  } else {
    date = new Date(date);
  }

  const userFound = await User.findById(userId);

  if (!userFound) {
    res.json({ error: "Id is not valid." });
  }

  // Create entry with the given url
  const createdExercise = await Exercise.create({ user: userFound._id, description, duration, date });

  // Create the returned object
  const returnedExerciseObj = { username: userFound.username, description: createdExercise.description, duration: createdExercise.duration, date: new Date(createdExercise.date).toDateString(), _id: createdExercise.user };

  res.json(returnedExerciseObj);

});

app.get("/api/users/:_id/logs", async (req, res) => {
  const userId = req.params._id;
  let logLimit = parseInt(req.query.limit, 10);
  let dateFrom = req.query.from;
  let dateTo = req.query.to;

  if (!logLimit) {
    logLimit = 0;
  }

  const userFound = await User.findById(userId);

  if (!userFound) {
    res.json({ error: "Id is not valid." });
  }

  const userExercises = await Exercise.find({ user: userFound._id }).limit(logLimit).lean();
  const logs = userExercises.map(({ date, ...rest }) => ({ ...rest, date: new Date(date).toDateString() }));

  const count = userExercises.length;

  const userLogs = { ...userFound._doc, count, log: logs };

  res.json(userLogs);

});

const port = 8080;
const listener = app.listen(port, () => {
  console.log('Your app is listening on port ' + listener.address().port + '.')
})
