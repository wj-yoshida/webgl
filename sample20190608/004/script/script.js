
// = 004 ======================================================================
// 三次元的な座標を自在に頭の中で思い描くのは、一種の慣れを必要とします。
// ここではそんな 3D 特有の感覚を養うために、自力で頂点を定義することに挑戦して
// みましょう。
// また、頂点はどのようなプリミティブタイプを選択したかによって、その外観が全く
// 別物になります。これについても、ここで理解を深めておきましょう。
// ============================================================================

(() => {
    // variables
    let canvas;     // canvas エレメントへの参照
    let canvasSize; // canvas の大きさ（ここでは正方形の一辺の長さ）
    let prg;        // プログラムオブジェクト
    let position;   // 頂点の位置座標
    let color;      // 頂点の色
    let VBO;        // Vertex Buffer Object

    window.addEventListener('load', () => {
        vert_dot(5, 4, 0);//角の数、半径, 中心
        // glcubic の初期化
        canvas = document.getElementById('webgl_canvas');
        gl3.init(canvas);
        if(!gl3.ready){
            console.log('initialize error');
            return;
        }

        // キャンバスの大きさはウィンドウの短辺
        canvasSize = Math.min(window.innerWidth, window.innerHeight);
        canvas.width  = canvasSize;
        canvas.height = canvasSize;

        // シェーダロードへ移行
        loadShader();
    }, false);

    function loadShader(){
        // glcubic の機能を使ってプログラムを生成
        prg = gl3.createProgramFromFile(
            './shader/main.vert',
            './shader/main.frag',
            ['position', 'color'],
            [3, 4],
            ['globalColor'],
            ['4fv'],
            initialize
        );
    }

    function initialize(){
        // - [やってみよう] ---------------------------------------------------
        // 現在は、三角形がひとつだけ表示されるような構造になっています。これは
        // サンプル 003 とまったく同じ初期状態です。
        // これを自分で修正して、いびつな形で構わないので「五角形」にしてみてく
        // ださい。WebGL では、原則として「三角形」以外のポリゴンは作れません。
        // よって、五角形を形作るためには、最低でも三枚のポリゴンが必要になると
        // いうことがヒントです。がんばってチャレンジしてみてください。
        // --------------------------------------------------------------------
        // 頂点の座標データ
        position = [
             0.0,  0.5,  0.0, // ひとつ目の頂点の x, y, z 座標
             0.5, 0.25, 0.0,
             0.25, -0.5,  0.0, // ふたつ目の頂点の x, y, z 座標
             -0.25, -0.5, 0.0,
             -0.5, -0.25,  0.0  // みっつ目の頂点の x, y, z 座標
        ];
        // 頂点の色データ
        color = [
            0.0, 0.0, 0.0, 0.0, // ひとつ目の頂点の R, G, B, A カラー
            0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, // ふたつ目の頂点の R, G, B, A カラー
            0.0, 0.0, 0.0, 0.0,  // みっつ目の頂点の R, G, B, A カラー
            0.0, 0.0, 0.0, 0.0
        ];
        // 座標データから頂点バッファを生成
        VBO = [
            gl3.createVbo(position),
            gl3.createVbo(color)
        ];

        // レンダリング関数を呼ぶ
        render();
    }

    function render(){
        // ビューを設定
        gl3.sceneView(0, 0, canvasSize, canvasSize);
        // シーンのクリア
        gl3.sceneClear([0.7, 0.7, 0.7, 1.0]);
        // どのプログラムオブジェクトを利用するか明示的に設定
        prg.useProgram();
        // プログラムに頂点バッファをアタッチ
        prg.setAttribute(VBO);
        // uniform 変数をシェーダにプッシュ
        prg.pushShader([
            [1.0, 1.0, 1.0, 1.0]
        ]);
        // - プリミティブタイプ -----------------------------------------------
        // WebGL には代表的なプリミティブタイプには以下のようなものがあります。
        // これらを変更すると、いったいどのような変化が起こるのかを観察しながら、
        // それぞれのプリミティブタイプの違いについて理解を深めておきましょう。
        // * gl.POINTS
        // * gl.LINES
        // * gl.LINE_STRIP
        // * gl.TRIANGLES //頂点が三つでワンセットになるので、それ以外の数が入ってくるとうまく動かない
        // * gl.TRIANGLE_STRIP
        //
        // また、ドローコールを行う glcubic.js のメソッドの、第二引数を見てくだ
        // さい。そこには position.length / 3 と書かれています。
        // これは「何個の頂点を描くか」ということを表す数値です。
        // つまりその気になれば頂点を全て描くのではなく、一部だけを描画するとい
        // うこともできるわけです。ただし、定義した順番が大きく影響しますので、
        // もし仮にそのような処理を記述する際は十分に注意しましょう。
        // --------------------------------------------------------------------
        // ドローコール（描画命令）
        gl3.drawArrays(gl3.gl.TRIANGLES, position.length / 5);
    }
    function vert_dot(angle, radius, center){
      const vert_arr = [];
      for (var i = 0; i < angle; i++) {
        const t =  360/angle * i;
        vert_arr[i]['x'] = center + radius * Math.sin( t * (Math.PI / 180) ) ;
        vert_arr[i]['y'] = center + radius * Math.cos( t * (Math.PI / 180) ) ;
        vert_arr[i]['z'] = 0.0;
      }
      console.log(vert_arr);
    }
})();
