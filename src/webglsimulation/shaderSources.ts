export const vertexShaderShaderSource = `
   precision highp float;
   attribute vec2 a_position;

   uniform vec2 u_pixelSize;
   varying vec2 coords;
   varying vec2 t;
   varying vec2 r;
   varying vec2 b;
   varying vec2 l;

   void main(){
      gl_Position = vec4(a_position, 0.0, 1.0);
      coords = a_position * 0.5 + 0.5;
      t = coords + vec2(0, u_pixelSize.y);
      r = coords + vec2(u_pixelSize.x, 0);
      b = coords - vec2(0, u_pixelSize.y);
      l = coords - vec2(u_pixelSize.x, 0);
   }
`

export const advectShaderSource = `
   precision highp float;
   varying vec2 coords;
    uniform sampler2D u_velocity;
    uniform sampler2D u_x;
    uniform vec2 u_pixelSize;
    uniform vec2 u_targetSize;
    uniform float u_dt;
    uniform float u_decayFactor;

    void main () {
      vec2 coord = (coords - u_dt * texture2D(u_velocity, coords).xy) * u_targetSize;
      vec4 result = texture2D(u_x, coord / u_targetSize);
      float decay = 1.0 + u_decayFactor * u_dt;
      gl_FragColor = (result / decay)-(0.001 * u_decayFactor);
    }
`


export const diffuseShaderSource = `
   precision highp float;
   varying vec2 coords;
   varying vec2 t;
   varying vec2 r;
   varying vec2 b;
   varying vec2 l;

   uniform sampler2D u_x0;
   uniform sampler2D u_x;
   uniform float u_diff;
   uniform float u_dt;

   void main(){
      vec4 c = texture2D(u_x0, coords);
      vec4 tt = texture2D(u_x, t);
      vec4 rr = texture2D(u_x, r);
      vec4 bb = texture2D(u_x, b);
      vec4 ll = texture2D(u_x, l);
      float a = u_diff * u_dt;
      gl_FragColor = (c + a * (tt + rr + bb + ll))/(1.0 + 4.0 * a);
   }
   `

export const divergeanceShaderSource = `
   precision highp float;
   varying vec2 coords;
   varying vec2 t;
   varying vec2 r;
   varying vec2 b;
   varying vec2 l;

   uniform sampler2D u_velocity;
   
   uniform float u_h;

   void main(){
      float ll = texture2D(u_velocity, l).x;
      float rr = texture2D(u_velocity, r).x;
      float tt = texture2D(u_velocity, t).y;
      float bb = texture2D(u_velocity, b).y;
      vec2 center = texture2D(u_velocity, coords).xy;
      if (l.x < 0.0) { ll = -center.x; }
      if (r.x > 1.0) { rr = -center.x; }
      if (t.y > 1.0) { tt = -center.y; }
      if (b.y < 0.0) { bb = -center.y; }
      float div = 0.5 * (rr - ll + tt - bb);
      gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
   }
 `

export const pressureShaderSource = `
   precision highp float;
   varying vec2 coords;
   varying vec2 l;
   varying vec2 r;
   varying vec2 t;
   varying vec2 b;
   uniform sampler2D u_pressure;
   uniform sampler2D u_divergence;
   void main () {
       float ll = texture2D(u_pressure, l).x;
       float rr = texture2D(u_pressure, r).x;
       float tt = texture2D(u_pressure, t).x;
       float bb = texture2D(u_pressure, b).x;
       float center = texture2D(u_pressure, coords).x;
       float divergence = texture2D(u_divergence, coords).x;
       float pressure = (ll + rr + bb + tt - divergence) * 0.25;
       gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
   }
 `



export const gradientSubstractShaderSource = `
   precision highp float;
   varying highp vec2 coords;
   varying highp vec2 l;
   varying highp vec2 r;
   varying highp vec2 t;
   varying highp vec2 b;
   uniform sampler2D u_pressure;
   uniform sampler2D u_velocity;
   void main () {
       float ll = texture2D(u_pressure, l).x;
       float rr = texture2D(u_pressure, r).x;
       float tt = texture2D(u_pressure, t).x;
       float bb = texture2D(u_pressure, b).x;
       vec2 velocity = texture2D(u_velocity, coords).xy;
       velocity.xy -= vec2(rr - ll, tt - bb);
       gl_FragColor = vec4(velocity, 0.0, 1.0);
   }
 `

export const boundaryShaderSource = `
   precision highp float;
   varying vec2 coords;
   uniform sampler2D u_x;
   uniform vec2 u_size;
   uniform float u_scale;
   uniform vec2 u_offset;
   void main(){
      vec2 pos = coords * u_size;
      if(pos.x < u_offset.x){
         gl_FragColor = u_scale * texture2D(u_x, coords + u_offset * vec2(1, 0) / u_size);
         return;
      }
      if(pos.y < u_offset.y){
         gl_FragColor = u_scale * texture2D(u_x, coords + u_offset * vec2(0, 1) / u_size);
         return;
      }
      if(pos.x >= u_size.x - u_offset.x){
         gl_FragColor = u_scale * texture2D(u_x, coords + u_offset * vec2(-1, 0) / u_size);
         return;
      }
      if(pos.y >= u_size.y - u_offset.y){
         gl_FragColor = u_scale * texture2D(u_x, coords + u_offset * vec2(0, -1) / u_size);
         return;
      }
      gl_FragColor = texture2D(u_x, coords);
   }
 `

export const displayShaderSource = `
   precision highp float;
   
   uniform sampler2D u_data;
   varying vec2 coords;

   void main(){
      vec4 pixel = texture2D(u_data, coords);
      float alpha = max(pixel.r, max(pixel.g, pixel.b));
      gl_FragColor = vec4(pixel.rgb, alpha);
   }
   `
export const addDataShaderSource = `
   precision highp float;
      
   uniform sampler2D u_data;
   uniform vec4 u_amount;
   uniform vec2 u_addPoint;
   uniform float u_radius;
   uniform bool u_set;
   varying vec2 coords;

   float clamp(float value){
      return min(1.0, max(0.0, value));
   }

   void main(){
      float dist = sqrt(pow(coords.x - u_addPoint.x, 2.0) + pow(coords.y - u_addPoint.y, 2.0));
      if(dist < u_radius){
         if(u_set){
            gl_FragColor = (texture2D(u_data, coords)*20.0 + u_amount)/21.0;
         }else{
            gl_FragColor = texture2D(u_data, coords) + u_amount;
         }
      }else{
         gl_FragColor = texture2D(u_data, coords);
     }
   }
   `

export const copyShaderSource = `
   precision highp float;
   uniform sampler2D u_data;
   varying vec2 coords;
   void main(){
      gl_FragColor = texture2D(u_data, coords);
   }
   `

export const clearShaderSource = `
   precision highp float;
   varying vec2 coords;

   uniform vec4 u_value;
   uniform vec4 u_constant;
   uniform sampler2D u_data;

   void main(){
      gl_FragColor = u_value * texture2D(u_data, coords) + u_constant;
   }
 `

export const curlShaderSource = `
   precision highp float;
   varying vec2 l;
   varying vec2 r;
   varying vec2 t;
   varying vec2 b;
   uniform sampler2D u_velocity;
   void main () {
       float ll = texture2D(u_velocity, l).y;
       float rr = texture2D(u_velocity, r).y;
       float tt = texture2D(u_velocity, t).x;
       float bb = texture2D(u_velocity, b).x;
       float vorticity = rr - ll + bb - tt;
       gl_FragColor = vec4(vorticity, 0.0, 0.0, 1.0);
   }
`

export const vorticityShaderSource = `
precision highp float;
precision highp sampler2D;
varying vec2 coords;
varying vec2 l;
varying vec2 r;
varying vec2 t;
varying vec2 b;
uniform sampler2D u_velocity;
uniform sampler2D u_curl;
uniform float u_curlForce;
uniform float u_dt;
void main () {
   float ll = texture2D(u_curl, l).x;
   float rr = texture2D(u_curl, r).x;
   float tt = texture2D(u_curl, t).x;
   float bb = texture2D(u_curl, b).x;
   float center = texture2D(u_curl, coords).x;
   vec2 force = 0.5 * vec2(abs(tt) - abs(bb), abs(rr) - abs(ll));
   force /= length(force) + 0.0001;
   force *= u_curlForce * center;
   force.y *= -1.0;
   vec2 velocity = texture2D(u_velocity, coords).xy;
   velocity += force * u_dt;
   velocity = min(max(velocity, -1000.0), 1000.0);
   gl_FragColor = vec4(velocity, 0.0, 1.0);
}
`
export const filterShaderSource = `
precision highp float;
varying vec2 coords;
uniform vec2 u_pixelSize;
uniform sampler2D u_data;
uniform float u_kernel[9];
uniform float u_weight;
void main(){
   vec4 tl = texture2D(u_data, coords + vec2(-u_pixelSize.x, u_pixelSize.y)) * u_kernel[0];
   vec4 t = texture2D(u_data, coords + vec2(0, u_pixelSize.y))* u_kernel[1];
   vec4 tr = texture2D(u_data, coords + vec2(u_pixelSize.x, u_pixelSize.y))* u_kernel[2];
   vec4 l = texture2D(u_data, coords + vec2(-u_pixelSize.x, 0))* u_kernel[3];
   vec4 center = texture2D(u_data, coords)* u_kernel[4];
   vec4 r = texture2D(u_data, coords + vec2(u_pixelSize.x, 0))* u_kernel[5];
   vec4 bl = texture2D(u_data, coords + vec2(-u_pixelSize.x, -u_pixelSize.y))* u_kernel[6];
   vec4 b = texture2D(u_data, coords + vec2(0, -u_pixelSize.y))* u_kernel[7];
   vec4 br = texture2D(u_data, coords + vec2(u_pixelSize.x, -u_pixelSize.y))* u_kernel[8];
   vec4 result = (tl + t + tr + l + center + r + bl + b + br)/u_weight;
   gl_FragColor = result;
}
`
export const bloomLightShaderSource = `
precision highp float;
varying vec2 coords;
uniform sampler2D u_data;

void main(){
   vec3 pixel = texture2D(u_data, coords).xyz;
   float brightness = dot(normalize(pixel), vec3(0.2126, 0.7152, 0.0722));
   gl_FragColor = vec4(pixel * (1.0 + brightness), 1.0) ;
   // if( > .3){
   // }else{
      
   //    gl_FragColor = vec4(0, 0, 0, 1.0) ;
   // }
}`

export const bloomBlendingSource = `
precision highp float;
varying vec2 coords;
uniform sampler2D u_data;
uniform sampler2D u_bloom;
uniform float u_intensity;


void main(){
   const float gamma = 2.2;
   vec3 pixel = texture2D(u_data, coords).rgb;      
    vec3 pixelBloom = texture2D(u_bloom, coords).rgb;
    pixel += (pixelBloom * u_intensity);
    vec3 result = vec3(1.0) - exp(-pixel);  
    result = pow(result, vec3(1.0 / gamma));
   gl_FragColor = vec4(pixel, 1.0);
}

`

// if(brightness > 0.68){
// }else{
//    gl_FragColor =  vec4(0, 0, 0, 1.0);
// }

