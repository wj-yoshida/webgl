
/* ===========================================================================
 * 039 では、WebGL 2.0 で利用可能となった transform feedback を用いることで、動
 * 的に VBO をシェーダで書き換えるという荒業を行いました。
 * しかし、WebGL 1.0 環境を前提にした場合は GPGPU を行うことはできないのかな？
 * という疑問を持った方もいたかもしれません。
 * このサンプルでは、WebGL 1.0 環境で、浮動小数点テクスチャへと頂点の座標情報な
 * どを書き込むことで、GPGPU を実現しています。初期化処理、そして描画のフローも
 * かなり複雑になっていますが、その苦労に見合った美しい描画結果を得ることができ
 * ます。
 * ここでは、Curl Noise と呼ばれる「ノイズを使って進行方向を制御する方法」を実装
 * しています。難易度が高い実装なのでちょっと難しいかもしれませんが、せめて参考
 * 程度にでも見てみてもらえたらと思います。
 * ========================================================================= */

const MAT = new matIV();
const QTN = new qtnIV();

const POINT_RESOLUTION = 128; // 描かれる頂点の個数（解像度）

let pointSize = 16.0; // 頂点のポイントサイズ @@@
let moveSpeed = 0.01; // 頂点の移動スピード @@@

window.addEventListener('DOMContentLoaded', () => {
    // https://github.com/cocopon/tweakpane
    const PANE = new Tweakpane({
        container: document.querySelector('#pane'),
    });
    PANE.addInput({'point size': pointSize}, 'point size', {
        step: 1.0,
        min: 1.0,
        max: 64.0,
    }).on('change', (v) => {pointSize = v;});
    PANE.addInput({'move speed': moveSpeed}, 'move speed', {
        step: 0.001,
        min: 0.001,
        max: 0.05,
    }).on('change', (v) => {moveSpeed = v;});

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
        this.ext       = null; // 浮動小数点テクスチャは WebGL 1.0 では拡張機能扱い @@@
        this.render    = this.render.bind(this);

        // 行列関連
        this.mMatrix   = MAT.identity(MAT.create());
        this.vMatrix   = MAT.identity(MAT.create());
        this.pMatrix   = MAT.identity(MAT.create());
        this.vpMatrix  = MAT.identity(MAT.create());
        this.mvpMatrix = MAT.identity(MAT.create());

        // マウス関連
        this.isMouseDown = false;
        this.mouse = [0, 0];
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
        this.gl = this.canvas.getContext('webgl');
        if(this.gl == null){throw new Error('webgl not supported');}

        // 拡張機能を有効化する @@@
        this.ext = this.getWebGLExtensions();
    }
    /**
     * シェーダやテクスチャ用の画像など非同期で読み込みする処理を行う。
     * @return {Promise}
     */
    load(){
        /**
         * 今回のサンプルでは、シェーダを全部で４組使います（！！！）
         * １．リセットシェーダ
         *     このシェーダは初期値を書き込むためだけに使われます。
         *     浮動小数点テクスチャに、頂点の初期位置を書き込む一番最初の段階で
         *     一度だけ実行します。
         * ２．最終シーンのレンダリングを行うシェーダ
         *     このシェーダが、画面に出てるシーンを描画しているものです。
         * ３．頂点座標を更新するシェーダ
         *     浮動小数点テクスチャに対して、頂点の現在の座標を書き込みます。
         * ４．頂点の進行方向を更新するシェーダ
         *     浮動小数点テクスチャに対して、頂点の進行方向座標を書き込みます。
         */
        // リセットシェーダ @@@
        this.resetProgram     = null;
        this.resetAttLocation = null;
        this.resetAttStride   = null;
        this.resetUniLocation = null;
        this.resetUniType     = null;

        // 最終シーンのレンダリングを行うシェーダ @@@
        this.sceneProgram     = null;
        this.sceneAttLocation = null;
        this.sceneAttStride   = null;
        this.sceneUniLocation = null;
        this.sceneUniType     = null;

        // 頂点の座標を更新するためのシェーダ @@@
        this.positionProgram     = null;
        this.positionAttLocation = null;
        this.positionAttStride   = null;
        this.positionUniLocation = null;
        this.positionUniType     = null;

        // 頂点の進行方向を更新するためのシェーダ @@@
        this.velocityProgram     = null;
        this.velocityAttLocation = null;
        this.velocityAttStride   = null;
        this.velocityUniLocation = null;
        this.velocityUniType     = null;

        return new Promise((resolve) => {
            this.loadShader([
                './vs1.vert',
                './fs1.frag',
            ])
            .then((shaders) => {
                // リセットシェーダ
                let gl = this.gl;
                let vs = this.createShader(shaders[0], gl.VERTEX_SHADER);
                let fs = this.createShader(shaders[1], gl.FRAGMENT_SHADER);
                this.resetProgram = this.createProgram(vs, fs);
                this.resetAttLocation = [
                    gl.getAttribLocation(this.resetProgram, 'position'),
                ];
                this.resetAttStride = [
                    3,
                ];
                this.resetUniLocation = [
                    // このシェーダは最初に初期値を書き込むだけなので、必要とな
                    // る uniform 変数は解像度のみです。
                    gl.getUniformLocation(this.resetProgram, 'resolution'),
                ];
                this.resetUniType = [
                    'uniform2fv',
                ];
                return this.loadShader([
                    './vs2.vert',
                    './fs2.frag',
                ]);
            })
            .then((shaders) => {
                // 最終シーンシェーダ
                let gl = this.gl;
                let vs = this.createShader(shaders[0], gl.VERTEX_SHADER);
                let fs = this.createShader(shaders[1], gl.FRAGMENT_SHADER);
                this.sceneProgram = this.createProgram(vs, fs);
                this.sceneAttLocation = [
                    gl.getAttribLocation(this.sceneProgram, 'texCoord'),
                ];
                this.sceneAttStride = [
                    2,
                ];
                this.sceneUniLocation = [
                    // このシェーダは最終的なレンダリング結果を生成するため、行
                    // 列の他、ポイントサイズなどの uniform を利用します。
                    // このシェーダで利用するテクスチャには、更新後の頂点座標と
                    // 頂点の進行方向が含まれています。
                    gl.getUniformLocation(this.sceneProgram, 'mvpMatrix'),
                    gl.getUniformLocation(this.sceneProgram, 'pointSize'),
                    gl.getUniformLocation(this.sceneProgram, 'positionTexture'),
                    gl.getUniformLocation(this.sceneProgram, 'velocityTexture'),
                ];
                this.sceneUniType = [
                    'uniformMatrix4fv',
                    'uniform1f',
                    'uniform1i',
                    'uniform1i',
                ];
                return this.loadShader([
                    './vs3.vert',
                    './fs3.frag',
                ]);
            })
            .then((shaders) => {
                // 頂点座標更新シェーダ
                let gl = this.gl;
                let vs = this.createShader(shaders[0], gl.VERTEX_SHADER);
                let fs = this.createShader(shaders[1], gl.FRAGMENT_SHADER);
                this.positionProgram = this.createProgram(vs, fs);
                this.positionAttLocation = [
                    gl.getAttribLocation(this.positionProgram, 'position'),
                ];
                this.positionAttStride = [
                    3,
                ];
                this.positionUniLocation = [
                    // このシェーダでは、直近の（直前の）頂点座標を読み出すため
                    // のテクスチャ prevTexture と、直近の進行方向を渡してやる必
                    // 要があります。
                    // また物理的に頂点の位置が変動するのがこのシェーダになるの
                    // で、移動スピードなどのパラメータも必要になります。
                    gl.getUniformLocation(this.positionProgram, 'prevTexture'),
                    gl.getUniformLocation(this.positionProgram, 'velocityTexture'),
                    gl.getUniformLocation(this.positionProgram, 'resolution'),
                    gl.getUniformLocation(this.positionProgram, 'move'),
                    gl.getUniformLocation(this.positionProgram, 'speed'),
                ];
                this.positionUniType = [
                    'uniform1i',
                    'uniform1i',
                    'uniform2fv',
                    'uniform1f',
                    'uniform1f',
                ];
                return this.loadShader([
                    './vs4.vert',
                    './fs4.frag',
                ]);
            })
            .then((shaders) => {
                // 頂点の進行方向更新シェーダ
                let gl = this.gl;
                let vs = this.createShader(shaders[0], gl.VERTEX_SHADER);
                let fs = this.createShader(shaders[1], gl.FRAGMENT_SHADER);
                this.velocityProgram = this.createProgram(vs, fs);
                this.velocityAttLocation = [
                    gl.getAttribLocation(this.velocityProgram, 'position'),
                ];
                this.velocityAttStride = [
                    3,
                ];
                this.velocityUniLocation = [
                    // 頂点の座標と同じように、直近の進行方向を知る必要があるた
                    // めに、prevTexture が必要です。
                    // また、マウスカーソルの位置に応じて進行方向を変化させるよ
                    // うな処理になっているので、カーソル位置もここで送ります。
                    gl.getUniformLocation(this.velocityProgram, 'prevTexture'),
                    gl.getUniformLocation(this.velocityProgram, 'positionTexture'),
                    gl.getUniformLocation(this.velocityProgram, 'resolution'),
                    gl.getUniformLocation(this.velocityProgram, 'move'),
                    gl.getUniformLocation(this.velocityProgram, 'mouse'),
                ];
                this.velocityUniType = [
                    'uniform1i',
                    'uniform1i',
                    'uniform2fv',
                    'uniform1i',
                    'uniform2fv',
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

        // 頂点のテクスチャ座標の定義 @@@
        this.pointTexCoord = [];
        for(let i = 0; i < POINT_RESOLUTION; ++i){
            let t = i / POINT_RESOLUTION;
            for(let j = 0; j < POINT_RESOLUTION; ++j){
                let s = j / POINT_RESOLUTION;
                this.pointTexCoord.push(s, t);
            }
        }
        this.pointVBO = [
            this.createVbo(this.pointTexCoord),
        ];

        // 板ポリゴンの頂点定義 @@@
        this.planePosition = [
             1.0,  1.0,  0.0,
            -1.0,  1.0,  0.0,
             1.0, -1.0,  0.0,
            -1.0, -1.0,  0.0
        ];
        this.planeTexCoord = [
            1.0, 0.0,
            0.0, 0.0,
            1.0, 1.0,
            0.0, 1.0
        ];
        this.planeIndex = [
            0, 1, 2, 2, 1, 3
        ];
        this.planeVBO = [this.createVbo(this.planePosition)];
        this.planeIBO = this.createIbo(this.planeIndex);
        this.planeTexCoordVBO = [
            this.createVbo(this.planePosition),
            this.createVbo(this.planeTexCoord)
        ];

        /**
         * 今回の実装では、直近の頂点座標や、直近の頂点の進行方向を知る必要があ
         * るため、座標用と進行方向用とで、それぞれ２つのフレームバッファを準備
         * しておきます。
         * また、フレームバッファには浮動小数点テクスチャをアタッチすることにな
         * るため、createFramebufferFloat を使ってフレームバッファを生成します。
         */
        // framebuffer の生成 @@@
        this.positionFramebuffers = [
            this.createFramebufferFloat(this.ext, POINT_RESOLUTION, POINT_RESOLUTION),
            this.createFramebufferFloat(this.ext, POINT_RESOLUTION, POINT_RESOLUTION)
        ];
        this.velocityFramebuffers = [
            this.createFramebufferFloat(this.ext, POINT_RESOLUTION, POINT_RESOLUTION),
            this.createFramebufferFloat(this.ext, POINT_RESOLUTION, POINT_RESOLUTION)
        ];

        // texture のバインド処理
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.positionFramebuffers[0].texture);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.positionFramebuffers[1].texture);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.velocityFramebuffers[0].texture);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, this.velocityFramebuffers[1].texture);

        // まずリセットシェーダでフレームバッファをクリアする @@@
        gl.useProgram(this.resetProgram);
        this.setAttribute(this.planeVBO, this.resetAttLocation, this.resetAttStride, this.planeIBO);
        this.setUniform([
            [POINT_RESOLUTION, POINT_RESOLUTION]
        ], this.resetUniLocation, this.resetUniType);
        gl.viewport(0, 0, POINT_RESOLUTION, POINT_RESOLUTION);
        for(let i = 0; i <= 1; ++i){
            // position buffer
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.positionFramebuffers[i].framebuffer);
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawElements(gl.TRIANGLES, this.planeIndex.length, gl.UNSIGNED_SHORT, 0);
            // velocity buffer
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.velocityFramebuffers[i].framebuffer);
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawElements(gl.TRIANGLES, this.planeIndex.length, gl.UNSIGNED_SHORT, 0);
        }

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

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
        ++this.counter;
        let targetBufferIndex = this.counter % 2;
        let prevBufferIndex = 1 - targetBufferIndex;

        // ブレンドを切り、ビューポートを設定する @@@
        gl.disable(gl.BLEND);
        gl.viewport(0, 0, POINT_RESOLUTION, POINT_RESOLUTION);
        // まず最初に velocity を更新 @@@
        gl.useProgram(this.velocityProgram);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.velocityFramebuffers[targetBufferIndex].framebuffer);
        this.setAttribute(this.planeVBO, this.velocityAttLocation, this.velocityAttStride, this.planeIBO);
        this.setUniform([
            2 + prevBufferIndex,
            0 + prevBufferIndex,
            [POINT_RESOLUTION, POINT_RESOLUTION],
            this.isMouseDown,
            this.mouse,
        ], this.velocityUniLocation, this.velocityUniType);
        gl.drawElements(gl.TRIANGLES, this.planeIndex.length, gl.UNSIGNED_SHORT, 0);
        // velocity が更新できたら、その更新後の進行方向に頂点を動か @@@
        gl.useProgram(this.positionProgram);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.positionFramebuffers[targetBufferIndex].framebuffer);
        this.setAttribute(this.planeVBO, this.positionAttLocation, this.positionAttStride, this.planeIBO);
        this.setUniform([
            0 + prevBufferIndex,
            2 + targetBufferIndex,
            [POINT_RESOLUTION, POINT_RESOLUTION],
            this.isMouseDown,
            moveSpeed,
        ], this.positionUniLocation, this.positionUniType);
        gl.drawElements(gl.TRIANGLES, this.planeIndex.length, gl.UNSIGNED_SHORT, 0);

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // ブレンドを有効化し、最終シーンのレンダリングを行う
        gl.enable(gl.BLEND);
        gl.useProgram(this.sceneProgram);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        this.setAttribute(this.pointVBO, this.sceneAttLocation, this.sceneAttStride);
        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        // カメラ関連のパラメータを決める
        let cameraPosition    = [0.0, 0.0, 4.0];             // カメラの座標
        let centerPoint       = [0.0, 0.0, 0.0];             // カメラの注視点
        let cameraUpDirection = [0.0, 1.0, 0.0];             // カメラの上方向
        let fovy   = 60;                                     // カメラの視野角
        let aspect = this.canvas.width / this.canvas.height; // カメラのアスペクト比
        let near   = 0.1;                                    // 最近距離クリップ面
        let far    = 20.0;                                   // 最遠距離クリップ面
        // ビュー・プロジェクション座標変換行列
        this.vMatrix  = MAT.lookAt(cameraPosition, centerPoint, cameraUpDirection);
        this.pMatrix  = MAT.perspective(fovy, aspect, near, far);
        this.vpMatrix = MAT.multiply(this.pMatrix, this.vMatrix);
        // モデル座標変換行列
        this.mMatrix = MAT.identity(this.mMatrix);
        this.mvpMatrix = MAT.multiply(this.vpMatrix, this.mMatrix);

        this.setUniform([
            this.mvpMatrix,
            pointSize,
            0 + targetBufferIndex, // これが直近で更新された頂点座標
            2 + targetBufferIndex, // 進行方向は色付けに使っています
        ], this.sceneUniLocation, this.sceneUniType);
        gl.drawArrays(gl.POINTS, 0, POINT_RESOLUTION * POINT_RESOLUTION);
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

