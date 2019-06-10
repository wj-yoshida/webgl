precision mediump float;
varying vec4 vColor; // 頂点シェーダから転送されてきた色
void main(){
    // gl_FragColor に出力する色を指定
    //フラグメントシェーダーは最終的にgl_FragColorに代入する (vec4) reo
    gl_FragColor = vColor;
}
