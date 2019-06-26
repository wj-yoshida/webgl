let state = "start";
const ans = [
  ["E","F","F#","G","G#","A","A#","B","C","C#","D","D#","E","F","F#","G","G#","A","A#","B","C","C#","D","D#","E"],
  ["B","C","C#","D","D#","E","F","F#","G","G#","A","A#","B","C","C#","D","D#","E","F","F#","G","G#","A","A#","B"],
  ["G","G#","A","A#","B","C","C#","D","D#","E","F","F#","G","G#","A","A#","B","C","C#","D","D#","E","F","F#","G"],
  ["D","D#","E","F","F#","G","G#","A","A#","B","C","C#","D","D#","E","F","F#","G","G#","A","A#","B","C","C#","D"],
  ["A","A#","B","C","C#","D","D#","E","F","F#","G","G#","A","A#","B","C","C#","D","D#","E","F","F#","G","G#","A"],
  ["E","F","F#","G","G#","A","A#","B","C","C#","D","D#","E","F","F#","G","G#","A","A#","B","C","C#","D","D#","E"]
];
const mini_num = [
  [65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89],
  [60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84],
  [55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79],
  [50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74],
  [45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69],
  [40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64]
];
var _s,_f;
$(window).load(function(){
  for (var i = 0; i < 6; i++) {
    $('.siban').append("<div class='st' style='top: "+($('.siban').height()/5)*i+"px;'></div>");
  }

  var fl_wh = $('.siban').width()/24;
  for (var i = 0; i < 25; i++) {
    $('.siban').append("<div class='fl' style='left: "+fl_wh*i+"px;'></div>");
    if(i==0||i==2||i==4||i==6||i==8||i==11||i==14||i==16||i==18||i==20||i==23){
      $('.siban').append("<div class='po' style='left: "+(fl_wh*i)+"px; width: "+fl_wh+"px;'></div>");
      //console.log(i+"フレット "+((fl_wh*i)+Math.floor(fl_wh/2)));
    }
  }

  $('#btn').click(function(){

    if(state == "start"){
      _s = Math.floor(Math.random() * Math.floor(6));
      _f = Math.floor(Math.random() * Math.floor(24));
      var st_num = ($('.siban').height()/5) * _s  - 3;
      var fl_num = fl_wh * _f + fl_wh/2 - 3;
      $('.siban').append("<div class='point' style='top: "+st_num+"px; left: "+fl_num+"px;'></div>");
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
      $('.siban .point').remove();
      $('#btn').text("出題");
    }

  });



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
  var delay        = new DelayNode(audioctx);
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
