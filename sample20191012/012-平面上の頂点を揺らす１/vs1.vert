attribute vec3  position;  // 頂点座標
attribute vec4  color;     // 頂点色
uniform   mat4  mvpMatrix; // MVP 座標変換行列
uniform   float time;      // 時間
varying   vec4  vColor;

void main(){
    vColor = color;
    float wave = 2.0;
    float height = 0.5;
    // 頂点の X 座標の値と時間の経過からサイン波を生成
    float s = sin(position.x * wave + time) * height;
    // サイン波を頂点の Y 座標に割り当てる
    vec3 p = vec3(position.x, s, position.z);
    // 加工した頂点座標を使って最終的な行列との乗算を行う
    gl_Position = mvpMatrix * vec4(p, 1.0);

    gl_PointSize = 4.0;
}
