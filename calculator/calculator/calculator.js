$(".input-button").click(function() {
   let input = $(event.target).attr('id');
   let current = $("#calculation").val();
   $("#calculation").val(current+input);
});

$("#clear").click(function() {
  $("#calculation").val("");
  $("#result").text("");
});

$('#submit').click(function() {
  try {
    let evaluation = eval($("#calculation").val());
    $("#result").text($("#calculation").val() + "=");
    $("#calculation").val(evaluation);
  } catch(error) {
    $("#result").text("Error");
    $("#calculation").val("");
  }
  $("#clear").text("AC");
});

