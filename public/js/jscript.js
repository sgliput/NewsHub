$(".toComment").on("click", function() {
    $(".articleGettingComment").empty();

    var thisId = $(this).attr("data-id");
    $(".commentSubmit").attr("data-id", thisId);

    $.getJSON("/article/" + thisId, data => {
        console.log(data.headline);
        $(".articleGettingComment").text(data.headline);

    });


});

$(".commentSubmit").on("click", e => {
    e.preventDefault();
    var thisId = $(e.currentTarget).attr("data-id");
    // Value taken from name input
    var name = $("#name").val();
    // Value taken from comment textarea
    var comment = $("#comment").val();
    var postObj = {name: name, comment: comment, articleID: thisId};
    console.log("postObj: ");
    console.log(postObj);

    $.ajax({
        method: "POST",
        url: "/submitComment/articles/" + thisId,
        dataType: "json",
        data: postObj
        
    })
        // With that done
        .then(data => {
            // Log the response
            console.log(data);
        });
    //$('#commentModal').modal('hide');
    location.reload();

});

$(".deleteComment").on("click", e => {
    e.preventDefault();
    let commentID = $(e.currentTarget).attr("data-commentid");
    console.log($(this));
    console.log("Comment ID: " + commentID);
    $.ajax({
        method: "POST",
        url: "/deleteComment/comments/" + commentID,
    }).then(data => {
        console.log(data);
    });
    location.reload();
})

