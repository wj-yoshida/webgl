(() => {
    // variables
    let canvasWidth  = null;
    let canvasHeight = null;
    let targetDOM    = null;
    let run = true;
    let startTime = 0.0;
    let nowTime = 0.0;
    // three objects
    let scene;
    let camera;
    let controls;
    let renderer;
    let directionalLight;
    let ambientLight;
    let axesHelper;
    let geometry;
    let earthSphere;   // 地球のメッシュ
    let earthTexture;  // 地球用のテクスチャ
    let earthMaterial; // 地球用のマテリアル
    let moonSphere;    // 月のメッシュ
    let moonTexture;   // 月のテクスチャ
    let moonMaterial;  // 月のマテリアル
    let moonGroup;     // 月用のグループ
    let satelliteSph;
    let satelliteTexture;
    let satelliteMaterial;
    let satelliteGroup;
    // constant variables
    const RENDERER_PARAM = {
        clearColor: 0x999999
    };
    const MATERIAL_PARAM = {
        color: 0xffffff
    };
    const DIRECTIONAL_LIGHT_PARAM = {
        color: 0xeeeeee,
        intensity: 0.9,
        x: 1.0,
        y: 1.0,
        z: 1.0
    };
    const AMBIENT_LIGHT_PARAM = {
        color: 0xcccccc,
        intensity: 0.4
    };

    // entry point
    window.addEventListener('load', () => {
        // canvas
        canvasWidth  = window.innerWidth;
        canvasHeight = window.innerHeight;
        targetDOM    = document.getElementById('webgl');

        // events
        window.addEventListener('keydown', (eve) => {
            run = eve.key !== 'Escape';
        }, false);
        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }, false);

        // texture load
        let earthLoader = new THREE.TextureLoader();
        let moonLoader = new THREE.TextureLoader();
        let satelliteLoader = new THREE.TextureLoader();
        earthTexture = earthLoader.load('earth.jpg', () => {
            moonTexture = moonLoader.load('moon.jpg', () =>{
              satelliteTexture = satelliteLoader.load('satellite.jpg', init);
            });
        });
    }, false);

    function init(){
        // scene and camera
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(60, canvasWidth / canvasHeight, 0.1, 50.0);
        camera.position.x = 0.0;
        camera.position.y = 3.0;
        camera.position.z = 10.0;
        camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));

        // renderer
        renderer = new THREE.WebGLRenderer();
        renderer.setClearColor(new THREE.Color(RENDERER_PARAM.clearColor));
        renderer.setSize(canvasWidth, canvasHeight);
        targetDOM.appendChild(renderer.domElement);
        controls = new THREE.OrbitControls(camera, renderer.domElement);

        // material
        earthMaterial = new THREE.MeshLambertMaterial(MATERIAL_PARAM);
        earthMaterial.map = earthTexture;
        moonMaterial = new THREE.MeshLambertMaterial(MATERIAL_PARAM);
        moonMaterial.map = moonTexture;
        satelliteMaterial = new THREE.MeshLambertMaterial(MATERIAL_PARAM);
        satelliteMaterial.map = satelliteTexture;

        // geometry
        geometry = new THREE.SphereGeometry(1.0, 64, 64);
        earthSphere = new THREE.Mesh(geometry, earthMaterial);
        scene.add(earthSphere);
        moonSphere = new THREE.Mesh(geometry, moonMaterial);

        // move mesh
        moonSphere.scale.set(0.36, 0.36, 0.36);  // 月を小さくし……
        moonSphere.position.set(2.75, 0.0, 0.0); // 月を動かし……
        moonSphere.rotation.y = Math.PI;         // 面をあらかじめ地球に向きにする
        scene.add(moonSphere);

        satellite01 = new THREE.Mesh(geometry, satelliteMaterial);
        satellite01.scale.set(0.22, 0.22, 0.22);
        scene.add(satellite01);

        satellite02 = new THREE.Mesh(geometry, satelliteMaterial);
        satellite02.scale.set(0.08, 0.08, 0.08);
        scene.add(satellite02);


        // lights
        directionalLight = new THREE.DirectionalLight(
            DIRECTIONAL_LIGHT_PARAM.color,
            DIRECTIONAL_LIGHT_PARAM.intensity
        );
        directionalLight.position.x = DIRECTIONAL_LIGHT_PARAM.x;
        directionalLight.position.y = DIRECTIONAL_LIGHT_PARAM.y;
        directionalLight.position.z = DIRECTIONAL_LIGHT_PARAM.z;
        scene.add(directionalLight);
        ambientLight = new THREE.AmbientLight(
            AMBIENT_LIGHT_PARAM.color,
            AMBIENT_LIGHT_PARAM.intensity
        );
        scene.add(ambientLight);

        // helper
        axesHelper = new THREE.AxesHelper(5.0);
        //scene.add(axesHelper);

        // begin
        startTime = Date.now();

        // rendering
        render();
    }

    // rendering
    function render(){
        if(run){requestAnimationFrame(render);}

        nowTime = (Date.now() - startTime) / 1000.0;

        earthSphere.rotation.y += 0.01;

        // 時間の経過からラジアンを求める
        let rad = nowTime % (Math.PI * 2.0);

        let sin = Math.sin(rad);
        let cos = Math.cos(rad);
        let x = cos * 2.75;
        let z = sin * 2.75;
        moonSphere.position.set(x, 0.0, -z);

        let sin2 = Math.sin(rad);
        let cos2 = Math.cos(rad);

        satellite01.rotation.y = rad;
        satellite01.position.x = moonSphere.position.x + cos2 * 1.2;
        satellite01.position.y = moonSphere.position.y + sin2 * 1.2;
        satellite01.position.z = moonSphere.position.z + sin2 * 1.2;

        let sin3 = Math.sin(rad);
        let cos3 = Math.cos(rad);

        satellite02.rotation.z = rad;
        satellite02.position.x = satellite01.position.x + sin3 * 0.45;
        satellite02.position.y = satellite01.position.y + cos3 * 0.45;
        satellite02.position.z = satellite01.position.z + cos3 * 0.45;

        renderer.render(scene, camera);
    }
})();
