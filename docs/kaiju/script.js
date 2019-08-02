

(() => {
    // - 宣言セクション -------------------------------------------------------
    // この部分は、ブラウザのロードが完了する前の段階で呼び出されます。
    // ここでは、広い範囲で参照することになる変数や定数の宣言を行っておきます。
    // ただし、canvas のサイズの設定など、一部の設定項目についてはページのロード
    // が完了したあとでなければ行えません。
    // ウェブに不慣れだったりするとちょっと紛らわしいかもしれませんが、この宣言
    // セクションの部分が実行される段階ではページのロードが「完了していない」の
    // で、完了してからでなければできない設定は addEventListener('load', ...) の
    // あとで行うということだけでも覚えておきましょう。
    // ------------------------------------------------------------------------
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
    let plane;
    let box;
    let sphere;
    let cone;
    let torus;
    let directionalLight;
    let ambientLight;
    let axesHelper;
    // constant variables
    const RENDERER_PARAM = {
        clearColor: 0x333333
    };
    const MATERIAL_PARAM = {
        color: 0x555555,
        specular: 0x222222
    };
    const MATERIAL_PARAM_POINT = {
        color: 0x555555,
        size: 0.1
    };
    const DIRECTIONAL_LIGHT_PARAM = {
        color: 0x999999,
        intensity: 1.0,
        x: 1.0,
        y: 1.0,
        z: 1.0
    };
    const AMBIENT_LIGHT_PARAM = {
        color: 0x999999,
        intensity: 0.2
    };

    // - 初期化セクション -----------------------------------------------------
    // window のロードイベント後に実行される各種処理は、上記の宣言セクションで定
    // 義した変数や定数を用いて、各種オブジェクトを初期化するためのフェーズです。
    // ここで最初の設定を漏れなく行っておき、あとはレンダリングを行うだけのとこ
    // ろまで一気に処理を進めます。
    // ここでは出てきていませんが、ファイルを読み込むなどの非同期処理が必要にな
    // る場合には、このタイミングで実行すればよいでしょう。
    // ------------------------------------------------------------------------
    // entry point
    window.addEventListener('load', () => {
        // canvas
        canvasWidth  = window.innerWidth;
        canvasHeight = window.innerHeight;
        targetDOM    = document.getElementById('webgl');

        // scene and camera
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(50, canvasWidth / canvasHeight, 0.1, 100.0);
        camera.position.x = 0.0;
        camera.position.y = 0.1;
        camera.position.z = 14.0;
        camera.lookAt(new THREE.Vector3(0.0, 6.0, 0.0));

        // renderer
        renderer = new THREE.WebGLRenderer();
        renderer.setClearColor(new THREE.Color(RENDERER_PARAM.clearColor));
        renderer.setSize(canvasWidth, canvasHeight);
        targetDOM.appendChild(renderer.domElement);
        //controls = new THREE.OrbitControls(camera, renderer.domElement);

        // material and geometory
        material = new THREE.MeshPhongMaterial(MATERIAL_PARAM);
        materialPoint = new THREE.PointsMaterial(MATERIAL_PARAM_POINT);

        group = new THREE.Group();
        group2 = new THREE.Group();

        // plane
        geometry = new THREE.PlaneGeometry(100.0, 100.0);
        plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2.0;
        plane.position.set(0.0, 0.0, 0.0);
        group.add(plane);
        // box
        geometry = new THREE.BoxGeometry(4.0, 18.0, 6.0);
        box = new THREE.Mesh(geometry, material);
        box.position.x = 0.0;
        box.position.z = 0.0;
        group.add(box);

        //ランダムにbox生成して適当に置く
        geometry = new THREE.BoxGeometry(0.3, 1.0, 0.3);
        for (var i = 0; i < 1000; i++) {
          box = new THREE.Mesh(geometry, material);
          box.scale.y = randRange(0.001, 2.0);
          box.scale.x = randRange(0.001, 0.3);
          box.scale.z = randRange(0.001, 0.2);
          box.position.x = randRange(0.0, 20.0) - 10.0;
          box.position.z = randRange(0.0, 20.0) - 10.0;
            group2.add(box);
        }



        scene.add(group);
        scene.add(group2);


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
        //axesHelper = new THREE.AxesHelper(5.0);
        //scene.add(axesHelper);

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

    // - レンダリング処理 -----------------------------------------------------
    // 宣言セクションと初期化セクションで全ての準備が整っていれば、残すはレンダ
    // リングを行うことのみです。
    // このように、各処理を大雑把に「セクションとして分離」しておくことで、設定
    // しなければならない項目が膨大になる 3D プログラミングでも可読性の高い状態
    // を維持することができます。
    // もし、汎用的な処理などが今後追加されるとしても、このような大枠が決まって
    // さえいる状態を維持できていれば、メンテナンスや発展も行いやすくなります。
    // ------------------------------------------------------------------------
    // rendering
    function render(){
        if(run){requestAnimationFrame(render);}

        if(isDown === true){
            box.rotation.y    += 0.02;
            box.rotation.z    += 0.02;
            sphere.rotation.y += 0.02;
            sphere.rotation.z += 0.02;
            cone.rotation.y   += 0.02;
            cone.rotation.z   += 0.02;
            torus.rotation.y  += 0.02;
            torus.rotation.z  += 0.02;
        }
        group.rotation.y += 0.001;
        group2.rotation.y += 0.008;

        renderer.render(scene, camera);
    }
    function randRange(min, max) {
      return Math.random() * (max - min + 1) + min;
    };
})();
