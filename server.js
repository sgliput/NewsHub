var express = require("express");
var exphbs = require("express-handlebars");
//var logger = require("morgan");
var mongoose = require("mongoose");
var bodyParser = require('body-parser');

// Initialize Express
var app = express();
var PORT = process.env.PORT || 3000;

// Handlebars
app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main"
  })
);
app.set("view engine", "handlebars");

// Routes
//require("./routes/apiRoutes")(app);
require("./routes/htmlRoutes")(app);

// Use morgan logger for logging requests
//app.use(logger("dev"));
// Parse request body as JSON
app.use(bodyParser.json({ type: 'application/*+json' }))

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB, unless deployed
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

// Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });




  module.exports = app;