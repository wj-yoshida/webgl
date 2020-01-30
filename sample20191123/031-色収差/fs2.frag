precision mediump float;
uniform sampler2D textureUnit;
uniform float     offset; // オフセットする量 @@@
varying vec2      vTexCoord;

void main(){
    // 本来の色と、R や B を別々に取得する
    vec4 defaultColor = texture2D(textureUnit, vTexCoord);
    vec4 redColor     = texture2D(textureUnit, vTexCoord + vec2(-offset, 0.0));
    vec4 blueColor    = texture2D(textureUnit, vTexCoord + vec2(offset, 0.0));

    // 最終出力でそれぞれのサンプリング結果を組み合わせる
    gl_FragColor = vec4(redColor.r, defaultColor.g, blueColor.b, defaultColor.a);
}

