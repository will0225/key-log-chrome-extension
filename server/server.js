const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 5000;
const cors = require('cors');
const db = require('./config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
// Middleware to parse JSON bodies
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors({
    origin: process.env.APP_URL,  // Allow requests from this domain
    methods: ['GET', 'POST'],        // Allow only GET and POST requests
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow certain headers
  }));
// Routes
// Error middleware
let logs = [];

function timeDifference(timestamp1, timestamp2) {
    console.log(timestamp1, timestamp2)
    var difference = Math.abs(timestamp1 - timestamp2);
    var daysDifference = Math.floor(difference/1000/60/60/24);
    
    difference -= daysDifference*1000*60*60*24

    var hoursDifference = Math.floor(difference/1000/60/60);
    difference -= hoursDifference*1000*60*60

    var minutesDifference = Math.floor(difference/1000/60);
    difference -= minutesDifference*1000*60

    var secondsDifference = Math.floor(difference/1000);
    console.log(secondsDifference, "secondsDifference")
    return secondsDifference;
}

// User registration endpoint
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
  
    // Check if user already exists
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length > 0) return res.status(400).json({ message: 'User already exists' });
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Save new user to the database
      db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'User registered successfully' });
      });
    });
  });
  
  // User login endpoint
app.post('/api/login', (req, res) => {
const { email, password } = req.body;

// Check if the user exists
db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(400).json({ message: 'User not found' });

    // Compare password with hashed password
    const user = results[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.status(400).json({ message: 'Invalid password' });

    // Create JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '1h', // token expires in 1 hour
    });

    res.status(200).json({ message: 'Login successful', token });
});
});


// Protected route (example)
app.get('/api/dashboard', (req, res) => {
    const token = req.headers['authorization'];
  
    if (!token) return res.status(401).json({ message: 'No token provided' });
  
    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Invalid token' });
      res.status(200).json({ message: 'Welcome to the dashboard', user: decoded });
    });
});
  

app.post('/api/search', (req, res) => {
    const token = req.headers['authorization'];
    
    if (!token) return res.status(401).json({ message: 'No token provided' });
    
    const { searchLog, searchDate } = req.body;
    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Invalid token' });
      db.query('SELECT * FROM logs WHERE log LIKE ? AND update_date > ?', [`%${searchLog}%`, searchDate], async (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(200).json({ data: results, user: decoded });
      })
    });
});
  


// Endpoint to log activity
app.post('/log', (req, res) => {
  const logData = req.body;
  logs.push(logData);
  console.log('Activity logged:', logData);
  const newLogo = {
    log: logData.data,
    site: logData.site,
    date: logData.timestamp,
    time: logData.currentTime,
    update_date: logData.timestamp
  };

  // getting time 2 min age
  if(typeof logData.data == "string")
  {
    db.query('SELECT * FROM logs WHERE site="'+logData.site+'"', (error, result) => {
        console.log(result)
        var filterResult = result;
        if(filterResult == "undefined" || filterResult.length == 0) {
            db.query('INSERT INTO logs SET ?', newLogo, (error, result) => {
                if (error) throw error;
                res.status(200).send({ message: 'Log saved successfully' });
            });
        } else {
            console.log("DB update")
            var specifiedId = filterResult[0].id;
            console.log(logData.data, "updateId", filterResult[0].log);
            // Define the query with placeholders
            const updateQuery = "UPDATE logs SET log = ?, update_date = ? WHERE id = ?";
            // The values to be inserted into the query (this will escape values automatically)
            var updateLog = `${filterResult[0].log}`+" "+`${logData.data}`;
            const updateValues = [updateLog, logData.timestamp, specifiedId];
            db.execute(updateQuery, updateValues, (err, results) => {
                if (error) throw error;
                res.status(200).send({ message: 'Log updated successfully' });
            });
        }
    });
  }
});

// Endpoint to clear logs
app.post('/clearLogs', (req, res) => {
  logs = [];
  console.log('Logs cleared');
  res.status(200).send({ message: 'Logs cleared' });
});

// Serve logs as an API (for displaying in the popup, etc.)
app.get('/logs', (req, res) => {
    db.query("SELECT * FROM logs", (error, results) => {
        // res.json(results);
        res.status(200).send({ data: results });
    });
    
});


app.post('/screenshots', (req, res) => {
    const logData = req.body;
    const newData = {
        screenshot: logData.data,
        site: logData.site,
        date: logData.timestamp,
    };
    // console.log(newData, "screenshot data");
    db.query('INSERT INTO screenshots SET ?', newData, (error, result) => {
        if (error) throw error;
        res.status(200).send({ message: 'screenshot saved successfully' });
    });
});


app.get('/screenshots', (req, res) => {
    db.query("SELECT * FROM screenshots", (error, results) => {
        // res.json(results);
        res.status(200).send({ data: results });
    });
    
});
  


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


