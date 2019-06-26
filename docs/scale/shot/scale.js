let state = "start";
const ans = [
  ["E","F","F#","G","G#","A","A#","B","C","C#","D","D#","E","F","F#","G","G#","A","A#","B","C","C#","D","D#","E"],
  ["B","C","C#","D","D#","E","F","F#","G","G#","A","A#","B","C","C#","D","D#","E","F","F#","G","G#","A","A#","B"],
  ["G","G#","A","A#","B","C","C#","D","D#","E","F","F#","G","G#","A","A#","B","C","C#","D","D#","E","F","F#","G"],
  ["D","D#","E","F","F#","G","G#","A","A#","B","C","C#","D","D#","E","F","F#","G","G#","A","A#","B","C","C#","D"],
  ["A","A#","B","C","C#","D","D#","E","F","F#","G","G#","A","A#","B","C","C#","D","D#","E","F","F#","G","G#","A"],
  ["E","F","F#","G","G#","A","A#","B","C","C#","D","D#","E","F","F#","G","G#","A","A#","B","C","C#","D","D#","E"]
];
const note_arr = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const mini_num = [
  [64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88],
  [59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83],
  [55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79],
  [50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74],
  [45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69],
  [40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64]
];

var audioContext = new AudioContext();
var _s,_f;
var mode = 'free';
var hit_note = "C";
var rm_cur = "";
var note_cnt;
$(window).load(function(){
  for (var i = 0; i < 6; i++) {
    $('#fingerboard').append("<div class='st' style='top: "+($('#fingerboard').height()/5)*i+"px;'></div>");
  }
  var fl_wh = $('#fingerboard').width()/24;
  var fl_he = $('#fingerboard').height()/5;
  for (var i = 0; i < 25; i++) {
    $('#fingerboard').append("<div class='fl' style='left: "+fl_wh*i+"px;'></div>");
    if(i==0||i==2||i==4||i==6||i==8||i==11||i==14||i==16||i==18||i==20||i==23){
      $('#fingerboard').append("<div class='po' style='left: "+(fl_wh*i)+"px; width: "+fl_wh+"px;'></div>");
      //console.log(i+"フレット "+((fl_wh*i)+Math.floor(fl_wh/2)));
    }
    for (var j = 0; j < 6; j++) {
      $('#fingerboard').append("<div class='htp' style='top: "+((fl_he*j) - (fl_he/2))+"px;left: "+(fl_wh*i - fl_wh)+"px; width: "+fl_wh+"px; height: "+fl_he+"px;' data-x='"+i+"' data-y='"+j+"'><i></i></div>");
    }
  }
  $('#fingerboard .htp i').css({'width':(fl_wh/2),'height':(fl_wh/2), 'top':(fl_he/2)+'px', 'left':(fl_wh/2)+'px'});
  $('#btn').click(function(){

    if(mode=="free"){
      if(state == "start"){

        _s = Math.floor(Math.random() * Math.floor(6));
        _f = Math.floor(Math.random() * Math.floor(24));
        var st_num = ($('#fingerboard').height()/5) * _s  - 3;
        var fl_num = fl_wh * _f + fl_wh/2 - 3;
        $('#fingerboard').append("<div class='point' style='top: "+st_num+"px; left: "+fl_num+"px;'></div>");
        $('#que').text((_s+1)+"弦 "+(_f+1)+"フレット");
        $('#btn').text("答え");
        state = "answer";
        coin(audioContext.destination, audioContext.currentTime , mini_num[_s][_f+1]);
      }else if(state == "answer"){
        state = "reset";
        $('#btn').text("正解");
        $('#ans').text(ans[_s][_f+1]);
      }else  if(state == "reset"){
        state = "start";
        $('#que').text(" ");
        $('#ans').text(" ");
        $('#fingerboard .point').remove();
        $('#btn').text("出題");
      }
    }else if(mode=="hit"){
      $('#fingerboard .htp').removeClass("app");

      var rm = generate_random(rm_cur);
      rm_cur = rm;
      //console.log(note_arr[rm]);
      hit_note = note_arr[rm];
      note_cnt = cnt_note(hit_note);
      $('#ans').text(hit_note+" あと"+note_cnt+"個");
    }

  });

  $('.htp').on({
    'click': function() {
        //console.log(ans[$(this).data('y')][$(this).data('x')]);
        coin(audioContext.destination, audioContext.currentTime , mini_num[$(this).data('y')][$(this).data('x')]);
        if(mode == "free"){
          set_mode_free($(this).data('y'),$(this).data('x'));
        }else if(mode == "hit"){
          set_mode_hit($(this).data('y'),$(this).data('x'));
        }
    }
  })

  $('#box .mode p').on({
    'click': function() {
      $('#que').html('');
      $('#box .mode p').removeClass('act');
      $(this).addClass('act');
      if($(this).hasClass('free')){
        $('#que').text(" ");
        $('#ans').text(" ");
        $('#btn').text("出題");
        $('#fingerboard .htp').removeClass("app");
        mode = "free";
      }else if($(this).hasClass('hit')){
        $('#que').text(" ");
        $('#ans').text(" ");
        $('#fingerboard .point').remove();
        $('#btn').text("音からフレット");
        mode = "hit";
      }
    }
  })

})

var delay1;

function coin(destination, playbackTime, mini_num) {
  var t0 = playbackTime;
  var t1 = t0 + tdur(180, 16);
  var t2 = t0 + tdur(180, 4) * 3;
  var si = mtof(mini_num);
  var mi = mtof(mini_num);
  var audioContext = destination.context;
  var oscillator   = audioContext.createOscillator();
  var lfo          = audioContext.createOscillator();  // for LFO
  var delay        = new DelayNode(audioContext);
  var gain         = audioContext.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(si, t0);
  //oscillator.frequency.setValueAtTime(mi, t1);
  oscillator.start(t0);
  oscillator.stop(t2);

  oscillator.connect(gain);

  gain.gain.setValueAtTime(0.5, t0);
  gain.gain.setValueAtTime(0.5, t1);
  gain.gain.linearRampToValueAtTime(0, t2);
  gain.connect(destination);
}

function mtof(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function tdur(tempo, length) {
  return (60 / tempo) * (4 / length);
}

function set_mode_free(st, fl){
  $('#que').html( ans[st][fl] );
}

function set_mode_hit(st, fl){
  if( ans[st][fl] == hit_note ){
    $('#fingerboard .htp').each(function(){
      if( $(this).data('y') == st &&  $(this).data('x') == fl ){
        $('#ans').text(hit_note+" あと"+(note_cnt--)+"個");
        $(this).addClass("app");
      }
    })
  }
}

function generate_random(cur){
  var rm;
  while (true) {
    rm = Math.floor(Math.random() * 11);
    if(rm != cur){
      return rm;
      break;
    }
  }
}

function cnt_note(hit_note){
  var _cnt = 0;
  for (var i = 0; i < ans.length; i++) {
    for (var j = 0; j < ans[0].length; j++) {
      if(ans[i][j] == hit_note)_cnt++;
    }
  }
  return _cnt;
}
