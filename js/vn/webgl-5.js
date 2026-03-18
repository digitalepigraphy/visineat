/* V5
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
 * This class creates and controls a canvas element with webGL context. The canvas is initialized inside a given div container and is properly scaled to fit its size. You can easily draw 3D content in a canvas object by providing callback function for the events whenStarted(), whenDraw(), and whenAnimate().<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var canvas=new GLCanvas('my_div');<br>
 * canvas.whenStarted().then(function(){...});<br>
 * canvas.whenAnimate().then(function(){...});<br>
 * canvas.whenDraw().then(function(){...});<br>
 * canvas.start();<br></font>
 * @param div A div element or the id of a div element that will hold the webGL canvas.
 */
function GLCanvas(div)
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
				
		//calculate the rendering size of the corresponding pixels in the device, here we assume realToCSSPixels=1, but GLCamera in the first frame will calculate the actual realToCSSPixels
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
	//window.location=vn.hosturl+'js/webgl_error.html';
}, false);
   
  this.createHeaders();
  this.progress_bar=null;
  
  this.projectors=new Array(5);
  this.projectors[0]=new GLProjector(this);
  this.current_projector=this.projectors[0];
  this.__draw_counter=0;
  
  this.reset();
  
  this._started=false;
  this._stopped=false;
  var self=this;
  this.start=function(){
  self.bkg=new GLBackground(self);
  self.beams=new GLBeams(self);
  self.beams.setVisible(false);
  self.watermark=new GLWatermark(self);
  self.loading_animation=new GLLoadingAnimation(self);
  self.setLoadingStatus(false);  
  self.gl.enable(self.gl.DEPTH_TEST);
  self.gl.blendFunc(self.gl.SRC_ALPHA,self.gl.ONE_MINUS_SRC_ALPHA);
  self.gl.enable(self.gl.BLEND);
  self.gl.clearColor(0.0, 0.0, 0.0, 1.0);
  self._start_p.callThen();
  self._start_p.reset();
  
  
  document.addEventListener("keydown", function(event){self.handleKeyDown(event)}, false);
  document.addEventListener("keyup", function(event){self.handleKeyUp(event)}, false);
  self.canvas.addEventListener("mousedown", function(event){self.handleMouseDown(event)}, false);
  self.canvas.addEventListener("mouseup", function(event){self.handleMouseUp(event)}, false);
  self.canvas.addEventListener("mouseout", function(event){self.handleMouseOut(event)}, false);
  self.canvas.addEventListener("mousemove", function(event){self.handleMouseMove(event)}, false);
  self.canvas.addEventListener("touchstart", function(event){self.handleTouchStart(event)}, false);
  self.canvas.addEventListener("touchend", function(event){self.handleTouchEnd(event)}, false);
  self.canvas.addEventListener("touchcancel", function(event){self.handleTouchCancel(event)}, false);
  self.canvas.addEventListener("touchleave", function(event){self.handleTouchLeave(event)}, false);
  self.canvas.addEventListener("touchmove", function(event){self.handleTouchMove(event)}, false);
  self.canvas.addEventListener('mousewheel',function(event){self.handleMouseWheel(event)}, false);
  
  //We only need the device to support deviceorientation events. If it does then we remove the devicemotion listener.
  //If it does not we try to generate deviceorientation events from devicemotion data.
  
  
  self.device_orientation_enabled=false;
  
  //if(!window.navigator.pointerEnabled)self.canvas.onmouseout = self.handleMouseOut;
  //window.oncontextmenu = function (){return false;};//cancel default behaviour on right click 

  if(!self._started)
  {
	self._started=true;
	self.tick();
  }
  };
  this.stop=function()
  {
	  this._stopped=true;
  }
} 

/**
 * This method returns a promise that will be fulfilled when the canvas animation loop starts.
 * @return VNPromise The promise object associated with this event.
 */
GLCanvas.prototype.whenStarted=function(){return this._start_p;};

/**
 * This method returns a promise that will be triggered every time the scene is drawn.
 * @return VNPromise The promise object associated with this event.
 */
GLCanvas.prototype.whenDraw=function(){return this._draw_p;};

/**
 * This method returns a promise that will be triggered every time a new frame is about to be rendered.
 * @return VNPromise The promise object associated with this event.
 */
GLCanvas.prototype.whenAnimate=function(){return this._animate_p;};

/**
 * Returns the div element that contains the canvas.
 * @return Element The div element that contains the canvas.
 */
GLCanvas.prototype.getDiv=function(){return this.div_container;};

GLCanvas.prototype.setDiv=function(div){
	this.div_container=div;
	this.getCamera().div_container=div;
	div.insertBefore(this.canvas, div.firstChild);};

/**
 * Returns the canvas element controlled by this GLCanvas object.
 * @return Element The canvas element.
 */
GLCanvas.prototype.getCanvas=function(){return this.canvas;};

/**
 * Returns the gl context object that corresponds to this canvas element.
 * @return GL The webGL context object.
 */
GLCanvas.prototype.getGL=function(){return this.gl;};

/**
 * Returns the GLCamera object that controls the projection and model view of this canvas.
 * @return GLCamera The GLCamera object.
 */
GLCanvas.prototype.getCamera=function(){return this.camera;};

/**
 * Returns the GLCamera object that controls the projection and model view of this canvas.
 * @return GLCamera The GLCamera object.
 */
GLCanvas.prototype.getPrinter=function(){return this.camera;};

GLCanvas.prototype.getProjector=function()
{
	return this.current_projector; 
};

GLCanvas.prototype.isNewFrame=function()
{
	return (this.current_projector.current_panel==0 && !this.roii.draw_rois);
};

/**
 * This method starts the animation/rendering of the canvas. It must be called after defining the callback for the event whenStarted().
 */
GLCanvas.prototype.start=function(){};


GLCanvas.prototype.handleKeys=function(){};
GLCanvas.prototype.handleKeyDown=function(event){this._keypressed_p.callThen({object:event.keyCode,event:event});};
GLCanvas.prototype.handleKeyUp=function(event){this._keyreleased_p.callThen({object:event.keyCode,event:event});};
GLCanvas.prototype.handleMouseDown=function(event){};
GLCanvas.prototype.handleMouseUp=function(event){};
GLCanvas.prototype.handleMouseMove=function(event){};
GLCanvas.prototype.handleMouseOut=function(event){};
GLCanvas.prototype.handleTouchStart=function(event){};
GLCanvas.prototype.handleTouchEnd=function(event){};
GLCanvas.prototype.handleTouchMove=function(event){};
GLCanvas.prototype.handleTouchLeave=function(event){};
GLCanvas.prototype.handleTouchCancel=function(event){};
GLCanvas.prototype.handleMouseWheel=function(event){};

/**
 * This method returns a promise that will be triggered every time a key is pressed.
 * @return VNPromise The promise object associated with this event.
 */
GLCanvas.prototype.whenKeyPressed=function(){return this._keypressed_p;};
/**
 * This method returns a promise that will be triggered every time a key is released.
 * @return VNPromise The promise object associated with this event.
 */
GLCanvas.prototype.whenKeyReleased=function(){return this._keyreleased_p;};

 /**
 * This method returns a promise that will be triggered when the orientation of the device changes.
 * @return VNPromise The promise object associated with this event.
 */
GLCanvas.prototype.whenOrientationChanges=function(){

	if(this._handleDeviceOrientation) return this._orientation_p;
	
	var self=this;
	this._handleDeviceOrientation=function(e)
	{
		if(e.gamma==null || e.beta==null) return; 
		if(e.vn==null) self.device_orientation_enabled=true; 
		if(typeof self.getCamera().initial_gamma==='undefined'){self.getCamera().initial_gamma=e.gamma;}
		self.whenOrientationChanges().callThen({event:{orientation:self._screenOrientation,alpha:e.alpha,beta:e.beta,gamma:e.gamma,event:e}});
	};
	addEventListener("deviceorientation", this._handleDeviceOrientation, false);
	this._screenOrientation=window.orientation||0;
	this._handleScreenOrientationChange=function(){
		self._screenOrientation=window.orientation||0;
	};
	addEventListener('orientationchange',this._handleScreenOrientationChange,false);
	
	return this._orientation_p;
};

/**
 * This method returns a promise that will be triggered when the user taps on the canvas.
 * @return VNPromise The promise object associated with this event.
 */
GLCanvas.prototype.whenTapped=function(){return this._tap_p;};

/**
 * This method returns a promise that will be triggered when the user starts touching the canvas.
 * @return VNPromise The promise object associated with this event.
 */
GLCanvas.prototype.whenTouched=function(){return this._touch_p;};
/**
 * This method returns a promise that will be triggered when the user starts stops touching the canvas.
 * @return VNPromise The promise object associated with this event.
 */
GLCanvas.prototype.whenTouchEnds=function(){return this._touchend_p;};
/**
 * This method returns a promise that will be triggered when the user starts dragging the pointing device (mouse, finger, etc.) on the canvas.
 * @return VNPromise The promise object associated with this event.
 */
GLCanvas.prototype.whenDragStarts=function(){return this._dragstart_p;};
/**
 * This method returns a promise that will be triggered when the user drags the pointing device (mouse, finger, etc.) on the canvas.
 * @return VNPromise The promise object associated with this event.
 */
GLCanvas.prototype.whenDragged=function(){return this._drag_p;};
/**
 * This method returns a promise that will be triggered when the user stops dragging the pointing device (mouse, finger, etc.) on the canvas.
 * @return VNPromise The promise object associated with this event.
 */
GLCanvas.prototype.whenDragEnds=function(){return this._dragend_p;};
/**
 * This method returns a promise that will be triggered when the user moves the finger/pointers on the canvas.
 * @return VNPromise The promise object associated with this event.
 */
GLCanvas.prototype.whenMoved=function(){return this._move_p;};
/**
 * This method returns a promise that will be triggered when the user moves the mouse wheel or performs a similar touch pad action on the canvas.
 * @return VNPromise The promise object associated with this event.
 */
GLCanvas.prototype.whenScrolled=function(){return this._scroll_p;};


GLCanvas.prototype.reset=function()
{
  this.total_number_of_elements=0;
  this.total_number_of_vertices=0;
  this.total_number_of_objects=0;
  
  this.rendering_mode=0;
  this.render_now=true;
  this.render_now_requested_in_draw=false;
  this.in_draw=false;
  this.camera=new GLCamera(this);
  this.roii=new GLPicker(this);
  
  this.background_color=[0,0,0,1];
  this.frame_counter=0;
  
  this._start_p=new VNPromise(this);
  this._draw_p=new VNPromise(this);
  this._animate_p=new VNPromise(this);
  this._orientation_p=new VNPromise(this);
  this._tap_p=new VNPromise(this);
  this._touch_p=new VNPromise(this);
  this._touchend_p=new VNPromise(this);
  this._dragstart_p=new VNPromise(this);
  this._drag_p=new VNPromise(this);
  this._dragend_p=new VNPromise(this);
  this._move_p=new VNPromise(this);
  this._scroll_p=new VNPromise(this);
  this._keypressed_p=new VNPromise(this);
  this._keyreleased_p=new VNPromise(this);
	
	/*this.whenStarted().clear().reset();
	this.whenDraw().clear().reset();
	this.whenAnimate().clear().reset();
	this.whenTapped().clear().reset();
	this.whenTouched().clear().reset();
	this.whenTouchEnds().clear().reset();
	this.whenDragStarts().clear().reset();
	this.whenDragged().clear().reset();
	this.whenDragEnds().clear().reset();
	this.whenMoved().clear().reset();
	this.whenScrolled().clear().reset();
	this.whenKeyPressed().clear().reset();
	this.whenKeyReleased().clear().reset();*/
	
};

/**
 * Sets the rendering mode to fully render all frames even if there was no change in the displayed content. This rendering mode is computationally more expensive and may show down the website interaction (such as scrolling, selecting text, interacting with forms, etc.).
 */
GLCanvas.prototype.renderAllFrames=function(){this.rendering_mode=0;};

/**
 * Sets the rendering mode to render only if necessary. If there is no change in the displayed content the canvas is not redrawn. 
 */
GLCanvas.prototype.renderWhenNecessary=function(){this.rendering_mode=1;};

/**
 * Notifies that there was a change in the content and the canvas must be redrawn once. It should be used when the renderWhenNecessary() mode is used.
 */
GLCanvas.prototype.renderFrame=function(){this.render_now=true;if(this.in_draw)this.render_now_requested_in_draw=true;};

/**
 * Returns a boolean flag that indicates if canvas is currently rendering the scene for the purposes of the picker and not for the regular visual output of the canvas. It must be used inside your callback for the event GLCanvas.whenDraw() to change the content if necessary depending on the status of this method.
 * @return boolean A boolean flag that indicates the purpose of the current rendering call.
 */
GLCanvas.prototype.renderingPickingMap=function(){return this.roii.draw_rois;};

/**
 * Returns the total number of vertices draw on canvas in this frame.
 * @return int The number of vertices. 
 */
GLCanvas.prototype.getNumOfVertices=function(){return this.total_number_of_vertices;};

/**
 * Returns the total number of faces draw on canvas in this frame.
 * @return int The number of faces. 
 */
GLCanvas.prototype.getNumOfElements=function(){return this.total_number_of_elements;};

/**
 * Returns the total number of objects draw on canvas in this frame.
 * @return int The number of objects. 
 */
GLCanvas.prototype.getNumOfObjects=function(){return this.total_number_of_objects;};

/**
 * Sets the canvas to a regular 2D screen projection mode with vertical FOV: 45 degrees
 */
GLCanvas.prototype.useRegularProjector=function()
{
	this.current_projector=this.projectors[0];
	this.camera.setFOV(45);
};

/**
 * Sets the canvas to "fish eye" VR head mounted display stereoscopic projection mode. The div container must be fullscreen for best experience.
 * @param fov The vertical fov in degrees of the fish-eye projector (default:85)
 */
GLCanvas.prototype.useFishEyeProjector=function(fov,eye_separation)
{
	
	
	if(this.projectors[1]==null)
	{
  var proj=new GLProjector(this);
  proj.setNumOfPanels(2);
  var gl=this.gl;
  
  if(typeof eye_separation!=='undefined')proj.eye_sep=eye_separation;else proj.eye_sep=.0675/2;
  
  proj.textureFrameBuffer=gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, proj.textureFrameBuffer);
  proj.textureFrameBuffer.width=1024;
  proj.textureFrameBuffer.height=1024;
  
  proj.bufferTexture=new GLTexture(this);
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
  
  proj.black_background=new GLObject(this);
  
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
  
  
  proj.textureBufferShape=new GLObject(this);
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

 var sh=new GLShader(this,{vertexShaderCode:vertex_shader,fragmentShaderCode:fragment_shader});

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
		mat4.translate(n,[proj.eye_sep/2,0,0]);
		mat4.multiply(n,cp,self.canvas.camera.mvMatrix);
	  self.setCurrentPanel(0);
	  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	  self.canvas._draw();

	  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	  
	  gl.viewport(0, 0, gl.viewportWidth/2, gl.viewportHeight);
	  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	  
	  self.black_background.draw({updateShader:false}); 
 
	  self.textureBufferShape.draw({updateShader:false});
	  gl.bindTexture(gl.TEXTURE_2D, null);
	  
	  gl.bindFramebuffer(gl.FRAMEBUFFER, self.textureFrameBuffer);
      gl.viewport(0,0, self.textureFrameBuffer.width, self.textureFrameBuffer.height);
	  
	  
		mat4.identity(n);
		mat4.set(self.canvas.camera.mvMatrix, cp);
		mat4.translate(n,[-proj.eye_sep,0,0]);
		mat4.multiply(n,cp,self.canvas.camera.mvMatrix);
	  self.setCurrentPanel(1);
	  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	  self.canvas._draw();

	  mat4.identity(n);
		mat4.set(self.canvas.camera.mvMatrix, cp);
		mat4.translate(n,[proj.eye_sep/2,0,0]);
		mat4.multiply(n,cp,self.canvas.camera.mvMatrix);
	  
	  
	  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	  gl.viewport(gl.viewportWidth/2, 0, gl.viewportWidth/2, gl.viewportHeight);
	  //this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
	  	 
	  self.black_background.draw({updateShader:false});
		 
	  self.textureBufferShape.draw({updateShader:false});
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
	if(typeof eye_separation!=='undefined')this.current_projector.eye_sep=eye_separation;else this.current_projector.eye_sep=.0675/2;
	if(typeof fov!=='undefined')this.camera.setFOV(fov);
	else this.camera.setFOV(85);//default 85 //VIVE 113 //Oculus 93
};

/**
 * Sets the canvas to a side-by-side stereoscopic projection mode.
 * @param keepAspectRatio A boolean value that indicates if the full canvas' aspect ratio must be used. If false (which is the default value), the aspect ratio will be modified by dividing the width by 2. For most of 3D TV sets this parameter must be set to true. For bare eye stereoscopic view this parameter must be set to false. 
 * @param crossEyes A boolean value that indicates if the right screen will correspond to the left eye (i.e. crossed eyes). If false (which is the default value), the right screen will correspond to the right eye.
 */
GLCanvas.prototype.useSideBySideProjector=function(keepAspectRatio, crossEyes)
{
	if(this.projectors[2]==null)
	{
  var proj=new GLProjector(this);
  proj.setNumOfPanels(2);
  proj.keepAspectRatio=true;
  proj.crossEyes=false;
  //proj.setWidthFactor(0.5);
		
	this.projectors[2]=proj;
	var self=proj;
	proj.draw=function()
	{
		
		var gl=self.canvas.gl;
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.viewport(0, 0, gl.viewportWidth/2, gl.viewportHeight);
	  
	  var n= mat4.create();
	  var cp = mat4.create();
	  
	  self.canvas.camera.pushMatrix();
		mat4.identity(n);
		mat4.set(self.canvas.camera.mvMatrix, cp);
		if(self.crossEyes) mat4.translate(n,[-0.0675/2,0,0]);
		else mat4.translate(n,[0.0675/2,0,0]);
		mat4.multiply(n,cp,self.canvas.camera.mvMatrix);
	  self.setCurrentPanel(0);
	  self.canvas._draw();
	  self.canvas.camera.popMatrix();
	  
	  gl.viewport(gl.viewportWidth/2, 0, gl.viewportWidth/2, gl.viewportHeight);
	  
	  
	  self.canvas.camera.pushMatrix();
		mat4.identity(n);
		mat4.set(self.canvas.camera.mvMatrix, cp);
		if(self.crossEyes) mat4.translate(n,[0.0675/2,0,0]);
		else mat4.translate(n,[-0.0675/2,0,0]);
		mat4.multiply(n,cp,self.canvas.camera.mvMatrix);
	  self.setCurrentPanel(1);  
	  self.canvas._draw();
	  self.canvas.camera.popMatrix();
	 
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

GLCanvas.prototype.usePolygonalTheaterProjector=function(hfov,nproj)
{
	if(this.projectors[4]==null)
	{
  var proj=new GLProjector(this);
  proj.setNumOfPanels(nproj);
  proj.hfov=hfov;
  proj.nproj=nproj;
	
	this.projectors[4]=proj;
	var self=proj;
	proj.draw=function()
	{
		var gl=self.canvas.gl;
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	 
		self.canvas.camera.setFOV(Math.atan(Math.tan((3.1415/180)* self.hfov/2)*gl.viewportHeight/(gl.viewportWidth/self.nproj))*2*180/3.1415);
	  
		var n= mat4.create();
		var cp = mat4.create();
		mat4.set(self.canvas.camera.mvMatrix, cp);
	  for(var i=0;i<self.nproj;i++)
		{
		
	  gl.viewport(Math.round(i*gl.viewportWidth/self.nproj), 0, Math.round((i+1)*gl.viewportWidth/self.nproj)-Math.round(i*gl.viewportWidth/self.nproj), gl.viewportHeight);
	  
	  self.canvas.camera.pushMatrix();
		mat4.identity(n);
		mat4.rotate(n,-(i-(self.nproj-1)/2)*(3.1415*self.hfov/180),[0,1,0]);
		self.p2Matrix=[n[0],n[1],n[2],n[4],n[5],n[6],n[8],n[9],n[10]];
		mat4.identity(n);
		mat4.rotate(n,(i-(self.nproj-1)/2)*(3.1415*self.hfov/180),[0,1,0]);
		mat4.multiply(n,cp,self.canvas.camera.mvMatrix);
		self.setCurrentPanel(i); 
		
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
GLCanvas.prototype.useRedCyanProjector=function()
{
	if(this.projectors[3]==null)
	{
  var proj=new GLProjector(this);
  proj.setNumOfPanels(2);
  
	this.projectors[3]=proj;
	var self=proj;
	proj.draw=function()
	{
		var gl=self.canvas.gl;
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.viewport(0,0, gl.viewportWidth, gl.viewportHeight);
	  
	  var n= mat4.create();
	  var cp = mat4.create();
	  
		mat4.identity(n);
		mat4.set(self.canvas.camera.mvMatrix, cp);
		mat4.translate(n,[.0675/2,0,0]);
		mat4.multiply(n,cp,self.canvas.camera.mvMatrix);
	  self.setCurrentPanel(0);	
	  gl.colorMask(true, false, false, true);
	  self.canvas._draw();

	  
		mat4.identity(n);
		mat4.set(self.canvas.camera.mvMatrix, cp);
		mat4.translate(n,[-.0675/2,0,0]);
		mat4.multiply(n,cp,self.canvas.camera.mvMatrix);
	  self.setCurrentPanel(1);
	  gl.clear(gl.DEPTH_BUFFER_BIT);
	  gl.colorMask(false, true, true, true);
	  self.canvas._draw();
  	  
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
  
	this.bufferTexture=new GLTexture(this.canvas);
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
	xmlhttp.open("POST", vn.hosturl+"/do/thmb/", true);
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
GLCanvas.prototype.setBackgroundColor=function(r,g,b,a)
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
GLCanvas.prototype.drawBackground=function()
{
	this.bkg.draw();
};

/**
 * Creates two headers for title and subtitle on the top left corner of the canvas. These headers can be used to superimpose text that describes the content shown on the canvas. 
 */
GLCanvas.prototype.createHeaders=function()
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
GLCanvas.prototype.setTitleOpacity=function(opacity)
{
	this.header_div.style.opacity=opacity;
};
/**
 * Sets the text of the title. Must be used after the initialization of the headers using createHeaders(). 
 * @param text A string with the text.
 */
GLCanvas.prototype.setTitle=function(text)
{
	this.header1_div.innerHTML=text;
};
/**
 * Sets the text of the second title (sub-title). Must be used after the initialization of the headers using createHeaders(). 
 * @param text A string with the text.
 */
GLCanvas.prototype.setSubTitle=function(text)
{
	this.header2_div.innerHTML=text;
};

//This function will run only once and at the end will revalidate the canvas in order to be resized properly.
GLCanvas.prototype._draw=function()
{
	this.total_number_of_elements=0;
	this.total_number_of_vertices=0;
	this.total_number_of_objects=0;
	this.in_draw=true;
	this.camera.pushMatrix();
	//if(this.isNewFrame())this._animate_p.callThen();
	this._draw_p.callThen();
	this.camera.popMatrix();
	this.beams.draw();
	this.loading_animation.draw();
    this.watermark.draw();
	this.in_draw=false;
	
	this.camera.revalidate();
	if(this.isNewFrame())this.__draw_counter+=1;
	
	if(this.__draw_counter>4)
		this._draw=this.__draw;
};

GLCanvas.prototype.__draw=function()
{
	this.total_number_of_elements=0;
	this.total_number_of_vertices=0;
	this.total_number_of_objects=0;
	this.in_draw=true;
	this.camera.pushMatrix();
	//if(this.isNewFrame())this._animate_p.callThen();
	this._draw_p.callThen();
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

/**
* This method requests an update of the picking map, which is used to identify which object is at each pixel of the canvas for user interaction purposes.
* It calls your canvas.whenDraw callback to render the entire scene in the picking map. For this reason you should NEVER call it inside your whenDraw or whenAnimate callback functions. Also consider instead of updating the picker map on every frame you may want to update it only on next user's tap using: updatePickingMap(true);
* @param onNextTap An optional boolean argument to identify if the updating should occure on next user's tap.
*/
GLCanvas.prototype.updatePickingMap=function(onNextTap){
	if(onNextTap) this.camera.acc_updated_since_last_touch=true;
	else this.roii.project();
};
/**
* Returns the object displayed at the given pixel on the canvas.
* @param x The x-coordinate of the pixel. The left-most pixel on the canvas has x-coordinate=0.
* @param y The y-coordinate of the pixel. The top-most pixel on the canvas has y-coordinate=0.
* @return GLObject The GLObject that corresponds to the given pixel, or null if there is no object rendered at that pixel.
*/
GLCanvas.prototype.getObjectAt=function(x,y){return this.roii.getObjectAt(x,y);};
/**
* Returns the depth value at the given pixel on the canvas. The depth is a non-negative number.
* @param x The x-coordinate of the pixel. The left-most pixel on the canvas has x-coordinate=0.
* @param y The y-coordinate of the pixel. The top-most pixel on the canvas has y-coordinate=0.
* @return float The depth value that corresponds to the given pixel, or 0 if there is no object rendered at that pixel.
*/
GLCanvas.prototype.getDepthAt=function(x,y){return this.roii.getDepthAt(x,y);};

/**
* Returns the transformed 3D coordinates at the given pixel on the canvas. The returned coordinates have been transformed by the model view matrix and the returned z-coordinate equals to -getDepthAt(x,y).
* @param x The x-coordinate of the pixel. The left-most pixel on the canvas has x-coordinate=0.
* @param y The y-coordinate of the pixel. The top-most pixel on the canvas has y-coordinate=0.
* @return Array An array of size 3 with the x, y, and z(=-depth) coordinate of the given pixel.
*/
GLCanvas.prototype.getXYDepthAt=function(x,y){return this.roii.getXYDepthAt(x,y);};

/**
* Returns the 3D coordinates at the given pixel on the canvas.
* @param x The x-coordinate of the pixel. The left-most pixel on the canvas has x-coordinate=0.
* @param y The y-coordinate of the pixel. The top-most pixel on the canvas has y-coordinate=0.
* @return Array An array of size 3 with the x, y, and z coordinate of the given pixel.
*/
GLCanvas.prototype.getXYZAt=function(x,y){return this.roii.getXYZAt(x,y);};

GLCanvas.prototype.tick=function()
{
	if(this._stopped)return;
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
		this._animate_p.callThen();
		var m=this.camera.mvMatrix;
		this.camera.mvMatrix_init=[m[0],m[1],m[2],m[4],m[5],m[6],m[8],m[9],m[10]];
		this.frame_counter+=1;
		this.current_projector.draw();
		this.camera.endDraw();
		if(!this.render_now_requested_in_draw)
			this.render_now=false;
		else this.render_now_requested_in_draw=false;
    }
	else this._keeps_rendering=false;
};

GLCanvas.prototype.getFrameID=function(){return this.frame_counter;};

GLCanvas.preserveDrawingBuffer=false;

GLCanvas.prototype.init=function()
{
	//console.log('%cVisiNeat - Open 3D Data Toolbox', 'padding:28px 82px;line-height:90px;color:rgb(255,255,255);background-color:rgb(120,120,120);text-shadow: 0.5px 1px 0 #888, 1px 2px 0 #898989, 1.5px 3px 0 #777, 2px 4px 0 #797979, 2.5px 5px 0 #666, 0 6px 1px rgba(0,0,0,.1), 0 0 5px rgba(0,0,0,.1), 0 1px 3px rgba(0,0,0,.3), 0 3px 5px rgba(0,0,0,.2), 0 5px 10px rgba(0,0,0,.25), 0 10px 10px rgba(0,0,0,.2), 0 20px 20px rgba(0,0,0,.15);font-size: 40px;');
	//console.log('%cwww.visineat.com - Share your 3D world','padding:28px 46px;font-size: 18px;');
   
        try {
            this.gl = this.canvas.getContext("experimental-webgl",{antialias:false,preserveDrawingBuffer: GLCanvas.preserveDrawingBuffer});
            this.gl.viewportWidth = this.canvas.width;
            this.gl.viewportHeight = this.canvas.height;
			//log(this.gl.getParameter(this.gl.SAMPLES));
        } catch (e) {
        }
        if (!this.gl) {
			this.showGLError();
			return false;
        }
		else return true;
};

GLCanvas.prototype.showGLError=function()
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
		    cnvs.addEventListener('click', function() { window.open(vn.hosturl+"/js/webgl_error.html", "_blank");}, false);
      		};
      		imageObj.src = vn.hosturl+'js/img/webgl_error-1.0.png';
			}
			else
			{
				var e=document.getElementById('error-message');
				e.innerHTML='<a href="'+vn.hosturl+'js/webgl_error.html" target="_blank"><img src="'+vn.hosturl+'js/img/webgl_error-1.0.png" width="'+cnvs.width+'" height="'+cnvs.height+'"/></a>';
			}
};

/**
 * Shows or hides the beams that portray the current lighting direction. The default value is false.
 * $param flag A boolean that indicates the desired status.
 */
GLCanvas.prototype.showBeams=function(flag)
{
	this.beams.setVisible(flag);
};

/**
 * Stops/Starts the VisiNeat loading animation. The default loading status is true and shows the animation. It should be called when all your assets have been loaded.
 * @param flag A boolean that indicates the desired status.
 */
GLCanvas.prototype.setLoadingStatus=function(flag)
{
	this.loading_animation.hide=!flag;
};

/**
 * Creates a progress bar on the top border of the canvas that shows the loading progress while loading your assets.  
 */
GLCanvas.prototype.createProgressBar=function()
{
	this.progress_bar=new ProgressBar(this.div_container,3);
}

GLCanvas.prototype.setProgress=function(value)
{
	if(this.progress_bar!=null) this.progress_bar.setProgress(value);
};

GLCanvas.prototype.setMaximumProgress=function(value)
{
	if(this.progress_bar!=null)this.progress_bar.setMaximumProgess(value);
};

/**
 * Adds one more task to be completed in the progress bar. It should be used after the initialization of the progress bar using the createProgressBar().  
 */
GLCanvas.prototype.oneMoreToDo=function()
{
	if(this.progress_bar!=null)this.progress_bar.oneMoreToDo();
};

/**
 * Indicates that one task has been completed in the progress bar. It should be used after the initialization of the progress bar using the createProgressBar().  
 */
GLCanvas.prototype.oneMoreDone=function()
{
	if(this.progress_bar!=null)this.progress_bar.oneMoreDone();
};
 
function GLCoordinateSystem()
{
	this._m=mat4.create();
	mat4.identity(this._m);
	this._mS=[];
}

/**
 * Returns the coefficients of the 4x4 matrix that represents the current coordinate system.
 * @return Array An array of size 16 with the coefficients of the matrix stored column by column.
 */
GLCoordinateSystem.prototype.get=function()
{
	return this._m;
};

/**
 * Makes a copy and returns the coefficients of the 4x4 matrix that represents the current coordinate system.
 * @return Array An array of size 16 with the coefficients of the matrix stored column by column.
 */
GLCoordinateSystem.prototype.getCopy=function()
{
	var m=mat4.create();
	mat4.set(this._m,m);
	return m;
};

/**
 * Sets the coefficients of the 4x4 matrix that represents the coordinate system.
 * @param matrix An array of size 16 with the coefficients of the matrix stored column by column.
 */
GLCoordinateSystem.prototype.set=function(matrix)
{
	mat4.set(matrix,this._m);
};

/**
 * Resets the coordinate system to the default state (identity matrix), so the origin becomes: 0,0,0.
 */
GLCoordinateSystem.prototype.identity=function()
{
	mat4.identity(this._m);
};


/**
 * Translates (moves) the coordinate system.
 * @param v An array of size 3 that contains the translation vector, i.e. the translation along x, y, and z. 
 */
GLCoordinateSystem.prototype.translate=function(t)
{
	mat4.translate(this._m,t);
};

/**
 * Transforms the coordinate system by multiplying it with a tranformation matrix.
 * @param matrix An array of size 16 that contains the coefficients of the 4x4 transformation matrix stored raw by raw.
 */
GLCoordinateSystem.prototype.multiply=function(matrix)
{
	mat4.multiply(this._m,matrix);
};

/**
 * Rotates the coordinate system with respect to its current origin.
 * @param b The rotation angle in radians.
 * @param c A unit vector of size 3 around of which the coordinate system will be rotated. 
 */
GLCoordinateSystem.prototype.rotate=function(angle,t)
{
	mat4.rotate(this._m,angle,t);
};

/**
 * Rotates the coordinate system around X axis with respect to its current origin. It is equivalent to rotate(b,[1,0,0]).
 * @param b The rotation angle in radians.
 */
GLCoordinateSystem.prototype.rotateX=function(angle)
{
	mat4.rotateX(this._m,angle);
};

/**
 * Rotates the coordinate system around Y axis with respect to its current origin. It is equivalent to rotate(b,[0,1,0]).
 * @param b The rotation angle in radians.
 */
GLCoordinateSystem.prototype.rotateY=function(angle)
{
	mat4.rotateY(this._m,angle);
};

/**
 * Rotates the coordinate system around Z axis with respect to its current origin. It is equivalent to rotate(b,[0,0,1]).
 * @param b The rotation angle in radians.
 */
GLCoordinateSystem.prototype.rotateZ=function(angle)
{
	mat4.rotateZ(this._m,angle);
};

/**
 * Scales the coordinate system.
 * @param s An array of size 3 that contains the scaling factors, i.e. the scaling along x, y, and z. 
 */
GLCoordinateSystem.prototype.scale=function(t)
{
	mat4.scale(this._m,t);
};

/**
 * Pushes the current coordinate system into a memory stack so that we can retrieve it later.
 */
GLCoordinateSystem.prototype.pushMatrix=function() {
    var copy = mat4.create();
    mat4.set(this._m, copy);
    this._mS.push(copy);
};

/**
 * Pops a coordinate system from the memory stack. It should be used in conjunction with the pushMatrix().
 */
GLCoordinateSystem.prototype.popMatrix=function() {
    if (this._mS.length == 0) {
        throw "Invalid popMatrix!";
    }
    this._m = this._mS.pop();
};

/**
 * Transforms a given 3D point from the default coordinate system, to the given coordinate system.
 * @param p An array of size 3 that contains the x,y,z cooridnates of the given point to be transformed.
 * @return Array An array of size 3 that contains the x,y,z cooridnates of the transformed point.
 */
GLCoordinateSystem.prototype.transform=function(p)
{
	var o=[0,0,0];
	mat4.multiplyVec3(this._m,p,o);
	return o;
};
 
function GLPicker(canvas)
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

GLPicker.prototype.getIDAt=function(x,y)
{
	var x_=x/this.canvas.getCamera().getWidth();
	var y_=y/this.canvas.getCamera().getHeight();
	var xy=this.canvas.current_projector.mapXY(x_,y_);
	var i=4*(Math.floor(this.width*xy[0])+this.width*Math.floor(this.height*(1-xy[1])));
	return this.id_data[i]+256*(this.id_data[i+1]+256*this.id_data[i+2]);
};

GLPicker.prototype.getObjectAt=function(x,y)
{
	var x_=x/this.canvas.getCamera().getWidth();
	var y_=y/this.canvas.getCamera().getHeight();
	var xy=this.canvas.current_projector.mapXY(x_,y_);
	var i=4*(Math.floor(this.width*xy[0])+this.width*Math.floor(this.height*(1-xy[1])));
	var id=this.id_data[i]+256*(this.id_data[i+1]+256*this.id_data[i+2]);
	if(id>0) return this.rois[id].parent_object;
	else return null;
};

GLPicker.prototype.getDepthAt=function(x,y)
{

	var x_=x/this.canvas.getCamera().getWidth();
	var y_=y/this.canvas.getCamera().getHeight();
	var xy=this.canvas.current_projector.mapXY(x_,y_);
	var i=4*(Math.floor(this.width*xy[0])+this.width*Math.floor(this.height*(1-xy[1])));
	return ((this.depth_data[i]+256*(this.depth_data[i+1]+256*this.depth_data[i+2]))/65536)-10;
};

GLPicker.prototype.getXYDepthAt=function(x,y)
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

GLPicker.prototype.getXYZAt=function(x,y)
{
	var xyz=this.getXYDepthAt(x,y);
	mat4.inverse(this.canvas.getCamera().mvMatrix,this.inverse_mat);
	var cc=[0,0,0,1];
	mat4.multiplyVec4(this.inverse_mat,[xyz[0],xyz[1],xyz[2],1],cc);
	//c.println(x+' '+y+' '+xyz[0]+' '+xyz[1]+' '+xyz[2]+' '+cc[0]+' '+cc[1]+' '+cc[2]);
	return cc;
};

GLPicker.prototype.initializeID=function()
{
	this.id_shader=new GLShader(this.canvas,{});
	var gl=this.canvas.getGL();
	this.idFrameBuffer=gl.createFramebuffer();
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.idFrameBuffer);
	this.id_data=new Uint8Array(this.width*this.height*4);
  
	this.bufferTexture=new GLTexture(this.canvas);
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

GLPicker.prototype.initializeDepth=function()
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
	
	this.depth_shader=new GLShader(this.canvas, {vertexShaderCode:vs,fragmentShaderCode:fs});
	var gl=this.canvas.getGL();
	
	this.depthFrameBuffer=gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthFrameBuffer);
	this.depth_data=new Uint8Array(this.width*this.height*4);
  
	this.bufferTexture=new GLTexture(this.canvas);
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

GLPicker.prototype.addROI=function(roi)
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

GLPicker.prototype.project=function()
{
	//console.log('pr start');
	this.projectID();
	this.projectDepth();
	//console.log('pr end');
};

GLPicker.prototype.projectID=function()
{
	var gl=this.canvas.gl;
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.idFrameBuffer);
	gl.viewport(0,0, this.width, this.height);
  
	this.camera.pushMatrix();
	this.shader=this.id_shader;
	if(typeof this.shader ==='undefined') return;
	this.shader.updateProjection();
	this.shader.updateModelView();
	
	gl.clearColor(0,0,0,0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);	
	this.draw_rois=true;
	
	this.canvas._draw_p.callThen();
	
	this.draw_rois=false;
		
	this.camera.popMatrix();

	gl.readPixels(0,0,this.width,this.height,gl.RGBA,gl.UNSIGNED_BYTE,this.id_data);
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.bindTexture(gl.TEXTURE_2D, null);
	
	gl.clearColor(this.canvas.background_color[0],this.canvas.background_color[1],this.canvas.background_color[2],this.canvas.background_color[3]);
};
 
GLPicker.prototype.projectDepth=function()
{
	var gl=this.canvas.gl;
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthFrameBuffer);
	gl.viewport(0,0, this.width, this.height);
  
	this.camera.pushMatrix();
	this.shader=this.depth_shader;
	if(typeof this.shader==='undefined')return;
	this.shader.updateProjection();
	this.shader.updateModelView();
	
	gl.clearColor(0,0,0,0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);	
	this.draw_rois=true;
		
	this.canvas._draw_p.callThen();;
	
	this.draw_rois=false;
		
	this.camera.popMatrix();

	gl.readPixels(0,0,this.width,this.height,gl.RGBA,gl.UNSIGNED_BYTE,this.depth_data);
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.bindTexture(gl.TEXTURE_2D, null);
	
	gl.clearColor(this.canvas.background_color[0],this.canvas.background_color[1],this.canvas.background_color[2],this.canvas.background_color[3]);
};
 
function GLPickingTarget(picker)
{
	this.picker=picker;
	this.canvas=picker.canvas;
	this.color_id=[0,0,0,1];
	this.obj=new GLObject(this.canvas,true);
	this.parent_object=null;
	this.canvas.roii.addROI(this);
}

GLPickingTarget.prototype.object=function(obj)
{
	this.parent_object=obj;
	var self=this;
	this.project=this._project_obj;
};

GLPickingTarget.prototype.quad=function(xyz)
{
	if(xyz.length!=12) return;
	this.obj.setXYZ(xyz);
	this.obj.setTriangles([1,0,3,1,3,2]);
	this.project=this._project;
};

GLPickingTarget.prototype._project_obj=function()
{
	if(this.parent_object.buffers["aXYZ"])
	{
		this.obj.sameXYZ(this.parent_object);
		this.obj.sameTriangles(this.parent_object);
		this.project=this._project;
		this.project();
	}
};

GLPickingTarget.prototype._project=function()
{
	this.picker.shader.setColorMask(this.color_id);
	this.obj.draw();
};

GLPickingTarget.prototype.project=function(){};
 
 /**
 * This class creates and renders a 3D object on a webGL canvas. You can easily create a 3D object by providing its vertices, faces, normal vectors, texture coordinates etc.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var object=new GLObject(my_canvas);<br>
 * object.setXYZ([0.4, 0.23, 1.2 ...]);<br>
 * object.setTriangles([0, 1, 2 ...]);<br></font>
 * @param gl_canvas A GLCanvas object.
 * @param is_roi An optional argument that indicates a special system use of this object. The default value is false. If the second argument is provided must be always false.
 */
function GLObject(gl_canvas,is_roi) //Constructor
{
	this.gl=gl_canvas.gl;
	this.canvas=gl_canvas;
    this.fid=0;
    this.filename="";
	this.corners=null;
	this.projectedCorners=null;
	this.num_of_corners=0;
	this.enable_picking=true;
	
	this._tap_p=new VNPromise(this);
  this._touch_p=new VNPromise(this);
  this._touchend_p=new VNPromise(this);
  this._dragstart_p=new VNPromise(this);
  this._drag_p=new VNPromise(this);
  this._dragend_p=new VNPromise(this);
  this._mouseenter_p=new VNPromise(this);
  this._mouseleave_p=new VNPromise(this);
	
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
		this.roi=new GLPickingTarget(gl_canvas.roii);
		this.roi.object(this);
	}
}

/**
 * Enables/disables the ability to pick/interact with this object. Picking is initially enabled for all new objects. When picking is enabled the events Tap, Drag, DragStart, DragStop, MouseEnter, and MouseLeave are called for this object.
 * @param flag A boolean that indicates the desired status.
 */
GLObject.prototype.disablePicking=function(flag){this.enable_picking=!flag;};

/**
 * This method returns a promise that will be triggered when the user taps on this object.
 * @return VNPromise The promise object associated with this event.
 */
GLObject.prototype.whenTapped=function(){return this._tap_p;};
/**
 * This method returns a promise that will be triggered when the user starts touching the object.
 * @return VNPromise The promise object associated with this event.
 */
GLObject.prototype.whenTouched=function(){return this._touch_p;};
/**
 * This method returns a promise that will be triggered when the user starts stops touching the object.
 * @return VNPromise The promise object associated with this event.
 */
GLObject.prototype.whenTouchEnds=function(){return this._touchend_p;};
/**
 * This method returns a promise that will be triggered when the user starts dragging the pointing device (mouse, finger, etc.) on this object.
 * @return VNPromise The promise object associated with this event.
 */
GLObject.prototype.whenDragStarts=function(){return this._dragstart_p;};
/**
 * This method returns a promise that will be triggered when the user drags the pointing device (mouse, finger, etc.) on this object.
 * @return VNPromise The promise object associated with this event.
 */
GLObject.prototype.whenDragged=function(){return this._drag_p;};
/**
 * This method returns a promise that will be triggered when the user stops dragging the pointing device (mouse, finger, etc.) on this object.
 * @return VNPromise The promise object associated with this event.
 */
GLObject.prototype.whenDragEnds=function(){return this._dragend_p;};
/**
 * This method returns a promise that will be triggered when the mouse enters in the area of this object.
 * @return VNPromise The promise object associated with this event.
 */
GLObject.prototype.whenPointerEnters=function(){return this._mouseenter_p;};
/**
 * This method returns a promise that will be triggered when the mouse leaves the area of this object.
 * @return VNPromise The promise object associated with this event.
 */
GLObject.prototype.whenPointerLeaves=function(){return this._mouseleave_p;};

/**
 * Translates (moves) the object's coordinate system.
 * @param v An array of size 3 that contains the translation vector, i.e. the translation along x, y, and z. 
 */
GLObject.prototype.translate=function(v)
{
	this.createMatrix();
	var a=this.mvMatrix;
	var d=v[0],e=v[1];v=v[2];
	a[12]=a[0]*d+a[4]*e+a[8]*v+a[12];a[13]=a[1]*d+a[5]*e+a[9]*v+a[13];a[14]=a[2]*d+a[6]*e+a[10]*v+a[14];a[15]=a[3]*d+a[7]*e+a[11]*v+a[15];	
};

GLObject.prototype.multiply=function(matrix)
{
	this.createMatrix();
	mat4.multiply(this.mvMatrix,matrix);
};

GLObject.prototype.createMatrix=function()
{
	if(this.mvMatrix)return;
	this.mvMatrix=mat4.create();
	mat4.identity(this.mvMatrix);
};

/**
 * Rotates the object's coordinate system with respect to its current origin.
 * @param b The rotation angle in radians.
 * @param c A unit vector of size 3 around of which the coordinate system will be rotated. 
 */
GLObject.prototype.rotate=function(b,c)
{
	this.createMatrix();
	var a=this.mvMatrix;
	var e=c[0],g=c[1];c=c[2];var f=Math.sqrt(e*e+g*g+c*c);if(!f)return;if(f!=1){f=1/f;e*=f;g*=f;c*=f}var h=Math.sin(b),i=Math.cos(b),j=1-i;b=a[0];f=a[1];var k=a[2],l=a[3],o=a[4],m=a[5],n=a[6],p=a[7],r=a[8],s=a[9],A=a[10],B=a[11],t=e*e*j+i,u=g*e*j+c*h,v=c*e*j-g*h,w=e*g*j-c*h,x=g*g*j+i,y=c*g*j+e*h,z=e*c*j+g*h;e=g*c*j-e*h;g=c*c*j+i;a[0]=b*t+o*u+r*v;a[1]=f*t+m*u+s*v;a[2]=k*t+n*u+A*v;a[3]=l*t+p*u+B*v;a[4]=b*w+o*x+r*y;a[5]=f*w+m*x+s*y;a[6]=k*w+n*x+A*y;a[7]=l*w+p*x+B*y;a[8]=b*z+o*e+r*g;a[9]=f*z+m*e+s*g;a[10]=k*z+n*e+A*g;a[11]=l*z+p*e+B*g;
};

/**
 * Rotates the object's coordinate system around X axis with respect to its current origin. It is equivalent to rotate(b,[1,0,0]).
 * @param b The rotation angle in radians.
 */
GLObject.prototype.rotateX=function(b){this.createMatrix();mat4.rotateX(this.mvMatrix,b);};

/**
 * Rotates the object's coordinate system around Y axis with respect to the current origin. It is equivalent to rotate(b,[0,1,0]).
 * @param b The rotation angle in radians.
 */
GLObject.prototype.rotateY=function(b){this.createMatrix();mat4.rotateY(this.mvMatrix,b);};

/**
 * Rotates the object's coordinate system around Z axis with respect to the current origin. It is equivalent to rotate(b,[0,0,1]).
 * @param b The rotation angle in radians.
 */
GLObject.prototype.rotateZ=function(b){this.createMatrix();mat4.rotateZ(this.mvMatrix,b);};

/**
 * Scales the object's coordinate system.
 * @param s An array of size 3 that contains the scaling factors, i.e. the scaling along x, y, and z. 
 */
GLObject.prototype.scale=function(s)
{
	this.createMatrix();
	var a=this.mvMatrix;
	var d=s[0],e=s[1];s=s[2];a[0]*=d;a[1]*=d;a[2]*=d;a[3]*=d;a[4]*=e;a[5]*=e;a[6]*=e;a[7]*=e;a[8]*=s;a[9]*=s;a[10]*=s;a[11]*=s;
};

/**
 * Resets the object's coordinate system to the default state (identity matrix).
 */
GLObject.prototype.identity=function()
{
	this.createMatrix();
	var a=this.mvMatrix;a[0]=1;a[1]=0;a[2]=0;a[3]=0;a[4]=0;a[5]=1;a[6]=0;a[7]=0;a[8]=0;a[9]=0;a[10]=1;a[11]=0;a[12]=0;a[13]=0;a[14]=0;a[15]=1;
};

GLObject.prototype.setCorners=function(corners)
{
	this.corners=corners;
	this.num_of_corners=this.corners.length/3;
	this.projectedCorners=new Float32Array(this.num_of_corners*2);
};

GLObject.prototype.projectCorners=function(modelViewPerspMatrix,width,height)
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
 
 GLObject.prototype.insideConvex=function(x,y)
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
 GLObject.prototype.onPlane=function(x,y)
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
GLObject.prototype.setData=function(buffername, data, dimensionality)
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
 * @param object Another GLObject whose data buffer will be used.
 */
GLObject.prototype.sameData=function(buffername, object)
{
	this.buffers[buffername]=object.buffers[buffername];
};
 
 /**
 * Sets the vertices of the 3D object. It is identical to: setData("aXYZ",vertices,3).
 * @param vertices An array of 3D vertices given in X,Y,Z,X,Y,Z... order preferably as a Float32Array typed array.
 */
GLObject.prototype.setXYZ=function(vertices){this.setData("aXYZ",vertices,3);};

 /**
 * Sets the vertices of the 3D object to be the same with another object. It is identical to: sameData("aXYZ",object).
 * @param object Another GLObject whose vertices will be used.
 */
GLObject.prototype.sameXYZ=function(object){this.sameData("aXYZ",object);};

 /**
 * Sets the normal vertices of the 3D object. It is identical to: setData("aNormal",vectors,3).
 * @param vectors An array of normal vertices given in Nx,Ny,Nz,Nx,Ny,Nz... order preferably as a Float32Array typed array.
 */
GLObject.prototype.setNormals=function(vectors){this.setData("aNormal",vectors,3);};

 /**
 * Sets the normal vertices of the 3D object to be the same with another object. It is identical to: sameData("aNormal",object).
 * @param object Another GLObject whose normal vertices will be used.
 */
GLObject.prototype.sameNormals=function(object){this.sameData("aNormal",object);};

 /**
 * Sets the vertex colors of the 3D object. The color component intensities must be given as real numbers in the interval [0-1]. It is identical to: setData("aColor",colors,3).
 * @param colors An array of colors given in R,G,B,R,G,B... order preferably as a Float32Array typed array.
 */
GLObject.prototype.setColors=function(colors){this.setData("aColor",colors,3);};
 /**
 * Sets the vertex colors of the 3D object to be the same with another object. It is identical to: sameData("aColor",object).
 * @param object Another GLObject whose vertix colors will be used.
 */
GLObject.prototype.sameColors=function(object){this.sameData("aColor",object);};

 /**
 * Sets the texture coordinates of the 3D object. The texture coordinates must be given as real numbers in the interval [0-1]. It is identical to: setData("aUV",coordinates,2).
 * @param coordinates An array of texture coordinates given in U,V,U,V... order preferably as a Float32Array typed array.
 */
GLObject.prototype.setUV=function(coordinates){this.setData("aUV",coordinates,2);};

 /**
 * Sets the texture coordinates of the 3D object to be the same with another object. It is identical to: sameData("aUV",object).
 * @param object Another GLObject whose texture coordinates will be used.
 */
GLObject.prototype.sameUV=function(object){this.sameData("aUV",object);};

 /**
 * Sets an index of elements (triangles, lines, points) that will be used to construct the object. The elements must be given as triplets of indices of vertices in the case of triangles, as pairs of indices of vertices in the case of lines, or as single indices of vertices in the case of points.
 * @param buffername A string with the corresponding element name, "Triangles", "Lines", or "Points". 
 * @param data An array of indices of vertices given in V1,V2,V3,V1,V2,V3... order preferably as a Uint16Array typed array.
 */
GLObject.prototype.setIndex=function(buffername,data)
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
 * @param object Another GLObject whose index buffer will be used.
 */
GLObject.prototype.sameIndex=function(buffername,object)
{
	if(typeof object.indices[buffername] === "undefined") return;
	this.indices[buffername]=object.indices[buffername];
	this.current_index=this.indices[buffername];
};


 /**
 * Constructs the 3D object as a triangular mesh using the given triangle faces. The faces must be given as triplets of indices of vertices. It is identical to: setIndex('Triangles',vertices);
 * @param vertices An array of indices of vertices given in V1,V2,V3,V1,V2,V3... order preferably as a Uint16Array typed array.
 */
GLObject.prototype.setTriangles=function(vertices){this.setIndex('Triangles',vertices);};
/**
 * Sets the triangle index of the 3D object to be the same with another object. It is identical to: sameIndex("Triangles",object).
 * @param object Another GLObject whose triangle index will be used.
 */
GLObject.prototype.sameTriangles=function(object){this.sameIndex('Triangles',object);};
GLObject.prototype.setTRI=GLObject.prototype.setTriangles;


 /**
 * Constructs the 3D object as a set of lines using the given line indices. The lines must be given as pairs of indices of vertices. It is identical to: setIndex('Lines',vertices);
 * @param vertices An array of indices of vertices given in V1,V2,V1,V2... order preferably as a Uint16Array typed array.
 */
GLObject.prototype.setLines=function(vertices){this.setIndex('Lines',vertices);};
/**
 * Sets the line index of the 3D object to be the same with another object. It is identical to: sameIndex("Lines",object).
 * @param object Another GLObject whose line index will be used.
 */
GLObject.prototype.sameLines=function(object){this.sameIndex('Lines',object);};
GLObject.prototype.setLIN=GLObject.prototype.setLines;

 /**
 * Constructs the 3D object as a point cloud using the given point indices. The points must be given as indices of vertices. It is identical to: setIndex('Lines',vertices);
 * @param vertices An array of indices of vertices given in V1,V1... order preferably as a Uint16Array typed array.
 */
GLObject.prototype.setPoints=function(vertices){this.setIndex('Points',vertices);};
/**
 * Sets the point index of the 3D object to be the same with another object. It is identical to: sameIndex("Points",object).
 * @param object Another GLObject whose point index will be used.
 */
GLObject.prototype.samePoints=function(object){this.sameIndex('Points',object);};
GLObject.prototype.setPOI=GLObject.prototype.setPoints;

GLObject.prototype.same=function(object,options)
{
	var opt=options||{xyz:true,normals:true,uv:true,colors:true,triangles:true,lines:true,points:true};
	if(opt.xyz)this.sameXYZ(object);
	if(opt.normals)this.sameNormals(object);
	if(opt.uv)this.sameUV(object);
	if(opt.colors)this.sameColors(object);
	if(opt.triangles)this.sameTriangles(object);
	if(opt.lines)this.sameLines(object);
	if(opt.points)this.samePoints(object);
};

/**
 * This method calculates a normal vector for each vertex in this object using the geometric information in the XYZ and Triangles arrays, which must be provided in advance using setXYZ and setTriangles.
 * The calculated normals are applied to the object by overwriting any prior normal vectors have been set using setNormals.
 */
GLObject.prototype.computeNormals=function(){
if(this.buffers['aXYZ'] && this.indices['Triangles'])
{
	var XYZ=this.buffers['aXYZ'].data;
	var NRM=new Float32Array(XYZ.length);
	var TRI=this.indices['Triangles'].data;
	var l=TRI.length/3;
	var t=0;
	for(var i=0;i<l;i++)
	{
		var idx1=TRI[t]*3;
		var p1=[XYZ[idx1], XYZ[idx1+1], XYZ[idx1+2]];
		var idx2=TRI[t+1]*3;
		var p2=[XYZ[idx2], XYZ[idx2+1], XYZ[idx2+2]];
		var idx3=TRI[t+2]*3;
		var p3=[XYZ[idx3], XYZ[idx3+1], XYZ[idx3+2]];
		var v1=[p2[0]-p1[0],p2[1]-p1[1],p2[2]-p1[2]];
		var mag1=Math.sqrt(v1[0]*v1[0]+v1[1]*v1[1]+v1[2]*v1[2]);
		var v2=[p3[0]-p1[0],p3[1]-p1[1],p3[2]-p1[2]];
		var mag2=Math.sqrt(v2[0]*v2[0]+v2[1]*v2[1]+v2[2]*v2[2]);
		if(mag1>0 && mag2>0)//&& Math.abs(v1[0]*v2[0]+v1[1]*v2[1]+v1[2]*v2[2])/(mag1*mag2)<0.99)
		{
		var n=[v1[1]*v2[2]-v1[2]*v2[1],v1[2]*v2[0]-v1[0]*v2[2],v1[0]*v2[1]-v1[1]*v2[0]];
		var mag=Math.sqrt(n[0]*n[0]+n[1]*n[1]+n[2]*n[2]);
		if(mag>0){n[0]/=mag;n[1]/=mag;n[2]/=mag;
		NRM[idx1]+=n[0];NRM[idx1+1]+=n[1];NRM[idx1+2]+=n[2];
		NRM[idx2]+=n[0];NRM[idx2+1]+=n[1];NRM[idx2+2]+=n[2];
		NRM[idx3]+=n[0];NRM[idx3+1]+=n[1];NRM[idx3+2]+=n[2];
		}
		}
		t+=3;
	}
	l=NRM.length/3;
	t=0;
	for(var i=0;i<l;i++)
	{
		var mag=Math.sqrt(NRM[t]*NRM[t]+NRM[t+1]*NRM[t+1]+NRM[t+2]*NRM[t+2]);
		if(mag>0){NRM[t]/=mag;NRM[t+1]/=mag;NRM[t+2]/=mag;}
		t+=3;
	}
	this.setData("aNormal",NRM,3);
}};

/**
 * This method calculates the two tangent vectors for each vertex in this object using the geometric information in the Normals, UV, and Triangles arrays, which must be provided in advance using setNormals (or computeNormals), setUV and setTriangles.
 * The calculated tangents are orthogonal to the respective normal and form a local orthogonal system at each vertex. The tangents are applied to the object in order to be used for Normal Map rendering or other similar shading models.
 */
GLObject.prototype.computeTangents=function(){
if(this.buffers['aNormal'] && this.buffers['aUV'] && this.indices['Triangles'])
{
	var XYZ=this.buffers['aXYZ'].data;
	var NRM=this.buffers['aNormal'].data;
	var TN1=new Float32Array(XYZ.length);
	var TN2=new Float32Array(XYZ.length);
	var UV=this.buffers['aUV'].data;
	var TRI=this.indices['Triangles'].data;
	var l=TRI.length/3;
	var t=0;
	for(var i=0;i<l;i++)
	{
		var idx1=TRI[t]*3;
		var p1=[XYZ[idx1], XYZ[idx1+1], XYZ[idx1+2]];
		var idx2=TRI[t+1]*3;
		var p2=[XYZ[idx2], XYZ[idx2+1], XYZ[idx2+2]];
		var idx3=TRI[t+2]*3;
		var p3=[XYZ[idx3], XYZ[idx3+1], XYZ[idx3+2]];
		var v1=[p2[0]-p1[0],p2[1]-p1[1],p2[2]-p1[2]];
		var v2=[p3[0]-p1[0],p3[1]-p1[1],p3[2]-p1[2]];
		
		var idx1_=TRI[t]*2;
		var uv1=[UV[idx1_], UV[idx1_+1]];
		var idx2_=TRI[t+1]*2;
		var uv2=[UV[idx2_], UV[idx2_+1]];
		var idx3_=TRI[t+2]*2;
		var uv3=[UV[idx3_], UV[idx3_+1]];
		var u1=[uv2[0]-uv1[0],uv2[1]-uv1[1]];
		var u2=[uv3[0]-uv1[0],uv3[1]-uv1[1]];
		
		var t1=[(v1[0]*u2[1]-v2[0]*u1[1]),(v1[1]*u2[1]-v2[1]*u1[1]),(v1[2]*u2[1]-v2[2]*u1[1])];
		var r=Math.sqrt(t1[0]*t1[0]+t1[1]*t1[1]+t1[2]*t1[2]);
		if(r>0){t1[0]/=r;t1[1]/=r;t1[2]/=r;}
		r = 1.0 / (u1[0] * u2[1] - u1[1] * u2[0]);
        var t2=[(v2[0]*u1[0]-v1[0]*u2[0])*r,(v2[1]*u1[0]-v1[1]*u2[0])*r,(v2[2]*u1[0]-v1[2]*u2[0])*r];
		
		//var n=[NRM[idx1],NRM[idx1+1],NRM[idx1+2]];
		//if(vec3.dot(vec3.cross(n,t1),t2)<0){t1[0]*=-1;t1[1]*=-1;t1[2]*=-1;}
		
		TN1[idx1]+=t1[0];TN1[idx1+1]+=t1[1];TN1[idx1+2]+=t1[2];
		TN1[idx2]+=t1[0];TN1[idx2+1]+=t1[1];TN1[idx2+2]+=t1[2];
		TN1[idx3]+=t1[0];TN1[idx3+1]+=t1[1];TN1[idx3+2]+=t1[2];
		TN2[idx1]+=t2[0];TN2[idx1+1]+=t2[1];TN2[idx1+2]+=t2[2];
		TN2[idx2]+=t2[0];TN2[idx2+1]+=t2[1];TN2[idx2+2]+=t2[2];
		TN2[idx3]+=t2[0];TN2[idx3+1]+=t2[1];TN2[idx3+2]+=t2[2];
		t+=3;
	}
	l=XYZ.length/3;
	t=0;
	for(var i=0;i<l;i++)
	{
		var mag=Math.sqrt(TN1[t]*TN1[t]+TN1[t+1]*TN1[t+1]+TN1[t+2]*TN1[t+2]);
		if(mag>0){TN1[t]/=mag;TN1[t+1]/=mag;TN1[t+2]/=mag;}
		mag=Math.sqrt(TN2[t]*TN2[t]+TN2[t+1]*TN2[t+1]+TN2[t+2]*TN2[t+2]);
		if(mag>0){TN2[t]/=mag;TN2[t+1]/=mag;TN2[t+2]/=mag;}
		t+=3;
	}
	this.setData("aTangent",TN1,3);
	this.setData("aTangent2",TN2,3);
}};

 /**
 * Sets the drawing mode of this object (triangles, lines, or points). Automatically, the draw mode is set to the last index of elements that was created in this object.
 * @param mode An integer with the value gl.TRIANGLES, or gl.LINES, or gl.POINTS.
 */
GLObject.prototype.setDrawMode=function(mode)
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
GLObject.prototype.setDrawModeTriangles=function()
{
	if(this.indices['Triangles'])
	{
		this.current_index=this.indices['Triangles'];
		//this.canvas.renderFrame();
	}
	
	if(this.models)
	for(var i=0;i<this.models.length;i++)
		this.models[i].setDrawModeTriangles();
}

 /**
 * Sets the drawing mode of this object to gl.LINES. It automatically constructs the vertex indices of the lines if the object was given as triangular mesh. 
 */
GLObject.prototype.setDrawModeLines=function()
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
	
	if(this.models)
	for(var i=0;i<this.models.length;i++)
		this.models[i].setDrawModeLines();
};

 /**
 * Sets the drawing mode of this object to gl.POINTS. It automatically constructs the vertex indices of the point cloud if the object was given as triangular mesh or a set of lines. 
 */
GLObject.prototype.setDrawModePoints=function()
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
	
	if(this.models)
	for(var i=0;i<this.models.length;i++)
		this.models[i].setDrawModePoints();
};

/**
 * Sets a GLShader to this object.
 * @param s A GLShader object. 
 */
GLObject.prototype.setShader=function(s)
{
	this._shader=s;
	if(this.models)
	for(var i=0;i<this.models.length;i++)
		this.models[i].setShader(s);
};

/**
 * Sets to this object the same GLShader of another object.
 * @param o A GLObject object. 
 */
GLObject.prototype.sameShader=function(o)
{
	this._shader=o.getShader();
};

/**
 * Returns the current GLShader associated with this object.
 * @return GLShader The current GLShader of this object. 
 */
GLObject.prototype.getShader=function(opt)
{
	if(this.canvas.roii.draw_rois) return this.canvas.roii.shader;
	
	if(this._shader==null) 
	{
		var options=opt||{};
		if(this.buffers['aUV']) options.uv=true;
		if(this.buffers['aColor'])options.colors=true;
		if(this.buffers['aTimeStamp'])options.timestamps=true;
		/*if(this._material==='undefined')
		{
			this._material=new GLMaterial(this.canvas);
			this._material.
		}*/
		var normls=false;
		if(this._material)
		{
			if(this._material.getAmbientColor())options.ambient=true;
			if(this.buffers['aNormal'])
			{
				if(this._material.getDiffuseColor())options.diffuse=true;
				if(this._material.getSpecularColor())options.specular=true;
				if(this._material.getMatCap())options.matcap=true;
				if(this._material.getReflection())options.reflection=true;
				if(this.buffers['aUV'])
				{
					if(this._material.getNormalMap())options.normalmap=true;
				}
			}
		}
		else
		{
			if(this.buffers['aNormal']){options.ambient=true;options.diffuse=true;options.specular=true;}
		}
		this._shader=new GLShader(this.canvas,options);
		if(this._material)
		{
			var v=this._material.getReflectionColor();if(v)this._shader.setUniform4fv('uReflectionColor',v);
			v=this._material.getMatCapColor();if(v)this._shader.setUniform4fv('uMatCapColor',v);
			v=this._material.getAmbientColor();if(v)this._shader.setUniform3fv('uAmbientColor',v);
			v=this._material.getDiffuseColor();if(v)this._shader.setUniform3fv('uDiffuseColor',v);
			v=this._material.getSpecularColor();if(v)this._shader.setUniform4fv('uSpecularColor',v);
			v=this._material.getSpecularExponent();if(v)this._shader.setUniform1f('uSpecularExponent',v);
			v=this._material.getNormalMapMagnitude();if(v)this._shader.setUniform1f('uNormalMapMagnitude',v);
			v=this._material.getNormalMapRepetition();if(v)this._shader.setUniform1f('uNormalMapRepetition',v);
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
GLObject.prototype.updateShader=function()
{
	var s=this.getShader();
	s.updateProjection();
	s.updateModelView(this.mvMatrix);
};

/**
 * Sets a GLTexture to this object.
 * @param t An existing GLTexture object, or the URL of an image file given as a string.
 * @param flag An optional boolean flag that indicates if we want to wait for the texture to be loaded before the object is rendered. The default is false, and in this case a default grey-gradient texture is shown until the actual texture is loaded.
 * @return Image A javascript Image object that will handle the image content. It will be returned only if a URL string is given as an input.
 */
GLObject.prototype.setTexture=function(t,flag)
{
	this.wait_for_texture=false;
	if(typeof flag!=='undefined') this.wait_for_texture=flag;
	if(typeof t=='string' || t instanceof Blob)
	{
		this.texture=new GLTexture(this.canvas);
		return this.texture.load(t);
	}
	else if(t instanceof VNPromise)
	{
		var txtr=new GLTexture(this.canvas);
		this.texture=txtr;
		t.then(function(url){txtr.load(url);});
	}
	else 
	{
		this.texture=t;
		return t;
	}
};

/**
 * Sets a video texture to this object.
 * @param t A string with the URL of a video file.
 * @param options Optionally, you can provide as an object one or more of the following parameters: autoplay (true, which is the default, or false), and loop (true, which is the default, or false). Example: setVideoTexture('video.mp4',{autoplay: true, loop: false});
 * @param flag An optional boolean flag that indicates if we want to wait for the video texture to be loaded before the object is rendered. The default is false, and in this case a default grey-gradient texture is shown until the actual video texture is loaded.
 * @return Video A javascript Video object that will handle the video content.
 */
GLObject.prototype.setVideoTexture=function(t,options,flag)
{
	this.wait_for_texture=false;
	if(typeof flag!=='undefined') this.wait_for_texture=flag;
	if(typeof t=='string')
	{
		this.texture=new GLTexture(this.canvas);
		return this.texture.loadVideo(t,options);
	}
	else {this.texture=t;return this.texture.texture.video;}
};

/**
 * Returns the current GLTexture associated with this object.
 * @return GLTexture The current GLTexture of this object. 
 */
GLObject.prototype.getTexture=function()
{
	return this.texture;
};

/**
 * Sets material properties to this object.
 * @param m A GLMaterial object that contains the material properties.
 */
GLObject.prototype.setMaterial=function(m)
{
	this._material=m;
};

/**
 * Returns the material properties of this object.
 * @return GLMaterial The GLMaterial object that contains the material properties.
 */
GLObject.prototype.getMaterial=function()
{
	if(typeof this._material==='undefined')
		this._material=new GLMaterial(this.canvas);		
	return this._material;
};

/**
 * Draws the object on the canvas. Optionally you can specify if the object should be drawn as a solid (which is the default setting), wireframe, or point cloud. 
 * @param options An optional object with one or more of the following fields: mode (a string with the value 'triangles', 'lines', or 'points'), updateShader (a boolean to indicate if the modelview or projection matrix must be updated to the shader, which is by default true)
 */
GLObject.prototype.draw=function(options)
{
	var opt=options||{};
	vn.default(opt,{updateShader:true});
	
	if(opt.mode)
	{
		if(opt.mode=='triangles')this.setDrawModeTriangles();
		else if(opt.mode=='lines')this.setDrawModeLines();
		else if(opt.mode=='points')this.setDrawModePoints();
	}
	
	if(opt.updateShader){
		this.updateShader();
		if(opt.updateLightingDirection)this.setUniform3fv("uLightingDirection", this.camera.getLightingDirection());
	}
	
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
		v=this._material.getNormalMap();if(v) {v.useAsNormalMap();if(this.buffers['aTangent']){}else this.computeTangents();}
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
	
	if(this.models)
	for(var i=0;i<this.models.length;i++)
		this.models[i].draw({updateShader:false});	
	
};

GLObject.prototype.drawHeightmap=function(shaderProgram)
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

GLObject.prototype.load=function(id,options){
	var opt=options||{};
	var prom=new VNPromise(this);
	var prom_called=false;
	var c=this.canvas;
	var pr=opt.progress||new VNProgress();
	this.models=[];
	var model=this.models;
	var self=this;
	var scale=[1,1,1];
	var translation=[0,0,0];
	vn.load({id:id,type:'string'},{progress:pr}).then(function(s){
			var datas=JSON.parse(s);
			var x=datas.range.X.max-datas.range.X.min;
			var y=datas.range.Y.max-datas.range.Y.min;
			var z=datas.range.Z.max-datas.range.Z.min;
			var max=x;
			if(y>max)max=y;
			if(z>max)max=z;
			scale=[1/max,1/max,1/max];
			translation=[-(datas.range.X.max+datas.range.X.min)/2,-(datas.range.Y.max+datas.range.Y.min)/2,-(datas.range.Z.max+datas.range.Z.min)/2];
			var textures_present=false;

			for(var m in datas.materials){
				if(datas.materials[m].texture){
					textures_present=true;
					var id=datas.materials[m].texture;
					datas.materials[m].texture=new GLTexture(c);
					vn.load({id:id,type:'url'},{progress:pr}).then(function(url,event,p){
						p.texture.load(url);
					}).texture=datas.materials[m].texture;
				}
			}

			var counter=0;
			for(var i=0;i<datas.models.length;i++)
				counter+=datas.models[i].parts.length;
			
			pr.oneMoreToDo(counter);
			
			var shader=null;
			
			var loaded_models=0;
			var loaded_parts=0;
			var loadNextPart=function(){
				
				if(loaded_models<datas.models.length){
					
					if(loaded_parts<datas.models[loaded_models].parts.length)
					{
						var mod=datas.models[loaded_models];
						var object=new GLObject(c);
						if(typeof mod.parts[loaded_parts]=='string'){
							vn.load({id:mod.parts[loaded_parts],type:'string'},{progress:pr}).then(function(s,e,p){
								pr.oneMoreDone();
								var part=JSON.parse(s);
								p.obj.setTriangles(part.Triangles);
								p.obj.setXYZ(part.XYZ);
								if(part.UV)p.obj.setUV(part.UV);
								if(part.Normals)p.obj.setNormals(part.Normals);
								p.obj._shader=null;
								if(shader==null){
									shader=p.obj.getShader();
									self.setShader(shader);
									self.scale(scale);
									self.translate(translation);
								}
								else p.obj.setShader(self.getShader());
								if(!textures_present)p.obj.getShader().useTexture(false);
								c.renderFrame();
								if(!prom_called){
									prom_called=true;
									prom.callThen();
								}
								loaded_parts+=1;
								loadNextPart();
							}).obj=object;
						}
						else{
							pr.oneMoreDone();
							object.setTriangles(mod.parts[loaded_parts].Triangles);
							object.setXYZ(mod.parts[loaded_parts].XYZ);
							object.setUV(mod.parts[loaded_parts].UV);
							object.setNormals(mod.parts[loaded_parts].Normals);
							loaded_parts+=1;
							loadNextPart();
						}
						if(mod.material&&datas.materials&&datas.materials[mod.material]){
							var mat=datas.materials[mod.material];
							if(mat.texture)object.setTexture(mat.texture);
						}
						model.push(object);
					}
					else {
						loaded_parts=0;
						loaded_models+=1;
						loadNextPart();
					}
					
				}else{
					//done
				}
	
			};
			
			loadNextPart();
	});
	return prom;
};

GLObject.prototype.createRect=function(w,h,u,v)
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

GLObject.prototype.createSphere81=function(radius)
{
	var _nrm=[0.0000,0.5257,0.8507,0.0000,-0.5257,0.8507,0.5257,0.8507,0.0000,-0.5257,0.8507,0.0000,0.8507,0.0000,0.5257,0.8507,0.0000,-0.5257,0.0000,0.0000,1.0000,0.5000,-0.3090,0.8090,0.5000,0.3090,0.8090,-0.5000,-0.3090,0.8090,-0.5000,0.3090,0.8090,0.3090,0.8090,0.5000,0.0000,1.0000,0.0000,-0.3090,0.8090,0.5000,0.8090,0.5000,0.3090,-0.8090,0.5000,0.3090,-0.3090,-0.8090,0.5000,0.3090,-0.8090,0.5000,-0.8090,-0.5000,0.3090,0.8090,-0.5000,0.3090,1.0000,0.0000,0.0000,0.0000,0.2733,0.9619,0.0000,-0.2733,0.9619,0.2599,-0.4339,0.8627,0.7020,-0.1606,0.6938,0.2599,0.4339,0.8627,0.7020,0.1606,0.6938,-0.2599,-0.4339,0.8627,-0.7020,-0.1606,0.6938,-0.2599,0.4339,0.8627,-0.7020,0.1606,0.6938,0.1606,0.6938,0.7020,0.4339,0.8627,0.2599,0.2733,0.9619,0.0000,-0.2733,0.9619,0.0000,-0.1606,0.6938,0.7020,-0.4339,0.8627,0.2599,0.6938,0.7020,0.1606,0.8627,0.2599,0.4339,-0.6938,0.7020,0.1606,-0.8627,0.2599,0.4339,-0.1606,-0.6938,0.7020,-0.4339,-0.8627,0.2599,0.1606,-0.6938,0.7020,0.4339,-0.8627,0.2599,-0.6938,-0.7020,0.1606,-0.8627,-0.2599,0.4339,0.6938,-0.7020,0.1606,0.8627,-0.2599,0.4339,0.9619,0.0000,0.2733,0.9619,0.0000,-0.2733,0.2629,-0.1625,0.9511,0.5257,0.0000,0.8507,0.2629,0.1625,0.9511,-0.2629,-0.1625,0.9511,-0.5257,0.0000,0.8507,-0.2629,0.1625,0.9511,0.1625,0.9511,0.2629,-0.1625,0.9511,0.2629,0.0000,0.8507,0.5257,0.5878,0.6882,0.4253,0.6882,0.4253,0.5878,0.4253,0.5878,0.6882,-0.5878,0.6882,0.4253,-0.6882,0.4253,0.5878,-0.4253,0.5878,0.6882,-0.1625,-0.9511,0.2629,0.1625,-0.9511,0.2629,0.0000,-0.8507,0.5257,-0.5878,-0.6882,0.4253,-0.6882,-0.4253,0.5878,-0.4253,-0.5878,0.6882,0.5878,-0.6882,0.4253,0.6882,-0.4253,0.5878,0.4253,-0.5878,0.6882,0.9511,0.2629,0.1625,0.9511,0.2629,-0.1625,0.8507,0.5257,0.0000,-0.9511,0.2629,-0.1625,-0.9511,0.2629,0.1625,-0.8507,0.5257,0.0000];
	for(var i=0;i<243;i++) _nrm[i+243]=-_nrm[i];
	var _xyz=new Array();
	for(var i=0;i<486;i++) _xyz[i]=_nrm[i]*radius;
	this.setXYZ(_xyz);
	this.setNormals(_nrm);
	this.setTriangles([1,23,22,7,51,23,6,22,51,22,23,51,4,26,24,8,52,26,7,24,52,24,26,52,0,21,25,8,25,53,6,53,21,21,53,25,7,52,51,8,53,52,6,51,53,51,52,53,1,22,27,9,27,54,6,54,22,22,54,27,86,28,30,10,30,55,9,55,28,28,55,30,0,29,21,10,56,29,6,21,56,21,29,56,9,54,55,10,55,56,6,56,54,54,56,55,2,33,32,12,57,33,11,32,57,32,33,57,3,36,34,13,58,36,12,34,58,34,36,58,0,31,35,13,35,59,11,59,31,31,59,35,12,58,57,13,59,58,11,57,59,57,58,59,2,32,37,14,37,60,11,60,32,32,60,37,4,38,26,8,26,61,14,61,38,26,38,61,0,25,31,8,62,25,11,31,62,25,62,31,14,60,61,8,61,62,11,62,60,60,62,61,3,39,36,15,63,39,13,36,63,36,39,63,86,30,40,10,64,30,15,40,64,30,64,40,0,35,29,10,29,65,13,65,35,29,35,65,15,64,63,10,65,64,13,63,65,63,64,65,82,103,104,88,104,132,87,132,103,103,132,104,85,105,107,89,107,133,88,133,105,105,133,107,81,106,102,89,134,106,87,102,134,102,106,134,88,132,133,89,133,134,87,134,132,132,134,133,82,108,103,90,135,108,87,103,135,103,108,135,5,111,109,91,136,111,90,109,136,109,111,136,81,102,110,91,110,137,87,137,102,102,137,110,90,136,135,91,137,136,87,135,137,135,136,137,83,113,114,93,114,138,92,138,113,113,138,114,84,115,117,94,117,139,93,139,115,115,139,117,81,116,112,94,140,116,92,112,140,112,116,140,93,138,139,94,139,140,92,140,138,138,140,139,83,118,113,95,141,118,92,113,141,113,118,141,85,107,119,89,142,107,95,119,142,107,142,119,81,112,106,89,106,143,92,143,112,106,112,143,95,142,141,89,143,142,92,141,143,141,142,143,84,117,120,96,120,144,94,144,117,117,144,120,5,121,111,91,111,145,96,145,121,111,121,145,81,110,116,91,146,110,94,116,146,110,146,116,96,144,145,91,145,146,94,146,144,144,146,145,83,114,42,93,66,114,16,42,66,114,66,42,84,44,115,17,67,44,93,115,67,115,44,67,1,41,43,17,43,68,16,68,41,41,68,43,93,67,66,17,68,67,16,66,68,66,67,68,83,42,45,18,45,69,16,69,42,42,69,45,86,46,28,9,28,70,18,70,46,28,46,70,1,27,41,9,71,27,16,41,71,27,71,41,18,69,70,9,70,71,16,71,69,69,71,70,84,47,44,19,72,47,17,44,72,44,47,72,4,24,48,7,73,24,19,48,73,24,73,48,1,43,23,7,23,74,17,74,43,23,43,74,19,73,72,7,74,73,17,72,74,72,73,74,2,123,33,12,33,147,97,147,123,33,123,147,3,34,125,98,125,148,12,148,34,34,148,125,82,124,122,98,149,124,97,122,149,122,124,149,12,147,148,98,148,149,97,149,147,147,149,148,2,126,123,99,150,126,97,123,150,123,126,150,5,109,127,90,151,109,99,127,151,109,151,127,82,122,108,90,108,152,97,152,122,108,122,152,99,151,150,90,152,151,97,150,152,150,151,152,3,125,128,100,128,153,98,153,125,125,153,128,85,129,105,88,105,154,100,154,129,105,129,154,82,104,124,88,155,104,98,124,155,104,155,124,100,153,154,88,154,155,98,155,153,153,155,154,4,49,38,20,75,49,14,38,75,38,49,75,5,127,50,99,76,127,20,50,76,127,76,50,2,37,126,99,126,77,14,77,37,37,77,126,20,76,75,99,77,76,14,75,77,75,76,77,85,119,130,101,130,156,95,156,119,119,156,130,86,131,46,18,46,157,101,157,131,46,131,157,83,45,118,18,158,45,95,118,158,118,45,158,101,156,157,18,157,158,95,158,156,156,158,157,85,130,129,101,78,130,100,129,78,129,130,78,86,40,131,15,79,40,101,131,79,40,79,131,3,128,39,15,39,80,100,80,128,39,128,80,101,79,78,15,80,79,100,78,80,78,79,80,4,48,49,20,49,159,19,159,48,48,159,49,5,50,121,96,121,160,20,160,50,121,50,160,84,120,47,96,161,120,19,47,161,120,161,47,20,159,160,96,160,161,19,161,159,159,161,160]);
};

GLObject.prototype.createSphere=function(radius_xz, radius_y, repetitions, from_phi,to_phi,resolution_phi,from_theta,to_theta,resolution_theta)
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
 * This class creates the material properties of a GLObject. You can use this class to control the shading properties of the object, such as the ambient, diffuse, and specular color components, use a matcap texture to model the shading of the object, use a normal map texture to model structural details of the object, and add reflection using spherical HDRI textures.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var material=new GLMaterial(my_canvas);<br>
 * material.setSpecularColor([1.0,1.0,1.0]);<br>
 * material.setSpecularExponent(5);<br>
 * material.setMatCap("/img/matcap.jpg");<br>
 * material.setReflection("/img/hdri.jpg");<br>
 * material.setReflectionColor([0.1,0.1,0.1]);<br>
 * object.setMaterial(material);<br></font>
 * @param gl_canvas A GLCanvas object.
 */
function GLMaterial(gl_canvas)
{
	this.canvas=gl_canvas;
}

GLMaterial.prototype._getColorInput=function(r,g,b,a)
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
GLMaterial.prototype.setAmbientColor=function(r,g,b)
{
	var clr=this._getColorInput(r,g,b,1);
	if(typeof clr!=='undefined') this.Ka=[clr[0],clr[1],clr[2]];
};
/**
 * Returns the ambient color of the Phong shading model.
 * @return Array The color as a float array of size 4, with R,G,B,A.
 */
GLMaterial.prototype.getAmbientColor=function(){return this.Ka;};

/**
 * Sets the diffuse color of the Phong shading model.
 * @param r The red color component as a real number in the range [0-1]
 * @param g The green color component as a real number in the range [0-1]
 * @param b The blue color component as a real number in the range [0-1]
 */
GLMaterial.prototype.setDiffuseColor=function(r,g,b)
{
	var clr=this._getColorInput(r,g,b,1);
	if(typeof clr!=='undefined') this.Kd=[clr[0],clr[1],clr[2]];
};
/**
 * Returns the diffuse color of the Phong shading model.
 * @return Array The color as a float array of size 4, with R,G,B,A.
 */
GLMaterial.prototype.getDiffuseColor=function(){return this.Kd;};

/**
 * Sets the specular color of the Phong shading model.
 * @param r The red color component as a real number in the range [0-1]
 * @param g The green color component as a real number in the range [0-1]
 * @param b The blue color component as a real number in the range [0-1]
 */
GLMaterial.prototype.setSpecularColor=function(r,g,b)
{
	var clr=this._getColorInput(r,g,b,1);
	if(typeof clr!=='undefined') this.Ks=clr;
};
/**
 * Returns the specular color of the Phong shading model.
 * @return Array The color as a float array of size 4, with R,G,B,A.
 */
GLMaterial.prototype.getSpecularColor=function(){return this.Ks;};
/**
 * Sets the specular exponent of the Phong shading model. The default value is 10.
 * @param e The specular exponent of the Phong shading model.
 */
GLMaterial.prototype.setSpecularExponent=function(e)
{
	this.Ns=e;
	if(typeof (this.getSpecularColor())==='undefined')this.setSpecularColor([1,1,1]);
};
/**
 * Returns the specular exponent of the Phong shading model.
 * @param float The specular exponent of the Phong shading model.
 */
GLMaterial.prototype.getSpecularExponent=function(){return this.Ns;};

/**
 * Sets the matcap color to be blended with the MatCap texture image. The default color is: 1,1,1
 * @param r The red color component as a real number in the range [0-1]
 * @param g The green color component as a real number in the range [0-1]
 * @param b The blue color component as a real number in the range [0-1]
 */
GLMaterial.prototype.setMatCapColor=function(r,g,b)
{
	var clr=this._getColorInput(r,g,b,1);
	if(typeof clr!=='undefined') this.Km=clr;
};
/**
 * Returns the matcap color mask.
 * @return Array The color as a float array of size 4, with R,G,B,A.
 */
GLMaterial.prototype.getMatCapColor=function(){return this.Km;};

/**
 * Sets a MatCap shading to this material from a given MatCap texture image.
 * @param t An existing GLTexture object, or the URL of an image file given as a string.
 */
GLMaterial.prototype.setMatCap=function(t)
{
	if(t instanceof GLTexture)this.matcap=t;
	else if(t instanceof VNPromise)
	{
		var txtr=new GLTexture(this.canvas);
		this.matcap=txtr;
		t.then(function(url){txtr.load(url);});
	}
	else
	{
		this.matcap=new GLTexture(this.canvas);
		return this.matcap.load(t);
	}
};
/**
 * Returns the current MatCap associated with this material.
 * @return GLTexture The current MatCap texture image as a GLTexture object. 
 */
GLMaterial.prototype.getMatCap=function(){return this.matcap;};

/**
 * Sets a normal map to this material from a given normal map texture image.
 * @param t An existing GLTexture object, or the URL of an image file given as a string.
 */
GLMaterial.prototype.setNormalMap=function(t)
{
	if(t instanceof GLTexture)this.normalmap=t;
	else if(t instanceof VNPromise)
	{
		var txtr=new GLTexture(this.canvas);
		this.normalmap=txtr;
		t.then(function(url){txtr.load(url);});
	}
	else
	{
		this.normalmap=new GLTexture(this.canvas);
		return this.normalmap.load(t);
	} 
};
/**
 * Returns the current normap map associated with this material.
 * @return GLTexture The current normal map texture image as a GLTexture object. 
 */
GLMaterial.prototype.getNormalMap=function(){return this.normalmap;};
/**
 * Sets the repetition factor of the normal map. The default value is 1.
 * @param e The repetition factor of the normal map.
 */
GLMaterial.prototype.setNormalMapRepetition=function(r)
{
	this.Nr=r;
};
/**
 * Returns the repetition factor of the normal map.
 * @param float The repetition factor of the normal map.
 */
GLMaterial.prototype.getNormalMapRepetition=function(){return this.Nr;};
/**
 * Sets the magnitude of the normal map. The default value is 1.
 * @param e The magnitude of the normal map.
 */
GLMaterial.prototype.setNormalMapMagnitude=function(m)
{
	this.Nm=m;
};
/**
 * Returns the magnitude of the normal map.
 * @param float The magnitude of the normal map.
 */
GLMaterial.prototype.getNormalMapMagnitude=function(){return this.Nm;};
/**
 * Sets the reflection color to be blended with the reflection texture image. The default color is: 0.5,0.5,0.5
 * @param r The red color component as a real number in the range [0-1]
 * @param g The green color component as a real number in the range [0-1]
 * @param b The blue color component as a real number in the range [0-1]
 */
GLMaterial.prototype.setReflectionColor=function(r,g,b)
{
	var clr=this._getColorInput(r,g,b,1);
	if(typeof clr!=='undefined') this.Kr=clr;
};
/**
 * Returns the reflection color mask.
 * @return Array The color as a float array of size 4, with R,G,B,A.
 */
GLMaterial.prototype.getReflectionColor=function(){return this.Kr;};

/**
 * Sets reflection to this material from a given spherical HDRI texture image.
 * @param t An existing GLTexture object, or the URL of an image file given as a string.
 */
GLMaterial.prototype.setReflection=function(t)
{
	if(t instanceof GLTexture)this.reflection=t;
	else if(t instanceof VNPromise)
	{
		var txtr=new GLTexture(this.canvas);
		this.reflection=txtr;
		t.then(function(url){txtr.load(url);});
	}
	else
	{
		this.reflection=new GLTexture(this.canvas);
		return this.reflection.load(t);
	}
};
/**
 * Returns the current reflection image associated with this material.
 * @return GLTexture The current reflection spherical HDRI texture image as a GLTexture object. 
 */
GLMaterial.prototype.getReflection=function(){return this.reflection;};

function BoundingBox(min,max,canvas)
{
	this.canvas=canvas;
	this.obj=null;
	
	this.obj=new GLObject(canvas);
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
	this.obj_h=new GLObject(canvas);
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
	this.obj_h.setShader(new GLShader(canvas,{vertexShaderCode:
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
	fragmentShaderCode:["precision mediump float;",
	"varying float vX;",
	"varying float vT;",
	"varying vec4 vColor;",
	"void main(void){",
	"gl_FragColor=vColor;",
	//"if(vX>vT) discard;",
	"}"]}));
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
VN_default_texture_image.src = vn.hosturl+'js/img/default_texture-1.0.png';

/**
 * This class creates and handles a webGL texture. It can be used in conjunction with a GLObject.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var texture=new GLTexture(my_canvas);<br>
 * texture.load('my_picture.png');<br></font>
 * @param gl_canvas A GLCanvas object.
 * @param name An optional name for this texture (Optional argument).
 */
function GLTexture(gl_canvas,name)
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
	this.is_loading=false;
	this.frame_id=0;
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
 * @param input The input can be a string with the URI address of an image file or a Blob object with the image data.
 * @return Image A javascript Image object that will handle the image content.
 */
GLTexture.prototype.load=function(filename)
{
	var is_blob=false;
	if(filename instanceof Blob)
	{
		is_blob=true;
		filename=URL.createObjectURL(filename);
	}
	
	if(typeof filename !== 'undefined')
	{
		this.filename=filename;
		var self=this;
		this.texture.image.onload = function () {
			self.is_loading=false;
			self.handleLoadedTexture();
			vn.progress.oneMoreDone();
			self.loaded=true;
			self.onLoad();
			if(is_blob)URL.revokeObjectURL(filename);
		};
		this.texture.image.onerror= function(){			
			self.is_loading=false;
			vn.progress.oneMoreDone();
		};
		
		this.texture.image.src = filename;
		if(this.is_loading) vn.progress.oneMoreDone();
		this.is_loading=true;
		vn.progress.oneMoreToDo();
		return this.texture.image;
	}
};

/**
 * This method loads a video to this texture.
 * @param filename The URI address of a video file. 
 * @param options Optionally, you can provide as an object one or more of the following parameters: autoplay (true, which is the default, or false), and loop (true, which is the default, or false). Example: setVideoTexture('video.mp4',{autoplay: true, loop: false});
 * @return Video A javascript Video object that will handle the video content.
 */
GLTexture.prototype.loadVideo=function(filename,options)
{
	if(typeof filename !== 'undefined')
	{
		this.filename=filename;
		this.texture.video=document.createElement("video");
		this.texture.video.crossOrigin = "";
		this.texture.video.autoplay=false;
		if(typeof options!=='undefined' && typeof options.loop!=='undefined')
			this.texture.video.loop=options.loop;
		else this.texture.video.loop=true;
		
		var self=this;
		this.texture.video.oncanplay = function () {
				vn.progress.oneMoreDone();
				self.loaded=true;
				if(typeof options!=='undefined' && typeof options.autoplay!=='undefined')
				{	if(options.autoplay==true){self.texture.video.play();console.log('1');}
				}
				else {self.texture.video.play();console.log('2');}
				self.update();
				self.onLoad();
			};
			
		vn.progress.oneMoreToDo();
		this.texture.video.src=filename;
		return this.texture.video;
		/*this.texture.image.onerror= function(){
			vn.progress.oneMoreDone();
		};*/
		
	}
};

/**
 * A callback function that is called when the texture is loaded. It is initially empty. 
 */
GLTexture.prototype.onLoad=function(){};
/**
 * Returns the loading status of this texture image. 
 * @return boolean The loading status. 
 */
GLTexture.prototype.isLoaded=function(){return this.loaded;};

GLTexture.prototype.handleLoadedTexture=function() {
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
 * This method updates the content of this texture using a given content such as an Image object, a Video object, or a Canvas object. 
 * @param content The input element to be set as the content of this texture. The data type of this input parameter can be: Image, Video, Canvas and possibly others.
 */
GLTexture.prototype.draw=function(content)
{
	var gl=this.gl;
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, content);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	var w=content.width;
	var h=content.height;
	if( w&&(w&(w-1))!==0 || h&&(h&(h-1))!==0)
	{
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}
	this.canvas.renderFrame();
};

/**
 * This method updates the content of this texture using the current frame of a video source.
 * @param video_source An optional argument with a JavaScript video source object. The input argument can be omitted if loadVideo() has been used to load a video file in this texture. 
 */
GLTexture.prototype.update=function(video_source)
{
	var fid=this.canvas.getFrameID();
	if(this.frame_id>=fid-1)return;else this.frame_id=fid;
	if(typeof video_source==='undefined') video_source=this.texture.video;
	var gl=this.gl;
	if( video_source.readyState === video_source.HAVE_ENOUGH_DATA ){
	//console.log(video_source.currentTime);
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

/**
 * This method sets the contents of this texture to a given text. You can customize the color of the text, the font family and size, the background of the texture, and the size of the texture image.
 * @param options An object with one or more of the following fields. text: a string with the text to be printed, color: a string with the color of the text (default black), font: a string with the font and size of the font (default 20px Arial), background: a string with the color of the background (default undefined, i.e. transparent), width: a number with the pixel width of the texture (default 256), height: a number with the pixel width of the texture (default 256), textAlign: a string with the alignment of the text (dafault center), textBaseline: a string with the baseline of the text (default middle), cutText: if true the text will be cut from the background (default false).
 */
GLTexture.prototype.text=function(options)
{
	var opt=options||{};
	vn.default(opt,{width:256,height:256,text:'',font:'20px Arial',textAlign:'center',textBaseline:'middle',color:'black'});
	
	if(this.canvas.resize_texture_ctx==null)
	{
		this.canvas.resize_texture_canvas = document.createElement('canvas')
		this.canvas.resize_texture_canvas.width = 512;
		this.canvas.resize_texture_canvas.height = 512;
		this.canvas.resize_texture_ctx = this.canvas.resize_texture_canvas.getContext('2d');   
	}
	
	var ctx=this.canvas.resize_texture_ctx;
	
	ctx . canvas . width = opt.width ;
	ctx . canvas . height = opt.height ;
	ctx . font = opt.font ;
	ctx . textAlign = opt.textAlign ;
	ctx . textBaseline = opt.textBaseline ;
	ctx . clearRect ( 0 , 0 , ctx . canvas . width , ctx . canvas . height ) ;
	if(opt.background)
	{
		ctx . fillStyle = opt.background ;
		ctx . fillRect ( 0 , 0 , ctx . canvas . width , ctx . canvas . height ) ;
	}
	ctx . fillStyle = opt.color ;
	if(opt.cutText)
	{
		ctx.imageSmoothingEnabled=false;
		ctx.globalCompositeOperation='destination-out';
	}
	ctx . fillText ( opt.text , opt.width / 2 , opt.height / 2 ) ;
	if(opt.cutText)
	{
		ctx.imageSmoothingEnabled=true;
		ctx.globalCompositeOperation='source-over';
	}
	this.draw(ctx.canvas);
};

GLTexture.prototype.resizeMX=function(image)
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
GLTexture.prototype.use=function()
{
	var gl=this.gl;
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this.texture);
}; 
 
 GLTexture.prototype.useAsReflection=function()
{
	var gl=this.gl;
	gl.activeTexture(gl.TEXTURE2);
	gl.bindTexture(gl.TEXTURE_2D, this.texture);
}; 

 GLTexture.prototype.useAsMatCap=function()
{
	var gl=this.gl;
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, this.texture);
}; 

 GLTexture.prototype.useAsNormalMap=function()
{
	var gl=this.gl;
	gl.activeTexture(gl.TEXTURE3);
	gl.bindTexture(gl.TEXTURE_2D, this.texture);
}; 
 
/**
 * This class implements a virtual camera that controls the projection and model view of the canvas.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var camera=canvas.getCamera();<br>
 * camera.getFPS();<br></font>
 * @param gl_canvas A GLCanvas object.
 */
function GLCamera(gl_canvas)
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
	this.alpha=0;
	this.beta=0;
	this.gamma=-90;
	
	this._updatePickingMap_now=false;
	
	
	
	this.zoom_mem=1;
	this.working_zRot=0;
	this.xRot=0;
	this.yRot=0;
	this.zRot=0;
	this.xRot2=0;
	this.yRot2=0;
	this.enable_rotateZ=false;
	this.xTra=0;
	this.yTra=0;
	this.zTra=0;
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
	this.mvMatrix_init = [1,0,0,0,1,0,0,0,1];
		
	this.viewMatrix=new GLCoordinateSystem();
	
	this.ixMatrix_mem = mat4.create();
	mat4.identity(this.ixMatrix_mem);

	this.pMatrix = mat4.create();
	mat4.perspective(45, this.gl.viewportWidth / this.gl.viewportHeight, 0.001, 100.0, this.pMatrix);
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
 * Returns the current view matrix of the camera.
 * @return GLCoordinateSystem The current view matrix of the camera.
 */
GLCamera.prototype.getViewMatrix=function(){return this.viewMatrix;};

/**
 * Sets the vertical FOV of the camera. Default value is 45.
 * @param fov The vertical FOV given in degrees. 
 */
GLCamera.prototype.setFOV=function(fov)
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
GLCamera.prototype.getFOV=function(){return this.fov;};

/**
 * Returns the focal length of the camera.
 * @return float The focal length.
 */
GLCamera.prototype.getFocalLength=function(){return this.focal_length;};

/**
 * Returns the aspect ratio of the camera width/height.
 * @return float The aspect ratio.
 */
GLCamera.prototype.getAspectRatio=function(){return this.aspect_ratio;};


/**
 * Sets the pixel density of the camera. Default value is 1 to match the pixels of your device. Lower values will enhance performance but compromise quality. Higher values will have the opposite effect.
 * @param value The desired pixel density as a real number. 
 */
GLCamera.prototype.setPixelDensity=function(value)
{
this.resolutionFactor=value;
this.pixelDensity=this.realToCSSPixels*this.resolutionFactor;
this.container_width-=1;
this.canvasElement.style.width=(this.div_container.clientWidth+1)+'px';
this.resize();
};

GLCamera.prototype.revalidate=function()
{
this.container_width-=1;
this.canvasElement.style.width=(this.div_container.clientWidth+1)+'px';
this.canvas.renderFrame();
};

/**
 * Returns the pixel density of the camera. 
 * @return float The current pixel density. 
 */
GLCamera.prototype.getPixelDensity=function(){return this.pixelDensity;};

/**
 * Returns the width of the camera frame in pixels. 
 * @return int The width of the camera frame. 
 */
GLCamera.prototype.getWidth=function(){return this.width;};
/**
 * Returns the height of the camera frame in pixels. 
 * @return int The height of the camera frame. 
 */
GLCamera.prototype.getHeight=function(){return this.height;};

/**
 * Returns the current number of frames per second of the camera. 
 * @return float The frames per second. 
 */
GLCamera.prototype.getFPS=function()
{
	return 1/this.inverseFPS;
};

/**
 * Returns the regularized number of frames per second of the camera. It returns a more smooth measurement than the result of getFPS(). 
 * @return float The frames per second. 
 */
GLCamera.prototype.getFPSSmooth=function()
{
	return 1/this.inverseFPS_smooth;
};

/**
 * Returns the number of seconds it takes to render one frame. The method getFPS returns 1/getInverseFPS() 
 * @return float The frames per second. 
 */
GLCamera.prototype.getInverseFPS=function()
{
	return this.inverseFPS;
};

/**
 * Returns the number of seconds it takes to render one frame.  It returns a more smooth measurement than the result of getInverseFPS(). The method getFPSSmooth returns 1/getInverseFPSSmooth() 
 * @return float The frames per second. 
 */
GLCamera.prototype.getInverseFPSSmooth=function()
{
	return this.inverseFPS_smooth;
};

/**
 * Pushes the model view matrix into a memory stack so that we can retrieve it later. It is equivalent to the openGL function glPushMatrix.
 */
GLCamera.prototype.pushMatrix=function() {
    var copy = mat4.create();
    mat4.set(this.mvMatrix, copy);
    this.mvMatrixStack.push(copy);
};

/**
 * Pops a model view matrix from the memory stack. It should be used in conjunction with the pushMatrix(). It is equivalent to the openGL function glPopMatrix.
 */
GLCamera.prototype.popMatrix=function() {
    if (this.mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    this.mvMatrix = this.mvMatrixStack.pop();
};

/**
 * Translates (moves) the model view coordinate system. It is equivalent to the openGL function glTranslate.
 * @param v An array of size 3 that contains the translation vector, i.e. the translation along x, y, and z. 
 */
GLCamera.prototype.translate=function(v)
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
GLCamera.prototype.rotate=function(b,c)
{
	var a=this.mvMatrix;
	var e=c[0],g=c[1];c=c[2];var f=Math.sqrt(e*e+g*g+c*c);if(!f)return;if(f!=1){f=1/f;e*=f;g*=f;c*=f}var h=Math.sin(b),i=Math.cos(b),j=1-i;b=a[0];f=a[1];var k=a[2],l=a[3],o=a[4],m=a[5],n=a[6],p=a[7],r=a[8],s=a[9],A=a[10],B=a[11],t=e*e*j+i,u=g*e*j+c*h,v=c*e*j-g*h,w=e*g*j-c*h,x=g*g*j+i,y=c*g*j+e*h,z=e*c*j+g*h;e=g*c*j-e*h;g=c*c*j+i;a[0]=b*t+o*u+r*v;a[1]=f*t+m*u+s*v;a[2]=k*t+n*u+A*v;a[3]=l*t+p*u+B*v;a[4]=b*w+o*x+r*y;a[5]=f*w+m*x+s*y;a[6]=k*w+n*x+A*y;a[7]=l*w+p*x+B*y;a[8]=b*z+o*e+r*g;a[9]=f*z+m*e+s*g;a[10]=k*z+n*e+A*g;a[11]=l*z+p*e+B*g;
};

/**
 * Rotates the model view coordinate system around X axis with respect to the current origin. It is equivalent to rotate(b,[1,0,0]).
 * @param b The rotation angle in radians.
 */
GLCamera.prototype.rotateX=function(b){mat4.rotateX(this.mvMatrix,b);};

/**
 * Rotates the model view coordinate system around Y axis with respect to the current origin. It is equivalent to rotate(b,[0,1,0]).
 * @param b The rotation angle in radians.
 */
GLCamera.prototype.rotateY=function(b){mat4.rotateY(this.mvMatrix,b);};

/**
 * Rotates the model view coordinate system around Z axis with respect to the current origin. It is equivalent to rotate(b,[0,0,1]).
 * @param b The rotation angle in radians.
 */
GLCamera.prototype.rotateZ=function(b){mat4.rotateZ(this.mvMatrix,b);};

/**
 * Scales the model view coordinate system. It is equivalent to the openGL function glScale.
 * @param s An array of size 3 that contains the scaling factors, i.e. the scaling along x, y, and z. 
 */
GLCamera.prototype.scale=function(s)
{
	var a=this.mvMatrix;
	var d=s[0],e=s[1];s=s[2];a[0]*=d;a[1]*=d;a[2]*=d;a[3]*=d;a[4]*=e;a[5]*=e;a[6]*=e;a[7]*=e;a[8]*=s;a[9]*=s;a[10]*=s;a[11]*=s;
};

/**
 * Resets the model view coordinate system to the default state (identity matrix). It is equivalent to the openGL function glLoadIdenity.
 */
GLCamera.prototype.identity=function()
{
	var a=this.mvMatrix;a[0]=1;a[1]=0;a[2]=0;a[3]=0;a[4]=0;a[5]=1;a[6]=0;a[7]=0;a[8]=0;a[9]=0;a[10]=1;a[11]=0;a[12]=0;a[13]=0;a[14]=0;a[15]=1;
};

GLCamera.prototype.multiply=function(matrix)
{
	mat4.multiply(this.mvMatrix,matrix);
};

GLCamera.prototype.resize=function()
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

GLCamera.prototype.beginDraw=function()
{
	var timeNow = new Date().getTime();
	
	if (this.canvas._keeps_rendering) 
	{
		var val= (timeNow - this.lastTimeDraw)/1000;
		if(val>0)
		{
			this.inverseFPS=val;
			var ifps=this.inverseFPS;if(ifps>0.2)ifps=0.2;
			this.inverseFPS_smooth=this.inverseFPS_smooth*0.95+ifps*0.05;
		}
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
		
		if(this._hmd_mat)
			mat4.multiply(this.mvMatrix,this._hmd_mat);
		/*if(this.initial_gamma && this.initial_gamma>45)
		{
			this.rotateY(-this.alpha*0.017453);
			this.rotateZ(this.beta*0.017453);//,[0,0,1]);
			this.rotateX((this.gamma+90)*0.017453);
		}
		else if(this.initial_gamma<-45)
		{
			this.rotateY(-this.alpha*0.017453);
			this.rotateZ(-this.beta*0.017453);//,[0,0,1]);
			this.rotateX(-(this.gamma-90)*0.017453);
		}*/
		
		
		this.rotate(this.next_object_rotation,[0,1,0]);
		this.translate([-this.viewer_position_x+this.screen_x, -this.viewer_position_y+this.screen_y, -this.viewer_position_z+this.screen_z]);
		this.translate([0.0, 0.0, -1.9]);
		this.translate([0.0, 0.0, 2.0]);
		
		//Update mvMatrix 
		var copy = mat4.create();
		mat4.set(this.mvMatrix, copy);
		mat4.multiply(copy,this.viewMatrix._m,this.mvMatrix);
		
		this.translate([0,0,this.rot_center_z]);
		this.rotate(this.xRot2,[1,0,0]);
		this.rotate(this.yRot2,[0,1,0]);
		this.translate([0,0,-this.rot_center_z]);
		
		
	}
	
};

GLCamera.prototype.setPseudoViewerPosition=function(x,y)
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

GLCamera.prototype.notifyProjectionChanged=function()
{
	if(this.projection_type==0) this.perspectiveProjection();
		else this.orthographicProjection();
	this._projection_changed=true;
	this.projection_changed_stamp=new Date().getTime();
	this.canvas.renderFrame();
};

GLCamera.prototype.endDraw=function()
{
	this._projection_changed=false;
	this._view_changed=false;
	this.size_changed=false;
	this._light_changed=false;
	
};

/**
 * Sets the projection mode to orthographic projection. 
 */
GLCamera.prototype.orthographicProjection=function()
{
	this.projection_type=1;
	mat4.ortho(-0.82*this.gl.viewportWidth / this.gl.viewportHeight, 0.82*this.gl.viewportWidth / this.gl.viewportHeight, -0.82,0.82,0.1,100.0, this.pMatrix);
	this._projection_changed=true;
	this.projection_changed_stamp=new Date().getTime();
};
 
/**
 * Sets the projection mode to perspective projection. 
 */
GLCamera.prototype.perspectiveProjection=function()
{
	this.projection_type=0;
	this.screen_width2 = (this.gl.viewportWidth / this.gl.viewportHeight)*this.screen_height2*this.canvas.getProjector().getWidthFactor();
	mat4.frustum(-this.viewer_projection_x-this.screen_width2,-this.viewer_projection_x+this.screen_width2,-this.viewer_projection_y-this.screen_height2,-this.viewer_projection_y+this.screen_height2, this.viewer_projection_z, this.screen_far,this.pMatrix);
		
	this._projection_changed=true;
	this.projection_changed_stamp=new Date().getTime();
};

GLCamera.prototype.STR_update=function()
{
	var tmp = mat4.create();
	mat4.identity(tmp);
	mat4.translate(tmp,[this.xTra,this.yTra,this.zTra]);
	mat4.rotate(tmp,this.working_zRot,[0,0,1]);
	mat4.multiply(tmp,this.ixMatrix_mem,this.viewMatrix._m);
	
	this._view_changed=true;
};

GLCamera.prototype.R_update1=function(angle,axis,p)
{
	var tmp = mat4.create();
	mat4.identity(tmp);
	mat4.translate(tmp,[0,0,p]);
	mat4.rotate(tmp,angle,axis);
	mat4.translate(tmp,[0,0,-p]);
	mat4.multiply(tmp,this.ixMatrix_mem,this.viewMatrix._m);
	
	this._view_changed=true;
};

GLCamera.prototype.R_update2=function(angleX,angleY,p)
{
	var tmp = mat4.create();
	mat4.identity(tmp);
	mat4.translate(tmp,[0,0,p]);
	mat4.rotate(tmp,-angleX,[1,0,0]);
	mat4.rotate(tmp,-angleY,[0,1,0]);
	//mat4.rotate(tmp,-this.yRot2,[0,1,0]);
	//mat4.rotate(tmp,-this.xRot2,[1,0,0]);	
	mat4.translate(tmp,[0,0,-p]);
	mat4.multiply(tmp,this.ixMatrix_mem,this.viewMatrix._m);
	
	this._view_changed=true;
};

GLCamera.prototype.doTranslate=function(dx,dy)
 {
	this.xTra+=dx;
	this.yTra-=dy;
	
	this.speed_xTra=dx/this.inverseFPS;
	this.speed_yTra=dy/this.inverseFPS;
	
    this.STR_update();
 };

 GLCamera.prototype.translateAnimation=function()
 {
	this.xTra+=this.speed_xTra*this.inverseFPS;
	this.yTra-=this.speed_yTra*this.inverseFPS;
	
	//it will lose 15% of the power every 1/35 second 0.15*35=5.25. After 1 second it will be at the (1-0.15)^35=0.003 of the original speed.
	this.speed_xTra-=this.speed_xTra*5.25*this.inverseFPS; if(Math.abs(this.speed_xTra)<0.03) this.speed_xTra=0;
	this.speed_yTra-=this.speed_yTra*5.25*this.inverseFPS; if(Math.abs(this.speed_yTra)<0.03) this.speed_yTra=0;
	
    this.STR_update();
 };

GLCamera.prototype.rotateToNextObject=function(x)
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
 
GLCamera.prototype.rotateToNextObjectAnimation=function(dx)
{
	this.next_object_rotation+=dx*this.inverseFPS;
	this._view_changed=true;
};
 
GLCamera.prototype.doRotate=function(dx,dy,z,type)
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
		if(mag>0) this.R_update1(mag*4,[this.xRot/mag, this.yRot/mag,0],this.rot_center_z);
	}
	else
	{
		this.yRot2-=dx;
		this.xRot2-=dy;if(this.xRot2>1.57)this.xRot2=1.57;else if(this.xRot2<-1.57)this.xRot2=-1.57;
		//if(this.xRot2<0)this.xRot2=0;
		this._view_changed=true;
		//this.R_update2(this.xRot*4/this.zoom,this.yRot*4/this.zoom,this.rot_center);
	}
 };
 
 GLCamera.prototype.rotateAnimation=function()
 {
	this.xRot+=this.speed_xRot*this.inverseFPS;
	this.yRot+=this.speed_yRot*this.inverseFPS;
	
	//it will lose 15% of the power every 1/35 second 0.15*35=5.25. After 1 second it will be at the (1-0.15)^35=0.003 of the original speed.
	this.speed_yRot-=this.speed_yRot*5.25*this.inverseFPS;if(Math.abs(this.speed_yRot)<0.03) this.speed_yRot=0;
	this.speed_xRot-=this.speed_xRot*5.25*this.inverseFPS;if(Math.abs(this.speed_xRot)<0.03) this.speed_xRot=0;
	
	if(this.rot_type==1)
	{
		var mag=Math.sqrt(this.xRot*this.xRot+this.yRot*this.yRot);
		if(mag>0) this.R_update1(mag*4,[this.xRot/mag, this.yRot/mag,0],this.rot_center_z);
	}
	else
	{
		this.xRot2-=this.speed_xRot*this.inverseFPS;if(this.xRot2>1.57)this.xRot2=1.57;else if(this.xRot2<-1.57)this.xRot2=-1.57;
		//if(this.xRot2<0)this.xRot2=0;
		this.yRot2-=this.speed_yRot*this.inverseFPS;
		this._view_changed=true;
		
		//this.R_update2(dx*4/this.zoom,dy*4/this.zoom,this.rot_center);
	}
 };
 
GLCamera.prototype.rotateAroundZ=function(dx)
 {
 	this.working_zRot+=dx;
 	
 	this.speed_zRot=dx/this.inverseFPS;
 	
	this.STR_update();
 };

 GLCamera.prototype.rotateZAnimation=function()
 {
 	this.working_zRot+=this.speed_zRot*this.inverseFPS;
 	
	//it will lose 15% of the power every 1/35 second 0.15*35=5.25. After 1 second it will be at the (1-0.15)^35=0.003 of the original speed.
 	this.speed_zRot-=this.speed_zRot*5.25*this.inverseFPS;if(Math.abs(this.speed_zRot)<0.03) this.speed_zRot=0;
 	
	this.STR_update();
 };
 
GLCamera.prototype.setRotation=function(dx,dy)
 {
	this.yRot=dx;
	this.xRot=dy;
	this._view_changed=true;
 };
 
GLCamera.prototype.zooming=function(dz)
 { 	
	this.zTra=dz;
	
	this.STR_update();
 };
 
GLCamera.prototype.relight=function(dx,dy)
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
GLCamera.prototype.setLight=function(dx,dy)
 {
	this.yLig=dx;
	this.xLig=dy;
	this._light_changed=true;
};

/**
 * Returns the lighting direction as a unit vector.
 * @param Array The lighting direction as an array of size 3.
 */
GLCamera.prototype.getLightingDirection=function()
{
	return [Math.sin(this.yLig+this.smooth_acc[0])*Math.cos(this.xLig+this.smooth_acc[1]), Math.sin(this.xLig+this.smooth_acc[1]), Math.cos(this.yLig+this.smooth_acc[0])*Math.cos(this.xLig+this.smooth_acc[1]) ];
};

GLCamera.prototype._getOffsetX=function()
{
	var x = (window.pageXOffset !== undefined)
  ? window.pageXOffset
  : (document.documentElement || document.body.parentNode || document.body).scrollLeft;
  x-= (document.clientLeft || 0);
 return x;
};

GLCamera.prototype._getOffsetY=function()
{
var y = (window.pageYOffset !== undefined)
  ? window.pageYOffset
  : (document.documentElement || document.body.parentNode || document.body).scrollTop;
  y-= (document.clientTop || 0);
  return y;
};


GLCamera.prototype.setStandardPointerInteraction=function()
{
	var self=this;
	this.canvas.handleMouseMove=function(event){event.preventDefault();var x=new Array();var y=new Array();x[0]=self.pixelDensity*(event.clientX+self._getOffsetX()-self.left); y[0]=self.pixelDensity*(event.clientY+self._getOffsetY()-self.top); self.handlePointerMove(x,y);};
	this.canvas.handleMouseUp=function(event){self.handlePointerUp([],[]);};
	this.canvas.handleMouseDown=function(event){event.preventDefault();var x=new Array();var y=new Array();x[0]=self.pixelDensity*(event.clientX+self._getOffsetX()-self.left); y[0]=self.pixelDensity*(event.clientY+self._getOffsetY()-self.top);self.handlePointerDown(x,y);};
	this.canvas.handleMouseOut=function(event){self.handleMouseOut();};
	this.canvas.handleTouchStart=function(event){var xx=self._getOffsetX()-self.left;var yy=self._getOffsetY()-self.top;event.preventDefault();var x=new Array();var y=new Array();for(var i=0;i<event.targetTouches.length;i++){x[i]=self.pixelDensity*(event.targetTouches[i].clientX+xx);y[i]=self.pixelDensity*(event.targetTouches[i].clientY+yy);} /*self.handlePointerMove(x,y);*/self.handlePointerDown(x,y);};
	this.canvas.handleTouchEnd=function(event){var xx=self._getOffsetX()-self.left;var yy=self._getOffsetY()-self.top;event.preventDefault();var x=new Array();var y=new Array();for(var i=0;i<event.targetTouches.length;i++){x[i]=self.pixelDensity*(event.targetTouches[i].clientX+xx);y[i]=self.pixelDensity*(event.targetTouches[i].clientY+yy);}self.handlePointerUp(x,y);};
	this.canvas.handleTouchMove=function(event){var xx=self._getOffsetX()-self.left;var yy=self._getOffsetY()-self.top;event.preventDefault();var x=new Array();var y=new Array();for(var i=0;i<event.targetTouches.length;i++){x[i]=self.pixelDensity*(event.targetTouches[i].clientX+xx);y[i]=self.pixelDensity*(event.targetTouches[i].clientY+yy);}self.handlePointerMove(x,y);};
	this.canvas.handleMouseWheel=function(event){event.preventDefault();self.canvas.whenScrolled().callThen({event:event});};
};


/**
 * It updates the camera by applying a orientation of the device to the projection matrix using the beta and gamma orientation parameters contained in the given DeviceOrientationEvent object. This method must be used inside an "onOrientationChange" function.
 * @param e The DeviceOrientationEvent object that corresponds to an "onOrientationChange" event.
 * @param options Optionally, you can provide as an object the following parameter: type ('hmd', which is the default, or 'box') to specify the type of perspective. Example: updatePerspective(e,{type: 'hmd'});

 */
GLCamera.prototype.updatePerspective=function(e,options)
{
	var type=1;
	if(options && options.type)
	{
		if(options.type=='hmd')
			type=1;
		else if(options.type=='box')
			type=2;
	}
	if(type==1) this._updatePerspective_hmd(e,options);
	else this._updatePerspective_box(e,options);
};

GLCamera.prototype._updatePerspective_hmd=function(e,options)
{
	if(e.alpha==null)return;
	
	var cos=Math.cos;
			var sin=Math.sin;
var sqrt=Math.sqrt;
var PI180=Math.PI/180;
			var screenOrientation=this.canvas._screenOrientation;
			var x=e.beta*PI180;
			var y=e.alpha*PI180;
			var z=-e.gamma*PI180;

			var c1=cos(x/2);
			var c2=cos(y/2);
			var c3=cos(z/2);

			var s1=sin(x/2);
			var s2=sin(y/2);
			var s3=sin(z/2);

			var _x=s1*c2*c3+c1*s2*s3;
			var _y=c1*s2*c3-s1*c2*s3;
			var _z=c1*c2*s3-s1*s2*c3;
			var _w=c1*c2*c3+s1*s2*s3;

			var q=quat4.create([_x,_y,_z,_w]);
			quat4.multiply(q,[-sqrt(0.5),0,0,sqrt(0.5)]);
			quat4.multiply(q,[0,0,sin(-screenOrientation/2*PI180),cos(-screenOrientation/2*PI180)]);
			this._hmd_mat=quat4.toMat4(q);
	
	this.alpha=e.alpha;
	this.beta=e.beta;
	this.gamma=e.gamma;
	this._view_changed=true;
	this.acc_updated_since_last_touch=true;
}; 
GLCamera.prototype._updatePerspective_box=function(e,options)
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
 * It updates the camera by applying a two finger rotation around Z axis using the coordinates of the fingers as captured by a given GLEvent object. This method must be used inside a "whenDragged" callback.
 * @param e The GLEvent object that corresponds to a "Drag" event.
 */
GLCamera.prototype.twoFingerRotate=function(e)
{
	if(e.dx.length<2)return;
	
	if(e.pointer_distance>0)
	{
		var zrot=Math.atan2(((this.mouseY[0]-this.mouseY[1])/this.finger_distance),((this.mouseX[0]-this.mouseX[1])/this.finger_distance))-Math.atan2(((e.y[0]-e.y[1])/e.pointer_distance),((e.x[0]-e.x[1])/e.pointer_distance));
		
		this.zRot+=zrot;
		if(Math.abs(this.zRot)>Math.PI/15) this.enable_rotateZ=true;
		if(this.enable_rotateZ) this.rotateAroundZ(zrot);
		
		this.finger_distance=e.pointer_distance;
	}
};

/**
 * It updates the camera by applying a two finger zoom in/out using the coordinates of the fingers as captured by a given GLEvent object. This method must be used inside a "whenDragged" callback.
 * @param e The GLEvent object that corresponds to a "Drag" event.
 */
GLCamera.prototype.twoFingerZoom=function(e,options)
{
	if(e.dx.length<2)return;
	
	if(e.original_event.pointer_distance>0)
	{
		var dz=0;
		if(e.pointer_distance>e.original_event.pointer_distance)
			dz=e.pointer_distance/e.original_event.pointer_distance-1;
		else dz=1-e.original_event.pointer_distance/e.pointer_distance;
		
		var opt=options||{};
		if(opt.radius){
			var p=this.viewMatrix.transform([0,0,-opt.radius]);
			if(dz>0 && p[2]<-0.01)
			{
				var mem=this.viewMatrix.getCopy();
				this.zooming(dz*(-p[2])/opt.radius);
				p=this.viewMatrix.transform([0,0,-opt.radius]);
				if(p[2]>=-0.01)this.viewMatrix.set(mem);
			}else if(dz<0)this.zooming(dz*Math.max(-p[2],0.01)/opt.radius);
		}
		else{
			this.zooming(dz);
		}
	}
};

/**
 * It updates the camera by applying a two finger translation on the X-Y plane using the coordinates of the fingers as captured by a given GLEvent object. This method must be used inside a "whenDragged" callback.
 * @param e The GLEvent object that corresponds to a "Drag" event.
 */
GLCamera.prototype.twoFingerMove=function(e,options)
{
	if(e.dx.length<2)return;
	var opt=options||{};
	if(opt.scale)
		this.doTranslate(((e.x[0]+e.x[1])-(this.mouseX[0]+this.mouseX[1]))*opt.scale/(2*this.height),((e.y[0]+e.y[1])-(this.mouseY[0]+this.mouseY[1]))*opt.scale/(2*this.height));
	else if(opt.radius){
		var p=this.viewMatrix.transform([0,0,-opt.radius]);
		var scale=Math.max(-p[2],0.01)/1.5;
		this.doTranslate(((e.x[0]+e.x[1])-(this.mouseX[0]+this.mouseX[1]))*scale/(2*this.height),((e.y[0]+e.y[1])-(this.mouseY[0]+this.mouseY[1]))*scale/(2*this.height));
	}
	else this.doTranslate(((e.x[0]+e.x[1])-(this.mouseX[0]+this.mouseX[1]))/(2*this.height),((e.y[0]+e.y[1])-(this.mouseY[0]+this.mouseY[1]))/(2*this.height));
};

/**
 * It updates the camera by applying a single finger translation on the X-Y plane using the coordinates of the fingers as captured by a given GLEvent object. This method must be used inside a "whenDragged" callback.
 * @param e The GLEvent object that corresponds to a "Drag" event.
 */
GLCamera.prototype.oneFingerMove=function(e,options)
{
	var opt=options||{};
	if(opt.scale) this.doTranslate(e.dx[0]*opt.scale,e.dy[0]*opt.scale);
	else if(opt.radius){
		var p=this.viewMatrix.transform([0,0,-opt.radius]);
		var scale=Math.max(-p[2],0.01)/1.5;
		this.doTranslate(e.dx[0]*scale,e.dy[0]*scale);
	}
	else this.doTranslate(e.dx[0],e.dy[0]);
};

/**
 * It updates the camera by applying a single finger rotation using the coordinates of the fingers as captured by a given GLEvent object. This method must be used inside a "whenDragged" callback.
 * @param e The GLEvent object that corresponds to a "onDrag" event.
 * @param options Optionally, you can provide as an object one or more of the following parameters: type ('free', which is the default, or 'polar') to specify the type of rotation, radius (a non negative real number, default is 0) to indicate the radius of the rotation trajectory, and speed (a positive real number, default is 1) to amplify (>1) or reduce (<1) the default speed of rotation. Example: oneFingerRotate(e,{type: 'polar', radius: 2});
 */
GLCamera.prototype.oneFingerRotate=function(e,options)
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
			var a=mat4.multiplyVec4(this.viewMatrix._m,[dx,dy,0,0]);
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
	if(typeof options.radius !=='undefined'){
		var p=[0,0,0];
		mat4.multiplyVec3(this.ixMatrix_mem,[0,0,-options.radius],p);//if we use imMatrix the system becomes unstable
		this.doRotate(dx,dy,p[2],t);
	}
	else this.doRotate(dx,dy,0,t);
};

/**
 * It updates the camera by applying a single finger zoom in/out using the coordinates of the fingers as captured by a given GLEvent object. This method must be used inside a "whenDragged" callback.
 * @param e The GLEvent object that corresponds to a "Drag" event.
 */
GLCamera.prototype.oneFingerZoom=function(e)
{
	this.zooming(this.zTra+e.dy[0]);
};

/**
 * It updates the lighting direction by applying a single finger rotation using the coordinates of the fingers as captured by a given GLEvent object. This method must be used inside a "whenDragged" callback.
 * @param e The GLEvent object that corresponds to a "Drag" event.
 */
GLCamera.prototype.oneFingerRelight=function(e)
{
	this.relight(e.dx[0],e.dy[0]);
};

/**
 * It updates the camera by applying a zoom in/out using the amount of scroll as captured by a mouse wheel event. This method must be used inside the canvas "whenScrolled" callback.
 * @param e The event object that corresponds to a "mousewheel" event.
 */
GLCamera.prototype.zoomByScroll=function(e,options)
{
	var opt=options||{};
	
	this.speed_xRot=0;
	this.speed_yRot=0;
	this.speed_xTra=0;
	this.speed_yTra=0;
	
	var dz=1-event.deltaY/this.height;
	var tmp = mat4.create();
	mat4.identity(tmp);
	//mat4.scale(tmp,[dz,dz,dz]);
	if(opt.radius){
		var p=this.viewMatrix.transform([0,0,-opt.radius]);
		if(event.deltaY<0 && p[2]<-0.01)
		mat4.translate(tmp,[0,0,-event.deltaY/this.height*(-p[2])/opt.radius]);
		else if(event.deltaY>0 /*&& p[2]>-1000*/)
		mat4.translate(tmp,[0,0,-event.deltaY/this.height*Math.max(-p[2],0.01)/opt.radius]);
		
	}else mat4.translate(tmp,[0,0,-event.deltaY/this.height]);
	
	mat4.set(this.viewMatrix._m,this.ixMatrix_mem);
	mat4.multiply(tmp,this.ixMatrix_mem,this.viewMatrix._m);
	this._view_changed=true;
};

GLCamera.prototype.handlePointerMove=function(x,y)
	{
		var moved_before=this.mouse_moved;
		var e=new GLEvent();
		e.setPointers(x,y);
		e.mouse_pressed=this.mouse_pressed;
		this.canvas.whenMoved().callThen({event:e});
		
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
					this.original_event.object.whenDragStarts().callThen({event:this.original_event});
				}
				this.canvas.whenDragStarts().callThen({event:this.original_event});
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
				this.original_event.object.whenDragged().callThen({event:e});
			this.canvas.whenDragged().callThen({event:e});
			
			//if(this.next_object_animation!=0)this.rotateToNextObject(x);
		}
		//else
		{
			//console.log(x.length);
			var o=this.canvas.roii.getObjectAt(x[0],y[0]);
			if(o!=this.mouse_over_object)
			{
				if(this.mouse_over_object!=null)
				{
					e.object=this.mouse_over_object;
					this.mouse_over_object.whenPointerLeaves().callThen({event:e});
				}
				if(o!=null)
				{	
					e.object=o;
					o.whenPointerEnters().callThen({event:e});
				}
				this.mouse_over_object=o;
				
			}
		}
		
		this.mouseX = x;
       	this.mouseY = y;
	}
	
GLCamera.prototype.handlePointerUp=function(x,y)
	{
		if(!this.mouse_moved)
		{
			if(this.original_event && !this.original_event._keeps_changing)
			{
				if(this.original_event.object!=null)
				{
					this.original_event.object.whenTapped().callThen({event:this.original_event});
				}
				this.canvas.whenTapped().callThen({event:this.original_event});
			}
		}
		else
		{
			var e=new GLEvent(this.original_event.object);
			e.setPointers(this.mouseX,this.mouseY);
			e.original_event=this.original_event;
				
			if(this.original_event.object!=null)
				this.original_event.object.whenDragEnds().callThen({event:e});
				
			this.canvas.whenDragEnds().callThen({event:e});
		}
		
		
			//this.canvas.updatePickingMap();
			var objects=new Array(x.length);
			for(var i=0;i<x.length;i++)
				objects[i]=this.canvas.roii.getObjectAt(x[i],y[i]);
		
			if(this.original_event)
			for(var i=0;i<this.original_event.objects.length;i++)
			if(this.original_event.objects[i]!=null)
			{
				if(this.original_event.objects[i]._is_touched){
				
					var found=false;
					for(var j=0;j<objects.length && !found;j++)
						if(objects[j]==this.original_event.objects[i])found=true;
					if(!found)
					{
						this.original_event.objects[i]._is_touched=false;
						this.original_event.objects[i].whenTouchEnds().callThen({event:this.original_event});
					}
				}
			}
		
		this.canvas.whenTouchEnds().callThen({event:this.original_event});
		
		this.mouse_pressed=false;
		this.canvas.renderFrame();
	}
	
GLCamera.prototype.handlePointerDown=function(x,y)
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
		this.original_event=new GLEvent();
		this.original_event.mouse_pressed=true;
		this.original_event._keeps_changing=this._keeps_changing;
		this.original_event.setPointers(x,y);
		this.original_event.object=this.canvas.roii.getObjectAt(x[0],y[0]);
		this.original_event.objects=new Array(x.length);
		this.original_event.objects[0]=this.original_event.object;
		for(var i=1;i<x.length;i++)
			this.original_event.objects[i]=this.canvas.roii.getObjectAt(x[i],y[i]);
		
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
		
		
		
		mat4.set(this.viewMatrix._m,this.ixMatrix_mem);
		this.zTra=0;
		this.working_zRot=0;
		for(var i=0;i<x.length;i++)
			if(this.original_event.objects[i]!=null)
			{
				if(this.original_event.objects[i]._is_touched){}
				else{this.original_event.objects[i]._is_touched=true;
				this.original_event.objects[i].whenTouched().callThen({event:this.original_event});}
			}
		this.canvas.whenTouched().callThen({event:this.original_event});
		return false;
	};
	
GLCamera.prototype.handleMouseOut=function()
{	
	if(this.mouse_pressed)
	{
		if(!this.mouse_moved)
		{
			if(!this.original_event._keeps_changing)
			{
				if(this.original_event.object!=null)this.original_event.object.whenTapped().callThen({event:this.original_event});
				this.canvas.whenTapped().callThen({event:this.original_event});
			}
		}
		else
		{
			var e=new GLEvent(this.original_event.object);
			e.setPointers(this.mouseX,this.mouseY);
			e.original_event=this.original_event;
				
			if(this.original_event.object!=null)
				this.original_event.object.whenDragEnds({event:e});
				
			this.canvas.whenDragEnds().callThen({event:e});
		}
	}
	this.mouse_pressed=false;
	this.canvas.renderFrame();
};

GLCamera.prototype.pointerIsDown=function()
{
	return this.mouse_pressed;
};

function GLEvent(obj)
{
	this.object=obj;
	this.mouse_pressed=false;
	this.x=[];
	this.y=[];
	this.pointer_distance=0;
	this.original_event=false;
}

GLEvent.prototype.getNumOfPointers=function(){return this.x.length;};

GLEvent.prototype.setPointers=function(x,y)
{
	this.x=x;
	this.y=y;
};

function GLKeyFrame(type,val1,val2,speed,repetitions)
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
GLKeyFrame.prototype.getPhase=function(){if(this.animation_cycle%2==0)return 0; else return 1;};
GLKeyFrame.prototype.setValue=function(id,value){this.current_value[id]=value;};
GLKeyFrame.prototype.getValue=function(id){return this.current_value[id];};
GLKeyFrame.prototype.onValueChange=function(){};
GLKeyFrame.prototype.onStart=function(){};
GLKeyFrame.prototype.start=function(){this.onStart();};
GLKeyFrame.prototype.animate=function(){};
GLKeyFrame.prototype.isFinished=function(){return true;};

function GLAnimation(canvas)
{
	this.canvas=canvas;
	this.gl=canvas.gl;
	this.camera=canvas.camera;
	this.keyframe_now=-1;	
	this.loop=false;
	this.keyframes=new Array();
	this.pause_during_user_interaction=false;
}

GLAnimation.prototype.pauseDuringUserInteraction=function(){this.pause_during_user_interaction=true;};

GLAnimation.prototype.load=function(){this.onSetup();};

GLAnimation.prototype.addKeyFrame=function(keyframe){this.keyframes.push(keyframe);};

GLAnimation.prototype.setLoop=function(flag){this.loop=flag;};

GLAnimation.prototype.start=function()
{
	if(this.keyframes.length==0) return;

	if(this.isPlaying()) return;
	
	this.onStart();
	//-----
	this.keyframe_now=0;
	this.keyframes[this.keyframe_now].start();
	this.canvas.renderFrame();
};

GLAnimation.prototype.isPlaying=function()
{
	if(this.keyframe_now>-1) return true; else return false;
};

GLAnimation.prototype.stop=function()
{
	this.keyframe_now=-1;
	this.canvas.renderFrame();
};

GLAnimation.prototype.animate=function()
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

GLAnimation.prototype.draw=function()
{
	if(this.canvas.renderingPickingMap()) return;
	if(this.keyframe_now==-1) return;
	if(this.pause_during_user_interaction && this.camera.mouse_pressed) return;
	this.onDraw();
	this.animate();
}

GLAnimation.prototype.onSetup=function(){};
GLAnimation.prototype.onStart=function(){};
GLAnimation.prototype.onDraw=function(){};

function GLLoadingAnimation(canvas)
{
	this.hide=false;
	this.canvas=canvas;
	this.rot=0;
	this.loading_obj=null;
	this.loading_obj2=null;
	      
	var _obj=new GLObject(this.canvas);
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
	_obj.setTexture(vn.hosturl+'js/img/VNlogo256.png');
	this.loading_obj=_obj;
	
	var n=64;
	_obj=new GLObject(this.canvas);
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

GLLoadingAnimation.prototype.draw=function()
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
	if(this.canvas.isNewFrame())this.rot+=this.canvas.camera.inverseFPS;
	mat4.rotate(m,Math.PI/8,[1,0,0]);
	mat4.rotate(m,this.rot,[0,1,0]);
	this.loading_obj.getShader().setModelView(m);
	gl.enable(gl.CULL_FACE);
	this.loading_obj.draw({updateShader:false});
	
	this.loading_obj2.getShader().setProjection(p);
	m=mat4.create();
	mat4.identity(m);
	mat4.translate(m,[0,0,-3]);
	mat4.rotate(m,4*this.rot,[0,0,1]);
	this.loading_obj2.getShader().setModelView(m);
	this.loading_obj2.draw({updateShader:false});
	gl.enable(gl.DEPTH_TEST); 
	
	this.canvas.renderFrame();
};

 function GLBeams(gl_canvas)
 {
	this.camera=gl_canvas.camera;
	this.canvas=gl_canvas;
	this.hide=false;
	
	this.mvMatrix = mat4.create();
	
	this.obj=new GLObject(this.canvas);
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
  
 GLBeams.prototype.setVisible=function(flag){this.hide=!flag;};
  
 GLBeams.prototype.draw=function()
 {
	if(this.hide)return;
	this.obj.getShader().updateProjection();
	mat4.identity(this.mvMatrix);
	mat4.translate(this.mvMatrix, [0.0, 0.0, -2]);
	mat4.rotate(this.mvMatrix, this.canvas.camera.xLig, [-1, 0, 0]);
    mat4.rotate(this.mvMatrix, this.canvas.camera.yLig, [0, 1, 0]);
	this.obj.getShader().setModelView(this.mvMatrix);
	this.obj.draw({updateShader:false});
 };

function GLWatermark(canvas)
{
	this.canvas=canvas;
	this.logo_obj=null;
	
	this.logo_obj=new GLObject(canvas);
	this.logo_obj.createRect(0.2,0.2,1,1);
	this.logo_obj.setTexture(vn.hosturl+'js/img/VNlogo_mask.png',true);
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

GLWatermark.prototype.draw=function()
{
	var gl=this.canvas.gl;
	gl.disable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND);
	this.logo_obj.draw({updateShader:false});
	gl.enable(gl.DEPTH_TEST);
};

function GLBackground(canvas)
{
	this.canvas=canvas;
	this.bkg=new GLObject(this.canvas);
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

GLBackground.prototype.setColor=function(r,g,b)
{
	this.bkg.getShader().setColorMask([r*1.4,g*1.4,b*1.4,1]);
}

GLBackground.prototype.draw=function()
{
	var gl=this.canvas.gl;
	gl.disable(gl.DEPTH_TEST);
	this.bkg.draw({updateShader:false});
	gl.enable(gl.DEPTH_TEST);
};

/**
 * This class implements and handles a webGL shader. It should be used in conjunction with a GLObject.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var shader=object.getShader();<br>
 * shader.setModelView(mv_matrix);<br></font>
 * @param gl_canvas A GLCanvas object.
 * @param options An optional object with the following parameters: vertexShaderCode (an Array of strings that describe a vertex shader in GLSL), fragmentShaderCode (an Array of strings that describe a fragment shader in GLSL)
 */
function GLShader(gl_canvas,options)
{
	this.canvas=gl_canvas;
	this.camera=this.canvas.camera;
	this.gl=this.canvas.gl;
	this.univars={};
	this.attrs={};
	this.vertex_shader_src="";
	this.fragment_shader_src="";
	this.shaderProgram=null;
	this.createShader(options);
	this.pMatrixStamp=0;
	this.updateProjection();
}

GLShader.prototype.createUniform=function(name)
{
	this.univars[name]=this.gl.getUniformLocation(this.shaderProgram, name);
};
/**
 * Sets a value to a uniform integer or boolean parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @v The value to be assigned (integer or boolean).
 */
GLShader.prototype.setUniform1i=function(name,v)
{this.gl.uniform1i(this.univars[name], v);};
/**
 * Sets a value to a uniform integer or boolean parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @v The value to be assigned as an array of one integer or one boolean.
 */
GLShader.prototype.setUniform1iv=function(name,v)
{this.gl.uniform1iv(this.univars[name], v);};
/**
 * Sets a value to a uniform float parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @v The value to be assigned as a float.
 */
GLShader.prototype.setUniform1f=function(name,v)
{this.gl.uniform1f(this.univars[name], v);};
/**
 * Sets a value to a uniform float parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @v The value to be assigned as an array of one float.
 */
GLShader.prototype.setUniform1fv=function(name,v)
{this.gl.uniform1fv(this.univars[name], v);};
/**
 * Sets a value to a uniform 2D integer parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @i1 The value to be assigned to the first component of the vector.
 * @i2 The value to be assigned to the second component of the vector.
 */
GLShader.prototype.setUniform2i=function(name,i1,i2)
{this.gl.uniform2i(this.univars[name], i1,i2);};
/**
 * Sets a value to a uniform 2D integer parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @v The value to be assigned as an array of two integers.
 */
GLShader.prototype.setUniform2iv=function(name,v)
{this.gl.uniform2iv(this.univars[name], v);};
/**
 * Sets a value to a uniform 2D float parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @f1 The value to be assigned to the first component of the vector.
 * @f2 The value to be assigned to the second component of the vector.
 */
GLShader.prototype.setUniform2f=function(name,f1,f2)
{this.gl.uniform2f(this.univars[name], f1,f2);};
/**
 * Sets a value to a uniform 2D float parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @v The value to be assigned as an array of two floats.
 */
GLShader.prototype.setUniform2fv=function(name,v)
{this.gl.uniform2fv(this.univars[name], v);};
/**
 * Sets a value to a uniform 3D integer parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @i1 The value to be assigned to the first component of the vector.
 * @i2 The value to be assigned to the second component of the vector.
 * @i3 The value to be assigned to the third component of the vector.
 */
GLShader.prototype.setUniform3i=function(name,i1,i2,i3)
{this.gl.uniform3i(this.univars[name], i1,i2,i3);};
/**
 * Sets a value to a uniform 2D integer parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @v The value to be assigned as an array of three integers.
 */
GLShader.prototype.setUniform3iv=function(name,v)
{this.gl.uniform3iv(this.univars[name], v);};
/**
 * Sets a value to a uniform 3D float parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @f1 The value to be assigned to the first component of the vector.
 * @f2 The value to be assigned to the second component of the vector.
 * @f3 The value to be assigned to the third component of the vector.
 */
GLShader.prototype.setUniform3f=function(name,f1,f2,f3)
{this.gl.uniform3f(this.univars[name], f1,f2,f3);};
/**
 * Sets a value to a uniform 3D float parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @v The value to be assigned as an array of three floats.
 */
GLShader.prototype.setUniform3fv=function(name,v)
{this.gl.uniform3fv(this.univars[name], v);};
/**
 * Sets a value to a uniform 4D integer parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @i1 The value to be assigned to the first component of the vector.
 * @i2 The value to be assigned to the second component of the vector.
 * @i3 The value to be assigned to the third component of the vector.
 * @i4 The value to be assigned to the fourth component of the vector.
 */
GLShader.prototype.setUniform4i=function(name,i1,i2,i3,i4)
{this.gl.uniform4i(this.univars[name], i1,i2,i3,i4);};
/**
 * Sets a value to a uniform 2D integer parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @v The value to be assigned as an array of four integers.
 */
GLShader.prototype.setUniform4iv=function(name,v)
{this.gl.uniform4iv(this.univars[name], v);};
/**
 * Sets a value to a uniform 4D float parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @f1 The value to be assigned to the first component of the vector.
 * @f2 The value to be assigned to the second component of the vector.
 * @f3 The value to be assigned to the third component of the vector.
 * @f4 The value to be assigned to the fourth component of the vector.
 */
GLShader.prototype.setUniform4f=function(name,f1,f2,f3,f4)
{this.gl.uniform4f(this.univars[name], f1,f2,f3,f4);};
/**
 * Sets a value to a uniform 4D float parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @v The value to be assigned as an array of four floats.
 */
GLShader.prototype.setUniform4fv=function(name,v)
{this.gl.uniform4fv(this.univars[name], v);};
/**
 * Sets a value to a uniform 2x2 matrix parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @v The value to be assigned as an array of four floats, stored column by column.
 */
GLShader.prototype.setUniform2x2fv=function(name,v)
{this.gl.uniformMatrix2fv(this.univars[name], false,v);};
/**
 * Sets a value to a uniform 3x3 matrix parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @v The value to be assigned as an array of nine floats, stored column by column.
 */
GLShader.prototype.setUniform3x3fv=function(name,v)
{this.gl.uniformMatrix3fv(this.univars[name], false,v);};
/**
 * Sets a value to a uniform 4x4 matrix parameter of this shader.
 * @name A string with the name of a uniform parameter as it was defined in this shader.
 * @v The value to be assigned as an array of sixteen floats, stored column by column.
 */
GLShader.prototype.setUniform4x4fv=function(name,v)
{this.gl.uniformMatrix4fv(this.univars[name], false,v);};

GLShader.prototype.createAttribute=function(name)
{
	this.attrs[name]=this.gl.getAttribLocation(this.shaderProgram, name);
};
/**
 * Binds an existing glBuffer with a float attribute of this shader.
 * @name A string with the name of an attribute as it was defined in this shader.
 * @gl_buffer The glBuffer to be assigned to this attribute. The gl_buffer.itemSize should be defined and contain the dimensionality of the attribute (1,2,3, or 4).
 */
GLShader.prototype.setAttribute=function(name,gl_buffer)
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
GLShader.prototype.setAttribute1f=function(name,gl_buffer)
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
GLShader.prototype.setAttribute2f=function(name,gl_buffer)
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
GLShader.prototype.setAttribute3f=function(name,gl_buffer)
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
GLShader.prototype.setAttribute4f=function(name,gl_buffer)
{
	this.gl.enableVertexAttribArray(this.attrs[name]);
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, gl_buffer);
    this.gl.vertexAttribPointer(this.attrs[name], 4, this.gl.FLOAT, false, 0, 0);
};

/**
 * Binds the shader in webGL and updates its projection matrix and lighting direction if necessary.
 */
GLShader.prototype.updateAndUse=function()
{
	this.gl.useProgram(this.shaderProgram);
	this.updateProjection();
	this.updateLightingDirection();
};

/**
 * Binds the shader in webGL.
 */
GLShader.prototype.use=function()
{
	this.gl.useProgram(this.shaderProgram);
};

/**
 * Updates the projection matrix of the shader if the camera was modified.
 */
GLShader.prototype.updateProjection=function(){};
GLShader.prototype._updateProjection=function()
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
GLShader.prototype.setProjection=function(pMatrix){};
GLShader.prototype._setProjection=function(pMatrix)
{
	this.gl.useProgram(this.shaderProgram);
	this.gl.uniformMatrix4fv(this.univars["uPMatrix"], false, pMatrix);
};

/**
 * Updates the model view matrix of the shader.
 */
GLShader.prototype.updateModelView=function(objMatrix)
{
	if(objMatrix)
	{
		this.camera.pushMatrix();
		mat4.multiply(this.camera.mvMatrix,objMatrix);
		this.setModelView(this.camera.mvMatrix);
		this.camera.popMatrix();
	}
	else this.setModelView(this.camera.mvMatrix);
};

/**
 * Sets the model view matrix of the shader.
 * @param mvMatrix The 4x4 model view matrix.
 */
GLShader.prototype.setModelView=function(mvMatrix){};
GLShader.prototype._setModelView1=function(mvMatrix)
{
	this.gl.useProgram(this.shaderProgram);
	this.gl.uniformMatrix4fv(this.univars["uMVMatrix"], false, mvMatrix);	
};
GLShader.prototype._setModelView2=function(mvMatrix)
{
	this.gl.useProgram(this.shaderProgram);
	this.gl.uniformMatrix4fv(this.univars["uMVMatrix"], false, mvMatrix);	
	mat4.toInverseMat3(mvMatrix, this.normalMatrix);
	mat3.transpose(this.normalMatrix);
	this.gl.uniformMatrix3fv(this.univars["uNMatrix"], false, this.normalMatrix);
	this.gl.uniformMatrix3fv(this.univars["uNMatrix_init"], false, this.camera.mvMatrix_init);
	this.gl.uniformMatrix3fv(this.univars["uP2Matrix"], false, this.canvas.current_projector.p2Matrix);
};

GLShader.prototype.draw=function(shape,gl_buffer)
{
	this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, gl_buffer);
    this.gl.drawElements(shape, gl_buffer.numItems, this.gl.UNSIGNED_SHORT, 0);
};	

/**
 * Sets the lighting direction of the shader.
 * @param dir An Array of size 3 with the unit vector of the lighting direction.
 */
GLShader.prototype.setLightingDirection=function(dir)
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
GLShader.prototype.updateLightingDirection=function()
{
	this.gl.useProgram(this.shaderProgram);
	this.setUniform3fv("uLightingDirection", this.camera.getLightingDirection());
};

/**
 * Enables/disables the use of light-based shading.
 * @param flag A boolean flag. 
 */
GLShader.prototype.useLighting=function(flag)
{
	this.gl.useProgram(this.shaderProgram);
	this.setUniform1i("uUseLighting",flag);
	//this.canvas.renderFrame();
};

/**
 * Enables/disables the texture rendering.
 * @param flag A boolean flag. 
 */
GLShader.prototype.useTexture=function(flag)
{
	this.gl.useProgram(this.shaderProgram);
	this.setUniform1i("uUseTexture",flag);
	//this.canvas.renderFrame();
};

/**
 * Enables/disables the use of vertex-based colors.
 * @param flag A boolean flag. 
 */
GLShader.prototype.useColors=function(flag)
{
	this.gl.useProgram(this.shaderProgram);
	this.setUniform1i("uUseColors",flag);
	//this.canvas.renderFrame();
};

/**
 * Enables/disables the use of the 3rd dimension.
 * @param flag A boolean flag. 
 */
GLShader.prototype.useZ=function(flag)
{
	this.gl.useProgram(this.shaderProgram);
	this.setUniform1i("uUseZ",flag);
	//this.canvas.renderFrame();
};

/**
 * Sets the point size in the point cloud rendering mode.
 * @param value The size of points in pixels. 
 */
GLShader.prototype.setPointSize=function(value)
{
	this.gl.useProgram(this.shaderProgram);
	this.setUniform1f("uPointSize",value);
	//this.canvas.renderFrame();
};

/**
 * Sets a color mask. Default value [1, 1, 1, 1]
 * @param value An Array of size 4 with the values of R,G,B,A as real numbers in the range [0-1]
 */
GLShader.prototype.setColorMask=function(value)
{
	this.gl.useProgram(this.shaderProgram);
	this.setUniform4fv("uColorMask",value);
	//this.canvas.renderFrame();
};

/**
 * Sets the map mode.
 * @param value 0 for no map, 1 depth map, 2 edge map. 
 */
GLShader.prototype.setMapMode=function(value)
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
GLShader.prototype.setColorMap=function(colors,weights)
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

GLShader.prototype.createShader=function(options) {
		var gl=this.gl;
        var vertexShader = null;
		var fragmentShader = null;
			
		if(typeof options==='undefined')options={diffuse:true,uv:true,colors:true};
			
		vertexShader = this.createVertexShader(options);
		fragmentShader=this.createFragmentShader(options);	
		
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
		
		if(options.vertexShaderCode && options.fragmentShaderCode) return shaderProgram;	
			
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
	this.setUniform4fv("uSpecularColor",[0.5,0.5,0.5,1.0]);
	this.setUniform1f("uSpecularExponent",10);
	this.setUniform3fv("uDiffuseColor",[0.7,0.7,0.7]);
	this.setUniform3fv("uAmbientColor",[0.3,0.3,0.3]);
	this.setUniform4fv("uColorMask",[1.0,1.0,1.0,1.0]);
	this.setUniform1i("uSamplerUV",0);
	this.setUniform1i("uSamplerMatCap",1);
	this.setUniform1i("uSamplerHDRE",2);
	this.setUniform1i("uSamplerNormalMap",3);
	this.setUniform4fv("uReflectionColor",[.5,.5,.5,1.0]);
	this.setUniform4fv("uMatCapColor",[1.0,1.0,1.0,1.0]);
	this.setUniform1f("uNormalMapMagnitude",1);
	this.setUniform1f("uNormalMapRepetition",1);
	this.setUniform1f("uFadeWithDistanceFactor",1);
	this.setUniform1i("uFadeWithDistance",false);
	
	this.setUniform3x3fv("uP2Matrix", [1,0,0,0,1,0,0,0,1]);
	this.setUniform3x3fv("uNMatrix_init", [1,0,0,0,1,0,0,0,1]);
	
	/*var m=mat4.create();
	mat4.identity(m);
	mat4.translate(m,[0,0,-1.2]);
	this.setModelView(m);
	m=mat4.create();
	mat4.perspective(45, 1, 0.1, 100.0, m);
	this.setProjection(m);*/
	
	 return shaderProgram;
    };
	
GLShader.prototype.findVars=function()
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
	
GLShader.prototype.createFragmentShader=function(o)
{
	var gl=this.gl;
	var s=new Array();
		
	if(o.fragmentShaderCode) s=o.fragmentShaderCode;
	else 
	{
	s=s.concat([	"precision mediump float;",
					"varying vec4 vColor;"]);
	if(o.ambient||o.diffuse||o.specular||o.matcap)
	s=s.concat(["uniform bool uUseLighting;"]);
	if(o.diffuse||o.specular)
	s=s.concat(["uniform vec3 uLightingDirection;"]);
	if(o.ambient)				
	s=s.concat(["uniform vec3 uAmbientColor;"]);
	if(o.diffuse)				
	s=s.concat(["uniform vec3 uDiffuseColor;"]);
	if(o.specular)				
	s=s.concat(["uniform vec4 uSpecularColor;",
				"uniform float uSpecularExponent;"]);	
	if(o.uv)
	s=s.concat([	"varying vec2 vUV;",
					"uniform sampler2D uSamplerUV;",
					"uniform bool uUseTexture;"]);
	if(o.matcap)
	s=s.concat(["uniform vec4 uMatCapColor;",
			   "uniform sampler2D uSamplerMatCap;"]);
	if(o.matcap||o.specular||o.reflection)
	s=s.concat(["varying vec3 vE;"]);
	if(o.diffuse||o.matcap||o.specular||o.reflection)
	{
		s=s.concat(["varying vec3 vN;"]);
		if(o.uv&&o.normalmap)
		s=s.concat(["uniform sampler2D uSamplerNormalMap;",
					"uniform float uNormalMapMagnitude;",
					"uniform float uNormalMapRepetition;",
					"varying vec3 vT1;",
					"varying vec3 vT2;"]);
	}
	if(o.reflection)
	s=s.concat(["uniform mat3 uNMatrix_init;",
	"uniform vec4 uReflectionColor;",
				"uniform sampler2D uSamplerHDRE;"]);
	if(o.timestamps)
	s=s.concat([	"varying float vTime;",
					"uniform float uTimeNow;"]);
	if(o.cull)
	s.push("varying float vCull;");
	
	s.push("void main(void){");
	
	if(o.cull)
	s.push("if(vCull<0.0) discard;");
	
	if(o.timestamps)
	s.push("if(uTimeNow<vTime) discard;");
	
	if(o.diffuse||o.matcap||o.specular||o.reflection)
	{
		s.push("vec3 N=normalize(vN);");
		if(o.uv &&o.normalmap)
	s=s.concat([	"vec4 normalmapColor=2.0*texture2D(uSamplerNormalMap,vUV*uNormalMapRepetition)-1.0;",
				"N=normalize(normalize(vT1)*normalmapColor.x*uNormalMapMagnitude+normalize(vT2)*normalmapColor.y*uNormalMapMagnitude+N*normalmapColor.z);"]);
	}
	if(o.matcap||o.specular||o.reflection)
	s.push("vec3 E=normalize(vE);");
	
	if(o.ambient||o.diffuse||o.specular||o.matcap)
		s.push("vec4 fragColor=vec4(0.,0.,0.,1.);");
	else if(o.uv) s.push("vec4 fragColor=vec4(1.,1.,1.,1.);");
	else if(o.reflection) s.push("vec4 fragColor=vec4(0.,0.,0.,0.);");
	else s.push("vec4 fragColor=vec4(1.,1.,1.,1.);");
	
	if(o.ambient||o.diffuse||o.specular||o.matcap)
	s=s.concat(["if(uUseLighting){",
		"fragColor=vec4(0.,0.,0.,1.0);"]);
	
	if(o.ambient)
		s=s.concat(["fragColor+=vec4(uAmbientColor,1.0);"]);
	
	if(o.diffuse)
		s=s.concat(["fragColor+=vec4(uDiffuseColor,1.0)*max(dot(N,uLightingDirection),0.0);"]);
	
	if(o.specular)
		s=s.concat(["vec3 reflectionDirection = reflect(uLightingDirection, N);",
		"fragColor+=uSpecularColor*pow(max(dot(reflectionDirection, E), 0.0), uSpecularExponent);"]);
	
	if(o.matcap)
	s=s.concat([	"vec3 r = reflect(E,N);",
				"float m=2.0*sqrt(pow(r.x,2.)+pow(r.y,2.)+pow(r.z+1.,2.));",
		"vec4 matcapColor=texture2D(uSamplerMatCap,r.xy / m + .5);",
					"fragColor+=uMatCapColor*matcapColor;"]);
	
	if(o.ambient||o.diffuse||o.specular||o.matcap)
	s=s.concat(["}","else {","fragColor=vec4(1.,1.,1.,1.0);","}"]);
	
			
    s.push("gl_FragColor=vColor*fragColor;");
			
	if(o.uv)
	s=s.concat([	"if(uUseTexture){",
					"vec4 textureColor=texture2D(uSamplerUV,vUV);",
					"gl_FragColor*=textureColor;",
					"}"]);
		
    if(o.reflection)
	{
		s=s.concat(["vec3 vHDRE = normalize(reflect(E,N)*uNMatrix_init);",
		"vec2 HDRE_XZ=normalize(vHDRE.xz);",
					"vec4 reflectionColor=texture2D(uSamplerHDRE,vec2(0.5-atan(HDRE_XZ.y,-1.0*HDRE_XZ.x)/3.1415/2.0, atan(vHDRE.y,length(vHDRE.xz))/3.1415+.5));",
					"gl_FragColor+=vColor*uReflectionColor*reflectionColor;"]);
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
 
GLShader.prototype.createVertexShader=function(o)
{
	var gl=this.gl;
	var s=new Array();
	if(o.vertexShaderCode) s=o.vertexShaderCode;
	else
	{
	s.push(			"attribute vec3 aXYZ;");
	if(o.avatar)
	{
		for(var i = 0; i != o.avatar; ++i){
			s.push("uniform mat4 boneMatrix" + i + ";");
		}
		for(var i = 0; i != o.avatar; ++i){
			s.push("uniform mat3 boneMatrixN" + i + ";");
		}
		for(var i = 0; i != o.avatar; ++i){
			s.push("attribute float weight" + i + ";");
		}
	}
	if(o.cull||o.diffuse||o.specular||o.matcap||o.reflection) 
	s=s.concat([	"attribute vec3 aNormal;",
					"uniform mat3 uNMatrix;"]);
	if(o.cull)
	s.push("varying float vCull;");
	if(o.uv)
	s=s.concat([	"attribute vec2 aUV;", 
					"varying vec2 vUV;"]);
	if(o.matcap || o.specular||o.reflection)
	s=s.concat(["varying vec3 vE;"]);
	if(o.diffuse||o.matcap || o.specular||o.reflection)
	{
		s=s.concat(["varying vec3 vN;"]);
		if(o.uv && o.normalmap)
		s=s.concat(["attribute vec3 aTangent;",
				"varying vec3 vT1;",
				"attribute vec3 aTangent2;",
				"varying vec3 vT2;"]);
	}
	if(o.timestamps)
	s=s.concat([	"attribute float aTimeStamp;",
					"varying float vTime;"]);
	if(o.colors) 
	s=s.concat([	"attribute vec3 aColor;",
					"uniform bool uUseColors;"]);
	if(o.map)
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
	"uniform mat3 uP2Matrix;",
	"uniform bool uUseZ;",
	"uniform bool uFadeWithDistance;",
	"uniform float uFadeWithDistanceFactor;",
	"uniform float uPointSize;",
	"varying vec4 vColor;",
	"uniform vec4 uColorMask;",
	
	"void main(void){",
	"gl_PointSize=uPointSize;"]);
	if(o.avatar)
	{
		var boneMatrix = "weight0 * boneMatrix0";
		for(var i = 1; i != o.avatar; ++i){
			boneMatrix += " + weight" + i +" * boneMatrix" + i;
		}
		s.push("mat4 boneMatrix = " + boneMatrix + ";");
		s.push("vec4 p=uMVMatrix*boneMatrix*vec4(aXYZ,1.0);");

	}
	else s.push("vec4 p=uMVMatrix*vec4(aXYZ,1.0);");  
	
    s=s.concat(["float vDepth=p.z;",
	/*"if(!uUseZ){",
	"p=uMVMatrix*vec4(vec3(aXYZ.x,aXYZ.y,0),1.0);",
	"}",*/
	"gl_Position=uPMatrix*p;",
	"vColor=uColorMask;",
	"vec3 transformedNormal=vec3(0,0,1);"]);
	 
	if(o.timestamps)
	s.push("vTime=aTimeStamp;");
	
	if(o.cull||o.diffuse||o.specular||o.matcap||o.reflection)
	{
		if(o.avatar) 
		{
			var boneMatrix = "weight0 * boneMatrixN0";
			for(var i = 1; i != o.avatar; ++i){
				boneMatrix += " + weight" + i +" * boneMatrixN" + i;
			}
			s.push("mat3 boneMatrixN = " + boneMatrix + ";");
			s.push("transformedNormal=normalize( uP2Matrix *uNMatrix *boneMatrixN0 *aNormal);");
		}
		else s.push("transformedNormal=normalize( uP2Matrix *uNMatrix  *aNormal);");
	}
	if(o.specular||o.matcap||o.reflection)
		s.push("vec3 normpoint = normalize(uP2Matrix*vec3(p));");
	
	if(o.cull)
	s.push("vCull=-p.x*transformedNormal.x-p.y*transformedNormal.y-p.z*transformedNormal.z +0.0522*transformedNormal.z;");//0.0522 is the focal length for 45 fov.
	
	if(o.matcap || o.specular||o.reflection)
	{
		s.push("vE=normpoint;");
	}	
		
	if(o.matcap || o.specular||o.diffuse||o.reflection)
	{
		s.push("vN=transformedNormal;");
		if(o.uv&&o.normalmap)
		s=s.concat(["vT1=normalize(uP2Matrix *uNMatrix*aTangent);",
				"vT2=normalize(uP2Matrix *uNMatrix*aTangent2);"]);
	}
		
	if(o.colors)
	s=s.concat(["if(uUseColors){",
	"vColor*=vec4(aColor,1.0);",
	"}"]);
	
	s=s.concat(["if(uFadeWithDistance){",
	"vColor.w*=1.0/(1.0+uFadeWithDistanceFactor*length(gl_Position));",  		
	"}"]);
	
	if(o.map)
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
		
	if(o.uv)
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
	
	function GLProjector(canvas)
	{
		this.canvas=canvas;
		this.width_factor=1;
		this.num_of_panels=1;
		this.current_panel=0;
		this.p2Matrix=[1,0,0,0,1,0,0,0,1];
	}
	
	GLProjector.prototype.getNumOfPanels=function()
	{
		return this.num_of_panels;
	};
	
	GLProjector.prototype.setNumOfPanels=function(value)
	{
		this.num_of_panels=value;
	};
	
	GLProjector.prototype.getCurrentPanel=function()
	{
		return this.current_panel;
	};
	
	GLProjector.prototype.setCurrentPanel=function(value)
	{
		this.current_panel=value;
	};
	
	GLProjector.prototype.getWidthFactor=function()
	{
		return this.width_factor;
	};
	
	GLProjector.prototype.setWidthFactor=function(value)
	{
		this.width_factor=value;
	};
	
	GLProjector.prototype.draw=function()
	{
		var gl=this.canvas.gl;
		gl.viewport(0,0, gl.viewportWidth, gl.viewportHeight);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		this.canvas._draw();
	};
	
	GLProjector.prototype.mapXY=function(x,y){return [x,y];};
	
/**
 * This class creates a background spherical object that can be used to render 360 spherical images to the background of a 3D scene.
 * @param canvas The GLCanvas object in which the background sphere will operate.
 * @param options An optional input object with one or more of the following fields: resolution (an integer with the number of vertices along the latitude the sphere)
 */
function BackgroundSphere(c,options)
{
	var opt=options||{};
	vn.default(opt,{resolution:64});
	
	var res=opt.resolution;
	this.canvas=c;
	this.object=new GLObject(c);
	var xyz=new Float32Array(3*res*res);
	var nrm=new Float32Array(3*res*res);
	var uv=new Float32Array(2*res*res);
	var tri=new Int16Array(6*(res-1)*(res-1));
	var c1=0;
	var c2=0;
	var c3=0;
	var c4=0;
	for(var i=0; i<res; i++)
	for(var j=0; j<res; j++)
	{
		xyz[c1]=Math.cos(3.1416*(j/(res-1)-0.5))*Math.cos(2*3.1416*i/(res-1));nrm[c1]=-xyz[c1];c1+=1;
		xyz[c1]=Math.sin(3.1416*(j/(res-1)-0.5));nrm[c1]=-xyz[c1];c1+=1;
		xyz[c1]=Math.cos(3.1416*(j/(res-1)-0.5))*Math.sin(2*3.1416*i/(res-1));nrm[c1]=-xyz[c1];c1+=1;
		uv[c2]=i/(res-1);c2+=1;
		uv[c2]=j/(res-1);c2+=1;
		if(i<res-1 && j<res-1)
		{
			tri[c3]=c4;c3+=1;tri[c3]=c4+res;c3+=1;tri[c3]=c4+1;c3+=1;
			tri[c3]=c4+1;c3+=1;tri[c3]=c4+res;c3+=1;tri[c3]=c4+res+1;c3+=1;
		}
		c4+=1;
	}
	for(var i=xyz.length-1; i>=0; i--)
		xyz[i]*=3;
	this.object.setXYZ(xyz);
	this.object.setNormals(nrm);
	this.object.setTriangles(tri);
	this.object.setUV(uv);
	this.object.getShader().useLighting(false);
	this.object.disablePicking(true);
			
}

/**
 * Sets a GLTexture to this object.
 * @param t An existing GLTexture object, or the URL of an image file given as a string.
 * @return Image A javascript Image object that will handle the image content. It will be returned only if a URL string is given as an input.
 */
BackgroundSphere.prototype.setTexture=function(t)
{
	return this.object.setTexture(t);
};

/**
 * Draws the object on the canvas.
 */
BackgroundSphere.prototype.draw=function()
{
	var cam=this.canvas.getCamera();
	cam.pushMatrix();
	cam.mvMatrix[12]=0;
	cam.mvMatrix[13]=0;
	cam.mvMatrix[14]=0;
	var gl=this.canvas.getGL();
	gl.disable(gl.DEPTH_TEST);
	this.object.draw();
	gl.enable(gl.DEPTH_TEST);
	cam.popMatrix();
};

/** 
 * This class helps you make 3D objects out of basic shapes such as boxes, cylinders, spheres, etc. without having to provide the XYZ, Triangles, Normals, and UV data arrays.
 * <b>Example:</b><br><font style="font-family:Courier">
 * var maker=new GLObjectMaker(my_canvas);<br>
 * maker.box({width:2,height:1,depth:1});<br>
 * maker.translate([0,1,0]);<br>
 * maker.cylinder({resolution:32,width:0.2,height:2,depth:0.2});<br>
 * var my_object=maker.flush();<br></font>
 * @param canvas A GLCanvas object for which the object will be made for.
 */
function GLObjectMaker(c)
{
	this.canvas=c;
	this.xyz=new Array();
	this.nrm=new Array();
	this.tri=new Array();
	this.uv=new Array();
	this.clr=new Array();
	this.current_color=null;
	GLCoordinateSystem.call(this);
}

/**
 * This function appends a custom-made object into the current object that is being made.
 * @param options This is an input object that can include one or more of the following fields: triangle, xyz, normals, colors, and uv, which are all arrays of numbers.
 */
GLObjectMaker.prototype.append=function(options)
{
	var opt=options||{};
	
	if(opt.triangles)this.appendTriangles(opt.triangles);
	if(opt.xyz)this.appendXYZ(opt.xyz);
	if(opt.normals)this.appendNormals(opt.normals);
	if(opt.uv)this.appendUV(opt.uv);
	if(opt.colors)this.appendColors(opt.colors)
};

 /**
 * Appends an array of XYZ vertices to the current 3D object being made by the object maker.
 * @param vertices An array of 3D vertices given in X,Y,Z,X,Y,Z... order preferably as a Float32Array typed array.
 */
GLObjectMaker.prototype.appendXYZ=function(v)
{
	var xyz_start=this.xyz.length;
	var a=0;
	var c=0;
	for(var i=0;i<v.length/3;i++)
	{
		c=i*3;
		a=mat4.multiplyVec4(this._m,[v[c],v[c+1],v[c+2],1]);
		this.xyz[xyz_start+c]=a[0];
		this.xyz[xyz_start+c+1]=a[1];
		this.xyz[xyz_start+c+2]=a[2];
	}
};

 /**
 * Appends an array of normal vertices to the current 3D object being made by the object maker.
 * @param vectors An array of normal vertices given in Nx,Ny,Nz,Nx,Ny,Nz... order preferably as a Float32Array typed array.
 */
GLObjectMaker.prototype.appendNormals=function(v)
{
	var nrm_start=this.nrm.length;
	var a=0;
	var c=0;
	var nm=mat3.create();
	mat4.toInverseMat3(this._m, nm);
	mat3.transpose(nm);
	nm=mat3.toMat4(nm);
	for(var i=0;i<v.length/3;i++)
	{
		c=i*3;
		a=mat4.multiplyVec4(nm,[v[c],v[c+1],v[c+2],0]);
		this.nrm[nrm_start+c]=a[0];
		this.nrm[nrm_start+c+1]=a[1];
		this.nrm[nrm_start+c+2]=a[2];
	}
};

 /**
 * Appends an array with texture coordinates to the current 3D object being made by the object maker. The texture coordinates must be given as real numbers in the interval [0-1].
 * @param coordinates An array of texture coordinates given in U,V,U,V... order preferably as a Float32Array typed array.
 */
GLObjectMaker.prototype.appendUV=function(v)
{
	var uv_start=this.uv.length;
	for(var i=0;i<v.length;i++)
	{
		this.uv[uv_start+i]=v[i];
	}
};

 /**
 * Appends an array of triangles to the current 3D object being made by the object maker. The faces must be given as triplets of indices of vertices.
 * @param vertices An array of indices of vertices given in V1,V2,V3,V1,V2,V3... order preferably as a Uint16Array typed array.
 */
GLObjectMaker.prototype.appendTriangles=function(v)
{
	var v_length=this.xyz.length/3;
	var tri_start=this.tri.length;
	for(var i=0;i<v.length;i++)
	{
		this.tri[tri_start+i]=v[i]+v_length;
	}
};

 /**
 * Appends an array with colors to the current 3D object being made by the object maker. The colors should be given as R,G,B,R,G,B,... with color intensities in the interval [0-1].
 * @param coordinates An array of color coordinates given in R,G,B,R,G,B,... order preferably as a Float32Array typed array.
 */
GLObjectMaker.prototype.appendColors=function(v)
{
	var clr_start=this.clr.length;
	for(var i=0;i<v.length;i++)
	{
		this.clr[clr_start+i]=v[i];
	}
};

/**
 * Appends an existing object to the current 3D object being made by the object maker. 
 * @param object An existing GLObject whose geometry will be appended in the object maker.
 */
GLObjectMaker.prototype.appendObject=function(o)
{
	var v=o.indices['Triangles'];if(v)this.appendTriangles(v.data);
	v=o.buffers['aXYZ'];if(v)this.appendXYZ(v.data);
	v=o.buffers['aNormal'];if(v)this.appendNormals(v.data);
	v=o.buffers['aUV'];if(v)this.appendUV(v.data);
	v=o.buffers['aColor'];if(v)this.appendColors(v.data);
};

/**
 * This method sets the color to the object maker. This color will be used to the next shape to be added to the current object being made by the object maker.
 * @param color An array of size 3 with the R,G,B color components of the new color.
 */
GLObjectMaker.prototype.color=function(color)
{
	this.current_color=color;
};

/**
 * This method adds a 2D rectangle (plane) to the current object being made.
 * @param options An optional object with one or more of the following fields: width, height, u, v (all numbers).
 */
GLObjectMaker.prototype.rectangle=function(options)
{	
	var opt=options||{};
	vn.default(opt,{width:1,height:1,u:1,v:1});
	var w=opt.width;
	var h=opt.height;
	var u_=opt.u;
	var v_=opt.v;
	this.appendTriangles([0,1,2,0,2,3]);
	this.appendXYZ([w/2,h/2,0,-w/2,h/2,0,-w/2,-h/2,0,w/2,-h/2,0]);
	this.appendNormals([0,0,1,0,0,1,0,0,1,0,0,1]);
	this.appendUV([u_,v_,0,v_,0,0,u_,0]);
	if(this.current_color)
	{
		var clr=new Array(3*4);
		var j=0;
		for(var i=0;i<4;i++)
		{
			clr[j]=this.current_color[0];j+=1;clr[j]=this.current_color[1];j+=1;clr[j]=this.current_color[2];j+=1;
		}
		this.appendColors(clr);
	}
};

GLObjectMaker.prototype.rect=function(w,h,u,v)
{
	this.rectangle({width:w,height:h,u:u,v:v});
};


/**
 * This method adds a 3D box to the current object being made.
 * @param options An optional object with one or more of the following fields: width, height, depth (all numbers), and front, back, left, right, top, bottom (all booleans).
 */
GLObjectMaker.prototype.box=function(options)
{
	var opt=options||{};
	vn.default(opt,{width:1,height:1,depth:1,front:true,back:true,left:true,right:true,top:true,bottom:true});
	
	var x=opt.width;
	var y=opt.height;
	var z=opt.depth;
	
	this.pushMatrix();
	this.scale([x,y,z]);
	
	//this.appendTriangles([0,2,1, 1,2,3, 4,5,6, 6,5,7, 9,11,8, 8,11,10, 13,12,15, 15,12,14, 16,17,18, 18,17,19, 21,20,22, 21,22,23]);
	//this.appendXYZ([-0.5,0.5,0.5, 0.5,0.5,0.5, -0.5,-0.5,0.5, 0.5,-0.5,0.5, -0.5,0.5,-0.5, 0.5,0.5,-0.5, -0.5,-0.5,-0.5, 0.5,-0.5,-0.5, 0.5,0.5,0.5, 0.5,-0.5,0.5, 0.5,0.5,-0.5, 0.5,-0.5,-0.5, -0.5,0.5,0.5, -0.5,-0.5,0.5, -0.5,0.5,-0.5, -0.5,-0.5,-0.5, -0.5,0.5,0.5, 0.5,0.5,0.5, -0.5,0.5,-0.5, 0.5,0.5,-0.5, -0.5,-0.5,0.5, 0.5,-0.5,0.5, -0.5,-0.5,-0.5, 0.5,-0.5,-0.5]);
	//this.appendNormals([0,0,1, 0,0,1, 0,0,1, 0,0,1, 0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1, 1,0,0, 1,0,0, 1,0,0, 1,0,0, -1,0,0, -1,0,0, -1,0,0, -1,0,0, 0,1,0, 0,1,0, 0,1,0, 0,1,0, 0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0]);
	//this.appendUV([0,1, 1,1, 0,0, 1,0, 1,1, 0,1, 1,0, 0,0, 0,1, 0,0, 1,1, 1,0, 1,1, 1,0, 0,1, 0,0, 0,0, 1,0, 0,1, 1,1, 1,0, 0,0, 1,1, 0,1]);
	if(opt.front)
	{
		this.pushMatrix();
		this.translate([0,0,0.5]);
		this.rect(1,1);
		this.popMatrix();
	}
	
	if(opt.back)
	{
		this.pushMatrix();
		this.translate([0,0,-0.5]);
		this.rotateY(3.1416);
		this.rect(1,1);
		this.popMatrix();
	}
	
	if(opt.right)
	{
		this.pushMatrix();
		this.translate([0.5,0,0]);
		this.rotateY(3.1416/2);
		this.rect(1,1);
		this.popMatrix();
	}
	
	if(opt.left)
	{
		this.pushMatrix();
		this.translate([-0.5,0,0]);
		this.rotateY(-3.1416/2);
		this.rect(1,1);
		this.popMatrix();
	}
	
	if(opt.top)
	{
		this.pushMatrix();
		this.translate([0,0.5,0]);
		this.rotateX(-3.1416/2);
		this.rect(1,1);
		this.popMatrix();
	}
	
	if(opt.bottom)
	{
		this.pushMatrix();
		this.translate([0,-0.5,0]);
		this.rotateX(3.1416/2);
		this.rect(1,1);
		this.popMatrix();
	}
	this.popMatrix();
};

/**
 * This method adds a 3D trapezoid to the current object being made.
 * @param options An optional object with one or more of the following fields: width, height, depth, width2, depth2 (all numbers).
 */
GLObjectMaker.prototype.trapezoid=function(options)
{
	var opt=options||{};
	vn.default(opt,{width:1,height:1,depth:1,width2:0.5,depth2:0.5});
	var x=opt.width;
	var z=opt.height;
	var y=opt.depth;
	var x2=opt.width2;
	var y2=opt.depth2;
	
	this.pushMatrix();
	this.rotateX(3.1415/2);
	this.scale([x,y,z]);
	
	var xx=x2/x;
	var yy=y2/y;
	
	this.appendTriangles([0,2,1, 1,2,3, 4,5,6, 6,5,7, 9,11,8, 8,11,10, 13,12,15, 15,12,14, 16,17,18, 18,17,19, 21,20,22, 21,22,23]);
	this.appendXYZ([-0.5,0.5,0.5, 0.5,0.5,0.5, -0.5,-0.5,0.5, 0.5,-0.5,0.5, -0.5*xx,0.5*yy,-0.5, 0.5*xx,0.5*yy,-0.5, -0.5*xx,-0.5*yy,-0.5, 0.5*xx,-0.5*yy,-0.5, 0.5,0.5,0.5, 0.5,-0.5,0.5, 0.5*xx,0.5*yy,-0.5, 0.5*xx,-0.5*yy,-0.5, -0.5,0.5,0.5, -0.5,-0.5,0.5, -0.5*xx,0.5*yy,-0.5, -0.5*xx,-0.5*yy,-0.5, -0.5,0.5,0.5, 0.5,0.5,0.5, -0.5*xx,0.5*yy,-0.5, 0.5*xx,0.5*yy,-0.5, -0.5,-0.5,0.5, 0.5,-0.5,0.5, -0.5*xx,-0.5*yy,-0.5, 0.5*xx,-0.5*yy,-0.5]);
	this.appendNormals([0,0,1, 0,0,1, 0,0,1, 0,0,1, 0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1, 1,0,0, 1,0,0, 1,0,0, 1,0,0, -1,0,0, -1,0,0, -1,0,0, -1,0,0, 0,1,0, 0,1,0, 0,1,0, 0,1,0, 0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0]);
	this.appendUV([0,1, 1,1, 0,0, 1,0, 1,1, 0,1, 1,0, 0,0, 0,1, 0,0, 1,1, 1,0, 1,1, 1,0, 0,1, 0,0, 0,0, 1,0, 0,1, 1,1, 1,0, 0,0, 1,1, 0,1]);
	if(this.current_color)
	{
		var clr=new Array(3*24);
		var j=0;
		for(var i=0;i<24;i++)
		{
			clr[j]=this.current_color[0];j+=1;clr[j]=this.current_color[1];j+=1;clr[j]=this.current_color[2];j+=1;
		}
		this.appendColors(clr);
	}
	
	this.popMatrix();
};

/**
 * This method adds a pyramid to the current object being made.
 * @param options An optional object with one or more of the following fields: width, height, depth (all numbers).
 */
GLObjectMaker.prototype.pyramid=function(options)
{
	var opt=options||{};
	vn.default(opt,{width:1,height:1,depth:1});
	var x=opt.width;
	var y=opt.height;
	var z=opt.depth;
	
	this.pushMatrix();
	this.scale([x,y,z]);
	this.appendTriangles([1,0,2, 5,3,4, 8,6,7, 11,9,10]);
	this.appendXYZ([-0.5,0,-0.5, -0.5,0,0.5, 0,1,0, -0.5,0,0.5, 0.5,0,0.5, 0,1,0, 0.5,0,0.5, 0.5,0,-0.5, 0,1,0, 0.5,0,-0.5, -0.5,0,-0.5, 0,1,0]);
	this.appendNormals([-1,1,0, -1,1,0, -1,1,0, 0,1,1, 0,1,1, 0,1,1, 1,1,0, 1,1,0,1,1,0, 0,1,-1, 0,1,-1, 0,1,-1]);
	this.appendUV([0,1, 0,0, 0.5,0.5, 0,0, 1,0, 0.5,0.5, 1,0, 1,1, 0.5,0.5, 1,1, 0,1, 0.5,0.5  ]);
	
	if(this.current_color)
	{
		var clr=new Array(3*12);
		var j=0;
		for(var i=0;i<12;i++)
		{
			clr[j]=this.current_color[0];j+=1;clr[j]=this.current_color[1];j+=1;clr[j]=this.current_color[2];j+=1;
		}
		this.appendColors(clr);
	}
	
	this.pushMatrix();
	this.rotateX(3.1416/2);
	this.rect(1,1);
	this.popMatrix();
	
	this.popMatrix();
};

/**
 * This method adds a cone to the current object being made.
 * @param options An optional object with one or more of the following fields: width, height, depth,resolution (all numbers).
 */
GLObjectMaker.prototype.cone=function(options)
{
	var opt=options||{};
	vn.default(opt,{width:1,height:1,depth:1,resolution:16});
	var x=opt.width;
	var y=opt.height;
	var z=opt.depth;
	var resolution=opt.resolution;
	
	var res=resolution+1;
	var xyz=new Float32Array(3*res*4);
	var nrm=new Float32Array(3*res*4);
	var uv=new Float32Array(2*res*4);
	var tri=new Int16Array(6*(res-1)*3);
	var c1=0;
	var c2=0;
	var c3=0;
	var c4=0;
	var w=[0,0.25,0.5,1];
	for(var j=0; j<4; j++)
	for(var i=0; i<res; i++)
	{
			xyz[c1]=w[j]*0.5*Math.cos(2*3.1416*i/(res-1)-3.1416/2);nrm[c1]=Math.cos(2*3.1416*i/(res-1)-3.1416/2)*0.866;c1+=1;
			xyz[c1]=1-w[j];nrm[c1]=0.5;c1+=1;
			xyz[c1]=w[j]*0.5*Math.sin(2*3.1416*i/(res-1)-3.1416/2);nrm[c1]=Math.sin(2*3.1416*i/(res-1)-3.1416/2)*0.866;c1+=1;
		
		uv[c2]=1-i/(res-1);c2+=1;
		uv[c2]=1-w[j];c2+=1;
		if(i<res-1 && j<3)
		{
			tri[c3]=c4;c3+=1;tri[c3]=c4+1;c3+=1;tri[c3]=c4+res;c3+=1;
			tri[c3]=c4+1;c3+=1;tri[c3]=c4+res+1;c3+=1;tri[c3]=c4+res;c3+=1;
		}
		c4+=1;
	}
	
	this.pushMatrix();
	this.scale([x,y,z]);
	
	this.appendTriangles(tri);
	this.appendXYZ(xyz);
	this.appendNormals(nrm);
	this.appendUV(uv);
	if(this.current_color)
	{
		var clr=new Array(3*res*4);
		var j=0;
		for(var i=0;i<res*4;i++)
		{
			clr[j]=this.current_color[0];j+=1;clr[j]=this.current_color[1];j+=1;clr[j]=this.current_color[2];j+=1;
		}
		this.appendColors(clr);
	}
	
	this.pushMatrix();
	this.rotate(3.1415,[1,0,0]);
	this.rotateX(-3.1415/2);
	this.disc({resolution:res-1,width:1,height:1,depth:1});
	this.popMatrix();
	
	this.popMatrix();
};

/**
 * This method adds a 2D disc to the current object being made.
 * @param options An optional object with one or more of the following fields: width, height, resolution (all numbers).
 */
GLObjectMaker.prototype.disc=function(options)
{
	var opt=options||{};
	vn.default(opt,{width:1,height:1,resolution:16});
	var x=opt.width;
	var y=1;
	var z=opt.height;
	var res=opt.resolution;
	
	var xyz=new Float32Array(3*(res+1));
	var nrm=new Float32Array(3*(res+1));
	var uv=new Float32Array(2*(res+1));
	var tri=new Int16Array(3*res);
	var c1=0;
	var c2=0;
	var c3=0;
	var c4=0;
	xyz[c1]=0;nrm[c1]=0;c1+=1;
	xyz[c1]=0;nrm[c1]=1;c1+=1;
	xyz[c1]=0;nrm[c1]=0;c1+=1;
	uv[c2]=0.5;c2+=1;
	uv[c2]=0.5;c2+=1;
	c4+=1;
	for(var i=0; i<res; i++)
	{
		xyz[c1]=0.5*Math.cos(2*3.1416*i/res-3.1416/2);nrm[c1]=0;c1+=1;
		xyz[c1]=0;nrm[c1]=1;c1+=1;
		xyz[c1]=0.5*Math.sin(2*3.1416*i/res-3.1416/2);nrm[c1]=0;c1+=1;
		uv[c2]=xyz[c1-3]+0.5;c2+=1;
		uv[c2]=0.5-xyz[c1-1];c2+=1;
		if(i<res-1)
		{
			tri[c3]=0;c3+=1;tri[c3]=c4+1;c3+=1;tri[c3]=c4;c3+=1;
		}
		else 
		{
			tri[c3]=0;c3+=1;tri[c3]=1;c3+=1;tri[c3]=c4;c3+=1;
		}	
		c4+=1;
	}
	
	this.pushMatrix();
	this.rotateX(3.1415/2);
	this.scale([x,y,z]);
	
	this.appendTriangles(tri);
	this.appendXYZ(xyz);
	this.appendNormals(nrm);
	this.appendUV(uv);
	if(this.current_color)
	{
		var clr=new Array(3*(res+1));
		var j=0;
		for(var i=0;i<res+1;i++)
		{
			clr[j]=this.current_color[0];j+=1;clr[j]=this.current_color[1];j+=1;clr[j]=this.current_color[2];j+=1;
		}
		this.appendColors(clr);
	}
	
	this.popMatrix();
};

/**
 * This method adds a cylinder to the current object being made.
 * @param options An optional object with one or more of the following fields: width, height, depth,width2,depth2,resolution (all numbers), noTop, noBottom (booleans).
 */
GLObjectMaker.prototype.cylinder=function(options)
{
	var opt=options||{};
	vn.default(opt,{width:1,height:1,depth:1,resolution:16});
	var x=opt.width;
	var y=opt.height;
	var z=opt.depth;
	var resolution=opt.resolution;
	var xx=1;
	if(typeof opt.width2!=='undefined') xx=opt.width2/opt.width;
	var zz=1;
	if(typeof opt.depth2!=='undefined') zz=opt.depth2/opt.depth;
	
	
	var res=resolution+1;
	var xyz=new Float32Array(3*res*2);
	var nrm=new Float32Array(3*res*2);
	var uv=new Float32Array(2*res*2);
	var tri=new Int16Array(6*(res-1));
	var c1=0;
	var c2=0;
	var c3=0;
	var c4=0;
	for(var j=0; j<2; j++)
	for(var i=0; i<res; i++)
	{
		if(j==0)
		{
			xyz[c1]=0.5*Math.cos(2*3.1416*i/(res-1)-3.1416/2);nrm[c1]=xyz[c1];c1+=1;
			xyz[c1]=(j-0.5);nrm[c1]=0;c1+=1;
			xyz[c1]=0.5*Math.sin(2*3.1416*i/(res-1)-3.1416/2);nrm[c1]=xyz[c1];c1+=1;
		}
		else
		{
			xyz[c1]=xx*0.5*Math.cos(2*3.1416*i/(res-1)-3.1416/2);nrm[c1]=xyz[c1];c1+=1;
			xyz[c1]=(j-0.5);nrm[c1]=0;c1+=1;
			xyz[c1]=zz*0.5*Math.sin(2*3.1416*i/(res-1)-3.1416/2);nrm[c1]=xyz[c1];c1+=1;
		}
		uv[c2]=1-i/(res-1);c2+=1;
		uv[c2]=j;c2+=1;
		if(i<res-1 && j<1)
		{
			tri[c3]=c4;c3+=1;tri[c3]=c4+res;c3+=1;tri[c3]=c4+1;c3+=1;
			tri[c3]=c4+1;c3+=1;tri[c3]=c4+res;c3+=1;tri[c3]=c4+res+1;c3+=1;
		}
		c4+=1;
	}
	
	this.pushMatrix();
	this.scale([x,y,z]);
	
	this.appendTriangles(tri);
	this.appendXYZ(xyz);
	this.appendNormals(nrm);
	this.appendUV(uv);
	if(this.current_color)
	{
		var clr=new Array(3*res*2);
		var j=0;
		for(var i=0;i<res*2;i++)
		{
			clr[j]=this.current_color[0];j+=1;clr[j]=this.current_color[1];j+=1;clr[j]=this.current_color[2];j+=1;
		}
		this.appendColors(clr);
	}
	
	if(opt.noTop){}
	else{
	this.pushMatrix();
	this.translate([0,0.5,0]);
	this.rotateX(-3.1415/2);
	this.disc({resolution:res-1,width:xx,height:zz});
	this.popMatrix();
	}
	if(opt.noBottom){}
	else{
	this.pushMatrix();
	this.translate([0,-0.5,0]);
	this.rotate(3.1415,[1,0,0]);
	this.rotateX(-3.1415/2);
	this.disc({resolution:res-1,width:1,height:1});
	this.popMatrix();
	}
	this.popMatrix();
};


GLObjectMaker.prototype.cylinderY=function(res,x,y,z)
{
	this.cylinder({resolution:res,width:x,height:y,depth:z});
};
 

GLObjectMaker.prototype.cylinderX=function(res,x,y,z)
{
	this.pushMatrix();
	this.rotate(3.1415/2,[0,0,1]);
	this.cylinderY(res,y,x,z);
	this.popMatrix();
};


GLObjectMaker.prototype.cylinderZ=function(res,x,y,z)
{
	this.pushMatrix();
	this.rotate(3.1415/2,[1,0,0]);
	this.cylinderY(res,x,z,y);
	this.popMatrix();
};

/**
 * This method adds a sphere to the current object being made.
 * @param options An optional object with one or more of the following fields: width, height, depth, resolution (all numbers).
 */
GLObjectMaker.prototype.sphere=function(options)
{
	var opt=options||{};
	vn.default(opt,{width:1,height:1,depth:1,resolution:16});
	var x=opt.width;
	var y=opt.height;
	var z=opt.depth;
	var resolution=opt.resolution;
	
	var res=resolution+1;
	var xyz=new Float32Array(3*res*res);
	var nrm=new Float32Array(3*res*res);
	var uv=new Float32Array(2*res*res);
	var tri=new Int16Array(6*(res-1)*(res-2));
	var c1=0;
	var c2=0;
	var c3=0;
	var c4=0;
	for(var j=0; j<res; j++)
	for(var i=0; i<res; i++)
	{
		xyz[c1]=0.5*Math.cos(3.1416*(j/(res-1)-0.5))*Math.cos(2*3.1416*i/(res-1)-3.1416/2);nrm[c1]=xyz[c1]*2;c1+=1;
		xyz[c1]=0.5*Math.sin(3.1416*(j/(res-1)-0.5));nrm[c1]=xyz[c1]*2;c1+=1;
		xyz[c1]=0.5*Math.cos(3.1416*(j/(res-1)-0.5))*Math.sin(2*3.1416*i/(res-1)-3.1416/2);nrm[c1]=xyz[c1]*2;c1+=1;
		uv[c2]=1-i/(res-1);c2+=1;
		uv[c2]=j/(res-1);c2+=1;
		if(i<res-1 && j<res-1)
		{
			if(j>0){tri[c3]=c4;c3+=1;tri[c3]=c4+res;c3+=1;tri[c3]=c4+1;c3+=1;}
			if(j<res-2){tri[c3]=c4+1;c3+=1;tri[c3]=c4+res;c3+=1;tri[c3]=c4+res+1;c3+=1;}
		}
		c4+=1;
	}
	
	this.pushMatrix();
	this.scale([x,y,z]);
	
	this.appendTriangles(tri);
	this.appendXYZ(xyz);
	this.appendNormals(nrm);
	this.appendUV(uv);
	if(this.current_color)
	{
		var clr=new Array(3*res*res);
		var j=0;
		for(var i=0;i<res*res;i++)
		{
			clr[j]=this.current_color[0];j+=1;clr[j]=this.current_color[1];j+=1;clr[j]=this.current_color[2];j+=1;
		}
		this.appendColors(clr);
	}
	
	this.popMatrix();
};

/**
 * This method clears one or more attribute arrays from the object maker before the object it is flushed. You can use this method to remove UV or Normals if they are not needed in the object.
 * @param options An object with one or more of the following fields: xyz, normals, triangles, colors, uv with boolean values to indicate which one to clear. If no object is defined all data are cleaned.
 */
GLObjectMaker.prototype.clear=function(options)
{
	var opt=options||{xyz:true,normals:true,triangles:true,uv:true};
	if(opt.xyz)this.xyz=[];
	if(opt.uv)this.uv=[];
	if(opt.normals)this.nrm=[];
	if(opt.triangles)this.tri=[];
	if(opt.colors)this.clr=[];
};

/**
 * This method flushes the object that was made by the object maker.
 * @param object An optional GLObject can be given as input to flush the new geometry into that object.
 * @return GLObject It returns the object made by the object maker.
 */
GLObjectMaker.prototype.flush=function(object)
{
	var obj=null;
	if(object)obj=object;
	else obj=new GLObject(this.canvas);
	if(this.xyz.length>0)obj.setXYZ(this.xyz);
	if(this.nrm.length>0)obj.setNormals(this.nrm);
	if(this.tri.length>0)obj.setTriangles(this.tri);
	if(this.uv.length>0)obj.setUV(this.uv);
	if(this.clr.length>0)obj.setColors(this.clr);
	this.xyz=new Array();
	this.nrm=new Array();
	this.tri=new Array();
	this.uv=new Array();
	this.clr=new Array();
	this.current_color=null;
	return obj;
};

vn.extend(GLCoordinateSystem,GLObjectMaker);

function CoordinateSystemAxes(canvas, length,width)
{
    var om=new GLObjectMaker(canvas);
    
    om.cylinderX(8,length,width,width);
om.clear({uv:true});
this.xax=om.flush();
this.xax.getShader().setColorMask([1,0,0,1]);
om.identity();
om.cylinderY(8,width,length,width);
om.clear({uv:true});
this.yax=om.flush();
this.yax.getShader().setColorMask([0,1,0,1]);
om.identity();
om.cylinderZ(8,width,width,length);
om.clear({uv:true});
this.zax=om.flush();
this.zax.getShader().setColorMask([0,0,1,1]);
}

CoordinateSystemAxes.prototype.draw=function(cam)
{
   this.xax.draw();
   this.yax.draw();
   this.zax.draw();
};

// glMatrix v0.9.5
glMatrixArrayType=typeof Float32Array!="undefined"?Float32Array:typeof GLFloatArray!="undefined"?GLFloatArray:Array;var vec3={};vec3.create=function(a){var b=new glMatrixArrayType(3);if(a){b[0]=a[0];b[1]=a[1];b[2]=a[2]}return b};vec3.set=function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];return b};vec3.add=function(a,b,c){if(!c||a==c){a[0]+=b[0];a[1]+=b[1];a[2]+=b[2];return a}c[0]=a[0]+b[0];c[1]=a[1]+b[1];c[2]=a[2]+b[2];return c};
vec3.subtract=function(a,b,c){if(!c||a==c){a[0]-=b[0];a[1]-=b[1];a[2]-=b[2];return a}c[0]=a[0]-b[0];c[1]=a[1]-b[1];c[2]=a[2]-b[2];return c};vec3.negate=function(a,b){b||(b=a);b[0]=-a[0];b[1]=-a[1];b[2]=-a[2];return b};vec3.scale=function(a,b,c){if(!c||a==c){a[0]*=b;a[1]*=b;a[2]*=b;return a}c[0]=a[0]*b;c[1]=a[1]*b;c[2]=a[2]*b;return c};
vec3.normalize=function(a,b){b||(b=a);var c=a[0],d=a[1],e=a[2],g=Math.sqrt(c*c+d*d+e*e);if(g){if(g==1){b[0]=c;b[1]=d;b[2]=e;return b}}else{b[0]=0;b[1]=0;b[2]=0;return b}g=1/g;b[0]=c*g;b[1]=d*g;b[2]=e*g;return b};vec3.cross=function(a,b,c){c||(c=a);var d=a[0],e=a[1];a=a[2];var g=b[0],f=b[1];b=b[2];c[0]=e*b-a*f;c[1]=a*g-d*b;c[2]=d*f-e*g;return c};vec3.length=function(a){var b=a[0],c=a[1];a=a[2];return Math.sqrt(b*b+c*c+a*a)};vec3.dist=function(a,b){var d=a[0]-b[0],c=a[1]-b[1];a=a[2]-b[2];return Math.sqrt(d*d+c*c+a*a)};vec3.dot=function(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]};
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

mat4.rotateXL=function(b,a,c){var d=Math.sin(-b);b=Math.cos(b);var e=a[1],g=a[5],f=a[9],h=a[13],i=a[2],j=a[6],k=a[10],l=a[14];if(c){if(a!=c){c[0]=a[0];c[4]=a[4];c[8]=a[8];c[12]=a[12];c[3]=a[3];c[7]=a[7];c[11]=a[11];c[15]=a[15]}}else c=a;c[1]=e*b+i*d;c[5]=g*b+j*d;c[9]=f*b+k*d;c[10]=h*b+l*d;c[2]=e*-d+i*b;c[6]=g*-d+j*b;c[10]=f*-d+k*b;c[14]=h*-d+l*b;return c};

mat4.rotateYL=function(b,a,c){var d=Math.sin(-b);b=Math.cos(b);var e=a[0],g=a[4],f=a[8],h=a[12],i=a[2],j=a[6],k=a[10],l=a[14];if(c){if(a!=c){c[1]=a[1];c[5]=a[5];c[9]=a[9];c[13]=a[13];c[3]=a[3];c[7]=a[7];c[11]=a[11];c[15]=a[15]}}else c=a;c[0]=e*b+i*-d;c[4]=g*b+j*-d;c[8]=f*b+k*-d;c[12]=h*b+l*-d;c[2]=e*d+i*b;c[6]=g*d+j*b;c[10]=f*d+k*b;c[14]=h*d+l*b;return c};

mat4.rotateZL=function(b,a,c){var d=Math.sin(-b);b=Math.cos(b);var e=a[0],g=a[4],f=a[8],h=a[12],i=a[1],j=a[5],k=a[9],l=a[13];if(c){if(a!=c){c[2]=a[2];c[6]=a[6];c[10]=a[10];c[14]=a[14];c[3]=a[3];c[7]=a[7];c[11]=a[11];c[15]=a[15]}}else c=a;c[0]=e*b+i*d;c[4]=g*b+j*d;c[8]=f*b+k*d;c[12]=h*b+l*d;c[1]=e*-d+i*b;c[5]=g*-d+j*b;c[9]=f*-d+k*b;c[13]=h*-d+l*b;return c};

mat4.frustum=function(a,b,c,d,e,g,f){f||(f=mat4.create());var h=b-a,i=d-c,j=g-e;f[0]=e*2/h;f[1]=0;f[2]=0;f[3]=0;f[4]=0;f[5]=e*2/i;f[6]=0;f[7]=0;f[8]=(b+a)/h;f[9]=(d+c)/i;f[10]=-(g+e)/j;f[11]=-1;f[12]=0;f[13]=0;f[14]=-(g*e*2)/j;f[15]=0;return f};mat4.perspective=function(a,b,c,d,e){a=c*Math.tan(a*Math.PI/360);b=a*b;return mat4.frustum(-b,b,-a,a,c,d,e)};
mat4.ortho=function(a,b,c,d,e,g,f){f||(f=mat4.create());var h=b-a,i=d-c,j=g-e;f[0]=2/h;f[1]=0;f[2]=0;f[3]=0;f[4]=0;f[5]=2/i;f[6]=0;f[7]=0;f[8]=0;f[9]=0;f[10]=-2/j;f[11]=0;f[12]=-(a+b)/h;f[13]=-(d+c)/i;f[14]=-(g+e)/j;f[15]=1;return f};
mat4.lookAt=function(a,b,c,d){d||(d=mat4.create());var e=a[0],g=a[1];a=a[2];var f=c[0],h=c[1],i=c[2];c=b[1];var j=b[2];if(e==b[0]&&g==c&&a==j)return mat4.identity(d);var k,l,o,m;c=e-b[0];j=g-b[1];b=a-b[2];m=1/Math.sqrt(c*c+j*j+b*b);c*=m;j*=m;b*=m;k=h*b-i*j;i=i*c-f*b;f=f*j-h*c;if(m=Math.sqrt(k*k+i*i+f*f)){m=1/m;k*=m;i*=m;f*=m}else f=i=k=0;h=j*f-b*i;l=b*k-c*f;o=c*i-j*k;if(m=Math.sqrt(h*h+l*l+o*o)){m=1/m;h*=m;l*=m;o*=m}else o=l=h=0;d[0]=k;d[1]=h;d[2]=c;d[3]=0;d[4]=i;d[5]=l;d[6]=j;d[7]=0;d[8]=f;d[9]=
o;d[10]=b;d[11]=0;d[12]=-(k*e+i*g+f*a);d[13]=-(h*e+l*g+o*a);d[14]=-(c*e+j*g+b*a);d[15]=1;return d};mat4.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+", "+a[3]+", "+a[4]+", "+a[5]+", "+a[6]+", "+a[7]+", "+a[8]+", "+a[9]+", "+a[10]+", "+a[11]+", "+a[12]+", "+a[13]+", "+a[14]+", "+a[15]+"]"};quat4={};quat4.create=function(a){var b=new glMatrixArrayType(4);if(a){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3]}return b};quat4.set=function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];return b};
quat4.calculateW=function(a,b){var c=a[0],d=a[1],e=a[2];if(!b||a==b){a[3]=-Math.sqrt(Math.abs(1-c*c-d*d-e*e));return a}b[0]=c;b[1]=d;b[2]=e;b[3]=-Math.sqrt(Math.abs(1-c*c-d*d-e*e));return b};quat4.inverse=function(a,b){if(!b||a==b){a[0]*=1;a[1]*=1;a[2]*=1;return a}b[0]=-a[0];b[1]=-a[1];b[2]=-a[2];b[3]=a[3];return b};quat4.length=function(a){var b=a[0],c=a[1],d=a[2];a=a[3];return Math.sqrt(b*b+c*c+d*d+a*a)};
quat4.normalize=function(a,b){b||(b=a);var c=a[0],d=a[1],e=a[2],g=a[3],f=Math.sqrt(c*c+d*d+e*e+g*g);if(f==0){b[0]=0;b[1]=0;b[2]=0;b[3]=0;return b}f=1/f;b[0]=c*f;b[1]=d*f;b[2]=e*f;b[3]=g*f;return b};quat4.multiply=function(a,b,c){c||(c=a);var d=a[0],e=a[1],g=a[2];a=a[3];var f=b[0],h=b[1],i=b[2];b=b[3];c[0]=d*b+a*f+e*i-g*h;c[1]=e*b+a*h+g*f-d*i;c[2]=g*b+a*i+d*h-e*f;c[3]=a*b-d*f-e*h-g*i;return c};
quat4.multiplyVec3=function(a,b,c){c||(c=b);var d=b[0],e=b[1],g=b[2];b=a[0];var f=a[1],h=a[2];a=a[3];var i=a*d+f*g-h*e,j=a*e+h*d-b*g,k=a*g+b*e-f*d;d=-b*d-f*e-h*g;c[0]=i*a+d*-b+j*-h-k*-f;c[1]=j*a+d*-f+k*-b-i*-h;c[2]=k*a+d*-h+i*-f-j*-b;return c};quat4.toMat3=function(a,b){b||(b=mat3.create());var c=a[0],d=a[1],e=a[2],g=a[3],f=c+c,h=d+d,i=e+e,j=c*f,k=c*h;c=c*i;var l=d*h;d=d*i;e=e*i;f=g*f;h=g*h;g=g*i;b[0]=1-(l+e);b[1]=k-g;b[2]=c+h;b[3]=k+g;b[4]=1-(j+e);b[5]=d-f;b[6]=c-h;b[7]=d+f;b[8]=1-(j+l);return b};
quat4.toMat4=function(a,b){b||(b=mat4.create());var c=a[0],d=a[1],e=a[2],g=a[3],f=c+c,h=d+d,i=e+e,j=c*f,k=c*h;c=c*i;var l=d*h;d=d*i;e=e*i;f=g*f;h=g*h;g=g*i;b[0]=1-(l+e);b[1]=k-g;b[2]=c+h;b[3]=0;b[4]=k+g;b[5]=1-(j+e);b[6]=d-f;b[7]=0;b[8]=c-h;b[9]=d+f;b[10]=1-(j+l);b[11]=0;b[12]=0;b[13]=0;b[14]=0;b[15]=1;return b};quat4.slerp=function(a,b,c,d){d||(d=a);var e=c;if(a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3]<0)e=-1*c;d[0]=1-c*a[0]+e*b[0];d[1]=1-c*a[1]+e*b[1];d[2]=1-c*a[2]+e*b[2];d[3]=1-c*a[3]+e*b[3];return d};
quat4.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+", "+a[3]+"]"};