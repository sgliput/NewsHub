// Require all models
var db = require("../models");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");



module.exports = function (app) {

    app.get("/", (req, res) => {
        axios.get("https://www.apnews.com/apf-topnews").then(response => {

            var $ = cheerio.load(response.data);

            var result = {};
            console.log("Hello!");

            // Now, we grab every h2 within an article tag, and do the following:
            $(".FeedCard").each((i, element) => {
                console.log(results.length);
                if (results.length > 9) {
                    return false;
                }

                var headline = $(element).find("h1").text().trim();
                var byline = $(element).find(".byline").text().trim();
                var tag = $(element).find(".HubTag").text().trim();
                var articleLink = $(element).find(".headline").attr("href");

                //var imageSrc = $(element).find("img").attr("src");

                var summary = $(element).find(".content").children().first().text().trim();

                if (byline == "") {
                    byline = "Anonymous";
                }

                var cutByline1 = byline.replace("BY ", "");
                var cutByline2 = cutByline1.replace("By ", "");
                console.log("Byline: " + byline);

                // Add the headline, byline, article link, and image source, and save them as properties of the result object
                result = {
                    headline: headline,
                    byline: cutByline2,
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
        });


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
                tags.forEach(tag => objTags.push({ tagName: tag }));

                const bylines = [...new Set(data.map(a => a.byline))];
                bylines.sort();
                const objBylines = [];
                bylines.forEach(byline => objBylines.push({ bylineName: byline }));

                // Otherwise, send the result of this query to the browser
                res.render("index", { articles: data.reverse(), tagList: objTags, bylineList: objBylines, display1: "block", display2: "none" });

            })
                .catch(function (err) {
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

        app.get("/tags/:tagName", (req, res) => {
            let tagName = req.params.tagName;
            db.Article.find({ tag: tagName }).populate("comments").then(data => {
                for (var i = 0; i < data.length; i++) {
                    data[i].iterator = i;
                }

                db.Article.find({}).populate("comments").then(allData => {
                    const tags = [...new Set(allData.map(a => a.tag))];
                    tags.sort();
                    const objTags = [];
                    tags.forEach(tag => objTags.push({ tagName: tag }));

                    const bylines = [...new Set(allData.map(a => a.byline))];
                    bylines.sort();
                    const objBylines = [];
                    bylines.forEach(byline => objBylines.push({ bylineName: byline }));


                    res.render("index", { articles: data.reverse(), tagList: objTags, bylineList: objBylines, display1: "block", display2: "none" });
                });
            })
                .catch(function (err) {
                    // If an error occurs, send it back to the client
                    res.json(err);
                });
        });

        app.get("/bylines/:bylineName", (req, res) => {
            let bylineName = req.params.bylineName;
            db.Article.find({ byline: bylineName }).populate("comments").then(data => {
                for (var i = 0; i < data.length; i++) {
                    data[i].iterator = i;
                }

                db.Article.find({}).populate("comments").then(allData => {
                    const tags = [...new Set(allData.map(a => a.tag))];
                    tags.sort();
                    const objTags = [];
                    tags.forEach(tag => objTags.push({ tagName: tag }));

                    const bylines = [...new Set(allData.map(a => a.byline))];
                    bylines.sort();
                    const objBylines = [];
                    bylines.forEach(byline => objBylines.push({ bylineName: byline }));


                    res.render("index", { articles: data.reverse(), tagList: objTags, bylineList: objBylines, display1: "none", display2: "block" });
                });
            })
                .catch(function (err) {
                    // If an error occurs, send it back to the client
                    res.json(err);
                });

        })

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
                    console.log("dbComment._id: " + dbComment._id);
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

        app.post("/deleteComment/:articleID/comments/:id", (req, res) => {
            var id = req.params.id;
            var articleID = req.params.articleID;
            console.log("articleID: " + articleID);
            console.log("id: " + id);
            console.log(req.body);

            db.Comment.findByIdAndRemove(id, (err, data) => {
                // As always, handle any potential errors:
                if (err) return res.status(500).send(err);
                console.log("data._id: " + data._id);
            }).then(data2 => {
                return db.Article.findByIdAndUpdate(articleID, { $pull: { comments: id } }, { multi: true });
            }).then(dbArticle => {

                return res.status(200).send("Comment successfully deleted");
            });
        });

        var results = [];

        app.get("/scrape", (req, res) => {

            axios.get("https://www.apnews.com/apf-topnews").then(response => {

                var $ = cheerio.load(response.data);

                var result = {};

                // Now, we grab every h2 within an article tag, and do the following:
                $(".FeedCard").each((i, element) => {

                    if (results.length > 9) {
                        return false;
                    }

                    var headline = $(element).find("h1").text().trim();
                    var byline = $(element).find(".byline").text().trim();
                    var tag = $(element).find(".HubTag").text().trim();
                    var articleLink = $(element).find(".headline").attr("href");

                    //var imageSrc = $(element).find("img").attr("src");

                    var summary = $(element).find(".content").children().first().text().trim();

                    if (byline == "") {
                        byline = "Anonymous";
                    }

                    var cutByline1 = byline.replace("BY ", "");
                    var cutByline2 = cutByline1.replace("By ", "");
                    console.log("Byline: " + byline);

                    // Add the headline, byline, article link, and image source, and save them as properties of the result object
                    result = {
                        headline: headline,
                        byline: cutByline2,
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
