
// = 005 ======================================================================
// さて、004 で五角形をうまく作ることができたでしょうか。
// 五角形を作ろうと試行錯誤したときに、頂点が重複する箇所が存在することに作業し
// ながら気がついたと思います。このような重複する頂点の定義が存在すると、その分
// リソースが消費されますし、無駄が多くなってしまいます。
// これを解消するために WebGL にはインデックスを使った描画プロセスが用意されてい
// ます。
// ここではそんなインデックスバッファを用いた処理について理解しましょう。
// ============================================================================

(() => {
    // variables
    let canvas;     // canvas エレメントへの参照
    let canvasSize; // canvas の大きさ（ここでは正方形の一辺の長さ）
    let prg;        // プログラムオブジェクト
    let position;   // 頂点の位置座標
    let color;      // 頂点の色
    let index;      // 頂点インデックス @@@
    let VBO;        // Vertex Buffer Object
    let IBO;        // Index Buffer Object @@@

    window.addEventListener('load', () => {
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
        // 頂点の座標データ
        position = [
             0.0,  0.5,  0.0,
             0.5,  0.1,  0.0,
            -0.5,  0.1,  0.0,
             0.3, -0.5,  0.0,
            -0.3, -0.5,  0.0
        ];
        // 頂点の色データ
        color = [
            1.0, 0.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 1.0,
            1.0, 1.0, 1.0, 1.0,
            0.0, 0.0, 0.0, 1.0
        ];
        // - インデックスバッファ用の配列を作る -------------------------------
        // インデックスバッファとは、頂点に与えられた連番を用いて、どのようにプ
        // リミティブを描画していくのかを指定するためのバッファです。
        // 今回は TRIANGLES のプリミティブを使う場合を想定して、インデックスを割
        // り振ってみましょう。
        // --------------------------------------------------------------------
        // インデックスデータ @@@
        index = [
            0, 1, 2, // ひとつ目の三角形に使うインデックス
            2, 1, 3, // ふたつ目の三角形に使うインデックス
            2, 3, 4  // みっつ目の三角形に使うインデックス
        ];
        // 座標データから頂点バッファを生成
        VBO = [
            gl3.createVbo(position),
            gl3.createVbo(color)
        ];
        // - インデックスバッファを生成する -----------------------------------
        // 頂点属性を格納する VBO と同じように、インデックスデータの配列は、それ
        // 専用のバッファである IBO を生成して利用します。
        // glcubic.js にはインデックスバッファを生成するためのヘルパー関数がある
        // ので、それを使って VBO と同じタイミングで IBO を生成しておきましょう。
        // --------------------------------------------------------------------
        // インデックスバッファを生成 @@@
        IBO = gl3.createIbo(index);

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
        // - インデックスバッファを使った描画 ---------------------------------
        // インデックスバッファは、VBO と同じように GPU 上のメモリ空間に置かれて
        // います。これを利用した描画を行う際には VBO と同じようにバッファを利用
        // するための手続きが必要です。
        // glcubic.js の場合は、program.setAttribute をコールする際に、引数に
        // VBO と IBO を同時に渡すことができるようになっていますので、これを利用
        // しましょう。
        // また、IBO を使って描画を行う際には、なんとドローコールも別のものを使
        // ってやらなくてはなりません。このあたりは非常に紛らわしいので間違いが
        // 起こりやすく、注意が必要です。一般に、IBO を利用したほうが GPU 内部で
        // の処理がスムーズに行われ、描画効率が良いと言われていますので、特に理
        // 由が無い限りは、インデックスデータを用いるようにするといいでしょう。
        // --------------------------------------------------------------------
        // プログラムに頂点バッファとインデックスバッファをアタッチ @@@
        prg.setAttribute(VBO, IBO);
        // uniform 変数をシェーダにプッシュ
        prg.pushShader([
            [1.0, 1.0, 1.0, 1.0]
        ]);
        // インデックスデータを用いる場合のドローコール（描画命令） @@@
        gl3.drawElements(gl3.gl.TRIANGLES, index.length);
    }
})();
