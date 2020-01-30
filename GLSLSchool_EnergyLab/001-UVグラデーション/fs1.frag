precision highp float;
uniform   vec2   resolution;
uniform   float  time;
varying   vec2   fragCoord;

void main(){
    // スクリーン座標をアスペクト比に対応した-1~1の空間に変換する
    vec2 p = (fragCoord * 2.0 - resolution) / min(resolution.x, resolution.y);
    
    vec3 col = 0.5 + 0.5*cos(time+p.xyx+vec3(0,2,4));
    gl_FragColor = vec4(p, 0.5, 1.0);
}

