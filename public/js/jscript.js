$(".toComment").on("click", function () {
    $(".articleGettingComment").empty();

    var thisId = $(this).attr("data-id");
    $(".commentSubmit").attr("data-id", thisId);

    $.getJSON("/article/" + thisId, function (data) {
        console.log(data.headline);
        $(".articleGettingComment").text(data.headline);

    });


});

$(".commentSubmit").on("click", function (e) {
    e.preventDefault();
    var thisId = $(this).attr("data-id");
    // Value taken from name input
    var name = $("#name").val();
    // Value taken from comment textarea
    var comment = $("#comment").val();
    console.log(name + ", " + comment);
    var postObj = {name: name, comment: comment};
    console.log(postObj);

    $.ajax({
        method: "POST",
        url: "/submitComment/articles/" + thisId,
        data: postObj
    })
        // With that done
        .then(function (data) {
            // Log the response
            console.log(data);
        });
    $('#commentModal').modal('hide');

});

