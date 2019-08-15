

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
    // animation model
    const clock = new THREE.Clock();
    let mixer;
    let baxim;

    // min から max までの乱数(実数)を返す
    function getRandomArbitary(min, max) {
      return Math.random() * (max - min) + min;
    }

    // 度からラジアンに変換
    function deg2rad(deg) {
      return deg * Math.PI / 180.0;
    }
    // constant variables
    const RENDERER_PARAM = {
        clearColor: 0x1f3441
    };
    const MATERIAL_PARAM = {
        color: 0x010609,
        specular: 0x000000
    };
    const MATERIAL_PARAM_POINT = {
        color: 0x555555,
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
        color: 0xaa9999,
        intensity: 0.4
    };
    const SCENE_PARAM = {
        fogColor: 0x1f3441, // フォグの色
        fogNear: 17.0,       // フォグの掛かり始める距離
        fogFar: 32.0        // フォグが完全に掛かる距離
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
        camera = new THREE.PerspectiveCamera(37, canvasWidth / canvasHeight, 0.1, 100.0);
        camera.position.x = 0.0;
        camera.position.y = 0.06;
        camera.position.z = 27.0;
        camera.lookAt(new THREE.Vector3(0.0, 9.0, 0.0));

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

        var sky_mat = new THREE.SpriteMaterial({
          map: new THREE.TextureLoader().load("images/sky.jpg")
        });
        var sky = new THREE.Sprite(sky_mat);
        sky.scale.set(30, 30, 1);
        sky.position.y = 10;
        sky.position.z = -2;
        scene.add(sky);



        // ビルボード相当用のテクスチャ読み込み
        var texFileList = [
          "images/tree0.png",
          "images/tree1.png",
          "images/tree2.png"
        ];
        var texTrees = [];
        for (var i = 0; i < texFileList.length; i++) {
          texTrees.push(new THREE.TextureLoader().load(texFileList[i]));
          texTrees[i].anisotropy = renderer.getMaxAnisotropy();
        }

        // ビルボード相当を Sprite を使って作成

        var trees = [];
        var treesScale = [];
        var r = 20;

        for (var i = 0; i < 800; i++) {
          var w = getRandomArbitary(0.7, 2);
          treesScale.push(w);

          var mat = new THREE.SpriteMaterial({
            map: texTrees[Math.floor(Math.random() * texTrees.length)],
            transparent: true,
            fog: true,
            color: 0xffffff,
          });

          //var x = getRandomArbitary(-r, r);
          var x = randRange(0.0, 34.0) - 17;
          var y = w / 2 ;
          //var z = getRandomArbitary(-r, r);
          var z = randRange(0.0, 34.0) - 17;

          var tree = new THREE.Sprite(mat);
          trees.push(tree);

          tree.position.set(x, y, z);
          tree.scale.set(w, w, 1);

          // これを入れないと透過部分がおかしくなる
          tree.renderOrder = 1;

          group2.add(tree);

        }




        let action;
        const loader = new THREE.GLTFLoader();
        loader.load( './bakixim_3.glb', ( gltf ) => {
          mixer = new THREE.AnimationMixer( gltf.scene );
          action = mixer.clipAction( gltf.animations[ 0 ] );//アニメーション番号

        	group.add( gltf.scene );
          action.play();
        } );


        group.scale.x = 2.0;
        group.scale.y = 2.0;
        group.scale.z = 2.0;
        scene.add(group);
        scene.add(group2);


        scene.fog = new THREE.Fog(
            SCENE_PARAM.fogColor,
            SCENE_PARAM.fogNear,
            SCENE_PARAM.fogFar
        );


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


/*
        // テクスチャ読み込み
        var r = "images/";
        var urls = [
          r + "posx.jpg",
          r + "negx.jpg",
          r + "posy.jpg",
          r + "negy.jpg",
          r + "posz.jpg",
          r + "negz.jpg",
        ];
        var texCube = new THREE.CubeTextureLoader().load(urls);
        texCube.format = THREE.RGBFormat;
        texCube.mapping = THREE.CubeReflectionMapping;

        // skybox用のマテリアルを生成
        var cubeShader = THREE.ShaderLib["cube"];
        var cubeMat = new THREE.ShaderMaterial({
          fragmentShader: cubeShader.fragmentShader,
          vertexShader: cubeShader.vertexShader,
          uniforms: cubeShader.uniforms,
          depthWrite: false,
          side: THREE.BackSide,
        });

        cubeMat.uniforms["tCube"].value = texCube;

        // Skybox用ジオメトリ生成
        var d = 10000;
        var cubeGeo = new THREE.BoxGeometry(d, d, d);
        cubeMesh = new THREE.Mesh(cubeGeo, cubeMat);
        scene.add(cubeMesh);
        */

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
        const delta = clock.getDelta();

        if ( !! mixer ) mixer.update( delta );//mixerが存在するときだけ

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
        group.rotation.y += 0.0005;
        group2.rotation.y += 0.006;

        renderer.render(scene, camera);
    }
    function randRange(min, max) {
      return Math.random() * (max - min + 1) + min;
    };
})();
