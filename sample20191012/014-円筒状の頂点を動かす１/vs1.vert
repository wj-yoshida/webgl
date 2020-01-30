attribute vec3  position;  // 頂点座標
attribute vec4  color;     // 頂点色
uniform   mat4  mvpMatrix; // MVP 座標変換行列
uniform   float time;      // 時間
varying   vec4  vColor;

void main(){
    vColor = color;
    float wave = 5.0; 
    // 頂点の Y 座標の値からサイン波を作る @@@
    float s = sin(position.y * wave + time);

    // 負の方向へ動かしたくない場合はたとえば以下のように補正する @@
    //本来のsinの値は-1.0~1.0の範囲なので,
    //1.0を足して0.0~2.0にしてlessで調整している
    float less = 0.4;
     s = 1.0 + s * less;

    // サイン波を頂点の XZ 座標に対して乗算 @@@
    vec3 p = vec3(position.x * s, position.y , position.z * s);

    // 補正後の頂点座標を行列と乗算する
    gl_Position = mvpMatrix * vec4(p, 1.0);

    gl_PointSize = 4.0;
}
