attribute vec3 position;
attribute vec3 normal;
uniform mat4 mMatrix;
uniform mat4 mvpMatrix;
varying vec3 vPosition;
varying vec3 vNormal;

void main(){
  //モデル座標変換をわざわざやるのは変換後(オブジェクトが回転とかした後も)のワールド座標で頂点がどこにあるか知るために(視点ベクトルをえるため)
    vPosition = (mMatrix * vec4(position, 1.0)).xyz;
    vNormal = normal;
    gl_Position = mvpMatrix * vec4(position, 1.0);
}
