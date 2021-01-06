const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');

//Load env vars
dotenv.config({path: './config/config.env'});

//Connect to database
connectDB();

//Route Files
const bootcamps = require('./routes/bootcamps');
const courses = require('./routes/courses');
const auth = require('./routes/auth');
const users = require('./routes/users');
const reviews = require('./routes/reviews');

const app = express();

//Body Parser
app.use(express.json());

//Cookie Parser
app.use(cookieParser());

//Dev logging middleware
if(process.env.NODE_ENV === 'development'){
   app.use(morgan('dev'));
}

//File Uploading
app.use(fileupload());

//Sanitize Data
app.use(mongoSanitize());

//Set security headers
// app.use(helmet());
app.use(
   helmet.contentSecurityPolicy({
     directives: {
       defaultSrc: ["'self'"],
       scriptSrc: ["'self'", "'sha256-ZomnyosL2bmZ79LmErHEhL+1fVaBj9NngvpOK/l4qio='"],
       objectSrc: ["'none'"],
       styleSrc: ["'self'", "'sha256-AqXh99DOx3mQQD++lNaT2Mo4sUlV+iN1ydvHVQhm4+g='"],
       upgradeInsecureRequests: [],
     },
   })
 );

//Prevent XSS attacks
app.use(xss());

//Rate Limiting
const limiter = rateLimit({
   windowMs: 10 * 60 * 1000, //ten minutes
   max: 100
});
app.use(limiter);

//Prevent HTTP param pollution
app.use(hpp());

//Enable CORS
app.use(cors());

//Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

//Mount routers
app.use('/api/v1/bootcamps', bootcamps);
app.use('/api/v1/courses', courses);
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);
app.use('/api/v1/reviews', reviews);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold));

//Global "Unhandled Promise" Handler
process.on('unhandledRejection', (err, promise) => {
   console.log(`Error: ${err.message}`.red);
   //Close server & exit process
   server.close(() => process.exit(1));
});