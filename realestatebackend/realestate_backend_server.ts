require('dotenv').config(); //.env file processing



const express = require('express'); //Import Express with parameters
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */

const axios = require('axios'); //Import axios
const router = express.Router(); //Express Router




//Paypal
const PAYPAL_API = 'https://api.sandbox.paypal.com';
const paypal = require('@paypal/checkout-server-sdk');

// Replace hardcoded credentials with environment variables
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID; // Move to .env
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET; // Move to .env
console.log("PAYPAL_CLIENT_ID:", process.env.PAYPAL_CLIENT_ID);
console.log("PAYPAL_CLIENT_SECRET:", process.env.PAYPAL_CLIENT_SECRET);

// Proper PayPal client setup
const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);

const client = new paypal.core.PayPalHttpClient(environment);


//Web token
const jwt = require('jsonwebtoken'); //Web Token
const SECRET_KEY = process.env.JWT_SECRET || "Frambleton3!"; //Store secret key in .env file\
const cookieParser = require('cookie-parser'); //Needed to parse cookies


//Cross-Origin Requests
const cors = require('cors');
const corsOptions = {
  origin: ['http://localhost:3000', 'https://www.sandbox.paypal.com'],
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type, Authorization',
  credentials: true,
};

//Needed for middleware
const bodyParser = require('body-parser');

//Encrypt data to send to Database
const bcrypt = require('bcrypt');

//Middleware to authenticate JWT tokens before allowing access to protected routes
/**
 * @typedef {Object} AuthenticatedRequest
 * @property {Object} user
 * @property {number} user.User_ID
 * @property {string} user.username
 */

//Encrypt data to send to Database
const app = express();
app.use(express.json({ limit: '1gb' })); //Increase JSON payload size
app.use(express.urlencoded({ extended: true, limit: '1gb' }));
const fs = require('fs'); //File system reader


//Middleware: Allow cross-origin requests from React Front-end
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(cookieParser()); //Middleware that parses cookies

//Middleware to Authenticate token before allowing access to protected routes
const authenticateToken = (req, res, next) => {
    console.log("Request Headers: ", req.headers);
    console.log("Received Cookies: ", req.cookies);

    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1]; //Get token from Bearer header.

    if(!token) {
        return res.status(401).json({message: 'Access Denied: No Token Provided'});
    }

    //Verify the token
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            console.log("JWT Verification failed: ", err.message);
            return res.status(403).json({ message: 'Token is invalid or expired' });
        }

        console.log("Decoded User: ", user);

        //If token is valid, attach user data to request object
        req.authUser = user; //This is the decoded token payload
        next(); //Proceed to the next middleware or route handler
    })
};

//Connect to the database
const mysql = require('mysql2/promise');
const db = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Frambleton3!',
    database: process.env.DB_NAME || 'realestatedb',
    port: process.env.DB_PORT || 3306,
    dateStrings: true
});

db.getConnection()
  .then(connection => {
    console.log('Database connection successful');
    connection.release();
  })
  .catch(err => {
    console.error('Database connection error:', err.stack);
});

//Login Handling
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if(!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        // MySQL query with correct syntax
        const [rows] = await db.query(
            'SELECT `User ID`, `Username`, `Password` FROM `userinformation` WHERE `Username` = ?',
            [username]
        );

        console.log("Query Result: ", rows);

        if (rows.length > 0) {
            const user = rows[0];
            console.log("User found: ", user);

            const enteredPassword = password.trim();
            const storedPasswordHash = user.Password.trim();

            if (user && user.Password) {
                const passwordMatch = await bcrypt.compare(enteredPassword, storedPasswordHash);
                console.log('Password match: ', passwordMatch);

                if (passwordMatch) {
                    console.log("User ID to be signed: ", user["User ID"]);

                    const token = jwt.sign(
                        {
                            User_ID: user["User ID"],
                            username: user.Username
                        },
                        SECRET_KEY,
                        {expiresIn: '24h'}
                    );

                    res.cookie('token', token, {
                        httpOnly: true,
                        secure: true,
                        maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
                        sameSite: 'Strict'
                    });

                    const decodedToken = jwt.decode(token);
                    console.log("Decoded Token: ", decodedToken);
                    res.status(200).json({
                        success: true,
                        message: 'Login Successful',
                        userID: user["User ID"]

                     });
                } else {
                    res.status(401).json({ success: false, message: 'Incorrect Username or Password' });
                }
            } else {
                res.status(401).json({ success: false, message: "Password not found in database" });
            }
        } else {
            res.status(401).json({ success: false, message: 'Incorrect Username' });
        }
    } catch (error) {
        console.error('Login error: ', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
});

//Sign Up Handling
app.post('/signup', async (req, res) => {
    let { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and Password Required" });

    }

    //Trim submissions
    username = username.trim();
    password = password.trim();

    //Password Complexity (EXPAND FUNCTIONALITY)
    if(password.length < 5 ) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" })
    }

    try {
    // Check for existing users that match username input (NO DUPLICATES)
    const [userExists] = await db.query(
        'SELECT `Username` FROM `userinformation` WHERE `Username` = ?',
        [username]
    );

    if (userExists.length > 0) {
        return res.status(400).json({ success: false, message: "Username already exists." });
    }

    // Hash Password before sending to database
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert new user
    const [newUserResult] = await db.query(
        'INSERT INTO `userinformation` (`Username`, `Password`) VALUES (?, ?)',
        [username, hashedPassword]
    );
    const insertId = newUserResult.insertId;

    // Fetch the new user row
    const [userRows] = await db.query(
        'SELECT `User ID`, `Username` FROM `userinformation` WHERE `User ID` = ?',
        [insertId]
    );
    const user = userRows[0];

    // Generate JWT Token upon successful signup
    const token = jwt.sign(
        {
            User_ID: user["User ID"],
            username: user.Username
        },
        SECRET_KEY,
        { expiresIn: '24h' } // Token expires in 1 hour.
    );

    // Set the token in an HTTP-only cookie
    res.cookie('token', token, {
        httpOnly: true, // Cookie is inaccessible to Javascript
        secure: process.env.NODE_ENV === 'production', // Set secure flag during production
        maxAge: 3600000, // 1 hour
        sameSite: 'Strict' // Helps prevent CSRF
    });

    console.log("User Signed Up!");
    res.status(201).json({ success: true, message: "User signed up successfully" });
    } catch (error) {
        console.error("Error Signing up User: ", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});


//Profile Handling
app.post('/profile', authenticateToken, async (req, res) => {
    let { firstName, lastName, street, apartment, city, stateProvince, country, phone, email } = req.body; //Unpack request from frontend

    //Evaluate if any of the fields have an input and are not blank. If false, return an error.
    if (![firstName, lastName, street, apartment, city, stateProvince, country, phone, email].some(field => field && field.trim() !== "")) {
        return res.status(400).json({ success: false, message: "Please update at least one field within your peronal information" })
    }

    //Ensure User_ID exists
    if(!req.authUser?.User_ID) {
        return res.status(401).json({ success: false, message: "Unauthorized: User ID not found" })
    }
    console.log("User ID from token: ", req.authUser.User_ID);

    try {
        //Trim submissions before sending to database
            firstName = typeof firstName === 'string' ? firstName.trim() : '';
            lastName = typeof lastName === 'string' ? lastName.trim() : '';
            street = typeof street === 'string' ? street.trim() : '';
            apartment = typeof apartment === 'string' ? apartment.trim() : '';
            city = typeof city === 'string' ? city.trim() : '';
            stateProvince = typeof stateProvince === 'string' ? stateProvince.trim() : '';
            country = typeof country === 'string' ? country.trim() : '';
            phone = typeof phone === 'string' ? phone.trim() : '';
            email = typeof email === 'string' ? email.trim() : '';


        //Insert Query for Profile Info
        const [result] = await db.query(
            'UPDATE `userinformation` SET `First Name` = ?, `Last Name` = ?, `Street` = ?, `Apartment` = ?, `City` = ?, `State/Province` = ?, `Country` = ?, `Phone` = ?, `Email` = ? WHERE `User ID` = ?',
            [firstName, lastName, street, apartment, city, stateProvince, country, phone, email, req.authUser.User_ID]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(201).json({ success: true, message: "User Profile Update Successfully" });

            } catch (error) {
                console.error("Error updating profile information: ", error);
                res.status(500).json({ success: false, message: "Internal Server Error" });
            }
        });


//Retrieve profile data from database
app.get('/profile', authenticateToken, async (req, res) => {
    const [response] = await db.query(
    'SELECT * FROM `userinformation` WHERE `User ID` = ?',
    [req.authUser.User_ID]
    );

    if (response.length > 0) {
        res.json({ success: true, message: "Profile Data Query Successful", data: response[0] });
        console.log("Profile Data Received: ", response[0]);
    } else {
        res.status(404).json({ success: false, message: "User not found" });
    }
});


//Helper function to get PayPal access token
const getPayPalAccessToken = async () => {
    try {
        const response = await axios.post(`${PAYPAL_API}/v1/oauth2/token`, 'grant_type=client_credentials',
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            auth: {
                username: CLIENT_ID,
                password: CLIENT_SECRET
            }

        }
    );

    return response.data.access_token;

    } catch (error) {
        console.error('Error getting PayPal access token:', error.response.data);
        throw error;
    }
};

// Create PayPal Order
app.post('/api/create-paypal-order', async (req, res) => {

  const { amount } = req.body; //Total amount of cart

  // Validate amount format (string representing a positive number)
  if (!amount || isNaN(amount)) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  else if (Number(amount) <=0) {
    return res.status(400).json({ error: 'Cart Empty' });
  }

  //Submit the create order request
  try {

    const request = new paypal.orders.OrdersCreateRequest(); //Declare request
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "JPY",
            value: amount,
          },
        },
      ],
     application_context: {
        user_action: 'PAY_NOW',
        shipping_preference: 'NO_SHIPPING', //Hide Shipping Button
        // Add this to request phone number
        payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
        }
    }
    });

    //Declare order and send to frontend
    const order = await client.execute(request);
    res.json({

        orderID: order.result.id,

     });
  } catch (error) {
    console.error("Error creating PayPal order:", error);
    res.status(500).json({ success: 'false', message: "Failed to create PayPal order: ", error });
  }
});

// Capture PayPal Order
app.post('/api/capture-paypal-order', async (req, res) => {

//Submit order request
  try {
    const { orderID } = req.body;
    const { cartProducts } = req.body;
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    const response = await client.execute(request);
    const result = response.result

    // Get payer and shipping info
    const payer = result.payer;

    // Construct order details
    const orderDetails = {
      paypalOrderId: result.id,
      status: result.status,
      payerEmail: payer?.email_address,
      payerName: `${payer?.name?.given_name || ''} ${payer?.name?.surname || ''}`.trim(),
      cartProducts: cartProducts,
    };

    console.log("Order Details: ", orderDetails);

    function toMySQLDate(dateString) {
        // Handles both Date objects and ISO strings
        const d = new Date(dateString);
        // Pad month and day for MySQL
        const pad = n => n < 10 ? '0' + n : n;
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    //Room Assignment Handling
    const roomTypeOptionsArray = ['Dormitory', 'Double Room Shared Toilet & Shower', 'Double Room Private Toilet & Bath', 'Japanese Twin Room', '4 Bed Room']

    const dormitoryRooms = ['202A', '202B', '202C', '202D', '202E', '202F', '202G', '202H', '202I', '202K', '202L', '203A', '203B', '203C', '203D', '203E', '203F', '203G', '203H', '203I', '203K', '203L', '204A', '204B', '204C', '204D', '204E', '204F', '204G', '204H', '204I', '204K', '204L'];
    const doubleSharedRooms = ['201', '205'];
    const doubleRoomPrivate = ['206', '207'];
    const japaneseTwinRooms = ['301', '302', '303', '304', '305', '306', '307'];
    const fourbedRooms = ['401', '402', '403', '404', '405', '406'];

    //Room Assingment Helper Function
    function getRoomArray(roomOption) {
        switch (roomOption) {
            case 'Dormitory': return dormitoryRooms;
            case 'Double Room Shared Toilet & Shower': return doubleSharedRooms;
            case 'Double Room Private Toilet & Bath': return doubleRoomPrivate;
            case 'Japanese Twin Room': return japaneseTwinRooms;
            case '4 Bed Room': return fourbedRooms;
            default: return [];
        }
    }

    //Assign Room Function
    async function assignRoom(roomOption, startDate, endDate) {
        const roomArray = getRoomArray(roomOption);
        if (!roomArray.length) return null;
        // Find rooms already booked for this type and overlapping dates
        const [rows] = await db.query(
            'SELECT `Room Number` FROM `reservationstable` WHERE `Room Option` = ? AND NOT (`End Date` < ? OR `Start Date` > ?)',
            [roomOption, startDate, endDate]
        );
        const bookedRooms = new Set(rows.map(r => r['Room Number']));
        // Return first available room
        return roomArray.find(room => !bookedRooms.has(room)) || null;
    }

    const reservationQuery = `
        INSERT INTO \`reservationstable\`
        (\`Name\`, \`Start Date\`, \`End Date\`, \`People\`, \`Room Option\`, \`Room Number\`, \`Total\`, \`Email\`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const product of cartProducts) {
        const startDate = toMySQLDate(product.reservationStartDate);
        const endDate = toMySQLDate(product.reservationEndDate);
        const assignedRoom = await assignRoom(product.roomOption, startDate, endDate);
        if (!assignedRoom) {
            return res.status(409).json({ success: false, message: `No available room for ${product.roomOption} between ${startDate} and ${endDate}` });
        }
        await db.query(reservationQuery, [
            orderDetails.payerName,
            startDate,
            endDate,
            product.people,
            product.roomOption,
            assignedRoom,
            product.total,
            orderDetails.payerEmail
        ]);
    }

    //Send response to frontend
    res.json({
      status: 'COMPLETED',
      details: response.result,
      orderDetails: orderDetails
    });

  } catch (err) {
    console.error('PayPal capture order error:', err);
    res.status(500).json({ error: err.message });
  }
});


//Delete Profile Processing
app.post('/deleteprofile', authenticateToken, async (req, res) => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "No token provided" });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, SECRET_KEY);
    } catch (err) {
        return res.status(403).json({ success: false, message: 'Invalid Token' });
    }

    const userId = decoded.User_ID;

    // MySQL delete query
    try {
        const [result] = await db.query(
            'DELETE FROM `userinformation` WHERE `User ID` = ?',
            [userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.clearCookie('token', { httpOnly: true, sameSite: 'Strict', secure: true });
        res.status(200).json({ success: true, message: 'Profile Deleted Successfully' });
    } catch (err) {
        console.error("Database error: ", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/reservationdata', async (req, res) => {
    try {
        const [response] = await db.query(
            'SELECT * FROM reservationstable'
        );

       const formatted = response.map(row => ({
            ...row,
            'Start Date': row['Start Date'] || '',
            'End Date': row['End Date'] || ''
        }));

        res.status(200).json({ success: true, data: formatted });
    } catch (error) {
        console.error("Error Querying reservationstable", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/reservationdataupdate', async (req, res) => {
    try {
        // Expect reservation object in req.body
        const {
            Name,
            "Start Date": StartDate,
            "End Date": EndDate,
            People,
            "Room Option": RoomOption,
            "Room Number": RoomNumber,
            Total,
            Email,
            "Reservation ID": ReservationID
        } = req.body;

        // Validate required fields
        if (!ReservationID || !Name || !StartDate || !EndDate || !People || !RoomOption || !RoomNumber || !Total) {
            return res.status(400).json({ success: false, message: "Missing required reservation fields." });
        }

        // Update reservation in the database
        const updateQuery = `
            UPDATE \`reservationstable\`
            SET \`Name\` = ?, \`Start Date\` = ?, \`End Date\` = ?, \`People\` = ?, \`Room Option\` = ?, \`Room Number\` = ?, \`Total\` = ?, \`Email\` = ?
            WHERE \`Reservation ID\` = ?
        `;
        const params = [
            Name,
            StartDate,
            EndDate,
            People,
            RoomOption,
            RoomNumber,
            Total,
            Email || '',
            ReservationID
        ];
        const [result] = await db.query(updateQuery, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Reservation not found." });
        }

        res.status(200).json({ success: true, message: "Reservation updated successfully." });
    } catch (error) {
        console.error("Error updating reservationstable", error);
        res.status(500).json({ success: false, message: error.message });
    }
});


app.post('/reservationdelete', async (req, res) => {
    try {
        // Expect { reservationId } in req.body
        const { reservationId } = req.body;

        // Validate required fields
        if (!reservationId) {
            return res.status(400).json({ success: false, message: "Reservation ID not provided." });
        }

        // Delete reservation in the database
        const deleteQuery = `
           DELETE FROM \`reservationstable\` WHERE \`Reservation ID\` = ?
        `;
        const [result] = await db.query(deleteQuery, [reservationId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Reservation not found." });
        }

        res.status(200).json({ success: true, message: "Reservation deleted successfully." });
    } catch (error) {
        console.error("Error deleting reservationstable", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

//Declare port number
const PORT = process.env.PORT || 5000;
//Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
