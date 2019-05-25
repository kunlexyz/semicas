/*
function mODE(elem){
elem.css({"margin-left": siz+"px"});

}
mODE('#logoTem');
*/
function openNav() {
  document.getElementById("myNav").style.width = "85%";
}

function closeNav() {
  document.getElementById("myNav").style.width = "0%";
}

function showCon(ccon){
	$(ccon).toggle(1500);
}
var siz = Math.floor(window.innerWidth/4);
$(document).ready(function(){

$('#logoTem').css({"width": window.innerWidth+"px","margin-left": '110px',"margin-top": '101px'});
$('#logoTem').animate({"margin-left": '10px',"margin-top": '0px',"width":'180px'}, 4500,(function(){
	$('#logoTem').css({"display": "none"})
	}));
$('#starta').hide(4000);
    
});

function starta(){
alert(siz);
$('#logoTem').css({"margin-left": siz+"px"});
}

//starta();

