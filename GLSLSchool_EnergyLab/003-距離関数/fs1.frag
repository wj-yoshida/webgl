precision highp float;
uniform   vec2   resolution;
uniform   float  time;
varying   vec2   fragCoord;

////////// by https://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm
// 球の距離関数
float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

// 円柱の距離関数
float sdCappedCylinder(vec3 p, float r, float h) {
    // xz平面上の円（高さ無限の円柱）の距離関数を評価する
    float d = length(p.xz) - r;
    // 高さhの厚みがある無限平面の距離関数を評価する
	p.y = abs(p.y) - h;
	// 無限円柱と平面の積集合を取る
    return max(d, p.y);
}

// トーラスの距離関数
float sdTorus(vec3 p, float r, float s) {
    // xz平面上の半径sの円の表面からの距離をxとした二次元座標にする
	vec2 q = vec2(length(p.xz) - s, p.y);
	// 新しく作った座標で円の距離関数を評価する
    return length(q) - r;
}
//////////////////////////////////////////////////////////////////////////////////////

float map(vec3 p) {
    // 距離関数を合成してmapを定義する
    // 距離関数で定義したプリミティブを空間に配置する場合は、レイの位置(p)を平行移動やスケールすることで行う
    // オブジェクトの座標ではなくレイの位置に対して変換を欠けるため、操作順や符号が逆になることに注意
    
    // y座標が-1の無限平面を定義
    float plane = p.y + 1.0;
    // 半径が0.5の球を定義
    float sphere = sdSphere(p, 0.5);
    // (-1,0,0)の位置に半径0.5高さ1.0の円柱を定義
    float cylinder = sdCappedCylinder(p - vec3(-1.0, 0.0, 0.0), 0.5, 1.0);
    // (1,0,0)の位置に半径0.1中心からの距離0.5のトーラスを定義
    float torus = sdTorus(p - vec3(1.0, 0.0, 0.0), 0.1, 0.5);
    
    // min関数で全ての距離関数を合成する
    float d = min(sphere, cylinder);
    d = min(d, torus);
    d = min(d, plane);
    return d;
}

void main(){
    vec2 p = (fragCoord * 2.0 - resolution) / min(resolution.x, resolution.y);
    vec3 cameraPos = vec3(3.0, 5.0, -5.0);
    
    vec3 targetPos = vec3(0.0, 0.0, 0.0);
    vec3 forward = normalize(targetPos - cameraPos);
    vec3 right   = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
    vec3 up      = normalize(cross(forward, right));
    vec3 ray     = normalize(forward * 2.5 + right * p.x + up * p.y);
    
    float t = 0.01;
    vec3 col = vec3(0.0);
    for(int i=0; i<99; i++) {
        vec3 pos = cameraPos + ray * t;
        float d = map(pos);
        if (d < 0.0001) {
            col = 1.0 - vec3(float(i) / 99.0);
            break;
        }
        t += d;
    }
    gl_FragColor = vec4(col, 1.0);
}

