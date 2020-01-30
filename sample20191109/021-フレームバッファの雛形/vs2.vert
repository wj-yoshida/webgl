attribute vec3  position;
attribute vec2  texCoord;
varying   vec2  vTexCoord;

void main(){
    // テクスチャ座標の縦方向だけ反転させる
    vTexCoord = vec2(texCoord.s, 1.0 - texCoord.t);
    // 行列による変換等は一切行わずに、そのまま出力する
    gl_Position = vec4(position, 1.0);
}

/**
 * フレームバッファの中身は、スクリーン空間と違って左下原点になっているのでテク
 * スチャ座標の縦方向だけは、1.0 から減算することで反転させます。
 * これをやっておかないと、上下逆さまになったシーンが出てしまうので注意しましょう。
 */
