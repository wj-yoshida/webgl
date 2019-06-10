(() => {
    // variables
    let canvasWidth  = null;
    let canvasHeight = null;
    let targetDOM    = null;
    let run = true;
    let isDown = false;
    // three objects
    let scene;
    let camera;
    let controls;
    let renderer;
    let geometry;
    let material;
    let materialPoint;
    let boxs = [];
    let directionalLight;
    let ambientLight;
    let axesHelper;

    // constant variables
    const RENDERER_PARAM = {
        clearColor: 0x333333
    };
    const MATERIAL_PARAM = {
        color: 0x343434
    };
    const MATERIAL_PARAM_POINT = {
        color: 0x343434,
        size: 0.1
    };
    const DIRECTIONAL_LIGHT_PARAM = {
        color: 0xffffff,
        intensity: 1.0,
        x: 1.0,
        y: 1.0,
        z: 1.0
    };
    const AMBIENT_LIGHT_PARAM = {
        color: 0xffffff,
        intensity: 0.2
    };


    // entry point
    window.addEventListener('load', () => {
        // canvas
        canvasWidth  = window.innerWidth;
        canvasHeight = window.innerHeight;
        targetDOM    = document.getElementById('webgl');

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

        // material and geometory
        material = new THREE.MeshPhongMaterial(MATERIAL_PARAM);
        materialPoint = new THREE.PointsMaterial(MATERIAL_PARAM_POINT);

        // box
        //boxの大きさを設定
        const boxW = 1.0;
        geometry = new THREE.BoxGeometry(boxW, boxW, boxW);
        //boxの対面ごとにランダムな色を設定
        for ( var i = 0; i < geometry.faces.length; i += 2 ) {
            var hex = Math.random() * 0xffffff;
            geometry.faces[ i ].color.setHex( hex );
            geometry.faces[ i + 1 ].color.setHex( hex );
        }
        material = new THREE.MeshLambertMaterial({ vertexColors: THREE.FaceColors });
        let o_x = o_z = -5 + (boxW/2);
        let o_y =  5 - boxW/2;
        let _n = 0;
        for (let i = 0; i < 10; i++) {
          for (let j = 0; j < 10; j++) {
            boxs[_n] = new THREE.Mesh(geometry, material);
            boxs[_n].position.x =  o_x + i;
            boxs[_n].position.y = o_y - j;
            scene.add(boxs[_n]);
            _n++;
          }
        }
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
        scene.add(axesHelper);

        // events
        window.addEventListener('keydown', (eve) => {
            run = eve.key !== 'Escape';
            if(eve.key === ' '){isDown = true;}
        }, false);
        window.addEventListener('keyup', (eve) => {
            if(eve.key === ' '){isDown = false;}
        }, false);
        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }, false);

        // rendering
        render();
    }, false);

    // rendering
    function render(){
        if(run){requestAnimationFrame(render);}
        if(isDown === true){
          let _n = 0;
            for (let i = 0; i < 10; i++) {
              for (let j = 0; j < 10; j++) {
                boxs[_n].rotation.y += _n / 25000 * Math.PI;
            		boxs[_n].rotation.x += _n / 25000 * Math.PI;
            		//boxs[_n].scale.x = 0.3 * Math.sin( Date.now() / 2000) + 1;
            		//boxs[_n].scale.y = 0.3 * Math.sin( Date.now() / 2000) + 1;
            		boxs[_n].rotation.y += 0.005;
                _n++;
              }
            }
        }
        renderer.render(scene, camera);
    }
})();
