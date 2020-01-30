attribute vec3  position;
attribute float ratio;      // 0.0 ~ 1.0
uniform   float time;       // 経過時間

const float PI = 3.1415926; // 円周率、パイ @@@

void main(){
    // 続いてもやってみようシリーズです。
    // ここでは、ratio の値を上手に使って、頂点を円形に配置する
    // ことを目指します。頂点を円形に配置するには、ratio の値を
    // 上手にラジアンに変換することができるかどうかがキモです。
    // また、円形に配置した頂点をサイン波で揺らすためにはなにを
    // すればいいのかも考えてみましょう。
    gl_Position = vec4(
        position.x,
        position.y,
        position.z, 1.0);
    gl_PointSize = 8.0;
}
