precision mediump float;
uniform sampler2D textureUnit; // テクスチャユニット
uniform float     curtain;     // カーテン（0.0 ~ 1.0）
uniform float     mixRatio;    // 線形補間係数（0.0 ~ 1.0）
uniform vec2      resolution;  // スクリーンの解像度
uniform float     blockSize;   // ブロックサイズ
varying vec2      vTexCoord;

void main(){
    vec4 destColor = texture2D(textureUnit, vTexCoord);
    //gl_FragCoordは左下原点でフレームバッファの物理ピクセル量　vec2で参照できる(浮動小数点だけど実際は小数点以下のあたいは含まれない(ドライバーによる....))

    if(vTexCoord.s > curtain){
        // モザイクを実現するためにテクスチャ座標を変換する
        vec2 coord = floor(gl_FragCoord.st / blockSize) * blockSize;
        // 変換したテクスチャ座標でテクスチャから色を取り出す
        vec4 mosaic = texture2D(textureUnit, coord / resolution);

        destColor = mix(destColor, mosaic, mixRatio);
    }

    gl_FragColor = destColor;
}
