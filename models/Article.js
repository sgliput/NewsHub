var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new ArticleSchema object
// This is similar to a Sequelize model
var ArticleSchema = new Schema({
  // `headline` must be unique and of type String
  headline: {
    type: String,
    unique: true
  },
  byline: {
    type: String,
    default: "Anonymous"
  },
  tag: String,
  articleLink: {
      type: String,
      unique: true
  },
  imageSrc: String,
  summary: String,
  // `comments` is an array that stores ObjectIds
  // The ref property links these ObjectIds to the Comment model
  // This allows us to populate the Article with any associated Comments
  comments: [
    {
      // Store ObjectIds in the array
      type: Schema.Types.ObjectId,
      // The ObjectIds will refer to the ids in the Note model
      ref: "Comment"
    }
  ]
});

// This creates our model from the above schema, using mongoose's model method
var Article = mongoose.model("Article", ArticleSchema);

// Export the Article model
module.exports = Article;