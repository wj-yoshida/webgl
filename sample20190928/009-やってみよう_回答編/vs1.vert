attribute vec3  position;
attribute float ratio;      // 0.0 ~ 1.0
uniform   float time;       // 経過時間

const float PI = 3.1415926; // 円周率、パイ
const float RADIUS = 0.5;   // 円の半径 @@@

float sinWave(float timeScale, float waveLength, float waveHeight){
    // 頂点の ratio に timeScale 倍した time を加算
    float t = ratio + time * timeScale;
    // ２パイを waveLength 倍したものに上記を乗算
    float s = sin(2.0 * PI * waveLength * t);
    // sin がそのままでは範囲が -1.0 ～ 1.0 と広いので waveHeight 倍する
    return s * waveHeight;
}

void main(){
    // ratio からサイン波を作る @@@
    float wave = sinWave(0.1, 8.0, 0.025);
    // 生成したサイン波を半径に加算 @@@
    float radius = RADIUS + wave;

    // ratio からラジアンを作り、円形に配置する @@@
    float radian = PI * 2.0 * ratio; // ratio からラジアンを求める
    float s = sin(radian) * radius;  // ラジアンからサインを求める
    float c = cos(radian) * radius;  // ラジアンからコサインを求める
    vec3 p = vec3(c, s, 0.0);        // 求めたサインとコサインで vec3 を作る

    // 動的に求めた vec3 を gl_Position に出力する
    gl_Position = vec4(position + p, 1.0);
    gl_PointSize = 8.0;
}
