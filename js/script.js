var courses = [
  //['name', 'thumbn', 'short-description', 'price', 'link', `long-desc`, `#hash`],

  [`<strong>AI Influencer</strong> - <br>
    Make Money online with Social Media
    `, './images/AI influencer.png', 'short-description', '3,000', '', '','AI_Influencer'],

  [`Automated Digital Marketing &<br>
    Social Media Generative AI
    `, './images/Automated marketing2.png', 'short-description', 'price', '', '','Automated_Digital_Marketing'],

  [`Government Marketing & <br>
    Business Development Masterclass`, './images/Government Masterclass.png', '', 'price', '', '','Government_Marketing'],

  [`ARTIFICIAL INTELLIGENCE`, './images/Artificial intelligence A-Z.png', `Build 5 AI (including chatGPT)`, 'price','', '', 'ARTIFICIAL_INTELLIGENCE'],

  //['', '', '', '', '', ''],

  //['','','','','', ''],
];
/*
      <div class="thumbnail_pix" style="background-image: url('');background-size: cover;">
        
      </div>
*/
function course_(a, b, c, d, e) {
  var card = `    
  <div class="tut_box">
    <div class="thumb_n_name_container">
      <img class="thumbnail_pix" src="${b}" alt="" srcset="">
      <div class="tut_name">
        ${a}
      </div>
    </div>

    <div class="tut_desc">
      ${c} <span> more...</span>
    </div>

    <div class="price">
      #${d}
    </div>

    <a href="${location.pathname}#${e}">
      <div class="price order" title="${e}">
        Order Now
      </div>
    </a>
  </div>
  `;
  return card;
}

function show_single_course(a, b, c, d, e){
  var card = `    
  <div class="tut_box">
    <div class="thumb_n_name_container">
      <img class="thumbnail_pix" src="${b}" alt="" srcset="">
      <div class="tut_name">
        ${a}
      </div>
    </div>

    <div class="tut_desc">
      ${c} <span> more...</span>
    </div>

    <div class="price">
      #${d}
    </div>

    <a href="${location.pathname}#${e}">
      <div class="price order" title="${e}">
        Pay Now
      </div>
    </a>
  </div>
  `;
  return card;
}
/*
 child.addEventListener('click', (e)=>{
		let ta = e.target.id;
		let da = e.target.title;

  window.addEventListener('hashchange', function () {
    if(window.location.hash!='#coming_soon'){
      $("#c_soon").slideUp();
    }
  });
    */
function change_to_lowercase(x){
  return x
}
$('.back_').click(() => {
	$('#selected_course').slideUp();
	$('#course_content').slideDown();
});


  window.addEventListener('hashchange', function () {
    let selected_a_course = false;

    courses.forEach((element, i) => {
      //console.log(element," = ",index);
  
      if ((location.hash).toLowerCase() == (`#`+courses[i][6]).toLowerCase()) {
        selected = i;
        selected_a_course = true;
      }
  
    });
  
    if(selected_a_course){
      show_selected_course(selected);
    }else{
      $('#selected_course').slideUp();
      $('#course_content').slideDown();
    }
   
  });

function show_selected_course(selected){
  document.getElementById('selected_course2').innerHTML = course_(courses[selected][0], courses[selected][1], courses[selected][2], courses[selected][3]);
  document.getElementById('course_content').style.display='none';
  $('#selected_course').slideDown(700);
}

$(document).ready(function () {
  var content = '', selected = '',selected_a_course=false;

  courses.forEach((element, i) => {
    //console.log(element," = ",index);
    content += course_(courses[i][0], courses[i][1], courses[i][2], courses[i][3], courses[i][6]);

    let current_course = `#`+courses[i][6].toLowerCase();
    
  console.log('working -', location.hash.toLowerCase(), ' -- ', current_course);

    if (location.hash.toLowerCase() == current_course) {
      selected = i;
      selected_a_course = true;
    }

  });

  document.getElementById('course_content').innerHTML = content;

  if(selected_a_course){
    show_selected_course(selected);
  }

});

/* lifted code from kunlevideo.html */
var lnko = location.hash;
console.log('#ash_it -', lnko);

if (location.hash == 'javascript') {
  show_tab('javascript');
  //how to scroll to an element using jQuery
}
function navi(x) {
  if (location.hash == x && document.getElementById(x)) {
    $('#' + x).css({ 'display': 'block' });
    $(document).ready(function () {
      $('#' + x)[0].scrollIntoView(true);
    });
  }
}
if (document.getElementById('graphics2')) {
  console.log('yes');
} else {
  console.log('no');
}