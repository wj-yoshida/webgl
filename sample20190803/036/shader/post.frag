precision mediump float;
uniform sampler2D textureUnit;  // テクスチャユニット
uniform float     curtain;      // カーテン（0.0 ~ 1.0）
uniform float     mixRatio;     // 線形補間係数（0.0 ~ 1.0）
uniform vec2      resolution;   // スクリーンの解像度
uniform float     laplacian[9]; // ラプラシアンフィルタのカーネル
varying vec2      vTexCoord;

const float redScale   = 0.298912; // 赤のスケール値
const float greenScale = 0.586611; // 緑のスケール値
const float blueScale  = 0.114478; // 青のスケール値
const vec3  monochromeScale = vec3(redScale, greenScale, blueScale);

void main(){
    vec4 destColor = texture2D(textureUnit, vTexCoord);

    if(vTexCoord.s <= curtain){
        // curtain の値以下のところはもともとの絵をそのまま出す
        gl_FragColor = destColor;
    }else{
        // 隣のピクセルを参照するためにオフセットする量を求める @@@テクセルをもとめてる
        vec2 pxSize = 1.0 / resolution;
        // ずらす方向と量を定義
        vec2 offset[9];
        offset[0] = vTexCoord + (vec2(-1.0,  1.0) * pxSize);
        offset[1] = vTexCoord + (vec2( 0.0,  1.0) * pxSize);
        offset[2] = vTexCoord + (vec2( 1.0,  1.0) * pxSize);
        offset[3] = vTexCoord + (vec2(-1.0,  0.0) * pxSize);
        offset[4] = vTexCoord + (vec2( 0.0,  0.0) * pxSize);
        offset[5] = vTexCoord + (vec2( 1.0,  0.0) * pxSize);
        offset[6] = vTexCoord + (vec2(-1.0, -1.0) * pxSize);
        offset[7] = vTexCoord + (vec2( 0.0, -1.0) * pxSize);
        offset[8] = vTexCoord + (vec2( 1.0, -1.0) * pxSize);

        // 出力カラーを計算するための変数を宣言
        vec3 dest = vec3(0.0);

        // カーネルの値に基づき色を足しこんでいく
        for(int i = 0; i < 9; ++i){
            dest += texture2D(textureUnit, offset[i]).rgb * laplacian[i];
        }

        // モノクロ化した際の輝度
        float mono = dot(dest, monochromeScale);

        // 最終出力カラー
        //gl_FragColor = vec4(dest, 1.0);
        gl_FragColor = mix(destColor, vec4(vec3(mono), 1.0), mixRatio);
        // gl_FragColor = mix(destColor, vec4(dest, 1.0), mixRatio);
    }
}
