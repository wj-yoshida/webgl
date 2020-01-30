precision mediump float;
uniform sampler2D textureUnit;
uniform bool      noiseTypeOne;    // 乱数生成のタイプ１かどうか
uniform float     noiseStrength;   // ノイズの合成強度
uniform float     vignetteScale;   // ヴィネット係数
uniform float     sinWave;         // サイン波の周波数係数
uniform float     sinStrength;     // サイン波の合成強度
uniform float     time;            // 時間の経過
uniform float     glitchThreshold; // グリッチ発生のしきい値 @@@
uniform float     glitchStrength;  // グリッチ強度 @@@
uniform vec3      background;      // 背景色
varying vec2      vTexCoord;

// 乱数生成（その１）
float rnd(vec2 p){
    return fract(sin(dot(p ,vec2(12.9898,78.233))) * 43758.5453);
}

// 乱数生成器（その２）
float rnd2(vec2 n){
    float a = 0.129898;
    float b = 0.78233;
    float c = 437.585453;
    float dt= dot(n ,vec2(a, b));
    float sn= mod(dt, 3.14);
    return fract(sin(sn) * c);
}

void main(){
    // そもそもグリッチを発生させるかどうかをしきい値で判定する @@@
    float gNoise = rnd(vec2(0.0, gl_FragCoord.t + time)); // 乱数生成
    float gStep = step(gNoise, glitchThreshold);          // step で判定
    float gStrength = gNoise / glitchThreshold;           // 強度の算出
    gStrength = gStrength * 2.0 - 1.0;                    // 正負に振り分け
    // step の結果を使ってテクスチャ座標を補正する
    vec2 coord = vTexCoord + vec2(gStep * gStrength * glitchStrength, 0.0);

    // フレームバッファの色をサンプリングする際にグリッチを考慮 @@@
    vec4 samplerColor = texture2D(textureUnit, coord);
    // 内積を活用して簡易的にグレイスケール化する
    float gray = dot(vec3(1.0), samplerColor.rgb) / 3.0;

    // ヴィネットを行うために、原点を中心に移動した座標系を作る
    vec2 v = vTexCoord * 2.0 - 1.0;
    // ヴィネット係数から、各フラグメントの原点からの距離を減算
    float vig = vignetteScale - length(v);

    // サイン波を生成する
    float wave = sin(v.y * sinWave + time * 5.0);
    // サイン波は負の領域を含むので 0.0 ～ 1.0 に補正する
    wave = (wave + 1.0) * 0.5;
    // サイン波の強さに応じて値を調整
    wave = 1.0 - wave * sinStrength;

    // ホワイトノイズを生成する
    float n = rnd(gl_FragCoord.st + time * 0.01);
    if(noiseTypeOne != true){
        n = rnd2(gl_FragCoord.st + time * 0.01);
    }
    // ノイズの強さに応じて値を調整
    n = 1.0 - n * noiseStrength;

    // 背景色にグレイスケールとヴィネットとノイズを乗算して出力
    gl_FragColor = vec4(background * gray * vig * wave * n, 1.0);
}

