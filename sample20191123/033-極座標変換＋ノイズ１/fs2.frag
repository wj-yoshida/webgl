precision mediump float;
uniform sampler2D renderedTexture; // レンダリング結果のテクスチャ
uniform sampler2D noiseTexture;    // ノイズ画像のテクスチャ
uniform float     time;            // 時間の経過
uniform float     timeScale;       // 時間の経過に対するスケール
uniform float     distortionScale; // 歪み係数
uniform bool      polar;           // 極座標変換するかどうか
uniform bool      noiseVisible;    // ノイズを可視化するかどうか
varying vec2      vTexCoord;

const float PI = 3.1415926;

void main(){
    // まず最初に、縦方向にただスクロールするテクスチャ座標を作る
    vec2 coord = fract(vTexCoord - vec2(0.0, time * timeScale));

    if(polar == true){
        // 極座標変換を行う場合

        // テクスチャ座標からスクリーンの中心を求める
        vec2 originCenter = vTexCoord * 2.0 - 1.0;
        // 極座標を求める
        float s = (atan(originCenter.y, originCenter.x) + PI) / (PI * 2.0);
        //-PI~PIの値が出てくるのを(PI * 2.0)で割って0~1の値を求めることができる
        float t = length(originCenter);//中心からの距離
        coord = vec2(s, fract(t - time * timeScale));
    }

    // 極座標変換している場合、ここで影響する
    vec4 noiseColor = texture2D(noiseTexture, coord);

    // 取得したノイズテクスチャの色を正負の方向に正規化する
    vec2 noiseCoord = (noiseColor.rg * 2.0 - 1.0) * distortionScale;

    // ノイズに影響してテクスチャ座標が歪むようにしてサンプリング
    vec4 samplerColor = texture2D(renderedTexture, vTexCoord + noiseCoord);

    if(noiseVisible == true){
        // ノイズの情報を可視化する場合は加算する
        samplerColor += vec4(noiseColor.rgb, 0.0);
    }

    gl_FragColor = samplerColor;
}

