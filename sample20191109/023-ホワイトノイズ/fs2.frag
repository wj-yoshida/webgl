precision mediump float;
uniform sampler2D textureUnit;
uniform bool      noiseTypeOne;  // 乱数生成のタイプ１かどうか @@@
uniform float     noiseStrength; // ノイズの強さ @@@
uniform float     time;          // 時間の経過 @@@
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
    // まずは普通にフレームバッファの色をサンプリング
    vec4 samplerColor = texture2D(textureUnit, vTexCoord);
    // 内積を活用して簡易的にグレイスケール化する
    float gray = dot(vec3(1.0), samplerColor.rgb) / 3.0;

    // ホワイトノイズを生成する
    float n = rnd(gl_FragCoord.st + time * 0.01);
    if(noiseTypeOne != true){
        n = rnd2(gl_FragCoord.st + time * 0.01);
    }
    // ノイズの強さに応じて値を調整
    n = 1.0 - n * noiseStrength;

    // グレイスケールとノイズを乗算して出力
    gl_FragColor = vec4(vec3(gray) * n, 1.0);
}

