precision highp float;
uniform   vec2   resolution;
uniform   float  time;
uniform vec2  mouse;
varying   vec2   fragCoord;
varying   vec2   vTexCoord;
uniform float     timeScale;       // 時間の経過に対するスケール
const float PI = 3.1415926;

void main(){
    
    vec2 m = vec2(mouse.x * 2.0 - 1.0, -mouse.y * 2.0 + 1.0);
    vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
    
    // flower
    float u = sin((atan(p.y, p.x) + time * 0.5) * 20.0) * 0.01;
    
    // ring
    //float t = length(p)
    //float t = 1.0 - length(p);//白黒逆
    float t = 10.0 * abs( length(p) - 0.8  );
    //float t = 0.02 / abs(0.3 - length(p)) * cos(time * 3.0);
    //float t = 0.02 / abs(0.5 - length(p));
    
    
    //float t = 0.01 / abs(0.5 + u - length(p));
    
    vec2 v = vec2(0.0, 1.0);
    float dot_cl = dot(p, v);
    float r_l = 1.0 - length( (gl_FragCoord.xy * 2.0 - resolution) / max(resolution.x, resolution.y)  );
    t = t * r_l ;
   
    gl_FragColor = vec4(vec3(t), 1.0);
}
