precision mediump float;
uniform sampler2D textureUnit; // テクスチャユニット
uniform float     curtain;     // カーテン（0.0 ~ 1.0）
uniform float     mixRatio;    // 線形補間係数（0.0 ~ 1.0）
uniform float     time;        // 時間の経過（秒）
varying vec2      vTexCoord;

// ノイズ生成用の関数を定義
//fractは小数点以下のあたいだけを抽出する （floarが切り捨てるとこ）
float rnd(vec2 n){
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

void main(){
    vec4 destColor = texture2D(textureUnit, vTexCoord);

    if(vTexCoord.s > curtain){
        // 乱数を得る
        float r = rnd(gl_FragCoord.st + mod(time, 1.0)); //modは除算の剰余（割ったあまりを求める） 大きい数値が入ってきても大丈夫なように（timeで乱数を出す元の値を変化させてる）

        // 乱数をそのまま乗算しただけの色
        vec4 noiseColor = vec4(destColor.rgb * r, 1.0);

        destColor = mix(destColor, noiseColor, mixRatio);
    }

    gl_FragColor = destColor;
}
