
window.addEventListener('load', () => {
  let canvas;
  const $items = document.querySelectorAll('.list_item');
  $items.forEach(($item, i) => {
    // $itemのサイズを取得
    const rect = $item.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    /* canvasの要素を生成 */
    canvas = document.createElement('canvas');

    /* gamedivに、新しく作ったgamecanvasを追加 */
    if($item.querySelector('.canvas_wrap')){
      set_canvas($item.querySelector('.canvas_wrap').id, rect);
    }
  })

})

//set_canvas(document.getElementById('animcanvas2'));
function set_canvas(_this, _rect){

  let scene,
      camera,
      control,
      renderer,
      geometry,
      material,
      mesh,
      time;

  // variables
  let canvasWidth  = null;
  let canvasHeight = null;
  let targetDOM    = null;
  let run = false;
  let isDown = false;

  let startTime = Date.now();  // ループ開始時間
  let nowTime = 0.0;     // 現在までの経過時間

  let pointSize = 1.0;  // ポイントサイズ @@@
  let v_position;       // 頂点座標
  let v_color;          // 頂点カラー

  let controls;

  let tween = 0.0;
  let run_time = 0.0;

  // Stats
  let stats = new Stats();
  stats.setMode(0);
  stats.domElement.style.position = "absolute";
  stats.domElement.style.left = "0px";
  stats.domElement.style.top  = "0px";


  // constant
  const POINT_RESOLUTION = 100; // 頂点を一行に配置する個数
  const POINT_AREA_WIDTH = 19;   // 頂点を配置するエリアの広さ

  // constant variables
  const RENDERER_PARAM = {
      clearColor: 0xcccccc
  };

  let PARAM_SHADER_MATERIAL = {
    uniforms: {
      'time': { type: 'f', value: nowTime },
      'pointSize':  { type: 'f', value: pointSize },
      'tween':  { type: 'f', value: 0.0 }
    },
    vertexShader: document.getElementById('vertexShaderCurve').textContent,
    fragmentShader: document.getElementById('fragmentShader').textContent,
    side: THREE.DoubleSide,
    transparent: true
  }
  // canvas
  //canvasWidth  = window.innerWidth;
  canvasWidth = _rect.width;
  //canvasHeight = window.innerHeight;
  canvasHeight = _rect.height;
  //targetDOM    = document.getElementById("anim01");
  targetDOM    = document.getElementById(_this);
  //console.log(targetDOM);
  //targetDOM.appendChild(stats.domElement);

  // scene and camera
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, canvasWidth / canvasHeight, 0.1, 50.0);
  camera.position.x = 0.0;
  camera.position.y = 1.0;
  camera.position.z = 6.1;
  camera.lookAt(new THREE.Vector3(0.0, 1.0, 0.0));


  // renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(new THREE.Color(RENDERER_PARAM.clearColor));
  renderer.setSize(canvasWidth, canvasHeight);
  targetDOM.appendChild(renderer.domElement);
  //controls = new THREE.OrbitControls(camera, renderer.domElement);


  let gl = targetDOM.firstElementChild.getContext("webgl");
  if (!gl) {
    return;
  }

  init();


  function init(){
    geometry = new THREE.BufferGeometry();

    v_position = [];
    v_color = [];
    (() => {
        let i, j;                          // 汎用カウンタ変数
        let x, y;                          // XY の座標格納用
        let width = POINT_AREA_WIDTH;      // XY 平面の一辺の長さ
        let half = width / 2.0;            // 一辺の長さの半分（効率化のために先に求めておく）
        let resolution = POINT_RESOLUTION; // 平面上に配置する点の解像度
        let offset = width / resolution;   // 頂点間のオフセット量
        for(i = 0; i < resolution; ++i){
            // x 座標
            x = -half + offset * i;
            for(j = 0; j < resolution; ++j){
                // y 座標
                y = -half + offset * j;
                v_position.push(x, y, 0.0);
                v_color.push(1.0, 1.0, 1.0, 1.0);
            }
        }
    })();


    let positionAttribute = new THREE.Float32BufferAttribute(v_position, 3);
    let colorAttribute = new THREE.Uint8BufferAttribute(v_color, 4);
    colorAttribute.normalized = true;
    geometry.addAttribute( 'position', positionAttribute );
    geometry.addAttribute( 'color', colorAttribute );
    material = new THREE.ShaderMaterial(PARAM_SHADER_MATERIAL);
    mesh = new THREE.Points(geometry, material);
    mesh.rotation.x = -13.8;
    scene.add(mesh);
    // events
    window.addEventListener('keydown', (eve) => {
        run = eve.key !== 'Escape';
        if(eve.key === ' '){
            isDown = true;
        }
    }, false);
    window.addEventListener('resize', () => {
      const w = document.getElementById(_this).clientWidth;
      const h = document.getElementById(_this).clientHeight;
      console.log("resize "+w+ " : "+h);
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }, false);

    // マウスが要素に入った時のアニメーション
    targetDOM.parentNode.addEventListener('mouseenter', () => {
      const uniforms = material.uniforms;
      TweenMax.to(uniforms.tween, 0.8, {
        value: 0.8,
        ease: Power2.easeIn,
        onStart: function(){
          play_run();
        }
      })
    })
    // マウスが要素から離れた時のアニメーション
    targetDOM.parentNode.addEventListener('mouseleave', () => {
      const uniforms = material.uniforms
      TweenMax.to(uniforms.tween, 1.2, {
        value: 0.0,
        ease: Power2.easeIn,
        onComplete: function(){
          stop_run();
        }
      })

    })




    render();
  }

  function stop_run() {
    run = false;
    render();
  }
  function play_run() {
    run = true;
    render();
  }

  function render(){
    resizeCanvas(gl.canvas);
    if(run){requestAnimationFrame(render);}
    //console.log(run);
    // Stats
  	//stats.update();

    //material.uniforms.time.value += 0.02;
    mesh.rotation.z += 0.001;
  //  console.log(material.uniforms.tween.value);

    //time = performance.now();
    nowTime = (Date.now() - startTime) / 1000.0;
    material.uniforms.time.value = nowTime;
    renderer.render(scene, camera);
  }

  function resizeCanvas(canvas) {
    // ブラウザがcanvasを表示しているサイズを調べる。
    var displayWidth  = canvas.clientWidth;
    var displayHeight = canvas.clientHeight;

    // canvasの「描画バッファーのサイズ」と「表示サイズ」が異なるかどうか確認する。
    if (canvas.width  != displayWidth ||
        canvas.height != displayHeight) {

      // サイズが違っていたら、描画バッファーのサイズを
      // 表示サイズと同じサイズに合わせる。
      canvas.width  = displayWidth;
      canvas.height = displayHeight;
    }
  }
}
