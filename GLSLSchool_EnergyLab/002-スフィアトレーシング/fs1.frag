precision highp float;
uniform   vec2   resolution;
uniform   float  time;
varying   vec2   fragCoord;

// 単純な球の距離関数
float map(vec3 p) {
    return length(p) - 0.5;
}

void main(){
    vec2 p = (fragCoord * 2.0 - resolution) / min(resolution.x, resolution.y);
    
    /////////// 3D空間を撮影するカメラの姿勢を計算する
    // カメラ位置
    vec3 cameraPos = vec3(0.0, 0.0, -5.0);
    // ターゲットの位置
    vec3 targetPos = vec3(0.0, 0.0, 0.0);
    // 正面の方向をカメラ位置からターゲット位置への方向で計算する
    vec3 forward = normalize(targetPos - cameraPos);
    // 右の方向をワールド空間の真上の方向と正面の方向の外積で計算する
    vec3 right   = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
    // 上の方向を正面の方向と右の方向の外積で計算する
    vec3 up      = normalize(cross(forward, right));
    // 各ピクセルを3D空間に配置した時のピクセルまでの方向を、計算した姿勢とスクリーン座標で計算する
    vec3 ray     = normalize(forward * 2.5 + right * p.x + up * p.y);
    //////////////////////////////////////////////////
    
    ////////// スフィアトレーシング
    // スフィアトレーシングで進んだ距離
    float t = 0.01;
    vec3 col = vec3(0.0);
    // 99回距離関数の評価とレイマーチを行う
    for(int i=0; i<99; i++) {
        // 現在のループでのレイの位置は、カメラ位置からピクセル方向へt進んだ位置である
        vec3 pos = cameraPos + ray * t;
        // 距離関数を評価する
        float d = map(pos);
        // 現在のレイの位置がある程度0に近いとき、レイは距離関数に衝突したと判定できる
        if (d < 0.0001) {
            // 衝突した場合は着色をしてループを終える
            col = 1.0 - vec3(float(i) / 99.0);
            break;
        }
        // 衝突しなかったのでレイを進める（レイマーチ）
        t += d;
    }
    ////////////////////////////////
    
    gl_FragColor = vec4(col, 1.0);
}

