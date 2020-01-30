attribute vec3  position;
attribute vec4  color;
attribute float size;
uniform   vec2  mouse;
uniform   vec2  resolution;
varying   vec4  vColor;
void main(){
    vColor = color;

    // 解像度の情報からアスペクト比を計算して頂点を変換する @@@
    // 「1.0 を n で割った値を p に掛ける == p を n で割る」です
    // これは GLSL 云々ではなく単に算数の問題ですね
    float aspect = 1.0 / (resolution.x / resolution.y);
    vec3 p = position * vec3(aspect, 1.0, 1.0);
    // 変換したあとの頂点座標を使って描画を行う @@@
    gl_Position = vec4(p + vec3(mouse, 0.0), 1.0);
    gl_PointSize = size;
}
