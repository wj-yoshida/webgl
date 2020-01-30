// transform feedback 用の頂点シェーダ

attribute vec3 position; // 入力されてきた頂点座標
attribute vec3 velocity; // 入力されてきた頂点の進行方向

uniform float time;      // 時間の経過
uniform vec2  mouse;     // マウスカーソルの位置（正規化済み）
uniform bool  isDown;    // マウスボタンが押されているかどうか
uniform float turnPower; // 曲がろうとする力
uniform float movePower; // 動こうとする力

varying vec3 vPosition;  // 出力用の varying 変数
varying vec3 vVelocity;  // 出力用の varying 変数

void main(){
    // 「更新前の進行方向」に動こうとする力を作用させつつ、位置を更新
    vPosition = position + velocity * movePower;

    // マウスカーソルの動きに応じて「次の進行方向」が変化するようにする
    vec3 p = vec3(mouse, sin(time) * 0.25) - position;

    // マウスカーソルが押されている場合に限り、進行方向が変化するように
    vVelocity = velocity;
    if(isDown == true){
        vVelocity = normalize(velocity + p * turnPower);
    }
}
