/* V3
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

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;	
window.AudioContext = window.AudioContext || window.webkitAudioContext;

/**
 * This class consists of a set of utility methods that control the WebCamera as an object in JavaScript. The WebCamera object can be created and retrieved by the MediaSystem class.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var media_system=new MediaSystem({audio:true,video:true});<br>
 * media_system.getWebCam().onTurnOn=function(){console.log('My camera is on!')};<br></font>
 */
function WebCamera()
{
	this._is_enabled=false;
	this._media_stream=null;
	this.video      = document.createElement('video');
	this.video.width    = 240;
	this.video.height   = 180;
	this.video.style.width='100%';
	this.video.style.height='100%';
	this.video.autoplay = true;
	this.video.muted=true;//must be muted otherwise will hear an echo.
	this.video.onloadedmetadata=function()
	{
		console.log(this.videoWidth)
		console.log(this.videoHeight)
	}
	this.canvas = document.createElement('canvas');
	this.ctx = this.canvas.getContext('2d');
	this.canvas.height=this.video.height;
	this.canvas.width=this.video.width;
	
	this.image=document.createElement('img');
	this.image.style.width="100%";
	this.image.style.height="100%";
}

/*WebCamera.prototype.enable=function(flag)
{
	if(navigator.getUserMedia)
	{
		var self=this;
		if(flag)
		{
			if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
				navigator.mediaDevices.getUserMedia( {video:true}).then(function(s){self._onTurnOn(s)}).catch(function(err){console.log('CANNOT TURN ON WEBCAM: '+err);});
			else navigator.getUserMedia( {video:true}, function(s){self._onTurnOn(s)}, function(err){console.log('CANNOT TURN ON WEBCAM: '+err);});

		}
		else if(this._media_stream) 
		{
			this._is_enabled=false;
			this._media_stream.getTracks()[0].stop();
			this._media_stream=null;
		}
	}
	else if(flag)console.log('CANNOT TURN ON WEBCAM: getUserMedia is not supported');
};*/

/**
 * This method returns true if the web camera has been turned on after the user's approval. 
 * @return boolean The current status of the web camera.
 */
WebCamera.prototype.isEnabled=function(){return this._is_enabled;};

WebCamera.prototype._onTurnOn=function(s)
{
	if(s.getVideoTracks().length==0)return;
	
	this._media_stream=s;
    this.video.src    = window.URL.createObjectURL(s);
	this._is_enabled=true;
	this.onTurnOn(s);
};

/**
 * A callback method that is called when the camera is turned on. It is initially empty.
 * @param stream The MediaStream object that corresponds to the stream of the web camera.
 */
WebCamera.prototype.onTurnOn=function(stream){};

/**
 * This method creates a window that shows the video stream of your web camera.
 * @param wm The WindowManager object that will be used to build the window.
 * @return VNWindow The window object that has been created.
 */
WebCamera.prototype.createViewerWindow=function(wm)
{
	var w=wm.createWindow(0,0,240,180);
	w.setTitle('WebCam Stream');
	w.setCanResize(true);
	w.setCanMove(true);
	var div_container=w.getContentDiv();
	div_container.style.backgroundColor='rgb(0,0,0)';
	//div_container.appendChild(this.image);
	var decoration_width=w.getWidth()-parseInt(div_container.clientWidth);
	var decoration_height=w.getHeight()-parseInt(div_container.clientHeight);
	w.setSize(320+decoration_width,240+decoration_height);
	w.center();
	return w;
};

/** 
 * This method grabs a frame from your web camera video stream and returns it as an ImageData javascript object.
 * @options An optional object with the format and quality of the snap shot. Example: my_camera.snap({format:'image/jpeg', quality:0.5});
 * @return ImageData The ImageData object with the data of the snapped video frame.
 */
WebCamera.prototype.snap=function(options)
{
	var opt=options||{};
	this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
	if(opt.format)
	{
			var url = this.canvas.toDataURL(opt.format, opt.quality||1);
			//console.log(url.length-16-7-828);
	this.image.src=url;
			//console.log(url.slice(url.indexOf('base64,')+7).slice(0,828));//512+256+32+16+12));
			this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
	}		
	return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
};

/**
 * This method returns the web camera stream as an HTML video element. The element can be dynamically placed anywhere in your website's DOM to view the video stream.
 * @return Video An HTML video object of the web camera stream. 
 */
WebCamera.prototype.getElement=function(){return this.video;};

/**
 * This class consists of a set of utility methods that control your media system (microphone, webcamera, speakers, etc.) as an object in JavaScript. The MediaSystem object can be used to get access to the Microphone object or the WebCam object to control the respective media devices.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var media_system=new MediaSystem({audio:true,video:true});<br>
 * media_system.getWebCam().onTurnOn=function(){console.log('My camera is on!')};<br>
 * media_system.getMicrophone().onTurnOn=function(){console.log('My mic is on!')};<br></font>
 * @param params An object with the input parameters to declare which media devices to activate. Example:  media_system=new MediaSystem({audio:true,video:true});
 */
function MediaSystem(params) 
{
	this._ac=new AudioContext();
	this._mic=new Microphone(this);
	this._cam=new WebCamera();
	this.enable(params);
}

MediaSystem.prototype.enable=function(params)
{
	if(navigator.getUserMedia)
	{
		var self=this;
		
			if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
				navigator.mediaDevices.getUserMedia( params).then(function(s){
					if(params.audio)self._mic._onTurnOn(s);
					if(params.video)self._cam._onTurnOn(s);
					}).catch(function(err){console.log('CANNOT TURN ON MEDIA: '+err);});
			else navigator.getUserMedia( params, function(s){if(params.audio)self._mic._onTurnOn(s);if(params.video)self._cam._onTurnOn(s);}, function(err){console.log('CANNOT TURN ON MEDIA: '+err);});

	}
	else console.log('CANNOT TURN ON MEDIA: getUserMedia is not supported');
};

/**
 * This method returns the WebCamera object of your web camera, which can be used to control your web camera. 
 * @return WebCamera The WebCamera object of your web camera.
 */
MediaSystem.prototype.getWebCam=function(){return this._cam;};
/**
 * This method returns the Microphone object of your microphone, which can be used to control your microphone. 
 * @return Microphone The Microphone object of your microphone.
 */
MediaSystem.prototype.getMicrophone=function(){return this._mic;};
/**
 * This method returns the AudioContext object of your audio system, which can be used to create audio processes or obtain information about your audio system. 
 * @return AudioContext The AudioContext object of your audio system.
 */
MediaSystem.prototype.getAudioContext=function(){return this._ac;};

/**
 * This method returns the sample rate of your audio system, which is used in your microphone and speakers. 
 * @return number The sample rate of your audio system.
 */
MediaSystem.prototype.sampleRate=function(){return this._ac.sampleRate;};

/**
 * This class consists of a set of utility methods that control your microphone as an object in JavaScript. The Microphone object can be created and retrieved by the MediaSystem class.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var media_system=new MediaSystem({audio:true,video:true});<br>
 * media_system.getMicrophone().onTurnOn=function(){console.log('My mic is on!')};<br></font>
 */
function Microphone(media_system)
{
	this._ms=media_system;
	this._is_enabled=false;
	this._stream_source=null;
	this._media_stream=null;
	this._processor=null;
}

/*Microphone.prototype.enable=function(flag)
{
	if(navigator.getUserMedia)
	{
		var self=this;
		if(flag)
		{
			if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
				navigator.mediaDevices.getUserMedia( {audio:true}).then(function(s){self._onTurnOn(s)}).catch(function(err){console.log('CANNOT TURN ON MICROPHONE: '+err);});
			else navigator.getUserMedia( {audio:true}, function(s){self._onTurnOn(s)}, function(err){console.log('CANNOT TURN ON MICROPHONE: '+err);});

		}
		else if(this._media_stream) 
		{
			this._is_enabled=false;
			this._media_stream.getTracks()[0].stop();
			this._media_stream=null;
		}
	}
	else if(flag)console.log('CANNOT TURN ON MICROPHONE: getUserMedia is not supported');
};*/


/**
 * This method returns true if the microphone has been turned on after the user's approval. 
 * @return boolean The current status of the microphone.
 */
Microphone.prototype.isEnabled=function(){return this._is_enabled;};

/**
 * This method returns the sample rate of your audio system, which is used in your microphone and speakers. 
 * @return number The sample rate of your audio system.
 */
Microphone.prototype.sampleRate=function(){return this._ms._ac.sampleRate;};

Microphone.prototype._onTurnOn=function(s)
{
	if(s.getAudioTracks().length==0)return;
	 // Create an AudioNode from the stream.
	var ac=this._ms.getAudioContext();
	this._media_stream=s;
    this._stream_source = ac.createMediaStreamSource( s );
	this._processor = ac.createScriptProcessor(2048, 1, 1);
	this._stream_source.connect(this._processor);
	this._processor.connect(ac.destination);
		
	var self=this;
	this._processor.onaudioprocess = function(event) {
		self.onAudioFrame(event);	
	};
	this._is_enabled=true;
	this.onTurnOn(s);
};

/**
 * A callback method that is called when an audio frame is received from your microphone. It is initially empty.
 * @param event An AudioProcessingEvent object with the data of the new audio frame.
 */
Microphone.prototype.onAudioFrame=function(event){};

Microphone.prototype._onTurnOff=function(s)
{
	console.log('Microphone turned off');
	this._is_enabled=false;
	this.onTurnOff(s);
};

/**
 * A callback method that is called when the microphone is turned on. It is initially empty.
 * @param stream The MediaStream object that corresponds to the stream of the microphone.
 */
Microphone.prototype.onTurnOn=function(stream){};
Microphone.prototype.onTurnOff=function(stream){};

/**
 * This class implements a JPEG video stream encoder of your web camera video stream. The encoded video stream consists of key frames which are encoded in jpeg format, and intermediate frames that contain the color differences between frames (dframes), which are also encoded in jpeg format. This class creates a JavaScript Worker, which performs the stream processing in a parallel thread.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var encoder=new JPEGStreamEncoder(media_stream,{width:240,height:180,fps:10,dframes:29,delay_frames:5});<br>
 * encoder.addFrames(true);<br>
 * encoder.onVideoFrame=function(encoder,buffer){console.log('A new frame was encoded!')};<br></font>
 * @param media_system The MediaSystem object that contains your web camera stream to be encoded.
 * @param config An optional object with the configuration of the encoder. The configuration object may contain one or more of the following parameters: width (default=240), height (default=180), fps (default=10), dframes (default=29), delay_frames (default=5).
 */
function JPEGStreamEncoder(media_system, config)
{
	var cfg=config||{};
	this.dframes=cfg.dframes||29;
	this.width=cfg.width||240;
	this.height=cfg.height||180;
	this.interval=1000/(cfg.fps||10);
	this.skip=cfg.skip||0;
	this.skip+=1;
	this.delay_frames=cfg.delay_frames||5;
	this.fcounter=0;
	this.ccounter=0;
	this.byte_counter=0;
	this.current_byte_counter=0;
	
	this.delay_buffer=new Array(this.delay_frames);
	this.delay_frame_now=0;
	
	this.canvas = document.createElement('canvas');
	this.ctx = this.canvas.getContext('2d');
	this.canvas.height=this.height;
	this.canvas.width=this.width;
	this.image=document.createElement('img');
		
	this.show_canvas = document.createElement('canvas');
	this.show_ctx = this.show_canvas.getContext('2d');
	this.show_canvas.height=this.height;
	this.show_canvas.width=this.width;
	this.show_canvas.style.width='100%';
	this.show_image=document.createElement('img');
		
	this._ms=media_system;
	this.cam=this._ms.getWebCam();
	this.video=this.cam.video;
	if('file:' == document.location.protocol)this.realTimeEncoder={postMessage:function(){}};
	else this.realTimeEncoder=new Worker(((document.location.hostname==vn.hostname) ? '/js/' : 'vn/')+'jpegstream.worker.js');
	this.realTimeEncoder.postMessage({cmd: 'init', config: cfg});

	this.enabled=false;
	
	var self=this;
	this.realTimeEncoder.onmessage = function (e) {
    switch (e.data.cmd) {
	  case 'frame_out':
		self.byte_counter+=e.data.buf.length;
		var b=self.delay_buffer[self.delay_frame_now];
		if(b)self.onVideoFrame(self,b);
		self.delay_buffer[self.delay_frame_now]=e.data.buf;
		self.delay_frame_now+=1;if(self.delay_frame_now>=self.delay_buffer.length)self.delay_frame_now=0;
	  break;
      case 'dframe':
		if(self.fcounter>0) 
		{
			self.compress(e.data.buf,function(d)
			{
				self.realTimeEncoder.postMessage({cmd:'update',rgba:d.rgba,base64:d.base64});
				self.fcounter-=1;
			});	
		}
		else self.fcounter-=1;
		break;
		}
	};
	
	this.timer=window.setInterval(function(){self.encode();},this.interval);
}

/**
 * This method resets the encoder. The resets removes any prior video frame data and starts a fresh encoding process beginning with a new key frame.
 */
JPEGStreamEncoder.prototype.reset=function()
{
	this.fcounter=0;
	this.ccounter=0;
	this.byte_counter=0;
	this.current_byte_counter=0;
	this.delay_buffer=new Array(this.delay_frames);
	this.delay_frame_now=0;
};

/**
 * This method enables or disables the encoding of new frames from your web camera. By default it is disabled, therefore to start encoding you need to call the method encoder.addFrames(true);
 * @param flag A Boolean flag that indicates the new status of the encoder.
 */
JPEGStreamEncoder.prototype.addFrames=function(flag){if(flag==true){this.reset();this.enabled=true;}else this.enabled=false;};

/**
 * This method returns the encoded stream as an HTML canvas element. The element can be dynamically placed anywhere in your website's DOM to view the encoded stream.
 * @return Canvas An HTML canvas object of the encoded stream. 
 */
JPEGStreamEncoder.prototype.getElement=function(){return this.show_canvas;};

/**
 * This method sets an image as the initial content of the encoding canvas. 
 * @param url A string with the url of the image.
 */
JPEGStreamEncoder.prototype.setInitialImage=function(url)
{
	var self=this;
	this.show_image.onload=function()
	{
		self.show_ctx.drawImage(self.show_image, 0, 0, self.width, self.height);
	};
	this.show_image.crossOrigin = '';
	this.show_image.src=url;
};

JPEGStreamEncoder.prototype.snap=function(callback,options)
{
	var opt=options||{};
	this.show_ctx.drawImage(this.video, 0, 0, this.width, this.height);
	var url=null;
	if(opt.format)
	{
			var url = this.show_canvas.toDataURL(opt.format, opt.quality||1);
			var self=this;
			this.show_image.onload=function()
			{
				self.show_ctx.drawImage(self.show_image, 0, 0, self.width, self.height);
				callback({rgba:self.show_ctx.getImageData(0, 0, self.width, self.height).data,base64:url});
			};
			this.show_image.src=url;
			
	}		
	else callback({rgba:this.show_ctx.getImageData(0, 0, this.width, this.height).data,base64:url});
};


JPEGStreamEncoder.prototype.compress=function(data,callback)
{
	this.ctx.putImageData(new ImageData(data,this.width,this.height), 0, 0);
	var url = this.canvas.toDataURL('image/jpeg', 0.5);		
	var self=this;
	this.image.onload=function()
	{
		self.ctx.drawImage(self.image, 0, 0, self.width, self.height);		
		callback({rgba:self.ctx.getImageData(0, 0, self.width, self.height).data,base64:url});
	};
	this.image.src=url;
};

JPEGStreamEncoder.prototype.getBytes=function(){return this.current_byte_counter;};

JPEGStreamEncoder.prototype.encode=function()
{
	if(!this.enabled)return;
	if(!this.cam.isEnabled())return;
	if(this.ccounter%this.skip==0)
	{
		if(this.fcounter<=0)
		{
			this.current_byte_counter=this.byte_counter;
			//console.log(this.current_byte_counter);
			this.byte_counter=0;
			var self=this;
			this.snap(function(sn)
				{
					self.realTimeEncoder.postMessage({cmd:'keyFrameEncode',rgba:sn.rgba,base64:sn.base64});
					self.fcounter=self.dframes*2;
				},{format:'image/jpeg', quality:0.5});	
			
		}
		else
		{
			if(this.fcounter%2==0)
			{
				var self=this;
				this.snap(function(sn)
				{
					self.realTimeEncoder.postMessage({cmd:'frameEncode',rgba:sn.rgba});
					self.fcounter-=1;
				});
			}
		}
	}
	this.ccounter+=1;
};

/**
 * A callback method that is called when the encoder encodes a new frame. It is initially empty.
 * @param encoder The JPEFStreamEncoder object that called this callback method.
 * @param buffer An ArrayBuffer with the encoded data.
 */
JPEGStreamEncoder.prototype.onVideoFrame=function(encoder,buffer){};

/**
 * This class implements a JPEG video stream decoder. The decoded video stream consists of frames encoded using the JPEGStreamEncoder. This class creates a JavaScript Worker, which performs the stream processing in a parallel thread.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var decoder=new JPEGStreamDecoder(media_stream,{width:240,height:180});<br>
 * decoder.onVideoFrame=function(decoder,buffer){console.log('A new frame was decoded!')};<br></font>
 * @param media_system The MediaSystem object.
 * @param config An optional object with the configuration of the decoder. The configuration object may contain one or more of the following parameters: width (default=240), height (default=180).
 */
function JPEGStreamDecoder(media_system, config)
{
	var cfg=config||{};
	this.width=cfg.width||240;
	this.height=cfg.height||180;
	this.byte_counter=0;
	this.current_byte_counter=0;

	this.canvas = document.createElement('canvas');
	this.ctx = this.canvas.getContext('2d');
	this.canvas.height=this.height;
	this.canvas.width=this.width;
		
	this.show_canvas = document.createElement('canvas');
	this.show_ctx = this.show_canvas.getContext('2d');
	this.show_canvas.height=this.height;
	this.show_canvas.width=this.width;
	this.show_canvas.style.width='100%';
			
	
	if('file:' == document.location.protocol)this.realTimeDecoder={postMessage:function(){}};
	else this.realTimeDecoder=new Worker(((document.location.hostname==vn.hostname) ? '/js/' : 'vn/')+'jpegstream.worker.js');
	this.realTimeDecoder.postMessage({cmd: 'init', config: cfg});
	
	var self=this;
	this.realTimeDecoder.onmessage = function (e) {
    switch (e.data.cmd) {
	   case 'inputFrame':
	    	var img=new Image(self.width,self.height);
			img.onload=function()
			{
				self.ctx.drawImage(img, 0, 0, self.width, self.height);
				self.realTimeDecoder.postMessage({cmd:'frameDecode',rgba:self.ctx.getImageData(0, 0, self.width, self.height).data}); 
			};
			img.src=e.data.base64;
	   break;
	   case 'inputKeyFrame':
	    	self.current_byte_counter=self.byte_counter;
			self.byte_counter=0;
			var img=new Image(self.width,self.height);
			img.onload=function()
			{
				self.show_ctx.drawImage(img, 0, 0, self.width, self.height);
				var d=self.show_ctx.getImageData(0, 0, self.width, self.height).data;
				self.realTimeDecoder.postMessage({cmd:'keyFrameDecode',rgba:d}); 
				self.onVideoFrame(self,d);
			};
			img.src=e.data.base64;
	   break;
	   case 'frame_decoded':
	  		self.show_ctx.putImageData(new ImageData(e.data.buf,self.width,self.height), 0, 0);
			self.onVideoFrame(self,e.data.buf);
		break;
		}
	};
}

/**
 * This method sets an image as the initial content of the decoding canvas. 
 * @param url A string with the url of the image.
 */
JPEGStreamDecoder.prototype.setInitialImage=function(url)
{
	var self=this;
	var img=new Image(self.width,self.height);
	img.onload=function()
	{
		self.show_ctx.drawImage(img, 0, 0, self.width, self.height);
		self.onVideoFrame(self,null);
	};
	img.crossOrigin = '';
	img.src=url;
};

/**
 * A callback method that is called when the decoder decodes a new frame. It is initially empty.
 * @param decoder The JPEFStreamDecoder object that called this callback method.
 * @param data_buffer An ImageData object with the decoded frame.
 */
JPEGStreamDecoder.prototype.onVideoFrame=function(decoder,data_buffer){};

JPEGStreamDecoder.prototype.getBytes=function(){return this.current_byte_counter;};

/**
 * This method adds a new encoded frame to the decoder. The encoded frame should have been encoded using the JPEFStreamEncoder.
 * @param data An ArrayBuffer with the frame to be decoded.
 */
JPEGStreamDecoder.prototype.addFrame=function(data)
{
	this.byte_counter+=(data.length||data.byteLength);
	this.realTimeDecoder.postMessage({cmd:'inputFrame',buf:data});
};

/**
 * This method returns the decoded stream as an HTML canvas element. The element can be dynamically placed anywhere in your website's DOM to view the decoded stream.
 * @return Canvas An HTML canvas object of the decoded stream. 
 */
JPEGStreamDecoder.prototype.getElement=function(){return this.show_canvas;};

/**
 * This class implements an MP3 audio stream encoder that can be used to encode your microphone audio data. This class creates a JavaScript Worker, which performs the stream processing in a parallel thread. This method uses the external library: lame.js<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var encoder=new MP3StreamEncoder(media_stream);<br>
 * encoder.onAudioFrame=function(buffer){console.log('A new frame was encoded!')};<br></font>
 * @param media_system The MediaSystem object that contains your audio system information.
 */
function MP3StreamEncoder(media_system)
{
	this._f=0;
	if('file:' == document.location.protocol)this.realTimeWorker={postMessage:function(){}};
	else this.realTimeWorker = new Worker(((document.location.hostname==vn.hostname) ? '/js/' : 'vn/')+'lame.worker.js');
	if(media_system.sampleRate()==48000)
		this.realTimeWorker.postMessage({cmd: 'init', config: {bitRate: 36, sampleRate:48000}});
	else if(media_system.sampleRate()==44100)
		this.realTimeWorker.postMessage({cmd: 'init', config: {bitRate: 32, sampleRate:44100}});
	else this.realTimeWorker.postMessage({cmd: 'init', config: {bitRate: 32, sampleRate:media_system.sampleRate()}});
	
	var self=this;
	this.realTimeWorker.onmessage = function (e) {
    switch (e.data.cmd) {
      case 'flush':
		self.onAudioFrame(e.data.buf);
		break;
		}
	};
}

/**
 * A callback method that is called when the encoder encodes a new frame. It is initially empty.
 * @param buffer An ArrayBuffer object with the encoded frame.
 */
MP3StreamEncoder.prototype.onAudioFrame=function(buffer){};

/**
 * This method adds a new audio frame to the encoder. 
 * @param event An AudioProcessingEvent object with the data of the new audio frame to be encoded.
 */
MP3StreamEncoder.prototype.addFrame=function(event)
{
	var audioData = event.inputBuffer.getChannelData(0);
	this.realTimeWorker.postMessage({cmd: 'encode', buf: audioData});
		this._f+=1;
		if(this._f==6)//6x2048samples 
		{
			this._f=0;
			this.realTimeWorker.postMessage({cmd: 'flush'});
		}	
};

MP3StreamEncoder.prototype.reset=function()
{
	this.realTimeWorker.postMessage({cmd: 'reset'});
	this._f=0;
};

/**
 * This class implements an audio stream decoder, which receives encoded audio frames and plays them in your speakers after properly decoding them. The decoded audio stream consists of frames encoded using any audio encoder including the MP3StreamEncoder.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var decoder=new AudioStreamDecoder(media_stream);<br>
 * decoder.setSampleRate(44100);<br>
 * decoder.addFrame(frame);<br></font>
 * @param media_system The MediaSystem object.
 */
function AudioStreamDecoder(media_system)
{
	this.next_time=0;
	this._ms=media_system;
	this._ac=this._ms.getAudioContext();
	this.setSampleRate(media_system.sampleRate());
}

/**
 * This method sets the sample rate of the incoming encoded audio stream. This may correspond to the sample rate of a remote computer that encoded this audio stream and then transmitted it through the network. If the incoming sample rate is different than the sample rate of the audio system of this computer, the audio stream will be played with the proper speed so that the audio sounds undistorted.
 * @param sample_rate The sample rate of the incoming encoded audio stream.
 */
AudioStreamDecoder.prototype.setSampleRate=function(sample_rate){
	this._remote_sampleRate=sample_rate;
	this.playbackRate=this._remote_sampleRate/48000;
	this.duration=0.256/this.playbackRate;
	};

/**
 * This method adds a new encoded frame to the decoder. The encoded frame may have been encoded using the MP3StreamEncoder.
 * @param data An ArrayBuffer with the frame to be decoded.
 */
AudioStreamDecoder.prototype.addFrame=function(data)
{	
	var self=this;
	this._ms.getAudioContext().decodeAudioData(data, function(buffer) {
	  var source = self._ac.createBufferSource();
  source.buffer = buffer;                    
  source.connect(self._ac.destination); 
	var now=self._ac.currentTime;
	var time_scale=1;
	//console.log(self.next_time-now);
	//The following lines implement 0.3sec buffer and allow +-0.3sec for the next frame to arrive, i.e. [0-0.6]sec interval.
	if(self.next_time<now+0.0){self.next_time=now;time_scale=(self.duration+0.3)/self.duration;}//plus 0.3sec buffering time
	else if(self.next_time>now+0.4){time_scale=0.95;/*(self.duration+now+0.3-self.next_time)/self.duration;console.log('AudioStreamDecoder Warning '+(self.next_time-now));*/}
	source.playbackRate.value=self.playbackRate/time_scale; 
	source.start(self.next_time);
	self.next_time+=self.duration*time_scale;
    }, function(e){console.log('error');});
};

/**
 * This class implements a VideoLecture session using the networking capabilities of the VNSession class, the media handling capabilities of the MediaSystem class, and the compression capabilities of JPEG and MP3 stream encoders and decoders. In a VideoLecture there is only one speaker at a time, who can pass the microphone to other speakers. There is an optional control window to view the lecture participants and their video streams, select the next speaker, request for you to be the next speaker, send text messages, etc. There are also many callback methods that you may set to be notified when a user action is performed and when video frames have been received.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var video_lecture=new VideoLecture(my_session,{canPickMic:VideoLecture.ALWAYS,canGiveMic:VideoLecture.ALWAYS,streamLast:0});<br>
 * video_lecture.createControlWindow(window_manager,{left:0,top:30}).onUserClicked=function(u){<br>
 * video_lecture.passMicrophone(u);<br>
 * }<br></font>
 * @param session A VNSession in which the VideoLecture will be implemented.
 * @param options An optional object with the configuration of the VideoLecture. The configuration object may contain one or more of the following parameters: canPickMic (which can take the values VideoLecture.NEVER, VideoLecture.AFTER_REQUEST_ONLY, VideoLecture.WHEN_AVAILABLE, VideoLecture.ALWAYS, default=VideoLecture.WHEN_AVAILABLE), canGiveMic (which can take the values VideoLecture.NEVER, VideoLecture.WHEN_SPEAKER_ONLY, VideoLecture.ALWAYS, default=VideoLecture.WHEN_SPEAKER_ONLY), streamLast (which indicates how many video streams of the past speakers will be broadcasted, default=0), backgroundImage (a url of an image to be set as the initial frame of the video streams before they receive actual frames, default is the VN logo).
 */
function VideoLecture(session,options)
{
	var self=this;
	this._options=options||{};
	/*window.addEventListener('focus',function(){if(self._ms.getMicrophone().isEnabled())self._me.variable('_mic').set('1');});
	window.addEventListener('blur',function(){
		//if(self._s.variable('_speaker').value()==self._me.id())
		//	self._s.variable('_speaker').set('0');
		self._me.variable('_mic').set('0');
	});*/
	
	if(typeof this._options.streamLast==='undefined')this._options.streamLast=0;
	if(typeof this._options.canPickMic==='undefined')this._options.canPickMic=VideoLecture.WHEN_AVAILABLE;
	if(typeof this._options.canGiveMic==='undefined')this._options.canGiveMic=VideoLecture.WHEN_SPEAKER_ONLY;
	
	this._next_stream_slot=0;
	this._was_speaker=10000000;
	
	this._me=session.client.me();
	
	this._controls=new VNVideoLectureViewer(this);
	
	if(this._me._isAdmin)session.variable('clock').set(''+new Date().getTime());
	this._me.variable('_mic').set('0');
	this._me.variable('_cam').set('0');
	
	if(this._options.media_system)this._ms=this._options.media_system;
	else
	{
		this._ms=new MediaSystem({audio:true,video:true});
		this._ms.getMicrophone().onTurnOn=function(){self._me.variable('_mic').set('1');};
		this._ms.getWebCam().onTurnOn=function(){self._onWebCamOn();};
	}
	
	if(this._ms.getMicrophone().isEnabled())this._me.variable('_mic').set('1');
	if(this._ms.getWebCam().isEnabled()){this._onWebCamOn();}
	this._me.variable('_mic').whenUsersValueChanged().then(function(e)
	{
		if(e.variable.value()=='1')e.user._vl_avatar.setHasMicrophone(true);
		else e.user._vl_avatar.setHasMicrophone(false);
	});
	this._me.variable('_cam').whenUsersValueChanged().then(function(e)
	{
		if(e.variable.value()=='1')e.user._vl_avatar.setHasWebCam(true);
		else e.user._vl_avatar.setHasWebCam(false);
	});
	
	this.audio_decoder=new AudioStreamDecoder(this._ms);
	this._as=session.stream(100);
	this._vs=new Array(this._options.streamLast+1);
	for(var i=0;i<this._options.streamLast+1;i++)this._vs[i]=this._me.stream(101+i);
	this._s=session;
	this._controls.addUser(this._me);
	var i='//'+vn.hostname+'/js/img/session/thmb'+(Math.floor(Math.random()*5) + 1)+'.jpg';
	this._me.variable('_thmb').v=i;
	this._me.variable('_thmb').set(i);
	this._me._vl_avatar.setThumbImage(i);
	
	this.num_of_users=0;
	this.my_order=0;
	
	this._s.whenUserJoins().then(function(u)
	{
		self.num_of_users+=1;
		if(parseInt(u.id())<parseInt(self._me.id())) self.my_order+=1;
		self._controls.addUser(u);
	});
	
	this._s.whenUserLeaves().then(function(u)
	{
		if(self._controls.speaker_avatar && self._controls.speaker_avatar.user==u) self._s.variable('_speaker').set('0');
		self.num_of_users-=1;
		if(parseInt(u.id())<parseInt(self._me.id())) self.my_order-=1;
		self._controls.removeUser(u);
	});
	
	
	this._am_speaker=false;
	this._my_stream=null;
	
	this.video_encoder=new JPEGStreamEncoder(this._ms);
	this.video_encoder.setInitialImage(this._me.variable('_thmb').value());
	self._controls.setSpeakerVideo(self.video_encoder.getElement());
	
	this.video_decoder=new Array(this._options.streamLast+1);
	for(var i=0;i<this._options.streamLast+1;i++)
	{	
		this.video_decoder[i]=new JPEGStreamDecoder(this._ms);
		this.video_decoder[i].id=i;
		this.video_decoder[i].onVideoFrame=function(d){self.onVideoFrame(d.id,d.getElement());};
		if(this._options.backgroundImage)
			this.video_decoder[i].setInitialImage(this._options.backgroundImage);
		else this.video_decoder[i].setInitialImage(vn.hosturl+'js/img/session/blank.jpg');
	}
	
	this.session_initialized=false;
	this._s.whenUserListAvailable().then(function(users)
	{
		self.session_initialized=true;
		self._s.variable('_speaker').whenValueChanged().then(function(e){self._s.variable('_speaker')});
		self.my_order=0;
		for(var id in self._s.getUsers())
		{
			if(parseInt(id)<parseInt(self._me.id())) self.my_order+=1;
		}
		self.onInitialUsersInSessionAvailable(users);
	});
	
	this._s.variable('_next_stream_slot').whenValueChanged().then(function(e){self._next_stream_slot=e.variable.num();});
	this._s.variable('_sr').whenValueChanged().then(function(e){self.audio_decoder.setSampleRate(e.variable.num());});
	this._s.variable('_speaker').whenValueChanged().then(function(e)
	{
		var v=e.variable;
		var u=e.user;
		if(!self.session_initialized)return;
		if(v.value()==self._me.id())
		{
			self._s.variable('_sr').set(self._ms.sampleRate());
			self._am_speaker=true;
			self.video_encoder.addFrames(true);
			self.audio_encoder.reset();
			self._controls.setStatus(2);
			self.onStartStreaming();
			self._controls.setSpeakerVideo(self.video_encoder.getElement());
			self._controls.setSpeaker(self._me,u);
			if(self._me.variable('_reqmic').value()=='1')self._me.variable('_reqmic').set('0');
		}
		else
		{
			if(self._am_speaker)
			{
				self._am_speaker=false;
				self._was_speaker=1;
				self._controls.setStatus(0);
				self.onStopStreaming();
				//pick a camera
				if(self._options.streamLast>0)
				{
					var i=self._s.variable('_next_stream_slot').num();
					self._my_stream=self._vs[1+(i)%(self._options.streamLast)];
					self._s.variable('_next_stream_slot').changeBy(1,function(v)
					{
						//this is the actual camera assigned to me
						self._my_stream=self._vs[1+(v.num()-1)%(self._options.streamLast)];
					});
					self.video_encoder.reset();
				}
			}
			
			if(v.value()=='0' || v.value()=='')
			{
				self._controls.setSpeakerVideo(self._controls.noise);
				self._controls.setSpeaker(null);
			}
			else 
			{
				var s=self._s.getUser(v.value());
				if(s.variable('_cam').value()=='1')
					self._controls.setSpeakerVideo(self.video_decoder[0].getElement());
				else 
				{
					var i=document.createElement('img');
					vn.set(i.style,{width:'100%'});
					i.src=s.variable('_thmb').value();
					self._controls.setSpeakerVideo(i);
				}
				self._controls.setSpeaker(s,u);
			}
		}
	});
	
	this._s.variable('_next_stream_slot').whenValueChanged().then(function(e)
	{
		if(!self._am_speaker && e.user!=self._me)
		{
			self._was_speaker+=1;
			
			if(self._was_speaker>self._options.streamLast)
			{
				self._my_stream=null;
				self.video_encoder.addFrames(false);
			}
		}
	});
	
	this._s.variable('_msg').whenValueChanged().then(function(e)
	{
		if(e.user)
		{
			self._controls.addMessage(e.user,e.variable.value());
			self.onUsersMessage(e.user,e.variable.value());
		}
	});
	
	this._me.variable('name').whenUsersValueChanged().then(function(e)
	{
		e.user._vl_avatar.setLabel(e.user.name);
		self.onUsersNameChanged(e.user,e.user.name);
	});
	
	this.thmb_hdr='data:image/jpeg;base64,'+'/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCA'+'BW'+'A'+'FY'+'DASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEA';
	
	this._me.variable('_thmb').whenUsersValueChanged().then(function(e)
	{
		var v=e.variable;
		var u=e.user;
		
		if(!v.v.startsWith('//'))v.v=self.thmb_hdr+v.v;
				
		if(u!=self._me)
		{
			if(u._vl_avatar)
			{
				u._vl_avatar.setThumbImage(v.v);
			}
		}
	});
	
	this._me.variable('_reqmic').whenUsersValueChanged().then(function(e)
	{
		var u=e.user;
		var v=e.variable;
		if(u==self._me)
		{
			if(v.value()=='1')
			{
				self._controls.setStatus(1);
				self.onUsersMicRequested(u,true);
			}
			else
			{
				if(self._s.variable('_speaker').value()!=self._me.id()) self._controls.setStatus(0);
				self.onUsersMicRequested(u,false);
			}
		}
		if(u._vl_avatar)
		{
			if(v.value()=='1')
			{
				self._controls.addToReqMicList(u);
				self.onUsersMicRequested(u,true);
			}
			else 
			{
				self._controls.removeFromReqMicList(u);
				self.onUsersMicRequested(u,false);
			}
		}
	});
	
	this._as.whenFrameReceived().then(function(e)
		{
			if(self._am_speaker)return;
			e.stream.losslessReception(true);
			self.audio_decoder.addFrame(e.stream.frame());	
		});
		
	this.audio_encoder=new MP3StreamEncoder(this._ms);
	this.audio_encoder.onAudioFrame=function(buffer)
	{
		self._as.addFrame(buffer);
    };
  
	this._ms.getMicrophone().onAudioFrame=function(event) {	
	
		if(self._am_speaker)self.audio_encoder.addFrame(event);
	};
		
	this.video_encoder.onVideoFrame=function(enc,buf)
	{
		//stream to the proper camera
		if(self._am_speaker)
		{
			self._vs[0].addFrame(buf);
			self.onVideoFrame(0,self.video_encoder.getElement());
		}
		else if(self._my_stream)
		{
			self._my_stream.addFrame(buf);
			self.onVideoFrame(self._my_stream.id()-101,self.video_encoder.getElement());
		}
	};
		
	for(var i=0;i<this._options.streamLast+1;i++)
		this._vs[i].whenUsersFrameReceived().then(function(e)
		{
			e.stream.losslessReception(true);
			if(e.stream.id()==101)
			{
				if(e.user.id()==self._s.variable('_speaker').value())
					self.video_decoder[0].addFrame(e.stream.frame());
			}
			else self.video_decoder[e.stream.id()-101].addFrame(e.stream.frame());
		});
}

VideoLecture.NEVER=0;
VideoLecture.AFTER_REQUEST_ONLY=1;
VideoLecture.WHEN_AVAILABLE=2;
VideoLecture.WHEN_SPEAKER_ONLY=2;
VideoLecture.ALWAYS=3;	

/**
 * A callback method that is called when a user joins this session. It is initially empty.
 * @param u The VNUser object that corresponds to the new user who joined the session.
 */
VideoLecture.prototype.onUserJoinedSession=function(u){};
/**
 * A callback method that is called when a user leaves from this session. It is initially empty.
 * @param u The VNUser object that corresponds to the user who left the session.
 */
VideoLecture.prototype.onUserLeftSession=function(u){};
/**
 * A callback method that is called when a user updates her icon. It is initially empty.
 * @param u The VNUser object that corresponds to the user who updated the icon.
 * @param icon An HTML Image element with the new icon.
 */
VideoLecture.prototype.onUsersIconChanged=function(u,icon){};
/**
 * A callback method that is called when a user updates her name. It is initially empty.
 * @param u The VNUser object that corresponds to the user who updated the name.
 * @param name A string with the new name.
 */
VideoLecture.prototype.onUsersNameChanged=function(u,name){};
/**
 * A callback method that is called when a user sends a message. It is initially empty.
 * @param u The VNUser object that corresponds to the user who sent the message.
 * @param message A string with the message.
 */
VideoLecture.prototype.onUsersMessage=function(u,message){};
/**
 * A callback method that is called when a user requests the microphone or cancels a previous request. It is initially empty.
 * @param u The VNUser object that corresponds to the user who requested the microphone or canceled the request.
 * @param val A boolean flag with the updated status of the microphone request.
 */
VideoLecture.prototype.onUsersMicRequested=function(u,val){};
/**
 * A callback method that is called when a new speaker picks the microphone. It is initially empty.
 * @param u The VNUser object that corresponds to the user who became the speaker. It is null if currently there is no speaker.
 * @param init The VNUser object that correspondsto the user who initiated this change of speaker.
 */
VideoLecture.prototype.onSpeakerChanged=function(u,init){};
/**
 * A callback method that is called when a new video frame is received. It is initially empty.
 * @param id The id of the video stream whose frame was received. It is zero for the video of the current speaker, 1 for the previous speaker, 2 for the speaker before etc.
 * @param e An HTML canvas element with the new frame.
 */
VideoLecture.prototype.onVideoFrame=function(id,e){};
/**
 * A callback method that is called when the inital list of existing users in this session is received. It is initially empty.
 * @param users An associative array of VNUser objects that corresponds to the users in the session.
 */
VideoLecture.prototype.onInitialUsersInSessionAvailable=function(users){};

/**
 * This method returns the order of this user in the session, if ordered with the time joined this session. The order changes when users leave the session.
 * @return number The order of this user, with 0 being the first user.
 */
VideoLecture.prototype.getMyOrder=function(){return this.my_order;};

VideoLecture.prototype._onWebCamOn=function()
{
	this._me.variable('_cam').set('1');
	this.thmb_canvas = document.createElement('canvas');
	this.thmb_ctx = this.thmb_canvas.getContext('2d');
	this.thmb_canvas.height=86;
	this.thmb_canvas.width=86;
	this.thmb_video=this._ms.getWebCam().getElement();
	this.updateThumb();
};
/**
 * This method returns the MediaSystem object that accesses the microhone and webcam of this client.
 * @return MediaSystem The MediaSystem object.
 */
VideoLecture.prototype.getMediaSystem=function(){return this._ms;};

VideoLecture.prototype.updateThumb=function()
{
	var d=this.snapThumb().slice(851);
	this._me.variable('_thmb').set(d);
	this._me._vl_avatar.setThumbImage(this.thmb_hdr+d);
	var clock=parseInt(this._s.variable('clock').value());
	var now=new Date().getTime();
	var t=400;
	if(this.num_of_users<5)t=2000/this.num_of_users;
	var next_time=t*this.num_of_users-((now-clock-t*this.my_order)%(this.num_of_users*t));
	var self=this;
	window.setTimeout(function(){self.updateThumb();},next_time);
};

VideoLecture.prototype.snapThumb=function()
{
	if(this.thmb_video)
	{
		this.thmb_ctx.drawImage(this.thmb_video, -14, 0, 114, 86);
		return this.thmb_canvas.toDataURL('image/jpeg', 0.5);
	}else return '';
};
/**
 * This method sets a new name for this user.
 * @param name A string with the new name.
 */
VideoLecture.prototype.setName=function(name)
{
	this._me.name=name;
	this._me.variable('name').broadcast();
};
/**
 * With this method we pass the microphone to a particular user. This request may be fulfilled if we have the proper rights to do so according to the initial configuration of the VideoLecture object.
 * @param user The VNUser to whom we pass the microphone.
 */
VideoLecture.prototype.passMicrophone=function(user)
{
	if(user==this._me)
		this.requestMicrophone();
	else if(this._options.canGiveMic==VideoLecture.ALWAYS || (this._options.canGiveMic==VideoLecture.WHEN_SPEAKER_ONLY && this._s.variable('_speaker').value()==this._me.id()))
		if(user.variable('_mic').value()=='1' && this._s.variable('_speaker').value()!=user.id()) 
			this._s.variable('_speaker').set(user.id());
};
/**
 * With this method we request the microphone, or cancel a previous request. This request may be fulfilled if we have the proper rights to do so according to the initial configuration of the VideoLecture object.
 * @param flag A boolean flag with the new status of our request.
 */
VideoLecture.prototype.requestMicrophone=function(flag)
{	
	if(this._s.variable('_speaker').value()==this._me.id())return;

	if(this._options.canPickMic==VideoLecture.ALWAYS || (this._options.canPickMic==VideoLecture.WHEN_AVAILABLE && (this._s.variable('_speaker').value()=='0'||this._s.variable('_speaker').value()=='')))
	{
		if(this._me.variable('_reqmic').value()=='1')
		{
			this._me.variable('_reqmic').set('0');
			this._controls.setStatus(3);
		}
		else this.startStreaming();
	}
	else if((this._options.canPickMic==VideoLecture.AFTER_REQUEST_ONLY||this._options.canPickMic==VideoLecture.WHEN_AVAILABLE) && this._ms.getMicrophone().isEnabled())
	{
		var f=true;
		if(typeof flag!=='undefined')f=flag;
		else if(this._me.variable('_reqmic').value()=='1')f=false;
	
		if(f)this._me.variable('_reqmic').set('1');
		else this._me.variable('_reqmic').set('0');
		this._controls.setStatus(3);
	}
};
/**
 * With this method we post a message to this session.
 * @param message A string with the message to be posted.
 */
VideoLecture.prototype.sendMessage=function(message)
{
	this._s.variable('_msg').set(message);
};
/**
 * This class implements a simple user interface to control a VideoLecture session. An object of this class is automatically created when you create a new VideoLecture object. You can open the viewer as a window using the video_lecture.createControlWindow method.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var video_lecture=new VideoLecture(my_session,{canPickMic:VideoLecture.ALWAYS,canGiveMic:VideoLecture.ALWAYS,streamLast:1});<br>
 * video_lecture.createControlWindow(window_manager,{left:0,top:30}).onUserClicked=function(u){<br>
 * video_lecture.passMicrophone(u);<br>
 * }<br></font>
 * @param video_lecture A VideoLecture object.
 */
function VNVideoLectureViewer(video_lecture)
{
	var self=this;
	this.noise=document.createElement('img');
	vn.set(this.noise.style,{width:'100%',backgroundColor:'rgb(0,0,0)'});
	this.noise.src=vn.hosturl+'js/img/VNlogo256_4x3.gif';
	
	this.selected_avatar=null;
	this.speaker_avatar=null;
	this.last_req_mic_avatar_cont=null;
	this._vl=video_lecture;
	this.content_div=document.createElement('div');
	vn.set(this.content_div.style,{width:'100%',height:'100%',display:'flex',flexDirection:'column'});
	
	this.top_div=document.createElement('div');
	vn.set(this.top_div.style,{position:'relative',float:'left'});
	this.content_div.appendChild(this.top_div);
	
	this.speaker_div=document.createElement('div');
	vn.set(this.speaker_div.style,{width:'100%',position:'relative'/*backgroundColor:'rgba(0,0,0)'*/});
	this.top_div.appendChild(this.speaker_div);
	
	var b=document.createElement('img');
	vn.set(b.style,{width:'50px',height:'50px'/*,b.style.backgroundSize='cover'*/});
	this.button=b;
	var l=document.createElement('div');
	vn.set(l.style,{top:'0px',left:'50px',right:'0px',height:'50px',position:'absolute',textAlign:'center',lineHeight:'16px',verticalAlign:'middle',fontFamily:'Arial',color:'rgb(255,255,255)',textShadow:'-1px -1px 0px #5b6178,1px -1px 0px #5b6178,-1px 1px 0px #5b6178,1px 1px 0px #5b6178',/*fontWeight:'bold',*/fontSize:'14px',margin:'10px 10px 10px 10px',textDecoration:'none',touchAction:'none',overflow:'hidden'});
	this.label=l;
	var c=document.createElement('div');
	vn.set(c.style,{top:'0px',left:'0px',right:'0px',height:'50px',position:'absolute'});
	c.appendChild(b);
	c.appendChild(l);
	this.container=c;
	this.top_div.appendChild(c);
	
	l=document.createElement('div');
	vn.set(l.style,{height:'30px',width:'100%',bottom:'0px',left:'0px',position:'absolute',color:'rgb(255,255,255)',backgroundColor:'rgba(0,0,0,0.1)',textAlign:'left',lineHeight:'26px',fontFamily:'Arial',color:'rgb(255,255,255)',textShadow:'-1px -1px 0px #5b6178',padding:'0px 0px 0px 5px',/*fontWeight:'bold',*/fontSize:'24px',textDecoration:'none',touchAction:'none',overflow:'hidden'});
	l.innerHTML='';
	this.caption_div=l;
	this.top_div.appendChild(l);
	
	this.button_div=document.createElement('div');
	vn.set(this.button_div.style,{position:'relative',height:'18px',width:'100%'});
	this.content_div.appendChild(this.button_div);
	
	this.button_users=document.createElement('div');
	vn.set(this.button_users.style,{position:'relative',height:'100%',width:'50%',backgroundColor:'rgba(100,100,100,0.5)',float:'left',cursor:'pointer',borderRadius:'5px 5px 0px 0px',backgroundImage:'url("'+vn.hosturl+'js/img/session/users.png")',backgroundSize:'contain',backgroundRepeat:'no-repeat',backgroundPosition:'center'});
	this.button_div.appendChild(this.button_users);
	this.button_users.onclick=function(){
		self.main_div.removeChild(self.main_div.childNodes[0]);
		self.main_div.appendChild(self.users_div);
		self.button_users.style.backgroundColor='rgba(100,100,100,0.5)';
		self.button_text.style.backgroundColor='rgba(0,0,0,0)';
	};
	
	this.button_text=document.createElement('div');
	vn.set(this.button_text.style,{position:'relative',height:'100%',width:'50%',backgroundColor:'rgba(0,0,0,0)',float:'left',cursor:'pointer',borderRadius:'5px 5px 0px 0px',backgroundImage:'url("'+vn.hosturl+'js/img/session/messages.png")',backgroundSize:'contain',backgroundRepeat:'no-repeat',backgroundPosition:'center'});
	this.button_div.appendChild(this.button_text);
	this.button_text.onclick=function(){
		self.main_div.removeChild(self.main_div.childNodes[0]);
		self.main_div.appendChild(self.messages_div);
		self.button_text.style.backgroundColor='rgba(100,100,100,0.5)';
		self.button_users.style.backgroundColor='rgba(0,0,0,0)';
		self.input_box.update();
	};
	
	this.main_div=document.createElement('div');
	vn.set(this.main_div.style,{width:'100%',flex:'1',position:'relative',overflowY:'scroll',overflowX:'hidden'});
	this.content_div.appendChild(this.main_div);
	
	this.users_div=document.createElement('div');
	vn.set(this.users_div.style,{width:'100%',position:'relative'});
	this.main_div.appendChild(this.users_div);
	
	this.messages_div=document.createElement('div');
	vn.set(this.messages_div.style,{width:'100%',position:'relative'});
	
	this.input_box=new VNVideoLectureMessage(this,this._vl._me,"",true);
	
	this.bottom_div=document.createElement('div');
	vn.set(this.bottom_div.style,{position:'relative',height:'18px',width:'100%',textAlign:'left',lineHeight:'16px',verticalAlign:'middle',fontFamily:'Arial',color:'rgb(255,255,255)',textShadow:'-1px -1px 0px #5b6178',fontSize:'14px',margin:'0px 0px 0px 5px',textDecoration:'none',touchAction:'none',overflow:'hidden'});
	this.bottom_div.innerHTML='Session started.';
	this.content_div.appendChild(this.bottom_div);
	
	this.setStatus(0);
}

VNVideoLectureViewer.prototype.addMessage=function(user,message)
{
	if(user) new VNVideoLectureMessage(this,user,message);
};

VNVideoLectureViewer.prototype.moveAvatarContainerAfter=function(u,a)
{	
	if(u==a)return;
	this.users_div.insertBefore(u, a.nextSibling);
};

VNVideoLectureViewer.prototype.addToReqMicList=function(u)
{
	u._vl_avatar.has_requested_mic=true;
	if(u!=this._vl._me)
	{
		if(this.last_req_mic_avatar_cont==null)this.moveAvatarContainerAfter(u._vl_avatar.div_container,this._vl._me._vl_avatar.div_container);
		else this.moveAvatarContainerAfter(u._vl_avatar.div_container,this.last_req_mic_avatar_cont);
		this.last_req_mic_avatar_cont=u._vl_avatar.div_container;
	}
	u._vl_avatar.setRequestedMicrophone(true);
};

VNVideoLectureViewer.prototype.removeFromReqMicList=function(u)
{
	if(u._vl_avatar.has_requested_mic==false)return;
	u._vl_avatar.has_requested_mic=false;
	if(u!=this._vl._me)
	{
		if(this.last_req_mic_avatar_cont==u._vl_avatar.div_container)
		{
			if(this.last_req_mic_avatar_cont.previousSibling==this._vl._me._vl_avatar.div_container)
				this.last_req_mic_avatar_cont=null;
			else this.last_req_mic_avatar_cont=this.last_req_mic_avatar_cont.previousSibling;
				
		}
		else this.moveAvatarContainerAfter(u._vl_avatar.div_container,this.last_req_mic_avatar_cont);
	}
	if(this._vl._s.variable('_speaker').value()!=u.id()) u._vl_avatar.setRequestedMicrophone(false);
};

VNVideoLectureViewer.prototype.setStatusText=function(s){this.bottom_div.innerHTML=s;};

VNVideoLectureViewer.prototype.setSpeaker=function(user,init)
{
	//if(user==null){this.noise_counter=(this.noise_counter||1)+1;if(this.noise_counter>2)this.noise.src=vn.hosturl+'js/img/session/noise.gif';}
	
	if(this.speaker_avatar) {this.speaker_avatar.setSpeaker(false); this.speaker_avatar=null;this.caption_div.innerHTML='';this.setStatusText('Currently, there is no speaker in this session.');}
	if(user && user._vl_avatar)
	{
		if(user.variable('_reqmic').value()!='1')
		{
			if(user!=this._vl._me)
			{
				if(this.last_req_mic_avatar_cont==null)this.moveAvatarContainerAfter(user._vl_avatar.div_container,this._vl._me._vl_avatar.div_container);
				else this.moveAvatarContainerAfter(user._vl_avatar.div_container,this.last_req_mic_avatar_cont);
			}
		}
		user._vl_avatar.setSpeaker(true);
		this.speaker_avatar=user._vl_avatar;
		var username='';
		var initname='';
		if(user.name) username=user.name; else username='User '+user.id();
		if(init && init.name) initname=init.name; else if(init) initname='User '+init.id();
			
		if(user.name)this.caption_div.innerHTML=username;
		if(init && init!=user)this.setStatusText(initname+' passed the mic to '+username+'.');
		else this.setStatusText(username+' is now the speaker.');
	}
	this._vl.onSpeakerChanged(user,init);
};

/**
 * A callback method that is called when you select a user by clicking on a different user's icon. This method is not called when you click on the currently selected user. This method is initially empty.
 */
VNVideoLectureViewer.prototype.onUserSelected=function(user){};
/**
 * A callback method that is called when you click on a user's icon. This method is initially empty.
 */
VNVideoLectureViewer.prototype.onUserClicked=function(user){};

function VNVideoLectureMessage(viewer,user,message,editor)
{
	this.viewer=viewer;
	this.user=user;
	var self=this;
	
	this.div_container=document.createElement('div');
	vn.set(this.div_container.style,{width:'100%',float:'left',backgroundColor:'rgb(255,255,255)',borderRadius:'0px',borderBottom:'1px solid #e1e8ed',position:'relative'});
	
	this.div_container.onmouseover=function(){self.div_container.style.backgroundColor='#f5f8fa';};
	this.div_container.onmouseout=function(){self.div_container.style.backgroundColor='#ffffff';};
	
	if(editor)
	{
		this.div_container.style.cursor='text';
		this.div_container.onclick=function(){self.text_input.focus();};
	}
	
	this.inner_div=document.createElement('div');
	vn.set(this.inner_div.style,{width:'100%',display:'flex',flexDirection:'row'});
	this.div_container.appendChild(this.inner_div);
	
	this.thumb_container=document.createElement('div');
	vn.set(this.thumb_container.style,{width:'40px',position:'relative',margin:'5px 5px 5px 10px'});
	this.inner_div.appendChild(this.thumb_container);
	
	
		var i=document.createElement('img');
		vn.set(i.style,{width:'40px',height:'40px',backgroundColor:'rgb(0,0,0)',borderRadius:'5px'});
		i.crossOrigin = '';
		this.thumb=i;
		if(editor)this.thumb.onclick=function(){self.updateThumb()};
		this.thumb_container.appendChild(i);
	
	this.updateThumb();
	
	this.text_container=document.createElement('div');
	vn.set(this.text_container.style,{flex:1,position:'relative',margin:'5px 10px 5px 5px',fontFamily:'"Segoe UI Light","Segoe UI","Segoe WP Light","Segoe WP","Segoe UI Latin Light",HelveticaNeue,Helvetica,Tahoma,ArialUnicodeMS,sans-serif',fontSize:'14px',color:'#000000',textAlign:'justify'});
	this.inner_div.appendChild(this.text_container);
	
	var username='';
	if(user){if(user.name) username=user.name; else username='User '+user.id();}
		
	if(editor)
	{
		var d=document.createElement('div');
		this.name=d;
		this.updateName();
		this.text_container.appendChild(d);
		
		var text_input=document.createElement('input');
	text_input.style.float='left';
	text_input.style.height='18px';
	text_input.style.width='100%';
	text_input.style.padding='0px';
	text_input.style.border='0px'; 
	text_input.style.fontFamily='"Segoe UI Light","Segoe UI","Segoe WP Light","Segoe WP","Segoe UI Latin Light",HelveticaNeue,Helvetica,Tahoma,ArialUnicodeMS,sans-serif';
	text_input.style.fontSize='14px';
	text_input.style.color='rgb(0,0,0)';
	text_input.style.backgroundColor='rgba(0,0,0,0)';
	text_input.style.outline='none';
	text_input.style.webkitAppearance='none';
	//text_input.setAttribute( "autocomplete", "off" );
	//text_input.setAttribute( "autocorrect", "off" );
	//text_input.setAttribute( "autocapitalize", "off" );
	//text_input.setAttribute( "spellcheck", "false" );
	text_input.placeholder='Say something';
	
	text_input.onkeydown=function(e){
		if (!e) e = window.event;
		var keyCode = e.keyCode || e.which;
		if (keyCode == '13'){//enter
			if(self.text_input.value.length>0)
			self.viewer._vl._s.variable('_msg').set(self.text_input.value);
			self.text_input.value='';
			return false;
		}
	};
	this.text_container.appendChild(text_input);
	this.text_input=text_input;
	this.viewer.messages_div.appendChild(this.div_container);
	}
	else 
	{
		this.text_container.innerHTML='<b>'+username+'</b> - '+new Date().toLocaleTimeString(navigator.language, {hour: '2-digit', minute:'2-digit'})+'<br>'+message;
		this.viewer.messages_div.insertBefore(this.div_container, this.viewer.messages_div.childNodes[0].nextSibling);
		this.viewer.setStatusText(username+': '+message);
	}
	
}

VNVideoLectureMessage.prototype.update=function()
{
//	this.text_input.focus();
	this.updateThumb();
	this.updateName();
};

VNVideoLectureMessage.prototype.updateThumb=function()
{
	if(this.user && this.user.variable('_thmb').value().length>0)
			this.thumb.src=this.user.variable('_thmb').value();
	else this.thumb.src='//'+vn.hostname+'/js/img/VNlogo256.png';
};

VNVideoLectureMessage.prototype.updateName=function()
{
	var username='';
	if(this.user){if(this.user.name) username=this.user.name; else username='User '+this.user.id();}
	this.name.innerHTML='<b>'+username+'</b>';
};

function VNVideoLectureAvatar(viewer,user)
{
	this.viewer=viewer;
	this.user=user;
	this.div_container=document.createElement('div');
	vn.set(this.div_container.style,{width:'86px',height:'86px',float:'left',backgroundColor:'rgb(128,128,128)',borderRadius:'20px',border:'2px solid #000000',cursor:'pointer',position:'relative',overflow:'hidden'});
	var self=this;
	this.div_container.onclick=function(){self.viewer.clickAvatar(self);};
	this.viewer.users_div.appendChild(this.div_container);
	
	this.thmb_image=document.createElement('img');
	vn.set(this.thmb_image.style,{position:'absolute',left:'0px',top:'0px',width:'86px',height:'86px'});
	this.div_container.appendChild(this.thmb_image);
	
	this.thmb_image2=document.createElement('img');
	vn.set(this.thmb_image2.style,{position:'absolute',left:'0px',top:'0px',width:'86px',height:'86px'});
	
	this.has_requested_mic=false;
	
	var l=document.createElement('div');
	vn.set(l.style,{top:'0px',left:'0px',right:'0px',bottom:'0px',position:'relative',color:'rgb(255,255,255)',/*textAlign:'center',*/lineHeight:'14px',verticalAlign:'middle',	fontFamily:'Arial',color:'rgb(255,255,255)',textShadow:'-1px -1px 0px #5b6178,1px -1px 0px #5b6178,-1px 1px 0px #5b6178,1px 1px 0px #5b6178',/*fontWeight:'bold',*/fontSize:'12px',margin:'4px 4px 4px 4px',textDecoration:'none',touchAction:'none',overflow:'hidden'});
	this.label=l;
	
	this.mic=document.createElement('div');
	vn.set(this.mic.style,{position:'absolute',width:'16px',height:'16px',top:'65px',left:'65px',backgroundImage:'url("'+vn.hosturl+'js/img/session/not_mic_icon_sm.png")',backgroundSize:'cover',display:'none'});

	this.div_container.appendChild(this.mic)
	this.div_container.appendChild(this.label);

}

VNVideoLectureAvatar.prototype.setThumbImage=function(src)
{
	var self=this;
	this.thmb_image2.onload=function()
	{
		self.div_container.insertBefore(self.thmb_image2, self.thmb_image.nextSibling);
		self.div_container.removeChild(self.thmb_image);
		var tmp=self.thmb_image2;
		self.thmb_image2=self.thmb_image;
		self.thmb_image=tmp;
		self.viewer._vl.onUsersIconChanged(self.user,self.thmb_image);
	};
	this.thmb_image2.crossOrigin = '';
	this.thmb_image2.src=src;
};

VNVideoLectureAvatar.prototype.setHasMicrophone=function(flag)
{
	if(flag)vn.set(this.mic.style,{display:'none'});
	else vn.set(this.mic.style,{display:'block'});
};

VNVideoLectureAvatar.prototype.setHasWebCam=function(flag){};

VNVideoLectureAvatar.prototype.setSelected=function(flag)
{
	if(flag)this.div_container.style.border='2px solid #0000FF';
	else 
	{
		if(this.viewer.speaker_avatar==this)this.setSpeaker(true);
		else if(this.user.variable('_reqmic').value()=='1')this.setRequestedMicrophone(true);
		else this.div_container.style.border='2px solid #000000';
	}
};

VNVideoLectureAvatar.prototype.setRequestedMicrophone=function(flag)
{
	if(flag)this.div_container.style.border='2px solid #FFFF00';
	else 
	{
		if(this.viewer.selected_avatar==this)this.setSelected(true);
		else this.div_container.style.border='2px solid #000000';
	}
};

VNVideoLectureAvatar.prototype.setSpeaker=function(flag)
{
	if(flag)this.div_container.style.border='2px solid #FF0000';
	else 
	{
		if(this.viewer.selected_avatar==this)this.setSelected(true);
		else this.div_container.style.border='2px solid #000000';
	}
};

VNVideoLectureAvatar.prototype.setLabel=function(label)
{
	this.label.innerHTML=label;
	if(this==this.viewer.speaker_avatar)this.viewer.caption_div.innerHTML=label;
};

VNVideoLectureViewer.prototype.addUser=function(u)
{	
	if(u._vl_avatar)
	{
		this._vl.onUserJoinedSession(u);
		return;
	}
	u._vl_avatar=new VNVideoLectureAvatar(this,u);
	if(u._client.me()==u) u._vl_avatar.setLabel('[Your name]');
	this._vl.onUserJoinedSession(u);
};

VNVideoLectureViewer.prototype.removeUser=function(u)
{
	if(u._vl_avatar)
	{
		if(u.variable('_reqmic').value()=='1')this.removeFromReqMicList(u);
		this.users_div.removeChild(u._vl_avatar.div_container);
		u._vl_avatar=null;
	}
	this._vl.onUserLeftSession(u);
};

VNVideoLectureViewer.prototype.clickAvatar=function(avatar)
{
	var same=true;
	if(this.selected_avatar!=avatar) 
	{
		same=false;
		if(this.selected_avatar)this.selected_avatar.setSelected(false);
	}
	this.selected_avatar=avatar;
	avatar.setSelected(true);
	this.onUserClicked(avatar.user);
	if(!same)this.onUserSelected(avatar.user); 
}; 

VNVideoLectureViewer.prototype.setSpeakerVideo=function(e)
{
	while (this.speaker_div.firstChild) this.speaker_div.removeChild(this.speaker_div.firstChild);
	this.speaker_div.appendChild(e);
};

VNVideoLectureViewer.prototype.setStatus=function(n)
{
	var self=this;
	if(n==0)
	{
		this.button.src=vn.hosturl+'js/img/session/mic_gray_icon.png';
		this.container.style.cursor='pointer';
		this.label.innerHTML='You are muted.';
		this.container.onclick=function(){self._vl.requestMicrophone(true);};
	}
	else if(n==1)
	{
		this.button.src=vn.hosturl+'js/img/session/mic_yellow_icon.png';
		this.container.style.cursor='pointer';
		this.label.innerHTML='You have requested the mic.<br>Tap to cancel.';
		this.container.onclick=function(){self._vl.requestMicrophone(false);};
	}
	else if(n==2)
	{
		this.button.src=vn.hosturl+'js/img/session/mic_red_icon.png';
		this.container.style.cursor='pointer';
		this.label.innerHTML='You are on air!<br>Tap to cancel.';
		this.container.onclick=function(){self._vl.stopStreaming();};
	}
	else if(n==3)//waiting for server response. It should only appear instantly.
	{
		this.button.src=vn.hosturl+'js/img/session/mic_gray_icon.png';
		this.container.style.cursor='auto';
		this.label.innerHTML='';
		this.container.onclick=function(){};
	}
};

/**
 * This method creates a control window with a simple user interface to interactively control the VideoLecture session. With the control window the user can request the microphone, pass the microphone to another user, set name, send messages, etc.
 * @param wm A WindowManager object that will be used to create a window.
 * @param options An optional object of one or more of the following parameters: width (default=320), height (default=800), left (default=50), top (default=50) 
 * @return VNVideoLectureViewer A VNVideoLectureViewer object is returned in which you can set various callback methods such as onUserClicked or onUserSelected. 
 */
VideoLecture.prototype.createControlWindow=function(wm,options)
{	
	var opt=options||{};
	vn.default(opt,{left:0,top:0,width:320,height:800});
	this.win=wm.createWindow(opt);
	this.win.setTitle('VN Session');
	this.win.setCanClose(false);
	//this.win.setCanResize(false);
	this.win.getContentDiv().style.backgroundColor='rgba(0,0,0,0.7)';
	this.win.getContentDiv().appendChild(this._controls.content_div);
	return this._controls;
};

VideoLecture.prototype.startStreaming=function()
{
	if(this._ms.getMicrophone().isEnabled())
	{
		if(this._controls)this._controls.setStatus(3);
		this._s.variable('_speaker').set(this._me.id());
	}
	else 
	{
		console.log('Mic not enabled');
		if(this._controls)this._controls.setStatus(0);
		this.onFailToStream();
	}
};

VideoLecture.prototype.stopStreaming=function()
{
	if(this._controls)this._controls.setStatus(3);
	this._s.variable('_speaker').set('0');
}
/**
 * A callback method that is called when the user attempts to start streaming but it fails due to lack of access to the microphone. It is initially empty.
 */
VideoLecture.prototype.onFailToStream=function(){};
/**
 * A callback method that is called when the user becomes the speaker and starts streaming audio and/or video data. It is initially empty. 
 */
VideoLecture.prototype.onStartStreaming=function(){};
/**
 * A callback method that is called when the user stops being the speaker and does not stream more audio data. It is initially empty. 
 */
VideoLecture.prototype.onStopStreaming=function(){};

VideoLecture.prototype.addFrame=function(buffer)
{
	if(this._am_speaker)this._as.addFrame(buffer);
};