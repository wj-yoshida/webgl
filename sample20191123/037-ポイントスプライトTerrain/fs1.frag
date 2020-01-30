precision mediump float;
uniform float lightIntensity; // 光の強さ @@@
varying vec4 vColor;

void main(){
    // 頂点を点として描いている場合にのみ有効な、点として描かれている矩形内での
    // テクスチャ座標に相当する値を返してくれるのが gl_PointCoord
    vec2 coord = gl_PointCoord.st * 2.0 - 1.0;//stの中身を-1~1に
    // 光の強さをベクトルの長さで割る
    float f = lightIntensity / length(coord);
    
    // もしも、もう少しクッキリさせたいなら、べき算を活用する
     f = pow(f, 2.0);
    // アルファに対しても除算の結果をそのまま代入する
    gl_FragColor = vColor * vec4(min(f, 1.0));
}

