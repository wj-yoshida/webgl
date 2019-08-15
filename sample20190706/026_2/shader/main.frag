precision mediump float;

varying vec4 vColor;
varying vec3 vPosition;

void main(){
    vec3 c = vec3(vPosition.z);
    gl_FragColor = vec4(1.0 - c, vColor.a);
}
