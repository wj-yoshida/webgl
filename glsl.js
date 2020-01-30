//x軸で移動 Y軸で光の強さ
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

void main() {
	vec2 st = gl_FragCoord.xy/u_resolution;
	float cl = (sin(st.x*18.5-4.5*(u_mouse.x*0.02))*0.4+0.15 )+(cos(st.y*18.5)*0.4+0.15 *(u_mouse.y*0.01));
	gl_FragColor = vec4(cl,  cl,  cl, 1.0);
}


//x軸で移動 Y軸で移動
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

void main() {
	vec2 st = gl_FragCoord.xy/u_resolution;
	float cl = (sin(st.x*18.5-4.5*(u_mouse.x*0.02))*0.4+0.15 )+(cos(st.y*18.5-(u_mouse.y*0.05))*0.4+0.15 );
	gl_FragColor = vec4(cl,  cl,  cl, 1.0);
}
