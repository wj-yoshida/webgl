attribute vec3  planePosition;  // 頂点座標（平面）
attribute vec3  spherePosition; // 頂点座標（球体）
attribute vec4  color;          // 頂点色
attribute vec2  texCoord;       // 頂点のテクスチャ座標
uniform   mat4  mvpMatrix;      // MVP 座標変換行列
uniform   float moveRatio;      // ジオメトリ合成の割合い @@@
varying   vec4  vColor;
varying   vec2  vTexCoord;

void main(){
    vColor = color;
    vTexCoord = texCoord;

    vec3 p = mix(planePosition, spherePosition, moveRatio); // @@@
    gl_Position = mvpMatrix * vec4(p, 1.0);

    gl_PointSize = 4.0;
}
