attribute vec3      position;
attribute vec2      texCoord;
uniform   mat4      mvpMatrix;    // mvpMatrix
uniform   sampler2D noiseTexture; // ノイズテクスチャ
uniform   float     time;         // 経過時間
uniform   vec3      timeScale;    // 経過時間に掛ける係数
uniform   vec3      distortion;   // 歪ませる量
uniform   float     pointSize;    // ポイントサイズ
varying   vec4      vColor;

void main(){
    // 時間でテクスチャ座標をずらしているので、３回に分けてサンプリングを行う
    vec4 noiseR = texture2D(noiseTexture, fract(texCoord - time * timeScale.x));
    vec4 noiseG = texture2D(noiseTexture, fract(texCoord - time * timeScale.y));
    vec4 noiseB = texture2D(noiseTexture, fract(texCoord - time * timeScale.z));

    // ノイズテクスチャの値を頂点の Y 座標にアタッチする
    float height = 0.0;
    height += noiseR.r * distortion.x;
    height += noiseG.g * distortion.y;
    height += noiseB.b * distortion.z;
    vec3 p = position + vec3(0.0, height, 0.0);

    // ノイズの影響を与えた頂点を最終出力とする
    gl_Position = mvpMatrix * vec4(p, 1.0);
    gl_PointSize = pointSize;

    // 色はここでは白で統一
    vColor = vec4(1.0);
}
