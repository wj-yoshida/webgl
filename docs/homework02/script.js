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
    let pillar;

    let dw_st_time = 0;
    let up_st_time = 0;
    let duration = 40;
    let POS = { mnt_hand: 0, small_hand: 0, big_hand: 0, pillar: 0.8, pillar_pos: 0 };
    let NXPOS =  { mnt_hand: 0, small_hand: 0, big_hand: 0, pillar: 0.8, pillar_pos: 0 };
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
        renderer.shadowMap.enabled = true;
        targetDOM.appendChild(renderer.domElement);
        controls = new THREE.OrbitControls(camera, renderer.domElement);

        group = new THREE.Group();

        // material and geometory
        material = new THREE.MeshPhongMaterial(MATERIAL_PARAM);
        materialPoint = new THREE.PointsMaterial(MATERIAL_PARAM_POINT);

        //土台
        geometry = new THREE.CylinderGeometry( 3.2, 3.2, 0.5, 30 );
        box = new THREE.Mesh( geometry, material );
        box.rotation.x = THREE.Math.degToRad(90);
        box.position.z = -0.5;
        box.receiveShadow = true;
        group.add( box );

        // torus
        geometry = new THREE.TorusGeometry(0.9, 0.02, 32, 32);
        torus = new THREE.Mesh(geometry, material);
        torus.position.x = 0.0;
        torus.position.z = 0.0;
        torus.scale.z = 0.04;
        group.add(torus);

        //文字盤
        font_loader = new THREE.FontLoader();
        font_loader.load( 'helvetiker_bold.typeface.json', function ( font ) {
          let radius = 2.25;
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
          		new THREE.MeshPhongMaterial( { color: 0x383838 } )
          	];
          	textMesh[i] = new THREE.Mesh(txt[i], txt_materials);
            const t =  360/12 * i;
            textMesh[i].position.x = center + radius * Math.sin( t * (Math.PI / 180) ) ;
            textMesh[i].position.y = center + radius * Math.cos( t * (Math.PI / 180) ) ;
            textMesh[i].position.z = 0.05;
          	group.add(textMesh[i]);
          }
        } );
        font_loader.load( 'helvetiker_regular.typeface.json', function ( font ) {
          let radius = 2.7;
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
          		new THREE.MeshPhongMaterial( { color: 0x383838 } )
          	];
          	textMesh[i] = new THREE.Mesh(txt[i], txt_materials);
            const t =  360/12 * i;
            textMesh[i].position.x = center + radius * Math.sin( t * (Math.PI / 180) ) ;
            textMesh[i].position.y = center + radius * Math.cos( t * (Math.PI / 180) ) ;
            textMesh[i].position.z = 0.05;
            textMesh[i].rotation.z = THREE.Math.degToRad(-t);
          	group.add(textMesh[i]);
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
        group.add(tick_line);

        //針の支柱
        geometry = new THREE.CylinderGeometry( 0.1, 0.1, 0.8, 10 );
        pillar = new THREE.Mesh( geometry, material );
        pillar.rotation.x = THREE.Math.degToRad(90);
        pillar.position.z = 0.5;
        group.add( pillar );

        //秒針
        mnt_hand = new THREE.Group();
        geometry = new THREE.BoxGeometry(0.06, 2.6, 0.02);
        box = new THREE.Mesh(geometry, material);
        box.position.y = 1.2;
        box.position.z = 0.3;
        mnt_hand.add(box);
        geometry = new THREE.TorusGeometry(0.2, 0.01, 20, 20);
        box = new THREE.Mesh(geometry, material);
        box.position.y = 2.7;
        box.position.z = 0.3;
        box.castShadow = true;
        mnt_hand.add(box);
        group.add(mnt_hand);

        //長針
        big_hand = new THREE.Group();
        geometry = new THREE.BoxGeometry(0.2, 1.5, 0.05);
        box = new THREE.Mesh(geometry, material);
        box.position.y = 0.75;
        box.position.z = 0.2;
        box.castShadow = true;
        big_hand.add(box);
        group.add(big_hand);

        //短針
        small_hand = new THREE.Group();
        geometry = new THREE.BoxGeometry(0.1, 2.0, 0.05);
        box = new THREE.Mesh(geometry, material);
        box.position.y = 1.0;
        box.position.z = 0.1;
        box.castShadow = true;
        small_hand.add(box);
        group.add(small_hand);

        set_time();

        // group をシーンに加える @@@
        scene.add(group);

        // lights
        directionalLight = new THREE.DirectionalLight(
            DIRECTIONAL_LIGHT_PARAM.color,
            DIRECTIONAL_LIGHT_PARAM.intensity
        );
        directionalLight.position.x = DIRECTIONAL_LIGHT_PARAM.x;
        directionalLight.position.y = DIRECTIONAL_LIGHT_PARAM.y;
        directionalLight.position.z = DIRECTIONAL_LIGHT_PARAM.z;
        directionalLight.castShadow = true;
        //scene.add(directionalLight);
        ambientLight = new THREE.AmbientLight(
            AMBIENT_LIGHT_PARAM.color,
            AMBIENT_LIGHT_PARAM.intensity
        );
        //scene.add(ambientLight);

        const spotlight = new THREE.SpotLight(0x555555, 1, 100, Math.PI / 3, 0.8);
        spotlight.position.y = 5;
        spotlight.position.z = 8;
        spotlight.position.x = 5;
        spotlight.castShadow = true;
        scene.add(spotlight);

        // helper
        axesHelper = new THREE.AxesHelper(5.0);
        //scene.add(axesHelper);

        // events
        window.addEventListener('keydown', (eve) => {
            run = eve.key !== 'Escape';
            if(eve.key === ' '){
                isDown = true;
                up_st_time = 0;
            }
        }, false);
        window.addEventListener('keyup', (eve) => {
          if(eve.key === ' '){
            isDown = false;
            dw_st_time = 0;
            NXPOS.mnt_hand = mnt_hand.position.z;
            NXPOS.small_hand = small_hand.position.z;
            NXPOS.big_hand = big_hand.position.z;
            NXPOS.pillar = pillar.scale.y;
            NXPOS.pillar_pos = pillar.position.z;
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
        dw_st_time++;
        if(dw_st_time > duration){
          dw_st_time = duration;
        }
        mnt_hand.position.z = easing( dw_st_time, POS.mnt_hand, 1.8, duration);
        small_hand.position.z = easing( dw_st_time, POS.small_hand, 1.2, duration+10);
        big_hand.position.z = easing( dw_st_time, POS.big_hand, 0.6, duration+20);
        pillar.scale.y = easing( dw_st_time, POS.pillar, 2, duration);
        pillar.position.z = easing( dw_st_time, POS.pillar_pos, 1, duration);
      }else {
        up_st_time++;
        if(up_st_time > duration){
          up_st_time = duration;
        }
        mnt_hand.position.z = easing( up_st_time, NXPOS.mnt_hand, (POS.mnt_hand - NXPOS.mnt_hand), duration );
        small_hand.position.z = easing( up_st_time, NXPOS.small_hand, (POS.small_hand - NXPOS.small_hand), duration);
        big_hand.position.z = easing( up_st_time, NXPOS.big_hand, (POS.big_hand - NXPOS.big_hand), duration);
        pillar.scale.y = easing( up_st_time, NXPOS.pillar, (POS.pillar - NXPOS.pillar), duration);
        pillar.position.z = easing( up_st_time, NXPOS.pillar_pos, (POS.pillar_pos - NXPOS.pillar_pos), duration);
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

    function easing(t, b, c, d) {
      if ((t/=d/2) < 1) return c/2*t*t + b;
    	return -c/2 * ((--t)*(t-2) - 1) + b;
    }

})();
