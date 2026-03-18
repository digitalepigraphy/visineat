/**
 * This class implements a key-framed animation. You can use it to define multiple key-frames with numerical parameters, such as positions, sizes, etc. and reproduce the animation at a desired speed and frames-per-second.
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * var a=new Animation();<br>
 * a.addKeyFrame(0,{position_x:2.5, height:7.2, brightness:1});<br>
 * a.addKeyFrame(10,{position_x:7.2, height:5.4, brightness:0.5});<br>
 * a.addKeyFrame(12,{position_x:9.8, height:0, brightness:0});<br>
 * a.whenNewFrame().then(function(frame){<br>
 * console.log('Time: '+frame.time+' pos:'+frame.data.position_x);<br>
 * });<br>
 * a.play();<br></font>
 */
function Animation()
{
	this._interval_id=null;
	this._fps=30;
	this._frame_p=new VNPromise(this);
	this._end_p=new VNPromise(this);
	this._loop=false;
	this._keyframes=[];
	this._key_i=0;
	this._t0=0;
	this._speed=1;
	this._queued=false;
}

/**
 * This method sets the Frame-per-Second rate of the animation. The default value is 30.
 * @param fps A number with the desired frame per second ratio.
 */
Animation.prototype.setFPS=function(fps){this._fps=fps;};


/**
 * This method returns true if the animation is not playing right now.
 * @return boolean The current status of the animation.
 */
Animation.prototype.isStopped=function(){if(this._interval_id==null)return true;else return false;};

/**
 * This method returns true if the animation queued and waits to be played after another animation.
 * @return boolean The returned status.
 */
Animation.prototype.isQueued=function(){return this._queued;};


/**
 * This method sets the looping behaviour of the animation. It is false by default.
 * @param flag A boolean value with the desired looping behaviour.
 */
Animation.prototype.setLoop=function(flag){this._loop=flag;};

/**
 * This method returns the total duration of this animation in seconds.
 * @return number The duration of this animation in seconds.
 */
Animation.prototype.getDuration=function()
{
	if(this._keyframes.length<2)return 0;
	return this._keyframes[this._keyframes.length-1].time-this._keyframes[0].time;
};

/**
 * This method adds a new key frame to this animation.
 * @param time The current time stamp of this key-frame in seconds.
 * @param data An Object with numerical fields to be interpolated accross key-frames. There are no restrictions for the names of the fields.
 * @return Object The following object is returned: {time:..., data:{...}} with the time and data you have set.
 */
Animation.prototype.addKeyFrame=function(time,data)
{
	var found=-1;
	for(var i=0;found<0&&i<this._keyframes.length;i++)
	{
		if(this._keyframes[i].time>=time)found=i;
	}
	var f={time:time,data:data};
	if(found==-1)
	{
		found=this._keyframes.length;
		this._keyframes.splice(found,0,f);
	}
	else
	{
		if(this._keyframes[found].time==time)
			this._keyframes.splice(found,1,f);
		else
			this._keyframes.splice(found,0,f);
			
	}
	return f;
};

/**
 * This method returns a promise that is triggered during the playback of the anumation, every time a new frame is available. The promise calls are provided with a frame object in the form: {time:...,data:{...}} 
 * @return VNPromise A promise that will be triggered when a new frame is available.
 */
Animation.prototype.whenNewFrame=function(){return this._frame_p;};
/**
 * This method returns a promise that is triggered when the playback of the animation ends, right after the last frame.
 * @return VNPromise A promise that will be triggered when the animation ends.
 */
Animation.prototype.whenAnimationEnds=function(){return this._end_p;};

/**
 * This method sets the playback speed of the animation. The default value is 1.
 * @param s A number with the desired playback speed of the animation. Only positive values are allowed.
 */
Animation.prototype.setSpeed=function(s)
{
	if(s<=0)return;
	if(typeof this._t!=='undefined')
	{
		//only update _t0
		this._t0*=s/this._speed;
	}
	this._speed=s;
};

/** 
 * This method starts the playback of the animation from the previously defined time stamp.
 */
Animation.prototype.play=function()
{
	if(!this.isStopped())return;
	
	if(this._keyframes.length<2)return;
	
	if(this._interval_id==null)
	{
		var self=this;
		this._interval_id=window.setInterval(function(){self._ontick();},1000/self._fps);
	}
	if(typeof this._t==='undefined')
	{
		this._t=this._keyframes[0].time;
		this._key_i=0;
	}
	this._t0=new Date().getTime()*this._speed/1000+this._keyframes[0].time-this._t;
	this.whenNewFrame().setObject(this._keyframes[0]);
	this.whenNewFrame().callThen();
};
/**
 * This method starts the playback of this animation as soon as the playback of another animation finishes.
 * @param animation Another animation object.
 */
Animation.prototype.playAfter=function(animation)
{
	if(animation.isStopped()&&!animation._queued)
	{
		this.play();
	}
	else
	{
		this._queued=true;
		var self=this;
		animation.whenAnimationEnds().then(function()
		{
			self._queued=false;
			self.play();
			return true;
		});
	}
};

/**
 * This method pauses the animation at the current time stamp. It can be resumed using the method play().
 */
Animation.prototype.pause=function()
{
	if(this._interval_id)
	{
		window.clearInterval(this._interval_id);
		this._interval_id=null;
	}		
};

/**
 * This method sets the current time stamp of the animation. You can use it to start the playback from an intermediate point in the animation.
 * @param t A time stamp in seconds.
 */
Animation.prototype.setTime=function(t)
{
	this._t=t;
	this._key_i=0;
	this._t0=new Date().getTime()*this._speed/1000+this._keyframes[0].time-this._t;
};

/**
 * This method returns the current time stamp of the animation in seconds.
 * @return number The current time stamp in seconds.
 */
Animation.prototype.getTime=function(){if(typeof this._t!=='undefined')return this._t;else return this._keyframes[0].time;};

Animation.prototype._ontick=function()
{
	this._t=new Date().getTime()*this._speed/1000-this._t0+this._keyframes[0].time;
	
	if(this._keyframes[this._key_i+1].time>this._t)//we are still in the same key interval
	{
		var data={};
		var w=(this._t-this._keyframes[this._key_i].time)/(this._keyframes[this._key_i+1].time-this._keyframes[this._key_i].time);
		var f1=this._keyframes[this._key_i].data;
		var f2=this._keyframes[this._key_i+1].data;
		for(i in f1)
			if(typeof f2[i]!=='undefined')
			{
				if(typeof f1[i]=='number')
					data[i]=(1-w)*f1[i]+w*f2[i];
				else data[i]=f1[i];
			}
		var frame={time:this._t,data:data};
		var p=this.whenNewFrame();
		p.setObject(frame);
		p.callThen();
		//p.reset();
		
	}
	else //we need to find the new key interval
	{
		var found=false;
		for(var i=this._key_i+1;!found&&i+1<this._keyframes.length;i++)
		{
			if(this._keyframes[i+1].time>this._t){found=true;this._key_i=i;}
		}
		if(found)
		{
			var data={};
			var w=(this._t-this._keyframes[this._key_i].time)/(this._keyframes[this._key_i+1].time-this._keyframes[this._key_i].time);
			var f1=this._keyframes[this._key_i].data;
			var f2=this._keyframes[this._key_i+1].data;
			for(i in f1)
				if(typeof f2[i]!=='undefined')
				{
					if(typeof f1[i]=='number')
						data[i]=(1-w)*f1[i]+w*f2[i];
					else data[i]=f1[i];
				}
			var frame={time:this._t,data:data};
			var p=this.whenNewFrame();
			p.setObject(frame);
			p.callThen();
			//p.reset();
		}
		else
		{
			window.clearInterval(this._interval_id);
			this._interval_id=null;
			delete this._t;
			this.whenNewFrame().setObject(this._keyframes[this._keyframes.length-1]);
			this.whenNewFrame().callThen();
			this.whenAnimationEnds().callThen();
			this.whenAnimationEnds().reset();
			if(this._loop)this.play();
		}
	}
		
};