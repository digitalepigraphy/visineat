/* V3
 * Author(s): Angelos Barmpoutis, Tess Bianchi, Sakthivel Manikam Arunachalam
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
 * This class controls a Kinect sensor, which is connected to the client's computer. It is compatible with all kinect devices (Kinect for Windows, Kinect for XBOX, new Kinect, or Kinect 2). The kinect device must be turned on using <a href="/api/StartKinect.zip">StartKinect</a> which communicates with the client's browser. The class contains methods to turn on/off the sensor, and receive tracked skeleton data, either continuously or on demand. The skeleton data can be used with the Skeleton class that has several methods to retrieve the positions, orientations, and tracking state of individual joints.  <br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var my_kinect=new Kinect();<br>
 * my_kinect.whenInitialized().then(function(){<br>
 * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;my_kinect.requestSkeletonFrame();<br>
 * &nbsp;&nbsp;&nbsp;});<br>
 * my_kinect.whenError().then(function(e){<br>
 * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;console.log("Could not connect. Simulation started instead.");<br>
 * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;my_kinect.startSimulatingSkeletonStream();<br>
 * &nbsp;&nbsp;&nbsp;});<br>
 * my_kinect.whenNewFrame().then(function(frame){<br>
 * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;var my_skeleton=null;<br>
 * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;for(var i=0;i<6 && my_skeleton==null;i++)<br>
 * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;my_skeleton=HumanSkeleton.getSkeleton(i, frame);<br>
 * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;console.log(my_skeleton);<br>
 * &nbsp;&nbsp;&nbsp;});<br>
 * my_kinect.connect();<br></font>
 */
function Kinect(){

	if(!("WebSocket" in window)) {
		alert("WebSocket is not supported by your browser");
		return;
	}

	this.KINECT2_SKELETON_JOINT_POS_XYZ = 4;
	this.KINECT2_SKELETON_JOINT_POS_PER_SKELETON = 75;
	this.KINECT2_SKELETON_JOINT_ORIENTATIONS_PER_SKELETON = 100;
	this.KINECT2_SKELETON_JOINT_STATES_PER_SKELETON = 25;
	
	this.CONDENSED_MODE = "CONDENSED_MODE";
	this.NON_CONDENSED_MODE = "NON_CONDENSED_MODE";
	
	this.KINECT2_SKELETON_DATA_PER_SKELETON = 33;

	this.sk_joint_pos = null;
	this.sk_joint_orient = null;
	this.sk_joint_state = null;
	
	this.version=0;
	this.mode = this.CONDENSED_MODE;
	this._e_p=new VNPromise(this);
	this._f_p=new VNPromise(this);
	this._i_p=new VNPromise(this);
}

/**
 * This method connects your application with the <a href="StartKinect.zip">StartKinect</a> streaming service. It must be used to initiate the connection with the Kinect sensor.
 */
Kinect.prototype.connect=function()
{
	var self = this;
	this.ws = new WebSocket((('https:' == document.location.protocol) ? 'ws:' : 'ws:')+"//localhost:8010");
	this.ws.binaryType = "arraybuffer";
				
	this.ws.onerror = function(event){
		self._onerror(event);
	};

	this.ws.onopen = function(event){
		self._onopen(event);
	};

	this.ws.onclose = function(event){
		self._onclose(event);
	};

	this.ws.onmessage = function(event){
		if(event.data instanceof ArrayBuffer){
			self._processData(event.data);
		}
		else{
			//console.log(event.data.toString());
			if(event.data.toString().substring(0,30) == 'RESPONSE:CONNECTED:J4K_SERVER:'){
				self.version = event.data.toString().substring(30,31);
				//self.nonCondensedSkeletonMode();
				self._i_p.callThen();
			}
			if(event.data.toString() ==  "RESPONSE:CURRENTLY_IN_CONDENSED_MODE"){
				self.mode = self.CONDENSED_MODE;
			}
			if(event.data.toString() == "RESPONSE:CURRENTLY_IN_NON_CONDENSED_MODE"){
				self.mode = self.NON_CONDENSED_MODE;
			}
		}
	};
};

Kinect.prototype._onopen = function(event){
	this.condensedSkeletonMode();
	console.log('Kinect connection open.');
};

Kinect.prototype._onclose = function(event){
	this.ws=null;
	console.log('Kinect connection closed.');
};

Kinect.prototype._onerror = function(error) {
	this._e_p.callThen({object:error});
};

Kinect.prototype.waitForSocketConnection = function(callback) {
	var self = this;
	setTimeout(
	        function() {
				if(self.ws == null) return;
			
	            if(self.ws.readyState === 1) {
	                // connection is open
	                if(callback != null) {
	                    callback();
	                }
	                return;
	            } 
				else if(self.ws.readyState === 3) {
					// connection is closed
					return;
				}
				else {
			        // wait for connection
	                self.waitForSocketConnection(callback);
	            }

	        }, 5); // wait 5 milliseconds for the connection
};

Kinect.prototype._send = function(request) {
	var self = this;
	if(self.ws != null) {
		this.waitForSocketConnection(function() {
			self.ws.send(request);
			if(	!(Object.prototype.toString.call(request) === "[object Int8Array]") &&
				!(Object.prototype.toString.call(request) === "[object ArrayBuffer]")) {
				//console.log("Request: " + request);
			}
		});
	}
	else {
		//console.log("WebSocket connection has not been established");
	}
};

/**
 * This method disconnects your application from the <a href="StartKinect.zip">StartKinect</a> streaming service.
 */
Kinect.prototype.disconnect = function() {
	var self = this;
	if(self.ws != null) {
		this.waitForSocketConnection(function() {
			self.ws.close();
			self.ws = null;
		});
	}
	else {
		console.log("WebSocket connection was never established");
	}
};

Kinect.prototype._processData = function(buffer) {
		var sk_info = new Uint8Array(buffer);
		var active_skeletons_count = sk_info[0];

		var active_skeletons = new Array(active_skeletons_count);
		
		for(var i = 1; i <= active_skeletons_count ; i++)
				active_skeletons[i-1] = sk_info[i]-1;
		
		if(this.mode == this.CONDENSED_MODE){
			//Joint positions received from Kinect data.
			var sk_joint_data = new Float32Array(buffer, 8, (32*active_skeletons_count));
			//console.log(sk_joint_pos);
			
			//Return processed data to the callback function.
			this._f_p.callThen({object:{skeletons_tracked:active_skeletons, posture_data:sk_joint_data}});
		}
		
		if(this.mode == this.NON_CONDENSED_MODE){
			//Joint positions received from Kinect data.
			var sk_joint_pos = new Float32Array(buffer, 8, this.KINECT2_SKELETON_JOINT_POS_XYZ+(this.KINECT2_SKELETON_JOINT_POS_PER_SKELETON*active_skeletons_count));

			//Joint orientations received from Kinect data.
			var join_O_start = 8 + (this.KINECT2_SKELETON_JOINT_POS_XYZ + (this.KINECT2_SKELETON_JOINT_POS_PER_SKELETON*active_skeletons_count))*4;
			
			sk_joint_orient = new Float32Array(buffer, join_O_start, this.KINECT2_SKELETON_JOINT_ORIENTATIONS_PER_SKELETON*active_skeletons_count);
			
			//Joint states received from Kinect data.
			var join_states_start = join_O_start + (this.KINECT2_SKELETON_JOINT_ORIENTATIONS_PER_SKELETON*active_skeletons_count)*4;
			sk_joint_state = new Uint8Array(buffer, join_states_start, this.KINECT2_SKELETON_JOINT_STATES_PER_SKELETON*active_skeletons_count);
			
			//Return processed data to the callback function.
			this._f_p.callThen({object:{skeletons_tracked:active_skeletons, joint_positions:sk_joint_pos, joint_orientations:sk_joint_orient, joint_states:sk_joint_state}});
		}

	};
	
/**
 * This is a callback method that you can set to receive skeleton frames from the Kinect sensor. The skeleton data contain player-IDs that indicate which of the 6 skeletons are tracked, the coordinates and orientations of the joints of the skeletons, and the state of each joint (i.e. TRACKED, INFERRED, or NOT_TRACKED from the Skeleton class). This function is initially empty.
 * @param skeletons_tracked An array of the player IDs (from 0 to 6) of the tracked skeletons.
 * @param joint_data Either the X,Y,Z coordinates of the joints of the tracked skeletons or the bone angles used to reconstruct the avatar.
 * @param joint_orientations The joint orientations of the tracked skeletons.
 * @param joint_states The tracking state of each joint of the tracked skeletons.
 */
Kinect.prototype.whenNewFrame=function(){return this._f_p;};

/**
 * This is a callback method that is called when the Kinect has been initialized. It is initially empty.
 */
Kinect.prototype.whenInitialized=function(){return this._i_p;};
/**
 * This is a callback method that is called when a connection error occurs. It is initially empty.
 * @param e A WebSocketEvent object that describes the error.
 */
Kinect.prototype.whenError=function(){return this._e_p;};
/**
 * This method returns true if the Kinect has been successfully initialized.
 * @return Boolean The connection status.
 */
Kinect.prototype.isInitialized = function(){
 if(this.ws!=null && this.ws.readyState === 1) return true;
 else return false;
};

/**
 * This method returns the type of the sensor, or 0 if no device was found.
 * @return byte The type of the sensor: 1 for Kinect1, 2 for Kinect2, or 0 otherwise.
 */
Kinect.prototype.getDeviceType = function(){
	return this.version;
};

/**
 * This method turns the sensor on. Note that the streaming or not of the skeleton data is controlled by other methods.
 */
Kinect.prototype.start = function(){
	this._send("REQUEST:START_SENSOR");
};

/**
 * This method turns the sensor off. Note that the streaming or not of the skeleton data is controlled by other methods.
 */
Kinect.prototype.stop = function(){
	this._send("REQUEST:STOP_SENSOR");
};

/**
 * This method requests from the sensor to send one skeleton frame. It can be used to request skeleton data on demand, i.e. in a custom frequency.
 */
Kinect.prototype.requestSkeletonFrame = function(){
	this._send("REQUEST:GET_CURRENT_DATA");
};
	
/**
 * This method requests from the sensor to start sending skeleton frames. Note that this may flood the system with data if the browser cannot handle all of them in real time. In such case requesting frames on demand using requestSkeletonFrame is advisable.
 */
Kinect.prototype.startStreamingSkeletonData = function(){
	this.start();
	this._send("REQUEST:START_STREAM_DATA");
};

/**
 * This method requests from the sensor to stop sending skeleton frames. 
 */
Kinect.prototype.stopStreamingSkeletonData = function(){
	this._send("REQUEST:STOP_STREAM_DATA");
};

/**
 * This method requests from the sensor to stop sending skeleton frames. 
 */
Kinect.prototype.condensedSkeletonMode = function(){
	this._send("REQUEST:CONDENSED_MODE");
};

/**
 * This method requests from the sensor to stop sending skeleton frames. 
 */
Kinect.prototype.nonCondensedSkeletonMode = function(){
	this._send("REQUEST:NON_CONDENSED_MODE");
};
/**
 * This method starts simulating a kinect sensor by sending a sequence of pre-recorded kinect frames. The frames will be received by the callback function onSkeletonFrameEvent.
 */
Kinect.prototype.startSimulatingSkeletonStream = function() {
this.version=1;
var self=this;
var frame_i=0;
var tr_st=[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0,0];
this.simulation_thread=setInterval(function(){
switch(frame_i)
	{
	case 0:{var d=[0,0,0,0,-0.06,0.25,1.95,-0.05,0.31,1.93,0.07,0.63,1.83,0.13,0.66,1.68,-0.12,0.55,1.83,-0.30,0.38,1.96,-0.41,0.18,1.99,-0.43,0.11,1.98,0.21,0.49,1.81,0.33,0.28,1.80,0.45,0.11,1.63,0.53,0.09,1.55,-0.15,0.20,1.98,-0.25,-0.29,2.04,-0.30,-0.66,2.06,-0.33,-0.73,1.99,0.00,0.17,1.97,0.01,-0.27,1.92,-0.01,-0.68,1.96,0.02,-0.75,1.91,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 1:{var d=[0,0,0,0,-0.06,0.25,1.96,-0.04,0.31,1.94,0.10,0.62,1.83,0.13,0.67,1.68,-0.12,0.56,1.86,-0.30,0.38,1.99,-0.41,0.19,2.03,-0.43,0.11,2.02,0.21,0.49,1.82,0.31,0.28,1.83,0.41,0.11,1.69,0.49,0.09,1.60,-0.14,0.20,1.99,-0.25,-0.29,2.05,-0.31,-0.66,2.10,-0.34,-0.73,2.03,0.00,0.17,1.97,0.01,-0.27,1.93,-0.01,-0.68,1.96,0.02,-0.75,1.91,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 2:{var d=[0,0,0,0,-0.06,0.25,1.96,-0.04,0.31,1.94,0.11,0.62,1.83,0.13,0.67,1.67,-0.12,0.57,1.88,-0.29,0.40,2.02,-0.40,0.19,2.08,-0.43,0.11,2.07,0.19,0.51,1.85,0.30,0.29,1.85,0.37,0.10,1.75,0.44,0.08,1.65,-0.14,0.20,1.99,-0.25,-0.29,2.06,-0.32,-0.65,2.15,-0.35,-0.73,2.09,0.00,0.17,1.98,0.01,-0.27,1.93,-0.01,-0.68,1.96,0.02,-0.75,1.91,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 3:{var d=[0,0,0,0,-0.05,0.26,1.97,-0.03,0.32,1.95,0.11,0.63,1.85,0.12,0.70,1.70,-0.12,0.58,1.89,-0.28,0.41,2.05,-0.40,0.19,2.13,-0.43,0.10,2.14,0.18,0.53,1.87,0.28,0.30,1.89,0.33,0.09,1.81,0.37,0.06,1.73,-0.14,0.20,2.00,-0.26,-0.29,2.07,-0.32,-0.64,2.21,-0.35,-0.71,2.16,-0.00,0.18,1.99,0.01,-0.27,1.93,-0.01,-0.68,1.96,0.02,-0.74,1.91,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 4:{var d=[0,0,0,0,-0.05,0.26,1.98,-0.03,0.33,1.97,0.05,0.67,1.90,0.09,0.72,1.73,-0.12,0.60,1.92,-0.28,0.42,2.08,-0.41,0.18,2.19,-0.43,0.10,2.20,0.17,0.56,1.91,0.26,0.31,1.94,0.29,0.10,1.88,0.31,0.04,1.81,-0.14,0.21,2.01,-0.26,-0.28,2.07,-0.32,-0.63,2.26,-0.35,-0.71,2.23,-0.00,0.19,2.00,0.01,-0.27,1.93,-0.01,-0.68,1.96,0.02,-0.74,1.91,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 5:{var d=[0,0,0,0,-0.05,0.27,2.00,-0.03,0.34,1.98,0.03,0.68,1.93,0.10,0.74,1.79,-0.14,0.60,1.96,-0.29,0.41,2.12,-0.41,0.18,2.24,-0.43,0.10,2.26,0.16,0.57,1.94,0.24,0.32,1.98,0.25,0.09,1.94,0.26,0.02,1.87,-0.14,0.21,2.01,-0.26,-0.28,2.08,-0.32,-0.63,2.30,-0.34,-0.71,2.29,-0.00,0.19,2.01,0.01,-0.26,1.94,-0.01,-0.68,1.96,0.02,-0.74,1.91,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 6:{var d=[0,0,0,0,-0.05,0.28,2.01,-0.04,0.35,2.00,-0.01,0.71,1.98,0.10,0.75,1.85,-0.16,0.61,2.00,-0.29,0.41,2.16,-0.41,0.17,2.29,-0.43,0.09,2.32,0.15,0.59,1.98,0.22,0.33,2.03,0.22,0.07,2.00,0.23,-0.01,1.94,-0.14,0.21,2.02,-0.26,-0.27,2.08,-0.31,-0.62,2.33,-0.33,-0.71,2.31,-0.00,0.20,2.02,0.01,-0.27,1.94,-0.01,-0.68,1.96,0.02,-0.74,1.90,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 7:{var d=[0,0,0,0,-0.06,0.28,2.03,-0.05,0.36,2.02,-0.03,0.72,2.02,0.10,0.78,1.90,-0.18,0.61,2.04,-0.30,0.41,2.19,-0.42,0.17,2.31,-0.44,0.09,2.35,0.14,0.60,2.01,0.20,0.33,2.07,0.20,0.06,2.06,0.20,-0.02,2.01,-0.14,0.22,2.03,-0.27,-0.27,2.10,-0.31,-0.62,2.35,-0.32,-0.71,2.34,-0.00,0.20,2.03,0.01,-0.27,1.95,-0.01,-0.68,1.96,0.02,-0.74,1.90,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 8:{var d=[0,0,0,0,-0.06,0.29,2.05,-0.06,0.36,2.05,-0.04,0.73,2.06,0.08,0.80,1.95,-0.19,0.62,2.07,-0.31,0.41,2.22,-0.42,0.17,2.34,-0.44,0.09,2.37,0.13,0.60,2.06,0.18,0.34,2.12,0.17,0.07,2.13,0.18,-0.02,2.08,-0.14,0.22,2.04,-0.27,-0.27,2.14,-0.30,-0.63,2.37,-0.31,-0.72,2.35,-0.00,0.21,2.05,0.00,-0.27,1.95,-0.01,-0.68,1.96,0.02,-0.74,1.90,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 9:{var d=[0,0,0,0,-0.07,0.29,2.08,-0.07,0.37,2.09,-0.05,0.73,2.10,0.06,0.83,2.00,-0.22,0.62,2.11,-0.33,0.40,2.25,-0.43,0.16,2.36,-0.45,0.08,2.40,0.12,0.61,2.11,0.16,0.34,2.17,0.16,0.09,2.19,0.16,-0.01,2.15,-0.15,0.22,2.07,-0.27,-0.28,2.18,-0.29,-0.64,2.38,-0.31,-0.72,2.36,-0.00,0.22,2.08,0.00,-0.27,1.95,-0.01,-0.68,1.96,0.02,-0.74,1.90,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 10:{var d=[0,0,0,0,-0.09,0.29,2.12,-0.08,0.37,2.13,-0.07,0.73,2.15,0.02,0.85,2.06,-0.23,0.62,2.14,-0.34,0.39,2.26,-0.45,0.14,2.37,-0.46,0.07,2.40,0.11,0.61,2.15,0.14,0.35,2.21,0.14,0.11,2.24,0.15,0.01,2.20,-0.16,0.22,2.10,-0.27,-0.29,2.21,-0.28,-0.65,2.38,-0.30,-0.72,2.37,-0.02,0.21,2.13,0.00,-0.27,1.95,-0.01,-0.68,1.95,0.02,-0.74,1.90,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 11:{var d=[0,0,0,0,-0.10,0.29,2.16,-0.10,0.36,2.18,-0.09,0.73,2.20,-0.03,0.89,2.13,-0.25,0.61,2.18,-0.37,0.37,2.28,-0.47,0.11,2.35,-0.48,0.04,2.38,0.09,0.61,2.19,0.13,0.35,2.25,0.14,0.10,2.26,0.15,0.00,2.22,-0.18,0.21,2.14,-0.27,-0.30,2.24,-0.27,-0.65,2.39,-0.30,-0.73,2.37,-0.03,0.21,2.16,-0.00,-0.26,1.95,-0.00,-0.67,1.93,0.02,-0.73,1.88,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 12:{var d=[0,0,0,0,-0.12,0.29,2.20,-0.12,0.36,2.22,-0.10,0.72,2.24,-0.07,0.91,2.19,-0.27,0.60,2.22,-0.39,0.34,2.29,-0.49,0.08,2.32,-0.50,-0.00,2.34,0.08,0.61,2.23,0.12,0.34,2.28,0.14,0.09,2.28,0.16,-0.00,2.23,-0.20,0.21,2.18,-0.28,-0.30,2.26,-0.27,-0.66,2.39,-0.30,-0.73,2.38,-0.04,0.21,2.20,-0.01,-0.26,1.95,0.00,-0.65,1.90,0.02,-0.71,1.85,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 13:{var d=[0,0,0,0,-0.13,0.28,2.23,-0.13,0.35,2.25,-0.12,0.71,2.27,-0.10,0.92,2.24,-0.29,0.60,2.26,-0.41,0.33,2.29,-0.52,0.05,2.26,-0.53,-0.03,2.27,0.06,0.60,2.27,0.12,0.32,2.32,0.15,0.08,2.29,0.19,-0.01,2.24,-0.22,0.21,2.21,-0.28,-0.30,2.27,-0.27,-0.66,2.39,-0.30,-0.73,2.37,-0.05,0.20,2.22,-0.01,-0.26,1.94,0.01,-0.61,1.87,0.02,-0.68,1.79,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 14:{var d=[0,0,0,0,-0.14,0.28,2.25,-0.14,0.35,2.28,-0.13,0.71,2.31,-0.11,0.91,2.26,-0.30,0.59,2.29,-0.42,0.32,2.29,-0.53,0.06,2.20,-0.54,-0.02,2.19,0.05,0.60,2.30,0.12,0.31,2.33,0.17,0.07,2.29,0.22,-0.01,2.24,-0.23,0.21,2.23,-0.28,-0.30,2.27,-0.26,-0.66,2.39,-0.30,-0.73,2.37,-0.06,0.20,2.25,-0.01,-0.25,1.94,0.01,-0.58,1.83,0.03,-0.63,1.73,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 15:{var d=[0,0,0,0,-0.15,0.28,2.29,-0.15,0.35,2.31,-0.14,0.71,2.34,-0.13,0.92,2.30,-0.31,0.59,2.32,-0.42,0.32,2.29,-0.53,0.08,2.14,-0.54,0.00,2.10,0.04,0.60,2.33,0.12,0.31,2.34,0.22,0.07,2.28,0.27,0.01,2.22,-0.23,0.21,2.27,-0.28,-0.30,2.28,-0.26,-0.66,2.40,-0.30,-0.73,2.37,-0.07,0.20,2.28,-0.02,-0.24,1.96,0.02,-0.55,1.80,0.04,-0.58,1.68,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 16:{var d=[0,0,0,0,-0.16,0.29,2.31,-0.16,0.36,2.34,-0.15,0.72,2.36,-0.14,0.92,2.32,-0.32,0.59,2.34,-0.43,0.33,2.28,-0.52,0.13,2.07,-0.53,0.05,2.03,0.03,0.60,2.36,0.12,0.32,2.36,0.26,0.10,2.27,0.31,0.04,2.21,-0.24,0.21,2.30,-0.28,-0.30,2.29,-0.26,-0.66,2.40,-0.30,-0.73,2.36,-0.07,0.21,2.31,-0.03,-0.23,1.99,0.02,-0.52,1.76,0.05,-0.54,1.64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 17:{var d=[0,0,0,0,-0.16,0.30,2.35,-0.16,0.36,2.38,-0.16,0.72,2.39,-0.14,0.92,2.35,-0.33,0.59,2.36,-0.44,0.35,2.27,-0.50,0.20,2.05,-0.51,0.11,1.97,0.02,0.61,2.39,0.14,0.33,2.37,0.30,0.15,2.26,0.37,0.09,2.20,-0.24,0.22,2.33,-0.28,-0.29,2.30,-0.26,-0.66,2.40,-0.30,-0.73,2.36,-0.08,0.21,2.34,-0.03,-0.22,2.03,0.03,-0.51,1.73,0.05,-0.52,1.63,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 18:{var d=[0,0,0,0,-0.16,0.30,2.37,-0.17,0.37,2.40,-0.16,0.73,2.41,-0.14,0.92,2.37,-0.34,0.60,2.38,-0.44,0.38,2.25,-0.49,0.27,2.01,-0.50,0.18,1.92,0.02,0.61,2.41,0.16,0.35,2.38,0.36,0.19,2.24,0.43,0.15,2.19,-0.25,0.22,2.35,-0.28,-0.29,2.31,-0.26,-0.66,2.40,-0.30,-0.73,2.36,-0.08,0.22,2.36,-0.04,-0.21,2.08,0.03,-0.51,1.73,0.06,-0.52,1.65,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 19:{var d=[0,0,0,0,-0.17,0.31,2.40,-0.17,0.38,2.43,-0.17,0.74,2.44,-0.15,0.93,2.40,-0.34,0.60,2.39,-0.45,0.42,2.24,-0.48,0.32,1.96,-0.48,0.26,1.90,0.02,0.63,2.45,0.18,0.38,2.39,0.40,0.24,2.23,0.48,0.22,2.18,-0.25,0.23,2.38,-0.29,-0.28,2.33,-0.26,-0.66,2.40,-0.30,-0.73,2.36,-0.08,0.23,2.40,-0.04,-0.21,2.11,0.03,-0.52,1.83,0.05,-0.53,1.74,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 20:{var d=[0,0,0,0,-0.17,0.32,2.42,-0.17,0.39,2.46,-0.17,0.75,2.47,-0.15,0.93,2.43,-0.35,0.61,2.42,-0.45,0.47,2.25,-0.47,0.38,1.95,-0.47,0.34,1.86,0.02,0.64,2.48,0.20,0.41,2.40,0.42,0.32,2.24,0.53,0.29,2.19,-0.25,0.23,2.40,-0.29,-0.28,2.36,-0.26,-0.66,2.40,-0.30,-0.73,2.36,-0.08,0.24,2.42,-0.04,-0.21,2.16,0.01,-0.54,1.94,0.04,-0.56,1.83,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 21:{var d=[0,0,0,0,-0.17,0.33,2.45,-0.17,0.39,2.49,-0.17,0.76,2.49,-0.15,0.95,2.47,-0.35,0.62,2.44,-0.45,0.50,2.26,-0.45,0.46,1.97,-0.46,0.44,1.85,0.02,0.65,2.51,0.22,0.44,2.42,0.43,0.39,2.26,0.56,0.37,2.19,-0.25,0.24,2.43,-0.29,-0.28,2.38,-0.26,-0.66,2.40,-0.30,-0.73,2.36,-0.08,0.25,2.45,-0.04,-0.22,2.21,-0.00,-0.56,2.07,0.02,-0.60,1.97,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 22:{var d=[0,0,0,0,-0.17,0.33,2.47,-0.17,0.40,2.51,-0.17,0.76,2.53,-0.15,0.95,2.50,-0.35,0.63,2.46,-0.45,0.51,2.26,-0.45,0.53,1.94,-0.46,0.53,1.88,0.02,0.66,2.54,0.23,0.47,2.44,0.46,0.45,2.27,0.59,0.44,2.21,-0.25,0.25,2.45,-0.29,-0.28,2.40,-0.26,-0.66,2.40,-0.30,-0.73,2.36,-0.08,0.25,2.48,-0.04,-0.23,2.26,-0.03,-0.61,2.24,0.00,-0.66,2.15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 23:{var d=[0,0,0,0,-0.17,0.34,2.50,-0.17,0.40,2.54,-0.17,0.77,2.55,-0.15,0.96,2.53,-0.34,0.64,2.50,-0.45,0.52,2.26,-0.47,0.58,2.00,-0.46,0.61,1.91,0.02,0.66,2.56,0.25,0.50,2.45,0.46,0.51,2.31,0.59,0.52,2.22,-0.25,0.25,2.47,-0.29,-0.28,2.42,-0.27,-0.66,2.40,-0.30,-0.73,2.36,-0.08,0.26,2.50,-0.04,-0.25,2.33,-0.06,-0.66,2.42,-0.02,-0.72,2.32,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 24:{var d=[0,0,0,0,-0.16,0.34,2.52,-0.17,0.41,2.57,-0.16,0.77,2.58,-0.15,0.97,2.57,-0.33,0.64,2.53,-0.47,0.54,2.29,-0.47,0.63,2.06,-0.46,0.68,1.96,0.02,0.66,2.58,0.26,0.53,2.48,0.46,0.56,2.34,0.59,0.59,2.24,-0.24,0.26,2.50,-0.29,-0.28,2.43,-0.27,-0.66,2.40,-0.30,-0.73,2.36,-0.08,0.26,2.53,-0.04,-0.26,2.40,-0.07,-0.68,2.55,-0.03,-0.74,2.47,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 25:{var d=[0,0,0,0,-0.16,0.34,2.55,-0.16,0.40,2.60,-0.16,0.74,2.62,-0.14,0.97,2.59,-0.33,0.65,2.58,-0.49,0.56,2.34,-0.48,0.68,2.11,-0.46,0.73,2.02,0.03,0.66,2.61,0.27,0.55,2.49,0.46,0.59,2.37,0.59,0.64,2.26,-0.24,0.26,2.53,-0.29,-0.28,2.44,-0.27,-0.66,2.41,-0.30,-0.73,2.36,-0.08,0.26,2.54,-0.05,-0.27,2.47,-0.08,-0.67,2.68,-0.05,-0.75,2.62,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 26:{var d=[0,0,0,0,-0.16,0.34,2.58,-0.16,0.40,2.63,-0.15,0.73,2.64,-0.14,0.97,2.64,-0.33,0.65,2.60,-0.50,0.57,2.38,-0.48,0.72,2.14,-0.47,0.77,2.07,0.04,0.66,2.64,0.28,0.57,2.51,0.46,0.61,2.38,0.59,0.69,2.27,-0.24,0.26,2.55,-0.29,-0.28,2.45,-0.27,-0.66,2.41,-0.30,-0.73,2.36,-0.08,0.26,2.58,-0.06,-0.28,2.55,-0.09,-0.65,2.80,-0.07,-0.75,2.78,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 27:{var d=[0,0,0,0,-0.15,0.34,2.61,-0.15,0.40,2.66,-0.15,0.74,2.69,-0.13,0.97,2.67,-0.32,0.65,2.65,-0.50,0.59,2.40,-0.49,0.75,2.18,-0.48,0.80,2.13,0.05,0.66,2.67,0.28,0.58,2.53,0.46,0.63,2.40,0.59,0.71,2.28,-0.23,0.26,2.59,-0.29,-0.28,2.47,-0.27,-0.66,2.41,-0.30,-0.73,2.36,-0.07,0.26,2.60,-0.06,-0.30,2.64,-0.11,-0.65,2.90,-0.08,-0.74,2.91,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 28:{var d=[0,0,0,0,-0.15,0.34,2.65,-0.15,0.40,2.70,-0.14,0.73,2.73,-0.12,0.97,2.71,-0.32,0.65,2.68,-0.50,0.61,2.43,-0.49,0.77,2.22,-0.49,0.82,2.18,0.06,0.66,2.69,0.30,0.59,2.55,0.47,0.65,2.41,0.59,0.73,2.29,-0.23,0.26,2.62,-0.28,-0.29,2.48,-0.27,-0.66,2.41,-0.30,-0.73,2.36,-0.07,0.25,2.64,-0.07,-0.31,2.73,-0.11,-0.65,2.98,-0.09,-0.74,2.96,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 29:{var d=[0,0,0,0,-0.14,0.34,2.69,-0.14,0.39,2.74,-0.13,0.72,2.74,-0.11,0.96,2.74,-0.31,0.65,2.72,-0.50,0.63,2.47,-0.49,0.79,2.25,-0.49,0.84,2.23,0.07,0.65,2.72,0.31,0.60,2.57,0.50,0.69,2.40,0.59,0.75,2.32,-0.22,0.26,2.67,-0.28,-0.29,2.51,-0.27,-0.65,2.42,-0.30,-0.73,2.36,-0.06,0.25,2.68,-0.07,-0.30,2.80,-0.12,-0.65,2.99,-0.09,-0.73,2.96,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 30:{var d=[0,0,0,0,-0.13,0.34,2.73,-0.13,0.40,2.78,-0.11,0.74,2.79,-0.09,0.96,2.77,-0.31,0.66,2.76,-0.50,0.64,2.53,-0.50,0.80,2.30,-0.49,0.85,2.28,0.08,0.65,2.75,0.32,0.60,2.60,0.52,0.71,2.40,0.58,0.76,2.34,-0.22,0.26,2.71,-0.27,-0.28,2.55,-0.28,-0.66,2.42,-0.30,-0.73,2.36,-0.05,0.24,2.72,-0.08,-0.30,2.85,-0.12,-0.67,3.02,-0.10,-0.74,2.97,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 31:{var d=[0,0,0,0,-0.12,0.34,2.77,-0.12,0.40,2.81,-0.10,0.75,2.81,-0.08,0.95,2.78,-0.30,0.66,2.79,-0.50,0.63,2.60,-0.50,0.80,2.35,-0.50,0.85,2.32,0.09,0.65,2.78,0.33,0.61,2.63,0.52,0.71,2.43,0.58,0.76,2.37,-0.21,0.26,2.76,-0.27,-0.28,2.59,-0.29,-0.65,2.43,-0.30,-0.73,2.36,-0.04,0.24,2.76,-0.08,-0.30,2.86,-0.13,-0.68,3.02,-0.10,-0.74,2.98,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 32:{var d=[0,0,0,0,-0.12,0.34,2.81,-0.11,0.41,2.86,-0.09,0.76,2.84,-0.07,0.95,2.80,-0.29,0.66,2.81,-0.51,0.62,2.64,-0.50,0.81,2.39,-0.50,0.85,2.35,0.10,0.65,2.81,0.34,0.61,2.66,0.52,0.72,2.45,0.57,0.77,2.40,-0.21,0.26,2.80,-0.27,-0.27,2.64,-0.31,-0.65,2.49,-0.30,-0.71,2.39,-0.04,0.25,2.80,-0.08,-0.30,2.88,-0.13,-0.68,3.02,-0.10,-0.74,2.97,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 33:{var d=[0,0,0,0,-0.12,0.35,2.85,-0.11,0.41,2.89,-0.08,0.77,2.88,-0.06,0.95,2.82,-0.29,0.67,2.84,-0.51,0.62,2.68,-0.50,0.81,2.41,-0.50,0.86,2.37,0.11,0.66,2.85,0.34,0.61,2.70,0.53,0.73,2.46,0.57,0.77,2.41,-0.21,0.27,2.84,-0.27,-0.27,2.68,-0.31,-0.66,2.54,-0.31,-0.71,2.44,-0.04,0.25,2.84,-0.08,-0.30,2.89,-0.13,-0.68,3.01,-0.10,-0.74,2.95,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 34:{var d=[0,0,0,0,-0.11,0.36,2.88,-0.11,0.43,2.92,-0.08,0.78,2.90,-0.05,0.96,2.84,-0.29,0.68,2.87,-0.51,0.63,2.72,-0.50,0.81,2.45,-0.50,0.86,2.39,0.12,0.66,2.86,0.34,0.62,2.73,0.52,0.72,2.51,0.56,0.76,2.47,-0.21,0.28,2.87,-0.27,-0.26,2.73,-0.30,-0.66,2.63,-0.32,-0.70,2.52,-0.04,0.26,2.87,-0.08,-0.30,2.91,-0.13,-0.68,3.00,-0.10,-0.74,2.95,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 35:{var d=[0,0,0,0,-0.11,0.37,2.90,-0.11,0.43,2.94,-0.08,0.79,2.91,-0.05,0.96,2.86,-0.28,0.69,2.90,-0.51,0.63,2.74,-0.50,0.81,2.47,-0.50,0.86,2.41,0.12,0.67,2.88,0.35,0.62,2.75,0.53,0.73,2.54,0.57,0.77,2.49,-0.21,0.29,2.90,-0.27,-0.25,2.78,-0.30,-0.65,2.74,-0.32,-0.70,2.64,-0.03,0.27,2.90,-0.08,-0.29,2.92,-0.12,-0.68,3.00,-0.10,-0.74,2.94,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 36:{var d=[0,0,0,0,-0.11,0.38,2.93,-0.11,0.44,2.96,-0.08,0.80,2.94,-0.04,0.98,2.90,-0.28,0.69,2.93,-0.51,0.64,2.75,-0.50,0.82,2.50,-0.50,0.87,2.43,0.12,0.68,2.90,0.35,0.63,2.78,0.53,0.73,2.56,0.58,0.77,2.50,-0.21,0.29,2.92,-0.27,-0.25,2.83,-0.28,-0.64,2.86,-0.31,-0.70,2.77,-0.03,0.28,2.92,-0.08,-0.28,2.93,-0.12,-0.68,3.00,-0.10,-0.74,2.94,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 37:{var d=[0,0,0,0,-0.11,0.38,2.95,-0.11,0.45,2.98,-0.08,0.81,2.96,-0.04,0.99,2.92,-0.28,0.70,2.95,-0.51,0.65,2.77,-0.50,0.82,2.51,-0.50,0.88,2.45,0.12,0.68,2.92,0.35,0.63,2.80,0.53,0.74,2.61,0.60,0.78,2.54,-0.21,0.30,2.94,-0.27,-0.25,2.88,-0.27,-0.64,2.98,-0.30,-0.70,2.91,-0.03,0.29,2.94,-0.07,-0.28,2.95,-0.12,-0.68,2.99,-0.10,-0.74,2.94,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 38:{var d=[0,0,0,0,-0.11,0.39,2.97,-0.10,0.46,3.00,-0.08,0.82,2.99,-0.04,1.00,2.94,-0.28,0.71,2.97,-0.52,0.66,2.79,-0.51,0.83,2.56,-0.50,0.88,2.49,0.12,0.69,2.94,0.35,0.64,2.83,0.54,0.74,2.64,0.61,0.79,2.57,-0.21,0.31,2.96,-0.27,-0.24,2.94,-0.26,-0.65,3.06,-0.30,-0.71,2.98,-0.03,0.29,2.96,-0.07,-0.27,2.97,-0.12,-0.67,3.00,-0.10,-0.73,2.93,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 39:{var d=[0,0,0,0,-0.11,0.40,2.98,-0.10,0.47,3.02,-0.08,0.82,3.00,-0.04,1.01,2.97,-0.28,0.72,2.99,-0.52,0.67,2.80,-0.52,0.83,2.58,-0.51,0.89,2.52,0.12,0.70,2.96,0.35,0.64,2.85,0.54,0.75,2.67,0.61,0.80,2.60,-0.21,0.31,2.98,-0.27,-0.24,2.99,-0.25,-0.65,3.14,-0.30,-0.71,3.08,-0.03,0.30,2.98,-0.08,-0.26,2.99,-0.12,-0.66,3.01,-0.10,-0.73,2.93,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 40:{var d=[0,0,0,0,-0.11,0.40,3.00,-0.10,0.47,3.04,-0.08,0.82,3.01,-0.04,1.01,2.99,-0.28,0.73,3.01,-0.52,0.68,2.81,-0.52,0.85,2.58,-0.51,0.90,2.53,0.12,0.70,2.98,0.35,0.65,2.87,0.54,0.75,2.69,0.62,0.81,2.62,-0.20,0.32,3.00,-0.26,-0.24,3.05,-0.23,-0.66,3.18,-0.29,-0.71,3.15,-0.03,0.30,3.00,-0.08,-0.25,3.01,-0.12,-0.65,3.02,-0.10,-0.72,2.93,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 41:{var d=[0,0,0,0,-0.11,0.40,3.02,-0.10,0.47,3.05,-0.08,0.83,3.04,-0.05,1.02,3.01,-0.28,0.73,3.02,-0.52,0.69,2.84,-0.53,0.86,2.59,-0.52,0.91,2.55,0.12,0.71,3.00,0.35,0.65,2.89,0.54,0.76,2.73,0.62,0.81,2.65,-0.20,0.32,3.01,-0.25,-0.24,3.09,-0.24,-0.65,3.27,-0.28,-0.71,3.22,-0.03,0.31,3.01,-0.09,-0.25,3.03,-0.12,-0.64,3.03,-0.10,-0.71,2.94,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 42:{var d=[0,0,0,0,-0.11,0.41,3.04,-0.10,0.47,3.08,-0.08,0.83,3.06,-0.05,1.02,3.02,-0.28,0.73,3.03,-0.52,0.70,2.85,-0.54,0.88,2.60,-0.53,0.92,2.56,0.12,0.71,3.03,0.34,0.65,2.90,0.54,0.76,2.74,0.62,0.81,2.67,-0.20,0.32,3.03,-0.24,-0.24,3.14,-0.24,-0.65,3.30,-0.27,-0.71,3.25,-0.03,0.31,3.04,-0.09,-0.25,3.05,-0.11,-0.64,3.04,-0.10,-0.71,2.94,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 43:{var d=[0,0,0,0,-0.11,0.41,3.07,-0.11,0.47,3.10,-0.09,0.80,3.09,-0.05,1.02,3.03,-0.29,0.73,3.05,-0.52,0.71,2.87,-0.54,0.88,2.61,-0.54,0.93,2.58,0.11,0.71,3.04,0.34,0.66,2.92,0.54,0.76,2.75,0.61,0.81,2.69,-0.20,0.32,3.06,-0.24,-0.24,3.16,-0.23,-0.65,3.34,-0.25,-0.72,3.29,-0.03,0.31,3.06,-0.10,-0.25,3.07,-0.11,-0.64,3.04,-0.10,-0.71,2.94,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 44:{var d=[0,0,0,0,-0.11,0.40,3.09,-0.11,0.47,3.12,-0.10,0.80,3.10,-0.06,1.02,3.04,-0.29,0.73,3.07,-0.53,0.71,2.88,-0.55,0.89,2.63,-0.55,0.93,2.60,0.11,0.71,3.06,0.34,0.66,2.93,0.54,0.76,2.76,0.61,0.81,2.71,-0.20,0.32,3.09,-0.23,-0.24,3.20,-0.23,-0.64,3.36,-0.25,-0.71,3.33,-0.04,0.31,3.09,-0.10,-0.25,3.08,-0.11,-0.63,3.05,-0.10,-0.70,2.94,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 45:{var d=[0,0,0,0,-0.12,0.40,3.11,-0.11,0.47,3.14,-0.10,0.80,3.11,-0.08,1.01,3.06,-0.31,0.73,3.09,-0.53,0.71,2.89,-0.55,0.89,2.64,-0.55,0.94,2.61,0.10,0.71,3.07,0.33,0.65,2.95,0.54,0.76,2.77,0.62,0.81,2.72,-0.20,0.31,3.12,-0.23,-0.24,3.23,-0.22,-0.64,3.38,-0.24,-0.71,3.34,-0.04,0.31,3.12,-0.09,-0.25,3.07,-0.11,-0.63,3.05,-0.10,-0.70,2.94,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 46:{var d=[0,0,0,0,-0.13,0.39,3.15,-0.12,0.46,3.16,-0.11,0.79,3.12,-0.09,1.00,3.08,-0.32,0.72,3.11,-0.53,0.70,2.91,-0.55,0.89,2.66,-0.56,0.93,2.63,0.09,0.69,3.10,0.33,0.65,2.96,0.54,0.76,2.77,0.61,0.81,2.73,-0.21,0.30,3.15,-0.23,-0.22,3.24,-0.22,-0.63,3.39,-0.24,-0.71,3.35,-0.04,0.30,3.15,-0.08,-0.26,3.06,-0.11,-0.63,3.05,-0.10,-0.70,2.94,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 47:{var d=[0,0,0,0,-0.13,0.38,3.17,-0.13,0.45,3.18,-0.12,0.79,3.14,-0.11,0.98,3.10,-0.33,0.70,3.14,-0.53,0.69,2.92,-0.55,0.86,2.69,-0.55,0.90,2.65,0.08,0.68,3.12,0.33,0.64,2.98,0.54,0.75,2.78,0.60,0.78,2.76,-0.22,0.29,3.17,-0.24,-0.24,3.26,-0.22,-0.63,3.39,-0.24,-0.71,3.35,-0.05,0.29,3.17,-0.08,-0.25,3.04,-0.11,-0.63,3.05,-0.10,-0.69,2.94,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 48:{var d=[0,0,0,0,-0.14,0.38,3.18,-0.13,0.45,3.20,-0.13,0.78,3.15,-0.12,0.97,3.10,-0.34,0.68,3.16,-0.53,0.66,2.95,-0.54,0.81,2.72,-0.54,0.86,2.68,0.07,0.67,3.14,0.33,0.62,2.99,0.54,0.74,2.78,0.59,0.76,2.77,-0.22,0.29,3.19,-0.25,-0.26,3.26,-0.22,-0.63,3.39,-0.25,-0.71,3.33,-0.05,0.29,3.19,-0.07,-0.25,3.03,-0.10,-0.63,3.05,-0.09,-0.69,2.94,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 49:{var d=[0,0,0,0,-0.14,0.38,3.19,-0.14,0.44,3.20,-0.14,0.78,3.16,-0.13,0.97,3.11,-0.35,0.68,3.18,-0.52,0.62,2.99,-0.53,0.75,2.75,-0.51,0.79,2.70,0.06,0.67,3.15,0.33,0.60,3.00,0.53,0.71,2.78,0.58,0.74,2.77,-0.22,0.28,3.19,-0.25,-0.26,3.26,-0.23,-0.64,3.39,-0.25,-0.71,3.33,-0.05,0.28,3.20,-0.08,-0.25,3.02,-0.10,-0.61,3.04,-0.09,-0.67,2.94,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 50:{var d=[0,0,0,0,-0.14,0.37,3.20,-0.14,0.44,3.21,-0.15,0.78,3.17,-0.13,0.97,3.12,-0.35,0.68,3.19,-0.51,0.58,3.03,-0.53,0.67,2.80,-0.49,0.72,2.71,0.06,0.67,3.16,0.33,0.59,3.01,0.52,0.69,2.78,0.57,0.72,2.77,-0.22,0.28,3.20,-0.25,-0.27,3.27,-0.23,-0.64,3.39,-0.24,-0.71,3.32,-0.05,0.28,3.20,-0.07,-0.19,3.00,-0.09,-0.60,3.04,-0.08,-0.66,2.94,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 51:{var d=[0,0,0,0,-0.14,0.37,3.20,-0.14,0.44,3.21,-0.15,0.78,3.18,-0.14,0.97,3.12,-0.35,0.67,3.19,-0.53,0.53,3.03,-0.51,0.60,2.81,-0.47,0.63,2.71,0.06,0.67,3.16,0.33,0.59,3.01,0.52,0.68,2.78,0.56,0.71,2.76,-0.22,0.28,3.20,-0.25,-0.27,3.27,-0.23,-0.64,3.39,-0.24,-0.71,3.32,-0.05,0.29,3.21,-0.07,-0.14,2.98,-0.09,-0.58,3.04,-0.07,-0.64,2.94,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 52:{var d=[0,0,0,0,-0.14,0.38,3.20,-0.14,0.45,3.21,-0.15,0.78,3.18,-0.14,0.97,3.12,-0.35,0.68,3.20,-0.48,0.49,3.15,-0.51,0.50,2.92,-0.52,0.52,2.85,0.05,0.69,3.17,0.32,0.60,3.00,0.51,0.69,2.78,0.55,0.72,2.75,-0.22,0.28,3.21,-0.25,-0.26,3.27,-0.23,-0.64,3.38,-0.24,-0.71,3.32,-0.05,0.29,3.21,-0.06,-0.13,2.97,-0.08,-0.55,3.03,-0.07,-0.62,2.94,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 53:{var d=[0,0,0,0,-0.14,0.38,3.20,-0.14,0.45,3.21,-0.15,0.79,3.19,-0.14,0.98,3.13,-0.34,0.68,3.20,-0.46,0.48,3.20,-0.52,0.47,2.97,-0.50,0.42,2.84,0.05,0.70,3.17,0.31,0.64,2.99,0.49,0.74,2.77,0.54,0.78,2.73,-0.22,0.29,3.20,-0.25,-0.26,3.27,-0.23,-0.64,3.38,-0.24,-0.71,3.32,-0.05,0.30,3.21,-0.06,-0.12,2.97,-0.08,-0.53,3.01,-0.06,-0.61,2.93,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 54:{var d=[0,0,0,0,-0.14,0.39,3.20,-0.14,0.46,3.21,-0.14,0.80,3.19,-0.14,0.98,3.13,-0.34,0.69,3.20,-0.46,0.49,3.20,-0.50,0.38,2.95,-0.48,0.31,2.87,0.06,0.71,3.17,0.31,0.69,2.97,0.47,0.81,2.78,0.53,0.87,2.71,-0.22,0.29,3.20,-0.24,-0.26,3.27,-0.23,-0.64,3.38,-0.24,-0.71,3.32,-0.05,0.31,3.21,-0.04,-0.11,2.93,-0.07,-0.52,3.00,-0.05,-0.59,2.91,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 55:{var d=[0,0,0,0,-0.13,0.39,3.20,-0.13,0.46,3.20,-0.14,0.80,3.19,-0.13,0.99,3.13,-0.33,0.69,3.19,-0.45,0.49,3.20,-0.48,0.29,2.98,-0.46,0.20,2.90,0.06,0.72,3.16,0.31,0.76,2.96,0.45,0.90,2.77,0.51,0.97,2.70,-0.21,0.30,3.19,-0.24,-0.26,3.28,-0.23,-0.65,3.38,-0.24,-0.71,3.32,-0.04,0.32,3.20,-0.03,-0.11,2.92,-0.05,-0.50,2.96,-0.04,-0.58,2.87,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 56:{var d=[0,0,0,0,-0.13,0.40,3.18,-0.13,0.47,3.19,-0.14,0.81,3.19,-0.13,0.99,3.13,-0.32,0.69,3.19,-0.45,0.47,3.20,-0.47,0.20,3.01,-0.46,0.10,2.97,0.06,0.73,3.15,0.31,0.82,2.94,0.41,0.98,2.79,0.46,1.06,2.72,-0.21,0.30,3.18,-0.24,-0.25,3.28,-0.23,-0.65,3.38,-0.24,-0.71,3.32,-0.04,0.32,3.18,-0.02,-0.11,2.91,-0.03,-0.52,2.91,-0.02,-0.58,2.82,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 57:{var d=[0,0,0,0,-0.12,0.40,3.16,-0.12,0.47,3.17,-0.12,0.81,3.16,-0.12,0.99,3.12,-0.32,0.69,3.18,-0.45,0.45,3.19,-0.46,0.13,3.05,-0.45,0.05,3.04,0.08,0.73,3.11,0.30,0.89,2.93,0.39,1.06,2.80,0.43,1.14,2.74,-0.20,0.31,3.16,-0.23,-0.25,3.28,-0.22,-0.65,3.38,-0.24,-0.71,3.33,-0.03,0.32,3.16,-0.01,-0.12,2.90,-0.02,-0.53,2.88,-0.01,-0.59,2.78,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 58:{var d=[0,0,0,0,-0.11,0.40,3.14,-0.11,0.47,3.15,-0.11,0.81,3.14,-0.09,0.98,3.09,-0.30,0.70,3.16,-0.44,0.43,3.19,-0.45,0.09,3.12,-0.45,0.00,3.13,0.09,0.74,3.09,0.28,0.91,2.94,0.36,1.09,2.84,0.38,1.15,2.79,-0.20,0.31,3.14,-0.23,-0.25,3.28,-0.22,-0.65,3.38,-0.24,-0.71,3.33,-0.03,0.32,3.14,0.00,-0.15,2.87,-0.01,-0.55,2.84,0.01,-0.61,2.74,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 59:{var d=[0,0,0,0,-0.10,0.40,3.12,-0.10,0.47,3.13,-0.10,0.80,3.12,-0.08,0.98,3.06,-0.28,0.69,3.13,-0.42,0.42,3.19,-0.43,0.09,3.19,-0.45,-0.01,3.21,0.10,0.74,3.08,0.27,0.92,2.95,0.33,1.12,2.86,0.35,1.17,2.83,-0.19,0.31,3.12,-0.23,-0.25,3.28,-0.22,-0.65,3.38,-0.24,-0.71,3.33,-0.02,0.32,3.11,0.01,-0.18,2.86,0.00,-0.57,2.82,0.01,-0.63,2.72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 60:{var d=[0,0,0,0,-0.10,0.39,3.09,-0.10,0.46,3.10,-0.09,0.80,3.10,-0.07,0.98,3.04,-0.27,0.69,3.09,-0.40,0.42,3.19,-0.41,0.10,3.26,-0.43,-0.00,3.28,0.10,0.74,3.06,0.26,0.93,2.95,0.32,1.13,2.87,0.33,1.16,2.85,-0.18,0.30,3.09,-0.22,-0.24,3.26,-0.22,-0.65,3.38,-0.24,-0.71,3.33,-0.02,0.31,3.09,0.01,-0.22,2.85,0.00,-0.60,2.80,0.02,-0.65,2.70,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 61:{var d=[0,0,0,0,-0.09,0.38,3.06,-0.09,0.45,3.08,-0.09,0.79,3.08,-0.06,0.97,3.01,-0.25,0.69,3.06,-0.37,0.43,3.19,-0.40,0.13,3.30,-0.41,0.04,3.33,0.11,0.74,3.05,0.25,0.94,2.95,0.31,1.14,2.88,0.31,1.19,2.87,-0.17,0.30,3.06,-0.21,-0.24,3.23,-0.22,-0.65,3.38,-0.24,-0.71,3.33,-0.01,0.30,3.06,0.01,-0.24,2.84,0.00,-0.62,2.79,0.02,-0.67,2.68,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 62:{var d=[0,0,0,0,-0.09,0.37,3.03,-0.09,0.44,3.05,-0.08,0.78,3.05,-0.05,0.95,2.98,-0.24,0.68,3.04,-0.35,0.43,3.19,-0.38,0.16,3.32,-0.39,0.08,3.35,0.11,0.73,3.03,0.25,0.93,2.95,0.30,1.14,2.88,0.31,1.17,2.88,-0.17,0.29,3.03,-0.21,-0.25,3.18,-0.21,-0.65,3.37,-0.24,-0.71,3.33,-0.01,0.29,3.03,0.00,-0.26,2.84,-0.02,-0.65,2.79,-0.01,-0.71,2.69,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 63:{var d=[0,0,0,0,-0.08,0.37,3.01,-0.08,0.43,3.02,-0.07,0.77,3.02,-0.03,0.94,2.95,-0.23,0.68,3.01,-0.33,0.44,3.18,-0.36,0.19,3.31,-0.38,0.10,3.38,0.13,0.73,3.00,0.25,0.92,2.93,0.31,1.13,2.87,0.31,1.15,2.88,-0.16,0.29,3.00,-0.22,-0.26,3.13,-0.21,-0.65,3.36,-0.25,-0.71,3.31,-0.00,0.29,3.01,-0.00,-0.27,2.84,-0.03,-0.67,2.79,-0.03,-0.74,2.70,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 64:{var d=[0,0,0,0,-0.07,0.36,2.98,-0.07,0.43,3.00,-0.06,0.76,2.98,-0.02,0.94,2.93,-0.22,0.67,2.99,-0.32,0.45,3.16,-0.35,0.25,3.28,-0.37,0.18,3.33,0.14,0.72,2.96,0.26,0.90,2.90,0.32,1.11,2.84,0.34,1.16,2.84,-0.15,0.28,2.98,-0.23,-0.27,3.06,-0.22,-0.63,3.33,-0.25,-0.71,3.30,0.00,0.28,2.98,-0.01,-0.28,2.83,-0.05,-0.69,2.79,-0.04,-0.76,2.71,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 65:{var d=[0,0,0,0,-0.07,0.36,2.96,-0.06,0.43,2.97,-0.05,0.76,2.95,-0.01,0.94,2.90,-0.21,0.67,2.96,-0.31,0.45,3.13,-0.35,0.27,3.23,-0.36,0.20,3.27,0.15,0.71,2.94,0.28,0.87,2.86,0.32,1.09,2.81,0.35,1.15,2.80,-0.15,0.28,2.95,-0.25,-0.27,2.98,-0.23,-0.60,3.27,-0.26,-0.71,3.30,0.01,0.28,2.96,-0.01,-0.29,2.82,-0.05,-0.69,2.79,-0.05,-0.76,2.71,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 66:{var d=[0,0,0,0,-0.06,0.36,2.94,-0.06,0.42,2.95,-0.04,0.76,2.94,0.01,0.93,2.89,-0.21,0.67,2.95,-0.30,0.44,3.09,-0.36,0.18,3.16,-0.37,0.15,3.20,0.17,0.70,2.92,0.32,0.84,2.81,0.34,1.06,2.74,0.35,1.11,2.74,-0.14,0.28,2.94,-0.27,-0.25,2.90,-0.25,-0.58,3.20,-0.27,-0.64,3.13,0.01,0.27,2.94,-0.02,-0.29,2.80,-0.06,-0.70,2.79,-0.05,-0.76,2.71,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 67:{var d=[0,0,0,0,-0.06,0.36,2.92,-0.05,0.42,2.94,-0.02,0.76,2.92,0.02,0.93,2.87,-0.20,0.67,2.94,-0.30,0.43,3.06,-0.37,0.16,3.08,-0.39,0.09,3.07,0.18,0.69,2.90,0.35,0.82,2.76,0.36,1.03,2.67,0.35,1.09,2.66,-0.14,0.28,2.92,-0.28,-0.23,2.82,-0.27,-0.55,3.11,-0.28,-0.65,3.11,0.02,0.27,2.92,-0.02,-0.29,2.79,-0.06,-0.69,2.79,-0.05,-0.76,2.72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 68:{var d=[0,0,0,0,-0.05,0.36,2.91,-0.04,0.42,2.93,-0.01,0.76,2.91,0.03,0.94,2.86,-0.19,0.67,2.93,-0.31,0.42,3.01,-0.40,0.16,2.97,-0.42,0.08,2.94,0.19,0.68,2.88,0.37,0.79,2.71,0.37,0.99,2.60,0.36,1.04,2.58,-0.14,0.28,2.91,-0.30,-0.19,2.76,-0.28,-0.54,3.01,-0.29,-0.65,3.02,0.02,0.27,2.91,-0.02,-0.29,2.78,-0.06,-0.69,2.79,-0.05,-0.75,2.72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 69:{var d=[0,0,0,0,-0.05,0.36,2.90,-0.04,0.42,2.92,-0.00,0.76,2.91,0.04,0.94,2.85,-0.18,0.67,2.92,-0.32,0.43,2.97,-0.43,0.20,2.85,-0.46,0.13,2.79,0.20,0.67,2.87,0.38,0.75,2.67,0.38,0.93,2.52,0.37,0.98,2.49,-0.14,0.28,2.90,-0.31,-0.15,2.70,-0.28,-0.52,2.92,-0.30,-0.62,2.88,0.02,0.27,2.89,-0.01,-0.29,2.77,-0.06,-0.68,2.79,-0.05,-0.75,2.72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 70:{var d=[0,0,0,0,-0.04,0.36,2.89,-0.04,0.42,2.91,0.00,0.76,2.90,0.04,0.94,2.85,-0.18,0.67,2.92,-0.33,0.45,2.94,-0.45,0.32,2.78,-0.49,0.26,2.70,0.20,0.67,2.86,0.38,0.70,2.62,0.39,0.88,2.43,0.38,0.93,2.37,-0.13,0.29,2.89,-0.32,-0.12,2.66,-0.28,-0.51,2.80,-0.31,-0.59,2.74,0.03,0.27,2.87,-0.01,-0.29,2.76,-0.06,-0.68,2.79,-0.05,-0.74,2.72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 71:{var d=[0,0,0,0,-0.04,0.36,2.88,-0.03,0.43,2.90,0.01,0.76,2.90,0.05,0.94,2.84,-0.17,0.67,2.92,-0.34,0.49,2.92,-0.47,0.44,2.72,-0.52,0.41,2.63,0.20,0.66,2.85,0.37,0.64,2.58,0.40,0.81,2.33,0.39,0.86,2.27,-0.13,0.29,2.88,-0.34,-0.07,2.62,-0.30,-0.50,2.67,-0.34,-0.55,2.58,0.03,0.27,2.85,-0.01,-0.29,2.76,-0.06,-0.67,2.79,-0.06,-0.74,2.72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 72:{var d=[0,0,0,0,-0.04,0.36,2.86,-0.02,0.43,2.89,0.02,0.77,2.90,0.05,0.95,2.84,-0.17,0.68,2.92,-0.36,0.56,2.89,-0.49,0.55,2.66,-0.53,0.56,2.57,0.20,0.66,2.84,0.34,0.58,2.56,0.40,0.70,2.28,0.41,0.75,2.23,-0.13,0.30,2.87,-0.35,-0.03,2.59,-0.33,-0.46,2.55,-0.37,-0.49,2.45,0.03,0.27,2.84,-0.01,-0.29,2.76,-0.06,-0.67,2.79,-0.05,-0.74,2.72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 73:{var d=[0,0,0,0,-0.03,0.37,2.86,-0.02,0.43,2.89,0.02,0.77,2.89,0.05,0.95,2.84,-0.17,0.69,2.93,-0.38,0.63,2.85,-0.49,0.69,2.61,-0.52,0.74,2.50,0.19,0.67,2.83,0.32,0.53,2.56,0.40,0.56,2.30,0.42,0.60,2.22,-0.12,0.30,2.86,-0.36,0.00,2.57,-0.37,-0.41,2.45,-0.42,-0.44,2.36,0.04,0.28,2.83,-0.01,-0.29,2.76,-0.06,-0.67,2.79,-0.05,-0.74,2.73,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 74:{var d=[0,0,0,0,-0.03,0.37,2.85,-0.01,0.43,2.88,0.02,0.78,2.89,0.05,0.95,2.83,-0.17,0.70,2.93,-0.42,0.72,2.78,-0.50,0.86,2.56,-0.50,0.92,2.51,0.19,0.67,2.81,0.28,0.52,2.60,0.37,0.42,2.40,0.40,0.44,2.23,-0.12,0.30,2.85,-0.36,0.02,2.56,-0.42,-0.37,2.35,-0.47,-0.38,2.26,0.04,0.28,2.82,-0.01,-0.29,2.76,-0.06,-0.67,2.79,-0.05,-0.74,2.73,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 75:{var d=[0,0,0,0,-0.03,0.38,2.84,-0.01,0.44,2.88,0.02,0.78,2.89,0.05,0.95,2.82,-0.18,0.72,2.93,-0.44,0.82,2.75,-0.47,1.00,2.58,-0.47,1.06,2.54,0.18,0.67,2.80,0.27,0.47,2.59,0.37,0.32,2.41,0.38,0.31,2.28,-0.12,0.31,2.85,-0.36,0.05,2.55,-0.47,-0.31,2.26,-0.52,-0.34,2.19,0.04,0.28,2.81,-0.01,-0.29,2.76,-0.06,-0.67,2.79,-0.05,-0.74,2.73,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 76:{var d=[0,0,0,0,-0.03,0.39,2.84,-0.01,0.45,2.87,0.02,0.78,2.88,0.04,0.95,2.81,-0.19,0.74,2.92,-0.43,0.88,2.77,-0.46,1.07,2.65,-0.46,1.14,2.62,0.18,0.66,2.79,0.27,0.42,2.60,0.35,0.24,2.44,0.37,0.22,2.32,-0.13,0.32,2.85,-0.36,0.06,2.54,-0.49,-0.29,2.23,-0.54,-0.32,2.16,0.04,0.29,2.81,-0.01,-0.28,2.76,-0.06,-0.67,2.79,-0.05,-0.74,2.73,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 77:{var d=[0,0,0,0,-0.04,0.40,2.83,-0.02,0.45,2.86,0.02,0.78,2.86,0.04,0.95,2.79,-0.20,0.76,2.90,-0.40,0.92,2.79,-0.44,1.14,2.72,-0.44,1.25,2.70,0.17,0.66,2.78,0.27,0.40,2.61,0.34,0.18,2.48,0.37,0.12,2.40,-0.13,0.32,2.84,-0.36,0.07,2.53,-0.47,-0.25,2.25,-0.50,-0.29,2.17,0.04,0.29,2.80,-0.01,-0.28,2.76,-0.06,-0.67,2.79,-0.05,-0.74,2.73,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 78:{var d=[0,0,0,0,-0.04,0.40,2.82,-0.02,0.46,2.86,0.01,0.79,2.84,0.03,0.95,2.77,-0.21,0.77,2.88,-0.39,0.95,2.80,-0.40,1.18,2.75,-0.42,1.28,2.76,0.17,0.66,2.78,0.25,0.39,2.65,0.33,0.14,2.53,0.35,0.05,2.47,-0.14,0.33,2.83,-0.36,0.07,2.52,-0.50,-0.26,2.20,-0.52,-0.30,2.12,0.03,0.30,2.80,-0.01,-0.28,2.76,-0.06,-0.67,2.79,-0.05,-0.74,2.73,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 79:{var d=[0,0,0,0,-0.04,0.41,2.82,-0.03,0.47,2.84,0.00,0.79,2.81,0.03,0.95,2.75,-0.21,0.78,2.86,-0.37,0.99,2.80,-0.36,1.27,2.78,-0.35,1.34,2.79,0.17,0.66,2.78,0.24,0.36,2.69,0.31,0.07,2.60,0.34,-0.00,2.56,-0.14,0.34,2.83,-0.35,0.07,2.51,-0.49,-0.27,2.21,-0.54,-0.30,2.11,0.03,0.30,2.79,-0.01,-0.27,2.76,-0.06,-0.67,2.79,-0.05,-0.74,2.72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 80:{var d=[0,0,0,0,-0.05,0.41,2.80,-0.04,0.47,2.83,0.00,0.79,2.79,0.03,0.96,2.74,-0.21,0.79,2.84,-0.35,1.02,2.80,-0.35,1.29,2.80,-0.34,1.37,2.81,0.17,0.66,2.77,0.23,0.35,2.72,0.29,0.06,2.67,0.26,0.00,2.64,-0.15,0.34,2.81,-0.35,0.04,2.48,-0.47,-0.33,2.23,-0.52,-0.34,2.13,0.03,0.30,2.79,-0.01,-0.27,2.76,-0.06,-0.67,2.79,-0.05,-0.74,2.72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 81:{var d=[0,0,0,0,-0.05,0.41,2.79,-0.04,0.48,2.82,-0.00,0.79,2.79,0.03,0.96,2.73,-0.21,0.80,2.83,-0.34,1.03,2.80,-0.34,1.30,2.81,-0.32,1.38,2.82,0.16,0.66,2.77,0.23,0.35,2.75,0.26,0.05,2.73,0.24,-0.03,2.71,-0.15,0.35,2.79,-0.35,0.02,2.46,-0.44,-0.38,2.28,-0.48,-0.40,2.18,0.02,0.31,2.78,-0.01,-0.27,2.77,-0.06,-0.67,2.79,-0.05,-0.74,2.72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 82:{var d=[0,0,0,0,-0.06,0.42,2.78,-0.05,0.48,2.80,-0.00,0.79,2.78,0.03,0.96,2.72,-0.21,0.80,2.82,-0.33,1.04,2.80,-0.32,1.30,2.80,-0.30,1.38,2.81,0.16,0.67,2.77,0.22,0.36,2.77,0.23,0.07,2.78,0.23,-0.02,2.77,-0.15,0.35,2.78,-0.35,-0.02,2.46,-0.40,-0.45,2.34,-0.44,-0.47,2.23,0.02,0.31,2.77,-0.01,-0.27,2.77,-0.06,-0.67,2.79,-0.06,-0.74,2.72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 83:{var d=[0,0,0,0,-0.06,0.42,2.77,-0.05,0.48,2.80,-0.00,0.79,2.77,0.02,0.96,2.71,-0.20,0.80,2.81,-0.33,1.03,2.79,-0.31,1.29,2.79,-0.29,1.37,2.80,0.16,0.67,2.76,0.21,0.37,2.79,0.22,0.14,2.82,0.22,0.04,2.81,-0.15,0.35,2.77,-0.34,-0.05,2.46,-0.37,-0.51,2.40,-0.40,-0.56,2.29,0.01,0.31,2.76,-0.02,-0.26,2.77,-0.06,-0.67,2.79,-0.05,-0.74,2.72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 84:{var d=[0,0,0,0,-0.06,0.42,2.76,-0.05,0.48,2.78,-0.01,0.80,2.76,0.02,0.97,2.70,-0.20,0.81,2.80,-0.33,1.02,2.77,-0.42,1.24,2.75,-0.46,1.31,2.75,0.16,0.67,2.76,0.20,0.38,2.80,0.21,0.17,2.85,0.21,0.07,2.85,-0.16,0.35,2.76,-0.33,-0.10,2.47,-0.34,-0.57,2.46,-0.35,-0.64,2.36,0.01,0.32,2.76,-0.02,-0.26,2.77,-0.06,-0.67,2.79,-0.05,-0.74,2.72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 85:{var d=[0,0,0,0,-0.07,0.42,2.75,-0.06,0.48,2.77,-0.02,0.80,2.75,0.02,0.97,2.70,-0.21,0.80,2.79,-0.36,1.01,2.73,-0.50,1.20,2.70,-0.55,1.26,2.69,0.16,0.67,2.76,0.20,0.39,2.80,0.18,0.13,2.84,0.19,0.03,2.86,-0.16,0.35,2.75,-0.31,-0.13,2.50,-0.32,-0.60,2.51,-0.32,-0.70,2.45,0.01,0.32,2.75,-0.02,-0.26,2.77,-0.06,-0.67,2.79,-0.05,-0.74,2.72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 86:{var d=[0,0,0,0,-0.07,0.42,2.74,-0.06,0.48,2.76,-0.02,0.80,2.74,0.02,0.97,2.69,-0.22,0.79,2.77,-0.38,0.97,2.69,-0.35,1.16,2.70,-0.31,1.23,2.71,0.15,0.67,2.75,0.19,0.39,2.81,0.17,0.15,2.85,0.18,0.05,2.87,-0.17,0.34,2.72,-0.29,-0.20,2.53,-0.29,-0.66,2.59,-0.29,-0.75,2.54,0.00,0.32,2.73,-0.03,-0.26,2.76,-0.06,-0.67,2.79,-0.05,-0.74,2.72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 87:{var d=[0,0,0,0,-0.08,0.41,2.72,-0.07,0.48,2.75,-0.03,0.80,2.74,0.01,0.97,2.69,-0.23,0.77,2.75,-0.40,0.93,2.65,-0.36,1.14,2.62,-0.34,1.21,2.61,0.15,0.67,2.75,0.19,0.40,2.81,0.16,0.17,2.85,0.17,0.07,2.86,-0.17,0.34,2.70,-0.28,-0.24,2.56,-0.26,-0.68,2.67,-0.28,-0.76,2.62,-0.00,0.31,2.72,-0.04,-0.26,2.73,-0.06,-0.67,2.79,-0.05,-0.74,2.72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 88:{var d=[0,0,0,0,-0.08,0.40,2.71,-0.08,0.47,2.74,-0.03,0.80,2.74,0.00,0.98,2.69,-0.24,0.75,2.73,-0.42,0.87,2.61,-0.36,1.09,2.55,-0.32,1.15,2.55,0.14,0.68,2.75,0.18,0.40,2.80,0.15,0.14,2.83,0.16,0.04,2.85,-0.18,0.32,2.68,-0.26,-0.27,2.59,-0.23,-0.67,2.72,-0.27,-0.75,2.66,-0.01,0.31,2.71,-0.04,-0.27,2.67,-0.06,-0.67,2.79,-0.05,-0.74,2.72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 89:{var d=[0,0,0,0,-0.09,0.39,2.70,-0.08,0.46,2.73,-0.04,0.80,2.74,-0.02,0.97,2.70,-0.25,0.73,2.72,-0.45,0.80,2.57,-0.35,1.01,2.48,-0.29,1.07,2.47,0.13,0.68,2.75,0.17,0.40,2.80,0.15,0.11,2.82,0.16,0.01,2.83,-0.18,0.31,2.67,-0.26,-0.29,2.62,-0.23,-0.66,2.73,-0.27,-0.74,2.67,-0.02,0.30,2.70,-0.04,-0.27,2.59,-0.07,-0.66,2.76,-0.05,-0.74,2.71,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 90:{var d=[0,0,0,0,-0.10,0.39,2.69,-0.09,0.45,2.72,-0.06,0.80,2.74,-0.04,0.97,2.70,-0.27,0.68,2.70,-0.45,0.73,2.52,-0.30,0.91,2.42,-0.24,0.97,2.40,0.11,0.68,2.75,0.15,0.40,2.79,0.15,0.11,2.81,0.16,0.02,2.81,-0.18,0.31,2.66,-0.25,-0.30,2.64,-0.23,-0.66,2.73,-0.27,-0.73,2.69,-0.02,0.30,2.69,-0.01,-0.25,2.50,-0.07,-0.64,2.68,-0.04,-0.73,2.67,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 91:{var d=[0,0,0,0,-0.10,0.38,2.68,-0.10,0.44,2.72,-0.10,0.78,2.74,-0.06,0.97,2.71,-0.30,0.68,2.70,-0.46,0.65,2.49,-0.28,0.79,2.34,-0.21,0.84,2.32,0.08,0.68,2.75,0.14,0.39,2.78,0.15,0.11,2.79,0.16,0.01,2.78,-0.19,0.30,2.66,-0.25,-0.30,2.65,-0.23,-0.65,2.73,-0.28,-0.73,2.69,-0.03,0.30,2.69,0.01,-0.20,2.42,-0.05,-0.61,2.58,-0.03,-0.70,2.55,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 92:{var d=[0,0,0,0,-0.11,0.38,2.68,-0.11,0.44,2.72,-0.11,0.77,2.74,-0.07,0.97,2.71,-0.31,0.67,2.69,-0.46,0.57,2.47,-0.26,0.66,2.27,-0.19,0.69,2.23,0.07,0.68,2.75,0.13,0.39,2.78,0.15,0.11,2.77,0.16,0.01,2.76,-0.19,0.30,2.66,-0.26,-0.27,2.65,-0.24,-0.64,2.72,-0.28,-0.72,2.68,-0.03,0.30,2.68,0.03,-0.12,2.36,-0.05,-0.53,2.46,-0.02,-0.62,2.40,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 93:{var d=[0,0,0,0,-0.11,0.37,2.68,-0.12,0.43,2.72,-0.12,0.77,2.74,-0.08,0.96,2.70,-0.31,0.67,2.69,-0.44,0.51,2.52,-0.40,0.51,2.29,-0.36,0.53,2.23,0.06,0.67,2.75,0.12,0.39,2.78,0.16,0.14,2.77,0.17,0.06,2.77,-0.20,0.29,2.65,-0.26,-0.26,2.65,-0.24,-0.64,2.71,-0.28,-0.71,2.67,-0.04,0.29,2.68,0.05,-0.04,2.30,-0.02,-0.43,2.32,-0.01,-0.50,2.23,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 94:{var d=[0,0,0,0,-0.12,0.37,2.68,-0.12,0.43,2.72,-0.13,0.77,2.74,-0.09,0.95,2.69,-0.32,0.66,2.69,-0.45,0.45,2.50,-0.34,0.35,2.25,-0.29,0.34,2.19,0.05,0.67,2.75,0.12,0.38,2.78,0.16,0.16,2.77,0.17,0.08,2.77,-0.20,0.29,2.66,-0.26,-0.25,2.65,-0.24,-0.64,2.71,-0.28,-0.71,2.66,-0.04,0.29,2.68,0.07,0.04,2.26,0.01,-0.33,2.16,0.01,-0.38,2.06,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 95:{var d=[0,0,0,0,-0.12,0.37,2.68,-0.13,0.43,2.72,-0.14,0.76,2.73,-0.10,0.95,2.68,-0.32,0.66,2.69,-0.45,0.42,2.51,-0.33,0.25,2.28,-0.31,0.18,2.25,0.04,0.67,2.75,0.11,0.38,2.78,0.19,0.19,2.80,0.21,0.12,2.80,-0.20,0.28,2.66,-0.26,-0.24,2.64,-0.24,-0.64,2.70,-0.28,-0.71,2.65,-0.04,0.29,2.68,0.08,0.10,2.23,0.02,-0.22,2.08,0.05,-0.25,1.97,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 96:{var d=[0,0,0,0,-0.12,0.37,2.68,-0.13,0.43,2.72,-0.14,0.76,2.73,-0.11,0.94,2.66,-0.32,0.65,2.68,-0.44,0.40,2.52,-0.36,0.17,2.34,-0.34,0.08,2.32,0.04,0.67,2.75,0.10,0.39,2.77,0.24,0.26,2.84,0.26,0.19,2.84,-0.20,0.28,2.66,-0.26,-0.24,2.64,-0.24,-0.64,2.70,-0.28,-0.71,2.65,-0.04,0.29,2.69,0.10,0.17,2.20,0.08,-0.18,1.90,0.10,-0.19,1.77,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 97:{var d=[0,0,0,0,-0.13,0.36,2.68,-0.14,0.42,2.72,-0.15,0.75,2.72,-0.11,0.93,2.64,-0.32,0.65,2.67,-0.43,0.37,2.53,-0.38,0.11,2.41,-0.38,0.01,2.41,0.04,0.66,2.74,0.09,0.41,2.77,0.25,0.29,2.86,0.27,0.22,2.86,-0.22,0.27,2.66,-0.26,-0.23,2.64,-0.24,-0.64,2.70,-0.28,-0.71,2.65,-0.05,0.29,2.69,0.10,0.23,2.18,0.13,-0.08,1.81,0.08,-0.13,1.84,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 98:{var d=[0,0,0,0,-0.14,0.36,2.68,-0.15,0.42,2.72,-0.15,0.75,2.68,-0.12,0.92,2.62,-0.32,0.64,2.66,-0.43,0.35,2.55,-0.41,0.06,2.46,-0.41,-0.03,2.47,0.03,0.66,2.73,0.09,0.44,2.76,0.26,0.31,2.87,0.27,0.24,2.87,-0.23,0.27,2.65,-0.26,-0.23,2.63,-0.24,-0.64,2.70,-0.28,-0.71,2.64,-0.06,0.28,2.69,0.10,0.29,2.22,0.14,0.00,1.81,0.11,0.01,1.77,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 99:{var d=[0,0,0,0,-0.15,0.35,2.67,-0.15,0.42,2.71,-0.14,0.74,2.66,-0.11,0.91,2.61,-0.32,0.64,2.65,-0.42,0.34,2.57,-0.44,0.05,2.52,-0.44,-0.03,2.53,0.03,0.66,2.72,0.08,0.45,2.76,0.26,0.33,2.87,0.27,0.26,2.88,-0.23,0.27,2.65,-0.25,-0.23,2.63,-0.24,-0.64,2.69,-0.28,-0.71,2.64,-0.06,0.28,2.68,0.10,0.34,2.24,0.10,0.13,1.85,0.09,0.16,1.73,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 100:{var d=[0,0,0,0,-0.16,0.35,2.66,-0.16,0.41,2.69,-0.14,0.74,2.65,-0.11,0.91,2.59,-0.32,0.64,2.65,-0.41,0.34,2.59,-0.45,0.06,2.56,-0.45,-0.02,2.57,0.03,0.65,2.70,0.08,0.45,2.75,0.26,0.34,2.87,0.27,0.27,2.88,-0.24,0.27,2.65,-0.25,-0.22,2.63,-0.24,-0.64,2.69,-0.27,-0.71,2.64,-0.07,0.27,2.68,0.09,0.35,2.25,0.10,0.19,1.85,0.07,0.21,1.77,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 101:{var d=[0,0,0,0,-0.16,0.35,2.65,-0.16,0.41,2.68,-0.14,0.74,2.64,-0.11,0.90,2.57,-0.32,0.64,2.64,-0.41,0.34,2.60,-0.48,0.06,2.61,-0.48,-0.01,2.62,0.03,0.65,2.69,0.07,0.46,2.75,0.26,0.36,2.86,0.27,0.29,2.87,-0.25,0.27,2.64,-0.24,-0.22,2.62,-0.24,-0.64,2.69,-0.27,-0.71,2.64,-0.08,0.27,2.67,0.09,0.36,2.26,0.10,0.20,1.89,0.07,0.25,1.79,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 102:{var d=[0,0,0,0,-0.16,0.35,2.65,-0.16,0.41,2.67,-0.14,0.73,2.63,-0.10,0.90,2.56,-0.31,0.64,2.64,-0.42,0.34,2.62,-0.48,0.08,2.62,-0.48,0.01,2.63,0.04,0.65,2.68,0.07,0.46,2.74,0.26,0.37,2.86,0.27,0.30,2.86,-0.25,0.27,2.63,-0.24,-0.22,2.62,-0.24,-0.64,2.69,-0.27,-0.72,2.64,-0.08,0.27,2.66,0.09,0.36,2.26,0.09,0.24,1.89,0.07,0.26,1.80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 103:{var d=[0,0,0,0,-0.16,0.35,2.64,-0.16,0.41,2.66,-0.14,0.73,2.62,-0.10,0.90,2.55,-0.31,0.64,2.63,-0.42,0.35,2.62,-0.49,0.09,2.63,-0.49,0.02,2.65,0.04,0.65,2.67,0.08,0.46,2.72,0.26,0.37,2.84,0.27,0.30,2.85,-0.25,0.27,2.62,-0.24,-0.22,2.62,-0.24,-0.64,2.69,-0.27,-0.72,2.64,-0.08,0.27,2.65,0.10,0.32,2.24,0.10,0.19,1.91,0.07,0.22,1.82,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 104:{var d=[0,0,0,0,-0.16,0.35,2.63,-0.16,0.41,2.65,-0.13,0.73,2.61,-0.10,0.90,2.54,-0.31,0.64,2.62,-0.43,0.36,2.63,-0.49,0.10,2.64,-0.49,0.03,2.65,0.04,0.65,2.66,0.09,0.45,2.70,0.24,0.33,2.81,0.26,0.26,2.81,-0.25,0.27,2.62,-0.24,-0.22,2.62,-0.24,-0.64,2.69,-0.27,-0.72,2.64,-0.08,0.27,2.65,0.11,0.24,2.18,0.11,0.10,1.88,0.08,0.13,1.80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 105:{var d=[0,0,0,0,-0.14,0.35,2.63,-0.14,0.42,2.64,-0.13,0.73,2.61,-0.09,0.90,2.54,-0.31,0.64,2.62,-0.44,0.37,2.64,-0.50,0.11,2.63,-0.49,0.04,2.65,0.05,0.65,2.65,0.11,0.44,2.69,0.24,0.28,2.75,0.25,0.21,2.76,-0.23,0.28,2.61,-0.23,-0.22,2.62,-0.24,-0.64,2.69,-0.27,-0.72,2.64,-0.06,0.27,2.64,0.11,0.14,2.16,0.12,-0.19,1.87,0.12,-0.10,1.79,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 106:{var d=[0,0,0,0,-0.13,0.36,2.62,-0.13,0.42,2.63,-0.13,0.74,2.60,-0.09,0.91,2.53,-0.30,0.65,2.61,-0.44,0.39,2.64,-0.50,0.13,2.63,-0.49,0.06,2.64,0.05,0.65,2.64,0.12,0.42,2.68,0.23,0.22,2.72,0.26,0.19,2.75,-0.21,0.28,2.61,-0.23,-0.22,2.62,-0.24,-0.64,2.69,-0.27,-0.72,2.64,-0.04,0.28,2.63,0.11,0.04,2.16,0.11,-0.27,1.99,0.12,-0.27,1.87,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 107:{var d=[0,0,0,0,-0.11,0.36,2.61,-0.12,0.43,2.62,-0.12,0.75,2.59,-0.08,0.92,2.53,-0.29,0.66,2.60,-0.44,0.40,2.63,-0.50,0.14,2.62,-0.49,0.07,2.63,0.06,0.66,2.63,0.13,0.41,2.68,0.21,0.18,2.70,0.22,0.15,2.71,-0.20,0.28,2.60,-0.23,-0.23,2.62,-0.24,-0.64,2.69,-0.27,-0.72,2.64,-0.02,0.28,2.63,0.10,-0.06,2.18,0.10,-0.43,2.06,0.12,-0.47,1.95,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 108:{var d=[0,0,0,0,-0.10,0.36,2.60,-0.10,0.43,2.61,-0.11,0.76,2.58,-0.07,0.93,2.52,-0.28,0.66,2.59,-0.44,0.41,2.63,-0.50,0.15,2.62,-0.50,0.07,2.63,0.07,0.66,2.62,0.14,0.40,2.68,0.20,0.17,2.69,0.21,0.11,2.69,-0.18,0.28,2.59,-0.23,-0.23,2.63,-0.24,-0.64,2.69,-0.27,-0.72,2.64,-0.01,0.29,2.62,0.08,-0.15,2.22,0.08,-0.56,2.15,0.09,-0.60,2.04,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 109:{var d=[0,0,0,0,-0.09,0.36,2.59,-0.09,0.43,2.59,-0.10,0.76,2.57,-0.05,0.94,2.52,-0.27,0.67,2.58,-0.44,0.42,2.62,-0.50,0.16,2.61,-0.50,0.08,2.62,0.08,0.66,2.61,0.14,0.40,2.67,0.20,0.15,2.68,0.20,0.07,2.66,-0.17,0.28,2.58,-0.23,-0.24,2.63,-0.24,-0.64,2.69,-0.27,-0.72,2.64,-0.00,0.29,2.60,0.06,-0.25,2.27,0.06,-0.65,2.26,0.07,-0.72,2.17,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 110:{var d=[0,0,0,0,-0.08,0.36,2.57,-0.08,0.43,2.58,-0.08,0.77,2.56,-0.03,0.94,2.51,-0.26,0.68,2.56,-0.42,0.43,2.61,-0.50,0.17,2.60,-0.50,0.09,2.61,0.11,0.66,2.59,0.16,0.39,2.67,0.20,0.15,2.67,0.19,0.05,2.65,-0.16,0.28,2.56,-0.23,-0.25,2.63,-0.24,-0.64,2.69,-0.27,-0.72,2.64,0.01,0.28,2.57,0.03,-0.29,2.33,0.02,-0.71,2.40,0.03,-0.78,2.34,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 111:{var d=[0,0,0,0,-0.07,0.36,2.55,-0.06,0.43,2.56,-0.04,0.77,2.54,-0.01,0.95,2.50,-0.23,0.68,2.55,-0.41,0.44,2.60,-0.50,0.18,2.59,-0.50,0.10,2.60,0.14,0.66,2.57,0.18,0.38,2.66,0.19,0.14,2.66,0.19,0.04,2.64,-0.15,0.28,2.54,-0.23,-0.27,2.62,-0.24,-0.64,2.69,-0.27,-0.72,2.65,0.01,0.27,2.55,0.01,-0.31,2.39,0.01,-0.71,2.50,0.02,-0.78,2.45,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 112:{var d=[0,0,0,0,-0.05,0.35,2.53,-0.05,0.42,2.53,-0.01,0.77,2.52,0.03,0.94,2.48,-0.20,0.68,2.54,-0.39,0.44,2.59,-0.49,0.19,2.59,-0.50,0.10,2.59,0.17,0.65,2.55,0.20,0.38,2.63,0.20,0.12,2.64,0.19,0.02,2.63,-0.14,0.27,2.52,-0.26,-0.28,2.56,-0.24,-0.64,2.68,-0.27,-0.72,2.65,0.02,0.26,2.53,0.00,-0.31,2.44,0.01,-0.69,2.53,0.01,-0.77,2.47,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 113:{var d=[0,0,0,0,-0.04,0.34,2.51,-0.03,0.41,2.52,0.02,0.76,2.50,0.06,0.93,2.46,-0.18,0.67,2.52,-0.37,0.45,2.59,-0.49,0.20,2.59,-0.50,0.11,2.59,0.20,0.64,2.53,0.22,0.37,2.60,0.21,0.11,2.63,0.19,0.01,2.62,-0.13,0.27,2.50,-0.30,-0.27,2.49,-0.26,-0.64,2.64,-0.30,-0.72,2.61,0.03,0.25,2.52,0.00,-0.31,2.45,0.01,-0.69,2.53,0.01,-0.76,2.47,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 114:{var d=[0,0,0,0,-0.03,0.34,2.50,-0.01,0.40,2.50,0.04,0.75,2.48,0.09,0.91,2.42,-0.15,0.67,2.52,-0.35,0.45,2.59,-0.48,0.20,2.58,-0.50,0.12,2.58,0.22,0.63,2.51,0.24,0.36,2.57,0.23,0.09,2.59,0.20,-0.01,2.59,-0.12,0.26,2.50,-0.33,-0.22,2.41,-0.30,-0.62,2.57,-0.33,-0.70,2.52,0.04,0.25,2.51,0.00,-0.30,2.46,0.01,-0.68,2.54,0.01,-0.75,2.48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 115:{var d=[0,0,0,0,-0.01,0.33,2.49,-0.00,0.40,2.50,0.06,0.74,2.47,0.11,0.90,2.41,-0.14,0.67,2.51,-0.33,0.45,2.59,-0.44,0.22,2.59,-0.48,0.13,2.59,0.23,0.62,2.50,0.25,0.35,2.54,0.23,0.08,2.57,0.20,-0.02,2.56,-0.11,0.26,2.49,-0.36,-0.14,2.35,-0.34,-0.56,2.48,-0.36,-0.63,2.41,0.06,0.24,2.50,0.01,-0.29,2.47,0.00,-0.67,2.55,0.01,-0.74,2.48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 116:{var d=[0,0,0,0,0.00,0.33,2.49,0.01,0.40,2.49,0.07,0.73,2.45,0.13,0.89,2.39,-0.11,0.67,2.50,-0.31,0.46,2.58,-0.43,0.23,2.59,-0.47,0.15,2.59,0.24,0.60,2.48,0.26,0.35,2.52,0.25,0.10,2.52,0.22,-0.00,2.51,-0.10,0.26,2.49,-0.39,-0.04,2.30,-0.37,-0.48,2.39,-0.39,-0.54,2.30,0.07,0.23,2.50,0.01,-0.29,2.46,0.00,-0.67,2.54,0.01,-0.73,2.47,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 117:{var d=[0,0,0,0,0.03,0.33,2.48,0.04,0.39,2.48,0.08,0.72,2.44,0.13,0.89,2.38,-0.10,0.67,2.49,-0.29,0.46,2.58,-0.41,0.25,2.60,-0.46,0.17,2.60,0.25,0.60,2.47,0.27,0.34,2.50,0.26,0.08,2.47,0.23,-0.02,2.47,-0.07,0.26,2.48,-0.40,0.06,2.26,-0.41,-0.39,2.29,-0.43,-0.43,2.18,0.10,0.23,2.48,0.01,-0.28,2.45,0.01,-0.67,2.53,0.01,-0.73,2.46,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 118:{var d=[0,0,0,0,0.04,0.32,2.47,0.05,0.39,2.47,0.10,0.71,2.43,0.14,0.88,2.36,-0.09,0.67,2.48,-0.28,0.46,2.58,-0.39,0.27,2.61,-0.45,0.20,2.61,0.25,0.59,2.46,0.27,0.33,2.48,0.26,0.07,2.45,0.23,-0.02,2.43,-0.05,0.26,2.48,-0.41,0.10,2.24,-0.44,-0.30,2.20,-0.46,-0.35,2.09,0.12,0.23,2.48,0.02,-0.28,2.45,0.01,-0.67,2.52,0.01,-0.72,2.46,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 119:{var d=[0,0,0,0,0.05,0.32,2.47,0.06,0.39,2.46,0.10,0.71,2.41,0.14,0.87,2.35,-0.08,0.67,2.47,-0.28,0.46,2.58,-0.39,0.28,2.62,-0.44,0.21,2.62,0.26,0.59,2.44,0.27,0.33,2.46,0.26,0.08,2.42,0.23,-0.01,2.39,-0.04,0.26,2.48,-0.42,0.14,2.21,-0.47,-0.25,2.11,-0.51,-0.26,1.99,0.13,0.23,2.47,0.02,-0.28,2.44,0.01,-0.67,2.52,0.01,-0.72,2.46,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 120:{var d=[0,0,0,0,0.06,0.32,2.46,0.07,0.39,2.45,0.11,0.71,2.40,0.15,0.87,2.33,-0.08,0.67,2.46,-0.27,0.46,2.57,-0.38,0.29,2.63,-0.44,0.23,2.63,0.26,0.58,2.42,0.28,0.33,2.45,0.27,0.10,2.39,0.23,0.01,2.36,-0.03,0.26,2.47,-0.42,0.17,2.19,-0.47,-0.24,2.07,-0.51,-0.21,1.96,0.14,0.23,2.46,0.02,-0.24,2.42,0.01,-0.66,2.51,0.01,-0.72,2.45,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 121:{var d=[0,0,0,0,0.07,0.32,2.44,0.08,0.39,2.44,0.11,0.70,2.38,0.15,0.86,2.32,-0.07,0.67,2.45,-0.26,0.47,2.56,-0.37,0.29,2.63,-0.43,0.23,2.63,0.26,0.58,2.40,0.28,0.33,2.43,0.27,0.11,2.37,0.23,0.03,2.32,-0.02,0.26,2.46,-0.43,0.20,2.17,-0.50,-0.14,1.96,-0.54,-0.15,1.87,0.14,0.23,2.45,0.02,-0.24,2.42,0.01,-0.66,2.51,0.01,-0.72,2.45,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 122:{var d=[0,0,0,0,0.07,0.32,2.43,0.08,0.39,2.42,0.11,0.70,2.37,0.15,0.86,2.30,-0.07,0.66,2.43,-0.26,0.47,2.55,-0.37,0.30,2.63,-0.42,0.24,2.63,0.26,0.58,2.39,0.29,0.33,2.42,0.27,0.11,2.33,0.23,0.03,2.30,-0.01,0.26,2.44,-0.41,0.24,2.16,-0.50,-0.12,1.90,-0.55,-0.14,1.85,0.15,0.23,2.43,0.02,-0.25,2.41,0.01,-0.67,2.51,0.01,-0.73,2.45,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 123:{var d=[0,0,0,0,0.07,0.32,2.41,0.08,0.38,2.40,0.11,0.70,2.35,0.15,0.86,2.28,-0.07,0.66,2.41,-0.26,0.47,2.54,-0.36,0.30,2.63,-0.41,0.24,2.63,0.26,0.58,2.37,0.29,0.33,2.40,0.27,0.11,2.29,0.22,0.03,2.25,-0.01,0.26,2.42,-0.39,0.28,2.15,-0.50,-0.02,1.89,-0.52,-0.05,1.82,0.15,0.23,2.41,0.02,-0.24,2.39,0.01,-0.66,2.51,0.01,-0.73,2.45,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 124:{var d=[0,0,0,0,0.07,0.32,2.38,0.08,0.38,2.38,0.11,0.70,2.34,0.15,0.85,2.27,-0.07,0.66,2.39,-0.25,0.47,2.51,-0.35,0.30,2.62,-0.40,0.24,2.62,0.26,0.58,2.35,0.29,0.33,2.38,0.26,0.10,2.24,0.23,0.03,2.21,-0.02,0.26,2.40,-0.39,0.29,2.14,-0.49,0.01,1.89,-0.51,-0.04,1.80,0.15,0.23,2.39,0.02,-0.23,2.38,0.01,-0.66,2.51,0.01,-0.73,2.45,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 125:{var d=[0,0,0,0,0.07,0.32,2.36,0.08,0.38,2.35,0.11,0.70,2.32,0.15,0.85,2.25,-0.07,0.65,2.38,-0.25,0.47,2.50,-0.34,0.30,2.61,-0.39,0.24,2.62,0.26,0.58,2.33,0.29,0.33,2.36,0.26,0.10,2.21,0.23,0.03,2.16,-0.02,0.26,2.38,-0.38,0.30,2.13,-0.49,0.01,1.85,-0.51,-0.04,1.76,0.14,0.23,2.36,0.01,-0.26,2.37,0.01,-0.67,2.51,0.01,-0.73,2.45,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 126:{var d=[0,0,0,0,0.07,0.32,2.34,0.08,0.38,2.34,0.11,0.70,2.30,0.15,0.85,2.24,-0.07,0.65,2.36,-0.24,0.47,2.48,-0.34,0.29,2.59,-0.38,0.24,2.60,0.26,0.57,2.31,0.30,0.33,2.33,0.26,0.09,2.15,0.24,0.03,2.11,-0.02,0.25,2.36,-0.38,0.25,2.08,-0.47,-0.12,1.82,-0.48,-0.17,1.73,0.14,0.22,2.34,0.00,-0.28,2.36,0.00,-0.67,2.51,0.01,-0.73,2.44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 127:{var d=[0,0,0,0,0.07,0.31,2.33,0.08,0.38,2.32,0.11,0.70,2.29,0.15,0.85,2.22,-0.07,0.64,2.34,-0.24,0.46,2.46,-0.34,0.29,2.58,-0.38,0.23,2.58,0.26,0.57,2.29,0.30,0.33,2.31,0.27,0.10,2.13,0.26,0.04,2.06,-0.02,0.25,2.34,-0.38,0.20,2.04,-0.46,-0.18,1.79,-0.48,-0.19,1.69,0.14,0.22,2.32,0.00,-0.28,2.35,0.00,-0.67,2.50,0.01,-0.73,2.44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 128:{var d=[0,0,0,0,0.07,0.31,2.31,0.07,0.37,2.30,0.11,0.69,2.27,0.15,0.85,2.20,-0.07,0.64,2.32,-0.24,0.45,2.44,-0.36,0.28,2.52,-0.41,0.22,2.52,0.27,0.57,2.27,0.31,0.32,2.27,0.29,0.13,2.10,0.28,0.07,2.02,-0.02,0.25,2.32,-0.38,0.13,2.01,-0.45,-0.23,1.79,-0.47,-0.26,1.68,0.14,0.21,2.31,0.00,-0.29,2.34,0.00,-0.67,2.50,0.01,-0.73,2.44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 129:{var d=[0,0,0,0,0.06,0.30,2.28,0.07,0.36,2.27,0.11,0.69,2.24,0.15,0.84,2.17,-0.07,0.63,2.30,-0.24,0.44,2.43,-0.37,0.27,2.48,-0.41,0.21,2.50,0.26,0.56,2.24,0.31,0.33,2.23,0.30,0.14,2.07,0.30,0.09,1.98,-0.03,0.24,2.30,-0.37,0.08,1.99,-0.46,-0.26,1.83,-0.46,-0.31,1.73,0.13,0.21,2.28,0.01,-0.29,2.33,0.00,-0.67,2.50,0.02,-0.73,2.44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 130:{var d=[0,0,0,0,0.05,0.29,2.26,0.06,0.36,2.25,0.11,0.68,2.23,0.15,0.83,2.15,-0.07,0.62,2.26,-0.23,0.43,2.42,-0.38,0.26,2.46,-0.42,0.21,2.48,0.26,0.55,2.22,0.32,0.33,2.19,0.31,0.15,2.04,0.31,0.09,1.90,-0.04,0.23,2.27,-0.36,-0.01,1.96,-0.40,-0.40,1.82,-0.41,-0.44,1.71,0.11,0.20,2.25,0.01,-0.28,2.32,0.00,-0.67,2.50,0.02,-0.73,2.44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 131:{var d=[0,0,0,0,0.02,0.28,2.22,0.04,0.34,2.22,0.11,0.67,2.19,0.15,0.82,2.11,-0.07,0.61,2.24,-0.23,0.42,2.40,-0.37,0.24,2.42,-0.40,0.18,2.42,0.26,0.54,2.18,0.32,0.32,2.14,0.31,0.15,2.01,0.32,0.10,1.83,-0.07,0.23,2.23,-0.34,-0.09,1.95,-0.35,-0.51,1.81,-0.36,-0.56,1.70,0.08,0.19,2.22,0.01,-0.28,2.30,0.00,-0.67,2.50,0.02,-0.73,2.44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 132:{var d=[0,0,0,0,0.00,0.27,2.20,0.02,0.34,2.19,0.10,0.66,2.16,0.14,0.80,2.08,-0.07,0.60,2.21,-0.23,0.41,2.37,-0.35,0.22,2.38,-0.40,0.17,2.40,0.25,0.53,2.15,0.32,0.31,2.10,0.31,0.14,1.96,0.34,0.09,1.75,-0.09,0.22,2.21,-0.30,-0.17,1.94,-0.31,-0.61,1.80,-0.31,-0.66,1.70,0.06,0.17,2.20,0.01,-0.27,2.29,0.00,-0.67,2.49,0.02,-0.73,2.44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 133:{var d=[0,0,0,0,-0.01,0.26,2.17,0.00,0.32,2.16,0.10,0.64,2.12,0.14,0.78,2.04,-0.08,0.60,2.17,-0.23,0.41,2.35,-0.34,0.20,2.35,-0.37,0.14,2.35,0.24,0.51,2.12,0.31,0.30,2.05,0.31,0.12,1.91,0.36,0.10,1.69,-0.11,0.21,2.18,-0.26,-0.24,1.94,-0.28,-0.64,1.82,-0.27,-0.70,1.75,0.04,0.16,2.17,0.01,-0.28,2.28,0.00,-0.67,2.49,0.02,-0.73,2.44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 134:{var d=[0,0,0,0,-0.03,0.24,2.15,-0.01,0.31,2.14,0.09,0.62,2.08,0.14,0.76,2.00,-0.09,0.58,2.13,-0.25,0.40,2.30,-0.34,0.19,2.32,-0.36,0.12,2.31,0.23,0.49,2.08,0.31,0.28,2.00,0.31,0.11,1.84,0.37,0.10,1.62,-0.12,0.20,2.17,-0.23,-0.30,1.94,-0.25,-0.67,1.86,-0.25,-0.73,1.80,0.02,0.15,2.15,0.01,-0.29,2.27,0.00,-0.67,2.49,0.02,-0.74,2.44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 135:{var d=[0,0,0,0,-0.04,0.23,2.13,-0.02,0.29,2.11,0.08,0.61,2.04,0.13,0.74,1.95,-0.10,0.57,2.09,-0.27,0.40,2.25,-0.35,0.17,2.28,-0.36,0.09,2.26,0.22,0.47,2.04,0.29,0.26,1.95,0.31,0.11,1.77,0.39,0.09,1.57,-0.13,0.19,2.14,-0.22,-0.31,1.95,-0.23,-0.68,1.88,-0.23,-0.74,1.83,0.01,0.14,2.14,0.01,-0.30,2.26,0.00,-0.67,2.49,0.02,-0.74,2.44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 136:{var d=[0,0,0,0,-0.05,0.22,2.10,-0.03,0.28,2.08,0.07,0.58,1.99,0.13,0.72,1.91,-0.11,0.55,2.03,-0.29,0.39,2.20,-0.36,0.15,2.24,-0.37,0.07,2.23,0.21,0.45,2.00,0.28,0.24,1.90,0.31,0.11,1.71,0.40,0.08,1.52,-0.14,0.17,2.12,-0.21,-0.31,1.95,-0.22,-0.68,1.89,-0.22,-0.74,1.85,0.01,0.12,2.12,0.00,-0.31,2.24,-0.00,-0.67,2.49,0.02,-0.74,2.43,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 137:{var d=[0,0,0,0,-0.06,0.20,2.08,-0.04,0.26,2.06,0.06,0.56,1.95,0.12,0.69,1.86,-0.12,0.53,1.99,-0.31,0.37,2.15,-0.38,0.13,2.19,-0.39,0.05,2.18,0.19,0.43,1.95,0.26,0.22,1.85,0.33,0.10,1.65,0.41,0.07,1.49,-0.15,0.16,2.10,-0.20,-0.31,1.93,-0.21,-0.67,1.90,-0.21,-0.74,1.86,-0.00,0.11,2.10,0.00,-0.32,2.22,-0.00,-0.67,2.48,0.02,-0.74,2.43,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 138:{var d=[0,0,0,0,-0.07,0.19,2.05,-0.05,0.25,2.03,0.05,0.54,1.91,0.12,0.66,1.82,-0.13,0.51,1.94,-0.33,0.36,2.09,-0.40,0.12,2.14,-0.41,0.04,2.14,0.18,0.41,1.91,0.25,0.21,1.80,0.33,0.08,1.62,0.42,0.04,1.45,-0.16,0.15,2.08,-0.20,-0.30,1.92,-0.21,-0.66,1.90,-0.21,-0.73,1.86,-0.01,0.10,2.08,-0.00,-0.32,2.17,-0.01,-0.66,2.45,0.02,-0.74,2.43,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 139:{var d=[0,0,0,0,-0.08,0.18,2.03,-0.06,0.24,2.00,0.04,0.52,1.87,0.12,0.64,1.78,-0.14,0.50,1.91,-0.34,0.34,2.05,-0.42,0.12,2.08,-0.43,0.04,2.09,0.17,0.39,1.88,0.25,0.20,1.76,0.34,0.05,1.59,0.42,0.02,1.43,-0.17,0.15,2.06,-0.21,-0.28,1.90,-0.22,-0.66,1.90,-0.21,-0.72,1.86,-0.02,0.09,2.06,0.00,-0.33,2.11,-0.01,-0.66,2.40,0.02,-0.74,2.43,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 140:{var d=[0,0,0,0,-0.09,0.18,2.01,-0.07,0.23,1.98,0.04,0.51,1.84,0.12,0.63,1.75,-0.13,0.50,1.87,-0.34,0.34,2.01,-0.43,0.11,2.03,-0.44,0.04,2.04,0.16,0.39,1.85,0.25,0.19,1.74,0.35,0.05,1.57,0.42,0.01,1.41,-0.18,0.14,2.04,-0.22,-0.27,1.89,-0.22,-0.65,1.90,-0.22,-0.72,1.85,-0.04,0.09,2.03,0.01,-0.33,2.06,0.00,-0.66,2.35,-0.00,-0.72,2.31,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 141:{var d=[0,0,0,0,-0.09,0.18,1.98,-0.07,0.23,1.95,0.03,0.50,1.81,0.12,0.61,1.72,-0.14,0.49,1.84,-0.35,0.33,1.98,-0.43,0.11,1.99,-0.45,0.04,1.98,0.16,0.38,1.83,0.25,0.18,1.72,0.35,0.04,1.56,0.42,-0.00,1.40,-0.19,0.14,2.02,-0.22,-0.26,1.88,-0.22,-0.65,1.89,-0.22,-0.72,1.85,-0.05,0.09,2.01,0.02,-0.33,2.01,0.01,-0.66,2.30,0.02,-0.74,2.28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 142:{var d=[0,0,0,0,-0.10,0.17,1.96,-0.08,0.23,1.93,0.03,0.49,1.79,0.12,0.60,1.70,-0.13,0.49,1.82,-0.35,0.33,1.96,-0.43,0.12,1.95,-0.45,0.05,1.93,0.16,0.37,1.81,0.25,0.18,1.72,0.35,0.03,1.56,0.42,-0.01,1.41,-0.20,0.14,2.00,-0.23,-0.26,1.88,-0.23,-0.65,1.89,-0.22,-0.71,1.84,-0.06,0.08,1.99,0.02,-0.33,1.98,0.02,-0.68,2.25,0.05,-0.75,2.22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 143:{var d=[0,0,0,0,-0.11,0.17,1.94,-0.08,0.23,1.91,0.03,0.49,1.77,0.12,0.60,1.68,-0.13,0.48,1.80,-0.35,0.33,1.93,-0.42,0.12,1.91,-0.44,0.06,1.88,0.16,0.36,1.80,0.26,0.17,1.72,0.36,0.02,1.55,0.41,-0.02,1.43,-0.20,0.14,1.98,-0.24,-0.25,1.87,-0.23,-0.64,1.89,-0.22,-0.71,1.84,-0.06,0.08,1.97,0.03,-0.33,1.96,0.01,-0.67,2.19,0.06,-0.74,2.15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 144:{var d=[0,0,0,0,-0.11,0.17,1.93,-0.08,0.23,1.90,0.04,0.48,1.75,0.13,0.59,1.66,-0.13,0.48,1.78,-0.35,0.33,1.91,-0.42,0.12,1.88,-0.44,0.07,1.85,0.16,0.36,1.79,0.26,0.16,1.72,0.36,0.01,1.56,0.39,-0.02,1.49,-0.21,0.15,1.96,-0.24,-0.25,1.87,-0.23,-0.64,1.88,-0.23,-0.71,1.84,-0.07,0.08,1.96,0.03,-0.33,1.94,0.02,-0.67,2.12,0.07,-0.74,2.07,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 145:{var d=[0,0,0,0,-0.11,0.17,1.92,-0.08,0.22,1.88,0.04,0.48,1.74,0.14,0.59,1.64,-0.12,0.48,1.76,-0.35,0.33,1.89,-0.41,0.12,1.87,-0.43,0.07,1.83,0.16,0.35,1.78,0.27,0.15,1.73,0.36,0.01,1.56,0.38,-0.04,1.54,-0.21,0.15,1.95,-0.24,-0.26,1.86,-0.23,-0.64,1.88,-0.23,-0.71,1.83,-0.07,0.08,1.95,0.04,-0.33,1.92,0.04,-0.67,2.04,0.10,-0.75,1.98,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 146:{var d=[0,0,0,0,-0.11,0.17,1.91,-0.08,0.22,1.88,0.04,0.48,1.72,0.14,0.58,1.63,-0.12,0.47,1.74,-0.35,0.33,1.87,-0.40,0.12,1.85,-0.42,0.07,1.81,0.17,0.35,1.77,0.27,0.14,1.73,0.36,0.00,1.56,0.38,-0.05,1.56,-0.21,0.15,1.94,-0.24,-0.26,1.86,-0.23,-0.64,1.88,-0.23,-0.71,1.83,-0.07,0.08,1.94,0.05,-0.33,1.90,0.06,-0.68,1.97,0.13,-0.75,1.90,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 147:{var d=[0,0,0,0,-0.11,0.17,1.90,-0.08,0.22,1.87,0.05,0.48,1.71,0.15,0.58,1.62,-0.11,0.47,1.73,-0.35,0.33,1.84,-0.39,0.11,1.83,-0.42,0.06,1.80,0.17,0.34,1.77,0.27,0.14,1.73,0.36,-0.00,1.57,0.40,-0.03,1.49,-0.21,0.15,1.93,-0.24,-0.26,1.85,-0.23,-0.64,1.88,-0.23,-0.72,1.83,-0.07,0.08,1.94,0.05,-0.32,1.88,0.09,-0.67,1.89,0.15,-0.73,1.84,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 148:{var d=[0,0,0,0,-0.11,0.17,1.89,-0.08,0.22,1.86,0.06,0.48,1.70,0.16,0.57,1.61,-0.11,0.46,1.72,-0.34,0.33,1.83,-0.39,0.11,1.82,-0.41,0.05,1.79,0.17,0.34,1.76,0.28,0.13,1.74,0.36,-0.01,1.57,0.41,-0.03,1.48,-0.20,0.15,1.92,-0.24,-0.27,1.85,-0.23,-0.65,1.88,-0.23,-0.72,1.83,-0.07,0.08,1.93,0.06,-0.32,1.87,0.13,-0.73,1.84,0.14,-0.80,1.77,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 149:{var d=[0,0,0,0,-0.10,0.17,1.88,-0.08,0.22,1.85,0.07,0.48,1.68,0.18,0.57,1.60,-0.10,0.46,1.70,-0.34,0.33,1.82,-0.38,0.11,1.81,-0.40,0.04,1.78,0.17,0.34,1.76,0.28,0.13,1.74,0.36,-0.01,1.57,0.42,-0.02,1.46,-0.20,0.14,1.90,-0.24,-0.27,1.84,-0.23,-0.65,1.87,-0.23,-0.72,1.83,-0.07,0.08,1.92,0.06,-0.32,1.86,0.15,-0.76,1.81,0.15,-0.84,1.74,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 150:{var d=[0,0,0,0,-0.10,0.17,1.87,-0.07,0.22,1.84,0.08,0.48,1.67,0.19,0.56,1.59,-0.09,0.46,1.69,-0.33,0.33,1.80,-0.37,0.10,1.79,-0.38,0.03,1.76,0.18,0.33,1.75,0.28,0.12,1.74,0.36,-0.01,1.57,0.42,-0.02,1.45,-0.19,0.14,1.88,-0.24,-0.27,1.84,-0.23,-0.65,1.87,-0.23,-0.72,1.83,-0.07,0.08,1.92,0.07,-0.32,1.86,0.16,-0.77,1.79,0.15,-0.85,1.72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 151:{var d=[0,0,0,0,-0.09,0.16,1.86,-0.06,0.22,1.82,0.08,0.47,1.67,0.20,0.56,1.58,-0.08,0.46,1.68,-0.32,0.33,1.79,-0.35,0.10,1.78,-0.36,0.03,1.75,0.18,0.32,1.75,0.28,0.12,1.75,0.36,-0.01,1.57,0.42,-0.02,1.45,-0.19,0.14,1.87,-0.24,-0.28,1.83,-0.23,-0.65,1.87,-0.23,-0.72,1.83,-0.06,0.08,1.90,0.07,-0.32,1.85,0.17,-0.78,1.78,0.15,-0.86,1.70,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	case 152:{var d=[0,0,0,0,-0.09,0.16,1.85,-0.06,0.21,1.81,0.09,0.47,1.66,0.21,0.56,1.57,-0.06,0.45,1.67,-0.30,0.32,1.78,-0.34,0.10,1.76,-0.34,0.02,1.74,0.19,0.32,1.74,0.28,0.12,1.75,0.36,-0.01,1.57,0.42,-0.02,1.44,-0.18,0.14,1.86,-0.23,-0.28,1.83,-0.23,-0.65,1.87,-0.23,-0.72,1.83,-0.06,0.08,1.89,0.07,-0.32,1.84,0.17,-0.79,1.78,0.15,-0.87,1.70,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	default:{var d=[0,0,0,0,-0.07,0.16,1.84,-0.05,0.21,1.80,0.10,0.47,1.65,0.22,0.55,1.56,-0.05,0.45,1.66,-0.29,0.32,1.77,-0.33,0.09,1.75,-0.33,0.02,1.73,0.20,0.32,1.73,0.28,0.11,1.75,0.37,-0.01,1.57,0.42,-0.01,1.44,-0.17,0.13,1.85,-0.23,-0.28,1.82,-0.23,-0.65,1.87,-0.23,-0.72,1.83,-0.04,0.08,1.88,0.08,-0.31,1.83,0.17,-0.80,1.79,0.15,-0.87,1.71,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];self.onSkeletonFrameEvent([0],d,null,tr_st);break;}
	}frame_i+=1;if(frame_i>152) frame_i=0;},37);

};

/**
 * This method stops the simulation of the Kinect stream.
 */
Kinect.prototype.stopSimulatingSkeletonStream = function() {
clearInterval(this.simulation_thread);
};
