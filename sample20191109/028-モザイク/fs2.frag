precision mediump float;
uniform sampler2D textureUnit;
uniform vec2      resolution; // 解像度
uniform float     blockSize;  // ブロックサイズ @@@
varying vec2      vTexCoord;

void main(){
   
    // 解像度を落とす ≒ 参照するテクスチャ座標を一定の範囲内において同じにすればよい
    // 物理ピクセル位置を指定ブロックサイズで割って小数点以下を切り捨て、再度定数倍する
    vec2 coord = floor(gl_FragCoord.st / blockSize) * blockSize;
    // 解像度の下がった状態のテクスチャ座標を、画面解像度で正規化してからサンプリング
    vec4 samplerColor = texture2D(textureUnit, coord / resolution);

    // 特殊なサンプリングを行った色をそのまま出力
    gl_FragColor = samplerColor;
}

