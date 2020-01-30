precision mediump float;
uniform float     ratio;        // テクスチャ合成の割合い @@@
uniform sampler2D textureUnit0; // １枚目のテクスチャ @@@
uniform sampler2D textureUnit1; // ２枚目のテクスチャ @@@
varying vec4      vColor;
varying vec2      vTexCoord;

void main(){
    // テクスチャからそれぞれ色を抜き出す @@@
    vec4 samplerColor0 = texture2D(textureUnit0, vTexCoord);
    vec4 samplerColor1 = texture2D(textureUnit1, vTexCoord);
    // mix 関数で線形補間する @@@
    vec4 mixColor = mix(samplerColor0, samplerColor1, ratio);

    gl_FragColor = vColor * mixColor;
}

