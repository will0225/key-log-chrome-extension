const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 5000;
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const db = require('./config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const crypto = require('crypto');

// Your secret key (This must be kept safe!)
const secretKey = 'mySecretKey1234567890mySecretKey1234'; // 16, 24, or 32 bytes for AES
const algorithm = 'aes-256-cbc'; // AES encryption algorithm

// Helper function to ensure the key length is correct for AES-256-CBC
const adjustKey = (key) => {
  return key.padEnd(32, ' ').slice(0, 32); // AES-256 needs a 32-byte key
};

// Encrypt function
function encrypt(username, password) {
  const combined = `${username}:${password}`; // Combine username and password with a delimiter (colon)

  // Create a random initialization vector (IV)
  const iv = crypto.randomBytes(16); // AES requires a 16-byte IV
  const key = adjustKey(secretKey);

  // Create a cipher instance
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);

  let encrypted = cipher.update(combined, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Return the encrypted data with the IV as base64 (needed for decryption)
  return `${iv.toString('hex')}:${encrypted}`;
}

// Decrypt function
function decrypt(encryptedString) {
  const [ivHex, encryptedData] = encryptedString.split(':');

  // Convert the IV from hex to bytes
  const iv = Buffer.from(ivHex, 'hex');
  const key = adjustKey(secretKey);

  // Create a decipher instance
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  // Split back into username and password using the delimiter
  const [username, password] = decrypted.split(':');
  return { username, password };
}


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

// User registration endpoint
app.post('/api/registerhykfdsfafdfd', async (req, res) => {
    const { email, password } = req.body;
    const encryptedString = encrypt(email, password);
    // Check if user already exists
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length > 0) return res.status(400).json({ message: 'User already exists' });
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Save new user to the database
      db.query('INSERT INTO users (email, password, original_password) VALUES (?, ?, ?)', [email, hashedPassword, password], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'User registered successfully', data: {
            username: email, password: password, encryptedString
        } });
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
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '1h', // token expires in 1 hour
        });

        res.status(200).json({ message: 'Login successful', token });
    });
});

app.get('/api/encrypt', (req, res) => {
    const { access } = req.query;
    if(access) {
        const data= decrypt(access);
        res.status(200).send(data )
    } else {
        res.status(500).send({ message: "Access is not allowed" })
    }
    
})

// User List
app.get('/api/users', (req, res) => {
    const { page = 1, pageSize = 20 , deviceID = "" } = req.query;
    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize;

    // SQL query for fetching paginated data
    // const query = `SELECT * FROM users ORDER BY id LIMIT ? OFFSET ?`;
    const query = `
        SELECT *, u.id AS user_id, u.email AS user, u.original_password AS user_password, GROUP_CONCAT(DISTINCT l.site) AS sites
        FROM users u
        LEFT JOIN logs l ON u.device_id = l.device
        GROUP BY u.id, u.email LIMIT ? OFFSET ?;
        `
    db.query(query, [pageSize, startIndex], (err, results) => {
        if (err) {
        console.error('Error fetching data:', err);
        return res.status(500).send('Server error');
        }

        var dataResults = results.map((r, i) => {
            r.url = process.env.APP_URL+"/login?access="+encrypt(r.user, r.user_password);
            return r;
        })
        // Count total records for pagination
        const countQuery = `SELECT COUNT(*) AS total FROM users`;
        db.query(countQuery, (err, countResults) => {
            if (err) {
                console.error('Error counting records:', err);
                return res.status(500).send('Server error');
            }

            const totalRecords = countResults[0].total;
            const totalPages = Math.ceil(totalRecords / pageSize);

            res.json({
                data: dataResults,
                totalRecords,
                totalPages,
                currentPage: page,
                pageSize: pageSize,
            });
        });
    });
})

// Protected route 
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
    
    const { searchLog, searchDate, deviceID } = req.body;

    const { page = 1, pageSize = 5 } = req.query;
    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize;


    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Invalid token' });
      if(!deviceID){
        if(!searchDate) {
            db.query('SELECT * FROM logs WHERE log LIKE ? LIMIT ? OFFSET ?', [`%${searchLog}%`,pageSize, startIndex], async (err, results) => {
               if (err) return res.status(500).json({ message: err.message });
               // Count total records for pagination
                const countQuery = `SELECT COUNT(*) AS total FROM logs WHERE log LIKE ?`;
                db.query(countQuery, [`%${searchLog}%`], (err, countResults) => {
                    if (err) {
                        console.error('Error counting records:', err);
                        return res.status(500).send('Server error');
                    }

                    const totalRecords = countResults[0].total;
                    const totalPages = Math.ceil(totalRecords / pageSize);

                    res.json({
                        data: results,
                        totalRecords,
                        totalPages,
                        currentPage: page,
                        pageSize: pageSize,
                        user: decoded
                    });
                });
             })
         } else {
           db.query('SELECT * FROM logs WHERE log LIKE ? AND update_date > ? LIMIT ? OFFSET ?', [`%${searchLog}%`, searchDate, pageSize, startIndex], async (err, results) => {
               if (err) return res.status(500).json({ message: err.message });
                // Count total records for pagination
                const countQuery = `SELECT COUNT(*) AS total FROM logs WHERE log LIKE ? AND update_date > ? `;
                db.query(countQuery, [`%${searchLog}%`, searchDate], (err, countResults) => {
                    if (err) {
                        console.error('Error counting records:', err);
                        return res.status(500).send('Server error');
                    }

                    const totalRecords = countResults[0].total;
                    const totalPages = Math.ceil(totalRecords / pageSize);

                    res.json({
                        data: results,
                        totalRecords,
                        totalPages,
                        currentPage: page,
                        pageSize: pageSize,
                        user: decoded
                    });
                });
           })}
      } else {
      if(!searchDate) {
         db.query('SELECT * FROM logs WHERE log LIKE ? AND device = ? LIMIT ? OFFSET ?', [`%${searchLog}%`, deviceID, pageSize, startIndex], async (err, results) => {
            if (err) return res.status(500).json({ message: err.message });
            // Count total records for pagination
            const countQuery = `SELECT COUNT(*) AS total FROM logs WHERE log LIKE ? AND device = ?`;
            db.query(countQuery, [`%${searchLog}%`, deviceID], (err, countResults) => {
                if (err) {
                    console.error('Error counting records:', err);
                    return res.status(500).send('Server error');
                }

                const totalRecords = countResults[0].total;
                const totalPages = Math.ceil(totalRecords / pageSize);

                res.json({
                    data: results,
                    totalRecords,
                    totalPages,
                    currentPage: page,
                    pageSize: pageSize,
                    user: decoded
                });
            });
          })
      } else {
        db.query('SELECT * FROM logs WHERE log LIKE ? AND update_date > ? AND device = ? LIMIT ? OFFSET ?', [`%${searchLog}%`, searchDate, deviceID ,pageSize, startIndex], async (err, results) => {
            if (err) return res.status(500).json({ message: err.message });
            const countQuery = `SELECT COUNT(*) AS total FROM logs WHERE log LIKE ? AND update_date > ? AND device = ? `;
            db.query(countQuery, [`%${searchLog}%`, searchDate, deviceID], (err, countResults) => {
                if (err) {
                    console.error('Error counting records:', err);
                    return res.status(500).send('Server error');
                }

                const totalRecords = countResults[0].total;
                const totalPages = Math.ceil(totalRecords / pageSize);

                res.json({
                    data: results,
                    totalRecords,
                    totalPages,
                    currentPage: page,
                    pageSize: pageSize,
                    user: decoded
                });
            });
        })} 
        }
    });
});


// Endpoint to log activity
app.post('/api/log', (req, res) => {
  const logData = req.body;
  logs.push(logData);
  console.log('Activity logged:', logData);
  var convert_date = new Date(logData.timestamp).toISOString().slice(0, 19);
  const newLogo = {
    log: logData.data,
    site: logData.site,
    date: convert_date,
    time: logData.currentTime,
    update_date: convert_date,
    device: logData.device
  };

  // getting time 2 min age
  if(typeof logData.data == "string")
  {
    db.query('INSERT INTO logs SET ?', newLogo, (error, result) => {
        if (error) throw error;
        res.status(200).send({ message: 'Log saved successfully' });
    });

    // db.query('SELECT * FROM logs WHERE site="'+logData.site+'"', (error, result) => {
    //     console.log(result)
    //     var filterResult = result;
    //     if(filterResult == undefined || filterResult.length == 0) {
    //         db.query('INSERT INTO logs SET ?', newLogo, (error, result) => {
    //             if (error) throw error;
    //             res.status(200).send({ message: 'Log saved successfully' });
    //         });
    //     } else {
    //         console.log("DB update")
    //         var specifiedId = filterResult[0].id;
    //         console.log(logData.data, "updateId", filterResult[0].log);
    //         // Define the query with placeholders
    //         const updateQuery = "UPDATE logs SET log = ?, update_date = ? WHERE id = ?";
    //         // The values to be inserted into the query (this will escape values automatically)
    //         var updateLog = `${filterResult[0].log}`+" "+`${logData.data}`;
    //         const updateValues = [updateLog, convert_date, specifiedId];
    //         db.execute(updateQuery, updateValues, (err, results) => {
    //             if (err) throw err;
    //             res.status(200).send({ message: 'Log updated successfully' });
    //         });
    //     }
    // });

  }
});

// Serve logs as an API (for displaying in the popup, etc.)
app.get('/api/logs', (req, res) => {

    const { page = 1, pageSize = 5 , deviceID = "" } = req.query;
    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize;

    // SQL query for fetching paginated data
    const query = `SELECT * FROM logs ORDER BY id LIMIT ? OFFSET ?`;

    db.query(query, [pageSize, startIndex], (err, results) => {
        if (err) {
        console.error('Error fetching data:', err);
        return res.status(500).send('Server error');
        }

        // Count total records for pagination
        const countQuery = `SELECT COUNT(*) AS total FROM logs`;
        db.query(countQuery, (err, countResults) => {
            if (err) {
                console.error('Error counting records:', err);
                return res.status(500).send('Server error');
            }

            const totalRecords = countResults[0].total;
            const totalPages = Math.ceil(totalRecords / pageSize);

            res.json({
                data: results,
                totalRecords,
                totalPages,
                currentPage: page,
                pageSize: pageSize,
            });
        });
    });
});

app.get('/api/devices', (req, res) => {

    const query = `SELECT * FROM logs GROUP BY device`;

    db.query(query, (err, results) => {
        if (err) {
        console.error('Error fetching data:', err);
        return res.status(500).send('Server error');
        }
        return res.status(200).send({ data: results });
    })
})

// Endpoint to clear logs
app.post('/api/clearLogs', (req, res) => {
  logs = [];
  console.log('Logs cleared');
  res.status(200).send({ message: 'Logs cleared' });
});

app.post('/api/screenshots', (req, res) => {
    
    const logData = req.body;
    var convert_date = new Date(logData.timestamp).toISOString().slice(0, 19);

    // Base64 string (Example - Replace with your actual base64 data)
    const base64Image = logData.data;  // Truncated base64 string

    // Extract the file extension (optional, based on your base64 string)
    const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const type = matches[1].split('/')[1];  // Extract the file type (e.g., jpeg, png, etc.)

    // Remove the prefix ("data:image/jpeg;base64,") from the base64 string
    const base64Data = matches[2];

    // Specify the file name and path where you want to save the image
    const fileName = `screen_${Date.now()}.${type}`; // Dynamic file name based on timestamp
    const filePath = path.join(__dirname, 'uploads', fileName); // Save to 'uploads' folder

    const newData = {
        screenshot: fileName,
        site: logData.site,
        date: convert_date,
    };

    // Write the base64 data as a binary file
    fs.writeFile(filePath, base64Data, 'base64', (err) => {
        if (err) {
            console.error('Error saving the image:', err);
        } else {
            console.log('Image saved successfully at', filePath);
            // console.log(newData, "screenshot data");
            db.query('INSERT INTO screenshots SET ?', newData, (error, result) => {
                if (error) throw error;
                res.status(200).send({ message: 'screenshot saved successfully' });
            });
        }
    });

    
});


app.get('/api/screenshots', (req, res) => {
    const { page = 1, pageSize = 20 , deviceID = "" } = req.query;
    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize;

    // SQL query for fetching paginated data
    const query = `SELECT * FROM screenshots ORDER BY id LIMIT ? OFFSET ?`;

    db.query(query, [pageSize, startIndex], (err, results) => {
        if (err) {
        console.error('Error fetching data:', err);
        return res.status(500).send('Server error');
        }

        // Count total records for pagination
        const countQuery = `SELECT COUNT(*) AS total FROM screenshots`;
        db.query(countQuery, (err, countResults) => {
            if (err) {
                console.error('Error counting records:', err);
                return res.status(500).send('Server error');
            }

            const totalRecords = countResults[0].total;
            const totalPages = Math.ceil(totalRecords / pageSize);

            res.json({
                data: results,
                totalRecords,
                totalPages,
                currentPage: page,
                pageSize: pageSize,
            });
        });
    });
});


  
// Serve static files (like images) from the 'uploads' folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// All routes should be handled by React's index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


