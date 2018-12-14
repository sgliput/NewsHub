// Require all models
var db = require("../models");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");



module.exports = function (app) {

    app.get("/", (req, res) => {
        db.Article.find({}).populate("comments").then(data => {
            // Log any errors if the server encounters one
           //const tags = [];
                for (var i = 0; i < data.length; i++) {
                    data[i].iterator = i;
                    //tags.push(data[i].tag);
                }

                const tags = [...new Set(data.map(a => a.tag))];
                tags.sort();
                const objTags = [];
                tags.forEach(tag => objTags.push({tagName: tag}));

                console.log(objTags);


                // Otherwise, send the result of this query to the browser
                res.render("index", { articles: data, tagList: objTags });
            
        })
    .catch(function(err) {
      // If an error occurs, send it back to the client
      res.json(err);
    });

    });

    app.get("/all", (req, res) => {
        db.Article.find({}, (err, data) => {
            // Log any errors if the server encounters one
            if (err) {
                console.log(err);
            }
            else {
                // Otherwise, send the result of this query to the browser
                res.json(data);
            }
        });
    });

    app.get("/allComments", (req, res) => {
        db.Comment.find({}, (err, data) => {
            // Log any errors if the server encounters one
            if (err) {
                console.log(err);
            }
            else {
                // Otherwise, send the result of this query to the browser
                res.json(data);
            }
        });
    });



    app.get("/article/:id", (req, res) => {
        var id = req.params.id;
        db.Article.findById(id, (err, data) => {
            // Log any errors if the server encounters one
            if (err) {
                console.log(err);
            }
            else {
                // Otherwise, send the result of this query to the browser
                res.send(data);
            }
        });
    });

    app.post("/submitComment/articles/:id", (req, res) => {
        var id = req.params.id;
        console.log(id);
        console.log(req.body);
        // Create a new Note in the db
        db.Comment.create(req.body)
            .then(dbComment => {
                // If a Note was created successfully, find one User (there's only one) and push the new Note's _id to the User's `notes` array
                // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
                // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
                return db.Article.findByIdAndUpdate(id, { $push: { comments: dbComment._id } }, { new: true });
            })
            .then(dbArticle => {
                // If the User was updated successfully, send it back to the client
                console.log("dbArticle: ");
                console.log(dbArticle);
                res.send(dbArticle);
            })
            .catch(err => {
                // If an error occurs, send it back to the client
                res.send(err);
            });
    });

    app.post("/deleteComment/comments/:id", (req, res) => {
        var id = req.params.id;
        console.log(id);
        console.log(req.body);

        db.Comment.findByIdAndRemove(id, (err, data) => {
            // As always, handle any potential errors:
            if (err) return res.status(500).send(err);
            // We'll create a simple object to send back with a message and the id of the document that was removed
            // You can really do this however you want, though.
            const response = {
                message: "Comment successfully deleted",
                id: data._id
            };
            return res.status(200).send(response);
        });
    });

    var results = [];

    app.get("/scrape", (req, res) => {

        axios.get("https://www.apnews.com/apf-topnews").then(response => {

            var $ = cheerio.load(response.data);

            var result = {};

            // Now, we grab every h2 within an article tag, and do the following:
            $(".FeedCard").each(i, element => {

                var headline = $(element).find("h1").text();
                var byline = $(element).find(".byline").text();
                var tag = $(element).find(".HubTag").text();
                var articleLink = $(element).find(".headline").attr("href");

                //var imageSrc = $(element).find("img").attr("src");

                var summary = $(element).find(".content").children().first().text();


                // Add the headline, byline, article link, and image source, and save them as properties of the result object
                result = {
                    headline: headline,
                    byline: byline,
                    tag: tag,
                    articleLink: articleLink,
                    //imageSrc: imageSrc,
                    summary: summary
                };

                results.push(result);

                if (headline && tag && articleLink && summary) {
                    db.Article.updateOne({ headline: $(element).find("h1").text() }, result, { upsert: true })
                        .then(dbArticles => {
                            // View the added results in the console
                            console.log(dbArticles);
                        })
                        .catch(err => {
                            // If an error occurred, log it
                            console.log(err);
                        });
                }

            });


            // Send a message to the client
            res.send(results);
        });


    });
};

// db.getCollection('articles').find({_id: ObjectId("5c0dad43a154ce0b20eb124c")})

// axios.get("https://apnews.com/").then(function (response) {
//             // Then, we load that into cheerio and save it to $ for a shorthand selector
//             var $ = cheerio.load(response.data);

//             var headline = $(".main-story").find("h1").text();
//             var byline = $(".main-story").find(".byline").text();
//             var articleLink = $(".main-story").find(".headline").attr("href");
//             var imageSrc = $(".main-story").find("img").attr("src");

//             var firstResult = {
//                 headline: headline,
//                 byline: byline,
//                 articleLink: articleLink,
//                 imageSrc: imageSrc
//             };

//             results.push(firstResult);


//             if (headline && articleLink && imageSrc) {
//                 db.Article.updateOne({ headline: $(".main-story").find("h1").text() }, firstResult, { upsert: true })
//                     .then(function (dbArticle) {
//                         // View the added results in the console
//                         console.log(dbArticle);
//                     })
//                     .catch(function (err) {
//                         // If an error occurred, log it
//                         console.log(err);
//                     });
//             }
//         }).then(function () {

//             axios.get("https://apnews.com/").then(function (response) {

//                 var $ = cheerio.load(response.data);

//                 var result = {};

//                 // Now, we grab every h2 within an article tag, and do the following:
//                 $(".RelatedStory").each(function (i, element) {

//                     var headline = $(element).find(".headline").text();
//                     var byline = $(element).find(".author").text();
//                     var articleLink = $(element).find("a").attr("href");
//                     var imageSrc = $(element).find("img").attr("src");

//                     // Add the headline, byline, article link, and image source, and save them as properties of the result object
//                     result = {
//                         headline: headline,
//                         byline: byline,
//                         articleLink: articleLink,
//                         imageSrc: imageSrc
//                     };

//                     results.push(result);

//                     if (headline && articleLink && imageSrc) {
//                         db.Article.updateOne({ headline: $(element).find(".headline").text() }, result, { upsert: true })
//                             .then(function (dbArticles) {
//                                 // View the added results in the console
//                                 console.log(dbArticles);
//                             })
//                             .catch(function (err) {
//                                 // If an error occurred, log it
//                                 console.log(err);
//                             });
//                     }

//                 });