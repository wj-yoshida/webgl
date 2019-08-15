precision mediump float;
uniform sampler2D textureUnit; // テクスチャユニット
uniform float     curtain;     // カーテン（0.0 ~ 1.0）
uniform float     mixRatio;    // 線形補間係数（0.0 ~ 1.0）
uniform float     toneRatio;   // トーンの大きさ係数
varying vec2      vTexCoord;

const float redScale   = 0.298912; // 赤のスケール値
const float greenScale = 0.586611; // 緑のスケール値
const float blueScale  = 0.114478; // 青のスケール値
const vec3  monochromeScale = vec3(redScale, greenScale, blueScale);

void main(){
    vec4 destColor = texture2D(textureUnit, vTexCoord);

    if(vTexCoord.s > curtain){
        // モノクロスケールを求める
        float mono = dot(destColor.rgb, monochromeScale);
        // モノクロスケールを 4 倍して 2 を引く（0.0 ~ 1.0 が -2.0 ~ 2.0 になる）
        mono = mono * 4.0 - 2.0;
        // ドット模様を作るための計算（0.0 ~ 2.0）
        vec2 tone = gl_FragCoord.st / toneRatio; //gl_FragCoordは現在の処理対象位置
        //toneRatioが大きければ大きいほどtoneが小さくなる.　値の変化が緩やかになる　粒の大きさが変わる

        float crossDot = sin(tone.s) * sin(tone.t) + 1.0; //sinの結果は-1~1の間になる　それぞれのサインの結果を掛け合わせても結局その範囲は常に-1~1になる
        vec3 color = vec3(crossDot + mono) * 0.5;
        vec4 toneColor = vec4(color, 1.0);

        destColor = mix(destColor, toneColor, mixRatio);
    }

    gl_FragColor = destColor;
}
