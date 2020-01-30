attribute vec3 position;
attribute vec4 color;  // 頂点属性として新たに頂点カラーを追加 @@@
varying   vec4 vColor; // varying 変数でフラグメントシェーダへ値を送る @@@
void main(){
    // フラグメントシェーダへ送る値を varying 変数へ代入しておく @@@
    vColor = color;

    gl_Position = vec4(position, 1.0);
    gl_PointSize = 16.0;
}
