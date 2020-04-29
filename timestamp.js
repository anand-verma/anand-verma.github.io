var d = new Date();
var n = d.toDateString();
var t = d.toLocaleTimeString();
document.getElementById("time").innerHTML = "Last update on "+n+", "+t+".";
