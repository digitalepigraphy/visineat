/* V2.7
 * Author(s): Angelos Barmpoutis
 * 
 * Copyright (c) 2016, University of Florida Research Foundation, Inc. 
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain this copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce this
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution. 
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
 
 /**
 * This class creates and controls a canvas element with webGL context. The canvas is initialized inside a given div container and is properly scaled to fit its size. You can easily draw 3D content in a canvas object by implementing accordingly the methods onSetup() and onDraw().<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var canvas=new WebGLCanvas('my_div');<br>
 * canvas.onSetup=function(){...};<br>
 * canvas.onDraw=function(){...};<br>
 * canvas.start();<br></font>
 * @param div A div element or the id of a div element that will hold the webGL canvas.
 */
function WebGLCanvas(div)
{

 this.convert_texture_ctx = null;
 this.resize_texture_canvas = null;
 this.resize_texture_ctx = null;

 this.canvas=document.createElement('canvas');
 this.canvas.style.border='none';
 this.canvas.style.touchAction='none';
 this.canvas.style.position='absolute';
 this.canvas.style.left='0px';
 this.canvas.style.right='0px';
 
 this._keeps_changing=true;
 this._keeps_rendering=false;
 
 if(typeof div=='string')
 {
 	this.div_container=document.getElementById(div);
	this.div_container.appendChild(this.canvas);
 }
 else
 {
	this.div_container=div;
	div.appendChild(this.canvas);
 }
 //Preparing the initial size of the canvas element
 {	
		//make the size of the canvas to be the same as the size of the div (in CSS pixels, not in actual device pixels)
		this.canvas.style.width=Math.floor(div.clientWidth)+'px';
		this.canvas.style.height=Math.floor(div.clientHeight)+'px';
				
		//calculate the rendering size of the corresponding pixels in the device, here we assume realToCSSPixels=1, but WebGLCamera in the first frame will calculate the actual realToCSSPixels
		this.width = Math.floor(this.canvas.clientWidth);//* this.realToCSSPixels);
		this.height = Math.floor(this.canvas.clientHeight);//* this.realToCSSPixels);
		
		//set the size of the image/canvas to be as many as the pixels of the device
		this.canvas.width = this.width;
		this.canvas.height = this.height;
 }
 
  this.gl=null;
  
  if(!this.init()) return;
  
  this.canvas.addEventListener("webglcontextlost", function(event) {
    event.preventDefault();
	window.location='http://digitalepigraphy.github.io/visineat/js/webgl_error.html';
}, false);
   
  this.createHeaders();
  this.progress_bar=null;
  
  this.total_number_of_elements=0;
  this.total_number_of_vertices=0;
  this.total_number_of_objects=0;
  
  this.rendering_mode=0;
  this.render_now=true;
  this.render_now_requested_in_draw=false;
  this.in_draw=false;
  this.camera=new WebGLCamera(this);
  this.roii=new WebGLPicker(this);
  
  this.projectors=new Array(5);
  this.projectors[0]=new WebGLProjector(this);
  this.current_projector=this.projectors[0];
  
  this.background_color=[0,0,0,1];
  
  this.__draw_counter=0;
  
  
  this.start=function(){
  this.bkg=new WebGLBackground(this);
  this.beams=new WebGLBeams(this);
  this.beams.setVisible(false);
  this.watermark=new WebGLWatermark(this);
  this.loading_animation=new WebGLLoadingAnimation(this);  
  this.gl.enable(this.gl.DEPTH_TEST);
  this.gl.blendFunc(this.gl.SRC_ALPHA,this.gl.ONE_MINUS_SRC_ALPHA);
  this.gl.enable(this.gl.BLEND);
  this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
  this.onSetup();
  this.canvas.addEventListener("keydown", this.handleKeyDown, false);
  this.canvas.addEventListener("keyup", this.handleKeyUp, false);
  this.canvas.addEventListener("mousedown", this.handleMouseDown, false);
  this.canvas.addEventListener("mouseup", this.handleMouseUp, false);
  this.canvas.addEventListener("mousemove", this.handleMouseMove, false);
  this.canvas.addEventListener("touchstart", this.handleTouchStart, false);
  this.canvas.addEventListener("touchend", this.handleTouchEnd, false);
  this.canvas.addEventListener("touchcancel", this.handleTouchCancel, false);
  this.canvas.addEventListener("touchleave", this.handleTouchLeave, false);
  this.canvas.addEventListener("touchmove", this.handleTouchMove, false);
  this.canvas.addEventListener('mousewheel',this.handleMouseWheel, false);
  
  //We only need the device to support deviceorientation events. If it does then we remove the devicemotion listener.
  //If it does not we try to generate deviceorientation events from devicemotion data.
  var self=this;
  var handleDeviceMotion=function(e){
	if(self.device_orientation_enabled) 
	{
		window.removeEventListener("devicemotion", handleDeviceMotion);
		return;
	}
		
	var m=Math.sqrt(e.accelerationIncludingGravity.x*e.accelerationIncludingGravity.x+e.accelerationIncludingGravity.y*e.accelerationIncludingGravity.y+e.accelerationIncludingGravity.z*e.accelerationIncludingGravity.z);
	if(m==0)return;
	var rotX=-Math.asin(e.accelerationIncludingGravity.y/m);
	var cosrotX=Math.cos(rotX);
	var rotY=-Math.asin(e.accelerationIncludingGravity.x/(m*cosrotX));
	var evt={alpha:0,beta:-rotX*180/3.14,gamma:rotY*180/3.14,vn:true};
	self.onOrientationChange(evt);
};
  this.handleDeviceMotion=handleDeviceMotion;
  this.device_orientation_enabled=false;
  
  window.addEventListener("devicemotion", handleDeviceMotion, false);
  window.addEventListener("deviceorientation", 
	function(e)
	{
		if(e.gamma==null || e.beta==null) return; 
		if(e.vn==null) self.device_orientation_enabled=true; 
		self.onOrientationChange(e);
	}, false);
  if(!window.navigator.pointerEnabled)this.canvas.onmouseout = this.handleMouseOut;
  //window.oncontextmenu = function (){return false;};//cancel default behaviour on right click 

  this.tick();};
} 

/**
 * Returns the div element that contains the canvas.
 * @return Element The div element that contains the canvas.
 */
WebGLCanvas.prototype.getDiv=function(){return this.div_container;};

/**
 * Returns the canvas element controlled by this WebGLCanvas object.
 * @return Element The canvas element.
 */
WebGLCanvas.prototype.getCanvas=function(){return this.canvas;};

/**
 * Returns the gl context object that corresponds to this canvas element.
 * @return GL The webGL context object.
 */
WebGLCanvas.prototype.getGL=function(){return this.gl;};

/**
 * Returns the WebGLCamera object that controls the projection and model view of this canvas.
 * @return WebGLCamera The WebGLCamera object.
 */
WebGLCanvas.prototype.getCamera=function(){return this.camera;};

WebGLCanvas.prototype.getProjector=function()
{
	return this.current_projector; 
};

/**
 * This method starts the animation/rendering of the canvas. It must be called after defining the onSetup() and onDraw() methods.
 */
WebGLCanvas.prototype.start=function(){};
/**
 * This initially empty method must be specified by the programmer to setup the content of the canvas. It will be called once after the call of the start() method.
 */
WebGLCanvas.prototype.onSetup=function(){};

/**
 * This initially empty method must be specified by the programmer to draw the content of the canvas. It will be called in every frame or when necessary to draw the content of the canvas according to the specified rendering preference.
 */
WebGLCanvas.prototype.onDraw=function(){};
WebGLCanvas.prototype.handleKeys=function(){};
WebGLCanvas.prototype.handleKeyDown=function(event){};
WebGLCanvas.prototype.handleKeyUp=function(event){};
WebGLCanvas.prototype.handleMouseDown=function(event){};
WebGLCanvas.prototype.handleMouseUp=function(event){};
WebGLCanvas.prototype.handleMouseMove=function(event){};
WebGLCanvas.prototype.handleMouseOut=function(event){};
WebGLCanvas.prototype.handleTouchStart=function(event){};
WebGLCanvas.prototype.handleTouchEnd=function(event){};
WebGLCanvas.prototype.handleTouchMove=function(event){};
WebGLCanvas.prototype.handleTouchLeave=function(event){};
WebGLCanvas.prototype.handleTouchCancel=function(event){};
WebGLCanvas.prototype.handleMouseWheel=function(event){};

/**
 * This is a callback function that is called when the orientation of the device changes. It is initially empty.
 * @param e The DeviceOrientationEvent object that describes this event.
 */
WebGLCanvas.prototype.onOrientationChange=function(event){};

/**
 * This is a callback function that is called when the user taps on the canvas. It is initially empty.
 * @param e The WebGLEvent object that describes this event.
 */
WebGLCanvas.prototype.onTap=function(e){};
/**
 * This is a callback function that is called when the user starts touching the canvas. It is initially empty.
 * @param e The WebGLEvent object that describes this event.
 */
WebGLCanvas.prototype.onTouch=function(e){};
/**
 * This is a callback function that is called when the user starts dragging the pointing device (mouse, finger, etc.) on the canvas. It is initially empty.
 * @param e The WebGLEvent object that describes this event.
 */
WebGLCanvas.prototype.onDragStart=function(e){};
/**
 * This is a callback function that is called when the user drags the pointing device (mouse, finger, etc.) on the canvas. It is initially empty.
 * @param e The WebGLEvent object that describes this event.
 */
WebGLCanvas.prototype.onDrag=function(e){};
/**
 * This is a callback function that is called when the user stops dragging the pointing device (mouse, finger, etc.) on the canvas. It is initially empty.
 * @param e The WebGLEvent object that describes this event.
 */
WebGLCanvas.prototype.onDragEnd=function(e){};
/**
 * This is a callback function that is called when the user moves the finger/pointers on the canvas. It is initially empty.
 * @param e The WebGLEvent object that describes this event.
 */
WebGLCanvas.prototype.onMove=function(e){};
/**
 * This is a callback function that is called when the user moves the mouse wheel or performs a similar touch pad action on the canvas. It is initially empty.
 * @param e The event object that describes this "mousewheel" event.
 */
WebGLCanvas.prototype.onScroll=function(e){};
/**
 * Sets the rendering mode to fully render all frames even if there was no change in the displayed content. This rendering mode is computationally more expensive and may show down the website interaction (such as scrolling, selecting text, interacting with forms, etc.).
 */
WebGLCanvas.prototype.renderAllFrames=function(){this.rendering_mode=0;};

/**
 * Sets the rendering mode to render only if necessary. If there is no change in the displayed content the canvas is not redrawn. 
 */
WebGLCanvas.prototype.renderWhenNecessary=function(){this.rendering_mode=1;};

/**
 * Notifies that there was a change in the content and the canvas must be redrawn once. It should be used when the renderWhenNecessary() mode is used.
 */
WebGLCanvas.prototype.renderFrame=function(){this.render_now=true;if(this.in_draw)this.render_now_requested_in_draw=true;};

/**
 * Returns a boolean flag that indicates if canvas is currently rendering the scene for the purposes of the picker and not for the regular visual output of the canvas. It must be used inside your implementation of the WebGLCanvas.onDraw() to change the content if necessary depending on the status of this method.
 * @return boolean A boolean flag that indicates the purpose of the current rendering call.
 */
WebGLCanvas.prototype.renderingPickingMap=function(){return this.roii.draw_rois;};

/**
 * Returns the total number of vertices draw on canvas in this frame.
 * @return int The number of vertices. 
 */
WebGLCanvas.prototype.getNumOfVertices=function(){return this.total_number_of_vertices;};

/**
 * Returns the total number of faces draw on canvas in this frame.
 * @return int The number of faces. 
 */
WebGLCanvas.prototype.getNumOfElements=function(){return this.total_number_of_elements;};

/**
 * Returns the total number of objects draw on canvas in this frame.
 * @return int The number of objects. 
 */
WebGLCanvas.prototype.getNumOfObjects=function(){return this.total_number_of_objects;};

/**
 * Sets the canvas to a regular 2D screen projection mode with vertical FOV: 45 degrees
 */
WebGLCanvas.prototype.useRegularProjector=function()
{
	this.current_projector=this.projectors[0];
	this.camera.setFOV(45);
};

/**
 * Sets the canvas to Oculus head mounted display stereoscopic projection mode. The div container must be fullscreen for best experience.
 */
WebGLCanvas.prototype.useOculusProjector=function()
{
	if(this.projectors[1]==null)
	{
  var proj=new WebGLProjector(this);
  var gl=this.gl;
  
  proj.textureFrameBuffer=gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, proj.textureFrameBuffer);
  proj.textureFrameBuffer.width=1024;
  proj.textureFrameBuffer.height=1024;
  
  proj.bufferTexture=new WebGLTexture(this);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, proj.textureFrameBuffer.width, proj.textureFrameBuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
  proj.depthFrameBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, proj.depthFrameBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, proj.textureFrameBuffer.width, proj.textureFrameBuffer.height);

  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, proj.bufferTexture.texture, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, proj.depthFrameBuffer);

  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  
  proj.black_background=new WebGLObject(this);
  
  proj.black_background.setXYZ([-1.0, -1.0,  0, 1.0, -1.0,  0, 1.0,  1.0,  0, -1.0,  1.0,  0]);
  proj.black_background.setTriangles([0, 1, 2, 0, 2, 3]);
  proj.black_background.setColors([0,0,0,0,0,0,0,0,0,0,0,0]);
  
  var m=mat4.create();
  mat4.identity(m);
  mat4.translate(m,[0,0,-2.4]);
  proj.black_background.getShader().setModelView(m);
  m=mat4.create();
  mat4.perspective(45, 1, 0.1, 100.0, m);
  proj.black_background.getShader().setProjection(m);
  
  
  proj.textureBufferShape=new WebGLObject(this);
  proj.setWidthFactor(0.5);
  var dx=1.0/29;
  var xyz=new Float32Array(30*30*3);
  var uv=new Float32Array(30*30*2);
  var abr=new Float32Array(30*30*2);
  for(var j=0;j<30;j++)
  for(var i=0;i<30;i++)
	{
		xyz[(j*30+i)*3]=i*dx-0.5;
		xyz[(j*30+i)*3+1]=0.5-j*dx;
		xyz[(j*30+i)*3+2]=0;
		uv[(j*30+i)*2]=i*dx;
		uv[(j*30+i)*2+1]=1-j*dx;
	}
  var dist=0;
  var t=0;
  var t2=0;
  for(var j=0;j<30;j++)
  for(var i=0;i<30;i++)
	{
		dist=(xyz[t]*xyz[t]+xyz[t+1]*xyz[t+1])*4;
		xyz[t]/=(1+.05*dist+.04*dist*dist);
		xyz[t+1]/=(1+.05*dist+.04*dist*dist);
		abr[t2]=xyz[t]*(-0.006*2);
		abr[t2+1]=xyz[t+1]*(-0.006*2);
		t+=3;
		t2+=2;
	}
  proj.textureBufferShape.setXYZ(xyz);
  proj.textureBufferShape.setUV(uv);
  proj.textureBufferShape.setData("aAberration",abr,2);
  
  var vertex_shader = [ 
"	uniform mat4 uMVMatrix;			",
"	uniform mat4 uPMatrix;			",
"	uniform mat3 uNMatrix;			",
"attribute vec2 aUV;",
"attribute vec2 aAberration;",
"attribute vec3 aXYZ;",
"varying vec2 vAberration;",
"varying vec2 vUv;",
"",
"void main(void){",
"  gl_Position = uPMatrix * uMVMatrix * vec4(aXYZ, 1.0);",
"  vUv=aUV;",
"  vAberration=aAberration;",
"}"
];

var fragment_shader = [
"precision mediump float;	",
"varying vec2 vUv;",
"varying vec2 vAberration;",
"uniform sampler2D tex;",
"",
"void main() {",
"  gl_FragColor.r = texture2D(tex, vUv+vAberration).r;",
"  gl_FragColor.g = texture2D(tex, vUv).g;",
"  gl_FragColor.b = texture2D(tex, vUv-vAberration).b;",
"  gl_FragColor.a = 1.0;",
"}"
];

 var sh=new WebGLShader(this,vertex_shader,fragment_shader);

 proj.textureBufferShape.setShader(sh);
 
 var shaderProgram=sh.shaderProgram;
 
 sh.setUniform1i("uSampler",0);
     
  var tri=new Uint16Array(29*29*6);
  t=0;
  for(var j=0;j<29;j++)
  for(var i=0;i<29;i++)
	{
		tri[t]=j*30+i+1;
		tri[t+1]=j*30+i;
		tri[t+2]=(j+1)*30+i;
		tri[t+3]=j*30+i+1;
		tri[t+4]=(j+1)*30+i;
		tri[t+5]=(j+1)*30+i+1;
		t+=6;
	}
  proj.textureBufferShape.setTriangles(tri);
  
  proj.textureBufferShape.setTexture(proj.bufferTexture);
  m=mat4.create();
  mat4.identity(m);
  mat4.translate(m,[0,0,-1.20]);
  proj.textureBufferShape.getShader().setModelView(m);
  m=mat4.create();
  mat4.perspective(45, 1, 0.1, 100.0, m);
  proj.textureBufferShape.getShader().setProjection(m);
		
		this.projectors[1]=proj;
	var self=proj;
	proj.draw=function()
	{
		var gl=self.canvas.gl;
		gl.bindFramebuffer(gl.FRAMEBUFFER, self.textureFrameBuffer);
		gl.viewport(0,0, self.textureFrameBuffer.width, self.textureFrameBuffer.height);
	  
	  var n= mat4.create();
	  var cp = mat4.create();
	  
		mat4.identity(n);
		mat4.set(self.canvas.camera.mvMatrix, cp);
		mat4.translate(n,[.0675/2,0,0]);
		mat4.multiply(n,cp,self.canvas.camera.mvMatrix);
		
	  self.canvas._draw();

	  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	  
	  gl.viewport(0, 0, gl.viewportWidth/2, gl.viewportHeight);
	  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	  
	  self.black_background.draw(); 
 
	  self.textureBufferShape.draw();
	  gl.bindTexture(gl.TEXTURE_2D, null);
	  
	  gl.bindFramebuffer(gl.FRAMEBUFFER, self.textureFrameBuffer);
      gl.viewport(0,0, self.textureFrameBuffer.width, self.textureFrameBuffer.height);
	  
	  
		mat4.identity(n);
		mat4.set(self.canvas.camera.mvMatrix, cp);
		mat4.translate(n,[-.0675/2,0,0]);
		mat4.multiply(n,cp,self.canvas.camera.mvMatrix);
	  
	  self.canvas._draw();

	  
	  
	  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	  gl.viewport(gl.viewportWidth/2, 0, gl.viewportWidth/2, gl.viewportHeight);
	  //this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
	  	 
	  self.black_background.draw();
		 
	  self.textureBufferShape.draw();
	  gl.bindTexture(gl.TEXTURE_2D, null);
		
	};
	proj.mapXY=function(x,y)
	{
		if(x<0.5) x=x*2-0.5;
		else x=(x-0.5)*2-0.5;
		y=y-0.5;
		
		var dist=(x*x+y*y)*4;
		dist=(1+.05*dist+.04*dist*dist);
		x=0.5+x*dist;
		y=0.5+y*dist;
		if(x<0)x=0;else if(x>1)x=1;
		if(y<0)y=0;else if(y>1)y=1;
		return [x,y];
	};
	}
	this.current_projector=this.projectors[1];
	this.camera.setFOV(85);
};

/**
 * Sets the canvas to a side-by-side stereoscopic projection mode.
 * @param keepAspectRatio A boolean value that indicates if the full canvas' aspect ratio must be used. If false (which is the default value), the aspect ratio will be modified by dividing the width by 2. For most of 3D TV sets this parameter must be set to true. For bare eye stereoscopic view this parameter must be set to false. 
 * @param crossEyes A boolean value that indicates if the right screen will correspond to the left eye (i.e. crossed eyes). If false (which is the default value), the right screen will correspond to the right eye.
 */
WebGLCanvas.prototype.useSideBySideProjector=function(keepAspectRatio, crossEyes)
{
	if(this.projectors[2]==null)
	{
  var proj=new WebGLProjector(this);
  proj.keepAspectRatio=true;
  proj.crossEyes=false;
  //proj.setWidthFactor(0.5);
  var gl=this.gl;
  
  proj.textureFrameBuffer=gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, proj.textureFrameBuffer);
  proj.textureFrameBuffer.width=1024;
  proj.textureFrameBuffer.height=1024;
  
  proj.bufferTexture=new WebGLTexture(this);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, proj.textureFrameBuffer.width, proj.textureFrameBuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
  proj.depthFrameBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, proj.depthFrameBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, proj.textureFrameBuffer.width, proj.textureFrameBuffer.height);

  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, proj.bufferTexture.texture, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, proj.depthFrameBuffer);

  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
   
  proj.textureBufferShape=new WebGLObject(this);
  proj.textureBufferShape.createRect(1,1,1,1);
  
  proj.textureBufferShape.setTexture(proj.bufferTexture);
  m=mat4.create();
  mat4.identity(m);
  mat4.translate(m,[0,0,-1.20]);
  proj.textureBufferShape.getShader().setModelView(m);
  m=mat4.create();
  mat4.perspective(45, 1, 0.1, 100.0, m);
  proj.textureBufferShape.getShader().setProjection(m);
		
		this.projectors[2]=proj;
	var self=proj;
	proj.draw=function()
	{
		
		var gl=self.canvas.gl;
		gl.bindFramebuffer(gl.FRAMEBUFFER, self.textureFrameBuffer);
		gl.viewport(0,0, self.textureFrameBuffer.width, self.textureFrameBuffer.height);
	  
	  var n= mat4.create();
	  var cp = mat4.create();
	  
	  self.canvas.camera.pushMatrix();
		mat4.identity(n);
		mat4.set(self.canvas.camera.mvMatrix, cp);
		if(self.crossEyes) mat4.translate(n,[-0.0675/2,0,0]);
		else mat4.translate(n,[0.0675/2,0,0]);
		mat4.multiply(n,cp,self.canvas.camera.mvMatrix);
		 
	  self.canvas._draw();
	  self.canvas.camera.popMatrix();
	  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	  
	  gl.viewport(0, 0, gl.viewportWidth/2, gl.viewportHeight);
	  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	  
 
	  self.textureBufferShape.draw();
	  gl.bindTexture(gl.TEXTURE_2D, null);
	  
	  gl.bindFramebuffer(gl.FRAMEBUFFER, self.textureFrameBuffer);
      gl.viewport(0,0, self.textureFrameBuffer.width, self.textureFrameBuffer.height);
	  
	  
	  self.canvas.camera.pushMatrix();
		mat4.identity(n);
		mat4.set(self.canvas.camera.mvMatrix, cp);
		if(self.crossEyes) mat4.translate(n,[0.0675/2,0,0]);
		else mat4.translate(n,[-0.0675/2,0,0]);
		mat4.multiply(n,cp,self.canvas.camera.mvMatrix);
	    
	  self.canvas._draw();
	  self.canvas.camera.popMatrix();
	  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	  
	  gl.viewport(gl.viewportWidth/2, 0, gl.viewportWidth/2, gl.viewportHeight);	 
		 	 
	  self.textureBufferShape.draw();
	  gl.bindTexture(gl.TEXTURE_2D, null);
		
	};
	proj.mapXY=function(x,y)
	{
		if(x<0.5) return [x*2,y];
		else return [(x-0.5)*2,y];
	};
	}
	this.current_projector=this.projectors[2];
	if(typeof keepAspectRatio!=='undefined')
	{
		if(keepAspectRatio)
			this.current_projector.setWidthFactor(1);
		else this.current_projector.setWidthFactor(0.5);
		this.current_projector.keepAspectRatio=keepAspectRatio;
	}
	else
	{
		this.current_projector.setWidthFactor(0.5);
		this.current_projector.keepAspectRatio=false;
	}
	if(typeof crossEyes!=='undefined') this.current_projector.crossEyes=crossEyes;
	this.camera.setFOV(45);
};

WebGLCanvas.prototype.usePolygonalPanoramaProjector=function(hfov,nproj)
{
	if(this.projectors[4]==null)
	{
  var proj=new WebGLProjector(this);
  proj.hfov=hfov;
  proj.nproj=nproj;
	
	this.projectors[4]=proj;
	var self=proj;
	proj.draw=function()
	{
		var gl=self.canvas.gl;
		self.canvas.camera.setFOV(Math.atan(Math.tan((3.1415/180)* self.hfov/2)*gl.viewportHeight/(gl.viewportWidth/self.nproj))*2*180/3.1415);
	  
		var n= mat4.create();
		var cp = mat4.create();
		mat4.set(self.canvas.camera.mvMatrix, cp);
	  
		for(var i=0;i<self.nproj;i++)
		{
		
	  gl.viewport(Math.round(i*gl.viewportWidth/self.nproj), 0, Math.round((i+1)*gl.viewportWidth/self.nproj)-Math.round(i*gl.viewportWidth/self.nproj), gl.viewportHeight);
	  if(i==0)gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	 
	  
	  self.canvas.camera.pushMatrix();
		mat4.identity(n);
		mat4.rotate(n,(i-(self.nproj-1)/2)*(3.1415*self.hfov/180),[0,1,0]);
		mat4.multiply(n,cp,self.canvas.camera.mvMatrix);
		 
	  self.canvas._draw();
	  self.canvas.camera.popMatrix();
	  }		
	  
	};
	proj.mapXY=function(x,y)
	{
		return [x,y];
	};
	}
	this.current_projector=this.projectors[4];
	this.current_projector.setWidthFactor(1/this.current_projector.nproj);
	this.camera.setFOV(45);//this will be updated on every frame
};

/**
 * Sets the canvas to Red/Cyan stereoscopic projection mode. Red/Cyan glasses must be worn for experiencing the content in 3D.
 */
WebGLCanvas.prototype.useRedCyanProjector=function()
{
	if(this.projectors[3]==null)
	{
  var proj=new WebGLProjector(this);
  var gl=this.gl;
  
  proj.textureFrameBuffer=gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, proj.textureFrameBuffer);
  proj.textureFrameBuffer.width=1024;
  proj.textureFrameBuffer.height=1024;
  
  proj.bufferTexture=new WebGLTexture(this);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, proj.textureFrameBuffer.width, proj.textureFrameBuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  
  proj.depthFrameBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, proj.depthFrameBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, proj.textureFrameBuffer.width, proj.textureFrameBuffer.height);

  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, proj.bufferTexture.texture, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, proj.depthFrameBuffer);

  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
   
  proj.textureBufferShape=new WebGLObject(this);
  proj.textureBufferShape.createRect(1,1,1,1);
  
  proj.textureBufferShape.setTexture(proj.bufferTexture);
  m=mat4.create();
  mat4.identity(m);
  mat4.translate(m,[0,0,-1.20]);
  proj.textureBufferShape.getShader().setModelView(m);
  m=mat4.create();
  mat4.perspective(45, 1, 0.1, 100.0, m);
  proj.textureBufferShape.getShader().setProjection(m);
		
		this.projectors[3]=proj;
	var self=proj;
	proj.draw=function()
	{
		var gl=self.canvas.gl;
		gl.bindFramebuffer(gl.FRAMEBUFFER, self.textureFrameBuffer);
		gl.viewport(0,0, self.textureFrameBuffer.width, self.textureFrameBuffer.height);
	  
	  var n= mat4.create();
	  var cp = mat4.create();
	  
		mat4.identity(n);
		mat4.set(self.canvas.camera.mvMatrix, cp);
		mat4.translate(n,[.0675/2,0,0]);
		mat4.multiply(n,cp,self.canvas.camera.mvMatrix);
		
	  self.canvas._draw();

	  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	  
	  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	  
	  gl.colorMask(false, true, true, true);
	  gl.disable(gl.DEPTH_TEST);	 	
	  self.textureBufferShape.draw();
	  gl.enable(gl.DEPTH_TEST);	 	 
	
	  gl.bindTexture(gl.TEXTURE_2D, null);
	   gl.colorMask(true, true, true, true);
	
	  gl.bindFramebuffer(gl.FRAMEBUFFER, self.textureFrameBuffer);
      gl.viewport(0,0, self.textureFrameBuffer.width, self.textureFrameBuffer.height);
	  
	  
		mat4.identity(n);
		mat4.set(self.canvas.camera.mvMatrix, cp);
		mat4.translate(n,[-.0675/2,0,0]);
		mat4.multiply(n,cp,self.canvas.camera.mvMatrix);
	  
	  self.canvas._draw();
  	  
	  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	  //this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
	  gl.colorMask(true, false, false, true);
	gl.disable(gl.DEPTH_TEST);	 	 
	  self.textureBufferShape.draw();
	  gl.enable(gl.DEPTH_TEST);	 	 
	
	  gl.bindTexture(gl.TEXTURE_2D, null);
	 gl.colorMask(true, true, true, true);
	};
	}
	this.current_projector=this.projectors[3];
	this.camera.setFOV(45);
};

function ThumbnailMaker(canvas)
{
	this.canvas=canvas;
	this.camera=this.canvas.getCamera();
	var gl=this.canvas.getGL();
	
	this.textureFrameBuffer=gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.textureFrameBuffer);
	this.textureFrameBuffer.width=256;
	this.textureFrameBuffer.height=256;
	this.data=new Uint8Array(256*256*4);
  
	this.bufferTexture=new WebGLTexture(this.canvas);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureFrameBuffer.width, this.textureFrameBuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  
	this.depthFrameBuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthFrameBuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.textureFrameBuffer.width, this.textureFrameBuffer.height);

	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.bufferTexture.texture, 0);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthFrameBuffer);

	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
   
	this.proj=mat4.create();
	mat4.perspective(45, 1, 0.1, 100.0, this.proj); 
}

ThumbnailMaker.prototype.make=function(obj,id)
{
	var gl=this.canvas.gl;
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.textureFrameBuffer);
	gl.viewport(0,0, this.textureFrameBuffer.width, this.textureFrameBuffer.height);
  
	this.camera.notifyProjectionChanged();
	this.camera.pMatrix=this.proj;
	
	this.camera.pushMatrix();
	this.camera.identity();
	this.camera.translate([0,0,-2]);
	gl.clearColor(0,0,0,0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);	
	obj.setDrawBoundingBox(false);
	obj.draw();
	this.camera.popMatrix();

	gl.readPixels(0,0,this.textureFrameBuffer.width,this.textureFrameBuffer.height,gl.RGBA,gl.UNSIGNED_BYTE,this.data);
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.bindTexture(gl.TEXTURE_2D, null);
	
	gl.clearColor(this.canvas.background_color[0],this.canvas.background_color[1],this.canvas.background_color[2],this.canvas.background_color[3]);
	this.camera.notifyProjectionChanged();
  
	this.upload(id);
};

ThumbnailMaker.prototype.upload=function(id)
{
	var boundary="visineat-----------------------" + (new Date).getTime();
	var CRLF = "\r\n";
	var SEPARATOR="--"+boundary+CRLF;
	var END="--"+boundary+"--"+CRLF;
	
	var message=SEPARATOR+'Content-Disposition: form-data; name="'+"field"+'"'+CRLF+CRLF+"value"+CRLF;
		message+=SEPARATOR+'Content-Disposition: form-data; name="file"; filename="'+id+'"'+CRLF;
		message+="Content-Type: application/octet-stream"+CRLF+CRLF;
		//data
	var	message2=CRLF+END;
	
	var xmlhttp=new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {if (xmlhttp.readyState === 4) {}};
	xmlhttp.open("POST", "https://digitalepigraphy.github.io/visineat/do/thmb/", true);
	xmlhttp.setRequestHeader("Content-Type", "multipart/form-data; boundary=" + boundary);
	
	var ui8a=new Uint8Array(message.length+this.data.length+message2.length);
	for (var i = message.length-1; i>=0 ; i--) ui8a[i] = (message.charCodeAt(i) & 0xff);
	ui8a.set(this.data,message.length);
	var offset=message.length+this.data.length;
	for (var i = message2.length-1; i>=0 ; i--) ui8a[i+offset] = (message2.charCodeAt(i) & 0xff);
    xmlhttp.send(ui8a);
 
};


/**
 * Sets the background color of the canvas.
 * @param r The red channel's intensity given as a real number in the range [0-1].
 * @param g The green channel's intensity given as a real number in the range [0-1].
 * @param b The blue channel's intensity given as a real number in the range [0-1].
 * @param a The alpha channel's intensity given as a real number in the range [0-1].
 */
WebGLCanvas.prototype.setBackgroundColor=function(r,g,b,a)
{
	var w=1;
	if(typeof a!=='undefined') w=a;
	this.background_color=[r,g,b,w];
	this.gl.clearColor(r,g,b,w);
	this.bkg.setColor(r,g,b,w);
};

/**
 * Draws a vertical gradient background (brighter on the top and darker on the bottom) using the pre-specified color.
 */
WebGLCanvas.prototype.drawBackground=function()
{
	this.bkg.draw();
};

/**
 * Creates two headers for title and subtitle on the top left corner of the canvas. These headers can be used to superimpose text that describes the content shown on the canvas. 
 */
WebGLCanvas.prototype.createHeaders=function()
{
	var div=document.createElement('div');
	div.style.position='absolute';
	div.style.right='0px';
	div.style.height='60px';
	div.style.left='0px';
	div.style.top='0px';
	div.style.background='linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0))';
	div.style.opacity='0';
	div.style.pointerEvents='none';
	this.div_container.appendChild(div);
	this.header_div=div;
	
	div=document.createElement('div');
	div.style.position='absolute';
	div.style.right='0px';
	div.style.height='30px';
	div.style.left='0px';
	div.style.top='0px';
	div.innerHTML='[ Add here a title ]';
	div.style.color='rgb(255,255,255)';
	div.style.fontFamily='Arial';
	div.style.paddingLeft='5px';
	div.style.paddingTop='5px';
	div.style.weight='bold';
	div.style.fontSize='20px';
	div.style.overflow='hidden';
	div.style.pointerEvents='none';
	this.header_div.appendChild(div);
	this.header1_div=div;
	
	
	div=document.createElement('div');
	div.style.position='absolute';
	div.style.right='0px';
	div.style.height='20px';
	div.style.left='0px';
	div.style.top='25px';
	div.innerHTML='[ Add here a sub-title ]';
	div.style.color='rgb(255,255,255)';
	div.style.fontFamily='Arial';
	div.style.paddingLeft='5px';
	div.style.paddingTop='5px';
	div.style.weight='bold';
	div.style.fontSize='16px';
	div.style.overflow='hidden';
	div.style.pointerEvents='none';
	this.header_div.appendChild(div);
	this.header2_div=div;	
};

/**
 * Sets the opacity of the titles. Must be used after the initialization of the headers using createHeaders(). The default value is 0 (fully transparent).
 * @param opacity A real number in the range [0-1] that indicates the desired level of opacity. 
 */
WebGLCanvas.prototype.setTitleOpacity=function(opacity)
{
	this.header_div.style.opacity=opacity;
};
/**
 * Sets the text of the title. Must be used after the initialization of the headers using createHeaders(). 
 * @param text A string with the text.
 */
WebGLCanvas.prototype.setTitle=function(text)
{
	this.header1_div.innerHTML=text;
};
/**
 * Sets the text of the second title (sub-title). Must be used after the initialization of the headers using createHeaders(). 
 * @param text A string with the text.
 */
WebGLCanvas.prototype.setSubTitle=function(text)
{
	this.header2_div.innerHTML=text;
};

//This function will run only once and at the end will revalidate the canvas in order to be resized properly.
WebGLCanvas.prototype._draw=function()
{
	this.total_number_of_elements=0;
	this.total_number_of_vertices=0;
	this.total_number_of_objects=0;
	this.in_draw=true;
	this.camera.pushMatrix();
	this.onDraw();
	this.camera.popMatrix();
	this.beams.draw();
	this.loading_animation.draw();
    this.watermark.draw();
	this.in_draw=false;
	
	this.camera.revalidate();
	this.__draw_counter+=1;
	
	if(this.__draw_counter>4)
		this._draw=this.__draw;
};

WebGLCanvas.prototype.__draw=function()
{
	this.total_number_of_elements=0;
	this.total_number_of_vertices=0;
	this.total_number_of_objects=0;
	this.in_draw=true;
	this.camera.pushMatrix();
	this.onDraw();
	this.camera.popMatrix();
	this.beams.draw();
	this.loading_animation.draw();
    this.watermark.draw();
	this.in_draw=false;
};

window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         function(callback, element) { window.setTimeout(callback, 1000/60);};
})();

WebGLCanvas.prototype.updatePickingMap=function(){this.roii.project();};
/**
* Returns the object displayed at the given pixel on the canvas.
* @param x The x-coordinate of the pixel. The left-most pixel on the canvas has x-coordinate=0.
* @param y The y-coordinate of the pixel. The top-most pixel on the canvas has y-coordinate=0.
* @return WebGLObject The WebGLObject that corresponds to the given pixel, or null if there is no object rendered at that pixel.
*/
WebGLCanvas.prototype.getObjectAt=function(x,y){return this.roii.getObjectAt(x,y);};
/**
* Returns the depth value at the given pixel on the canvas. The depth is a non-negative number.
* @param x The x-coordinate of the pixel. The left-most pixel on the canvas has x-coordinate=0.
* @param y The y-coordinate of the pixel. The top-most pixel on the canvas has y-coordinate=0.
* @return float The depth value that corresponds to the given pixel, or 0 if there is no object rendered at that pixel.
*/
WebGLCanvas.prototype.getDepthAt=function(x,y){return this.roii.getDepthAt(x,y);};

/**
* Returns the transformed 3D coordinates at the given pixel on the canvas. The returned coordinates have been transformed by the model view matrix and the returned z-coordinate equals to -getDepthAt(x,y).
* @param x The x-coordinate of the pixel. The left-most pixel on the canvas has x-coordinate=0.
* @param y The y-coordinate of the pixel. The top-most pixel on the canvas has y-coordinate=0.
* @return Array An array of size 3 with the x, y, and z(=-depth) coordinate of the given pixel.
*/
WebGLCanvas.prototype.getXYDepthAt=function(x,y){return this.roii.getXYDepthAt(x,y);};

/**
* Returns the 3D coordinates at the given pixel on the canvas.
* @param x The x-coordinate of the pixel. The left-most pixel on the canvas has x-coordinate=0.
* @param y The y-coordinate of the pixel. The top-most pixel on the canvas has y-coordinate=0.
* @return Array An array of size 3 with the x, y, and z coordinate of the given pixel.
*/
WebGLCanvas.prototype.getXYZAt=function(x,y){return this.roii.getXYZAt(x,y);};

WebGLCanvas.prototype.tick=function()
{
	var self=this;
	requestAnimFrame(function(){self.tick();});
    this.handleKeys();
    this.camera.beginDraw();
	
	if(this.camera._view_changed || this.camera._projection_changed)
	{
		this._keeps_changing=true;
		if(this.camera._updatePickingMap_now)
		{
			this.roii.project();
			this.camera._updatePickingMap_now=false;
		}
	}
	else
	{
		//if(this._keeps_changing)c.println(this._keeps_changing +" "+ this.camera.mouse_pressed);
		if(this._keeps_changing && !this.camera.mouse_pressed)
		{
			this.roii.project();
			this._keeps_changing=false;
		}
	}
    if(this.rendering_mode==0 || (this.rendering_mode==1 && (this.camera._view_changed || this.render_now || this.camera._projection_changed || this.camera._light_changed)))
    {
		this._keeps_rendering=true;
		this.current_projector.draw();
		this.camera.endDraw();
		if(!this.render_now_requested_in_draw)
			this.render_now=false;
		else this.render_now_requested_in_draw=false;
    }
	else this._keeps_rendering=false;
};

WebGLCanvas.prototype.init=function()
{
	console.log('%cVisiNeat - Open 3D Data Toolbox', 'padding:28px 82px;line-height:90px;color:rgb(255,255,255);background-color:rgb(120,120,120);text-shadow: 0.5px 1px 0 #888, 1px 2px 0 #898989, 1.5px 3px 0 #777, 2px 4px 0 #797979, 2.5px 5px 0 #666, 0 6px 1px rgba(0,0,0,.1), 0 0 5px rgba(0,0,0,.1), 0 1px 3px rgba(0,0,0,.3), 0 3px 5px rgba(0,0,0,.2), 0 5px 10px rgba(0,0,0,.25), 0 10px 10px rgba(0,0,0,.2), 0 20px 20px rgba(0,0,0,.15);font-size: 40px;');
	console.log('%cVisiNeat - Share your 3D world','padding:28px 46px;font-size: 18px;');
   
        try {
            this.gl = this.canvas.getContext("experimental-webgl",{antialias:false});
            this.gl.viewportWidth = this.canvas.width;
            this.gl.viewportHeight = this.canvas.height;
			//log(this.gl.getParameter(this.gl.SAMPLES));
        } catch (e) {
        }
        if (!this.gl) {
			this.showWebGLError();
			return false;
        }
		else return true;
};

WebGLCanvas.prototype.showWebGLError=function()
{
	if (this.canvas.getContext) {
		this.canvas.style.width=this.canvas.parentElement.clientWidth+'px';
		this.canvas.style.height=this.canvas.parentElement.clientHeight+'px';
		
		this.canvas.width=this.canvas.clientWidth;
		this.canvas.height=this.canvas.clientHeight;
		
              var ctx=this.canvas.getContext("2d");
		var imageObj = new Image();
		imageObj.crossOrigin = '';
		var cnvs=this.canvas;
	      imageObj.onload = function() {
	        ctx.drawImage(imageObj, 0, 0, cnvs.width, cnvs.height);
		    cnvs.addEventListener('click', function() { window.open("https://digitalepigraphy.github.io/visineat/js/webgl_error.html");}, false);
      		};
      		imageObj.src = (('https:' == document.location.protocol) ? 'https:' : 'http:')+'//digitalepigraphy.github.io/visineat/js/img/webgl_error-1.0.png';
			}
			else
			{
				var e=document.getElementById('error-message');
				e.innerHTML='<a href="https://digitalepigraphy.github.io/visineat/js/webgl_error.html" target="_blank"><img src="https://digitalepigraphy.github.io/visineat/js/img/webgl_error-1.0.png" width="'+cnvs.width+'" height="'+cnvs.height+'"/></a>';
			}
};

/**
 * Shows or hides the beams that portray the current lighting direction. The default value is false.
 * $param flag A boolean that indicates the desired status.
 */
WebGLCanvas.prototype.showBeams=function(flag)
{
	this.beams.setVisible(flag);
};

/**
 * Stops/Starts the VisiNeat loading animation. The default loading status is true and shows the animation. It should be called when all your assets have been loaded.
 * $param flag A boolean that indicates the desired status.
 */
WebGLCanvas.prototype.setLoadingStatus=function(flag)
{
	this.loading_animation.hide=!flag;
};

/**
 * Creates a progress bar on the top border of the canvas that shows the loading progress while loading your assets.  
 */
WebGLCanvas.prototype.createProgressBar=function()
{
	this.progress_bar=new ProgressBar(this.div_container,3);
}

WebGLCanvas.prototype.setProgress=function(value)
{
	if(this.progress_bar!=null) this.progress_bar.setProgress(value);
};

WebGLCanvas.prototype.setMaximumProgress=function(value)
{
	if(this.progress_bar!=null)this.progress_bar.setMaximumProgess(value);
};

/**
 * Adds one more task to be completed in the progress bar. It should be used after the initialization of the progress bar using the createProgressBar().  
 */
WebGLCanvas.prototype.oneMoreToDo=function()
{
	if(this.progress_bar!=null)this.progress_bar.oneMoreToDo();
};

/**
 * Indicates that one task has been completed in the progress bar. It should be used after the initialization of the progress bar using the createProgressBar().  
 */
WebGLCanvas.prototype.oneMoreDone=function()
{
	if(this.progress_bar!=null)this.progress_bar.oneMoreDone();
};
 
function WebGLPicker(canvas)
{
	this.canvas=canvas;
	this.camera=this.canvas.getCamera();
	
	this.next_roi_id=[1,0,0];
	this.rois=new Array();
	this.drawn_rois=new Array();
	this.draw_rois=false;
	this.initialized=false;
	
	this.inverse_mat=mat4.create();
	
	this.width=512;
	this.height=512;
	
	this.shader=null;
}

WebGLPicker.prototype.getIDAt=function(x,y)
{
	var x_=x/this.canvas.getCamera().getWidth();
	var y_=y/this.canvas.getCamera().getHeight();
	var xy=this.canvas.current_projector.mapXY(x_,y_);
	var i=4*(Math.floor(this.width*xy[0])+this.width*Math.floor(this.height*(1-xy[1])));
	return this.id_data[i]+256*(this.id_data[i+1]+256*this.id_data[i+2]);
};

WebGLPicker.prototype.getObjectAt=function(x,y)
{
	var x_=x/this.canvas.getCamera().getWidth();
	var y_=y/this.canvas.getCamera().getHeight();
	var xy=this.canvas.current_projector.mapXY(x_,y_);
	var i=4*(Math.floor(this.width*xy[0])+this.width*Math.floor(this.height*(1-xy[1])));
	var id=this.id_data[i]+256*(this.id_data[i+1]+256*this.id_data[i+2]);
	if(id>0) return this.rois[id].parent_object;
	else return null;
};

WebGLPicker.prototype.getDepthAt=function(x,y)
{

	var x_=x/this.canvas.getCamera().getWidth();
	var y_=y/this.canvas.getCamera().getHeight();
	var xy=this.canvas.current_projector.mapXY(x_,y_);
	var i=4*(Math.floor(this.width*xy[0])+this.width*Math.floor(this.height*(1-xy[1])));
	return ((this.depth_data[i]+256*(this.depth_data[i+1]+256*this.depth_data[i+2]))/65536)-10;
};

WebGLPicker.prototype.getXYDepthAt=function(x,y)
{
	var ret=[0,0,0];
	var cam=this.canvas.getCamera();
	var x_=x/cam.getWidth();
	var y_=y/cam.getHeight();
	var xy=this.canvas.current_projector.mapXY(x_,y_);
	var i=4*(Math.floor(this.width*xy[0])+this.width*Math.floor(this.height*(1-xy[1])));
	ret[2]=-(((this.depth_data[i]+256*(this.depth_data[i+1]+256*this.depth_data[i+2]))/65536)-10);
	
	ret[0]=((1-xy[0]*2)*cam.getAspectRatio()*this.canvas.current_projector.getWidthFactor()+cam.viewer_projection_x/cam.screen_height2)*ret[2]/cam.getFocalLength();
	ret[1]=(xy[1]*2-1+cam.viewer_projection_y/cam.screen_height2)*ret[2]/cam.getFocalLength();
	return ret;
};

WebGLPicker.prototype.getXYZAt=function(x,y)
{
	var xyz=this.getXYDepthAt(x,y);
	mat4.inverse(this.canvas.getCamera().mvMatrix,this.inverse_mat);
	var cc=[0,0,0,1];
	mat4.multiplyVec4(this.inverse_mat,[xyz[0],xyz[1],xyz[2],1],cc);
	//c.println(x+' '+y+' '+xyz[0]+' '+xyz[1]+' '+xyz[2]+' '+cc[0]+' '+cc[1]+' '+cc[2]);
	return cc;
};

WebGLPicker.prototype.initializeID=function()
{
	this.id_shader=new WebGLShader(this.canvas, 0);
	var gl=this.canvas.getGL();
	this.idFrameBuffer=gl.createFramebuffer();
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.idFrameBuffer);
	this.id_data=new Uint8Array(this.width*this.height*4);
  
	this.bufferTexture=new WebGLTexture(this.canvas);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  
	var renderBuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);

	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.bufferTexture.texture, 0);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);

	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	this.initialized=true;
};

WebGLPicker.prototype.initializeDepth=function()
{
   var vs=[
   "uniform mat4 uMVMatrix;",
	"uniform mat4 uPMatrix;",
	"attribute vec3 aXYZ;",
	"varying vec4 vColor;",
	"void main(void){",
	"vec4 p=uMVMatrix*vec4(aXYZ,1.0);",
    "gl_Position=uPMatrix*p;",
	"float d=floor((10.0-p.z)*256.0*256.0);",//we account also for points projected 10 units on the back of the camera (positive side)
	"float v=floor(d/256.0);",
	"float r=d-v*256.0;",
	"d=v;",
	"v=floor(d/256.0);",
	"float g=d-v*256.0;",
	"d=v;",
	"v=floor(d/256.0);",
	"float b=d-v*256.0;",
	"vColor=vec4(r/255.0,g/255.0,b/255.0,1);",
	"}"];
	
	var fs=[
	"precision mediump float;",
	"varying vec4 vColor;",
	"void main(void){",
	"gl_FragColor=vColor;",
	"}"];
	
	this.depth_shader=new WebGLShader(this.canvas, vs,fs);
	var gl=this.canvas.getGL();
	
	this.depthFrameBuffer=gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthFrameBuffer);
	this.depth_data=new Uint8Array(this.width*this.height*4);
  
	this.bufferTexture=new WebGLTexture(this.canvas);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  
	var renderBuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);

	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.bufferTexture.texture, 0);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);

	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	this.initialized=true;
};

WebGLPicker.prototype.addROI=function(roi)
{
	if(!this.initialized)
	{
		this.initializeID();
		this.initializeDepth();
	}
	roi.color_id[0]=this.next_roi_id[0]/255;
	roi.color_id[1]=this.next_roi_id[1]/255;
	roi.color_id[2]=this.next_roi_id[2]/255;
	
	this.rois[this.next_roi_id[0]+256*this.next_roi_id[1]+256*256*this.next_roi_id[2]]=roi;
	
	this.next_roi_id[0]+=1;
	if(this.next_roi_id[0]>255)
	{
		this.next_roi_id[0]=0;
		this.next_roi_id[1]+=1;
		if(this.next_roi_id[1]>255)
		{
			this.next_roi_id[1]=0;
			this.next_roi_id[2]+=1;
		}
	}
};

WebGLPicker.prototype.project=function()
{
	//console.log('pr start');
	this.projectID();
	this.projectDepth();
	//console.log('pr end');
};

WebGLPicker.prototype.projectID=function()
{
	var gl=this.canvas.gl;
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.idFrameBuffer);
	gl.viewport(0,0, this.width, this.height);
  
	this.camera.pushMatrix();
	this.shader=this.id_shader;
	this.shader.updateProjection();
	this.shader.updateModelView();
	
	gl.clearColor(0,0,0,0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);	
	this.draw_rois=true;
	
	this.canvas.onDraw();
	
	this.draw_rois=false;
		
	this.camera.popMatrix();

	gl.readPixels(0,0,this.width,this.height,gl.RGBA,gl.UNSIGNED_BYTE,this.id_data);
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.bindTexture(gl.TEXTURE_2D, null);
	
	gl.clearColor(this.canvas.background_color[0],this.canvas.background_color[1],this.canvas.background_color[2],this.canvas.background_color[3]);
};
 
WebGLPicker.prototype.projectDepth=function()
{
	var gl=this.canvas.gl;
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthFrameBuffer);
	gl.viewport(0,0, this.width, this.height);
  
	this.camera.pushMatrix();
	this.shader=this.depth_shader;
	this.shader.updateProjection();
	this.shader.updateModelView();
	
	gl.clearColor(0,0,0,0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);	
	this.draw_rois=true;
		
	this.canvas.onDraw();
	
	this.draw_rois=false;
		
	this.camera.popMatrix();

	gl.readPixels(0,0,this.width,this.height,gl.RGBA,gl.UNSIGNED_BYTE,this.depth_data);
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.bindTexture(gl.TEXTURE_2D, null);
	
	gl.clearColor(this.canvas.background_color[0],this.canvas.background_color[1],this.canvas.background_color[2],this.canvas.background_color[3]);
};
 
function WebGLPickingTarget(picker)
{
	this.picker=picker;
	this.canvas=picker.canvas;
	this.color_id=[0,0,0,1];
	this.obj=new WebGLObject(this.canvas,true);
	this.parent_object=null;
	this.canvas.roii.addROI(this);
}

WebGLPickingTarget.prototype.object=function(obj)
{
	this.parent_object=obj;
	var self=this;
	this.project=this._project_obj;
};

WebGLPickingTarget.prototype.quad=function(xyz)
{
	if(xyz.length!=12) return;
	this.obj.setXYZ(xyz);
	this.obj.setTriangles([1,0,3,1,3,2]);
	this.project=this._project;
};

WebGLPickingTarget.prototype._project_obj=function()
{
	if(this.parent_object.buffers["aXYZ"])
	{
		this.obj.sameXYZ(this.parent_object);
		this.obj.sameTriangles(this.parent_object);
		this.project=this._project;
		this.project();
	}
};

WebGLPickingTarget.prototype._project=function()
{
	this.picker.shader.setColorMask(this.color_id);
	this.obj.draw();
};

WebGLPickingTarget.prototype.project=function(){};
 
 /**
 * This class creates and renders a 3D object on a webGL canvas. You can easily create a 3D object by providing its vertices, faces, normal vectors, texture coordinates etc.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var object=new WebGLObject(my_canvas);<br>
 * object.setXYZ([0.4, 0.23, 1.2 ...]);<br>
 * object.setTriangles([0, 1, 2 ...]);<br></font>
 * @param gl_canvas A WebGLCanvas object.
 * @param is_roi An optional argument that indicates a special system use of this object. The default value is false. If the second argument is provided must be always false.
 */
function WebGLObject(gl_canvas,is_roi) //Constructor
{
	this.gl=gl_canvas.gl;
	this.canvas=gl_canvas;
    this.fid=0;
    this.filename="";
	this.corners=null;
	this.projectedCorners=null;
	this.num_of_corners=0;
	this.enable_picking=true;
	
	this.buffers={};//aXYZ,aNormal,aUV,aColor
	this.indices={};//Triangles,Lines,Points
	this.current_index=null;

	this._shader=null;
	this.texture=null;
	if(typeof is_roi!=="undefined" && is_roi==true)
	{
		this.is_roi=true;
	}
	else
	{
		this.is_roi=false;
		this.roi=new WebGLPickingTarget(gl_canvas.roii);
		this.roi.object(this);
	}
}

/**
 * Enables/disables the ability to pick/interact with this object. Picking is initially enabled for all new objects. When picking is enabled the events onTap, onDrag, onDragStart, onDragStop, onMouseEnter, and onMouseLeave are called for this object.
 * @param flag A boolean that indicates the desired status.
 */
WebGLObject.prototype.disablePicking=function(flag){this.enable_picking=!flag;};
/**
 * This is a callback function that is called when the user taps on this object. It is initially empty.
 * @param e The WebGLEvent object that describes this event.
 */
WebGLObject.prototype.onTap=function(e){};
/**
 * This is a callback function that is called when the user starts dragging the pointing device (mouse, finger, etc.) on this object. It is initially empty.
 * @param e The WebGLEvent object that describes this event.
 */
WebGLObject.prototype.onDragStart=function(e){};
/**
 * This is a callback function that is called when the user drags the pointing device (mouse, finger, etc.) on this object. It is initially empty.
 * @param e The WebGLEvent object that describes this event.
 */
WebGLObject.prototype.onDrag=function(e){};
/**
 * This is a callback function that is called when the user stops dragging the pointing device (mouse, finger, etc.) on this object. It is initially empty.
 * @param e The WebGLEvent object that describes this event.
 */
WebGLObject.prototype.onDragEnd=function(e){};
/**
 * This is a callback function that is called when the mouse enters in the area of this object. It is initially empty.
 * @param e The WebGLEvent object that describes this event.
 */
WebGLObject.prototype.onMouseEnter=function(e){};
/**
 * This is a callback function that is called when the mouse leaves the area of this object. It is initially empty.
 * @param e The WebGLEvent object that describes this event.
 */
WebGLObject.prototype.onMouseLeave=function(e){};


WebGLObject.prototype.setCorners=function(corners)
{
	this.corners=corners;
	this.num_of_corners=this.corners.length/3;
	this.projectedCorners=new Float32Array(this.num_of_corners*2);
};

WebGLObject.prototype.projectCorners=function(modelViewPerspMatrix,width,height)
 {
   if(this.num_of_corners==0) return;
   var newPos = [0, 0, 0, 0];
   var cameraPos = [0, 0, 0, 1];
   var idx=0;
   var idx2=0;
   for(var i=0;i<this.num_of_corners;i++)
   {
		cameraPos = [this.corners[idx], this.corners[idx+1], this.corners[idx+2], 1];
		mat4.multiplyVec4(modelViewPerspMatrix, cameraPos, newPos);
		this.projectedCorners[idx2]=width*(1+newPos[0]/newPos[3])/2;
		this.projectedCorners[idx2+1]=height*(1-newPos[1]/newPos[3])/2;
		idx+=3;
		idx2+=2;
   }
 };
 
 WebGLObject.prototype.insideConvex=function(x,y)
 {
   if(this.num_of_corners==0) return false;
   var p1=0;
   var p2=0;
   var out=false;
   var v=0;
   
   for(var i=0;i<this.num_of_corners && !out;i++)
   {
		p1=i;
		p2=i+1;
		if(p2==this.num_of_corners)p2=0;
		v = (this.projectedCorners[p2*2+1] - this.projectedCorners[p1*2+1]) * x + (this.projectedCorners[p1*2+0] - this.projectedCorners[p2*2+0]) *y + (this.projectedCorners[p2*2+0] * this.projectedCorners[p1*2+1]) - (this.projectedCorners[p1*2+0] * this.projectedCorners[p2*2+1]);
		if(v<0) out=true;
   }
   
   return !out;
 };

 //assumes that three corners are given, the one that corresponds to the following points on a plane: (0,0), (1,0), (0,1)
 WebGLObject.prototype.onPlane=function(x,y)
 {
   var a=this.projectedCorners[2]-this.projectedCorners[0];
   var b=this.projectedCorners[3]-this.projectedCorners[1];
   var c=this.projectedCorners[4]-this.projectedCorners[0];
   var d=this.projectedCorners[5]-this.projectedCorners[1];
   var det=a*d-b*c;
   var inv_a=d/det;
   var inv_b=-b/det;
   var inv_c=-c/det;
   var inv_d=a/det;
   x=x-this.projectedCorners[0];
   y=y-this.projectedCorners[1];
   return [inv_a*x+inv_c*y, inv_b*x+inv_d*y];
   
 };
 
 /**
 * Sets attribute data to this object. The data should correspond to an attribute variable of the shader that will be used to render this object.
 * @param buffername A string with the corresponding attribute name that will be used by the shader to reference this data buffer.
 * @param data An array of the data given preferably as a Float32Array typed array.
 * @param dimensionality The size of the given data per vertex, for example 3 for 3D points, 2 for UV texture coordinates, 4 for RGBA color components, etc.
 */
WebGLObject.prototype.setData=function(buffername, data, dimensionality)
{
	if(typeof this.buffers[buffername] === "undefined")
	{
		this.buffers[buffername]={};
		this.buffers[buffername].data=null;
		this.buffers[buffername].buffer=null;
	}
	var buf=this.buffers[buffername];
	
	if(Object.prototype.toString.call(data) === "[object Float32Array]")
		buf.data=data;
	else buf.data=new Float32Array(data);
		
	var gl=this.gl;
	if(buf.buffer==null) buf.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf.buffer);    
	gl.bufferData(gl.ARRAY_BUFFER, buf.data, gl.STATIC_DRAW);
    buf.buffer.itemSize = dimensionality;
    buf.buffer.numItems = data.length/dimensionality;
};

/**
 * Sets attribute data to this object by referencing an existing data buffer from another object (for memory and computational efficiency).
 * @param buffername A string with the attribute name that was used when this data buffer was created in the other object.
 * @param object Another WebGLObject whose data buffer will be used.
 */
WebGLObject.prototype.sameData=function(buffername, object)
{
	this.buffers[buffername]=object.buffers[buffername];
};
 
 /**
 * Sets the vertices of the 3D object. It is identical to: setData("aXYZ",vertices,3).
 * @param vertices An array of 3D vertices given in X,Y,Z,X,Y,Z... order preferably as a Float32Array typed array.
 */
WebGLObject.prototype.setXYZ=function(vertices){this.setData("aXYZ",vertices,3);};

 /**
 * Sets the vertices of the 3D object to be the same with another object. It is identical to: sameData("aXYZ",object).
 * @param object Another WebGLObject whose vertices will be used.
 */
WebGLObject.prototype.sameXYZ=function(object){this.sameData("aXYZ",object);};

 /**
 * Sets the normal vertices of the 3D object. It is identical to: setData("aNormal",vectors,3).
 * @param vectors An array of normal vertices given in Nx,Ny,Nz,Nx,Ny,Nz... order preferably as a Float32Array typed array.
 */
WebGLObject.prototype.setNormals=function(vectors){this.setData("aNormal",vectors,3);};

 /**
 * Sets the normal vertices of the 3D object to be the same with another object. It is identical to: sameData("aNormal",object).
 * @param object Another WebGLObject whose normal vertices will be used.
 */
WebGLObject.prototype.sameNormals=function(object){this.sameData("aNormal",object);};

 /**
 * Sets the vertex colors of the 3D object. The color component intensities must be given as real numbers in the interval [0-1]. It is identical to: setData("aColor",colors,3).
 * @param colors An array of colors given in R,G,B,R,G,B... order preferably as a Float32Array typed array.
 */
WebGLObject.prototype.setColors=function(colors){this.setData("aColor",colors,3);};
 /**
 * Sets the vertex colors of the 3D object to be the same with another object. It is identical to: sameData("aColor",object).
 * @param object Another WebGLObject whose vertix colors will be used.
 */
WebGLObject.prototype.sameColors=function(object){this.sameData("aColor",object);};

 /**
 * Sets the texture coordinates of the 3D object. The texture coordinates must be given as real numbers in the interval [0-1]. It is identical to: setData("aUV",coordinates,2).
 * @param coordinates An array of texture coordinates given in U,V,U,V... order preferably as a Float32Array typed array.
 */
WebGLObject.prototype.setUV=function(coordinates){this.setData("aUV",coordinates,2);};

 /**
 * Sets the texture coordinates of the 3D object to be the same with another object. It is identical to: sameData("aUV",object).
 * @param object Another WebGLObject whose texture coordinates will be used.
 */
WebGLObject.prototype.sameUV=function(object){this.sameData("aUV",object);};

 /**
 * Sets an index of elements (triangles, lines, points) that will be used to construct the object. The elements must be given as triplets of indices of vertices in the case of triangles, as pairs of indices of vertices in the case of lines, or as single indices of vertices in the case of points.
 * @param buffername A string with the corresponding element name, "Triangles", "Lines", or "Points". 
 * @param data An array of indices of vertices given in V1,V2,V3,V1,V2,V3... order preferably as a Uint16Array typed array.
 */
WebGLObject.prototype.setIndex=function(buffername,data)
{
	if(typeof this.indices[buffername] === "undefined")
	{
		this.indices[buffername]={};
		this.indices[buffername].data=null;
		this.indices[buffername].buffer=null;
		this.indices[buffername].shape=null;
		this.indices[buffername].count=0;
	}
	var buf=this.indices[buffername];
	
	if(Object.prototype.toString.call(data) === "[object Uint16Array]")
		buf.data=data;
	else buf.data=new Uint16Array(data);
		
	var gl=this.gl;
	if(buf.buffer==null) buf.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf.buffer);    
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, buf.data, gl.STATIC_DRAW);
    buf.buffer.itemSize = 1;
    buf.buffer.numItems = data.length;
	this.current_index=buf;
	if(buffername=='Triangles')
	{
		buf.shape=gl.TRIANGLES;
		buf.count=data.length/3;
	}
	else if(buffername=='Lines')
	{
		buf.shape=gl.LINES;
		buf.count=data.length/2;
	}
	else if(buffername=='Points')
	{
		buf.shape=gl.POINTS;
		buf.count=data.length;
	}
};

/**
 * Sets an index of elements to this object by referencing an existing index buffer from another object (for memory and computational efficiency).
 * @param buffername A string with the index name that was used when this index buffer was created in the other object.
 * @param object Another WebGLObject whose index buffer will be used.
 */
WebGLObject.prototype.sameIndex=function(buffername,object)
{
	if(typeof object.indices[buffername] === "undefined") return;
	this.indices[buffername]=object.indices[buffername];
	this.current_index=this.indices[buffername];
};


 /**
 * Constructs the 3D object as a triangular mesh using the given triangle faces. The faces must be given as triplets of indices of vertices. It is identical to: setIndex('Triangles',vertices);
 * @param vertices An array of indices of vertices given in V1,V2,V3,V1,V2,V3... order preferably as a Uint16Array typed array.
 */
WebGLObject.prototype.setTriangles=function(vertices){this.setIndex('Triangles',vertices);};
/**
 * Sets the triangle index of the 3D object to be the same with another object. It is identical to: sameIndex("Triangles",object).
 * @param object Another WebGLObject whose triangle index will be used.
 */
WebGLObject.prototype.sameTriangles=function(object){this.sameIndex('Triangles',object);};
WebGLObject.prototype.setTRI=WebGLObject.prototype.setTriangles;


 /**
 * Constructs the 3D object as a set of lines using the given line indices. The lines must be given as pairs of indices of vertices. It is identical to: setIndex('Lines',vertices);
 * @param vertices An array of indices of vertices given in V1,V2,V1,V2... order preferably as a Uint16Array typed array.
 */
WebGLObject.prototype.setLines=function(vertices){this.setIndex('Lines',vertices);};
/**
 * Sets the line index of the 3D object to be the same with another object. It is identical to: sameIndex("Lines",object).
 * @param object Another WebGLObject whose line index will be used.
 */
WebGLObject.prototype.sameLines=function(object){this.sameIndex('Lines',object);};
WebGLObject.prototype.setLIN=WebGLObject.prototype.setLines;

 /**
 * Constructs the 3D object as a point cloud using the given point indices. The points must be given as indices of vertices. It is identical to: setIndex('Lines',vertices);
 * @param vertices An array of indices of vertices given in V1,V1... order preferably as a Uint16Array typed array.
 */
WebGLObject.prototype.setPoints=function(vertices){this.setIndex('Points',vertices);};
/**
 * Sets the point index of the 3D object to be the same with another object. It is identical to: sameIndex("Points",object).
 * @param object Another WebGLObject whose point index will be used.
 */
WebGLObject.prototype.samePoints=function(object){this.sameIndex('Points',object);};
WebGLObject.prototype.setPOI=WebGLObject.prototype.setPoints;

 /**
 * Sets the drawing mode of this object (triangles, lines, or points). Automatically, the draw mode is set to the last index of elements that was created in this object.
 * @param mode An integer with the value gl.TRIANGLES, or gl.LINES, or gl.POINTS.
 */
WebGLObject.prototype.setDrawMode=function(mode)
{
	if(mode==this.gl.TRIANGLES)
		this.setDrawModeTriangles();
	else if(mode==this.gl.LINES)
		this.setDrawModeLines();
	else if(mode==this.gl.POINTS)
		this.setDrawModePoints();
};

/**
 * Sets the drawing mode of this object to gl.TRIANGLES. 
 */
WebGLObject.prototype.setDrawModeTriangles=function()
{
	if(this.indices['Triangles'])
	{
		this.current_index=this.indices['Triangles'];
		//this.canvas.renderFrame();
	}
}

 /**
 * Sets the drawing mode of this object to gl.LINES. It automatically constructs the vertex indices of the lines if the object was given as triangular mesh. 
 */
WebGLObject.prototype.setDrawModeLines=function()
{
	if(!this.indices['Lines'] && this.indices['Triangles'])
	{
		var TRI=this.indices['Triangles'].data;
		var l=TRI.length/3;
		var p=new Uint16Array(l*6);
		var j=0;
		var k=0;
		for(var i=0;i<l;i++)
		{
			p[k]=TRI[j];k+=1;
			p[k]=TRI[j+1];k+=1;
			p[k]=TRI[j+1];k+=1;
			p[k]=TRI[j+2];k+=1;
			p[k]=TRI[j+2];k+=1;
			p[k]=TRI[j];k+=1;
			j+=3;
		}
		this.setLines(p);
	}
	
	if(this.indices['Lines'])
	{
		this.current_index=this.indices['Lines'];
		//this.canvas.renderFrame();
	}
};

 /**
 * Sets the drawing mode of this object to gl.POINTS. It automatically constructs the vertex indices of the point cloud if the object was given as triangular mesh or a set of lines. 
 */
WebGLObject.prototype.setDrawModePoints=function()
{
	if(!this.indices['Points'] && this.buffers['aXYZ'])
	{
		var l=this.buffers['aXYZ'].data.length/3;
		var p=new Uint16Array(l);
		for(var i=0;i<l;i++) p[i]=i;
		this.setPoints(p);
	}
	
	if(this.indices['Points'])
	{
		this.current_index=this.indices['Points'];
		//this.canvas.renderFrame();
	}
};

/**
 * Sets a WebGLShader to this object.
 * @param s A WebGLShader object. 
 */
WebGLObject.prototype.setShader=function(s)
{
	this._shader=s;
};

/**
 * Sets to this object the same WebGLShader of another object.
 * @param o A WebGLObject object. 
 */
WebGLObject.prototype.sameShader=function(o)
{
	this._shader=o.getShader();
};

/**
 * Returns the current WebGLShader associated with this object.
 * @return WebGLShader The current WebGLShader of this object. 
 */
WebGLObject.prototype.getShader=function()
{
	if(this.canvas.roii.draw_rois) return this.canvas.roii.shader;
	
	if(this._shader==null) 
	{
		var flags=0;
		if(this.buffers['aUV']) flags=flags | WebGLShader.UV;
		if(this.buffers['aColor'])flags=flags | WebGLShader.COLORS;
		if(this.buffers['aTimeStamp'])flags=flags | WebGLShader.TIMESTAMPS;
		/*if(this._material==='undefined')
		{
			this._material=new WebGLMaterial(this.canvas);
			this._material.
		}*/
		var normls=false;
		if(this._material)
		{
			if(this._material.getAmbientColor())flags=flags | WebGLShader.AMBIENT;
			if(this.buffers['aNormal'])
			{
				if(this._material.getDiffuseColor())flags=flags | WebGLShader.DIFFUSE;
				if(this._material.getSpecularColor())flags=flags | WebGLShader.SPECULAR;
				if(this._material.getMatCap())flags=flags | WebGLShader.MATCAP;
				if(this._material.getReflection())flags=flags | WebGLShader.REFLECTION;
			}
		}
		else
		{
			if(this.buffers['aNormal']){flags=flags | WebGLShader.DIFFUSE;flags=flags | WebGLShader.SPECULAR;}
		}
		this._shader=new WebGLShader(this.canvas,flags);
		if(this._material)
		{
			var v=this._material.getReflectionColor();if(v)this._shader.setUniform4fv('uReflectionColor',v);
			v=this._material.getMatCapColor();if(v)this._shader.setUniform4fv('uMatCapColor',v);
			v=this._material.getAmbientColor();if(v)this._shader.setUniform3fv('uAmbientColor',v);
			v=this._material.getDiffuseColor();if(v)this._shader.setUniform3fv('uDiffuseColor',v);
			v=this._material.getSpecularColor();if(v)this._shader.setUniform4fv('uSpecularColor',v);
			v=this._material.getSpecularExponent();if(v)this._shader.setUniform1f('uSpecularExponent',v);
		}
		//if(this.buffers['aUV']) this._shader.useTexture(true); else this._shader.useTexture(false);
		//if(this.buffers['aColor']) this._shader.useColors(true); else this._shader.useColors(false);
		//if(this.buffers['aNormal']) this._shader.useLighting(true); else this._shader.useLighting(false);
	}
	
	
	return this._shader;
};

/**
 * Updates the projection and model view matrices of the shader according to the current camera.
 */
WebGLObject.prototype.updateShader=function()
{
	var s=this.getShader();
	s.updateProjection();
	s.updateModelView();
};

/**
 * Sets a WebGLTexture to this object.
 * @param t An existing WebGLTexture object, or the URL of an image file given as a string.
 * @param flag An optional boolean flag that indicates if we want to wait for the texture to be loaded before the object is rendered. The default is false, and in this case a default grey-gradient texture is shown until the actual texture is loaded.
 * @return Image A javascript Image object that will handle the image content. It will be returned only if a URL string is given as an input.
 */
WebGLObject.prototype.setTexture=function(t,flag)
{
	this.wait_for_texture=false;
	if(typeof flag!=='undefined') this.wait_for_texture=flag;
	if(typeof t=='string')
	{
		this.texture=new WebGLTexture(this.canvas);
		return this.texture.load(t);
	}
	else this.texture=t;
};

/**
 * Sets a video texture to this object.
 * @param t A string with the URL of a video file.
 * @param options Optionally, you can provide as an object one or more of the following parameters: autoplay (true, which is the default, or false), and loop (true, which is the default, or false). Example: setVideoTexture('video.mp4',{autoplay: true, loop: false});
 * @param flag An optional boolean flag that indicates if we want to wait for the video texture to be loaded before the object is rendered. The default is false, and in this case a default grey-gradient texture is shown until the actual video texture is loaded.
 * @return Video A javascript Video object that will handle the video content.
 */
WebGLObject.prototype.setVideoTexture=function(t,options,flag)
{
	this.wait_for_texture=false;
	if(typeof flag!=='undefined') this.wait_for_texture=flag;
	if(typeof t=='string')
	{
		this.texture=new WebGLTexture(this.canvas);
		return this.texture.loadVideo(t,options);
	}
	else this.texture=t;
};

/**
 * Returns the current WebGLTexture associated with this object.
 * @return WebGLTexture The current WebGLTexture of this object. 
 */
WebGLObject.prototype.getTexture=function()
{
	return this.texture;
};

/**
 * Sets material properties to this object.
 * @param m A WebGLMaterial object that contains the material properties.
 */
WebGLObject.prototype.setMaterial=function(m)
{
	this._material=m;
};

/**
 * Returns the material properties of this object.
 * @return WebGLMaterial The WebGLMaterial object that contains the material properties.
 */
WebGLObject.prototype.getMaterial=function()
{
	if(typeof this._material==='undefined')
		this._material=new WebGLMaterial(this.canvas);		
	return this._material;
};

/**
 * Draws the object on the canvas.
 */
WebGLObject.prototype.draw=function()
{
	if(this.canvas.roii.draw_rois)
	{
		if(!this.is_roi)
		{
			if(this.enable_picking)this.roi.project();
			return;
		}
	} 
	
	var gl=this.gl;

	var s=this.getShader();
	s.use();
	
	//this.gl.disableVertexAttribArray(0);//all shaders have at least 1 attrib array for xyz
	this.gl.disableVertexAttribArray(1);
	this.gl.disableVertexAttribArray(2);
	this.gl.disableVertexAttribArray(3);
	
	if(this.texture!=null) if(this.wait_for_texture && !this.texture.isLoaded()) return; else this.texture.use();
	if(this._material)
	{
		var v=this._material.getReflection();if(v) v.useAsReflection();
		v=this._material.getMatCap();if(v) v.useAsMatCap();
	}
	
	for(var a in s.attrs)
	{
		if(typeof this.buffers[a]!=='undefined')
			s.setAttribute(a,this.buffers[a].buffer);
	}
	if(this.current_index!=null)
	{
		//console.log('ok '+this.current_index.count+' '+this.buffers['aXYZ'].buffer.numItems);
		//console.log(this.gl.getUniform(s.shaderProgram,s.univars["uMVMatrix"]));
		s.draw(this.current_index.shape,this.current_index.buffer);
        
		this.canvas.total_number_of_objects+=1;
		if(this.buffers['aXYZ'])this.canvas.total_number_of_vertices+=this.buffers['aXYZ'].buffer.numItems;
		this.canvas.total_number_of_elements+=this.current_index.count;
	}
};

WebGLObject.prototype.drawHeightmap=function(shaderProgram)
{
	var gl=this.gl;
	if(this.vertexPositionBuffer!=null)
	{
	 gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	}
	
	if(this.vertexNormalBuffer!=null)
	{
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, this.vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
	}

	if(this.vertexColorBuffer!=null)
	{
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, this.vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexColor2Buffer);
		gl.vertexAttribPointer(shaderProgram.vertexColor2Attribute, this.vertexColor2Buffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexColor3Buffer);
		gl.vertexAttribPointer(shaderProgram.vertexColor3Attribute, this.vertexColor3Buffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexColor4Buffer);
		gl.vertexAttribPointer(shaderProgram.vertexColor4Attribute, this.vertexColor4Buffer.itemSize, gl.FLOAT, false, 0, 0);
	}
	
	if(this.vertexTextureCoordBuffer!=null)
	{
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexTextureCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, this.vertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
	}

	if(this.vertexIndexBuffer!=null)
	{
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
	    gl.drawElements(this.shape, this.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
	}
};

WebGLObject.prototype.onload=function(){};

WebGLObject.prototype.handleLoadedObject=function(txt)
{ 
	var lines=txt.split("#");
	var xyz=new Float32Array(lines[0].split(","));
	var nrm=new Float32Array(lines[1].split(","));
	var tri=new Uint16Array(lines[2].split(","));
	this.setXYZ(xyz);
	this.setTriangles(tri);
	this.setNormals(nrm);
	this.setColors(xyz);
	this.onload();
};

WebGLObject.prototype.downloadLowRes=function(fnm,id)
{
  this.filename=fnm;
  this.fid=id;
  var file_request;
  if (window.XMLHttpRequest)
  {// code for IE7+, Firefox, Chrome, Opera, Safari
  	file_request=new XMLHttpRequest();
  }
  else
  {// code for IE6, IE5
  	file_request=new ActiveXObject("Microsoft.XMLHTTP");
  }	
  var o=this;
  file_request.onreadystatechange=function()
  {
	if (file_request.readyState==4 && file_request.status==200)
	{
		o.handleLoadedObject(file_request.responseText);
		o.downloadHighRes();
	}
  }

  file_request.open("GET",this.filename+".low."+(this.fid+1),true);
  file_request.send();
};

WebGLObject.prototype.downloadHighRes=function()
{
  var file_request;
  if (window.XMLHttpRequest)
  {// code for IE7+, Firefox, Chrome, Opera, Safari
  	file_request=new XMLHttpRequest();
  }
  else
  {// code for IE6, IE5
  	file_request=new ActiveXObject("Microsoft.XMLHTTP");
  }	
  var o=this;
  file_request.onreadystatechange=function()
  {
	if (file_request.readyState==4 && file_request.status==200)
			o.handleLoadedObject(file_request.responseText);
  }

  file_request.open("GET",this.filename+"."+(this.fid+1),true);
  file_request.send();
};

WebGLObject.prototype.createRect=function(w,h,u,v)
{
	var _xyz=new Float32Array(4*3);
	var _uv=new Float32Array(4*2);
	var _tri=new Uint16Array(2*3);
	
	_xyz[0]=w/2.0; _xyz[1]=h/2.0; _xyz[2]=0;
	_xyz[3]=-w/2.0; _xyz[4]=h/2.0; _xyz[5]=0;
	_xyz[6]=-w/2.0; _xyz[7]=-h/2.0; _xyz[8]=0;
	_xyz[9]=w/2.0; _xyz[10]=-h/2.0; _xyz[11]=0;
	
	_tri[0]=0;_tri[1]=1;_tri[2]=2;
	_tri[3]=0;_tri[4]=2;_tri[5]=3;

	_uv[0]=u;_uv[1]=v;
	_uv[2]=0;_uv[3]=v;
	_uv[4]=0;_uv[5]=0;
	_uv[6]=u;_uv[7]=0;
	
	this.setXYZ(_xyz);
	this.setTriangles(_tri);
	this.setUV(_uv);
};

WebGLObject.prototype.createSphere81=function(radius)
{
	var _nrm=[0.0000,0.5257,0.8507,0.0000,-0.5257,0.8507,0.5257,0.8507,0.0000,-0.5257,0.8507,0.0000,0.8507,0.0000,0.5257,0.8507,0.0000,-0.5257,0.0000,0.0000,1.0000,0.5000,-0.3090,0.8090,0.5000,0.3090,0.8090,-0.5000,-0.3090,0.8090,-0.5000,0.3090,0.8090,0.3090,0.8090,0.5000,0.0000,1.0000,0.0000,-0.3090,0.8090,0.5000,0.8090,0.5000,0.3090,-0.8090,0.5000,0.3090,-0.3090,-0.8090,0.5000,0.3090,-0.8090,0.5000,-0.8090,-0.5000,0.3090,0.8090,-0.5000,0.3090,1.0000,0.0000,0.0000,0.0000,0.2733,0.9619,0.0000,-0.2733,0.9619,0.2599,-0.4339,0.8627,0.7020,-0.1606,0.6938,0.2599,0.4339,0.8627,0.7020,0.1606,0.6938,-0.2599,-0.4339,0.8627,-0.7020,-0.1606,0.6938,-0.2599,0.4339,0.8627,-0.7020,0.1606,0.6938,0.1606,0.6938,0.7020,0.4339,0.8627,0.2599,0.2733,0.9619,0.0000,-0.2733,0.9619,0.0000,-0.1606,0.6938,0.7020,-0.4339,0.8627,0.2599,0.6938,0.7020,0.1606,0.8627,0.2599,0.4339,-0.6938,0.7020,0.1606,-0.8627,0.2599,0.4339,-0.1606,-0.6938,0.7020,-0.4339,-0.8627,0.2599,0.1606,-0.6938,0.7020,0.4339,-0.8627,0.2599,-0.6938,-0.7020,0.1606,-0.8627,-0.2599,0.4339,0.6938,-0.7020,0.1606,0.8627,-0.2599,0.4339,0.9619,0.0000,0.2733,0.9619,0.0000,-0.2733,0.2629,-0.1625,0.9511,0.5257,0.0000,0.8507,0.2629,0.1625,0.9511,-0.2629,-0.1625,0.9511,-0.5257,0.0000,0.8507,-0.2629,0.1625,0.9511,0.1625,0.9511,0.2629,-0.1625,0.9511,0.2629,0.0000,0.8507,0.5257,0.5878,0.6882,0.4253,0.6882,0.4253,0.5878,0.4253,0.5878,0.6882,-0.5878,0.6882,0.4253,-0.6882,0.4253,0.5878,-0.4253,0.5878,0.6882,-0.1625,-0.9511,0.2629,0.1625,-0.9511,0.2629,0.0000,-0.8507,0.5257,-0.5878,-0.6882,0.4253,-0.6882,-0.4253,0.5878,-0.4253,-0.5878,0.6882,0.5878,-0.6882,0.4253,0.6882,-0.4253,0.5878,0.4253,-0.5878,0.6882,0.9511,0.2629,0.1625,0.9511,0.2629,-0.1625,0.8507,0.5257,0.0000,-0.9511,0.2629,-0.1625,-0.9511,0.2629,0.1625,-0.8507,0.5257,0.0000];
	for(var i=0;i<243;i++) _nrm[i+243]=-_nrm[i];
	var _xyz=new Array();
	for(var i=0;i<486;i++) _xyz[i]=_nrm[i]*radius;
	this.setXYZ(_xyz);
	this.setNormals(_nrm);
	this.setTriangles([1,23,22,7,51,23,6,22,51,22,23,51,4,26,24,8,52,26,7,24,52,24,26,52,0,21,25,8,25,53,6,53,21,21,53,25,7,52,51,8,53,52,6,51,53,51,52,53,1,22,27,9,27,54,6,54,22,22,54,27,86,28,30,10,30,55,9,55,28,28,55,30,0,29,21,10,56,29,6,21,56,21,29,56,9,54,55,10,55,56,6,56,54,54,56,55,2,33,32,12,57,33,11,32,57,32,33,57,3,36,34,13,58,36,12,34,58,34,36,58,0,31,35,13,35,59,11,59,31,31,59,35,12,58,57,13,59,58,11,57,59,57,58,59,2,32,37,14,37,60,11,60,32,32,60,37,4,38,26,8,26,61,14,61,38,26,38,61,0,25,31,8,62,25,11,31,62,25,62,31,14,60,61,8,61,62,11,62,60,60,62,61,3,39,36,15,63,39,13,36,63,36,39,63,86,30,40,10,64,30,15,40,64,30,64,40,0,35,29,10,29,65,13,65,35,29,35,65,15,64,63,10,65,64,13,63,65,63,64,65,82,103,104,88,104,132,87,132,103,103,132,104,85,105,107,89,107,133,88,133,105,105,133,107,81,106,102,89,134,106,87,102,134,102,106,134,88,132,133,89,133,134,87,134,132,132,134,133,82,108,103,90,135,108,87,103,135,103,108,135,5,111,109,91,136,111,90,109,136,109,111,136,81,102,110,91,110,137,87,137,102,102,137,110,90,136,135,91,137,136,87,135,137,135,136,137,83,113,114,93,114,138,92,138,113,113,138,114,84,115,117,94,117,139,93,139,115,115,139,117,81,116,112,94,140,116,92,112,140,112,116,140,93,138,139,94,139,140,92,140,138,138,140,139,83,118,113,95,141,118,92,113,141,113,118,141,85,107,119,89,142,107,95,119,142,107,142,119,81,112,106,89,106,143,92,143,112,106,112,143,95,142,141,89,143,142,92,141,143,141,142,143,84,117,120,96,120,144,94,144,117,117,144,120,5,121,111,91,111,145,96,145,121,111,121,145,81,110,116,91,146,110,94,116,146,110,146,116,96,144,145,91,145,146,94,146,144,144,146,145,83,114,42,93,66,114,16,42,66,114,66,42,84,44,115,17,67,44,93,115,67,115,44,67,1,41,43,17,43,68,16,68,41,41,68,43,93,67,66,17,68,67,16,66,68,66,67,68,83,42,45,18,45,69,16,69,42,42,69,45,86,46,28,9,28,70,18,70,46,28,46,70,1,27,41,9,71,27,16,41,71,27,71,41,18,69,70,9,70,71,16,71,69,69,71,70,84,47,44,19,72,47,17,44,72,44,47,72,4,24,48,7,73,24,19,48,73,24,73,48,1,43,23,7,23,74,17,74,43,23,43,74,19,73,72,7,74,73,17,72,74,72,73,74,2,123,33,12,33,147,97,147,123,33,123,147,3,34,125,98,125,148,12,148,34,34,148,125,82,124,122,98,149,124,97,122,149,122,124,149,12,147,148,98,148,149,97,149,147,147,149,148,2,126,123,99,150,126,97,123,150,123,126,150,5,109,127,90,151,109,99,127,151,109,151,127,82,122,108,90,108,152,97,152,122,108,122,152,99,151,150,90,152,151,97,150,152,150,151,152,3,125,128,100,128,153,98,153,125,125,153,128,85,129,105,88,105,154,100,154,129,105,129,154,82,104,124,88,155,104,98,124,155,104,155,124,100,153,154,88,154,155,98,155,153,153,155,154,4,49,38,20,75,49,14,38,75,38,49,75,5,127,50,99,76,127,20,50,76,127,76,50,2,37,126,99,126,77,14,77,37,37,77,126,20,76,75,99,77,76,14,75,77,75,76,77,85,119,130,101,130,156,95,156,119,119,156,130,86,131,46,18,46,157,101,157,131,46,131,157,83,45,118,18,158,45,95,118,158,118,45,158,101,156,157,18,157,158,95,158,156,156,158,157,85,130,129,101,78,130,100,129,78,129,130,78,86,40,131,15,79,40,101,131,79,40,79,131,3,128,39,15,39,80,100,80,128,39,128,80,101,79,78,15,80,79,100,78,80,78,79,80,4,48,49,20,49,159,19,159,48,48,159,49,5,50,121,96,121,160,20,160,50,121,50,160,84,120,47,96,161,120,19,47,161,120,161,47,20,159,160,96,160,161,19,161,159,159,161,160]);
};

WebGLObject.prototype.createSphere=function(radius_xz, radius_y, repetitions, from_phi,to_phi,resolution_phi,from_theta,to_theta,resolution_theta)
{
	var _xyz=new Array();
	var _uv=new Array();
	var _tri=new Array();
	var _nrm=new Array();
	var theta;
	var v;
	var theta_next;
	var v_next;
	var sin_theta;
	var cos_theta;
	var sin_theta_next;
	var cos_theta_next;
	var phi;
	var u;
	var phi_next;
	var u_next;
	var sin_phi;
	var cos_phi;
    var sin_phi_next;
	var cos_phi_next;
	var offset_u=0;
	var quad=0;
	for(j=from_theta;j<to_theta-1;j++)
		{	
			theta=(j*3.1416)/(2*(resolution_theta-1));
			v=(j-from_theta)/(to_theta-from_theta-1);
			theta_next=((j+1)*3.1416)/(2*(resolution_theta-1));
			v_next=(j-from_theta+1)/(to_theta-from_theta-1);
			sin_theta=Math.sin(theta);
			cos_theta=Math.cos(theta);
			sin_theta_next=Math.sin(theta_next);
			cos_theta_next=Math.cos(theta_next);
			
			for(k=from_phi;k<to_phi-1;k++)
			{
				phi=-3.1416/2+(k*3.1416)/(resolution_phi-1);
				u=offset_u+repetitions*(k-from_phi)/(to_phi-from_phi-1);
				phi_next=-3.1416/2+((k+1)*3.1416)/(resolution_phi-1);
				u_next=offset_u+repetitions*(k-from_phi+1)/(to_phi-from_phi-1);
				sin_phi=Math.sin(phi);
				cos_phi=Math.cos(phi);
				sin_phi_next=Math.sin(phi_next);
				cos_phi_next=Math.cos(phi_next);
				
				
				_uv[_uv.length]=u;_uv[_uv.length]=v;
				_nrm[_nrm.length]=sin_phi*cos_theta;_nrm[_nrm.length]=sin_theta;_nrm[_nrm.length]=-cos_phi*cos_theta;
				_xyz[_xyz.length]=sin_phi*cos_theta*radius_xz;_xyz[_xyz.length]=sin_theta*radius_y;_xyz[_xyz.length]=-cos_phi*cos_theta*radius_xz;
				_uv[_uv.length]=u_next;_uv[_uv.length]=v;
				_nrm[_nrm.length]=sin_phi_next*cos_theta;_nrm[_nrm.length]=sin_theta;_nrm[_nrm.length]=-cos_phi_next*cos_theta;
				_xyz[_xyz.length]=sin_phi_next*cos_theta*radius_xz;_xyz[_xyz.length]=sin_theta*radius_y;_xyz[_xyz.length]=-cos_phi_next*cos_theta*radius_xz;
				_uv[_uv.length]=u_next;_uv[_uv.length]=v_next;
				_nrm[_nrm.length]=sin_phi_next*cos_theta_next;_nrm[_nrm.length]=sin_theta_next;_nrm[_nrm.length]=-cos_phi_next*cos_theta_next;
				_xyz[_xyz.length]=sin_phi_next*cos_theta_next*radius_xz;_xyz[_xyz.length]=sin_theta_next*radius_y;_xyz[_xyz.length]=-cos_phi_next*cos_theta_next*radius_xz;
				_uv[_uv.length]=u;_uv[_uv.length]=v_next;
				_nrm[_nrm.length]=sin_phi*cos_theta_next;_nrm[_nrm.length]=sin_theta_next;_nrm[_nrm.length]=-cos_phi*cos_theta_next;
				_xyz[_xyz.length]=sin_phi*cos_theta_next*radius_xz;_xyz[_xyz.length]=sin_theta_next*radius_y;_xyz[_xyz.length]=-cos_phi*cos_theta_next*radius_xz;
				
				_tri[_tri.length]=quad*4;
				_tri[_tri.length]=quad*4+1;
				_tri[_tri.length]=quad*4+2;
				_tri[_tri.length]=quad*4;
				_tri[_tri.length]=quad*4+2;
				_tri[_tri.length]=quad*4+3;
				quad+=1;
			}
		}	
	this.setXYZ(_xyz);
	this.setNormals(_nrm);
	this.setTriangles(_tri);
	//this.setUV(_uv);
};

/**
 * This class creates the material properties of a WebGLObject. You can use this class to control the shading properties of the object, such as the ambient, diffuse, and specular color components, use a matcap texture to model the shading of the object, and add reflection using spherical HDRI textures.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var material=new WebGLMaterial(my_canvas);<br>
 * material.setSpecularColor([1.0,1.0,1.0]);<br>
 * material.setSpecularExponent(5);<br>
 * material.setMatCap("/img/matcap.jpg");<br>
 * material.setReflection("/img/hdri.jpg");<br>
 * material.setReflectionColor([0.1,0.1,0.1]);<br>
 * object.setMaterial(material);<br></font>
 * @param gl_canvas A WebGLCanvas object.
 */
function WebGLMaterial(gl_canvas)
{
	this.canvas=gl_canvas;
}

WebGLMaterial.prototype._getColorInput=function(r,g,b,a)
{
	if(typeof r==='object')
	{
		if(r.length==4) return r;
		else if(r.length==3) return [r[0],r[1],r[2],1];
		else return;
	}
	else if(typeof r==='number' && typeof g==='number' && typeof b==='number') 
	{
		if(typeof a!=='undefined') return [r,g,b,a];
		else return [r,g,b,1];
	}
	else return;
};

/**
 * Sets the ambient color of the Phong shading model.
 * @param r The red color component as a real number in the range [0-1]
 * @param g The green color component as a real number in the range [0-1]
 * @param b The blue color component as a real number in the range [0-1]
 */
WebGLMaterial.prototype.setAmbientColor=function(r,g,b)
{
	var clr=this._getColorInput(r,g,b,1);
	if(typeof clr!=='undefined') this.Ka=[clr[0],clr[1],clr[2]];
};
/**
 * Returns the ambient color of the Phong shading model.
 * @return Array The color as a float array of size 4, with R,G,B,A.
 */
WebGLMaterial.prototype.getAmbientColor=function(){return this.Ka;};

/**
 * Sets the diffuse color of the Phong shading model.
 * @param r The red color component as a real number in the range [0-1]
 * @param g The green color component as a real number in the range [0-1]
 * @param b The blue color component as a real number in the range [0-1]
 */
WebGLMaterial.prototype.setDiffuseColor=function(r,g,b)
{
	var clr=this._getColorInput(r,g,b,1);
	if(typeof clr!=='undefined') this.Kd=[clr[0],clr[1],clr[2]];
};
/**
 * Returns the diffuse color of the Phong shading model.
 * @return Array The color as a float array of size 4, with R,G,B,A.
 */
WebGLMaterial.prototype.getDiffuseColor=function(){return this.Kd;};

/**
 * Sets the specular color of the Phong shading model.
 * @param r The red color component as a real number in the range [0-1]
 * @param g The green color component as a real number in the range [0-1]
 * @param b The blue color component as a real number in the range [0-1]
 */
WebGLMaterial.prototype.setSpecularColor=function(r,g,b)
{
	var clr=this._getColorInput(r,g,b,1);
	if(typeof clr!=='undefined') this.Ks=clr;
};
/**
 * Returns the specular color of the Phong shading model.
 * @return Array The color as a float array of size 4, with R,G,B,A.
 */
WebGLMaterial.prototype.getSpecularColor=function(){return this.Ks;};
/**
 * Sets the specular exponent of the Phong shading model.
 * @param e The specular exponent of the Phong shading model.
 */
WebGLMaterial.prototype.setSpecularExponent=function(e)
{
	this.Ns=e;
	if(typeof (this.getSpecularColor())==='undefined')this.setSpecularColor([1,1,1]);
};
/**
 * Returns the specular exponent of the Phong shading model.
 * @param float The specular exponent of the Phong shading model.
 */
WebGLMaterial.prototype.getSpecularExponent=function(){return this.Ns;};

/**
 * Sets the matcap color to be blended with the MatCap texture image. The default color is: 1,1,1
 * @param r The red color component as a real number in the range [0-1]
 * @param g The green color component as a real number in the range [0-1]
 * @param b The blue color component as a real number in the range [0-1]
 */
WebGLMaterial.prototype.setMatCapColor=function(r,g,b)
{
	var clr=this._getColorInput(r,g,b,1);
	if(typeof clr!=='undefined') this.Km=clr;
};
/**
 * Returns the matcap color mask.
 * @return Array The color as a float array of size 4, with R,G,B,A.
 */
WebGLMaterial.prototype.getMatCapColor=function(){return this.Km;};

/**
 * Sets a MatCap shading to this material from a given MatCap texture image.
 * @param t An existing WebGLTexture object, or the URL of an image file given as a string.
 */
WebGLMaterial.prototype.setMatCap=function(t)
{
	if(typeof t=='string')
	{
		this.matcap=new WebGLTexture(this.canvas);
		return this.matcap.load(t);
	}
	else this.matcap=t;
};
/**
 * Returns the current MatCap associated with this material.
 * @return WebGLTexture The current MatCap texture image as a WebGLTexture object. 
 */
WebGLMaterial.prototype.getMatCap=function(){return this.matcap;};

/**
 * Sets the reflection color to be blended with the reflection texture image. The default color is: 1,1,1
 * @param r The red color component as a real number in the range [0-1]
 * @param g The green color component as a real number in the range [0-1]
 * @param b The blue color component as a real number in the range [0-1]
 */
WebGLMaterial.prototype.setReflectionColor=function(r,g,b)
{
	var clr=this._getColorInput(r,g,b,1);
	if(typeof clr!=='undefined') this.Kr=clr;
};
/**
 * Returns the reflection color mask.
 * @return Array The color as a float array of size 4, with R,G,B,A.
 */
WebGLMaterial.prototype.getReflectionColor=function(){return this.Kr;};

/**
 * Sets reflection to this material from a given spherical HDRI texture image.
 * @param t An existing WebGLTexture object, or the URL of an image file given as a string.
 */
WebGLMaterial.prototype.setReflection=function(t)
{
	if(typeof t=='string')
	{
		this.reflection=new WebGLTexture(this.canvas);
		return this.reflection.load(t);
	}
	else this.reflection=t;
};
/**
 * Returns the current reflection image associated with this material.
 * @return WebGLTexture The current reflection spherical HDRI texture image as a WebGLTexture object. 
 */
WebGLMaterial.prototype.getReflection=function(){return this.reflection;};

function BoundingBox(min,max,canvas)
{
	this.canvas=canvas;
	this.obj=null;
	
	this.obj=new WebGLObject(canvas);
	this.obj.disablePicking(true);
	var xyz=new Float32Array(24);
	xyz[0]=min[0];xyz[1]=min[1];xyz[2]=min[2];
	xyz[3]=min[0];xyz[4]=min[1];xyz[5]=max[2];
	xyz[6]=min[0];xyz[7]=max[1];xyz[8]=min[2];
	xyz[9]=min[0];xyz[10]=max[1];xyz[11]=max[2];
	xyz[12]=max[0];xyz[13]=min[1];xyz[14]=min[2];
	xyz[15]=max[0];xyz[16]=min[1];xyz[17]=max[2];
	xyz[18]=max[0];xyz[19]=max[1];xyz[20]=min[2];
	xyz[21]=max[0];xyz[22]=max[1];xyz[23]=max[2];
	this.obj.setXYZ(xyz);
	var lin=new Uint16Array(24);
	lin[0]=0;lin[1]=1;
	lin[2]=1;lin[3]=3;
	lin[4]=3;lin[5]=2;
	lin[6]=2;lin[7]=0;
	lin[8]=4;lin[9]=5;
	lin[10]=5;lin[11]=7;
	lin[12]=7;lin[13]=6;
	lin[14]=6;lin[15]=4;
	lin[16]=0;lin[17]=4;
	lin[18]=1;lin[19]=5;
	lin[20]=2;lin[21]=6;
	lin[22]=3;lin[23]=7;
	this.obj.setLines(lin);
	
	this.obj.getShader().setColorMask([0,0,1,1]);
	
	
	var segments=10;
	this.obj_h=new WebGLObject(canvas);
	var xyz=new Array();
	for(var i=0;i<2*segments;i++)
	{
		xyz.push(min[2]+(max[2]-min[2])*i/(2*segments-1));
		xyz.push(max[2]);
		xyz.push(6);
	}
	for(var i=0;i<2*segments;i++)
	{
		xyz.push(min[1]+(max[1]-min[1])*i/(2*segments-1));
		xyz.push(max[1]);
		xyz.push(7);
	}
	for(var i=0;i<2*segments;i++)
	{
		xyz.push(min[0]+(max[0]-min[0])*i/(2*segments-1));
		xyz.push(max[0]);
		xyz.push(8);
	}
	
	for(var i=0;i<2*segments;i++)
	{
		xyz.push(min[0]+(max[0]-min[0])*i/(2*segments-1));
		xyz.push(max[2]);
		xyz.push(0);
	}
	for(var i=0;i<2*segments;i++)
	{
		xyz.push(min[0]+(max[0]-min[0])*i/(2*segments-1));
		xyz.push(min[2]);
		xyz.push(0);
	}
	for(var i=0;i<2*segments;i++)
	{
		xyz.push(min[0]+(max[0]-min[0])*i/(2*segments-1));
		xyz.push(min[1]);
		xyz.push(1);
	}
	for(var i=0;i<2*segments;i++)
	{
		xyz.push(min[0]+(max[0]-min[0])*i/(2*segments-1));
		xyz.push(max[1]);
		xyz.push(1);
	}
	for(var i=0;i<2*segments;i++)
	{
		xyz.push(min[1]+(max[1]-min[1])*i/(2*segments-1));
		xyz.push(min[2]);
		xyz.push(2);
	}
	for(var i=0;i<2*segments;i++)
	{
		xyz.push(min[1]+(max[1]-min[1])*i/(2*segments-1));
		xyz.push(max[2]);
		xyz.push(2);
	}
	for(var i=0;i<2*segments;i++)
	{
		xyz.push(min[1]+(max[1]-min[1])*i/(2*segments-1));
		xyz.push(min[0]);
		xyz.push(3);
	}
	for(var i=0;i<2*segments;i++)
	{
		xyz.push(min[1]+(max[1]-min[1])*i/(2*segments-1));
		xyz.push(max[0]);
		xyz.push(3);
	}
	for(var i=0;i<2*segments;i++)
	{
		xyz.push(min[2]+(max[2]-min[2])*i/(2*segments-1));
		xyz.push(min[1]);
		xyz.push(4);
	}
	for(var i=0;i<2*segments;i++)
	{
		xyz.push(min[2]+(max[2]-min[2])*i/(2*segments-1));
		xyz.push(max[1]);
		xyz.push(4);
	}
	for(var i=0;i<2*segments;i++)
	{
		xyz.push(min[2]+(max[2]-min[2])*i/(2*segments-1));
		xyz.push(min[0]);
		xyz.push(5);
	}
	for(var i=0;i<2*segments;i++)
	{
		xyz.push(min[2]+(max[2]-min[2])*i/(2*segments-1));
		xyz.push(max[0]);
		xyz.push(5);
	}
	
	this.obj_h.setXYZ(xyz);
	this.obj_h.disablePicking(true);
	var lin=new Array();
	for(var i=0;i<15*segments*2;i++)lin.push(i);
	this.obj_h.setLines(lin);
	this.obj_h.setShader(new WebGLShader(canvas,
	["attribute vec3 aXYZ;",
	"uniform mat4 uMVMatrix;",
	"uniform mat4 uPMatrix;",
	"uniform float uX;",
	"uniform float uY;",
	"uniform float uZ;",
	"uniform vec4 uColorMask;",
	"varying float vX;",
	"varying float vT;",
	"varying vec4 vColor;",
	"void main(void){",
	"vec3 p=vec3(0.0,0.0,0.0);",
	"vX=aXYZ.x;",
	"vColor=uColorMask;",
	"if(aXYZ.z==0.0) {p=vec3(aXYZ.x,uY,aXYZ.y);vT=uX;vColor=vec4(1,0,0,0.1);}",
	"else if(aXYZ.z==1.0) {p=vec3(aXYZ.x,aXYZ.y,uZ);vT=uX;vColor=vec4(1,0,0,0.1);}",
	"else if(aXYZ.z==2.0) {p=vec3(uX,aXYZ.x,aXYZ.y);vT=uY;vColor=vec4(0,1,0,0.1);}",
	"else if(aXYZ.z==3.0) {p=vec3(aXYZ.y,aXYZ.x,uZ);vT=uY;vColor=vec4(0,1,0,0.1);}",
	"else if(aXYZ.z==4.0) {p=vec3(uX,aXYZ.y,aXYZ.x);vT=uZ;vColor=vec4(0,0,1,0.1);}",
	"else if(aXYZ.z==5.0) {p=vec3(aXYZ.y,uY,aXYZ.x);vT=uZ;vColor=vec4(0,0,1,0.1);}",
	"else if(aXYZ.z==6.0) {p=vec3(uX,uY,aXYZ.x);vT=aXYZ.y;vColor=vec4(0,0,1,0.1);}",
	"else if(aXYZ.z==7.0) {p=vec3(uX,aXYZ.x,uZ);vT=aXYZ.y;vColor=vec4(0,1,0,0.1);}",
	"else if(aXYZ.z==8.0) {p=vec3(aXYZ.x,uY,uZ);vT=aXYZ.y;vColor=vec4(1,0,0,0.1);}",
	"gl_Position=uPMatrix*uMVMatrix*vec4(p,1.0);",
	"}"],
	["precision mediump float;",
	"varying float vX;",
	"varying float vT;",
	"varying vec4 vColor;",
	"void main(void){",
	"gl_FragColor=vColor;",
	//"if(vX>vT) discard;",
	"}"]));
	this.obj_h.getShader().setUniform1f("uY",min[1]+0.1);
	this.obj_h.getShader().setUniform1f("uX",min[0]+0.5);
	this.obj_h.getShader().setUniform1f("uZ",min[2]+0.5);
	
}

BoundingBox.prototype.setXYZ=function(xyz)
{
	this.obj_h.getShader().use();
	this.obj_h.getShader().setUniform1f("uY",xyz[1]);
	this.obj_h.getShader().setUniform1f("uX",xyz[0]);
	this.obj_h.getShader().setUniform1f("uZ",xyz[2]);
};

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}


var VN_default_texture_image=new Image();
VN_default_texture_image.crossOrigin = '';
VN_default_texture_image.src = (('https:' == document.location.protocol) ? 'https:' : 'http:')+'//digitalepigraphy.github.io/visineat/js/img/default_texture-1.0.png';

/**
 * This class creates and handles a webGL texture. It can be used in conjunction with a WebGLObject.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var texture=new WebGLTexture(my_canvas);<br>
 * texture.load('my_picture.png');<br></font>
 * @param gl_canvas A WebGLCanvas object.
 * @param name An optional name for this texture (Optional argument).
 */
function WebGLTexture(gl_canvas,name)
{
	this.gl=gl_canvas.gl;
	this.canvas=gl_canvas;
	this.filename='';
	var gl=this.gl;
	this.texture = gl.createTexture();
    this.texture.image = new Image();
	this.texture.image.crossOrigin = '';
	if(typeof name !== 'undefined')
		this.name=name;
	else this.name="";
	this.loaded=false;
		
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, VN_default_texture_image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

/**
 * This method loads an image to this texture.
 * @param filename The URI address of an image file. 
 * @return Image A javascript Image object that will handle the image content.
 */
WebGLTexture.prototype.load=function(filename)
{
	if(typeof filename !== 'undefined')
	{
		this.filename=filename;
		var self=this;
		this.texture.image.onload = function () {
				self.handleLoadedTexture();
				self.canvas.oneMoreDone();
				self.loaded=true;
				self.onLoad();
			};
		this.texture.image.onerror= function(){
			self.canvas.oneMoreDone();
		};
		this.canvas.oneMoreToDo();
		this.texture.image.src = filename;
		return this.texture.image;
	}
};

/**
 * This method loads a video to this texture.
 * @param filename The URI address of a video file. 
 * @param options Optionally, you can provide as an object one or more of the following parameters: autoplay (true, which is the default, or false), and loop (true, which is the default, or false). Example: setVideoTexture('video.mp4',{autoplay: true, loop: false});
 * @return Video A javascript Video object that will handle the video content.
 */
WebGLTexture.prototype.loadVideo=function(filename,options)
{
	if(typeof filename !== 'undefined')
	{
		this.filename=filename;
		this.texture.video=document.createElement("video");
		this.texture.video.crossOrigin = "";
		if(typeof options!=='undefined' && typeof options.loop!=='undefined')
			this.texture.video.loop=options.loop;
		else this.texture.video.loop=true;
		
		var self=this;
		this.texture.video.oncanplay = function () {
				self.canvas.oneMoreDone();
				self.loaded=true;
				if(typeof options!=='undefined' && typeof options.autoplay!=='undefined')
				{	if(options.autoplay==true)self.texture.video.play();
				}
				else self.texture.video.play();
				self.update();
				self.onLoad();
			};
			
		this.canvas.oneMoreToDo();
		this.texture.video.src=filename;
		return this.texture.video;
		/*this.texture.image.onerror= function(){
			self.canvas.oneMoreDone();
		};*/
		
	}
};

/**
 * A callback function that is called when the texture is loaded. It is initially empty. 
 */
WebGLTexture.prototype.onLoad=function(){};
/**
 * Returns the loading status of this texture image. 
 * @return boolean The loading status. 
 */
WebGLTexture.prototype.isLoaded=function(){return this.loaded;};

WebGLTexture.prototype.handleLoadedTexture=function() {
	var gl=this.gl;
	
	var mx=gl.getParameter(gl.MAX_TEXTURE_SIZE);
	if(this.texture.image.width>mx || this.texture.image.height>mx)
		this.resizeMX(this.texture.image);
	else
	{
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.texture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		var w=this.texture.image.width;
		var h=this.texture.image.height;
		if( w&&(w&(w-1))!==0 || h&&(h&(h-1))!==0)
		{
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		}
	}
        this.canvas.renderFrame();
};

/**
 * This method updates the content of this texture using the current frame of a video source.
 * @param video_source An optional argument with a JavaScript video source object. The input argument can be omitted if loadVideo() has been used to load a video file in this texture. 
 */
WebGLTexture.prototype.update=function(video_source)
{
	if(typeof video_source==='undefined') video_source=this.texture.video;
	var gl=this.gl;
	if( video_source.readyState === video_source.HAVE_ENOUGH_DATA ){
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.bindTexture(gl.TEXTURE_2D, this.texture);
	/*if(this.canvas.convert_texture_ctx==null)
	{
		var convert_texture_canvas = document.createElement('canvas')
		convert_texture_canvas.width = 1024;
		convert_texture_canvas.height = 512;
		this.canvas.convert_texture_ctx = convert_texture_canvas.getContext('2d'); 
	}*/
	//this.canvas.convert_texture_ctx.drawImage(video_source,0,0, 1024, 512);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video_source);//this.canvas.convert_texture_ctx.getImageData(0,0,1024,512));
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}
};

WebGLTexture.prototype.resizeMX=function(image)
{
	var gl=this.gl;
	var mx=gl.getParameter(gl.MAX_TEXTURE_SIZE);
	if(this.canvas.resize_texture_ctx==null)
	{
		this.canvas.resize_texture_canvas = document.createElement('canvas')
		this.canvas.resize_texture_canvas.width = 512;
		this.canvas.resize_texture_canvas.height = 512;
		this.canvas.resize_texture_ctx = this.canvas.resize_texture_canvas.getContext('2d');   
	}
	if(this.canvas.resize_texture_canvas.width!=mx || this.canvas.resize_texture_canvas.height!=mx)
	{
		this.canvas.resize_texture_canvas.width=mx;
		this.canvas.resize_texture_canvas.height=mx;
	}
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.bindTexture(gl.TEXTURE_2D, this.texture);
	this.canvas.resize_texture_ctx.drawImage(image,0,0, mx, mx);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas.resize_texture_ctx.getImageData(0,0,mx,mx));
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
};
	
/**
 * This method binds this texture to webGL. 
 */
WebGLTexture.prototype.use=function()
{
	var gl=this.gl;
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.texture);
}; 
 
 WebGLTexture.prototype.useAsReflection=function()
{
	var gl=this.gl;
	gl.activeTexture(gl.TEXTURE2);
	gl.bindTexture(gl.TEXTURE_2D, this.texture);
}; 

 WebGLTexture.prototype.useAsMatCap=function()
{
	var gl=this.gl;
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, this.texture);
}; 
 
/**
 * This class implements a virtual camera that controls the projection and model view of the canvas.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var camera=canvas.getCamera();<br>
 * camera.getFPS();<br></font>
 * @param gl_canvas A WebGLCanvas object.
 */
function WebGLCamera(gl_canvas)
{
	this.gl=gl_canvas.gl;
	this.canvas=gl_canvas;
	this.canvasElement=gl_canvas.canvas;
	this.div_container=this.canvasElement.parentElement;
	this.container_width=0;
	this.container_height=0;
	
	this.realToCSSPixels = window.devicePixelRatio || 1;
	this.resolutionFactor=1;
	
	this.pixelDensity=this.realToCSSPixels*this.resolutionFactor;
	
	this.animation_frames=0;
	this.anim_zoom0=0.0;
	this.anim_rotx0=0.0;
	this.anim_roty0=0.0;
	this.anim_zoom1=0.0;
	this.anim_rotx1=0.0;
	this.anim_roty1=0.0;
	this.anim_zoom2=0.0;
	this.anim_rotx2=0.0;
	this.anim_roty2=0.0;
	this.total_animation_frames=800;
	
	this.width=1;
	this.height=1;
	this.left=0;
	this.top=0;
	
	this.smooth_acc=[0,0];
	this.acc_updated_since_last_touch=false;
	
	this._updatePickingMap_now=false;
	
	this.zoom=1;
	this.zoom_mem=1;
	this.working_zoom=1;
	this.working_zRot=0;
	this.xRot=0;
	this.yRot=0;
	this.zRot=0;
	this.xRot2=0;
	this.yRot2=0;
	this.enable_rotateZ=false;
	this.xTra=0;
	this.yTra=0;
	this.rot_center_z=0;
	
	this.xLig = 0.6;
    this.yLig = -0.3;
    
    this.speed_yRot=0;
	this.speed_xRot=0;//UNITS PER SECOND
	this.speed_zRot=0;//UNITS PER SECOND
	this.speed_xTra=0;//UNITS PER SECOND
	this.speed_yTra=0;//UNITS PER SECOND
	
	this.mvMatrixStack=[];
	
	this.mvMatrix = mat4.create();
	mat4.identity(this.mvMatrix);

	this.ixMatrix = mat4.create();
	mat4.identity(this.ixMatrix);
	
	this.ixMatrix_mem = mat4.create();
	mat4.identity(this.ixMatrix_mem);

	this.pMatrix = mat4.create();
	mat4.perspective(45, this.gl.viewportWidth / this.gl.viewportHeight, 0.1, 100.0, this.pMatrix);
	this._projection_changed=true;
	this._view_changed=true;
	
	this.projection_changed_stamp=0;
	this.view_changed_stamp=0;
	
	this._light_changed=true;
	this.size_changed=true;
	
	
	this.screen_x=0;
	this.screen_y=0;
	this.screen_z=-0.1;
	this.fov=45;
	this.focal_length=1/Math.tan((3.1415/180)* this.fov/2);
	this.aspect_ratio=4/3;
	this.screen_height2 = 0.1 /this.focal_length ;
	this.screen_width2 = this.screen_height2*this.aspect_ratio;
	this.screen_far=1000;
	this.viewer_projection_x=0;
	this.viewer_projection_y=0;
	this.viewer_projection_z=0.1;
	this.viewer_position_x=0;
	this.viewer_position_y=0;
	this.viewer_position_z=0;
	
	this.mouseX=0;
	this.mouseY=0;
	this.finger_distance=0;

	this.original_mouseX=0;
	this.original_mouseY=0;
	this.original_finger_distance=0;
	
	this.next_object_rotation=0;
	this.next_object_animation=0;
	
	this.mouse_moved=false;
	this.mouse_over_object=null;
	
	this.lastTimeDraw=0;
	this.inverseFPS=1/30;
	this.inverseFPS_smooth=0;
	
	this.projection_type=0;
	
	this.setStandardPointerInteraction();
}

/**
 * Sets the vertical FOV of the camera. Default value is 45.
 * @param fov The vertical FOV given in degrees. 
 */
WebGLCamera.prototype.setFOV=function(fov)
{
	this.fov=fov;
	this.focal_length=1/Math.tan((3.1415/180)* this.fov/2);
	this.screen_height2 = 0.1 /this.focal_length;
	this.notifyProjectionChanged();
};
/**
 * Returns the vertical FOV of the camera.
 * @return float The vertical FOV in degrees.
 */
WebGLCamera.prototype.getFOV=function(){return this.fov;};

/**
 * Returns the focal length of the camera.
 * @return float The focal length.
 */
WebGLCamera.prototype.getFocalLength=function(){return this.focal_length;};

/**
 * Returns the aspect ratio of the camera width/height.
 * @return float The aspect ratio.
 */
WebGLCamera.prototype.getAspectRatio=function(){return this.aspect_ratio;};


/**
 * Sets the pixel density of the camera. Default value is 1 to match the pixels of your device. Lower values will enhance performance but compromise quality. Higher values will have the opposite effect.
 * @param value The desired pixel density as a real number. 
 */
WebGLCamera.prototype.setPixelDensity=function(value)
{
this.resolutionFactor=value;
this.pixelDensity=this.realToCSSPixels*this.resolutionFactor;
this.container_width-=1;
this.canvasElement.style.width=(this.div_container.clientWidth+1)+'px';
this.resize();
};

WebGLCamera.prototype.revalidate=function()
{
this.container_width-=1;
this.canvasElement.style.width=(this.div_container.clientWidth+1)+'px';
this.canvas.renderFrame();
};

/**
 * Returns the pixel density of the camera. 
 * @return float The current pixel density. 
 */
WebGLCamera.prototype.getPixelDensity=function(){return this.pixelDensity;};

/**
 * Returns the width of the camera frame in pixels. 
 * @return int The width of the camera frame. 
 */
WebGLCamera.prototype.getWidth=function(){return this.width;};
/**
 * Returns the height of the camera frame in pixels. 
 * @return int The height of the camera frame. 
 */
WebGLCamera.prototype.getHeight=function(){return this.height;};

/**
 * Returns the current number of frames per second of the camera. 
 * @return float The frames per second. 
 */
WebGLCamera.prototype.getFPS=function()
{
	return 1/this.inverseFPS;
};

/**
 * Returns the regularized number of frames per second of the camera. It returns a more smooth measurement than the result of getFPS(). 
 * @return float The frames per second. 
 */
WebGLCamera.prototype.getFPSSmooth=function()
{
	return 1/this.inverseFPS_smooth;
};

/**
 * Pushes the model view matrix into a memory stack so that we can retrieve it later. It is equivalent to the openGL function glPushMatrix.
 */
WebGLCamera.prototype.pushMatrix=function() {
    var copy = mat4.create();
    mat4.set(this.mvMatrix, copy);
    this.mvMatrixStack.push(copy);
};

/**
 * Pops a model view matrix from the memory stack. It should be used in conjunction with the pushMatrix(). It is equivalent to the openGL function glPopMatrix.
 */
WebGLCamera.prototype.popMatrix=function() {
    if (this.mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    this.mvMatrix = this.mvMatrixStack.pop();
};

/**
 * Translates (moves) the model view coordinate system. It is equivalent to the openGL function glTranslate.
 * @param v An array of size 3 that contains the translation vector, i.e. the translation along x, y, and z. 
 */
WebGLCamera.prototype.translate=function(v)
{
	var a=this.mvMatrix;
	var d=v[0],e=v[1];v=v[2];
	a[12]=a[0]*d+a[4]*e+a[8]*v+a[12];a[13]=a[1]*d+a[5]*e+a[9]*v+a[13];a[14]=a[2]*d+a[6]*e+a[10]*v+a[14];a[15]=a[3]*d+a[7]*e+a[11]*v+a[15];	
};

/**
 * Rotates the model view coordinate system with respect to the current origin. It is equivalent to the openGL function glRotate.
 * @param b The rotation angle in radians.
 * @param c A unit vector of size 3 around of which the coordinate system will be rotated. 
 */
WebGLCamera.prototype.rotate=function(b,c)
{
	var a=this.mvMatrix;
	var e=c[0],g=c[1];c=c[2];var f=Math.sqrt(e*e+g*g+c*c);if(!f)return null;if(f!=1){f=1/f;e*=f;g*=f;c*=f}var h=Math.sin(b),i=Math.cos(b),j=1-i;b=a[0];f=a[1];var k=a[2],l=a[3],o=a[4],m=a[5],n=a[6],p=a[7],r=a[8],s=a[9],A=a[10],B=a[11],t=e*e*j+i,u=g*e*j+c*h,v=c*e*j-g*h,w=e*g*j-c*h,x=g*g*j+i,y=c*g*j+e*h,z=e*c*j+g*h;e=g*c*j-e*h;g=c*c*j+i;a[0]=b*t+o*u+r*v;a[1]=f*t+m*u+s*v;a[2]=k*t+n*u+A*v;a[3]=l*t+p*u+B*v;a[4]=b*w+o*x+r*y;a[5]=f*w+m*x+s*y;a[6]=k*w+n*x+A*y;a[7]=l*w+p*x+B*y;a[8]=b*z+o*e+r*g;a[9]=f*z+m*e+s*g;a[10]=k*z+n*e+A*g;a[11]=l*z+p*e+B*g;
};

/**
 * Rotates the model view coordinate system around X axis with respect to the current origin. It is equivalent to rotate(b,[1,0,0]).
 * @param b The rotation angle in radians.
 */
WebGLCamera.prototype.rotateX=function(b){this.rotate(b,[1,0,0]);};

/**
 * Rotates the model view coordinate system around Y axis with respect to the current origin. It is equivalent to rotate(b,[0,1,0]).
 * @param b The rotation angle in radians.
 */
WebGLCamera.prototype.rotateY=function(b){this.rotate(b,[0,1,0]);};

/**
 * Rotates the model view coordinate system around Z axis with respect to the current origin. It is equivalent to rotate(b,[0,0,1]).
 * @param b The rotation angle in radians.
 */
WebGLCamera.prototype.rotateZ=function(b){this.rotate(b,[0,0,1]);};

/**
 * Scales the model view coordinate system. It is equivalent to the openGL function glScale.
 * @param s An array of size 3 that contains the scaling factors, i.e. the scaling along x, y, and z. 
 */
WebGLCamera.prototype.scale=function(s)
{
	var a=this.mvMatrix;
	var d=s[0],e=s[1];s=s[2];a[0]*=d;a[1]*=d;a[2]*=d;a[3]*=d;a[4]*=e;a[5]*=e;a[6]*=e;a[7]*=e;a[8]*=s;a[9]*=s;a[10]*=s;a[11]*=s;
};

/**
 * Sets the model view coordinate system to the default state (identity matrix). It is equivalent to the openGL function glLoadIdenity.
 */
WebGLCamera.prototype.identity=function()
{
	var a=this.mvMatrix;a[0]=1;a[1]=0;a[2]=0;a[3]=0;a[4]=0;a[5]=1;a[6]=0;a[7]=0;a[8]=0;a[9]=0;a[10]=1;a[11]=0;a[12]=0;a[13]=0;a[14]=0;a[15]=1;
};

WebGLCamera.prototype.resize=function()
{
	//If the container div has been resized
	if(this.div_container.clientWidth!=this.container_width || this.div_container.clientHeight!=this.container_height)
	{	
		this.container_width=this.div_container.clientWidth;
		this.container_height=this.div_container.clientHeight;
		
		//make the size of the canvas to match the size of the div (in CSS pixels, not in actual device pixels)
		this.canvasElement.style.width=this.div_container.clientWidth+'px';
		this.canvasElement.style.height=this.div_container.clientHeight+'px';
		
		
		//calculate the rendering size of the corresponding pixels in the device
		this.width = Math.floor(this.canvasElement.clientWidth  * this.pixelDensity);
		this.height = Math.floor(this.canvasElement.clientHeight * this.pixelDensity);
		this.aspect_ratio=this.width/this.height;
		
		//c.println(this.canvasElement.clientWidth+' x '+this.canvasElement.clientHeight+' @ '+this.pixelDensity+' : '+this.width+' x '+this.height);
		
		//set the size of the image/canvas to be as many as the pixels of the device
		this.canvasElement.width = this.width;//this line may cause webGL to crash in low memory systems if there is a big resize
		this.canvasElement.height = this.height;//this line may cause webGL to crash in low memory systems if there is a big resize
		this.gl.viewportWidth = this.width;
		this.gl.viewportHeight = this.height;
		this.gl.viewport(0, 0, this.width,this.height);
			
		var el=this.canvasElement;
		for (var lx=0, ly=0; el != null; lx += el.offsetLeft, ly += el.offsetTop, el = el.offsetParent);
		this.left=lx;
		this.top=ly;

			
		if(this.projection_type==0) this.perspectiveProjection();
		else this.orthographicProjection();
		
		this.size_changed=true;
		this._projection_changed=true;
		this.projection_changed_stamp=this.lastTimeDraw;
	}
};

WebGLCamera.prototype.beginDraw=function()
{
	var timeNow = new Date().getTime();
	
	if (this.canvas._keeps_rendering) 
	{
		this.inverseFPS = (timeNow - this.lastTimeDraw)/1000;
		this.inverseFPS_smooth=this.inverseFPS_smooth*0.95+this.inverseFPS*0.05;
	}
	this.lastTimeDraw=timeNow;
	
	this.resize();

	if(!this._view_changed && this.mouse_pressed)
	{
		this.speed_xRot=0;
		this.speed_yRot=0;
		this.speed_zRot=0;
		this.speed_xTra=0;
		this.speed_yTra=0;
	}

	if(!this.mouse_pressed)
	{
		if(this.speed_yRot!=0 || this.speed_xRot!=0)
			this.rotateAnimation();
		if(this.speed_zRot!=0)
			this.rotateZAnimation();
		if(this.speed_xTra!=0 || this.speed_yTra!=0)
			this.translateAnimation();
		
		
		//this.rotateToNextObjectAnimation(Math.PI/2);
	}

	if(this._view_changed)
	{
		//console.log('view changed');
		mat4.identity(this.mvMatrix);
		this.rotate(this.next_object_rotation,[0,1,0]);
		this.translate([-this.viewer_position_x+this.screen_x, -this.viewer_position_y+this.screen_y, -this.viewer_position_z+this.screen_z]);
		this.translate([0.0, 0.0, -1.9]);
		this.translate([0.0, 0.0, 2.0]);
		//this.rotate(smooth_acc[0]*0.5, [0, 1, 0]);
		//this.rotate(smooth_acc[1]*0.5, [1, 0, 0]);
		
		//mat4.scale(this.mvMatrix, [this.zoom, this.zoom, this.zoom]);
		//mat4.rotate(this.mvMatrix, this.yRot* Math.PI / 180, [0, 1, 0]);
		//mat4.rotate(this.mvMatrix, this.xRot* Math.PI / 180, [1, 0, 0]);
		//mat4.translate(this.mvMatrix, [this.xTra, this.yTra, 0.0]);
    
		//THE FOLLOWING CODE IS TREATING THE DETERMINANT OF THE INTERACTION-MATRIX WITHOUT CHANGING THE RENDERING OF THE MODEL-VIEW MATRIX 
		//BY REPLACING Z TRANSLATION BY SCALE, 0.25 UNITS AT A TIME, SO THAT Z TRANSLATION IS AS CLOSE TO ZERO AS POSSIBLE.
		/*if( this.ixMatrix[14]<-0.25)// <-1 //8 && <-2
		{
			var n= mat4.create();
			mat4.identity(n);
			var cp = mat4.create();
			mat4.set(this.ixMatrix, cp);
			mat4.scale(n,[0.917,0.917,0.917]); //sqrt(sqrt(0.5))//sqrt(0.5)//0.5
			mat4.translate(n,[0,0,0.25]);//0.5//1//2
			mat4.multiply(n,cp,this.ixMatrix);
		}*/
		//UP TO HERE
    
		var m=this.ixMatrix;
		var det=m[0]*(m[5]*m[10]-m[9]*m[6])-m[4]*(m[1]*m[10]-m[9]*m[2])+m[8]*(m[1]*m[6]-m[5]*m[2]);
		this.zoom=Math.pow(det,1/3);
    
		//Update mvMatrix 
		var copy = mat4.create();
		mat4.set(this.mvMatrix, copy);
		mat4.multiply(copy,this.ixMatrix,this.mvMatrix);
		
		this.translate([0,0,this.rot_center_z]);
		this.rotate(this.xRot2,[1,0,0]);
		this.rotate(this.yRot2,[0,1,0]);
		this.translate([0,0,-this.rot_center_z]);
		
	}
	
};

WebGLCamera.prototype.setPseudoViewerPosition=function(x,y)
{
	x=x/2;
	y=y/2;
	this.viewer_position_x=x*0.01/0.075;
	this.viewer_position_y=y*0.01/0.075;
	this.viewer_projection_x=x*0.01;
	this.viewer_projection_y=y*0.01;
	mat4.frustum(-this.viewer_projection_x-this.screen_width2,-this.viewer_projection_x+this.screen_width2,-this.viewer_projection_y-this.screen_height2,-this.viewer_projection_y+this.screen_height2, this.viewer_projection_z, this.screen_far,this.pMatrix);
	
	this._projection_changed=true;
	this.projection_changed_stamp=new Date().getTime();
	
	//this._view_changed=true;
};

WebGLCamera.prototype.notifyProjectionChanged=function()
{
	if(this.projection_type==0) this.perspectiveProjection();
		else this.orthographicProjection();
	this._projection_changed=true;
	this.projection_changed_stamp=new Date().getTime();
	this.canvas.renderFrame();
};

WebGLCamera.prototype.endDraw=function()
{
	this._projection_changed=false;
	this._view_changed=false;
	this.size_changed=false;
	this._light_changed=false;
	
};

/**
 * Sets the projection mode to orthographic projection. 
 */
WebGLCamera.prototype.orthographicProjection=function()
{
	this.projection_type=1;
	mat4.ortho(-0.82*this.gl.viewportWidth / this.gl.viewportHeight, 0.82*this.gl.viewportWidth / this.gl.viewportHeight, -0.82,0.82,0.1,100.0, this.pMatrix);
	this._projection_changed=true;
	this.projection_changed_stamp=new Date().getTime();
};
 
/**
 * Sets the projection mode to perspective projection. 
 */
WebGLCamera.prototype.perspectiveProjection=function()
{
	this.projection_type=0;
	this.screen_width2 = (this.gl.viewportWidth / this.gl.viewportHeight)*this.screen_height2*this.canvas.getProjector().getWidthFactor();
	mat4.frustum(-this.viewer_projection_x-this.screen_width2,-this.viewer_projection_x+this.screen_width2,-this.viewer_projection_y-this.screen_height2,-this.viewer_projection_y+this.screen_height2, this.viewer_projection_z, this.screen_far,this.pMatrix);
		
	this._projection_changed=true;
	this.projection_changed_stamp=new Date().getTime();
};

WebGLCamera.prototype.STR_update=function()
{
	var tmp = mat4.create();
	mat4.identity(tmp);
	mat4.scale(tmp,[this.working_zoom,this.working_zoom,this.working_zoom]);
	mat4.translate(tmp,[this.xTra,this.yTra,0]);
	mat4.rotate(tmp,this.working_zRot,[0,0,1]);
	mat4.multiply(tmp,this.ixMatrix_mem,this.ixMatrix);
	
	this._view_changed=true;
};

WebGLCamera.prototype.R_update1=function(angle,axis,p)
{
	var tmp = mat4.create();
	mat4.identity(tmp);
	mat4.translate(tmp,[0,0,p]);
	mat4.rotate(tmp,angle,axis);
	mat4.translate(tmp,[0,0,-p]);
	mat4.multiply(tmp,this.ixMatrix_mem,this.ixMatrix);
	
	this._view_changed=true;
};

WebGLCamera.prototype.R_update2=function(angleX,angleY,p)
{
	var tmp = mat4.create();
	mat4.identity(tmp);
	mat4.translate(tmp,[0,0,p]);
	mat4.rotate(tmp,-angleX,[1,0,0]);
	mat4.rotate(tmp,-angleY,[0,1,0]);
	//mat4.rotate(tmp,-this.yRot2,[0,1,0]);
	//mat4.rotate(tmp,-this.xRot2,[1,0,0]);	
	mat4.translate(tmp,[0,0,-p]);
	mat4.multiply(tmp,this.ixMatrix_mem,this.ixMatrix);
	
	this._view_changed=true;
};

WebGLCamera.prototype.doTranslate=function(dx,dy)
 {
	this.xTra+=dx;
	this.yTra-=dy;
	
	this.speed_xTra=dx/this.inverseFPS;
	this.speed_yTra=dy/this.inverseFPS;
	
    this.STR_update();
 };

 WebGLCamera.prototype.translateAnimation=function()
 {
	this.xTra+=this.speed_xTra*this.inverseFPS;
	this.yTra-=this.speed_yTra*this.inverseFPS;
	
	//it will lose 15% of the power every 1/35 second 0.15*35=5.25. After 1 second it will be at the (1-0.15)^35=0.003 of the original speed.
	this.speed_xTra-=this.speed_xTra*5.25*this.inverseFPS; if(Math.abs(this.speed_xTra)<0.03) this.speed_xTra=0;
	this.speed_yTra-=this.speed_yTra*5.25*this.inverseFPS; if(Math.abs(this.speed_yTra)<0.03) this.speed_yTra=0;
	
    this.STR_update();
 };

WebGLCamera.prototype.rotateToNextObject=function(x)
{
	this.next_object_rotation=4/3*Math.PI*(this.original_mouseX[0]-x[0])/this.width;
	if(this.next_object_animation==1)
	{
		if(this.next_object_rotation>Math.PI*2/3) this.next_object_rotation=Math.PI*2/3;
		else if(this.next_object_rotation<0)this.next_object_rotation=0;
	}
	else if(this.next_object_animation==-1)
	{
		if(this.next_object_rotation<-Math.PI*2/3) this.next_object_rotation=-Math.PI*2/3;
		else if(this.next_object_rotation>0) this.next_object_rotation=0;
	}
	this._view_changed=true;
};
 
WebGLCamera.prototype.rotateToNextObjectAnimation=function(dx)
{
	this.next_object_rotation+=dx*this.inverseFPS;
	this._view_changed=true;
};
 
WebGLCamera.prototype.doRotate=function(dx,dy,z,type)
 {
	this.yRot+=dx;
	this.xRot+=dy;
	
	this.speed_yRot=dx/this.inverseFPS;
	this.speed_xRot=dy/this.inverseFPS;
	
	this.rot_center_z=z;
	this.rot_type=type;
	
	if(this.rot_type==1)
	{
		var mag=Math.sqrt(this.xRot*this.xRot+this.yRot*this.yRot);
		if(mag>0) this.R_update1(mag*4/this.zoom,[this.xRot/mag, this.yRot/mag,0],this.rot_center_z);
	}
	else
	{
		this.yRot2-=dx;
		this.xRot2-=dy;if(this.xRot2>1.57)this.xRot2=1.57;else if(this.xRot2<-1.57)this.xRot2=-1.57;
		this._view_changed=true;
		//this.R_update2(this.xRot*4/this.zoom,this.yRot*4/this.zoom,this.rot_center);
	}
 };
 
 WebGLCamera.prototype.rotateAnimation=function()
 {
	this.xRot+=this.speed_xRot*this.inverseFPS;
	this.yRot+=this.speed_yRot*this.inverseFPS;
	
	//it will lose 15% of the power every 1/35 second 0.15*35=5.25. After 1 second it will be at the (1-0.15)^35=0.003 of the original speed.
	this.speed_yRot-=this.speed_yRot*5.25*this.inverseFPS;if(Math.abs(this.speed_yRot)<0.03) this.speed_yRot=0;
	this.speed_xRot-=this.speed_xRot*5.25*this.inverseFPS;if(Math.abs(this.speed_xRot)<0.03) this.speed_xRot=0;
	
	if(this.rot_type==1)
	{
		var mag=Math.sqrt(this.xRot*this.xRot+this.yRot*this.yRot);
		if(mag>0) this.R_update1(mag*4/this.zoom,[this.xRot/mag, this.yRot/mag,0],this.rot_center_z);
	}
	else
	{
		this.xRot2-=this.speed_xRot*this.inverseFPS;if(this.xRot2>1.57)this.xRot2=1.57;else if(this.xRot2<-1.57)this.xRot2=-1.57;
		this.yRot2-=this.speed_yRot*this.inverseFPS;
		this._view_changed=true;
		
		//this.R_update2(dx*4/this.zoom,dy*4/this.zoom,this.rot_center);
	}
 };
 
WebGLCamera.prototype.rotateZ=function(dx)
 {
 	this.working_zRot+=dx;
 	
 	this.speed_zRot=dx/this.inverseFPS;
 	
	this.STR_update();
 };

 WebGLCamera.prototype.rotateZAnimation=function()
 {
 	this.working_zRot+=this.speed_zRot*this.inverseFPS;
 	
	//it will lose 15% of the power every 1/35 second 0.15*35=5.25. After 1 second it will be at the (1-0.15)^35=0.003 of the original speed.
 	this.speed_zRot-=this.speed_zRot*5.25*this.inverseFPS;if(Math.abs(this.speed_zRot)<0.03) this.speed_zRot=0;
 	
	this.STR_update();
 };
 
WebGLCamera.prototype.setRotation=function(dx,dy)
 {
	this.yRot=dx;
	this.xRot=dy;
	this._view_changed=true;
 };
 
WebGLCamera.prototype.zooming=function(dz)
 {
 	if(dz<1 && this.zoom<0.35) return;
 	else if(dz>1 && this.zoom>4) return;
 	
	this.working_zoom=dz;
	
	this.STR_update();
 };
 
WebGLCamera.prototype.relight=function(dx,dy)
 {
	this.yLig+=3.14*dx;
	this.xLig-=3.14*dy;
	if(this.xLig<-1.57) this.xLig=-1.57;
	else if(this.xLig>1.57) this.xLig=1.57;
	if(this.yLig<-1.57) this.yLig=-1.57;
	else if(this.yLig>1.57) this.yLig=1.57;
	this._light_changed=true;
};

/**
 * Sets the lighting direction.
 * @param dx The angle of the lighting direction around x axis.
 * @param dy The angle of the lighting direction around y axis.
 */
WebGLCamera.prototype.setLight=function(dx,dy)
 {
	this.yLig=dx;
	this.xLig=dy;
	this._light_changed=true;
};

/**
 * Returns the lighting direction as a unit vector.
 * @param Array The lighting direction as an array of size 3.
 */
WebGLCamera.prototype.getLightingDirection=function()
{
	return [Math.sin(this.yLig+this.smooth_acc[0])*Math.cos(this.xLig+this.smooth_acc[1]), Math.sin(this.xLig+this.smooth_acc[1]), Math.cos(this.yLig+this.smooth_acc[0])*Math.cos(this.xLig+this.smooth_acc[1]) ];
};

WebGLCamera.prototype._getOffsetX=function()
{
	var x = (window.pageXOffset !== undefined)
  ? window.pageXOffset
  : (document.documentElement || document.body.parentNode || document.body).scrollLeft;
  x-= (document.clientLeft || 0);
 return x;
};

WebGLCamera.prototype._getOffsetY=function()
{
var y = (window.pageYOffset !== undefined)
  ? window.pageYOffset
  : (document.documentElement || document.body.parentNode || document.body).scrollTop;
  y-= (document.clientTop || 0);
  return y;
};


WebGLCamera.prototype.setStandardPointerInteraction=function()
{
	var self=this;
	this.canvas.handleMouseMove=function(event){event.preventDefault();var x=new Array();var y=new Array();x[0]=self.pixelDensity*(event.clientX+self._getOffsetX()-self.left); y[0]=self.pixelDensity*(event.clientY+self._getOffsetY()-self.top); self.handlePointerMove(x,y);};
	this.canvas.handleMouseUp=function(event){self.handlePointerUp();};
	this.canvas.handleMouseDown=function(event){event.preventDefault();var x=new Array();var y=new Array();x[0]=self.pixelDensity*(event.clientX+self._getOffsetX()-self.left); y[0]=self.pixelDensity*(event.clientY+self._getOffsetY()-self.top);self.handlePointerDown(x,y);};
	this.canvas.handleMouseOut=function(event){self.handleMouseOut();};
	this.canvas.handleTouchStart=function(event){var xx=self._getOffsetX()-self.left;var yy=self._getOffsetY()-self.top;event.preventDefault();var x=new Array();var y=new Array();for(var i=0;i<event.targetTouches.length;i++){x[i]=self.pixelDensity*(event.targetTouches[i].clientX+xx);y[i]=self.pixelDensity*(event.targetTouches[i].clientY+yy);} /*self.handlePointerMove(x,y);*/self.handlePointerDown(x,y);};
	this.canvas.handleTouchEnd=function(event){self.handlePointerUp();};
	this.canvas.handleTouchMove=function(event){var xx=self._getOffsetX()-self.left;var yy=self._getOffsetY()-self.top;event.preventDefault();var x=new Array();var y=new Array();for(var i=0;i<event.targetTouches.length;i++){x[i]=self.pixelDensity*(event.targetTouches[i].clientX+xx);y[i]=self.pixelDensity*(event.targetTouches[i].clientY+yy);}self.handlePointerMove(x,y);};
	this.canvas.handleMouseWheel=function(event){event.preventDefault();self.canvas.onScroll(event);};
};


/**
 * It updates the camera by applying a orientation of the device to the projection matrix using the beta and gamma orientation parameters contained in the given DeviceOrientationEvent object. This method must be used inside an "onOrientationChange" function.
 * @param e The DeviceOrientationEvent object that corresponds to an "onOrientationChange" event.
 */
WebGLCamera.prototype.updatePerspective=function(e)
{
	if(this.projection_type==1)return;//orthographic

	/*//If DeviceMotionEvent is provided
	var m=Math.sqrt(e.accelerationIncludingGravity.x*e.accelerationIncludingGravity.x+e.accelerationIncludingGravity.y*e.accelerationIncludingGravity.y+e.accelerationIncludingGravity.z*e.accelerationIncludingGravity.z);
	if(m==0)return;
	var rotX=-Math.asin(e.accelerationIncludingGravity.y/m);
	var cosrotX=Math.cos(rotX);
	var rotY=-Math.asin(e.accelerationIncludingGravity.x/(m*cosrotX));
	var evt={alpha:0,beta:rotX*180/3.14,gamma:-rotY*180/3.14};*/
	
	//If DeviceOrientationEvent is provided
	if(e.gamma==null || e.beta==null) return;
	var rotY=-e.gamma*3.14/180;
	var rotX=e.beta*3.14/180;
	
	if(typeof(window.orientation)!=='undefined')
	{
		var orientation=window.orientation;
		if(orientation<0)orientation+=360;
		
		if(orientation==0) {rotX=rotX;rotY=rotY;}
		else if(orientation==270) {var tmp=rotY;rotY=rotX;rotX=-tmp;}
		else if(orientation==180) {rotX=-rotX;rotY=-rotY;}
		else if(orientation==90) {var tmp=rotY;rotY=-rotX;rotX=tmp;}
	}
	else{}

	if(rotX>3.1415/2.2 || rotX<-3.1415/8)return;
	
	rotX-=3.1415/4;

	//rotX=Math.tan(rotX);
	//rotY=Math.tan(rotY);
	
	var w=0.5;
	this.smooth_acc[0]=this.smooth_acc[0]*(1-w)+rotY*w;
	this.smooth_acc[1]=this.smooth_acc[1]*(1-w)+rotX*w;
	
	
	this._view_changed=true;
	
	this.acc_updated_since_last_touch=true;
	
	//if(!this.mouse_pressed)	this._updatePickingMap_now=true;
	
	this.setPseudoViewerPosition(this.smooth_acc[0]*12/*this.aspect_ratio*/,this.smooth_acc[1]*12);
	//this.setRotation(-smooth_acc[0]*30,smooth_acc[1]*30);
};

/**
 * It updates the camera by applying a two finger rotation around Z axis using the coordinates of the fingers as captured by a given WebGLEvent object. This method must be used inside an "onDrag" function.
 * @param e The WebGLEvent object that corresponds to an "onDrag" event.
 */
WebGLCamera.prototype.twoFingerRotate=function(e)
{
	if(e.dx.length<2)return;
	
	if(e.pointer_distance>0)
	{
		var zrot=Math.atan2(((this.mouseY[0]-this.mouseY[1])/this.finger_distance),((this.mouseX[0]-this.mouseX[1])/this.finger_distance))-Math.atan2(((e.y[0]-e.y[1])/e.pointer_distance),((e.x[0]-e.x[1])/e.pointer_distance));
		
		this.zRot+=zrot;
		if(Math.abs(this.zRot)>Math.PI/15) this.enable_rotateZ=true;
		if(this.enable_rotateZ) this.rotateZ(zrot);
		
		this.finger_distance=e.pointer_distance;
	}
};

/**
 * It updates the camera by applying a two finger zoom in/out using the coordinates of the fingers as captured by a given WebGLEvent object. This method must be used inside an "onDrag" function.
 * @param e The WebGLEvent object that corresponds to an "onDrag" event.
 */
WebGLCamera.prototype.twoFingerZoom=function(e)
{
	if(e.dx.length<2)return;
	if(e.original_event.pointer_distance>0)
	this.zooming(e.pointer_distance/e.original_event.pointer_distance);
};

/**
 * It updates the camera by applying a two finger translation on the X-Y plane using the coordinates of the fingers as captured by a given WebGLEvent object. This method must be used inside an "onDrag" function.
 * @param e The WebGLEvent object that corresponds to an "onDrag" event.
 */
WebGLCamera.prototype.twoFingerMove=function(e)
{
	if(e.dx.length<2)return;
	this.doTranslate(((e.x[0]+e.x[1])-(this.mouseX[0]+this.mouseX[1]))/(2*this.height),((e.y[0]+e.y[1])-(this.mouseY[0]+this.mouseY[1]))/(2*this.height));
};

/**
 * It updates the camera by applying a single finger translation on the X-Y plane using the coordinates of the fingers as captured by a given WebGLEvent object. This method must be used inside an "onDrag" function.
 * @param e The WebGLEvent object that corresponds to an "onDrag" event.
 */
WebGLCamera.prototype.oneFingerMove=function(e)
{
	this.doTranslate(e.dx[0],e.dy[0]);
};

/**
 * It updates the camera by applying a single finger rotation using the coordinates of the fingers as captured by a given WebGLEvent object. This method must be used inside an "onDrag" function.
 * @param e The WebGLEvent object that corresponds to an "onDrag" event.
 * @param options Optionally, you can provide as an object one or more of the following parameters: type ('free', which is the default, or 'polar') to specify the type of rotation, radius (a non negative real number, default is 0) to indicate the radius of the rotation trajectory, and speed (a positive real number, default is 1) to amplify (>1) or reduce (<1) the default speed of rotation. Example: oneFingerRotate(e,{type: 'polar', radius: 2});
 */
WebGLCamera.prototype.oneFingerRotate=function(e,options)
{
	var t=1;
	var speed=1;
	if(typeof options==='undefined')options={};
	if(typeof options.speed!=='undefined')speed=options.speed;
	var dx=e.dx[0]*speed;
	var dy=e.dy[0]*speed;
	if(typeof options.type!=='undefined')
	{
		if(options.type=='polar') t=2;
		if(t!=1)
		{
			var mag1=Math.sqrt(dx*dx+dy*dy);
			var a=mat4.multiplyVec4(this.ixMatrix,[dx,dy,0,0]);
			dx=a[0];
			dy=a[1];
			var mag2=Math.sqrt(dx*dx+dy*dy);
			if(mag2!=0)
			{
			dx=dx*mag1/mag2;
			dy=dy*mag1/mag2;
			}
		}
	}
	if(typeof options.radius !=='undefined') this.doRotate(dx,dy,-options.radius,t);
	else this.doRotate(dx,dy,0,t);
};

/**
 * It updates the camera by applying a single finger zoom in/out using the coordinates of the fingers as captured by a given WebGLEvent object. This method must be used inside an "onDrag" function.
 * @param e The WebGLEvent object that corresponds to an "onDrag" event.
 */
WebGLCamera.prototype.oneFingerZoom=function(e)
{
	this.zooming(this.working_zoom*(1+e.dy[0]));
};

/**
 * It updates the lighting direction by applying a single finger rotation using the coordinates of the fingers as captured by a given WebGLEvent object. This method must be used inside an "onDrag" function.
 * @param e The WebGLEvent object that corresponds to an "onDrag" event.
 */
WebGLCamera.prototype.oneFingerRelight=function(e)
{
	this.relight(e.dx[0],e.dy[0]);
};

/**
 * It updates the camera by applying a zoom in/out using the amount of scroll as captured by a mouse wheel event. This method must be used inside the canvas "onScroll" function.
 * @param e The event object that corresponds to an "mousewheel" event.
 */
WebGLCamera.prototype.zoomByScroll=function(e)
{
	if(e.deltaY>0 && this.zoom<=0.35) return;
 	else if(e.deltaY<0 && this.zoom>=4) return;
	var dz=1-event.deltaY/this.height;
	if(this.zoom*dz<0.35) dz=0.35/this.zoom;
	else if(this.zoom*dz>4) dz=4/this.zoom;
	var tmp = mat4.create();
	mat4.identity(tmp);
	mat4.scale(tmp,[dz,dz,dz]);
	mat4.set(this.ixMatrix,this.ixMatrix_mem);
	mat4.multiply(tmp,this.ixMatrix_mem,this.ixMatrix);
	this._view_changed=true;
};

WebGLCamera.prototype.handlePointerMove=function(x,y)
	{
		var moved_before=this.mouse_moved;
		var e=new WebGLEvent();
		e.setPointers(x,y);
		e.mouse_pressed=this.mouse_pressed;
		this.canvas.onMove(e);
		
		if(Math.abs(this.original_mouseX[0]-x[0])>10 || Math.abs(this.original_mouseY[0]-y[0])>10)
		{
			this.mouse_moved=true;
		}
		if(this.mouse_pressed==true)
		{
			if(!moved_before && this.mouse_moved)
			{
				if(this.original_event.object!=null)
				{
					this.original_event.object.onDragStart(this.original_event);
				}
				this.canvas.onDragStart(this.original_event);
			}
			
			var dx=new Array(x.length);
			var dy=new Array(y.length);
			for(var i=0;i<dx.length;i++)
			{
				dx[i]=(x[i]-this.mouseX[i])/(this.height);
				dy[i]=(y[i]-this.mouseY[i])/(this.height);
			}
			
			e.dx=dx;
			e.dy=dy;
			e.object=this.original_event.object;
			e.original_event=this.original_event;
			if(dx.length==2)e.pointer_distance=Math.sqrt((x[0]-x[1])*(x[0]-x[1])+(y[0]-y[1])*(y[0]-y[1]));		
					
			if(this.original_event.object!=null)
				this.original_event.object.onDrag(e);
			this.canvas.onDrag(e);
			
			//if(this.next_object_animation!=0)this.rotateToNextObject(x);
		}
		else
		{
			var o=this.canvas.roii.getObjectAt(x[0],y[0]);
			if(o!=this.mouse_over_object)
			{
				if(this.mouse_over_object!=null)
				{
					e.object=this.mouse_over_object;
					this.mouse_over_object.onMouseLeave(e);
				}
				if(o!=null)
				{	
					e.object=o;
					o.onMouseEnter(e);
				}
				this.mouse_over_object=o;
				
			}
		}
		
		this.mouseX = x;
       	this.mouseY = y;
	}
	
WebGLCamera.prototype.handlePointerUp=function()
	{
		if(!this.mouse_moved)
		{
			if(this.original_event && !this.original_event._keeps_changing)
			{
				if(this.original_event.object!=null)this.original_event.object.onTap(this.original_event);
				this.canvas.onTap(this.original_event);
			}
		}
		else
		{
			var e=new WebGLEvent(this.original_event.object);
			e.setPointers(this.mouseX,this.mouseY);
			e.original_event=this.original_event;
				
			if(this.original_event.object!=null)
				this.original_event.object.onDragEnd(e);
				
			this.canvas.onDragEnd(e);
		}
		
		this.mouse_pressed=false;
		this.canvas.renderFrame();
	}
	
WebGLCamera.prototype.handlePointerDown=function(x,y)
	{
		if(this.acc_updated_since_last_touch)
		{
			this.canvas.updatePickingMap();
			this.acc_updated_since_last_touch=false;
		}
		
		this.mouse_moved=false;
		this.mouse_pressed=true;
		this.mouseX = x;
		this.mouseY = y;
		this.original_mouseX=x;
		this.original_mouseY=y;
		this.xRot=0;
		this.yRot=0;
		this.zRot=0;
		this.xTra=0;
		this.yTra=0;
		this.original_event=new WebGLEvent();
		this.original_event.mouse_pressed=true;
		this.original_event._keeps_changing=this._keeps_changing;
		this.original_event.setPointers(x,y);
		this.original_event.object=this.canvas.roii.getObjectAt(x[0],y[0]);
		
		this.speed_xRot=0;
		this.speed_yRot=0;
		this.speed_zRot=0;
		this.speed_xTra=0;
		this.speed_yTra=0;
		this.next_object_animation=0;
		
		this.enable_rotateZ=false;
		if(x.length==2)
		{
			this.original_finger_distance=Math.sqrt((x[0]-x[1])*(x[0]-x[1])+(y[0]-y[1])*(y[0]-y[1]));
			this.original_event.pointer_distance=this.original_finger_distance;
			this.finger_distance=this.original_finger_distance;
		}
		else if(x.length==1)
		{
			this.original_finger_distance=0;
			this.finger_distance=0;
			
			
			/*if(x[0]>this.width*0.85)
				this.next_object_animation=1;
			else if(x[0]<this.width*0.15)
				this.next_object_animation=-1;
			else*/ this.next_object_animation=0;
		}
		
		
		
		mat4.set(this.ixMatrix,this.ixMatrix_mem);
		this.zoom_mem=this.zoom;
		this.working_zoom=1;
		this.working_zRot=0;
		this.canvas.onTouch(this.original_event);
		return false;
	};
	
WebGLCamera.prototype.handleMouseOut=function()
{	
	if(this.mouse_pressed)
	{
		if(!this.mouse_moved)
		{
			if(!this.original_event._keeps_changing)
			{
				if(this.original_event.object!=null)this.original_event.object.onTap(this.original_event);
				this.canvas.onTap(this.original_event);
			}
		}
		else
		{
			var e=new WebGLEvent(this.original_event.object);
			e.setPointers(this.mouseX,this.mouseY);
			e.original_event=this.original_event;
				
			if(this.original_event.object!=null)
				this.original_event.object.onDragEnd(e);
				
			this.canvas.onDragEnd(e);
		}
	}
	this.mouse_pressed=false;
	this.canvas.renderFrame();
};

WebGLCamera.prototype.pointerIsDown=function()
{
	return this.mouse_pressed;
};

function WebGLEvent(obj)
{
	this.object=obj;
	this.mouse_pressed=false;
	this.x=[];
	this.y=[];
	this.pointer_distance=0;
	this.original_event=false;
}

WebGLEvent.prototype.getNumOfPointers=function(){return this.x.length;};

WebGLEvent.prototype.setPointers=function(x,y)
{
	this.x=x;
	this.y=y;
};

function WebGLKeyFrame(type,val1,val2,speed,repetitions)
{
	if(typeof type!=='string') return;
	
	if(type=='interpolate')
	{
		this.animation_cycle=0;
	
		this.repetitions=1;	
		if(typeof repetitions!=='undefined')this.repetitions=repetitions;

		this.speed=1;
		if(typeof speed!=='undefined')this.speed=speed;
		
		this.current_value=new Array(val1.length);
		this.current_goal=new Array(val1.length);
		this.min_goal=new Array(val1.length);
		this.max_goal=new Array(val1.length);
		this.delta=new Array(val1.length);
		for(var i=0;i<val1.length;i++)
		{
			this.current_value[i]=0;
			this.min_goal[i]=val1[i];
			this.max_goal[i]=val2[i];
			this.current_goal[i]=this.max_goal[i];
			this.delta[i]=Math.abs(this.max_goal[i]-this.min_goal[i]);
		}
	
		var self=this;
		this.animate=function(invfps)
		{
			for(var i=0;i<this.current_value.length;i++)
			{
				if(this.current_goal[i]>this.current_value[i])
				{
					this.current_value[i]+=this.delta[i]*invfps*this.speed;
					if(this.current_value[i]>=this.current_goal[i])
					{
						this.current_value[i]=this.current_goal[i];
						this.current_goal[i]=this.min_goal[i];
						if(i==0){this.animation_cycle+=1;}//console.log(this.animation_cycle+' '+this.delta[i]+' '+this.current_value[i]);}
					}
				}
				else
				{
					this.current_value[i]-=this.delta[i]*invfps*this.speed;
					if(this.current_value[i]<=this.current_goal[i])
					{
						this.current_value[i]=this.current_goal[i];
						this.current_goal[i]=this.max_goal[i];
						if(i==0){this.animation_cycle+=1;}//console.log(this.animation_cycle+' '+this.delta[i]+' '+this.current_value[i]);}
					}
				}
			}
			self.onValueChange();
		};
		
		this.isFinished=function()
		{
			if(this.animation_cycle>=this.repetitions*2) return true; else return false;
		};
		
		this.start=function()
		{
			for(var i=0;i<this.current_value.length;i++)
			{
				this.current_value[i]=0;
				this.current_goal[i]=this.max_goal[i];
			}
			
			this.onStart();
			for(var i=0;i<this.current_value.length;i++)
			{
				if(this.max_goal[i]==this.min_goal[i])
					this.delta[i]=Math.abs(this.current_value[i]-this.current_goal[i]);
			}
			this.animation_cycle=0;
		};
	}
}
WebGLKeyFrame.prototype.getPhase=function(){if(this.animation_cycle%2==0)return 0; else return 1;};
WebGLKeyFrame.prototype.setValue=function(id,value){this.current_value[id]=value;};
WebGLKeyFrame.prototype.getValue=function(id){return this.current_value[id];};
WebGLKeyFrame.prototype.onValueChange=function(){};
WebGLKeyFrame.prototype.onStart=function(){};
WebGLKeyFrame.prototype.start=function(){this.onStart();};
WebGLKeyFrame.prototype.animate=function(){};
WebGLKeyFrame.prototype.isFinished=function(){return true;};

function WebGLAnimation(canvas)
{
	this.canvas=canvas;
	this.gl=canvas.gl;
	this.camera=canvas.camera;
	this.keyframe_now=-1;	
	this.loop=false;
	this.keyframes=new Array();
	this.pause_during_user_interaction=false;
}

WebGLAnimation.prototype.pauseDuringUserInteraction=function(){this.pause_during_user_interaction=true;};

WebGLAnimation.prototype.load=function(){this.onSetup();};

WebGLAnimation.prototype.addKeyFrame=function(keyframe){this.keyframes.push(keyframe);};

WebGLAnimation.prototype.setLoop=function(flag){this.loop=flag;};

WebGLAnimation.prototype.start=function()
{
	if(this.keyframes.length==0) return;

	if(this.isPlaying()) return;
	
	this.onStart();
	//-----
	this.keyframe_now=0;
	this.keyframes[this.keyframe_now].start();
	this.canvas.renderFrame();
};

WebGLAnimation.prototype.isPlaying=function()
{
	if(this.keyframe_now>-1) return true; else return false;
};

WebGLAnimation.prototype.stop=function()
{
	this.keyframe_now=-1;
	this.canvas.renderFrame();
};

WebGLAnimation.prototype.animate=function()
{
	if(this.keyframe_now==-1) return;
	
	if(this.keyframes[this.keyframe_now].isFinished())
	{
		this.keyframe_now+=1;
		if(this.keyframe_now==this.keyframes.length)
		{
			if(this.loop)
				this.keyframe_now=0;
			else
			{
				this.stop();
				return;
			}
		}
		this.keyframes[this.keyframe_now].start();
	}
	this.keyframes[this.keyframe_now].animate(this.camera.inverseFPS);
	this.canvas.renderFrame();
};

WebGLAnimation.prototype.draw=function()
{
	if(this.canvas.renderingPickingMap()) return;
	if(this.keyframe_now==-1) return;
	if(this.pause_during_user_interaction && this.camera.mouse_pressed) return;
	this.onDraw();
	this.animate();
}

WebGLAnimation.prototype.onSetup=function(){};
WebGLAnimation.prototype.onStart=function(){};
WebGLAnimation.prototype.onDraw=function(){};

function WebGLLoadingAnimation(canvas)
{
	this.hide=false;
	this.canvas=canvas;
	this.rot=0;
	this.loading_obj=null;
	this.loading_obj2=null;
	      
	var _obj=new WebGLObject(this.canvas);
	var _xyz=new Float32Array(20*3);
	var _uv=new Float32Array(20*2);
	var _tri=new Uint16Array(10*3);
	var sz=0.5;
	
	//Front
	_xyz[0]=sz/2.0; _xyz[1]=sz/2.0; _xyz[2]=+sz/2;
	_xyz[3]=-sz/2.0; _xyz[4]=sz/2.0; _xyz[5]=+sz/2;
	_xyz[6]=-sz/2.0; _xyz[7]=-sz/2.0; _xyz[8]=+sz/2;
	_xyz[9]=sz/2.0; _xyz[10]=-sz/2.0; _xyz[11]=+sz/2;
	
	_tri[0]=0;_tri[1]=1;_tri[2]=2;
	_tri[3]=0;_tri[4]=2;_tri[5]=3;
	
	_uv[0]=0.49;_uv[1]=0.62;
	_uv[2]=0.027;_uv[3]=0.785;
	_uv[4]=0.028;_uv[5]=0.335;
	_uv[6]=0.485;_uv[7]=0.07;
	
	//Back
	_xyz[12]=-sz/2.0; _xyz[13]=sz/2.0; _xyz[14]=-sz/2;
	_xyz[15]=sz/2.0; _xyz[16]=sz/2.0; _xyz[17]=-sz/2;
	_xyz[18]=sz/2.0; _xyz[19]=-sz/2.0; _xyz[20]=-sz/2;
	_xyz[21]=-sz/2.0; _xyz[22]=-sz/2.0; _xyz[23]=-sz/2;
	
	_tri[6]=4;_tri[7]=5;_tri[8]=6;
	_tri[9]=4;_tri[10]=6;_tri[11]=7;
	
	_uv[8]=0.49;_uv[9]=0.62;
	_uv[10]=0.027;_uv[11]=0.785;
	_uv[12]=0.028;_uv[13]=0.335;
	_uv[14]=0.485;_uv[15]=0.07;
	
	//Left
	_xyz[24]=-sz/2.0; _xyz[25]=sz/2.0; _xyz[26]=+sz/2;
	_xyz[27]=-sz/2.0; _xyz[28]=sz/2.0; _xyz[29]=-sz/2;
	_xyz[30]=-sz/2.0; _xyz[31]=-sz/2.0; _xyz[32]=-sz/2;
	_xyz[33]=-sz/2.0; _xyz[34]=-sz/2.0; _xyz[35]=+sz/2;
	
	_tri[12]=9;_tri[13]=10;_tri[14]=11;
	_tri[15]=8;_tri[16]=9;_tri[17]=11;
	
	_uv[16]=0.965;_uv[17]=0.81;
	_uv[18]=0.525;_uv[19]=0.62;
	_uv[20]=0.525;_uv[21]=0.06;
	_uv[22]=0.965;_uv[23]=0.33;
	
	//Right
	_xyz[36]=sz/2.0; _xyz[37]=sz/2.0; _xyz[38]=-sz/2;
	_xyz[39]=sz/2.0; _xyz[40]=sz/2.0; _xyz[41]=+sz/2;
	_xyz[42]=sz/2.0; _xyz[43]=-sz/2.0; _xyz[44]=+sz/2;
	_xyz[45]=sz/2.0; _xyz[46]=-sz/2.0; _xyz[47]=-sz/2;
	
	_tri[18]=13;_tri[19]=14;_tri[20]=15;
	_tri[21]=12;_tri[22]=13;_tri[23]=15;
	
	_uv[24]=0.965;_uv[25]=0.81;
	_uv[26]=0.525;_uv[27]=0.62;
	_uv[28]=0.525;_uv[29]=0.06;
	_uv[30]=0.965;_uv[31]=0.33;
	
	//Top
	_xyz[48]=sz/2.0; _xyz[49]=sz/2.0; _xyz[50]=-sz/2;
	_xyz[51]=-sz/2.0; _xyz[52]=sz/2.0; _xyz[53]=-sz/2;
	_xyz[54]=-sz/2.0; _xyz[55]=sz/2.0; _xyz[56]=+sz/2;
	_xyz[57]=sz/2.0; _xyz[58]=sz/2.0; _xyz[59]=+sz/2;
	
	_tri[24]=16;_tri[25]=17;_tri[26]=18;
	_tri[27]=16;_tri[28]=18;_tri[29]=19;
	
	_uv[32]=0.65;_uv[33]=0.86;
	_uv[34]=0.35;_uv[35]=0.86;
	_uv[36]=0.35;_uv[37]=0.74;
	_uv[38]=0.65;_uv[39]=0.74;
	
	_obj.setXYZ(_xyz);
	_obj.setTriangles(_tri);
	_obj.setUV(_uv);
	_obj.setTexture((('https:' == document.location.protocol) ? 'https:' : 'http:')+'//digitalepigraphy.github.io/visineat/js/img/VNlogo256.png');
	this.loading_obj=_obj;
	
	var n=64;
	_obj=new WebGLObject(this.canvas);
	_xyz=new Float32Array(n*2*3);
	var _clr=new Float32Array(n*2*3);
	_tri=new Uint16Array(n*2*3);
	
	for(var i=0;i<n;i++)
	{
		_xyz[i*6]=Math.cos(-i*2*Math.PI/n)*(0.75-0.1*i/n);
		_xyz[i*6+1]=Math.sin(-i*2*Math.PI/n)*(0.75-0.1*i/n);
		_xyz[i*6+2]=-i/n;
		_xyz[i*6+3]=Math.cos(-i*2*Math.PI/n)*(0.7-0.1*i/n);
		_xyz[i*6+4]=Math.sin(-i*2*Math.PI/n)*(0.7-0.1*i/n);
		_xyz[i*6+5]=-i/n;
		
		_clr[i*6]=1-0.6*(1-i/n);
		_clr[i*6+1]=1-0.6*(1-i/n);
		_clr[i*6+2]=1-0.47*(1-i/n);
		_clr[i*6+3]=1-0.6*(1-i/n);
		_clr[i*6+4]=1-0.6*(1-i/n);
		_clr[i*6+5]=1-0.47*(1-i/n);
	}
		
	for(var i=0;i<n-1;i++)
	{
		_tri[i*6]=i*2;_tri[i*6+1]=i*2+1;_tri[i*6+2]=(i+1)*2;
		_tri[i*6+3]=(i+1)*2;_tri[i*6+4]=i*2+1;_tri[i*6+5]=(i+1)*2+1;
	}
	
	
	
	_obj.setXYZ(_xyz);
	_obj.setTriangles(_tri);
	_obj.setColors(_clr);
	this.loading_obj2=_obj;
}

WebGLLoadingAnimation.prototype.draw=function()
{
	if(this.hide)return;
	var p=mat4.create();
	var gl=this.canvas.gl;
	var cam=this.canvas.getCamera();
	gl.disable(gl.DEPTH_TEST);
	mat4.frustum(0-cam.screen_width2,0+cam.screen_width2,0-cam.screen_height2,0+cam.screen_height2, cam.viewer_projection_z, cam.screen_far,p);
	this.loading_obj.getShader().setProjection(p);
	
	var m=mat4.create();
	mat4.identity(m);
	mat4.translate(m,[0,0,-3]);
	this.rot+=this.canvas.camera.inverseFPS;
	mat4.rotate(m,Math.PI/8,[1,0,0]);
	mat4.rotate(m,this.rot,[0,1,0]);
	this.loading_obj.getShader().setModelView(m);
	gl.enable(gl.CULL_FACE);
	this.loading_obj.draw();
	
	this.loading_obj2.getShader().setProjection(p);
	m=mat4.create();
	mat4.identity(m);
	mat4.translate(m,[0,0,-3]);
	mat4.rotate(m,4*this.rot,[0,0,1]);
	this.loading_obj2.getShader().setModelView(m);
	this.loading_obj2.draw();
	gl.enable(gl.DEPTH_TEST); 
	
	this.canvas.renderFrame();
};

 function WebGLBeams(gl_canvas)
 {
	this.camera=gl_canvas.camera;
	this.canvas=gl_canvas;
	this.hide=false;
	
	this.mvMatrix = mat4.create();
	
	this.obj=new WebGLObject(this.canvas);
	var xyz=new Float32Array(11*11*3*2);
	var clr=new Float32Array(11*11*3*2);
	var tri=new Uint16Array(11*11*2);
	var idx=0;
	var idx2=0;
	var idx3=0;
	for(var i=-5;i<=5;i++)
	{
		for(var j=-5;j<=5;j++)
		{
			
			xyz[idx]=i*0.4;
			xyz[idx+1]=j*0.4;
			xyz[idx+2]=-1;
			idx+=3;
			xyz[idx]=i*0.4;
			xyz[idx+1]=j*0.4;
			xyz[idx+2]=1;
			idx+=3;
			tri[idx2]=idx2;
			idx2+=1;
			tri[idx2]=idx2;
			idx2+=1;
			clr[idx3]=0;
			clr[idx3+1]=0;
			clr[idx3+2]=0;
			idx3+=3;
			clr[idx3]=1;
			clr[idx3+1]=1;
			clr[idx3+2]=0;
			idx3+=3;
		}
	}
	this.obj.setXYZ(xyz);
	this.obj.setLines(tri);
	this.obj.setColors(clr);
}
  
 WebGLBeams.prototype.setVisible=function(flag){this.hide=!flag;};
  
 WebGLBeams.prototype.draw=function()
 {
	if(this.hide)return;
	this.obj.getShader().updateProjection();
	mat4.identity(this.mvMatrix);
	mat4.translate(this.mvMatrix, [0.0, 0.0, -2]);
	mat4.rotate(this.mvMatrix, this.canvas.camera.xLig, [-1, 0, 0]);
    mat4.rotate(this.mvMatrix, this.canvas.camera.yLig, [0, 1, 0]);
	this.obj.getShader().setModelView(this.mvMatrix);
	this.obj.draw();
 };

function WebGLWatermark(canvas)
{
	this.canvas=canvas;
	this.logo_obj=null;
	
	this.logo_obj=new WebGLObject(canvas);
	this.logo_obj.createRect(0.2,0.2,1,1);
	this.logo_obj.setTexture((('https:' == document.location.protocol) ? 'https:' : 'http:')+'//digitalepigraphy.github.io/visineat/js/img/VNlogo_mask.png',true);
	this.logo_obj.getShader().useLighting(false);
	this.logo_obj.getShader().useTexture(true);
	var m=mat4.create();
	mat4.identity(m);
	mat4.translate(m,[1.13,-1.13,-3]);
	this.logo_obj.getShader().setModelView(m);
	m=mat4.create();
	mat4.perspective(45, 1, 0.1, 100.0, m);
	this.logo_obj.getShader().setProjection(m);
	this.logo_obj.getShader().setColorMask([1,1,1,0.1]);
}

WebGLWatermark.prototype.draw=function()
{
	var gl=this.canvas.gl;
	gl.disable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);
	this.logo_obj.draw();
	gl.enable(gl.DEPTH_TEST);
};

function WebGLBackground(canvas)
{
	this.canvas=canvas;
	this.bkg=new WebGLObject(this.canvas);
	this.bkg.disablePicking(true);
	this.bkg.setXYZ([-1.0, -1.0,  0, 1.0, -1.0,  0, 1.0,  1.0,  0, -1.0,  1.0,  0]);
	this.bkg.setTriangles([0, 1, 2, 0, 2, 3]);
	this.bkg.setColors([0.2,0.2,0.2,0.2,0.2,0.2,1,1,1,1,1,1]);
	var m=mat4.create();
	mat4.identity(m);
	mat4.translate(m,[0,0,-2.4]);
	this.bkg.getShader().setModelView(m);
	m=mat4.create();
	mat4.perspective(45, 1, 0.1, 100.0, m);
	this.bkg.getShader().setProjection(m);
}

WebGLBackground.prototype.setColor=function(r,g,b)
{
	this.bkg.getShader().setColorMask([r*1.4,g*1.4,b*1.4,1]);
}

WebGLBackground.prototype.draw=function()
{
	var gl=this.canvas.gl;
	gl.disable(gl.DEPTH_TEST);
	this.bkg.draw();
	gl.enable(gl.DEPTH_TEST);
};

/**
 * This class a webGL shader. It should be used in conjunction with a WebGLObject.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var shader=object.getShader();<br>
 * shader.setModelView(mv_matrix);<br></font>
 * @param gl_canvas A WebGLCanvas object.
 * @param vertex_shader An Array of strings that describe a vertex shader in GLSL. (Optional argument)
 * @param fragment_shader An Array of strings that describe a fragment shader in GLSL. (Optional argument)
 */
function WebGLShader(gl_canvas,vertex_shader,fragment_shader)
{
	this.canvas=gl_canvas;
	this.camera=this.canvas.camera;
	this.gl=this.canvas.gl;
	this.univars={};
	this.attrs={};
	this.vertex_shader_src="";
	this.fragment_shader_src="";
	this.shaderProgram=null;
	this.createShader(vertex_shader,fragment_shader);
	this.pMatrixStamp=0;
	this.updateProjection();
}

//STATIC CONSTANTS:
WebGLShader.UV=2;
WebGLShader.COLORS=4;
WebGLShader.MAP=8;
WebGLShader.TIMESTAMPS=16;
WebGLShader.CULL=32;
WebGLShader.AMBIENT=64;
WebGLShader.DIFFUSE=128;
WebGLShader.SPECULAR=256;
WebGLShader.MATCAP=512;
WebGLShader.REFLECTION=1024;

WebGLShader.prototype.createUniform=function(name)
{
	this.univars[name]=this.gl.getUniformLocation(this.shaderProgram, name);
};
/**
 * Sets a value to a uniform integer or boolean parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @v The value to be assigned (integer or boolean).
 */
WebGLShader.prototype.setUniform1i=function(name,v)
{this.gl.uniform1i(this.univars[name], v);};
/**
 * Sets a value to a uniform integer or boolean parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @v The value to be assigned as an array of one integer or one boolean.
 */
WebGLShader.prototype.setUniform1iv=function(name,v)
{this.gl.uniform1iv(this.univars[name], v);};
/**
 * Sets a value to a uniform float parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @v The value to be assigned as a float.
 */
WebGLShader.prototype.setUniform1f=function(name,v)
{this.gl.uniform1f(this.univars[name], v);};
/**
 * Sets a value to a uniform float parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @v The value to be assigned as an array of one float.
 */
WebGLShader.prototype.setUniform1fv=function(name,v)
{this.gl.uniform1fv(this.univars[name], v);};
/**
 * Sets a value to a uniform 2D integer parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @i1 The value to be assigned to the first component of the vector.
 * @i2 The value to be assigned to the second component of the vector.
 */
WebGLShader.prototype.setUniform2i=function(name,i1,i2)
{this.gl.uniform2i(this.univars[name], i1,i2);};
/**
 * Sets a value to a uniform 2D integer parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @v The value to be assigned as an array of two integers.
 */
WebGLShader.prototype.setUniform2iv=function(name,v)
{this.gl.uniform2iv(this.univars[name], v);};
/**
 * Sets a value to a uniform 2D float parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @f1 The value to be assigned to the first component of the vector.
 * @f2 The value to be assigned to the second component of the vector.
 */
WebGLShader.prototype.setUniform2f=function(name,f1,f2)
{this.gl.uniform2f(this.univars[name], f1,f2);};
/**
 * Sets a value to a uniform 2D float parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @v The value to be assigned as an array of two floats.
 */
WebGLShader.prototype.setUniform2fv=function(name,v)
{this.gl.uniform2fv(this.univars[name], v);};
/**
 * Sets a value to a uniform 3D integer parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @i1 The value to be assigned to the first component of the vector.
 * @i2 The value to be assigned to the second component of the vector.
 * @i3 The value to be assigned to the third component of the vector.
 */
WebGLShader.prototype.setUniform3i=function(name,i1,i2,i3)
{this.gl.uniform3i(this.univars[name], i1,i2,i3);};
/**
 * Sets a value to a uniform 2D integer parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @v The value to be assigned as an array of three integers.
 */
WebGLShader.prototype.setUniform3iv=function(name,v)
{this.gl.uniform3iv(this.univars[name], v);};
/**
 * Sets a value to a uniform 3D float parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @f1 The value to be assigned to the first component of the vector.
 * @f2 The value to be assigned to the second component of the vector.
 * @f3 The value to be assigned to the third component of the vector.
 */
WebGLShader.prototype.setUniform3f=function(name,f1,f2,f3)
{this.gl.uniform3f(this.univars[name], f1,f2,f3);};
/**
 * Sets a value to a uniform 3D float parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @v The value to be assigned as an array of three floats.
 */
WebGLShader.prototype.setUniform3fv=function(name,v)
{this.gl.uniform3fv(this.univars[name], v);};
/**
 * Sets a value to a uniform 4D integer parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @i1 The value to be assigned to the first component of the vector.
 * @i2 The value to be assigned to the second component of the vector.
 * @i3 The value to be assigned to the third component of the vector.
 * @i4 The value to be assigned to the fourth component of the vector.
 */
WebGLShader.prototype.setUniform4i=function(name,i1,i2,i3,i4)
{this.gl.uniform4i(this.univars[name], i1,i2,i3,i4);};
/**
 * Sets a value to a uniform 2D integer parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @v The value to be assigned as an array of four integers.
 */
WebGLShader.prototype.setUniform4iv=function(name,v)
{this.gl.uniform4iv(this.univars[name], v);};
/**
 * Sets a value to a uniform 4D float parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @f1 The value to be assigned to the first component of the vector.
 * @f2 The value to be assigned to the second component of the vector.
 * @f3 The value to be assigned to the third component of the vector.
 * @f4 The value to be assigned to the fourth component of the vector.
 */
WebGLShader.prototype.setUniform4f=function(name,f1,f2,f3,f4)
{this.gl.uniform4f(this.univars[name], f1,f2,f3,f4);};
/**
 * Sets a value to a uniform 4D float parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @v The value to be assigned as an array of four floats.
 */
WebGLShader.prototype.setUniform4fv=function(name,v)
{this.gl.uniform4fv(this.univars[name], v);};
/**
 * Sets a value to a uniform 2x2 matrix parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @v The value to be assigned as an array of four floats, stored column by column.
 */
WebGLShader.prototype.setUniform2x2fv=function(name,v)
{this.gl.uniformMatrix2fv(this.univars[name], false,v);};
/**
 * Sets a value to a uniform 3x3 matrix parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @v The value to be assigned as an array of nine floats, stored column by column.
 */
WebGLShader.prototype.setUniform3x3fv=function(name,v)
{this.gl.uniformMatrix3fv(this.univars[name], false,v);};
/**
 * Sets a value to a uniform 4x4 matrix parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @v The value to be assigned as an array of sixteen floats, stored column by column.
 */
WebGLShader.prototype.setUniform4x4fv=function(name,v)
{this.gl.uniformMatrix4fv(this.univars[name], false,v);};

WebGLShader.prototype.createAttribute=function(name)
{
	this.attrs[name]=this.gl.getAttribLocation(this.shaderProgram, name);
};
/**
 * Binds an existing glBuffer with a float attribute of this shader.
 * @name A string with the name of an attribute as it was defined in this shader.
 * @gl_buffer The glBuffer to be assigned to this attribute. The gl_buffer.itemSize should be defined and contain the dimensionality of the attribute (1,2,3, or 4).
 */
WebGLShader.prototype.setAttribute=function(name,gl_buffer)
{
	this.gl.enableVertexAttribArray(this.attrs[name]);
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, gl_buffer);
	this.gl.vertexAttribPointer(this.attrs[name], gl_buffer.itemSize, this.gl.FLOAT, false, 0, 0);
};
/**
 * Binds an existing glBuffer with a 1D float attribute of this shader.
 * @name A string with the name of an attribute as it was defined in this shader.
 * @gl_buffer The glBuffer to be assigned to this attribute.
 */
WebGLShader.prototype.setAttribute1f=function(name,gl_buffer)
{
	this.gl.enableVertexAttribArray(this.attrs[name]);
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, gl_buffer);
    this.gl.vertexAttribPointer(this.attrs[name], 1, this.gl.FLOAT, false, 0, 0);
};
/**
 * Binds an existing glBuffer with a 2D float attribute of this shader.
 * @name A string with the name of an attribute as it was defined in this shader.
 * @gl_buffer The glBuffer to be assigned to this attribute.
 */
WebGLShader.prototype.setAttribute2f=function(name,gl_buffer)
{
	this.gl.enableVertexAttribArray(this.attrs[name]);
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, gl_buffer);
    this.gl.vertexAttribPointer(this.attrs[name], 2, this.gl.FLOAT, false, 0, 0);
};
/**
 * Binds an existing glBuffer with a 3D float attribute of this shader.
 * @name A string with the name of an attribute as it was defined in this shader.
 * @gl_buffer The glBuffer to be assigned to this attribute.
 */
WebGLShader.prototype.setAttribute3f=function(name,gl_buffer)
{
	this.gl.enableVertexAttribArray(this.attrs[name]);
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, gl_buffer);
    this.gl.vertexAttribPointer(this.attrs[name], 3, this.gl.FLOAT, false, 0, 0);
};
/**
 * Binds an existing glBuffer with a 4D float attribute of this shader.
 * @name A string with the name of an attribute as it was defined in this shader.
 * @gl_buffer The glBuffer to be assigned to this attribute.
 */
WebGLShader.prototype.setAttribute4f=function(name,gl_buffer)
{
	this.gl.enableVertexAttribArray(this.attrs[name]);
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, gl_buffer);
    this.gl.vertexAttribPointer(this.attrs[name], 4, this.gl.FLOAT, false, 0, 0);
};

/**
 * Binds the shader in webGL and updates its projection matrix and lighting direction if necessary.
 */
WebGLShader.prototype.updateAndUse=function()
{
	this.gl.useProgram(this.shaderProgram);
	this.updateProjection();
	this.updateLightingDirection();
};

/**
 * Binds the shader in webGL.
 */
WebGLShader.prototype.use=function()
{
	this.gl.useProgram(this.shaderProgram);
};

/**
 * Updates the projection matrix of the shader if the camera was modified.
 */
WebGLShader.prototype.updateProjection=function(){};
WebGLShader.prototype._updateProjection=function()
{
	if(this.pMatrixStamp!=this.camera.projection_changed_stamp)
	{
	  this.gl.useProgram(this.shaderProgram);
	  this.pMatrixStamp=this.camera.projection_changed_stamp;
	  this.gl.uniformMatrix4fv(this.univars["uPMatrix"], false, this.camera.pMatrix);
	}
};

/**
 * Sets the projection matrix of the shader.
 * @param pMatrix The 4x4 projection matrix.
 */
WebGLShader.prototype.setProjection=function(pMatrix){};
WebGLShader.prototype._setProjection=function(pMatrix)
{
	this.gl.useProgram(this.shaderProgram);
	this.gl.uniformMatrix4fv(this.univars["uPMatrix"], false, pMatrix);
};

/**
 * Updates the model view matrix of the shader.
 */
WebGLShader.prototype.updateModelView=function()
{
	this.setModelView(this.camera.mvMatrix);
};

/**
 * Sets the model view matrix of the shader.
 * @param mvMatrix The 4x4 model view matrix.
 */
WebGLShader.prototype.setModelView=function(mvMatrix){};
WebGLShader.prototype._setModelView1=function(mvMatrix)
{
	this.gl.useProgram(this.shaderProgram);
	this.gl.uniformMatrix4fv(this.univars["uMVMatrix"], false, mvMatrix);	
};
WebGLShader.prototype._setModelView2=function(mvMatrix)
{
	this.gl.useProgram(this.shaderProgram);
	this.gl.uniformMatrix4fv(this.univars["uMVMatrix"], false, mvMatrix);	
	mat4.toInverseMat3(mvMatrix, this.normalMatrix);
	mat3.transpose(this.normalMatrix);
	this.gl.uniformMatrix3fv(this.univars["uNMatrix"], false, this.normalMatrix);
};

WebGLShader.prototype.draw=function(shape,gl_buffer)
{
	this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, gl_buffer);
    this.gl.drawElements(shape, gl_buffer.numItems, this.gl.UNSIGNED_SHORT, 0);
};	

/**
 * Sets the lighting direction of the shader.
 * @param dir An Array of size 3 with the unit vector of the lighting direction.
 */
WebGLShader.prototype.setLightingDirection=function(dir)
{
	this.gl.useProgram(this.shaderProgram);
	var mag=Math.sqrt(dir[0]*dir[0]+dir[1]*dir[1]+dir[2]*dir[2]);
	if(mag!=0)
	{
		this.setUniform3fv("uLightingDirection", [dir[0]/mag,dir[1]/mag,dir[2]/mag]);
	}
};

/**
 * Updates the lighting direction of the shader if the camera was modified.
 */
WebGLShader.prototype.updateLightingDirection=function()
{
	this.gl.useProgram(this.shaderProgram);
	this.setUniform3fv("uLightingDirection", this.camera.getLightingDirection());
};

/**
 * Enables/disables the use of light-based shading.
 * @param flag A boolean flag. 
 */
WebGLShader.prototype.useLighting=function(flag)
{
	this.gl.useProgram(this.shaderProgram);
	this.setUniform1i("uUseLighting",flag);
	//this.canvas.renderFrame();
};

/**
 * Enables/disables the texture rendering.
 * @param flag A boolean flag. 
 */
WebGLShader.prototype.useTexture=function(flag)
{
	this.gl.useProgram(this.shaderProgram);
	this.setUniform1i("uUseTexture",flag);
	//this.canvas.renderFrame();
};

/**
 * Enables/disables the use of vertex-based colors.
 * @param flag A boolean flag. 
 */
WebGLShader.prototype.useColors=function(flag)
{
	this.gl.useProgram(this.shaderProgram);
	this.setUniform1i("uUseColors",flag);
	//this.canvas.renderFrame();
};

/**
 * Enables/disables the use of the 3rd dimension.
 * @param flag A boolean flag. 
 */
WebGLShader.prototype.useZ=function(flag)
{
	this.gl.useProgram(this.shaderProgram);
	this.setUniform1i("uUseZ",flag);
	//this.canvas.renderFrame();
};

/**
 * Sets the point size in the point cloud rendering mode.
 * @param value The size of points in pixels. 
 */
WebGLShader.prototype.setPointSize=function(value)
{
	this.gl.useProgram(this.shaderProgram);
	this.setUniform1f("uPointSize",value);
	//this.canvas.renderFrame();
};

/**
 * Sets a color mask. Default value [1, 1, 1, 1]
 * @param value An Array of size 4 with the values of R,G,B,A as real numbers in the range [0-1]
 */
WebGLShader.prototype.setColorMask=function(value)
{
	this.gl.useProgram(this.shaderProgram);
	this.setUniform4fv("uColorMask",value);
	//this.canvas.renderFrame();
};

/**
 * Sets the map mode.
 * @param value 0 for no map, 1 depth map, 2 edge map. 
 */
WebGLShader.prototype.setMapMode=function(value)
{
	this.gl.useProgram(this.shaderProgram);
	this.setUniform1i("uMapMode",value);
	//this.canvas.renderFrame();
};

/**
 * Sets the color map to be used in MapMode using setMapMode().
 * @param colors An Array of colors. Each color is an Array of size 4 (R,G,B,A). 2,3, or 5 colors can be used.
 * @param weights An Array of ticks/stops in the color map. The ticks should be given as an Array of size 2,3, or 5 and must be real numbers in increasing order.
 */
WebGLShader.prototype.setColorMap=function(colors,weights)
{
	if(colors.length!=2 && colors.length!=3 && colors.length!=5) return;
	var w=[];
	if(typeof weights !=='undefined') w=weigths;
	else
	{
		if(colors.length==2) w=[0.1,0.9];
		else if(colors.length==3) w=[0.1,0.5,0.9];
		else if(colors.length==5) w=[0.1,0.3,0.5,0.7,0.9];
	}
	if(colors.length!=w.length) return;
	
	var gl=this.gl;
	gl.useProgram(this.shaderProgram);
	
	this.setUniform4fv("uColorMapColor1",colors[0]);
	this.setUniform1f("uColorMapPosition1",w[0]);
	
	if(colors.length==5)
	{
		this.setUniform4fv("uColorMapColor2",colors[1]);
		this.setUniform4fv("uColorMapColor3",colors[2]);
		this.setUniform4fv("uColorMapColor4",colors[3]);
		this.setUniform4fv("uColorMapColor5",colors[4]);
		
		this.setUniform1f("uColorMapPosition2",w[1]);
		this.setUniform1f("uColorMapPosition3",w[2]);
		this.setUniform1f("uColorMapPosition4",w[3]);
		this.setUniform1f("uColorMapPosition5",w[4]);
	}
	else if(colors.length==3)
	{
		this.setUniform4fv("uColorMapColor2", [(colors[0][0]+colors[1][0])/2,(colors[0][1]+colors[1][1])/2,(colors[0][2]+colors[1][2])/2,(colors[0][3]+colors[1][3])/2]);
		this.setUniform4fv("uColorMapColor3", colors[1]);
		this.setUniform4fv("uColorMapColor4", [(colors[2][0]+colors[1][0])/2,(colors[2][1]+colors[1][1])/2,(colors[2][2]+colors[1][2])/2,(colors[2][3]+colors[1][3])/2]);
		this.setUniform4fv("uColorMapColor5", colors[2]);
		this.setUniform1f("uColorMapPosition2", (w[1]+w[0])/2);
		this.setUniform1f("uColorMapPosition3", w[1]);
		this.setUniform1f("uColorMapPosition4", (w[1]+w[2])/2);
		this.setUniform1f("uColorMapPosition5", w[2]);
	}
	else if(colors.length==2)
	{
		this.setUniform4fv("uColorMapColor2", [colors[0][0]*0.75+colors[1][0]*0.25,colors[0][1]*0.75+colors[1][1]*0.25,colors[0][2]*0.75+colors[1][2]*0.25,colors[0][3]*0.75+colors[1][3]*0.25]);
		this.setUniform4fv("uColorMapColor3", [(colors[0][0]+colors[1][0])/2,(colors[0][1]+colors[1][1])/2,(colors[0][2]+colors[1][2])/2,(colors[0][3]+colors[1][3])/2]);
		this.setUniform4fv("uColorMapColor4", [colors[0][0]*0.25+colors[1][0]*0.75,colors[0][1]*0.25+colors[1][1]*0.75,colors[0][2]*0.25+colors[1][2]*0.75,colors[0][3]*0.25+colors[1][3]*0.75]);
		this.setUniform4fv("uColorMapColor5", colors[1]);
		
		this.setUniform1f("uColorMapPosition2", w[1]*0.25+w[0]*0.75);
		this.setUniform1f("uColorMapPosition3", (w[1]+w[0])/2);
		this.setUniform1f("uColorMapPosition4", w[1]*0.75+w[0]*0.25);
		this.setUniform1f("uColorMapPosition5", w[1]);
	}
	
	//this.canvas.renderFrame();
};

WebGLShader.prototype.createShader=function(arg1,fragment_shader) {
		var gl=this.gl;
        var vertexShader = null;
		var fragmentShader = null;
			
		if(typeof arg1 !== 'undefined' && typeof fragment_shader !== 'undefined')//the shader code is provided as input
		{	
			vertexShader = this.createVertexShader(arg1);
			fragmentShader=this.createFragmentShader(fragment_shader);
			
		}
		else if(typeof arg1 !== 'undefined' && typeof fragment_shader === 'undefined')//the flags are provided
		{
			vertexShader = this.createVertexShader(null,arg1);
			fragmentShader=this.createFragmentShader(null,arg1);
		}
		else 
		{
			vertexShader = this.createVertexShader(null,WebGLShader.DIFFUSE|WebGLShader.UV|WebGLShader.COLORS);
			fragmentShader=this.createFragmentShader(null,WebGLShader.DIFFUSE|WebGLShader.UV|WebGLShader.COLORS);
		}
		
        var shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)&& !gl.isContextLost()) {
            alert("Could not initialise shaders");
        }
		this.shaderProgram=shaderProgram;

		
        gl.useProgram(shaderProgram);

		this.findVars();
		
		if(typeof arg1 !== 'undefined' && typeof fragment_shader !== 'undefined') return shaderProgram;	
			
	this.setUniform4fv("uColorMapColor1",[0,0,1,1]);
	this.setUniform4fv("uColorMapColor2",[0,1,1,1]);
	this.setUniform4fv("uColorMapColor3",[0,1,0,1]);
	this.setUniform4fv("uColorMapColor4",[1,1,0,1]);
	this.setUniform4fv("uColorMapColor5",[1,0,0,1]);
	
	
	this.setUniform1f("uColorMapPosition1",0.1);
	this.setUniform1f("uColorMapPosition2",0.3);
	this.setUniform1f("uColorMapPosition3",0.5);
	this.setUniform1f("uColorMapPosition4",0.7);
	this.setUniform1f("uColorMapPosition5",0.9);
	
	this.setUniform1i("uUseLighting",true);
	this.setUniform1i("uUseColors",true);
	this.setUniform1i("uUseTexture",true);
	this.setUniform1i("uUseZ",true);
	this.setUniform1i("uMapMode",0);
	this.setUniform1f("uPointSize",this.canvas.camera.realToCSSPixels*2);
	this.setUniform3fv("uLightingDirection",[-0.24390335148307188, 0.5646424733950354, 0.7884732286981352]);
	this.setUniform4fv("uSpecularColor",[1.0,1.0,1.0,1.0]);
	this.setUniform1f("uSpecularExponent",50);
	this.setUniform3fv("uDiffuseColor",[0.9,0.9,0.9]);
	this.setUniform3fv("uAmbientColor",[0.1,0.1,0.1]);
	this.setUniform4fv("uColorMask",[1.0,1.0,1.0,1.0]);
	this.setUniform1i("uSamplerUV",0);
	this.setUniform1i("uSamplerMatCap",1);
	this.setUniform1i("uSamplerHDRE",2);
	this.setUniform4fv("uReflectionColor",[.5,.5,.5,1.0]);
	this.setUniform4fv("uMatCapColor",[1.0,1.0,1.0,1.0]);
	this.setUniform1f("uFadeWithDistanceFactor",1);
	this.setUniform1i("uFadeWithDistance",false);
	
	
	 return shaderProgram;
    };
	
WebGLShader.prototype.findVars=function()
{
	var i=this.vertex_shader_src.indexOf("uniform")
	var sc=0;
	var tokens="";
	var v="";
	for(;i!=-1;)
	{
		sc=this.vertex_shader_src.indexOf(";",i);
		tokens=this.vertex_shader_src.substring(i,sc).split(" ");
		v=tokens.pop();
		for(;v.length<1;) v=tokens.pop();
		this.createUniform(v);
		i=this.vertex_shader_src.indexOf("uniform",i+1);
	}
	i=this.fragment_shader_src.indexOf("uniform")
	for(;i!=-1;)
	{
		sc=this.fragment_shader_src.indexOf(";",i);
		tokens=this.fragment_shader_src.substring(i,sc).split(" ");
		v=tokens.pop();
		for(;v.length<1;) v=tokens.pop();
		this.createUniform(v);
		i=this.fragment_shader_src.indexOf("uniform",i+1);
	}
	i=this.vertex_shader_src.indexOf("attribute")
	for(;i!=-1;)
	{
		sc=this.vertex_shader_src.indexOf(";",i);
		tokens=this.vertex_shader_src.substring(i,sc).split(" ");
		v=tokens.pop();
		for(;v.length<1;) v=tokens.pop();
		this.createAttribute(v);
		i=this.vertex_shader_src.indexOf("attribute",i+1);
	}
	i=this.fragment_shader_src.indexOf("attribute")
	for(;i!=-1;)
	{
		sc=this.fragment_shader_src.indexOf(";",i);
		tokens=this.fragment_shader_src.substring(i,sc).split(" ");
		v=tokens.pop();
		for(;v.length<1;) v=tokens.pop();
		this.createAttribute(v);
		i=this.fragment_shader_src.indexOf("attribute",i+1);
	}
	
	if((typeof this.univars["uMVMatrix"]!=='undefined')&&(typeof this.univars["uNMatrix"]!=='undefined'))
	{	
		this.normalMatrix=mat3.create();
		this.setModelView=this._setModelView2;
		var mv = mat4.create();
		mat4.identity(mv);
		this.setModelView(mv);
	}
	else if(typeof this.univars["uMVMatrix"]!=='undefined')
	{
		this.setModelView=this._setModelView1;
		var mv = mat4.create();
		mat4.identity(mv);
		this.setModelView(mv);
	}
	if(typeof this.univars["uPMatrix"]!=='undefined')
	{
		this.setProjection=this._setProjection;
		this.updateProjection=this._updateProjection;
		var m=mat4.create();
		mat4.perspective(45, 1, 0.1, 100.0, m);
		this.setProjection(m);
	}
};
	
WebGLShader.prototype.createFragmentShader=function(fragment_shader,flags)
{
	var gl=this.gl;
	var s=new Array();
		
	if(fragment_shader!=null) s=fragment_shader;
	else 
	{
	s=s.concat([	"precision mediump float;",
					"varying vec4 vColor;"]);
	if((flags & WebGLShader.AMBIENT)>0||(flags & WebGLShader.DIFFUSE)>0||(flags & WebGLShader.SPECULAR)>0||(flags & WebGLShader.MATCAP)>0)
	s=s.concat(["uniform bool uUseLighting;"]);
	if((flags & WebGLShader.DIFFUSE)>0||(flags & WebGLShader.SPECULAR)>0)
	s=s.concat(["uniform vec3 uLightingDirection;"]);
	if((flags & WebGLShader.AMBIENT)>0)				
	s=s.concat(["uniform vec3 uAmbientColor;"]);
	if((flags & WebGLShader.DIFFUSE)>0)				
	s=s.concat(["uniform vec3 uDiffuseColor;"]);
	if((flags & WebGLShader.SPECULAR)>0)				
	s=s.concat(["uniform vec4 uSpecularColor;",
				"uniform float uSpecularExponent;"]);	
	if((flags & WebGLShader.UV)>0)
	s=s.concat([	"varying vec2 vUV;",
					"uniform sampler2D uSamplerUV;",
					"uniform bool uUseTexture;"]);
	if((flags & WebGLShader.MATCAP)>0)
	s=s.concat(["uniform vec4 uMatCapColor;",
			   "uniform sampler2D uSamplerMatCap;"]);
	if((flags & WebGLShader.MATCAP)>0||(flags & WebGLShader.SPECULAR)>0)
	s=s.concat(["varying vec3 vE;"]);
	if((flags & WebGLShader.DIFFUSE)>0||(flags & WebGLShader.MATCAP)>0||(flags & WebGLShader.SPECULAR)>0)
	s=s.concat(["varying vec3 vN;"]);
	if((flags & WebGLShader.REFLECTION)>0)
	s=s.concat(["uniform vec4 uReflectionColor;",
				"varying vec3 vHDRE;",
				"uniform sampler2D uSamplerHDRE;"]);
	if((flags & WebGLShader.TIMESTAMPS)>0)
	s=s.concat([	"varying float vTime;",
					"uniform float uTimeNow;"]);
	if((flags & WebGLShader.CULL)>0)
	s.push("varying float vCull;");
	
	s.push("void main(void){");
	
	if((flags & WebGLShader.CULL)>0)
	s.push("if(vCull<0.0) discard;");
	
	if((flags & WebGLShader.TIMESTAMPS)>0)
	s.push("if(uTimeNow<vTime) discard;");
	
	if((flags & WebGLShader.AMBIENT)>0||(flags & WebGLShader.DIFFUSE)>0||(flags & WebGLShader.SPECULAR)>0||(flags & WebGLShader.MATCAP)>0)
		s.push("vec4 fragColor=vec4(0.,0.,0.,1.);");
	else if((flags & WebGLShader.UV)>0) s.push("vec4 fragColor=vec4(1.,1.,1.,1.);");
	else if((flags & WebGLShader.REFLECTION)>0) s.push("vec4 fragColor=vec4(0.,0.,0.,0.);");
	else s.push("vec4 fragColor=vec4(1.,1.,1.,1.);");
	
	if((flags & WebGLShader.AMBIENT)>0||(flags & WebGLShader.DIFFUSE)>0||(flags & WebGLShader.SPECULAR)>0||(flags & WebGLShader.MATCAP)>0)
	s=s.concat(["if(uUseLighting){",
		"fragColor=vec4(0.,0.,0.,1.0);"]);
	
	if((flags & WebGLShader.AMBIENT)>0)
		s=s.concat(["fragColor+=vec4(uAmbientColor,1.0);"]);
	
	if((flags & WebGLShader.DIFFUSE)>0)
		s=s.concat(["fragColor+=vec4(uDiffuseColor,1.0)*max(dot(vN,uLightingDirection),0.0);"]);
	
	if((flags & WebGLShader.SPECULAR)>0)
		s=s.concat(["vec3 reflectionDirection = reflect(uLightingDirection, vN);",
		"fragColor+=uSpecularColor*pow(max(dot(reflectionDirection, vE), 0.0), uSpecularExponent);"]);
	
	if((flags & WebGLShader.MATCAP)>0)
	s=s.concat([	"vec3 r = reflect(vE,vN);",
				"float m=2.0*sqrt(pow(r.x,2.)+pow(r.y,2.)+pow(r.z+1.,2.));",
		"vec4 matcapColor=texture2D(uSamplerMatCap,r.xy / m + .5);",
					"fragColor+=uMatCapColor*matcapColor;"]);
	
	if((flags & WebGLShader.AMBIENT)>0||(flags & WebGLShader.DIFFUSE)>0||(flags & WebGLShader.SPECULAR)>0||(flags & WebGLShader.MATCAP)>0)
	s=s.concat(["}","else {","fragColor=vec4(1.,1.,1.,1.0);","}"]);
	
			
    s.push("gl_FragColor=vColor*fragColor;");
			
	if((flags & WebGLShader.UV)>0)
	s=s.concat([	"if(uUseTexture){",
					"vec4 textureColor=texture2D(uSamplerUV,vUV);",
					"gl_FragColor*=textureColor;",
					"}"]);
		
    if((flags & WebGLShader.REFLECTION)>0)
	{
		s=s.concat(["vec2 HDRE_XZ=normalize(vHDRE.xz);",
					"vec4 reflectionColor=texture2D(uSamplerHDRE,vec2(0.5-atan(HDRE_XZ.y,-1.0*HDRE_XZ.x)/3.1415/2.0, atan(vHDRE.y,length(vHDRE.xz))/3.1415+.5));",
					"gl_FragColor+=uReflectionColor*reflectionColor;"]);
	}				
					
				  //"if(vDepth>-1.5) discard;",
	s.push("}");
	}
	
	var src="";
	for(var i=0;i<s.length;i++) src+=s[i];
	
	this.fragment_shader_src=src;
	
	var shader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(shader, src);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
		alert(gl.getShaderInfoLog(shader));
		return null;
		}
	return shader;
};
 
WebGLShader.prototype.createVertexShader=function(vertex_shader,flags)
{
	var gl=this.gl;
	var s=new Array();
	if(vertex_shader!=null) s=vertex_shader;
	else
	{
	s.push(			"attribute vec3 aXYZ;");
	if((flags & WebGLShader.CULL)>0||(flags & WebGLShader.DIFFUSE)>0||(flags & WebGLShader.SPECULAR)>0||(flags & WebGLShader.MATCAP)>0||(flags & WebGLShader.REFLECTION)>0) 
	s=s.concat([	"attribute vec3 aNormal;",
					"uniform mat3 uNMatrix;"]);
	if((flags & WebGLShader.REFLECTION)>0)
	s=s.concat(["varying vec3 vHDRE;"]);
	if((flags & WebGLShader.CULL)>0)
	s.push("varying float vCull;");
	if((flags & WebGLShader.UV)>0)
	s=s.concat([	"attribute vec2 aUV;", 
					"varying vec2 vUV;"]);
	if((flags & WebGLShader.MATCAP)>0 || (flags & WebGLShader.SPECULAR)>0)
	s=s.concat(["varying vec3 vE;"]);
	if((flags & WebGLShader.DIFFUSE)>0||(flags & WebGLShader.MATCAP)>0 || (flags & WebGLShader.SPECULAR)>0)
	s=s.concat(["varying vec3 vN;"]);
	if((flags & WebGLShader.TIMESTAMPS)>0)
	s=s.concat([	"attribute float aTimeStamp;",
					"varying float vTime;"]);
	if((flags & WebGLShader.COLORS)>0) 
	s=s.concat([	"attribute vec3 aColor;",
					"uniform bool uUseColors;"]);
	if((flags & WebGLShader.MAP)>0)
	s=s.concat([	"uniform int uMapMode;", 
					"uniform vec4 uColorMapColor1;",	
					"uniform vec4 uColorMapColor2;",	
					"uniform vec4 uColorMapColor3;",	
					"uniform vec4 uColorMapColor4;",	
					"uniform vec4 uColorMapColor5;",	
					"uniform float uColorMapPosition1;",	
					"uniform float uColorMapPosition2;",	
					"uniform float uColorMapPosition3;",	
					"uniform float uColorMapPosition4;",	
					"uniform float uColorMapPosition5;"]);
		 
	 s=s.concat([		
	"uniform mat4 uMVMatrix;",
	"uniform mat4 uPMatrix;",
	"uniform bool uUseZ;",
	"uniform bool uFadeWithDistance;",
	"uniform float uFadeWithDistanceFactor;",
	"uniform float uPointSize;",
	"varying vec4 vColor;",
	"uniform vec4 uColorMask;",
	
	"void main(void){",
	"gl_PointSize=uPointSize;",
	"vec4 p=uMVMatrix*vec4(aXYZ,1.0);",
    "gl_Position=uPMatrix*p;",
	"float vDepth=p.z;",
	"if(!uUseZ){",
	"p=uMVMatrix*vec4(vec3(aXYZ.x,aXYZ.y,0),1.0);",
    "gl_Position=uPMatrix*p;",
	"}",
	"vColor=uColorMask;",
	"vec3 transformedNormal=vec3(0,0,1);"]);
	 
	if((flags & WebGLShader.TIMESTAMPS)>0)
	s.push("vTime=aTimeStamp;");
	
	if((flags & WebGLShader.CULL)>0||(flags & WebGLShader.DIFFUSE)>0||(flags & WebGLShader.SPECULAR)>0||(flags & WebGLShader.MATCAP)>0||(flags & WebGLShader.REFLECTION)>0)
		s.push("transformedNormal=normalize(uNMatrix * aNormal);");
	if((flags & WebGLShader.SPECULAR)>0||(flags & WebGLShader.MATCAP)>0||(flags & WebGLShader.REFLECTION)>0)
		s.push("vec3 normpoint = normalize(vec3(p));");
	if((flags & WebGLShader.REFLECTION)>0)
		s.push("vec3 r = reflect(normpoint,transformedNormal);");
	
	if((flags & WebGLShader.CULL)>0)
	s.push("vCull=-p.x*transformedNormal.x-p.y*transformedNormal.y-p.z*transformedNormal.z +0.0522*transformedNormal.z;");//0.0522 is the focal length for 45 fov.
	
	if((flags & WebGLShader.MATCAP)>0 || (flags & WebGLShader.SPECULAR)>0)
	{
		s.push("vE=normpoint;");
	}	
	
	if((flags & WebGLShader.MATCAP)>0 || (flags & WebGLShader.SPECULAR)>0||(flags & WebGLShader.DIFFUSE)>0)
	{
		s.push("vN=transformedNormal;");
	}
	if((flags & WebGLShader.REFLECTION)>0)
		s.push("vHDRE = normalize(r*uNMatrix );");
		
	if((flags & WebGLShader.COLORS)>0)
	s=s.concat(["if(uUseColors){",
	"vColor*=vec4(aColor,1.0);",
	"}"]);
	
	s=s.concat(["if(uFadeWithDistance){",
	"vColor.w*=1.0/(1.0+uFadeWithDistanceFactor*length(gl_Position));",  		
	"}"]);
	
	if((flags & WebGLShader.MAP)>0)
	s=s.concat(["if(uMapMode>0){",
	"float v=0.0;",
	"if(uMapMode==2){",
	"v=1.0-abs(transformedNormal.z);",
	"}else if(uMapMode==1){",
	"v=1.0+(vDepth*2.4+2.9)/2.0;",
	"}",
	"if(v<uColorMapPosition1){",
	"vColor*=uColorMapColor1;",
	"}else if(v<uColorMapPosition2){",
	"float w=(uColorMapPosition2-v)/(uColorMapPosition2-uColorMapPosition1);",
	"vColor*=uColorMapColor1*w+uColorMapColor2*(1.0-w);",
	"}else if(v<uColorMapPosition3){",
	"float w=(uColorMapPosition3-v)/(uColorMapPosition3-uColorMapPosition2);",
	"vColor*=uColorMapColor2*w+uColorMapColor3*(1.0-w);",
	"}else if(v<uColorMapPosition4){",
	"float w=(uColorMapPosition4-v)/(uColorMapPosition4-uColorMapPosition3);",
	"vColor*=uColorMapColor3*w+uColorMapColor4*(1.0-w);",
	"}else if(v<uColorMapPosition5){",
	"float w=(uColorMapPosition5-v)/(uColorMapPosition5-uColorMapPosition4);",
	"vColor*=uColorMapColor4*w+uColorMapColor5*(1.0-w);",
	"}else{",
	"vColor*=uColorMapColor5;",
	"}",
	"}"]);
		
	if((flags & WebGLShader.UV)>0)
		s.push("vUV = aUV;	");
	
	s.push("}");
	}
	
	var src="";
	for(var i=0;i<s.length;i++)src+=s[i];
	
	this.vertex_shader_src=src;
	
	 var shader = gl.createShader(gl.VERTEX_SHADER);
	 gl.shaderSource(shader, src);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    };
	
	function WebGLProjector(canvas)
	{
		this.canvas=canvas;
		this.width_factor=1;
	}
	
	WebGLProjector.prototype.getWidthFactor=function()
	{
		return this.width_factor;
	};
	
	WebGLProjector.prototype.setWidthFactor=function(value)
	{
		this.width_factor=value;
	};
	
	WebGLProjector.prototype.draw=function()
	{
		this.canvas.gl.viewport(0,0, this.canvas.gl.viewportWidth, this.canvas.gl.viewportHeight);
		this.canvas._draw();
	};
	
	WebGLProjector.prototype.mapXY=function(x,y){return [x,y];};
	
// glMatrix v0.9.5
glMatrixArrayType=typeof Float32Array!="undefined"?Float32Array:typeof WebGLFloatArray!="undefined"?WebGLFloatArray:Array;var vec3={};vec3.create=function(a){var b=new glMatrixArrayType(3);if(a){b[0]=a[0];b[1]=a[1];b[2]=a[2]}return b};vec3.set=function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];return b};vec3.add=function(a,b,c){if(!c||a==c){a[0]+=b[0];a[1]+=b[1];a[2]+=b[2];return a}c[0]=a[0]+b[0];c[1]=a[1]+b[1];c[2]=a[2]+b[2];return c};
vec3.subtract=function(a,b,c){if(!c||a==c){a[0]-=b[0];a[1]-=b[1];a[2]-=b[2];return a}c[0]=a[0]-b[0];c[1]=a[1]-b[1];c[2]=a[2]-b[2];return c};vec3.negate=function(a,b){b||(b=a);b[0]=-a[0];b[1]=-a[1];b[2]=-a[2];return b};vec3.scale=function(a,b,c){if(!c||a==c){a[0]*=b;a[1]*=b;a[2]*=b;return a}c[0]=a[0]*b;c[1]=a[1]*b;c[2]=a[2]*b;return c};
vec3.normalize=function(a,b){b||(b=a);var c=a[0],d=a[1],e=a[2],g=Math.sqrt(c*c+d*d+e*e);if(g){if(g==1){b[0]=c;b[1]=d;b[2]=e;return b}}else{b[0]=0;b[1]=0;b[2]=0;return b}g=1/g;b[0]=c*g;b[1]=d*g;b[2]=e*g;return b};vec3.cross=function(a,b,c){c||(c=a);var d=a[0],e=a[1];a=a[2];var g=b[0],f=b[1];b=b[2];c[0]=e*b-a*f;c[1]=a*g-d*b;c[2]=d*f-e*g;return c};vec3.length=function(a){var b=a[0],c=a[1];a=a[2];return Math.sqrt(b*b+c*c+a*a)};vec3.dot=function(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]};
vec3.direction=function(a,b,c){c||(c=a);var d=a[0]-b[0],e=a[1]-b[1];a=a[2]-b[2];b=Math.sqrt(d*d+e*e+a*a);if(!b){c[0]=0;c[1]=0;c[2]=0;return c}b=1/b;c[0]=d*b;c[1]=e*b;c[2]=a*b;return c};vec3.lerp=function(a,b,c,d){d||(d=a);d[0]=a[0]+c*(b[0]-a[0]);d[1]=a[1]+c*(b[1]-a[1]);d[2]=a[2]+c*(b[2]-a[2]);return d};vec3.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+"]"};var mat3={};
mat3.create=function(a){var b=new glMatrixArrayType(9);if(a){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];b[9]=a[9]}return b};mat3.set=function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];return b};mat3.identity=function(a){a[0]=1;a[1]=0;a[2]=0;a[3]=0;a[4]=1;a[5]=0;a[6]=0;a[7]=0;a[8]=1;return a};
mat3.transpose=function(a,b){if(!b||a==b){var c=a[1],d=a[2],e=a[5];a[1]=a[3];a[2]=a[6];a[3]=c;a[5]=a[7];a[6]=d;a[7]=e;return a}b[0]=a[0];b[1]=a[3];b[2]=a[6];b[3]=a[1];b[4]=a[4];b[5]=a[7];b[6]=a[2];b[7]=a[5];b[8]=a[8];return b};mat3.toMat4=function(a,b){b||(b=mat4.create());b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=0;b[4]=a[3];b[5]=a[4];b[6]=a[5];b[7]=0;b[8]=a[6];b[9]=a[7];b[10]=a[8];b[11]=0;b[12]=0;b[13]=0;b[14]=0;b[15]=1;return b};
mat3.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+", "+a[3]+", "+a[4]+", "+a[5]+", "+a[6]+", "+a[7]+", "+a[8]+"]"};var mat4={};mat4.create=function(a){var b=new glMatrixArrayType(16);if(a){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];b[9]=a[9];b[10]=a[10];b[11]=a[11];b[12]=a[12];b[13]=a[13];b[14]=a[14];b[15]=a[15]}return b};
mat4.set=function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];b[9]=a[9];b[10]=a[10];b[11]=a[11];b[12]=a[12];b[13]=a[13];b[14]=a[14];b[15]=a[15];return b};mat4.identity=function(a){a[0]=1;a[1]=0;a[2]=0;a[3]=0;a[4]=0;a[5]=1;a[6]=0;a[7]=0;a[8]=0;a[9]=0;a[10]=1;a[11]=0;a[12]=0;a[13]=0;a[14]=0;a[15]=1;return a};
mat4.transpose=function(a,b){if(!b||a==b){var c=a[1],d=a[2],e=a[3],g=a[6],f=a[7],h=a[11];a[1]=a[4];a[2]=a[8];a[3]=a[12];a[4]=c;a[6]=a[9];a[7]=a[13];a[8]=d;a[9]=g;a[11]=a[14];a[12]=e;a[13]=f;a[14]=h;return a}b[0]=a[0];b[1]=a[4];b[2]=a[8];b[3]=a[12];b[4]=a[1];b[5]=a[5];b[6]=a[9];b[7]=a[13];b[8]=a[2];b[9]=a[6];b[10]=a[10];b[11]=a[14];b[12]=a[3];b[13]=a[7];b[14]=a[11];b[15]=a[15];return b};
mat4.determinant=function(a){var b=a[0],c=a[1],d=a[2],e=a[3],g=a[4],f=a[5],h=a[6],i=a[7],j=a[8],k=a[9],l=a[10],o=a[11],m=a[12],n=a[13],p=a[14];a=a[15];return m*k*h*e-j*n*h*e-m*f*l*e+g*n*l*e+j*f*p*e-g*k*p*e-m*k*d*i+j*n*d*i+m*c*l*i-b*n*l*i-j*c*p*i+b*k*p*i+m*f*d*o-g*n*d*o-m*c*h*o+b*n*h*o+g*c*p*o-b*f*p*o-j*f*d*a+g*k*d*a+j*c*h*a-b*k*h*a-g*c*l*a+b*f*l*a};
mat4.inverse=function(a,b){b||(b=a);var c=a[0],d=a[1],e=a[2],g=a[3],f=a[4],h=a[5],i=a[6],j=a[7],k=a[8],l=a[9],o=a[10],m=a[11],n=a[12],p=a[13],r=a[14],s=a[15],A=c*h-d*f,B=c*i-e*f,t=c*j-g*f,u=d*i-e*h,v=d*j-g*h,w=e*j-g*i,x=k*p-l*n,y=k*r-o*n,z=k*s-m*n,C=l*r-o*p,D=l*s-m*p,E=o*s-m*r,q=1/(A*E-B*D+t*C+u*z-v*y+w*x);b[0]=(h*E-i*D+j*C)*q;b[1]=(-d*E+e*D-g*C)*q;b[2]=(p*w-r*v+s*u)*q;b[3]=(-l*w+o*v-m*u)*q;b[4]=(-f*E+i*z-j*y)*q;b[5]=(c*E-e*z+g*y)*q;b[6]=(-n*w+r*t-s*B)*q;b[7]=(k*w-o*t+m*B)*q;b[8]=(f*D-h*z+j*x)*q;
b[9]=(-c*D+d*z-g*x)*q;b[10]=(n*v-p*t+s*A)*q;b[11]=(-k*v+l*t-m*A)*q;b[12]=(-f*C+h*y-i*x)*q;b[13]=(c*C-d*y+e*x)*q;b[14]=(-n*u+p*B-r*A)*q;b[15]=(k*u-l*B+o*A)*q;return b};mat4.toRotationMat=function(a,b){b||(b=mat4.create());b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];b[9]=a[9];b[10]=a[10];b[11]=a[11];b[12]=0;b[13]=0;b[14]=0;b[15]=1;return b};
mat4.toMat3=function(a,b){b||(b=mat3.create());b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[4];b[4]=a[5];b[5]=a[6];b[6]=a[8];b[7]=a[9];b[8]=a[10];return b};mat4.toInverseMat3=function(a,b){var c=a[0],d=a[1],e=a[2],g=a[4],f=a[5],h=a[6],i=a[8],j=a[9],k=a[10],l=k*f-h*j,o=-k*g+h*i,m=j*g-f*i,n=c*l+d*o+e*m;if(!n)return null;n=1/n;b||(b=mat3.create());b[0]=l*n;b[1]=(-k*d+e*j)*n;b[2]=(h*d-e*f)*n;b[3]=o*n;b[4]=(k*c-e*i)*n;b[5]=(-h*c+e*g)*n;b[6]=m*n;b[7]=(-j*c+d*i)*n;b[8]=(f*c-d*g)*n;return b};
mat4.multiply=function(a,b,c){c||(c=a);var d=a[0],e=a[1],g=a[2],f=a[3],h=a[4],i=a[5],j=a[6],k=a[7],l=a[8],o=a[9],m=a[10],n=a[11],p=a[12],r=a[13],s=a[14];a=a[15];var A=b[0],B=b[1],t=b[2],u=b[3],v=b[4],w=b[5],x=b[6],y=b[7],z=b[8],C=b[9],D=b[10],E=b[11],q=b[12],F=b[13],G=b[14];b=b[15];c[0]=A*d+B*h+t*l+u*p;c[1]=A*e+B*i+t*o+u*r;c[2]=A*g+B*j+t*m+u*s;c[3]=A*f+B*k+t*n+u*a;c[4]=v*d+w*h+x*l+y*p;c[5]=v*e+w*i+x*o+y*r;c[6]=v*g+w*j+x*m+y*s;c[7]=v*f+w*k+x*n+y*a;c[8]=z*d+C*h+D*l+E*p;c[9]=z*e+C*i+D*o+E*r;c[10]=z*
g+C*j+D*m+E*s;c[11]=z*f+C*k+D*n+E*a;c[12]=q*d+F*h+G*l+b*p;c[13]=q*e+F*i+G*o+b*r;c[14]=q*g+F*j+G*m+b*s;c[15]=q*f+F*k+G*n+b*a;return c};mat4.multiplyVec3=function(a,b,c){c||(c=b);var d=b[0],e=b[1];b=b[2];c[0]=a[0]*d+a[4]*e+a[8]*b+a[12];c[1]=a[1]*d+a[5]*e+a[9]*b+a[13];c[2]=a[2]*d+a[6]*e+a[10]*b+a[14];return c};
mat4.multiplyVec4=function(a,b,c){c||(c=b);var d=b[0],e=b[1],g=b[2];b=b[3];c[0]=a[0]*d+a[4]*e+a[8]*g+a[12]*b;c[1]=a[1]*d+a[5]*e+a[9]*g+a[13]*b;c[2]=a[2]*d+a[6]*e+a[10]*g+a[14]*b;c[3]=a[3]*d+a[7]*e+a[11]*g+a[15]*b;return c};
mat4.translate=function(a,b,c){var d=b[0],e=b[1];b=b[2];if(!c||a==c){a[12]=a[0]*d+a[4]*e+a[8]*b+a[12];a[13]=a[1]*d+a[5]*e+a[9]*b+a[13];a[14]=a[2]*d+a[6]*e+a[10]*b+a[14];a[15]=a[3]*d+a[7]*e+a[11]*b+a[15];return a}var g=a[0],f=a[1],h=a[2],i=a[3],j=a[4],k=a[5],l=a[6],o=a[7],m=a[8],n=a[9],p=a[10],r=a[11];c[0]=g;c[1]=f;c[2]=h;c[3]=i;c[4]=j;c[5]=k;c[6]=l;c[7]=o;c[8]=m;c[9]=n;c[10]=p;c[11]=r;c[12]=g*d+j*e+m*b+a[12];c[13]=f*d+k*e+n*b+a[13];c[14]=h*d+l*e+p*b+a[14];c[15]=i*d+o*e+r*b+a[15];return c};
mat4.scale=function(a,b,c){var d=b[0],e=b[1];b=b[2];if(!c||a==c){a[0]*=d;a[1]*=d;a[2]*=d;a[3]*=d;a[4]*=e;a[5]*=e;a[6]*=e;a[7]*=e;a[8]*=b;a[9]*=b;a[10]*=b;a[11]*=b;return a}c[0]=a[0]*d;c[1]=a[1]*d;c[2]=a[2]*d;c[3]=a[3]*d;c[4]=a[4]*e;c[5]=a[5]*e;c[6]=a[6]*e;c[7]=a[7]*e;c[8]=a[8]*b;c[9]=a[9]*b;c[10]=a[10]*b;c[11]=a[11]*b;c[12]=a[12];c[13]=a[13];c[14]=a[14];c[15]=a[15];return c};
mat4.rotate=function(a,b,c,d){var e=c[0],g=c[1];c=c[2];var f=Math.sqrt(e*e+g*g+c*c);if(!f)return null;if(f!=1){f=1/f;e*=f;g*=f;c*=f}var h=Math.sin(b),i=Math.cos(b),j=1-i;b=a[0];f=a[1];var k=a[2],l=a[3],o=a[4],m=a[5],n=a[6],p=a[7],r=a[8],s=a[9],A=a[10],B=a[11],t=e*e*j+i,u=g*e*j+c*h,v=c*e*j-g*h,w=e*g*j-c*h,x=g*g*j+i,y=c*g*j+e*h,z=e*c*j+g*h;e=g*c*j-e*h;g=c*c*j+i;if(d){if(a!=d){d[12]=a[12];d[13]=a[13];d[14]=a[14];d[15]=a[15]}}else d=a;d[0]=b*t+o*u+r*v;d[1]=f*t+m*u+s*v;d[2]=k*t+n*u+A*v;d[3]=l*t+p*u+B*
v;d[4]=b*w+o*x+r*y;d[5]=f*w+m*x+s*y;d[6]=k*w+n*x+A*y;d[7]=l*w+p*x+B*y;d[8]=b*z+o*e+r*g;d[9]=f*z+m*e+s*g;d[10]=k*z+n*e+A*g;d[11]=l*z+p*e+B*g;return d};mat4.rotateX=function(a,b,c){var d=Math.sin(b);b=Math.cos(b);var e=a[4],g=a[5],f=a[6],h=a[7],i=a[8],j=a[9],k=a[10],l=a[11];if(c){if(a!=c){c[0]=a[0];c[1]=a[1];c[2]=a[2];c[3]=a[3];c[12]=a[12];c[13]=a[13];c[14]=a[14];c[15]=a[15]}}else c=a;c[4]=e*b+i*d;c[5]=g*b+j*d;c[6]=f*b+k*d;c[7]=h*b+l*d;c[8]=e*-d+i*b;c[9]=g*-d+j*b;c[10]=f*-d+k*b;c[11]=h*-d+l*b;return c};
mat4.rotateY=function(a,b,c){var d=Math.sin(b);b=Math.cos(b);var e=a[0],g=a[1],f=a[2],h=a[3],i=a[8],j=a[9],k=a[10],l=a[11];if(c){if(a!=c){c[4]=a[4];c[5]=a[5];c[6]=a[6];c[7]=a[7];c[12]=a[12];c[13]=a[13];c[14]=a[14];c[15]=a[15]}}else c=a;c[0]=e*b+i*-d;c[1]=g*b+j*-d;c[2]=f*b+k*-d;c[3]=h*b+l*-d;c[8]=e*d+i*b;c[9]=g*d+j*b;c[10]=f*d+k*b;c[11]=h*d+l*b;return c};
mat4.rotateZ=function(a,b,c){var d=Math.sin(b);b=Math.cos(b);var e=a[0],g=a[1],f=a[2],h=a[3],i=a[4],j=a[5],k=a[6],l=a[7];if(c){if(a!=c){c[8]=a[8];c[9]=a[9];c[10]=a[10];c[11]=a[11];c[12]=a[12];c[13]=a[13];c[14]=a[14];c[15]=a[15]}}else c=a;c[0]=e*b+i*d;c[1]=g*b+j*d;c[2]=f*b+k*d;c[3]=h*b+l*d;c[4]=e*-d+i*b;c[5]=g*-d+j*b;c[6]=f*-d+k*b;c[7]=h*-d+l*b;return c};
mat4.frustum=function(a,b,c,d,e,g,f){f||(f=mat4.create());var h=b-a,i=d-c,j=g-e;f[0]=e*2/h;f[1]=0;f[2]=0;f[3]=0;f[4]=0;f[5]=e*2/i;f[6]=0;f[7]=0;f[8]=(b+a)/h;f[9]=(d+c)/i;f[10]=-(g+e)/j;f[11]=-1;f[12]=0;f[13]=0;f[14]=-(g*e*2)/j;f[15]=0;return f};mat4.perspective=function(a,b,c,d,e){a=c*Math.tan(a*Math.PI/360);b=a*b;return mat4.frustum(-b,b,-a,a,c,d,e)};
mat4.ortho=function(a,b,c,d,e,g,f){f||(f=mat4.create());var h=b-a,i=d-c,j=g-e;f[0]=2/h;f[1]=0;f[2]=0;f[3]=0;f[4]=0;f[5]=2/i;f[6]=0;f[7]=0;f[8]=0;f[9]=0;f[10]=-2/j;f[11]=0;f[12]=-(a+b)/h;f[13]=-(d+c)/i;f[14]=-(g+e)/j;f[15]=1;return f};
mat4.lookAt=function(a,b,c,d){d||(d=mat4.create());var e=a[0],g=a[1];a=a[2];var f=c[0],h=c[1],i=c[2];c=b[1];var j=b[2];if(e==b[0]&&g==c&&a==j)return mat4.identity(d);var k,l,o,m;c=e-b[0];j=g-b[1];b=a-b[2];m=1/Math.sqrt(c*c+j*j+b*b);c*=m;j*=m;b*=m;k=h*b-i*j;i=i*c-f*b;f=f*j-h*c;if(m=Math.sqrt(k*k+i*i+f*f)){m=1/m;k*=m;i*=m;f*=m}else f=i=k=0;h=j*f-b*i;l=b*k-c*f;o=c*i-j*k;if(m=Math.sqrt(h*h+l*l+o*o)){m=1/m;h*=m;l*=m;o*=m}else o=l=h=0;d[0]=k;d[1]=h;d[2]=c;d[3]=0;d[4]=i;d[5]=l;d[6]=j;d[7]=0;d[8]=f;d[9]=
o;d[10]=b;d[11]=0;d[12]=-(k*e+i*g+f*a);d[13]=-(h*e+l*g+o*a);d[14]=-(c*e+j*g+b*a);d[15]=1;return d};mat4.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+", "+a[3]+", "+a[4]+", "+a[5]+", "+a[6]+", "+a[7]+", "+a[8]+", "+a[9]+", "+a[10]+", "+a[11]+", "+a[12]+", "+a[13]+", "+a[14]+", "+a[15]+"]"};quat4={};quat4.create=function(a){var b=new glMatrixArrayType(4);if(a){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3]}return b};quat4.set=function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];return b};
quat4.calculateW=function(a,b){var c=a[0],d=a[1],e=a[2];if(!b||a==b){a[3]=-Math.sqrt(Math.abs(1-c*c-d*d-e*e));return a}b[0]=c;b[1]=d;b[2]=e;b[3]=-Math.sqrt(Math.abs(1-c*c-d*d-e*e));return b};quat4.inverse=function(a,b){if(!b||a==b){a[0]*=1;a[1]*=1;a[2]*=1;return a}b[0]=-a[0];b[1]=-a[1];b[2]=-a[2];b[3]=a[3];return b};quat4.length=function(a){var b=a[0],c=a[1],d=a[2];a=a[3];return Math.sqrt(b*b+c*c+d*d+a*a)};
quat4.normalize=function(a,b){b||(b=a);var c=a[0],d=a[1],e=a[2],g=a[3],f=Math.sqrt(c*c+d*d+e*e+g*g);if(f==0){b[0]=0;b[1]=0;b[2]=0;b[3]=0;return b}f=1/f;b[0]=c*f;b[1]=d*f;b[2]=e*f;b[3]=g*f;return b};quat4.multiply=function(a,b,c){c||(c=a);var d=a[0],e=a[1],g=a[2];a=a[3];var f=b[0],h=b[1],i=b[2];b=b[3];c[0]=d*b+a*f+e*i-g*h;c[1]=e*b+a*h+g*f-d*i;c[2]=g*b+a*i+d*h-e*f;c[3]=a*b-d*f-e*h-g*i;return c};
quat4.multiplyVec3=function(a,b,c){c||(c=b);var d=b[0],e=b[1],g=b[2];b=a[0];var f=a[1],h=a[2];a=a[3];var i=a*d+f*g-h*e,j=a*e+h*d-b*g,k=a*g+b*e-f*d;d=-b*d-f*e-h*g;c[0]=i*a+d*-b+j*-h-k*-f;c[1]=j*a+d*-f+k*-b-i*-h;c[2]=k*a+d*-h+i*-f-j*-b;return c};quat4.toMat3=function(a,b){b||(b=mat3.create());var c=a[0],d=a[1],e=a[2],g=a[3],f=c+c,h=d+d,i=e+e,j=c*f,k=c*h;c=c*i;var l=d*h;d=d*i;e=e*i;f=g*f;h=g*h;g=g*i;b[0]=1-(l+e);b[1]=k-g;b[2]=c+h;b[3]=k+g;b[4]=1-(j+e);b[5]=d-f;b[6]=c-h;b[7]=d+f;b[8]=1-(j+l);return b};
quat4.toMat4=function(a,b){b||(b=mat4.create());var c=a[0],d=a[1],e=a[2],g=a[3],f=c+c,h=d+d,i=e+e,j=c*f,k=c*h;c=c*i;var l=d*h;d=d*i;e=e*i;f=g*f;h=g*h;g=g*i;b[0]=1-(l+e);b[1]=k-g;b[2]=c+h;b[3]=0;b[4]=k+g;b[5]=1-(j+e);b[6]=d-f;b[7]=0;b[8]=c-h;b[9]=d+f;b[10]=1-(j+l);b[11]=0;b[12]=0;b[13]=0;b[14]=0;b[15]=1;return b};quat4.slerp=function(a,b,c,d){d||(d=a);var e=c;if(a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3]<0)e=-1*c;d[0]=1-c*a[0]+e*b[0];d[1]=1-c*a[1]+e*b[1];d[2]=1-c*a[2]+e*b[2];d[3]=1-c*a[3]+e*b[3];return d};
quat4.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+", "+a[3]+"]"};