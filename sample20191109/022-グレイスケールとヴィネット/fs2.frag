precision mediump float;
uniform sampler2D textureUnit;
uniform float     saturation; // 彩度 @@@
uniform float     vignette;   // ヴィネット係数 @@@
varying vec2      vTexCoord;

void main(){
    // まずは普通にフレームバッファの色をサンプリング
    vec4 samplerColor = texture2D(textureUnit, vTexCoord);
    // 内積を活用して簡易的にグレイスケール化する
    // 内積は x1*x2 + y1*y2 + z1*z2 なので全部たして平均値出してる
    float gray = dot(vec3(1.0), samplerColor.rgb) / 3.0;
    // mix でグレイスケールとフルカラーを線形補間する
    vec3 rgb = mix(vec3(gray), samplerColor.rgb, saturation);

    // ヴィネットを行うために、原点を中心に移動した座標系を作る
    vec2 v = vTexCoord * 2.0 - 1.0;
    // ヴィネット係数から、各フラグメントの原点からの距離を減算
    float vig = vignette - length(v);

    // ヴィネット係数とカラーの情報を乗算して出力
    gl_FragColor = vec4(vec3(rgb) * vig, 1.0);
}

