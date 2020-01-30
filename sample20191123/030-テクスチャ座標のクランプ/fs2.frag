precision mediump float;
uniform sampler2D textureUnit;
uniform float     clampValue; // テクスチャ座標のクランプ値 @@@
varying vec2      vTexCoord;

void main(){
    // 横方向だけ指定された値でテクスチャ座標をクランプする
    vec2 coord = vec2(min(vTexCoord.s, clampValue), max(vTexCoord.t, clampValue));
    vec2 coord2 = vec2(max(vTexCoord.s, clampValue), min(vTexCoord.t, clampValue));
    vec2 coord3 = vec2(min(vTexCoord.s, clampValue), min(vTexCoord.t, clampValue));

    vec4 samplerColor = texture2D(textureUnit, coord);
    //gl_FragColor = samplerColor;
    
    // 本来の色と、R や B を別々に取得する
    vec4 defaultColor = texture2D(textureUnit, coord3 + vec2(0.01, 0.0));
    vec4 redColor     = texture2D(textureUnit, coord2 + vec2(0.0, 0.0));
    vec4 blueColor    = texture2D(textureUnit, coord + vec2(-0.01, 0.0));

    // 最終出力でそれぞれのサンプリング結果を組み合わせる
    gl_FragColor = vec4(redColor.r, defaultColor.g, blueColor.b, defaultColor.a);
}

