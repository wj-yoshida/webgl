precision mediump float;
uniform float     colorRatio;   // テクスチャ合成の割合い
uniform sampler2D textureUnit0; // １枚目のテクスチャ
uniform sampler2D textureUnit1; // ２枚目のテクスチャ
uniform sampler2D textureUnit2; // ３枚目のテクスチャ @@@
varying vec4      vColor;
varying vec2      vTexCoord;

void main(){
    // テクスチャからそれぞれ色を抜き出す
    vec4 samplerColor0 = texture2D(textureUnit0, vTexCoord);
    vec4 samplerColor1 = texture2D(textureUnit1, vTexCoord);
    vec4 samplerColor2 = texture2D(textureUnit2, vTexCoord);
    // ３枚目のテクスチャの色はトランジション係数として使う @@@
    float r = clamp(colorRatio * 2.0 - samplerColor2.r, 0.0, 1.0);
    // トランジション係数を踏まえて mix 関数で線形補間する @@@
    vec4 mixColor = mix(samplerColor0, samplerColor1, r);

    gl_FragColor = mixColor;
}

