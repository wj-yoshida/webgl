attribute vec3  planePosition;  // 頂点座標（平面）
attribute vec3  spherePosition; // 頂点座標（球体）
attribute vec4  color;          // 頂点色
attribute vec2  texCoord;       // 頂点のテクスチャ座標 @@@
uniform   mat4  mvpMatrix;      // MVP 座標変換行列
uniform   float time;           // 時間
varying   vec4  vColor;
varying   vec2  vTexCoord;

void main(){
    vColor = color;
    vTexCoord = texCoord; // フラグメントシェーダに送る @@@

    // 時間の経過からサイン波を作り、0.0 ～ 1.0 の状態に補正する
    float s = (sin(time) + 1.0) * 0.5;

    // mix 関数を使って、状態 A と状態 B を線形補間する
    vec3 p = mix(planePosition, spherePosition, s);

    // 補間後の座標を使って座標変換
    gl_Position = mvpMatrix * vec4(p, 1.0);

    gl_PointSize = 4.0;
}
