precision mediump float;
uniform sampler2D textureUnit;
uniform vec2      resolution;    // スクリーンの解像度
uniform float     time;          // 時間の経過
uniform float     noiseStrength; // ノイズの強さ
uniform vec3      firstColor;    // 第１の色 @@@
uniform vec3      secondColor;   // 第２の色 @@@
varying vec2      vTexCoord;

const int   OCT  = 8;         // オクターブ
const float PST  = 0.5;       // パーセンテージ
const float PI   = 3.1415926; // 円周率

// 補間関数
float interpolate(float a, float b, float x){
    float f = (1.0 - cos(x * PI)) * 0.5;
    return a * (1.0 - f) + b * f;
}
// 乱数生成（その１）
// float rnd(vec2 p){
//     return fract(sin(dot(p ,vec2(12.9898,78.233))) * 43758.5453);
// }
// 乱数生成器（その２）
float rnd(vec2 n){
    float a = 0.129898;
    float b = 0.78233;
    float c = 437.585453;
    float dt= dot(n ,vec2(a, b));
    float sn= mod(dt, 3.14);
    return fract(sin(sn) * c);
}
// 補間＋乱数
float irnd(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec4 v = vec4(rnd(vec2(i.x,       i.y      )),
                  rnd(vec2(i.x + 1.0, i.y      )),
                  rnd(vec2(i.x,       i.y + 1.0)),
                  rnd(vec2(i.x + 1.0, i.y + 1.0)));
    return interpolate(interpolate(v.x, v.y, f.x), interpolate(v.z, v.w, f.x), f.y);
}
// ノイズ
float noise(vec2 p){
    float t = 0.0;
    for(int i = 0; i < OCT; i++){
        float freq = pow(2.0, float(i));
        float amp  = pow(PST, float(OCT - i));
        t += irnd(vec2(p.x / freq, p.y / freq)) * amp;
    }
    return t;
}
// シームレスノイズ
float snoise(vec2 p, vec2 q, vec2 r){
    return noise(vec2(p.x,       p.y      )) *        q.x  *        q.y  +
           noise(vec2(p.x,       p.y + r.y)) *        q.x  * (1.0 - q.y) +
           noise(vec2(p.x + r.x, p.y      )) * (1.0 - q.x) *        q.y  +
           noise(vec2(p.x + r.x, p.y + r.y)) * (1.0 - q.x) * (1.0 - q.y);
}

void main(){
    // まずは普通にフレームバッファの色をサンプリング
    vec4 samplerColor = texture2D(textureUnit, vTexCoord);
    // 内積を活用して簡易的にグレイスケール化する
    float gray = dot(vec3(1.0), samplerColor.rgb) / 3.0;

    // シームレスなバリューノイズを生成する（その１） @@@
    vec2 firstOffset = vec2(0.0, time * 300.0);
    float first = snoise(gl_FragCoord.st - firstOffset, vTexCoord, resolution);
    // シームレスなバリューノイズを生成する（その２） @@@
    vec2 secondOffset = vec2(0.0, time * 500.0);
    float second = snoise(gl_FragCoord.st - secondOffset, vTexCoord, resolution);
    // ２つのノイズを加算して強度係数を乗算 @@@
    vec3 noiseColor = (firstColor * first + secondColor * second) * noiseStrength;

    // ２つのノイズを加算した結果をグラデーション風にする @@@
    float y = 1.0 - vTexCoord.t;

    // ノイズを加算して出力する @@@
    gl_FragColor = vec4(vec3(gray) + noiseColor * y, 1.0);
}

