attribute vec3  position;
attribute vec4  color;
attribute float size; // ポイントサイズの頂点属性を追加 @@@
varying   vec4  vColor;
void main(){
    vColor = color;

    gl_Position = vec4(position, 1.0);
    gl_PointSize = size;
}
