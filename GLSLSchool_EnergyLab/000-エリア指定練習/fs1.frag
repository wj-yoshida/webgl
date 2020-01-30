precision highp float;
uniform   vec2   resolution;
uniform   float  time;
varying   vec2   fragCoord;
varying   vec2   vTexCoord;
uniform float     timeScale;       // 時間の経過に対するスケール
const float PI = 3.1415926;

void main(){
    
  
    // スクリーン座標をアスペクト比に対応した-1~1の空間に変換する
    vec2 p = (fragCoord * 2.0 - resolution) / min(resolution.x, resolution.y);

    vec3 col = 0.5 + 0.5*cos(time+p.xyx+vec3(0,2,4));
    vec3 re_col = vec3(sin(col.x), cos(col.y), tan(col.z));
    vec3 bk = vec3(0.0, 0.0, 0.0);
    vec3 color3;
    
    // テクスチャ座標からスクリーンの中心を求める
    
    //float t = length(originCenter);//円にマスキング
    
    float u = sin((atan(p.y, p.x) + time * 0.2) * 20.0) * 0.2;
    float t = 0.05 / abs(0.7 + u - length(p));
    
    color3 = mix(col, re_col, step( 0.1 + abs(sin(time*2.0)), t) );
    gl_FragColor = vec4(color3, 1.0);
}
