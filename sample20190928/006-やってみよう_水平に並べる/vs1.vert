attribute vec3  position;
attribute float ratio; // 0.0 ~ 1.0
void main(){
    // ratio をもとに頂点を横一直線に、画面の左端から右端まで
    // 等間隔できれいに並べることができる？
    // また、画面の外側に頂点がはみ出してしまったりしていないか、
    // どうすれば確かめることができるかも考えてみましょう。
    
    
    gl_Position = vec4(ratio * 2.0 - 1.0, position.yx,  1.0);
    gl_PointSize = 8.0;
}
