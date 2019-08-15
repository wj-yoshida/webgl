attribute vec3 position;
attribute vec4 color;
uniform mat4  mvpMatrix;
uniform float pointSize;
varying vec4 vColor;
varying vec3 vPosition;
uniform vec2  mouse;
uniform float time;
uniform vec3 camera;

vec3 rotate(vec3 p, float angle, vec3 axis){
    vec3 a = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float r = 1.0 - c;
    mat3 m = mat3(
        a.x * a.x * r + c,
        a.y * a.x * r + a.z * s,
        a.z * a.x * r - a.y * s,
        a.x * a.y * r - a.z * s,
        a.y * a.y * r + c,
        a.z * a.y * r + a.x * s,
        a.x * a.z * r + a.y * s,
        a.y * a.z * r - a.x * s,
        a.z * a.z * r + c
    );
    return m * p;
}

void main(){
    vColor = color;
    float pow = distance(vec3(mouse.x, mouse.y, sin(( time * 0.1))), position) * 0.5 ;
    vec3 pos = position;
    float _t = cos(time) * 0.5;
    pos.x = position.x + sin(position.y * 1.2 + ( time + (_t))) * 0.7;
    pos.y = position.y + sin(position.z * 1.2 + ( time + (_t))) * 0.7;
    pos.z = sin(position.y * 1.2  + time) * cos(position.x * 1.2 + time) * 0.4;
    pos = rotate(pos, radians(time * -5.0), vec3(0.0, 0.0, 0.1));
    gl_Position = mvpMatrix * vec4(pos , 1.0);
    vPosition = pos;
    // 頂点のポイントサイズを指定 @@@
    gl_PointSize = pointSize * (3.0 - ( distance(camera,pos) * 0.2) ) * 0.6;
}
