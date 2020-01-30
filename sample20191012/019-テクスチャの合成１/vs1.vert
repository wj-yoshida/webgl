attribute vec3  planePosition;  // 頂点座標（平面）
attribute vec3  spherePosition; // 頂点座標（球体）
attribute vec4  color;          // 頂点色
attribute vec2  texCoord;       // 頂点のテクスチャ座標
uniform   mat4  mvpMatrix;      // MVP 座標変換行列
uniform   float time;           // 時間
varying   vec4  vColor;
varying   vec2  vTexCoord;

void main(){
    vColor = color;
    vTexCoord = texCoord;

    float s = (sin(time) + 1.0) * 0.5;
    vec3 p = mix(planePosition, spherePosition, s);
    gl_Position = mvpMatrix * vec4(p, 1.0);

    gl_PointSize = 4.0;
}
