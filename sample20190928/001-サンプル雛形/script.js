
/** ===========================================================================
 * サンプルの雛形実装です。
 * 極力、余計なことはせずにシンプルな形にしてありますが、class 構文や Promise を
 * 使っているので、普段 JavaScript を書いていない人にはちょっとわかりにくい部分
 * があるかもしれません。
 * まずは、このサンプルをひとつの基準として、どのあたりに要点があるのかを把握し
 * ておきましょう。原則として、WebGLFrame というクラスを改造することで、様々な実
 * 装を作っていきます。主に編集の対象となるのは WebGLFrame.init の後に続く、
 * WebGLFrame.load   : シェーダやテクスチャ用の画像のロード
 * WebGLFrame.setup  : ロードした情報を元にセットアップを行う
 * WebGLFrame.render : セットアップ完了後に実際にレンダリングを行う
 * の３つのメソッドです。
 * その他のメソッドは、主にユーティリティとして活用します。
 * ========================================================================= */

/**
 * JavaScript では、イベントを検出するために addEventListener というメソッドを利
 * 用します。このメソッドは、window の他、HTMLElement などの多くのオブジェクトが
 * はじめから備えており、第一引数に指定したイベントが検出されると、第二引数に指
 * 定したコールバック関数が呼び出しされます。
 * 以下の例では `DOMContentLoaded` イベントが検出されると、第二引数に指定した無
 * 名関数が呼び出される、という感じです。
 * `DOMContentLoaded` イベントは、ブラウザが HTML を読み込んでパース完了したタイ
 * ミングを検出することができます。これを行う意味は、HTML が読み込み完了していな
 * いタイミングで JavaScript が実行されてしまうと、操作対象となる canvas がその
 * 時点では存在していないことから、エラーが発生してしまうためです。
 */
window.addEventListener('DOMContentLoaded', () => {
    // WebGLFrame クラスを new キーワードでインスタンス化
    let webgl = new WebGLFrame();
    // WebGLFrame.init メソッドには、HTML に書かれた canvas の id 属性名を指定
    webgl.init('webgl-canvas');
    /**
     * load メソッドは Promise を返します。
     * Promise は、JavaScript で非同期処理を行うための仕組みのひとつです。
     * 非同期処理とは「ファイルを開く」や「サーバからのレスポンスを待つ」といっ
     * たような「どのタイミングでそれが完了するかわからない処理」のことです。
     * シェーダのファイルを読み込む処理は非同期で処理されるので、その完了を待っ
     * て続きの処理を行うために、ここでは Promise が使われています。
     * Promise は、その処理が正しく完了（解決）すると then 節へと処理が移行して
     * いく仕組みになっていますので、以下のように書いた場合は「load メソッドが
     * 正しく解決したら setup メソッドを呼び出す...」という意味になります。
     */
    webgl.load()        // ← ここでまずロードの処理が開始される
    .then(() => {
        webgl.setup();  // ← ロードが完了するとここに処理が移る（セットアップ）
        webgl.render(); // ← セットアップが終わったらレンダリングを開始
    });
}, false);

/**
 * WebGLFrame クラスは、WebGL 関連の機能をまとめたクラスです。
 * ただし、three.js や Pixi.js のような総合的なフレームワークではなく、サンプル
 * を見やすく、わかりやすくするための、かなり薄いシンプルな実装になっています。
 */
class WebGLFrame {
    /**
     * @constructor
     */
    constructor(){
        // initialize property
        this.canvas    = null;  // canvas エレメント
        this.gl        = null;  // WebGL コンテキスト
        this.running   = false; // 実行中かどうかを表すフラグ
        this.beginTime = 0;     // 実行開始時のタイムスタンプ
        this.nowTime   = 0;     // 実行開始からの経過時間（秒）

        // self binding
        this.render = this.render.bind(this);
    }
    /**
     * WebGL を実行するための初期化処理を行う。
     * @param {HTMLCanvasElement|string} canvas - canvas への参照か canvas の id 属性名のいずれか
     */
    init(canvas){
        if(canvas instanceof HTMLCanvasElement === true){
            // 引数 canvas が HTMLCanvasElement だった場合はそのままプロパティに代入
            this.canvas = canvas;
        }else if(Object.prototype.toString.call(canvas) === '[object String]'){
            // 引数 canvas が文字列であった場合は HTML から該当する id を持つ要素を取得
            let c = document.querySelector(`#${canvas}`);
            if(c instanceof HTMLCanvasElement === true){
                this.canvas = c;
            }
        }
        // この時点で canvas が正しく取得できていなければエラー
        if(this.canvas == null){
            throw new Error('invalid argument');
        }
        // canvas から WebGL コンテキスト取得を試みる
        this.gl = this.canvas.getContext('webgl');
        if(this.gl == null){
            // WebGL コンテキストが取得できない場合はエラー
            throw new Error('webgl not supported');
        }
    }
    /**
     * シェーダやテクスチャ用の画像など非同期で読み込みする処理を行う。
     * @return {Promise}
     */
    load(){
        // ロード完了後に必要となるプロパティを初期化
        this.program     = null; // プログラムオブジェクト
        this.attLocation = null; // attribute location
        this.attStride   = null; // attribute のストライド（float 何個分に相当するか）
        this.uniLocation = null; // uniform location
        this.uniType     = null; // uniform のタイプ

        // ※今後シェーダが増えた場合、上記の５つのプロパティがシェーダの個数分必要になります

        return new Promise((resolve) => {
            this.loadShader([
                './vs1.vert', // 頂点シェーダのファイルのパス（index.html から見た相対パス）
                './fs1.frag', // フラグメントシェーダ（index.html から見た相対パス）
            ])
            .then((shaders) => {
                let gl = this.gl;
                // シェーダのソースコードが読み込みできたのでシェーダオブジェクトを生成する
                let vs = this.createShader(shaders[0], gl.VERTEX_SHADER);
                let fs = this.createShader(shaders[1], gl.FRAGMENT_SHADER);
                // プログラムオブジェクトを生成してシェーダをリンクする
                this.program = this.createProgram(vs, fs);
                // 正しくリンク完了したら attribute location をプログラムオブジェクトより取得する
                this.attLocation = [
                    gl.getAttribLocation(this.program, 'position'),
                ];
                // attribute 変数に対応するストライドを配列に入れておく（あとで使う）
                //gllsl側でfloot何個ぶんかをここで指定している　vec3なので3になってる
                //vec2なら2になる flootなら1
                this.attStride = [
                    3,
                ];
                // 続いて uniform location をプログラムオブジェクトより取得する
                this.uniLocation = [
                    gl.getUniformLocation(this.program, 'globalColor'),
                ];
                // uniform 変数に対応するタイプを配列に入れておく（あとで使う）
                this.uniType = [
                    'uniform4fv',
                ];
                // ここまで問題なく完了したら Promise を解決する
                resolve();
            });
        });
    }
    /**
     * WebGL のレンダリングを開始する前のセットアップを行う。
     */
    setup(){
        let gl = this.gl;

        // 頂点座標の定義（これがシェーダ内で参照する attribute 変数の元になる最初のデータ定義）
        this.position = [
             0.0,  0.0,  0.0, // １つ目の頂点の XYZ
            -0.5,  0.5,  0.0, // ２つ目の頂点の XYZ
             0.5,  0.5,  0.0, // ３つ目の頂点の XYZ
            -0.5, 0.9,  0.0, // ４つ目の頂点の XYZ
             0.5, -0.5,  0.0, // ５つ目の頂点の XYZ
        ];
        // 定義した頂点の情報（頂点属性）は VBO に変換しておく
        // ※ WebGLFrame.setAttribute で処理するために配列に入れています
        this.vbo = [
            this.createVbo(this.position),
        ];
        // 背景を何色でクリアするかを 0.0 ～ 1.0 の RGBA で指定する
        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        // このサンプルでは一度描画するのみなので running は false のままにしておく
        this.running = false;
        // セットアップ完了時刻のタイムスタンプを取得しておく
        this.beginTime = Date.now();
    }
    /**
     * WebGL を利用して描画を行う。
     */
    render(){
        let gl = this.gl;

        // running が true の場合は requestAnimationFrame を呼び出す
        if(this.running === true){
            /**
             * requestAnimationFrame 関数は、JavaScript でアニメーション処理を行
             * うために用いられます。呼び出し時の引数には、なにかしらの関数を与
             * えておきます。
             * requestAnimationFrame はディスプレイのリフレッシュレートに合わせ
             * て、自動的に適切なタイミングで引数に指定された関数を呼び出してく
             * れます。
             * つまり以下のようにすると、画面の更新タイミングぴったりに合わせて
             * 再度 WebGLFrame.render を再帰的に呼び出してくれるわけですね。
             */
            requestAnimationFrame(this.render);
        }

        // 経過時間を取得
        this.nowTime = (Date.now() - this.beginTime) / 1000;
        // ウィンドウサイズぴったりに canvas のサイズを修正する
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // WebGL 上のビューポートも canvas の大きさに揃える
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        // あらかじめ指定されていたクリアカラーで canvas をクリアする
        gl.clear(gl.COLOR_BUFFER_BIT);
        // どのプログラムオブジェクトを使うのかを明示する
        gl.useProgram(this.program);
        // VBO と attribute location を使って頂点を有効にする
        this.setAttribute(this.vbo, this.attLocation, this.attStride);
        // uniform location を使って uniform 変数にデータを転送する
        this.setUniform([
            [0.1, 1.0, 0.5, 1.0]//ここでは点の色をしてい
        ], this.uniLocation, this.uniType);

        // 転送済みの情報を使って、頂点を画面にレンダリングする
        gl.drawArrays(gl.POINTS, 0, this.position.length / 3);
    }

    // utility method =========================================================

    /**
     * シェーダのソースコードを外部ファイルから取得する。
     * @param {Array.<string>} pathArray - シェーダを記述したファイルのパス（の配列）
     * @return {Promise}
     */
    loadShader(pathArray){
        if(Array.isArray(pathArray) !== true){
            throw new Error('invalid argument');
        }
        let promises = pathArray.map((path) => {
            return fetch(path).then((response) => {return response.text();})
        });
        return Promise.all(promises);
    }

    /**
     * シェーダオブジェクトを生成して返す。
     * コンパイルに失敗した場合は理由をアラートし null を返す。
     * @param {string} source - シェーダのソースコード文字列
     * @param {number} type - gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
     * @return {WebGLShader} シェーダオブジェクト
     */
    createShader(source, type){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }
        let gl = this.gl;
        let shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
            return shader;
        }else{
            alert(gl.getShaderInfoLog(shader));
            return null;
        }
    }

    /**
     * プログラムオブジェクトを生成して返す。
     * シェーダのリンクに失敗した場合は理由をアラートし null を返す。
     * @param {WebGLShader} vs - 頂点シェーダオブジェクト
     * @param {WebGLShader} fs - フラグメントシェーダオブジェクト
     * @return {WebGLProgram} プログラムオブジェクト
     */
    createProgram(vs, fs){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }
        let gl = this.gl;
        let program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if(gl.getProgramParameter(program, gl.LINK_STATUS)){
            gl.useProgram(program);
            return program;
        }else{
            alert(gl.getProgramInfoLog(program));
            return null;
        }
    }

    /**
     * VBO を生成して返す。
     * @param {Array} data - 頂点属性データを格納した配列
     * @return {WebGLBuffer} VBO
     */
    createVbo(data){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }
        let gl = this.gl;
        let vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return vbo;
    }

    /**
     * IBO を生成して返す。
     * @param {Array} data - インデックスデータを格納した配列
     * @return {WebGLBuffer} IBO
     */
    createIbo(data){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }
        let gl = this.gl;
        let ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return ibo;
    }

    /**
     * IBO を生成して返す。(INT 拡張版)
     * @param {Array} data - インデックスデータを格納した配列
     * @return {WebGLBuffer} IBO
     */
    createIboInt(data){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }
        let gl = this.gl;
        if(ext == null || ext.elementIndexUint == null){
            throw new Error('element index Uint not supported');
        }
        let ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return ibo;
    }

    /**
     * 画像ファイルを読み込み、テクスチャを生成してコールバックで返却する。
     * @param {string} source - ソースとなる画像のパス
     * @return {Promise}
     */
    createTextureFromFile(source){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }
        return new Promise((resolve) => {
            let gl = this.gl;
            let img = new Image();
            img.addEventListener('load', () => {
                let tex = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.bindTexture(gl.TEXTURE_2D, null);
                resolve(tex);
            }, false);
            img.src = source;
        });
    }

    /**
     * フレームバッファを生成して返す。
     * @param {number} width - フレームバッファの幅
     * @param {number} height - フレームバッファの高さ
     * @return {object} 生成した各種オブジェクトはラップして返却する
     * @property {WebGLFramebuffer} framebuffer - フレームバッファ
     * @property {WebGLRenderbuffer} renderbuffer - 深度バッファとして設定したレンダーバッファ
     * @property {WebGLTexture} texture - カラーバッファとして設定したテクスチャ
     */
    createFramebuffer(width, height){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }
        let gl = this.gl;
        let frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        let depthRenderBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);
        let fTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, fTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return {framebuffer: frameBuffer, renderbuffer: depthRenderBuffer, texture: fTexture};
    }

    /**
     * フレームバッファを生成して返す。（フロートテクスチャ版）
     * @param {object} ext - getWebGLExtensions の戻り値
     * @param {number} width - フレームバッファの幅
     * @param {number} height - フレームバッファの高さ
     * @return {object} 生成した各種オブジェクトはラップして返却する
     * @property {WebGLFramebuffer} framebuffer - フレームバッファ
     * @property {WebGLTexture} texture - カラーバッファとして設定したテクスチャ
     */
    createFramebufferFloat(ext, width, height){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }
        let gl = this.gl;
        if(ext == null || (ext.textureFloat == null && ext.textureHalfFloat == null)){
            throw new Error('float texture not supported');
        }
        let flg = (ext.textureFloat != null) ? gl.FLOAT : ext.textureHalfFloat.HALF_FLOAT_OES;
        let frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        let fTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, fTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, flg, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return {framebuffer: frameBuffer, texture: fTexture};
    }

    /**
     * VBO を IBO をバインドし有効化する。
     * @param {Array} vbo - VBO を格納した配列
     * @param {Array} attL - attribute location を格納した配列
     * @param {Array} attS - attribute stride を格納した配列
     * @param {WebGLBuffer} ibo - IBO
     */
    setAttribute(vbo, attL, attS, ibo){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }
        let gl = this.gl;
        vbo.forEach((v, index) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, v);
            gl.enableVertexAttribArray(attL[index]);
            gl.vertexAttribPointer(attL[index], attS[index], gl.FLOAT, false, 0, 0);
        });
        if(ibo != null){
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        }
    }

    /**
     * uniform 変数をまとめてシェーダに送る。
     * @param {Array} value - 各変数の値
     * @param {Array} uniL - uniform location を格納した配列
     * @param {Array} uniT - uniform 変数のタイプを格納した配列
     */
    setUniform(value, uniL, uniT){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }
        let gl = this.gl;
        value.forEach((v, index) => {
            let type = uniT[index];
            if(type.includes('Matrix') === true){
                gl[type](uniL[index], false, v);
            }else{
                gl[type](uniL[index], v);
            }
        });
    }

    /**
     * 主要な WebGL の拡張機能を取得する。
     * @return {object} 取得した拡張機能
     * @property {object} elementIndexUint - Uint32 フォーマットを利用できるようにする
     * @property {object} textureFloat - フロートテクスチャを利用できるようにする
     * @property {object} textureHalfFloat - ハーフフロートテクスチャを利用できるようにする
     */
    getWebGLExtensions(){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }
        let gl = this.gl;
        return {
            elementIndexUint: gl.getExtension('OES_element_index_uint'),
            textureFloat:     gl.getExtension('OES_texture_float'),
            textureHalfFloat: gl.getExtension('OES_texture_half_float')
        };
    }
}

