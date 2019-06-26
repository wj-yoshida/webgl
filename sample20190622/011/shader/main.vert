attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
uniform mat4 mvpMatrix;
varying vec4 vColor;

// 平行光源（ディレクショナルライト）のライトベクトル @@@
const vec3 light = normalize(vec3(1.0)); //vec3(1.0) = vec3(1.0, 1.0, 1.0)

void main(){
    // ベクトルの内積を用いて照度を計算する @@@
    //内積を計算、※ベクトルはいずれも必ず単位化しておくこと
    //diffuseには-1~1の範囲が入るはず
    float diffuse = max(dot(normal, light), 0.0);//maxは最大値を変えす、二番目の引数の０以上になるようにクランプしている
    // 求めた照度を頂点の色に乗算する @@@
    vColor = color * vec4(vec3(diffuse), 1.0);
    gl_Position = mvpMatrix * vec4(position, 1.0);
}
