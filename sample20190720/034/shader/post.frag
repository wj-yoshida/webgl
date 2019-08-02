precision mediump float;
uniform sampler2D textureUnit; // テクスチャユニット
uniform float     curtain;     // カーテン（0.0 ~ 1.0）
uniform float     mixRatio;    // 線形補間係数（0.0 ~ 1.0）
uniform float     vignette;    // ビネット係数（0.0 ~ 1.0）
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
        // モノクロ化した際の輝度
        //   float mono = destColor.r * redScale  + destColor.g * greenScale + ~~ と係数をかけて加算しても良いが内積をつかっているのは
        // dot = (A.x * B.x + A.y * B.y + A.z * B.z )という計算方法と一緒なのでつかってるだけ-
        float mono = dot(destColor.rgb, monochromeScale);

        // ビネットを出すためにテクスチャ座標を中央原点に変換する
        vec2 st = vTexCoord * 2.0 - 1.0;
        // ビネットを出すためにベクトルの長さを測る
        float vig = length(st);
        // uniform で入ってくるビネット係数で調整する
        vig = clamp(vignette - vig, 0.0, 1.0); //clampは第二引数が最小値で第３引数が最大値になる様に丸めてくれる

        // 最終出力カラー
        gl_FragColor = mix(destColor, vec4(vec3(mono * vig), 1.0), mixRatio);
    }
}
