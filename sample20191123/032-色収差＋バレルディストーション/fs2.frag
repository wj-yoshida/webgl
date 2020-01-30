precision mediump float;
uniform sampler2D textureUnit;
uniform float     offset;      // 色収差のオフセットする量
uniform float     coordScale;  // バレルディストーションの影響範囲 @@@
uniform float     barrelScale; // バレルディストーションのスケール @@@
varying vec2      vTexCoord;

void main(){
    // テクスチャ座標を変換して中心からの距離を計測
    vec2 originCenter = vTexCoord * 2.0 - 1.0;

    // 中心からの距離を計測
    float len = length(originCenter);

    // バレルディストーション係数
    float barrel = max(1.0 - len * coordScale, 0.0) * barrelScale;

    // バレルディストーションでテクスチャ座標を補正
    vec2 barrelCoord = vTexCoord - originCenter * barrel;

    // 中心からの距離に応じた色収差の係数
    vec2 offsetCoord = originCenter * len * offset;

    // バレルディストーション＋中心からの距離に応じた色収差
    vec4 defaultColor = texture2D(textureUnit, barrelCoord);
    vec4 redColor     = texture2D(textureUnit, barrelCoord - offsetCoord);
    vec4 blueColor    = texture2D(textureUnit, barrelCoord + offsetCoord);

    // 最終出力でそれぞれのサンプリング結果を組み合わせる
    gl_FragColor = vec4(redColor.r, defaultColor.g, blueColor.b, defaultColor.a);
}

