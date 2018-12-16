# NewsHub

## Deployed site

https://radiant-cliffs-10850.herokuapp.com/

## Overview

News Hub is a full-stack web-scraping application, deployed on Heroku and using an Express server, Handlebars rendering, Bootstrap styles, and a MongoDB database with Mongoose models.

It requires the following NPM packages:
* express
* express-handlebars
* mongoose
* axios
* cheerio

## User Experience

When the user arrives at the home page, a Bootstrap accordion of collapsible panels is displayed on the right, each one representing an article from the Mongo database, showing its headline (linked to the article), byline, article tag, and a summary from the beginning of the article. Clicking each panel's arrow reveals its collapsed area, including a button to "Post a Comment." If the article has comments, they are displayed above this button, each comment with a delete button to remove that comment.

Clicking the "Post a Comment" button opens a modal for inputting a name and a comment, and also empties the fields and disables the submit button. The Comment field must have a value for the submit button to be enabled, and if there is no name value, then it is set to "Anonymous." When the submit button is clicked, the page reloads to reflect the added comment. The page also reloads when a comment is deleted.

On the left side of the page is a column of buttons, alphabetically listing the article tags. Clicking one of these buttons causes the right side to only show articles with that tag. Two buttons above this column ("Search by Tag", "Search by Byline") allow the user the switch between a column of tag buttons or a column of byline buttons. Clicking one of the byline buttons will likewise display the articles by that writer. Clicking the "All Stories" button to the right displays the original home page with all of the articles.

Two buttons near the bottom allow you to view all of the articles or all of the comments as an array of JSON objects.

## Behind the Scenes

There are two Mongoose models, one for articles and one for comments.

The Article model has the following schema:
* headline (unique)
* byline (default "Anonymous")
* tag
* articleLink (unique)
* summary
* comments array connected to the Comments model

The Comments model has the following schema:
* name (default "Anonymous")
* comment (required)
* articleID (required)

When the home page loads, an Axios call scrapes the first ten articles from the AP website's Top News page (https://www.apnews.com/apf-topnews). Only ten are returned because the number of articles exceeds forty and might make the page too long. Using Cheerio parsing, Axios scrapes all the pertinent information from each news story card with some changes (removing "By" from the byline, setting the byline to "Anonymous" if there is no author), puts it all in an object, and upserts each object to the Mongo database. However, the Mongoose model for articles ensures that headlines and URLs are unique, preventing multiple copies from entering the database.

Also when the home page loads, it retrieves all articles from the database, including their related comments, and renders the index.handlebars page with the results (reversed in order so that the most recently scraped articles are shown first), as well as mapped arrays for displaying the columns of tags and bylines. When one of the tag or byline buttons is clicked, a query is sent to retrieve the corresponding article(s) and render the index page very similarly.

Clicking the "Post a Comment" button sends a query to find the specific article the button is under, so that its headline can be displayed in the comment modal. Clicking the submit button posts the new comment to the Comments collection in the database, while also pushing its comment id to the comments array of the corresponding article. When a comment is deleted, it similarly is deleted from the Comments collection and its id pulled from the corresponding comments array.



