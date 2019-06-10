
// = 002 ======================================================================
// まず最初に、描画結果を確認しやすくするために、マウスで描画結果に干渉できるよ
// うにしておきましょう。
// three.js には、カメラを操作するためのコントロールと呼ばれる補助機能が用意され
// ているので、それを読み込んで利用します。
// より具体的には、ここでは OrbitControls と名付けられたコントロールを使っていま
// す。three.js には他のコントロールもありますが、最も直感的な動作をしてくれるの
// がオービットコントロールだと思います。
// ============================================================================

(() => {
    window.addEventListener('load', () => {
        // 汎用変数の宣言
        let width = window.innerWidth;   // ブラウザのクライアント領域の幅
        let height = window.innerHeight; // ブラウザのクライアント領域の高さ
        let targetDOM = document.getElementById('webgl'); // スクリーンとして使う DOM

        let scene;    // シーン
        let camera;   // カメラ
        let controls; // カメラコントロール @@@
        let renderer; // レンダラ
        let geometry; // ジオメトリ
        let material; // マテリアル
        let box;      // ボックスメッシュ
        let isDown = false;   // スペースキーが押されているかどうか

        const CAMERA_PARAM = { // カメラに関するパラメータ
            fovy: 60,
            aspect: width / height,
            near: 0.1,
            far: 10.0,
            x: 0.0,
            y: 2.0,
            z: 5.0,
            lookAt: new THREE.Vector3(0.0, 0.0, 0.0)
        };
        const RENDERER_PARAM = { // レンダラに関するパラメータ
            clearColor: 0x333333,
            width: width,
            height: height
        };
        const MATERIAL_PARAM = { // マテリアルに関するパラメータ
            color: 0x363636
        };

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(
            CAMERA_PARAM.fovy,
            CAMERA_PARAM.aspect,
            CAMERA_PARAM.near,
            CAMERA_PARAM.far
        );
        camera.position.x = CAMERA_PARAM.x;
        camera.position.y = CAMERA_PARAM.y;
        camera.position.z = CAMERA_PARAM.z;
        camera.lookAt(CAMERA_PARAM.lookAt);

        renderer = new THREE.WebGLRenderer();
        renderer.setClearColor(new THREE.Color(RENDERER_PARAM.clearColor));
        renderer.setSize(RENDERER_PARAM.width, RENDERER_PARAM.height);
        targetDOM.appendChild(renderer.domElement);
        //renderer.domElement (three.jsが描画に使ってるcanvas要素)
        // - オービットコントロールを追加する ---------------------------------
        // JavaScript では DOM 上で発生するマウスイベントを捕捉してインタラクテ
        // ィブな処理が行なえます。ですから、オービットコントロールの第二引数に
        // はイベントを拾う対象となるオブジェクトを与えてやる必要があります。
        // 通常は、three.js のレンダリングの対象となる DOM を指定すればいいでし
        // ょう。第一引数にはカメラオブジェクトを与えます。
        // これによって、オービットコントロールが自動的に第二引数で与えた DOM の
        // イベントをフックして、カメラに反映してくれるようになります。
        // --------------------------------------------------------------------
        // orbit controls @@@
        controls = new THREE.OrbitControls(camera, renderer.domElement);

        geometry = new THREE.BoxGeometry(1.0, 1.0, 1.0);
        material = new THREE.MeshBasicMaterial(MATERIAL_PARAM);
        box = new THREE.Mesh(geometry, material);

        scene.add(box);

        // - レンダリングループを定義 -----------------------------------------
        // 繰り返しレンダリングを行うために、レンダリングループを定義します。
        // 以下の render という関数が、requestAnimationFrame によって繰り返し呼
        // び出され、結果的にループしながら何度も描画が行われるようになります。
        // このようなレンダリングループは、Esc キーで停止できるようにしておくと
        // 精神の安定が得られます（笑）
        // レンダリングが止められないと、特にラップトップなどで無尽蔵にバッテリー
        // が消費されたりするので、個人的にはいつもこういう作りにしています。
        // --------------------------------------------------------------------
        let run = true;
        window.addEventListener('keydown', (eve) => {

            run = eve.key !== 'Escape';
            if(eve.key === ' '){isDown = true;}
            console.log("key "+(eve.key !== 'Escape'));
            console.log("run "+run);
        }, false);
        window.addEventListener('keyup', (eve) => {
            if(eve.key === ' '){isDown = false;}
        }, false);

        // rendering @@@
        render();
        function render(){
            // rendering loop
            //ディスプレイのレフレッシュレートに合わせて自動的に再帰呼び出ししてくれる
            if(run){
              requestAnimationFrame(render);
              //次のレンダリングを予約してくれる。なので何も動いてなくてもなんども呼びだされる
              //render();とかにするとpcのスペックでfps100とかで無駄な書き出しになってしまう危険性があるため
            }
            if(isDown === true){
                box.rotation.y += 0.02;
            }
            // rendering
            renderer.render(scene, camera);
        }
    }, false);
})();
