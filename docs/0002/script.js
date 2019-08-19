
window.addEventListener('load', () => {
  let canvas;
  const $items = document.querySelectorAll('.list_item');
  $items.forEach(($item, i) => {
    // $itemのサイズを取得
    const rect = $item.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    canvas = document.createElement('canvas');

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

  let canvasWidth  = null;
  let canvasHeight = null;
  let targetDOM    = null;
  let run = false;
  let isDown = false;

  let startTime = Date.now(); // ループ開始時間
  let nowTime = 0.0;          // 経過時間
  let pointSize = 1.0;        // ポイントサイズ
  let v_position;       // 頂点座標
  let v_color;          // 頂点カラー

  let tween = 0.0;


  // constant
  const POINT_RESOLUTION = 100; // 頂点を一行に配置する個数
  const POINT_AREA_WIDTH = 20;   // 頂点を配置するエリアの広さ

  // constant variables
  const RENDERER_PARAM = {
      clearColor: 0xe6e6e6
  };

  let PARAM_SHADER_MATERIAL = {
    uniforms: {
      'time': { type: 'f', value: nowTime },
      'pointSize':  { type: 'f', value: pointSize },
      'tween':  { type: 'f', value: 0.0 }
    },
    vertexShader: [
      "uniform float pointSize;",
      "uniform float time;",
      "uniform float tween;",
      "float _t;",
      "vec3 vPosition;",
      "varying vec4 vColor;",
      "void main()",
      "{",
        "float _time =  time * 0.7;",
        "_t = cos(_time) * 0.04;",
        "float _x = position.x + sin(position.y * 1.1 + ( _time + (_t))) * 0.5;",
        "float _y = position.y + sin(position.z * 1.1 + ( _time + (_t))) * 0.5;",
        "float _z = sin(position.y * 1.2  + _time) * cos(position.x * 1.2 + _time) * 0.5;",
        "vec4 mvPosition = modelViewMatrix * vec4(_x, _y, _z, 1.0);",
        "gl_Position = projectionMatrix * mvPosition;",
        "vPosition =  vec3(_x, _y, _z);",
        "gl_PointSize = 9.0 - clamp(distance(cameraPosition, vec3(_x, _y, _z)), 7.7, 9.0);",
        "vColor = vec4( (vPosition.z+1.6),  (vPosition.z+1.6),  (vPosition.z+1.6) , (1.0 - vPosition.z) * tween);",
      "}"
    ].join( "\n" ),
    fragmentShader:[
      "varying vec4 vColor;",
      "void main() {",
        "gl_FragColor = vColor;",
      "}"
    ].join( "\n" ),
    side: THREE.DoubleSide,
    transparent: true
  }
  // canvas
  canvasWidth = _rect.width;
  canvasHeight = _rect.height;
  targetDOM    = document.getElementById(_this);

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
        let i, j;
        let x, y;
        let width = POINT_AREA_WIDTH;
        let half = width / 2.0;
        let resolution = POINT_RESOLUTION;
        let offset = width / resolution;
        for(i = 0; i < resolution; ++i){
            x = -half + offset * i;
            for(j = 0; j < resolution; ++j){
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
    //mesh.rotation.z += 0.001;
    nowTime = (Date.now() - startTime) / 1000.0;
    material.uniforms.time.value = nowTime;
    renderer.render(scene, camera);
  }

  function resizeCanvas(canvas) {
    var displayWidth  = canvas.clientWidth;
    var displayHeight = canvas.clientHeight;

    if (canvas.width  != displayWidth ||
        canvas.height != displayHeight) {
      canvas.width  = displayWidth;
      canvas.height = displayHeight;
    }
  }
}
