precision mediump float;
uniform vec4 globalColor;
varying vec3 vColor; // 頂点シェーダから色を受け取る @@@
void main(){
    gl_FragColor = globalColor * vec4(vColor, 1.0);
}

