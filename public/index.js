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
})
