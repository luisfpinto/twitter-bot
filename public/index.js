$(document).ready(function () {
  $( "#login" ).click(function () {
    $.ajax({
      url: 'http://localhost:9090/auth/login',
      crossDomain: true,
      error: function () {
        $('#info').html('<p style="color:red">An error has occurred</p>')
      },
      success: function (data) {
        if (data.url !== undefined) window.location.href = data.url
        else if (data.userLogged) $('#info').html('<p style="color:Green">User already logged in</p>')
      },
      type: 'GET'
    })
  })

  $( "#follow" ).click(function () {
    let user = $("#user").val()
    let filter = $("#filter").val()
    $.ajax({
      type: 'GET',
      url: 'http://localhost:9090/follow',
      crossDomain: true,
      contentType: 'application/json',
      data: {
        user,
        filter
      },
      error: function (error) {
        $('#info').html(`<p style="color:red">An error has occurred: ${error.responseText}</p>`)
      },
      success: function (data) {
       $('#info').html('<p style="color:Green">Following users</p>')
      },
      type: 'GET'
    })
  })

  $( "#unfollow" ).click(function () {
    $.ajax({
      type: 'GET',
      url: 'http://localhost:9090/unfollow',
      crossDomain: true,
      error: function (error) {
        $('#info').html(`<p style="color:red">An error has occurred: ${error.responseText}</p>`)
      },
      success: function (data) {
       $('#info').html('<p style="color:Green">Unfollowing users</p>')
      },
      type: 'GET'
    })
  })
})
