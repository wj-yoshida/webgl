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
    let plane;
    let box;
    let sphere;
    let cone;
    let torus;
    let group; // group @@@
    let directionalLight;
    let ambientLight;
    let axesHelper;

    let font_loader;
    let txt = [];
    let txt_materials;
    let textMesh = [];
    let clock_ticks = [];

    let mnt_hand;
    let small_hand;
    let big_hand;
    let hand_base;

    // constant variables
    const RENDERER_PARAM = {
        clearColor: 0x111111
    };
    const MATERIAL_PARAM = {
        color: 0x383838,
        specular: 0x444444
    };
    const MATERIAL_PARAM_POINT = {
        color: 0x444444,
        size: 0.1
    };
    const DIRECTIONAL_LIGHT_PARAM = {
        color: 0x555555,
        intensity: 0.8,
        x: 5.5,
        y: 0.3,
        z: 9.0
    };
    const AMBIENT_LIGHT_PARAM = {
        color: 0x666666,
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
        camera = new THREE.PerspectiveCamera(50, canvasWidth / canvasHeight, 0.1, 50.0);
        camera.position.x = 0.0;
        camera.position.y = 0.0;
        camera.position.z = 10.0;
        camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));

        // renderer
        renderer = new THREE.WebGLRenderer();
        renderer.setClearColor(new THREE.Color(RENDERER_PARAM.clearColor));
        renderer.setSize(canvasWidth, canvasHeight);
        targetDOM.appendChild(renderer.domElement);
        controls = new THREE.OrbitControls(camera, renderer.domElement);

        // - グループを使う ---------------------------------------------------
        // three.js のオブジェクトは、グループにひとまとめにすることができます。
        // グループを使わないと実現できない挙動、というのも一部にはありますので、
        // ここで使い方だけでもしっかり覚えておきましょう。
        // 特に、グループに追加したことによって「回転や平行移動の概念が変わる」
        // ということが非常に重要です。
        // --------------------------------------------------------------------
        // group @@@
        group = new THREE.Group();

        // material and geometory
        material = new THREE.MeshPhongMaterial(MATERIAL_PARAM);
        materialPoint = new THREE.PointsMaterial(MATERIAL_PARAM_POINT);


        //土台
        geometry = new THREE.CylinderGeometry( 3.5, 3.5, 0.5, 30 );
        box = new THREE.Mesh( geometry, material );
        box.rotation.x = THREE.Math.degToRad(90);
        box.position.z = -0.5;
        scene.add( box );

        // torus
        geometry = new THREE.TorusGeometry(0.9, 0.02, 32, 32);
        torus = new THREE.Mesh(geometry, material);
        torus.position.x = 0.0;
        torus.position.z = 0.0;
        torus.scale.z = 0.04;
        group.add(torus); // group に add する @@@

        // group をシーンに加える @@@
        scene.add(group);

        //文字盤
        font_loader = new THREE.FontLoader();
        font_loader.load( 'helvetiker_bold.typeface.json', function ( font ) {
          let radius = 2.4;
          const center = 0;
          for (let i = 1; i < 13; i++) {
            let view_txt = "";
            view_txt = ""+i;
            txt[i] = new THREE.TextGeometry( view_txt , {
          		font: font,
          		size: 0.35,
          		height: 0.35,
          		curveSegments: 12,
          		bevelEnabled: false
          	});
            txt[i].center();
            txt_materials = [
          	   //	new THREE.MeshBasicMaterial( { color: Math.random() * 0xffffff, overdraw: 0.5 } ),
          		new THREE.MeshBasicMaterial( { color: 0x383838 } )
          	];
          	textMesh[i] = new THREE.Mesh(txt[i], txt_materials);
            const t =  360/12 * i;
            textMesh[i].position.x = center + radius * Math.sin( t * (Math.PI / 180) ) ;
            textMesh[i].position.y = center + radius * Math.cos( t * (Math.PI / 180) ) ;
            textMesh[i].position.z = 0.05;
          	scene.add(textMesh[i]);
          }
        } );
        font_loader.load( 'helvetiker_regular.typeface.json', function ( font ) {
          let radius = 2.85;
          const center = 0;
          for (let i = 1; i < 13; i++) {
            let view_txt = 0;
            view_txt = ""+i*5;
            txt[i] = new THREE.TextGeometry( view_txt , {
          		font: font,
          		size: 0.12,
          		height: 0.12,
          		curveSegments: 12,
          		bevelEnabled: false
          	});
            txt[i].center();
            txt_materials = [
          	   //	new THREE.MeshBasicMaterial( { color: Math.random() * 0xffffff, overdraw: 0.5 } ),
          		new THREE.MeshBasicMaterial( { color: 0x383838 } )
          	];
          	textMesh[i] = new THREE.Mesh(txt[i], txt_materials);
            const t =  360/12 * i;
            textMesh[i].position.x = center + radius * Math.sin( t * (Math.PI / 180) ) ;
            textMesh[i].position.y = center + radius * Math.cos( t * (Math.PI / 180) ) ;
            textMesh[i].position.z = 0.05;
            textMesh[i].rotation.z = THREE.Math.degToRad(-t);
          	scene.add(textMesh[i]);
          }
        } );

        //時計の目盛
        const tick_line_geo = new THREE.Geometry();
        const lineMeshTemp = [];
        let radius = 1.6;
        const center = 0;
        const tick_cnt = 24;
        for (var i = 0; i < tick_cnt; i++) {
          lineMeshTemp[i] = new THREE.Mesh(
            new THREE.BoxGeometry(0.03, 0.5, 0.05)
          );
          const t =  360/tick_cnt * i;
          lineMeshTemp[i].position.x = center + radius * Math.sin( t * (Math.PI / 180) ) ;
          lineMeshTemp[i].position.y = center + radius * Math.cos( t * (Math.PI / 180) ) ;
          lineMeshTemp[i].position.z = 0.0;
          lineMeshTemp[i].rotation.z = THREE.Math.degToRad(-t);
          tick_line_geo.mergeMesh(lineMeshTemp[i]);
        }

        // メッシュを作成
        const tick_line = new THREE.Mesh(tick_line_geo, material);
        scene.add(tick_line);

        //針の支柱
        geometry = new THREE.CylinderGeometry( 0.1, 0.1, 0.5, 10 );
        box = new THREE.Mesh( geometry, material );
        box.rotation.x = THREE.Math.degToRad(90);
        box.position.z = 0.5;
        scene.add( box );

        //秒針
        mnt_hand = new THREE.Group();
        geometry = new THREE.BoxGeometry(0.05, 2.8, 0.05);
        box = new THREE.Mesh(geometry, material);
        box.position.y = 1.4;
        box.position.z = 0.7;
        mnt_hand.add(box);
        geometry = new THREE.TorusGeometry(0.2, 0.02, 20, 20);
        box = new THREE.Mesh(geometry, material);
        box.position.y = 2.7;
        box.position.z = 0.7;
        mnt_hand.add(box);
        scene.add(mnt_hand);

        //長針
        big_hand = new THREE.Group();
        geometry = new THREE.BoxGeometry(0.2, 1.5, 0.05);
        box = new THREE.Mesh(geometry, material);
        box.position.y = 0.75;
        box.position.z = 0.6;
        big_hand.add(box);
        scene.add(big_hand);

        //短針
        small_hand = new THREE.Group();
        geometry = new THREE.BoxGeometry(0.1, 2.0, 0.05);
        box = new THREE.Mesh(geometry, material);
        box.position.y = 1.0;
        box.position.z = 0.5;
        small_hand.add(box);
        scene.add(small_hand);

        set_time();

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

        // events
        window.addEventListener('keydown', (eve) => {
            run = eve.key !== 'Escape';
            if(eve.key === ' '){
                isDown = true;
            }
        }, false);
        window.addEventListener('keyup', (eve) => {
            if(eve.key === ' '){
                isDown = false;
            }
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
          // group に対して処理する @@@
          group.rotation.z -= 0.02;
      }
      set_time();
      renderer.render(scene, camera);
    }
    function set_time(){
      let date = new Date();
      let h = date.getHours();
      h = h > 12 ? h - 12 : h;
      h--;
      let m = date.getMinutes();
      let s = date.getSeconds();
      //console.log("h "+h+" : m "+m+" : s "+s);
      mnt_hand.rotation.z = THREE.Math.degToRad(-360/60*s);
      small_hand.rotation.z = THREE.Math.degToRad(-(360/60*m) - (360/(60*60*6)*s));
      big_hand.rotation.z = THREE.Math.degToRad(-(360/12*h) - (360/(60*6)*m) - (360/(60*60*6)*s) );
    }
})();
