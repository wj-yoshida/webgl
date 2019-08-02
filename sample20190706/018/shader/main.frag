precision mediump float;

uniform sampler2D textureUnit; // テクスチャユニット番号 @@@
//sampler2D型となっているが実際はjsから整数をpushする整数で指定されたテクスチャユニットが使われる。
varying vec4 vColor;
varying vec2 vTexCoord;

void main(){
    // テクスチャオブジェクトから、テクスチャ座標を参照して色を取り出す @@@
    //第一引数がsampler型の変数で第二引数がテクスチャ座標
    //戻り値がそのままRGBAが帰ってくる
    vec4 samplerColor = texture2D(textureUnit, vTexCoord);
    gl_FragColor = vColor * samplerColor;
}
