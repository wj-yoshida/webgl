precision mediump float;
varying vec4 vColor; //varyingは頂点シェーダーから送られてくるもの
void main(){
    gl_FragColor = vColor;
}
