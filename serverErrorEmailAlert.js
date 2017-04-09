'use strict';

const express = require('express');
const morgan = require('morgan');


// this will load our .env file if we're running locally. On Glitch, .env files are automatically loaded.
require('dotenv').config();

const {logger} = require('./utilities/logger');
const {sendEmail} = require('./emailer');
//const emailData = require('./emailData.json');
let emailData = {
    from: "'SERVICE ALERTS' <avram.thinkful@gmail.com>",
    to: "adkantor@gmail.com",
    subject: "emailData ",
    text: "plain text of body \n",
    //html: "<h1>Heading</h1><p>body</p>"
}

// these are custom errors we've created
const {FooError, BarError, BizzError} = require('./errors');

const app = express();

// this route handler randomly throws one of `FooError`, `BarError`, or `BizzError`
const russianRoulette = (req, res) => {
  const errors = [FooError, BarError, BizzError];
  throw new errors[
    Math.floor(Math.random() * errors.length)]('It blew up!');
};


app.use(morgan('common', {stream: logger.stream}));

app.get('/favicon.ico', (req, res, next) => {
  res.end();
  next();
});

// for any GET request, we'll run our `russianRoulette` function

app.get('*', russianRoulette);

// YOUR MIDDLEWARE FUNCTION should be activated here using `app.use()`. It needs to come BEFORE the `app.use` call below, which sends a 500 and error message to the client

app.use((err, req, res, next) => {
  /* */
  if((err.name === "FooError") || (err.name === 'BarError')){
    //UPDATE EMAIL DATA
    emailData["subject"] += `ALERT a ${err.name} occured`;
    emailData["text"] += `The error message is ${err.message}\n\n`;
    emailData["text"] += (err.stack);
    
    //SEND EMAIL
    sendEmail(emailData);
  }else{
    console.log(`the error ${err.name} does not require an email alert`);
  }
  next(err);
});

app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({error: 'Something went wrong'}).end();
});

const port = process.env.PORT || 8080;

const listener = app.listen(port, function () {
  logger.info(`Your app is listening on port ${port}`);
});
