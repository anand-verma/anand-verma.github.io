var d = new Date();
var n = d.toDateString();
var t = d.toLocaleTimeString();
document.getElementById("demo").innerHTML = "Last update on "+n+", "+t+".";
