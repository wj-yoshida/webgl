attribute vec3  position;  // 頂点座標
attribute vec4  color;     // 頂点色
uniform   mat4  mvpMatrix; // MVP 座標変換行列
uniform   float time;      // 時間
varying   vec4  vColor;

void main(){
    vColor = color;
    // JavaScript 側で生成した行列と頂点座標を乗算 @@@
    gl_Position = mvpMatrix * vec4(position, 1.0);
    gl_PointSize = 2.0;
}
