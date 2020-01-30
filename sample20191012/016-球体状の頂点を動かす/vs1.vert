attribute vec3  position;  // 頂点座標
attribute vec4  color;     // 頂点色
uniform   mat4  mvpMatrix; // MVP 座標変換行列
uniform   float time;      // 時間
varying   vec4  vColor;

void main(){
    vColor = color;

    // 長さが 1.0 ちょうどのベクトルのことを、数学では「単位ベクトル」と呼びます。
    // 単位ベクトルは、長さが常に 1.0 であることが確定しているので、ベクトルの長
    // さによって処理の内容が変わってほしくない場合、つまり別の言い方をすると
    // 「ベクトルの向きだけに注目したい場合」に便利です。
    // GLSL でベクトルを単位化するには normalize 関数を利用します。

    // 原点から各頂点のローカル座標へ向かうベクトルの単位化（法線）
    vec3 normal = normalize(position);
    //***普通はattributeとしてjsで計算してからshaderに送る場合が多い
    
    // Y 座標と経過時間からサイン波を生成
    float s = sin(position.y * 2.0 + time * 2.0);
    // 法線方向へ伸縮するような値を生成
    float pw = 0.2;
    vec3 n = normal * s * pw;
    // 伸縮量を加算してから座標変換
    gl_Position = mvpMatrix * vec4(position + n, 1.0);

    gl_PointSize = 4.0;
}

// ※注意
// 頂点の座標を単位化したらそれが法線として使えるのは、今回は頂点の形状が球体だからです。
// 単位化したらそれが法線に等しいというのはあらゆる 3D の原則というわけではないので注意しましょう。

