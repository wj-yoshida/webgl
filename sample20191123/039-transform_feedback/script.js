
/** ===========================================================================
 * これまで扱ってきたすべてのサンプルは、WebGL 1.0 と呼ばれる最初のバージョンを
 * ベースにした実装でした。
 * 現在では、WebGL 2.0 が正式に勧告されている状況で、モバイル端末などではやや不
 * 安定な部分はあるものの、PC だとほとんどのケースでは 2.0 でも問題なく動作する
 * ようになってきています。
 * ここでは、WebGL 2.0 を利用した技術のひとつとして transform feedback を扱って
 * みましょう。とにかくやることが多いのと、複数のシェーダを細かく制御・連携させ
 * てやる必要があるため非常に難易度が高い実装ですが、いわゆる GPGPU を実現するこ
 * とができる面白いテクニックのひとつです。
 * 簡単に概要を説明すると、本来は「CPU 側で定義したものを使うしか無かった VBO」
 * を、GPU 側、つまりシェーダ内で高速に更新することができるのが transform
 * feedback です。
 * VBO の中身をシェーダで動的に書き換えることにより、頂点座標の更新を高速に行う
 * ことができ、今回のサンプルのようなパーティクルの制御などが行なえます。
 * ========================================================================= */

const MAT = new matIV();
const QTN = new qtnIV();

let powerScale = 0.1;      // 動く力のスケール @@@
let turnPower = 0.1;       // 曲がろうとする力 @@@
let pointSizeScale = 16.0; // ポイントサイズ @@@
let globalAlpha = 0.5;     // 全体に適用するアルファ @@@

window.addEventListener('DOMContentLoaded', () => {
    // https://github.com/cocopon/tweakpane
    const PANE = new Tweakpane({
        container: document.querySelector('#pane'),
    });
    PANE.addInput({'power scale': powerScale}, 'power scale', {
        step: 0.001,
        min: 0.001,
        max: 0.5,
    }).on('change', (v) => {powerScale = v;});
    PANE.addInput({'turn power': turnPower}, 'turn power', {
        step: 0.001,
        min: 0.001,
        max: 0.5,
    }).on('change', (v) => {turnPower = v;});
    PANE.addInput({'point size scale': pointSizeScale}, 'point size scale', {
        step: 0.1,
        min: 0.1,
        max: 64.0,
    }).on('change', (v) => {pointSizeScale = v;});
    PANE.addInput({'global alpha': globalAlpha}, 'global alpha', {
        step: 0.01,
        min: 0.01,
        max: 1.0,
    }).on('change', (v) => {globalAlpha = v;});

    let webgl = new WebGLFrame();
    webgl.init('webgl-canvas');
    webgl.load()
    .then(() => {
        webgl.setup();
        webgl.render();
    });
}, false);

class WebGLFrame {
    constructor(){
        this.canvas    = null;
        this.gl        = null;
        this.running   = false;
        this.beginTime = 0;
        this.nowTime   = 0;
        this.counter   = 0;
        this.render    = this.render.bind(this);

        // 行列関連
        this.mMatrix   = MAT.identity(MAT.create());
        this.vMatrix   = MAT.identity(MAT.create());
        this.pMatrix   = MAT.identity(MAT.create());
        this.vpMatrix  = MAT.identity(MAT.create());
        this.mvpMatrix = MAT.identity(MAT.create());

        // マウス関連 @@@
        this.isMouseDown = false;
        this.mouse = [0, 0];
        this.movePower = 0.0;
    }
    /**
     * WebGL を実行するための初期化処理を行う。
     * @param {HTMLCanvasElement|string} canvas - canvas への参照か canvas の id 属性名のいずれか
     */
    init(canvas){
        if(canvas instanceof HTMLCanvasElement === true){
            this.canvas = canvas;
        }else if(Object.prototype.toString.call(canvas) === '[object String]'){
            let c = document.querySelector(`#${canvas}`);
            if(c instanceof HTMLCanvasElement === true){
                this.canvas = c;
            }
        }
        if(this.canvas == null){throw new Error('invalid argument');}
        this.gl = this.canvas.getContext('webgl2'); // WebGL 2.0 を有効化 @@@
        if(this.gl == null){throw new Error('webgl not supported');}
    }
    /**
     * シェーダやテクスチャ用の画像など非同期で読み込みする処理を行う。
     * @return {Promise}
     */
    load(){
        // 最終シーンをレンダリングするためのシェーダ関連 @@@
        this.program     = null;
        this.attLocation = null;
        this.attStride   = null;
        this.uniLocation = null;
        this.uniType     = null;

        // transform feedback 用のシェーダ関連 @@@
        this.tfProgram     = null;
        this.tfAttLocation = null;
        this.tfAttStride   = null;
        this.tfUniLocation = null;
        this.tfUniType     = null;

        return new Promise((resolve) => {
            this.loadShader([
                './vs1.vert',
                './fs1.frag',
            ])
            .then((shaders) => {
                let gl = this.gl;
                let vs = this.createShader(shaders[0], gl.VERTEX_SHADER);
                let fs = this.createShader(shaders[1], gl.FRAGMENT_SHADER);
                this.program = this.createProgram(vs, fs);
                this.attLocation = [
                    gl.getAttribLocation(this.program, 'position'),
                    gl.getAttribLocation(this.program, 'velocity'),
                ];
                this.attStride = [
                    3,
                    3,
                ];
                this.uniLocation = [
                    gl.getUniformLocation(this.program, 'mvpMatrix'),
                    gl.getUniformLocation(this.program, 'pointScale'),
                    gl.getUniformLocation(this.program, 'globalAlpha'),
                ];
                this.uniType = [
                    'uniformMatrix4fv',
                    'uniform1f',
                    'uniform1f',
                ];
                return this.loadShader([
                    './vs2.vert',
                    './fs2.frag',
                ]);
            })
            .then((shaders) => {
                let gl = this.gl;
                let vs = this.createShader(shaders[0], gl.VERTEX_SHADER);
                let fs = this.createShader(shaders[1], gl.FRAGMENT_SHADER);
                /**
                 * transform feedback を利用する場合は「シェーダからの出力として
                 * 使われる変数名」を、あらかじめ指定しておく必要があります。
                 * この工程は「シェーダをコンパイルしてからリンクするまで」の間
                 * に行う必要があるため、プログラムオブジェクトを生成するプロセ
                 * スの時点で対象となる変数の名前を指定しなくてはなりません。
                 * 以下の vPosition と vVelocity は、transform feedback を利用し
                 * ている段階で出力先として利用される変数となります。
                 */
                // 出力用の変数の名前を指定する @@@
                let outVaryings = ['vPosition', 'vVelocity'];
                // transform feedback 専用のメソッドでプログラムオブジェクトを生成 @@@
                this.tfProgram = this.createTransformFeedbackProgram(vs, fs, outVaryings);
                this.tfAttLocation = [
                    gl.getAttribLocation(this.tfProgram, 'position'), // 入力用の座標
                    gl.getAttribLocation(this.tfProgram, 'velocity'), // 入力用の進行方向
                ];
                this.tfAttStride = [
                    3,
                    3,
                ];
                this.tfUniLocation = [
                    gl.getUniformLocation(this.tfProgram, 'time'),      // 時間の経過
                    gl.getUniformLocation(this.tfProgram, 'mouse'),     // 正規化済みのマウス座標
                    gl.getUniformLocation(this.tfProgram, 'isDown'),    // マウスボタンの押下フラグ
                    gl.getUniformLocation(this.tfProgram, 'turnPower'), // 曲がろうとする力
                    gl.getUniformLocation(this.tfProgram, 'movePower'), // 動く力と、そのスケール値の乗算
                ];
                this.tfUniType = [
                    'uniform1f',
                    'uniform2fv',
                    'uniform1i',
                    'uniform1f',
                    'uniform1f',
                ];

                // ロードがすべて終わったのでおおもとになっている Promise を解決する
                resolve();
            });
        });
    }
    /**
     * WebGL のレンダリングを開始する前のセットアップを行う。
     */
    setup(){
        let gl = this.gl;

        window.addEventListener('keydown', (evt) => {
            this.running = evt.key !== 'Escape';
        }, false);

        // mouse event
        window.addEventListener('mousedown', (evt) => {
            this.isMouseDown = true;
            this.movePower = 1.0;
        }, false);
        window.addEventListener('mouseup', (evt) => {
            this.isMouseDown = false;
        }, false);
        window.addEventListener('mousemove', (evt) => {
            let x = evt.clientX;
            let y = evt.clientY;
            let aspect = this.canvas.width / this.canvas.height;
            this.mouse = [
                (x / this.canvas.width * 2.0 - 1.0) * aspect,
                -(y / this.canvas.height * 2.0 - 1.0)
            ];
        }, false);

        // 頂点データは、解像度を指定して XY 平面に敷き詰める形 @@@
        const RESOLUTION = 128; // 配置する頂点の解像度
        const SCALE = 2.0;      // 配置する範囲のスケール
        this.position = [];
        this.velocity = [];
        for(let i = 0; i < RESOLUTION; ++i){
            let x = i / RESOLUTION * 2.0 - 1.0;
            for(let j = 0; j < RESOLUTION; ++j){
                let y = j / RESOLUTION * 2.0 - 1.0;
                this.position.push(x * SCALE, -y * SCALE, 0.0);
                let len = Math.sqrt(x * x + y * y);
                this.velocity.push(x / len, -y / len, 0.0);
            }
        }
        /**
         * 今回のサンプルでは、まったく同じ構造の VBO を２セット用意しておいて、
         * 書き込み用と読み出し用を、毎フレーム入れ替えます。
         * つまり１フレーム目に読み出し用だったバッファは、２フレーム目には書き
         * 込み用となります。その逆もまた然りです。
         */
        // VBO は同じものを２つ用意して配列に入れておく @@@
        this.VBOArray = [
            [
                this.createVbo(this.position),
                this.createVbo(this.velocity),
            ], [
                this.createVbo(this.position),
                this.createVbo(this.velocity),
            ]
        ];

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // クリア時の設定
        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        // 無条件にすべての頂点をレンダリングするため深度テストを切る
        // gl.enable(gl.DEPTH_TEST);

        // ブレンドの設定
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);

        this.running = true;
        this.beginTime = Date.now();
        this.counter = 0;
    }
    /**
     * WebGL を利用して描画を行う。
     */
    render(){
        let gl = this.gl;

        if(this.running === true){
            requestAnimationFrame(this.render);
        }

        // 経過時間を取得と canvas のサイズの調整
        this.nowTime = (Date.now() - this.beginTime) / 1000;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // カメラ関連のパラメータを決める
        let cameraPosition    = [0.0, 0.0, 5.0];             // カメラの座標
        let centerPoint       = [0.0, 0.0, 0.0];             // カメラの注視点
        let cameraUpDirection = [0.0, 1.0, 0.0];             // カメラの上方向
        let fovy   = 60;                                     // カメラの視野角
        let aspect = this.canvas.width / this.canvas.height; // カメラのアスペクト比
        let near   = 0.1;                                    // 最近距離クリップ面
        let far    = 200.0;                                  // 最遠距離クリップ面
        // ビュー・プロジェクション座標変換行列
        this.vMatrix  = MAT.lookAt(cameraPosition, centerPoint, cameraUpDirection);
        this.pMatrix  = MAT.perspective(fovy, aspect, near, far);
        this.vpMatrix = MAT.multiply(this.pMatrix, this.vMatrix);

        // モデル座標変換行列
        this.mMatrix = MAT.identity(this.mMatrix);
        this.mvpMatrix = MAT.multiply(this.vpMatrix, this.mMatrix);

        // パラメータの調整 @@@
        if(this.isMouseDown !== true){
            // 動く力はマウスボタンが押されていない場合は減衰する
            this.movePower *= 0.95;
        }
        // カウンタをインクリメントしバッファをフリップ（入れ替え）する @@@
        ++this.counter;
        let countIndex = this.counter % 2;
        let invertIndex = 1 - countIndex;

        // まず transform feedback で VBO を更新する @@@
        gl.useProgram(this.tfProgram);
        this.setAttribute(this.VBOArray[countIndex], this.tfAttLocation, this.tfAttStride);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.VBOArray[invertIndex][0]);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, this.VBOArray[invertIndex][1]);
        gl.enable(gl.RASTERIZER_DISCARD);
        gl.beginTransformFeedback(gl.POINTS);
        this.setUniform([
            this.nowTime,                // 経過時間
            this.mouse,                  // マウスカーソルの位置（正規化済み）
            this.isMouseDown,            // マウスボタンが押されているかどうか
            turnPower,                   // 曲がろうとする力
            this.movePower * powerScale, // 動く力と、そのスケール値の乗算
        ], this.tfUniLocation, this.tfUniType);
        gl.drawArrays(gl.POINTS, 0, this.position.length / 3);
        gl.disable(gl.RASTERIZER_DISCARD);
        gl.endTransformFeedback();
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, null);

        // 頂点の情報が更新できたので最終レンダリング @@@
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(this.program);
        this.setAttribute(this.VBOArray[invertIndex], this.attLocation, this.attStride);
        this.setUniform([
            this.mvpMatrix,                  // MVP Matrix
            this.movePower * pointSizeScale, // 動く力に由来するポイントサイズ
            globalAlpha,                     // 全体に掛かるアルファ値
        ], this.uniLocation, this.uniType);
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
     * プログラムオブジェクトを生成して返す。（transform feedback 対応版）
     * シェーダのリンクに失敗した場合は理由をアラートし null を返す。
     * @param {WebGLShader} vs - 頂点シェーダオブジェクト
     * @param {WebGLShader} fs - フラグメントシェーダオブジェクト
     * @param {Array.<string>} varyings - 出力変数名の配列
     * @return {WebGLProgram} プログラムオブジェクト
     */
    createTransformFeedbackProgram(vs, fs, varyings){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }
        let gl = this.gl;
        let program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.transformFeedbackVaryings(program, varyings, gl.SEPARATE_ATTRIBS);
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

    /**
     * フレームバッファを削除する。
     * @param {object} obj - createFramebuffer が返すオブジェクト
     */
    deleteFrameBuffer(obj){
        if(this.gl == null || obj == null){return;}
        let gl = this.gl;
        if(obj.hasOwnProperty('framebuffer') === true && this.gl.isFramebuffer(obj.framebuffer) === true){
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.deleteFramebuffer(obj.framebuffer);
            obj.framebuffer = null;
        }
        if(obj.hasOwnProperty('renderbuffer') === true && gl.isRenderbuffer(obj.renderbuffer) === true){
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            gl.deleteRenderbuffer(obj.renderbuffer);
            obj.renderbuffer = null;
        }
        if(obj.hasOwnProperty('texture') === true && gl.isTexture(obj.texture) === true){
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.deleteTexture(obj.texture);
            obj.texture = null;
        }
        obj = null;
    }
}

/**
 * マウスでドラッグ操作を行うための簡易な実装例
 * @class
 */
class InteractionCamera {
    /**
     * @constructor
     */
    constructor(){
        this.qtn               = QTN.identity(QTN.create());
        this.dragging          = false;
        this.prevMouse         = [0, 0];
        this.rotationScale     = Math.min(window.innerWidth, window.innerHeight);
        this.rotation          = 0.0;
        this.rotateAxis        = [0.0, 0.0, 0.0];
        this.rotatePower       = 2.0;
        this.rotateAttenuation = 0.9;
        this.scale             = 1.0;
        this.scalePower        = 0.0;
        this.scaleAttenuation  = 0.8;
        this.scaleMin          = 0.25;
        this.scaleMax          = 2.0;
        this.startEvent        = this.startEvent.bind(this);
        this.moveEvent         = this.moveEvent.bind(this);
        this.endEvent          = this.endEvent.bind(this);
        this.wheelEvent        = this.wheelEvent.bind(this);
    }
    /**
     * mouse down event
     * @param {Event} eve - event object
     */
    startEvent(eve){
        this.dragging = true;
        this.prevMouse = [eve.clientX, eve.clientY];
    }
    /**
     * mouse move event
     * @param {Event} eve - event object
     */
    moveEvent(eve){
        if(this.dragging !== true){return;}
        let x = this.prevMouse[0] - eve.clientX;
        let y = this.prevMouse[1] - eve.clientY;
        this.rotation = Math.sqrt(x * x + y * y) / this.rotationScale * this.rotatePower;
        this.rotateAxis[0] = y;
        this.rotateAxis[1] = x;
        this.prevMouse = [eve.clientX, eve.clientY];
    }
    /**
     * mouse up event
     */
    endEvent(){
        this.dragging = false;
    }
    /**
     * wheel event
     * @param {Event} eve - event object
     */
    wheelEvent(eve){
        let w = eve.wheelDelta;
        let s = this.scaleMin * 0.1;
        if(w > 0){
            this.scalePower = -s;
        }else if(w < 0){
            this.scalePower = s;
        }
    }
    /**
     * quaternion update
     */
    update(){
        this.scalePower *= this.scaleAttenuation;
        this.scale = Math.max(this.scaleMin, Math.min(this.scaleMax, this.scale + this.scalePower));
        if(this.rotation === 0.0){return;}
        this.rotation *= this.rotateAttenuation;
        let q = QTN.identity(QTN.create());
        QTN.rotate(this.rotation, this.rotateAxis, q);
        QTN.multiply(this.qtn, q, this.qtn);
    }
}

