precision mediump float;
uniform sampler2D textureUnit;
uniform vec2      resolution; // 解像度
uniform float     blockSize;  // ブロックサイズ
uniform float     threshold;  // グリッチ発生のしきい値 @@@
uniform float     slideWidth; // グリッチ発生時のずれ幅 @@@
uniform float     time;       // 時間の経過
varying vec2      vTexCoord;

float rnd(vec2 n){
    float a = 0.129898;
    float b = 0.78233;
    float c = 437.585453;
    float dt= dot(n ,vec2(a, b));
    float sn= mod(dt, 3.14);
    return fract(sin(sn) * c);
}
float rnd_float(float p){
    return fract(sin(time) * 43758.5453)*5.0;
}

void main(){
    float rndi = rnd_float(60.987);
    float rndi2 = rnd_float(60.987);
    // 縦方向の座標にのみ依存するブロックを定義
    float vertical = floor((gl_FragCoord.t) / blockSize*rndi) * blockSize*rndi;

    // ブロックの幅と時間の経過からノイズを取得
    float n1 = rnd(vec2(vertical, time));
    // しきい値を下回っているかどうか
    //***  0か１のどちらかしか返さない
    // 
    float s = step(n1, threshold);

    // 単純に時間の経過にのみ影響を受けるノイズ（ホワイトノイズ）
    float n2 = rnd(vec2(time)) * 2.0 - 1.0;
    // ホワイトノイズをズレ幅で補正する
    float t = n2 * slideWidth * rnd_float(1.0);

    // しきい値を下回ったかどうかと、ズレ幅とを乗算してテクスチャ座標に加算
    vec4 samplerColor = texture2D(textureUnit, vTexCoord + vec2(s * t, 0.0));

    gl_FragColor = samplerColor;
}

