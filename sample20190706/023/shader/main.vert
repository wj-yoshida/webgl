attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
uniform mat4 mvpMatrix;
uniform mat4 normalMatrix;
uniform bool edge; // エッジフラグ @@@
varying vec3 vNormal;
varying vec4 vColor;
//頂点シェーダーとフラグメントシェーダーの両方で同じ名前でかつ、同じデータ型で宣言されているuniform変数はどちらからでも利用可能。*edgeのこと
//ただし、floatの様な浮遊少数が絡むデータ型は頂点シェーダとフラグメントで指定されている精度修飾子が異なる場合、共有できない！
//精度修飾子: flagの中, (precision mediump float;の) "mediump"のこと vartだと無条件にhighpになってるので無理


void main(){
    vColor = color;
    vNormal = (normalMatrix * vec4(normal, 0.0)).xyz;
    vec3 p = position;
    if(edge == true){
        // エッジフラグが true の場合は法線方向に頂点をふくらませる @@@
        p += normal * 0.02;
    }
    gl_Position = mvpMatrix * vec4(p, 1.0);
}
