attribute vec3  position;
attribute vec4  color;
attribute float size;
uniform   vec2  mouse; // マウスカーソルの位置（正規化済み） @@@
varying   vec4  vColor;
void main(){
    vColor = color;

    // マウスカーソルの動きを頂点座標にそのまま加算する @@@
    gl_Position = vec4(position + vec3(mouse, 0.0), 1.0);
    gl_PointSize = size;
}
