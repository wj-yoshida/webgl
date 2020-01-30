precision mediump float;
uniform sampler2D textureUnit; // 対象となるテクスチャユニット @@@
varying vec4      vColor;
varying vec2      vTexCoord;

void main(){
    // uniform 変数で指定されたユニットから、指定のテクスチャ座標を
    // 参照して RGBA の情報を取り出す @@@
    vec4 samplerColor = texture2D(textureUnit, vTexCoord);
    // ここではそのまま頂点カラーと乗算している @@@
    gl_FragColor = vColor * samplerColor;
}

