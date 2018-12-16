// Require all models
var db = require("../models");

// Our scraping tools
var axios = require("axios");
var cheerio = require("cheerio");

module.exports = app => {
    var results = [];

    //Route for home page upon initial load
    app.get("/", (req, res) => {
        //Axios scrapes the AP News website
        axios.get("https://www.apnews.com/apf-topnews").then(response => {

            var $ = cheerio.load(response.data);

            var result = {};

            // Now, we grab the headline, byline, tag, article link, and summary from every Feedcard element
            $(".FeedCard").each((i, element) => {
                console.log(results.length);
                //The loop stops after ten results
                if (results.length > 9) {
                    return false;
                }

                var headline = $(element).find("h1").text().trim();
                var byline = $(element).find(".byline").text().trim();
                var tag = $(element).find(".HubTag").text().trim();
                var articleLink = $(element).find(".headline").attr("href");
                //var imageSrc = $(element).find("img").attr("src");
                var summary = $(element).find(".content").children().first().text().trim();

                //If there is no byline, it is set to Anonymous
                if (byline == "") {
                    byline = "Anonymous";
                }

                //Removing BY and By from each byline
                var cutByline1 = byline.replace("BY ", "");
                var cutByline2 = cutByline1.replace("By ", "");
                console.log("Byline: " + byline);

                // Add the headline, byline, tag, article link, and summary, and save them as properties of the result object
                result = {
                    headline: headline,
                    byline: cutByline2,
                    tag: tag,
                    articleLink: articleLink,
                    //imageSrc: imageSrc,
                    summary: summary
                };
                //Push each result to the results array
                results.push(result);

                //If all these have values, then the article information is added to the database (upserted if it is not already present)
                if (headline && tag && articleLink && summary) {
                    db.Article.updateOne({ headline: $(element).find("h1").text() }, result, { upsert: true })
                        .then(dbArticles => {
                            // View the added articles in the console
                            console.log(dbArticles);
                        })
                        .catch(err => {
                            // If an error occurred, log it
                            console.log(err);
                        });
                }

            });
        });

        //After the scraping is done, find all articles, including their related comments
        db.Article.find({}).populate("comments").then(data => {
            //Loop through the results and add an iterator property to each object
            for (var i = 0; i < data.length; i++) {
                data[i].iterator = i;
            }

            //Creates a tags array of all the tags without any repeats
            const tags = [...new Set(data.map(a => a.tag))];
            //Alphabetizes the array
            tags.sort();
            const objTags = [];
            //Puts each tag from the tags array into an object in the objTags array
            tags.forEach(tag => objTags.push({ tagName: tag }));

            //Creates a bylines array of all the bylines without any repeats
            const bylines = [...new Set(data.map(a => a.byline))];
            //Alphabetizes the array
            bylines.sort();
            const objBylines = [];
            //Puts each byline from the bylines array into an object in the objBylines array
            bylines.forEach(byline => objBylines.push({ bylineName: byline }));

            //Renders index.handlebars, reversing the data order so that the most recently added articles are displayed first
            //The objTags and the objBylines arrays are for the tag and byline columns, and display1 and display2 are for hiding the appropriate column (bylines in this case)
            res.render("index", { articles: data.reverse(), tagList: objTags, bylineList: objBylines, display1: "block", display2: "none" });

        })
            .catch(err => {
                // If an error occurs, send it back to the client
                res.json(err);
            });

    });

    //Route for displaying all articles as JSON data
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

    //Route for displaying all comments as JSON data
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


    //Route for finding a specific article based on its id
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

    //Route for finding specific article(s) based on the tag
    app.get("/tags/:tagName", (req, res) => {
        let tagName = req.params.tagName;
        //Find all articles with the specified tag name
        db.Article.find({ tag: tagName }).populate("comments").then(data => {
            //Add an iterator property to each article object
            for (var i = 0; i < data.length; i++) {
                data[i].iterator = i;
            }

            //Also find all articles so that all of the tags or bylines can still be displayed in the left column
            db.Article.find({}).populate("comments").then(allData => {
                const tags = [...new Set(allData.map(a => a.tag))];
                tags.sort();
                const objTags = [];
                tags.forEach(tag => objTags.push({ tagName: tag }));

                const bylines = [...new Set(allData.map(a => a.byline))];
                bylines.sort();
                const objBylines = [];
                bylines.forEach(byline => objBylines.push({ bylineName: byline }));

                //Renders index.handlebars, reversing the data order so that the most recently added articles are displayed first
                //The objTags and the objBylines arrays are for the tag and byline columns, and display1 and display2 are for hiding the appropriate column (bylines in this case)
                res.render("index", { articles: data.reverse(), tagList: objTags, bylineList: objBylines, display1: "block", display2: "none" });
            });
        })
            .catch(err => {
                // If an error occurs, send it back to the client
                res.json(err);
            });
    });

    //Route for finding specific article(s) based on the byline
    app.get("/bylines/:bylineName", (req, res) => {
        let bylineName = req.params.bylineName;
        //Find all articles with the specified byline
        db.Article.find({ byline: bylineName }).populate("comments").then(data => {
            //Add an iterator property to each article object
            for (var i = 0; i < data.length; i++) {
                data[i].iterator = i;
            }

            //Also find all articles so that all of the tags or bylines can still be displayed in the left column
            db.Article.find({}).populate("comments").then(allData => {
                const tags = [...new Set(allData.map(a => a.tag))];
                tags.sort();
                const objTags = [];
                tags.forEach(tag => objTags.push({ tagName: tag }));

                const bylines = [...new Set(allData.map(a => a.byline))];
                bylines.sort();
                const objBylines = [];
                bylines.forEach(byline => objBylines.push({ bylineName: byline }));

                //Renders index.handlebars, reversing the data order so that the most recently added articles are displayed first
                //The objTags and the objBylines arrays are for the tag and byline columns, and display1 and display2 are for hiding the appropriate column (tags in this case)
                res.render("index", { articles: data.reverse(), tagList: objTags, bylineList: objBylines, display1: "none", display2: "block" });
            });
        })
            .catch(err => {
                // If an error occurs, send it back to the client
                res.json(err);
            });

    })

    //Route for adding comments to the database
    app.post("/submitComment/articles/:id", (req, res) => {
        var id = req.params.id;
        console.log(id);
        console.log(req.body);

        //If there is a blank name value, then it is set to Anonymous
        if (req.body.name == "") {
            req.body.name = "Anonymous";
        };

        // Create a new Comment in the database
        db.Comment.create(req.body)
            .then(dbComment => {
                console.log("dbComment._id: " + dbComment._id);

                // If a Comment was created successfully, find its article (based on the id) and push the new Comment's _id to the Article's comments array
                // { new: true } tells the query that we want it to return the updated Article -- it returns the original by default
                // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
                return db.Article.findByIdAndUpdate(id, { $push: { comments: dbComment._id } }, { new: true });
            })
            .then(dbArticle => {
                // If the Article was updated successfully, send it back to the client
                console.log("dbArticle: ");
                console.log(dbArticle);
                res.send(dbArticle);
            })
            .catch(err => {
                // If an error occurs, send it back to the client
                res.send(err);
            });
    });

    //Route for deleting a comment from the database and from its related Article's comments array
    app.post("/deleteComment/:articleID/comments/:id", (req, res) => {
        var id = req.params.id;
        var articleID = req.params.articleID;
        console.log("articleID: " + articleID);
        console.log("id: " + id);
        console.log(req.body);

        //Find the specific comment by its id and remove it
        db.Comment.findByIdAndRemove(id, (err, data) => {
            // As always, handle any potential errors:
            if (err) return res.status(500).send(err);
            console.log("data._id: " + data._id);
        }).then(data2 => {
            //Find the specific article by its id and update its comments array, pulling out the deleted comment's id
            return db.Article.findByIdAndUpdate(articleID, { $pull: { comments: id } }, { multi: true });
        }).then(dbArticle => {
            //Let the client know of the successful deletion
            return res.status(200).send("Comment successfully deleted");
        });
    });

    //Route for manually scraping the AP News website
    app.get("/scrape", (req, res) => {

        axios.get("https://www.apnews.com/apf-topnews").then(response => {

            var $ = cheerio.load(response.data);

            var result = {};

            // Now, we grab the headline, byline, tag, article link, and summary from every Feedcard element
            $(".FeedCard").each((i, element) => {

                //The loop stops after ten results
                if (results.length > 9) {
                    return false;
                }

                var headline = $(element).find("h1").text().trim();
                var byline = $(element).find(".byline").text().trim();
                var tag = $(element).find(".HubTag").text().trim();
                var articleLink = $(element).find(".headline").attr("href");
                //var imageSrc = $(element).find("img").attr("src");
                var summary = $(element).find(".content").children().first().text().trim();

                //If there is no byline, it is set to Anonymous
                if (byline == "") {
                    byline = "Anonymous";
                }

                //Removing "BY" and "By" from each byline
                var cutByline1 = byline.replace("BY ", "");
                var cutByline2 = cutByline1.replace("By ", "");
                console.log("Byline: " + byline);

                // Add the headline, byline, tag, article link, and summary, and save them as properties of the result object
                result = {
                    headline: headline,
                    byline: cutByline2,
                    tag: tag,
                    articleLink: articleLink,
                    //imageSrc: imageSrc,
                    summary: summary
                };

                //Push each result to the results array
                results.push(result);

                //If all these have values, then the article information is added to the database (upserted if it is not already present)
                if (headline && tag && articleLink && summary) {
                    db.Article.updateOne({ headline: $(element).find("h1").text() }, result, { upsert: true })
                        .then(dbArticles => {
                            // View the added articles in the console
                            console.log(dbArticles);
                        })
                        .catch(err => {
                            // If an error occurred, log it
                            console.log(err);
                        });
                }

            });
            // Send the results to the client (to display as JSON)
            res.send(results);
        });


    });
};
