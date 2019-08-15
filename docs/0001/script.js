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
let run = true;
let isDown = false;

let startTime = Date.now();  // ループ開始時間
let nowTime = 0;     // 現在までの経過時間

let pointSize = 1.0;  // ポイントサイズ @@@
let v_position;       // 頂点座標
let v_color;          // 頂点カラー

let controls;



// Stats
let stats = new Stats();
stats.setMode(0);
stats.domElement.style.position = "absolute";
stats.domElement.style.left = "0px";
stats.domElement.style.top  = "0px";


// constant
const POINT_RESOLUTION = 100; // 頂点を一行に配置する個数
const POINT_AREA_WIDTH = 17;   // 頂点を配置するエリアの広さ

// constant variables
const RENDERER_PARAM = {
    clearColor: 0xaaaaaa
};

const PARAM_SHADER_MATERIAL = {
  uniforms: {
    'time': { type: 'f', value: 1.0 },
    'pointSize':  { type: 'f', value: pointSize }
  },
  vertexShader: document.getElementById('vertexShaderCurve').textContent,
  fragmentShader: document.getElementById('fragmentShader').textContent,
  side: THREE.DoubleSide,
  transparent: true
}

window.addEventListener('load', () => {


  // canvas
  canvasWidth  = window.innerWidth;
  canvasHeight = window.innerHeight;
  targetDOM    = document.getElementById('webgl');

  targetDOM.appendChild(stats.domElement);

  // scene and camera
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, canvasWidth / canvasHeight, 0.1, 50.0);
  camera.position.x = 0.0;
  camera.position.y = 1.0;
  camera.position.z = 6.2;
  camera.lookAt(new THREE.Vector3(0.0, 1.0, 0.0));



  // renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(new THREE.Color(RENDERER_PARAM.clearColor));
  renderer.setSize(canvasWidth, canvasHeight);
  targetDOM.appendChild(renderer.domElement);
  //controls = new THREE.OrbitControls(camera, renderer.domElement);


  init();
})




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
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
  }, false);


  render();
}

function render(){
  // Stats
	stats.update();

  material.uniforms.time.value += 0.02;
  mesh.rotation.z += 0.001;
  if(run){requestAnimationFrame(render);}
  time = performance.now();

  renderer.render(scene, camera);
}
