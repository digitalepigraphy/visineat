function TimeSeries()
{
	VNFile.call(this);//call the constructor of the super-class
	this.length=0;
	this.duration=0;
	this.fps=0;
}

TimeSeries.prototype.handleLoadedFile=function()
{
	var d=JSON.parse(this.request.responseText);
	if(d.frames)
	{
		if(d.fps)
		{
			this.frames=d.frames;
			var f=this.frames;
			this.length=f.length;
			this.fps=d.fps;
			var t=0;
			this.t0=0;
			var dt=1000/this.fps;
			this.duration=f.length*dt;
			for(var i=0;i<f.length;i++)
			{
				f[i].t=t;
				f[i].id=i;
				t+=dt;
			}
		}
		else if(d.frames.length>0 && typeof d.frames[0].t !=='undefined' && typeof d.frames[d.frames.length-1].t !=='undefined')
		{
			this.frames=d.frames;
			var f=this.frames;
			this.length=f.length;
			for(var i=0;i<f.length;i++)
			{
				f[i].id=i;
			}
			this.t0=f[0].t;
			this.fps=(f.length-1)/((f[f.length-1].t-this.t0)*1000);
			var dt=1000/this.fps;
			this.duration=f.length*dt;
		}
	}
};

TimeSeries.prototype.sampleAt=function(id)
{
	return this.frames[id];
};

vn.extend(VNFile,TimeSeries);

function TimeSeriesPlayer()
{
   this.q=[];
   this.iid=null;
   this.next_frame_id=0;
   this.loop=false;
   this.playall=false;
   this.is_playing=false;
   this.t0=0;
}

TimeSeriesPlayer.prototype.requestFrame=function()
{
	if(this.iid!=null)return;
	if(!this.is_playing)return;
	if(this.q.length==0){this.is_playing=false;return;}
	var s=this.q[0];
	if(!s.loaded)
	{
		if(s.failed)
		{
			this.q.shift(s);//remove from queue
			this.next_frame_id=0;
			this.t0=new Date().getTime();
			this.requestFrame();//check next file
		}
		return;
	}
	
	if(this.next_frame_id>=s.length)
	{
		if(this.loop && this.next_frame_id!=0)
		{
			this.next_frame_id=0;
		}
		else
		{
		this.q.shift(s);//remove from queue
		this.next_frame_id=0;
		this.t0=new Date().getTime();
		this.requestFrame();//check next file
		return;
		}
	}
	var self=this;
	this.iid=window.setTimeout(function(){self.ontimer();},s.frames[this.next_frame_id].t-s.t0-(new Date().getTime()-this.t0));
};

TimeSeriesPlayer.prototype.onFrame=function(f){};

TimeSeriesPlayer.prototype.ontimer=function()
{
	this.iid=null;
	if(this.q.length==0)return;
	var s=this.q[0];
	if(this.next_frame_id>=s.length)return;
	
	if(this.next_frame_id==0)
	{
		this.t0=new Date().getTime();
	}
	else if(!this.playall)
	{
		var t=new Date().getTime()-this.t0;
		while(this.next_frame_id+1<s.length && s.frames[this.next_frame_id+1].t-s.t0-t<=0) this.next_frame_id+=1;
	}
	this.onFrame(s.frames[this.next_frame_id]);
	this.next_frame_id+=1;
};

TimeSeriesPlayer.prototype.play=function(series,options)
{
	var self=this;
	var opt=options||{};
	if(opt.loop)this.loop=true;else this.loop=false;
	if(opt.all)this.playall=true;else this.playall=false;
	if(this.iid)
	{	window.clearTimeout(this.iid);
		this.iid=null;
		}
	this.q=[];
	this.q.push(series);
	this.is_playing=true;
	this.next_frame_id=0;
	this.t0=new Date().getTime();
};

TimeSeriesPlayer.prototype.queue=function(series,options)
{
	if(this.q.length==0)
		this.play(series,options);
	else this.q.push(series);
};

TimeSeriesPlayer.prototype.pause=function()
{
	if(this.is_playing)
	{
	if(this.iid){
	window.clearTimeout(this.iid);
	this.iid=null;
	}
	this.is_playing=false;
	}
	else
	{
		this.is_playing=true;
	}
};

function HumanPosture()
{
	this.thorax={angleX:0,angleY:0,angleZ:0};
	this.abdomen={angleX:0,angleY:0,angleZ:0};
	this.neck={angleX:0,angleY:0,angleZ:0};
	this.upperarm_left={angleX:0,angleY:0,angleZ:0};
	this.forearm_left={angleX:0};
	this.upperarm_right={angleX:0,angleY:0,angleZ:0};
	this.forearm_right={angleX:0};
	this.thigh_left={angleX:0,angleY:0,angleZ:0};
	this.calf_left={angleX:0};
	this.foot_left={angleX:0,angleZ:0};
	this.thigh_right={angleX:0,angleY:0,angleZ:0};
	this.calf_right={angleX:0};
	this.foot_right={angleX:0,angleZ:0};
}

HumanPosture.prototype.resetFeet=function()
{
	this.foot_left={angleX:0,angleZ:0};
	this.foot_right={angleX:0,angleZ:0};
};

HumanPosture.prototype.flip=function()
{
this.thorax.angleY=-this.thorax.angleY;
this.thorax.angleZ=-this.thorax.angleZ;

this.abdomen.angleY=-this.abdomen.angleY;
this.abdomen.angleZ=-this.abdomen.angleZ;

this.neck.angleY=-this.neck.angleY;
this.neck.angleZ=-this.neck.angleZ;

var tmp=this.upperarm_left;
    this.upperarm_left=this.upperarm_right;
    this.upperarm_right=tmp;

this.upperarm_right.angleY=-this.upperarm_right.angleY;
this.upperarm_right.angleZ=-this.upperarm_right.angleZ;
this.upperarm_left.angleY=-this.upperarm_left.angleY;
this.upperarm_left.angleZ=-this.upperarm_left.angleZ;

 tmp=this.forearm_left;
    this.forearm_left=this.forearm_right;
    this.forearm_right=tmp;

 tmp=this.thigh_left;
    this.thigh_left=this.thigh_right;
    this.thigh_right=tmp;

this.thigh_right.angleY=-this.thigh_right.angleY;
this.thigh_right.angleZ=-this.thigh_right.angleZ;
this.thigh_left.angleY=-this.thigh_left.angleY;
this.thigh_left.angleZ=-this.thigh_left.angleZ;

tmp=this.calf_left;
    this.calf_left=this.calf_right;
    this.calf_right=tmp;

    tmp=this.foot_left;
    this.foot_left=this.foot_right;
    this.foot_right=tmp;
};

HumanPosture.prototype.correct=function()
{
if(this.forearm_left.angleX<0)this.forearm_left.angleX=0;
else if(this.forearm_left.angleX>2.6)this.forearm_left.angleX=2.6;
if(this.forearm_right.angleX<0)this.forearm_right.angleX=0;
else if(this.forearm_right.angleX>2.6)this.forearm_right.angleX=2.6;
if(this.upperarm_left.angleY<-1.57)this.upperarm_left.angleY=-1.57;
else if(this.upperarm_left.angleY>1.57)this.upperarm_left.angleY=1.57;
if(this.upperarm_left.angleZ<-0.2)this.upperarm_left.angleZ=-0.2;//
else if(this.upperarm_left.angleZ>2)this.upperarm_left.angleZ=2;//
if(this.upperarm_left.angleX<-1)this.upperarm_left.angleX=-1;
else if(this.upperarm_left.angleX>3.5)this.upperarm_left.angleX=3.5;
if(this.upperarm_right.angleY<-1.57)this.upperarm_right.angleY=-1.57;
else if(this.upperarm_right.angleY>1.57)this.upperarm_right.angleY=1.57;
if(this.upperarm_right.angleZ<-0.2)this.upperarm_right.angleZ=-0.2;//
else if(this.upperarm_right.angleZ>2)this.upperarm_right.angleZ=2;//
if(this.upperarm_right.angleX<-1)this.upperarm_right.angleX=-1;
else if(this.upperarm_right.angleX>3.5)this.upperarm_right.angleX=3.5;
if(this.neck.angleY<-1.57)this.neck.angleY=-1.57;
else if(this.neck.angleY>1.57)this.neck.angleY=1.57;
if(this.neck.angleX<-1)this.neck.angleX=-1;
else if(this.neck.angleX>1)this.neck.angleX=1;
if(this.neck.angleZ<-1)this.neck.angleZ=-1;
else if(this.neck.angleZ>1)this.neck.angleZ=1;
if(this.thigh_left.angleY<-1.57)this.thigh_left.angleY=-1.57;
else if(this.thigh_left.angleY>1.57)this.thigh_left.angleY=1.57;
if(this.thigh_left.angleZ<-0.2)this.thigh_left.angleZ=-0.2;//
else if(this.thigh_left.angleZ>2)this.thigh_left.angleZ=2;//
if(this.thigh_left.angleX<-1)this.thigh_left.angleX=-1;
else if(this.thigh_left.angleX>2.6)this.thigh_left.angleX=2.6;
if(this.thigh_right.angleY<-1.57)this.thigh_right.angleY=-1.57;
else if(this.thigh_right.angleY>1.57)this.thigh_right.angleY=1.57;
if(this.thigh_right.angleZ<-0.2)this.thigh_right.angleZ=-0.2;
else if(this.thigh_right.angleZ>2)this.thigh_right.angleZ=2;
if(this.thigh_right.angleX<-1)this.thigh_right.angleX=-1;
else if(this.thigh_right.angleX>2.6)this.thigh_right.angleX=2.6;
if(this.calf_left.angleX<0)this.calf_left.angleX=0;
else if(this.calf_left.angleX>2.6)this.calf_left.angleX=2.6;
if(this.calf_right.angleX<0)this.calf_right.angleX=0;
else if(this.calf_right.angleX>2.6)this.calf_right.angleX=2.6;
if(this.foot_left.angleX<-0.4)this.foot_left.angleX=-0.4;
else if(this.foot_left.angleX>1.5)this.foot_left.angleX=1.5;
if(this.foot_right.angleX<-0.4)this.foot_right.angleX=-0.4;
else if(this.foot_right.angleX>1.5)this.foot_right.angleX=1.5;
if(this.abdomen.angleY<-1)this.abdomen.angleY=-1;
else if(this.abdomen.angleY>1)this.abdomen.angleY=1;
if(this.abdomen.angleZ<-0.7)this.abdomen.angleZ=-0.7;
else if(this.abdomen.angleZ>0.7)this.abdomen.angleZ=0.7;
if(this.abdomen.angleX<-0.4)this.abdomen.angleX=-0.4;
else if(this.abdomen.angleX>1.5)this.abdomen.angleX=1.5;
};

function HumanSize()
{
	this.thorax={height:0.4,width:0.5};
	this.abdomen={height:0.2,width:0.3};
	this.neck={length:0.2};
	this.upperarm_left={length:0.3};
	this.forearm_left={length:0.4};
	this.upperarm_right={length:0.3};
	this.forearm_right={length:0.4};
	this.thigh_left={length:0.3};
	this.calf_left={length:0.4};
	this.foot_left={length:0.2};
	this.thigh_right={length:0.3};
	this.calf_right={length:0.4};
	this.foot_right={length:0.2};
	
	/*var s=2;
	this.thorax={height:0.4*s,width:0.5*s};
	this.abdomen={height:0.2*s,width:0.3*s};
	this.neck={length:0.2*s};
	this.upperarm_left={length:0.3*s};
	this.forearm_left={length:0.4*s};
	this.upperarm_right={length:0.3*s};
	this.forearm_right={length:0.4*s};
	this.thigh_left={length:0.3*s};
	this.calf_left={length:0.4*s};
	this.foot_left={length:0.2*s};
	this.thigh_right={length:0.3*s};
	this.calf_right={length:0.4*s};
	this.foot_right={length:0.2*s};*/
}

function HumanSkeleton(options)
{
	var opt=options||{};
	
	this.player_Id=-1;
	this.skeleton_tracked = new Boolean(false);
	this.positions={spine_mid:[0,0,0]};
	this.posture=new HumanPosture();
	this.size=new HumanSize();
		
	if(opt.raw)
	{
		this.setPositions(opt.raw);
	}
}

HumanSkeleton.prototype.IsTracked = function(){
		return this.skeleton_tracked;
	};

HumanSkeleton.prototype.setIsTracked = function(value){
		this.skeleton_tracked = value;
	};

HumanSkeleton.prototype.getPlayerId = function(){
	return this.player_Id;
};

HumanSkeleton.prototype.setPlayerId = function(value){
	this.player_Id = value;
};

HumanSkeleton.prototype.getPosition=function(joint){return this.positions[joint];};
HumanSkeleton.prototype.getPositions=function(){return this.positions;};

HumanSkeleton.prototype.setPositions=function(raw)
{
	if(raw.length==60)//kinect 1
	{
		this.xyz=new Float32Array(75);
		var data=this.xyz;
		for(var i=0;i<60;i++)data[i]=raw[i];
		//data[60]=(data[12]+data[24])/2;
			//data[61]=(data[13]+data[25])/2;
			//data[62]=(data[14]+data[26])/2;
			
			data[60]=data[6]+0.2*(data[3]-data[6]);
			data[61]=data[7]+0.2*(data[4]-data[7]);
			data[62]=data[8]+0.2*(data[5]-data[8]);
			
			
			data[63]=data[21];
			data[64]=data[22];
		data[65]=data[23];
	data[66]=data[21];
			data[67]=data[22];
		data[68]=data[23];
			
			data[69]=data[33];
			data[70]=data[34];
		data[71]=data[35];
	data[72]=data[33];
			data[73]=data[34];
		data[74]=data[35];
	}
	
	if(raw.length==75)//kinect 2
	{
		this.xyz=new Float32Array(raw);//store it, so that we have it as an array
	}
	
	var x=this.xyz;
	var p=this.positions;
	p.spine_base=[x[0],x[1],x[2]];
	p.spine_mid=[x[3],x[4],x[5]];//former spine
	p.neck=[x[6],x[7],x[8]];//former shoulder_center
	p.head=[x[9],x[10],x[11]];
	p.shoulder_left=[x[12],x[13],x[14]];
	p.elbow_left=[x[15],x[16],x[17]];
	p.wrist_left=[x[18],x[19],x[20]];
	p.hand_left=[x[21],x[22],x[23]];
	p.shoulder_right=[x[24],x[25],x[26]];
	p.elbow_right=[x[27],x[28],x[29]];
	p.wrist_right=[x[30],x[31],x[32]];
	p.hand_right=[x[33],x[34],x[35]];
	p.hip_left=[x[36],x[37],x[38]];
	p.knee_left=[x[39],x[40],x[41]];
	p.ankle_left=[x[42],x[43],x[44]];
	p.foot_left=[x[45],x[46],x[47]];
	p.hip_right=[x[48],x[49],x[50]];
	p.knee_right=[x[51],x[52],x[53]];
	p.ankle_right=[x[54],x[55],x[56]];
	p.foot_right=[x[57],x[58],x[59]];
	p.spine_shoulder=[x[60],x[61],x[62]];
	p.hand_tip_left=[x[63],x[64],x[65]];
	p.thumb_left=[x[66],x[67],x[68]];
	p.hand_tip_right=[x[69],x[70],x[71]];
	p.thumb_right=[x[72],x[73],x[74]];
	
	this._computeSize();		
	this._computePosture();
	this.posture.flip();
};

HumanSkeleton.prototype.calculateAnglesFromAxes=function(x,y)//,z)
{
	var o={};
	//calculate angleY
	var v=vec3.create(x);
	v[1]=0;
	vec3.normalize(v);
	o.angleY=-Math.atan2(v[2],v[0]);
	
	//when x=[0,1,0] or [0,-1,0] the atan2 is not defined.
	if(Math.abs(x[1])>0.9)
	{
		if(v[2]==0 && v[0]==0) o.angleY=0;
		else o.angleY*=Math.max((0.95-Math.abs(x[1]))/0.05,0);
	}
	
	//calculate angleZ
	var m=mat4.create();
	mat4.identity(m);
	mat4.rotateY(m,-o.angleY);
	mat4.multiplyVec3(m,x,v);
	v[2]=0;
	vec3.normalize(v);
	o.angleZ=Math.atan2(v[1],v[0]);
	
	//calculate angleX
	//mat4.identity(m);
	//mat4.rotateZ(m,-o.angleZ);
	//mat4.rotateY(m,-o.angleY);
	mat4.rotateZL(-o.angleZ,m);
	mat4.multiplyVec3(m,y,v);
	v[0]=0;
	vec3.normalize(v);
	o.angleX=Math.atan2(v[2],v[1]);
	
	if(y[1]<-0.5 && o.angleX<-3.14/2)o.angleX+=3.14*2;
	
	//testing
	//mat4.identity(m);
	//mat4.rotateX(m,-o.angleX);
	//mat4.rotateZ(m,-o.angleZ);
	//mat4.rotateY(m,-o.angleY);
	//mat4.multiplyVec3(m,x,v);console.log(v);//must be [1 0 0]
	//mat4.multiplyVec3(m,y,v);console.log(v);//must be [0 1 0]
	//mat4.multiplyVec3(m,z,v);console.log(v);//must be [0 0 1]
	return o;
};

HumanSkeleton.prototype.calculateAnglesFromVector=function(y)
{
	var o={};
	//calculate angleY
	var v=vec3.create(y);//x);
	//v[1]=0;
	//vec3.normalize(v);
	o.angleY=0;//-Math.atan2(v[2],v[0]);
	
	//calculate angleZ
	var m=mat4.create();
	//mat4.identity(m);
	//mat4.rotateY(m,-o.angleY);
	//mat4.multiplyVec3(m,x,v);
	v[2]=0;
	vec3.normalize(v);
	o.angleZ=Math.atan2(v[0],v[1]);
	
	//calculate angleX
	mat4.identity(m);
	mat4.rotateZ(m,-o.angleZ);
	//mat4.rotateY(m,-o.angleY);
	mat4.multiplyVec3(m,y,v);
	v[0]=0;
	vec3.normalize(v);
	o.angleX=Math.atan2(v[2],v[1]);
	
	//testing
	//mat4.identity(m);
	//mat4.rotateX(m,-o.angleX);
	//mat4.rotateZ(m,-o.angleZ);
	//mat4.rotateY(m,-o.angleY);
	//mat4.multiplyVec3(m,x,v);console.log(v);//must be [1 0 0]
	//mat4.multiplyVec3(m,y,v);console.log(v);//must be [0 1 0]
	//mat4.multiplyVec3(m,z,v);console.log(v);//must be [0 0 1]
	return o;
};

HumanSkeleton.prototype._computeSize=function()
{
	var s=this.size;
	var p=this.positions;
s.thorax.height=vec3.dist(p.spine_mid,p.spine_shoulder);		
s.thorax.width=vec3.dist(p.shoulder_left,p.shoulder_right);
s.abdomen.height=vec3.dist(p.spine_mid,p.spine_base);
s.abdomen.width=vec3.dist(p.hip_left,p.hip_right);
s.upperarm_left.length=vec3.dist(p.shoulder_left,p.elbow_left);
s.upperarm_right.length=vec3.dist(p.shoulder_right,p.elbow_right);
s.forearm_left.length=vec3.dist(p.wrist_left,p.elbow_left);
s.forearm_right.length=vec3.dist(p.wrist_right,p.elbow_right);
s.thigh_left.length=vec3.dist(p.hip_left,p.knee_left);
s.thigh_right.length=vec3.dist(p.hip_right,p.knee_right);
s.calf_left.length=vec3.dist(p.ankle_left,p.knee_left);
s.calf_right.length=vec3.dist(p.ankle_right,p.knee_right);
s.foot_left.length=vec3.dist(p.ankle_left,p.foot_left);
s.foot_right.length=vec3.dist(p.ankle_right,p.foot_right);
};

HumanSkeleton.prototype._computePosture=function()
{	
	var a=vec3.create();
	var b=vec3.create();
	var p=this.positions;
	vec3.direction(p.shoulder_right,p.elbow_right,a);
	vec3.direction(p.wrist_right,p.elbow_right,b);
	this.posture.forearm_right.angleX=3.1415-Math.acos(vec3.dot(a,b));
	
	vec3.direction(p.shoulder_left,p.elbow_left,a);
	vec3.direction(p.wrist_left,p.elbow_left,b);
	this.posture.forearm_left.angleX=3.1415-Math.acos(vec3.dot(a,b));

	vec3.direction(p.hip_right,p.knee_right,a);
	vec3.direction(p.ankle_right,p.knee_right,b);
	this.posture.calf_right.angleX=3.1415-Math.acos(vec3.dot(a,b));
	
	vec3.direction(p.hip_left,p.knee_left,a);
	vec3.direction(p.ankle_left,p.knee_left,b);
	this.posture.calf_left.angleX=3.1415-Math.acos(vec3.dot(a,b));
	
	vec3.direction(p.knee_right,p.ankle_right,a);
	vec3.direction(p.foot_right,p.ankle_right,b);
	this.posture.foot_right.angleX=Math.acos(vec3.dot(a,b))-3.1415/2;
	
	vec3.direction(p.knee_left,p.ankle_left,a);
	vec3.direction(p.foot_left,p.ankle_left,b);
	this.posture.foot_left.angleX=Math.acos(vec3.dot(a,b))-3.1415/2;


	var sl=p.shoulder_left;
	var sr=p.shoulder_right;
	var sc=p.spine_shoulder;
    var hc=p.spine_mid;

   	var x=vec3.create();
	var y=vec3.create();
	var z=vec3.create();
	
	//COMPUTING THE NORMAL OF THE LEFT THORAX TRIANGLE
	var c1=vec3.create();
	vec3.subtract(sc,sl,x);
	//vec3.normalize(a);
	vec3.direction(hc,sc,y);
	vec3.cross(x,y,c1);
	vec3.normalize(c1);
	
	//COMPUTING THE NORMAL OF THE RIGHT THORAX TRIANGLE
	var c2=vec3.create();
	vec3.subtract(sr,sc,x);
	//vec3.normalize(a);
	vec3.cross(x,y,c2);
	vec3.normalize(c2);
	
	vec3.add(c1,c2,z);
	vec3.scale(z,0.5);
	vec3.normalize(z);
	
	y[0]=-y[0];y[1]=-y[1];y[2]=-y[2];
	vec3.cross(y,z,x);
	vec3.normalize(x);
	
	this.posture.thorax=this.calculateAnglesFromAxes(x,y);
	
	this.posture.thorax.angleY+=3.14;
	if(this.posture.thorax.angleY>3.14)this.posture.thorax.angleY-=6.28;
	
	
	
	var m2=mat4.create();
	mat4.identity(m2);
	//mat4.rotateZ(m2,-3.14);
	//mat4.rotateX(m2,-this.posture.thorax.angleX);
	//mat4.rotateZ(m2,-this.posture.thorax.angleZ);
	//mat4.rotateY(m2,-this.posture.thorax.angleY-3.14);
	
	mat4.rotateYL(-this.posture.thorax.angleY-3.14,m2);
	mat4.rotateZL(-this.posture.thorax.angleZ,m2);
	mat4.rotateXL(-this.posture.thorax.angleX,m2);
	
	
	//neck
	vec3.direction(p.head,p.neck,y);
	mat4.multiplyVec3(m2,y);	
	this.posture.neck=this.calculateAnglesFromVector(y);
	
	//left arm
	mat4.rotateZL(3.14,m2);
	
	vec3.direction(p.elbow_left,p.shoulder_left,y);
	var dir2=vec3.create();
	vec3.direction(p.wrist_left,p.elbow_left,dir2);
	
	mat4.multiplyVec3(m2,y);	
	
	//console.log(y);
	
	mat4.multiplyVec3(m2,dir2);
	
	vec3.cross(y,dir2,x);
	vec3.normalize(x);
	
	if(Math.abs(this.posture.forearm_left.angleX)<1)
	{ 
	var y2=vec3.create();
	vec3.direction(p.wrist_left,p.shoulder_left,y2);
	mat4.multiplyVec3(m2,y2);

	vec3.lerp(y,y2,1-Math.abs(this.posture.forearm_left.angleX));
	vec3.normalize(y);
	
	var x2=vec3.create();
	vec3.cross([1-y[0]*y[0],0,y[0]*y[0]],y,z);
	vec3.normalize(z);
	vec3.cross(y,z,x2);
	vec3.normalize(x2);
	
	vec3.lerp(x,x2,1-Math.abs(this.posture.forearm_left.angleX));
	
	vec3.normalize(x);
	
	}
	
	vec3.cross(x,y,z);
	vec3.normalize(z);
	this.posture.upperarm_left=this.calculateAnglesFromAxes(x,y);
	this.posture.upperarm_left.angleZ*=-1;
	//console.log(this.posture.upperarm_left.angleX+'  '+this.posture.upperarm_left.angleY+' '+this.posture.upperarm_left.angleZ);
	
	//--------------
	//mat4.rotateZL(-3.14,m2);
	
	vec3.direction(p.elbow_right,p.shoulder_right,y);
	vec3.direction(p.wrist_right,p.elbow_right,dir2);
	
	mat4.multiplyVec3(m2,y);	
		
	mat4.multiplyVec3(m2,dir2);
	
	vec3.cross(y,dir2,x);
	vec3.normalize(x);
	
	if(Math.abs(this.posture.forearm_right.angleX)<1)
	{ 

	var y2=vec3.create();
	vec3.direction(p.wrist_right,p.shoulder_right,y2);
	mat4.multiplyVec3(m2,y2);

	vec3.lerp(y,y2,1-Math.abs(this.posture.forearm_right.angleX));
	vec3.normalize(y);

	var x2=vec3.create();
	vec3.cross([1-y[0]*y[0],0,-y[0]*y[0]],y,z);
	vec3.normalize(z);
	vec3.cross(y,z,x2);
	vec3.normalize(x2);
	
	vec3.lerp(x,x2,1-Math.abs(this.posture.forearm_right.angleX));
	
	vec3.normalize(x);
	
	}
	
	vec3.cross(x,y,z);
	vec3.normalize(z);
	
	this.posture.upperarm_right=this.calculateAnglesFromAxes(x,y);
	//console.log(this.posture.upperarm_right.angleX+' '+this.posture.upperarm_right.angleY);
	

	//---ABDOMEN-----------
	//mat4.rotateZL(-3.14/2,m2);
	
	vec3.direction(p.spine_base,p.spine_mid,y);
	vec3.direction(p.hip_right,p.hip_left,x);
	
	mat4.multiplyVec3(m2,y);	
	mat4.multiplyVec3(m2,x);

	
	vec3.cross(x,y,z);
	vec3.normalize(z);
	
	this.posture.abdomen=this.calculateAnglesFromAxes(x,y);
	
//---LEFT THIGH------
	//mat4.identity(m2);
	//mat4.rotateX(m2,-this.posture.abdomen.angleX);
	//mat4.rotateZ(m2,-this.posture.abdomen.angleZ);
	//mat4.rotateY(m2,-this.posture.abdomen.angleY);
	//mat4.rotateZ(m2,-3.14);
	//mat4.rotateX(m2,-this.posture.thorax.angleX);
	//mat4.rotateZ(m2,-this.posture.thorax.angleZ);
	//mat4.rotateY(m2,-this.posture.thorax.angleY-3.14);
	
	mat4.rotateYL(-this.posture.abdomen.angleY,m2);
	mat4.rotateZL(-this.posture.abdomen.angleZ,m2);
	mat4.rotateXL(-this.posture.abdomen.angleX,m2);
	
	vec3.direction(p.knee_left,p.hip_left,y);
	var dir2=vec3.create();
	vec3.direction(p.knee_left,p.ankle_left,dir2);
	
	mat4.multiplyVec3(m2,y);	
	
	mat4.multiplyVec3(m2,dir2);
	
	vec3.cross(y,dir2,x);
	vec3.normalize(x);

	if(Math.abs(this.posture.calf_left.angleX)<1)
	{ 

	var y2=vec3.create();
	vec3.direction(p.ankle_left,p.hip_left,y2);
	mat4.multiplyVec3(m2,y2);

	vec3.lerp(y,y2,1-Math.abs(this.posture.calf_left.angleX));
	vec3.normalize(y);

	var x2=vec3.create();
	vec3.cross([1-y[0]*y[0],y[0]*y[0],0],y,z);
	vec3.normalize(z);
	vec3.cross(y,z,x2);
	vec3.normalize(x2);
	
	vec3.lerp(x,x2,1-Math.abs(this.posture.calf_left.angleX));
	
	vec3.normalize(x);
	}
	
	vec3.cross(x,y,z);
	vec3.normalize(z);
	
	this.posture.thigh_left=this.calculateAnglesFromAxes(x,y);
	this.posture.thigh_left.angleZ*=-1;
	
//---RIGHT THIGH------
vec3.direction(p.knee_right,p.hip_right,y);
	var dir2=vec3.create();
	vec3.direction(p.knee_right,p.ankle_right,dir2);
	
	mat4.multiplyVec3(m2,y);	
	
	mat4.multiplyVec3(m2,dir2);
	
	vec3.cross(y,dir2,x);
	vec3.normalize(x);

	if(Math.abs(this.posture.calf_right.angleX)<1)
	{ 
	var y2=vec3.create();
	vec3.direction(p.ankle_right,p.hip_right,y2);
	mat4.multiplyVec3(m2,y2);

	vec3.lerp(y,y2,1-Math.abs(this.posture.calf_right.angleX));
	vec3.normalize(y);
	
	var x2=vec3.create();
	vec3.cross([1-y[0]*y[0],-y[0]*y[0],0],y,z);
	vec3.normalize(z);
	vec3.cross(y,z,x2);
	vec3.normalize(x2);
	
	vec3.lerp(x,x2,1-Math.abs(this.posture.calf_right.angleX));
	
	vec3.normalize(x);
	}
	
	vec3.cross(x,y,z);
	vec3.normalize(z);
	
	this.posture.thigh_right=this.calculateAnglesFromAxes(x,y);
	
	
};

HumanSkeleton.getSkeleton = function(id, frame){
	
	var active_skeletons_array=frame.skeletons_tracked;
	
	var newSkeleton = new HumanSkeleton();

	if(id < 0 || id >= 6 || active_skeletons_array == null)
		return null;

	newSkeleton.setPlayerId(id);
	newSkeleton.setIsTracked(true);

	var check_i = -1;
	for(var i = 0; i < active_skeletons_array.length; i++){
		if(active_skeletons_array[i] == id)
		{
			check_i=i;
			break;
		}
	}
	if(check_i==-1)
		return null;
	
	if(frame.posture_data)
	{
		var i = 32*check_i;
		var raw=frame.posture_data.slice(i,i+32);
		
		var s=newSkeleton;
		s.positions.floor_level = 0;
		s.positions.jump = 0;
		//s.positions.ankle_left=[null,raw[0],null];
		//s.positions.ankle_right=[null,raw[0],null];
		s.positions.spine_mid = [raw[0], raw[1], raw[2]];
		//s.size.torso={height:raw[4]};
		
		s.posture.thorax.angleX = raw[3]; s.posture.thorax.angleY = raw[4]; s.posture.thorax.angleZ = raw[5];
		s.posture.abdomen.angleX = raw[6]; s.posture.abdomen.angleY = raw[7]; s.posture.abdomen.angleZ = raw[8];
		s.posture.neck.angleX = raw[9]; s.posture.neck.angleY = raw[10]; s.posture.neck.angleZ = raw[11];
		s.posture.upperarm_left.angleX = raw[12]; s.posture.upperarm_left.angleY = raw[13]; s.posture.upperarm_left.angleZ = raw[14];
		s.posture.forearm_left.angleX = raw[15];
		s.posture.upperarm_right.angleX = raw[16]; s.posture.upperarm_right.angleY = raw[17]; s.posture.upperarm_right.angleZ = raw[18];
		s.posture.forearm_right.angleX = raw[19];
		
		s.posture.thigh_left.angleX = raw[20]; s.posture.thigh_left.angleY = raw[21]; s.posture.thigh_left.angleZ = raw[22];
		s.posture.calf_left.angleX = raw[23];
		s.posture.foot_left.angleX = raw[24];s.posture.foot_left.angleX = raw[25];
		s.posture.thigh_right.angleX = raw[26]; s.posture.thigh_right.angleY = raw[27]; s.posture.thigh_right.angleZ = raw[28];
		s.posture.calf_right.angleX = raw[29];
		s.posture.foot_right.angleX = raw[30];s.posture.foot_right.angleX = raw[31];
		return newSkeleton;
	}
	
	var position_array=frame.joint_positions;
	var orientations_array=frame.joint_orientations;
	var states_array=frame.joint_states;
	
	// XYZW Plane
	/*var data = new Float64Array(4);
	if(position_array != null){
		for(var i=0; i<4; i++){
			data[i] = position_array[i];
		}
	}
	newSkeleton.setXYZW(data);*/

	// Joint positions
	if(position_array != null){
		var i = 4 + 75*check_i;
		var data=position_array.slice(i,i+75);
			var states=states_array.slice(25*check_i,25*check_i+25);
			if(states[20]+states[21]+states[22]+states[23]+states[24]==0)//old kinect
			{
			//data[60]=(data[12]+data[24])/2;
			//data[61]=(data[13]+data[25])/2;
			//data[62]=(data[14]+data[26])/2;
			
			data[60]=data[6]+0.2*(data[3]-data[6]);
			data[61]=data[7]+0.2*(data[4]-data[7]);
			data[62]=data[8]+0.2*(data[5]-data[8]);
			
			
			data[63]=data[21];
			data[64]=data[22];
		data[65]=data[23];
	data[66]=data[21];
			data[67]=data[22];
		data[68]=data[23];
			
			data[69]=data[33];
			data[70]=data[34];
		data[71]=data[35];
	data[72]=data[33];
			data[73]=data[34];
		data[74]=data[35];
			
			}
			newSkeleton.setPositions(data);
	}
	

	// Joint orientations
	/*data = new Float64Array(Skeleton.JOINT_COUNT*4);
	if(orientations_array != null){
			var i = (Skeleton.JOINT_COUNT*4)*check_i;
			for(;i<Skeleton.JOINT_COUNT*4;i++){
				data[i] = orientations_array[i];
			}
	}
	newSkeleton.setJointOrientations(data);*/

	// Joint States
	/*data = new Uint8Array(Skeleton.JOINT_COUNT);
	if(states_array != null){
			var i = (Skeleton.JOINT_COUNT)*check_i;
			for(;i<Skeleton.JOINT_COUNT;i++){
				data[i] = states_array[i];
			}
	}
	newSkeleton.setJointTrackingStates(data);*/

	return newSkeleton;
};

function StickManPlot(canvas)
{
	this.obj=new GLObject(canvas);
	this.canvas=canvas;
	this.obj.setLines([0,1, 1,20, 20,2, 2,3, 20,4, 4,5, 5,6, 6,7, 20,8, 8,9, 9,10, 10,11, 0,12, 12,13, 13,14, 14,15, 0,16, 16,17, 17,18, 18,19, 7,21, 7,22, 11,23, 11,24,     1,4, 1,8, 1,12, 1,16]);
	this.obj.getShader().setColorMask([1,0,0,1]);
	this.center=[0,0,0];
}

StickManPlot.prototype.setSkeleton=function(skeleton)
{
	if(skeleton.xyz)
	{
		var x=skeleton.xyz;
		this.center=[x[3],x[4],x[5]];
		this.obj.setXYZ(x)
	}
};

StickManPlot.prototype.draw=function()
{
	var cam=this.canvas.getCamera();
	var gl=this.canvas.getGL();
	gl.disable(gl.DEPTH_TEST);
	var c=this.center;
	cam.translate(c);
	cam.rotateY(3.14);
	cam.translate([-c[0], -c[1], c[2]]);
	this.obj.updateShader();
	this.obj.draw();
	gl.enable(gl.DEPTH_TEST);
};

function HumanGesture()
{
	this.promise=new VNPromise();
}

HumanGesture.prototype.setAvatar=function(avatar)
{
	this.promise.setObject({gesture:this,avatar:avatar});
};

HumanGesture.prototype.onStateChange=function(){return this.promise;};

HumanGesture.prototype.addFrame=function(posture)
{
	//this.promise.callThen();
};

function HumanAvatar(canvas)
{
	this.canvas=canvas;
	this.positions={spine_mid:[0,0,0]};
	this.posture=new HumanPosture();
	this.size=new HumanSize();
	this.translation=[0,0,0];
	this.rotation_angle=0;
	this.rotation_axis=[0,1,0];
	this.scale=[1,1,1];
	this.real_player_center=[0,null,-2];//assuming that the player is approximately at z=-2 in the real world
	this.animator=new TimeSeriesPlayer();
	var self=this;
	this.animator_options={};
	this.animator.onFrame=function(f)
	{
		self.setSkeleton(new HumanSkeleton({raw:f.d}),self.animator_options);
	};
	this.gestures=[];
	this.last_moved_at=0;
	
	this.est_floor=0;
	this.est_spine_mid=0;
	this.est_counter=0;
	this.est_error=0;
	this.est_torso_height=0;
	this.est_size_ratio=1;
	this.jump=0;
	this.computed_min_y=0;
	this.last_computed_min_y=0;
	this.player_Id=-1;
}

HumanAvatar.prototype.recognizeGesture=function(gesture)
{
	gesture.setAvatar(this);
	this.gestures.push(gesture);
	return gesture.onStateChange();
};

HumanAvatar.prototype.animate=function(series,options)
{
	if(options && options.queue) this.animator.queue(series,options);
	else this.animator.play(series,options);
	this.animator_options=options;
};

HumanAvatar.prototype.lerpc=function(a,b,w)
{
	var d=b-a;
	if(d>3.14) return a+w*(d-2*3.14);
	else if(d<-3.14)return a+w*(d+2*3.14);
	return a+w*(b-a);
};

HumanAvatar.prototype.lerp=function(a,b,w)
{
	//if(Math.abs(a-b)>3.14){console.log('Interpolation Error a='+a+' b='+b);f();}
	
	return a+w*(b-a);
};

HumanAvatar.prototype.resetPlayer=function()
{
	this.est_counter=0;
	this.jump=0;
};

HumanAvatar.prototype.setSkeleton=function(skeleton,options) 
{
	if(skeleton==null)return;
	var s=skeleton;
	var opt=options||{};
	
	vn.default(opt,{minZ:0,maxZ:8,maxYangle:3.14});
	if(s.positions.spine_mid[2]<opt.minZ || s.positions.spine_mid[2]>opt.maxZ) return;
	if(Math.abs(s.posture.thorax.angleY)>opt.maxYangle)return;
	
	/*if(s.positions.jump)//if jump and torso height have been pre-calculated
	{
		this.jump=this.jump*0.5+0.5*s.positions.jump;
		if(s.size.torso)
			this.est_size_ratio=(this.size.thorax.height+this.size.abdomen.height)/s.size.torso.height;
		if(s.positions.floor_level)this.est_floor=s.positions.floor_level;
	}
	else if(s.positions.ankle_left && s.positions.ankle_right)//we have to calculate jump and torso height
	{	
		var id=s.getPlayerId();
		if(id!=this.player_Id){this.player_Id=id;this.resetPlayer();}
		
		var m=Math.min(s.positions.ankle_left[1],s.positions.ankle_right[1]);
		
		var m2=s.positions.spine_mid[1];
		if(this.est_counter>0)
		{
			this.est_size_ratio=(this.size.thorax.height+this.size.abdomen.height)/this.est_torso_height;
			//there are two ways to calculate the jump. 
			var jump1=m-this.est_floor;//this does not give you the natural walking wave (up and down)
			var jump2=m2-this.est_spine_mid;//this is problematic when you raise your hands
		
			
			if(jump2-jump1>0.08*this.est_torso_height) //this is true when you raise your hands
			{
				this.est_error+=1;
				if(this.est_error>20)this.est_error=20;
			}
			else {
				this.est_error-=1;
				if(this.est_error<0)this.est_error=0;
			}
			
			//if there is no error we use jump2, else we use jump1
			var w=Math.exp(-this.est_error*0.1);
			var j=(Math.max(jump2,0)*w+(1-w)*jump1);
			
			this.jump=this.jump*0.5+0.5*j;
		}
		var c=this.est_counter;
		var c1=c+1;
		this.est_floor=(this.est_floor*c+m)/c1;//average floor level
		this.est_spine_mid=(this.est_spine_mid*c+m2)/c1;//average spine mid level
		this.est_torso_height=(this.est_torso_height*c+(s.size.thorax.height+s.size.abdomen.height))/c1;//average torso height
		this.est_counter=c1;	
	}*/
	
	this.last_moved_at=new Date().getTime();
	this.canvas.updatePickingMap(true);
	
	if(opt.lerp)
	{
		var p= s.positions.spine_mid;
		vec3.lerp(this.positions.spine_mid,[p[0],p[1],-p[2]],opt.lerp);
		
		this.posture.forearm_left.angleX=this.lerp(this.posture.forearm_left.angleX,s.posture.forearm_left.angleX,opt.lerp);
		this.posture.forearm_right.angleX=this.lerp(this.posture.forearm_right.angleX,s.posture.forearm_right.angleX,opt.lerp);
		this.posture.calf_left.angleX=this.lerp(this.posture.calf_left.angleX,s.posture.calf_left.angleX,opt.lerp);
		this.posture.calf_right.angleX=this.lerp(this.posture.calf_right.angleX,s.posture.calf_right.angleX,opt.lerp);
		
		this.posture.foot_left.angleX=this.lerp(this.posture.foot_left.angleX,s.posture.foot_left.angleX,opt.lerp);
		this.posture.foot_right.angleX=this.lerp(this.posture.foot_right.angleX,s.posture.foot_right.angleX,opt.lerp);
		
		this.posture.thorax.angleY=this.lerpc(this.posture.thorax.angleY,s.posture.thorax.angleY,opt.lerp);
		this.posture.thorax.angleZ=this.lerp(this.posture.thorax.angleZ,s.posture.thorax.angleZ,opt.lerp);
		this.posture.thorax.angleX=this.lerp(this.posture.thorax.angleX,s.posture.thorax.angleX,opt.lerp);
		
		this.posture.upperarm_left.angleY=this.lerpc(this.posture.upperarm_left.angleY,s.posture.upperarm_left.angleY,opt.lerp);
		this.posture.upperarm_left.angleZ=this.lerp(this.posture.upperarm_left.angleZ,s.posture.upperarm_left.angleZ,opt.lerp);
		this.posture.upperarm_left.angleX=this.lerp(this.posture.upperarm_left.angleX,s.posture.upperarm_left.angleX,opt.lerp);
		
		this.posture.upperarm_right.angleY=this.lerpc(this.posture.upperarm_right.angleY,s.posture.upperarm_right.angleY,opt.lerp);
		this.posture.upperarm_right.angleZ=this.lerp(this.posture.upperarm_right.angleZ,s.posture.upperarm_right.angleZ,opt.lerp);
		this.posture.upperarm_right.angleX=this.lerp(this.posture.upperarm_right.angleX,s.posture.upperarm_right.angleX,opt.lerp);
		
		this.posture.neck.angleZ=this.lerp(this.posture.neck.angleZ,s.posture.neck.angleZ,opt.lerp);
		this.posture.neck.angleX=this.lerp(this.posture.neck.angleX,s.posture.neck.angleX,opt.lerp);
		
		this.posture.abdomen.angleY=this.lerp(this.posture.abdomen.angleY,s.posture.abdomen.angleY,opt.lerp);
		this.posture.abdomen.angleZ=this.lerp(this.posture.abdomen.angleZ,s.posture.abdomen.angleZ,opt.lerp);
		this.posture.abdomen.angleX=this.lerp(this.posture.abdomen.angleX,s.posture.abdomen.angleX,opt.lerp);
		
		this.posture.thigh_left.angleY=this.lerp(this.posture.thigh_left.angleY,s.posture.thigh_left.angleY,opt.lerp);
		this.posture.thigh_left.angleZ=this.lerp(this.posture.thigh_left.angleZ,s.posture.thigh_left.angleZ,opt.lerp);
		this.posture.thigh_left.angleX=this.lerp(this.posture.thigh_left.angleX,s.posture.thigh_left.angleX,opt.lerp);
		
		this.posture.thigh_right.angleY=this.lerp(this.posture.thigh_right.angleY,s.posture.thigh_right.angleY,opt.lerp);
		this.posture.thigh_right.angleZ=this.lerp(this.posture.thigh_right.angleZ,s.posture.thigh_right.angleZ,opt.lerp);
		this.posture.thigh_right.angleX=this.lerp(this.posture.thigh_right.angleX,s.posture.thigh_right.angleX,opt.lerp);
		
		if(opt.size)
		{
			this.size.thorax.height=s.size.thorax.height;
			this.size.thorax.width=s.size.thorax.width;
			this.size.abdomen.height=s.size.abdomen.height;
			this.size.abdomen.width=s.size.abdomen.width;
			this.size.upperarm_left.length=s.size.upperarm_left.length;
			this.size.upperarm_right.length=s.size.upperarm_right.length;
			this.size.forearm_left.length=s.size.forearm_left.length;
			this.size.forearm_right.length=s.size.forearm_right.length;
			this.size.thigh_left.length=s.size.thigh_left.length;
			this.size.thigh_right.length=s.size.thigh_right.length;
			this.size.calf_left.length=s.size.calf_left.length;
			this.size.calf_right.length=s.size.calf_right.length;
			this.size.foot_left.length=s.size.foot_left.length;
			this.size.foot_right.length=s.size.foot_right.length;
			
		}
	}
	else	
	{
		this.positions=s.positions;
		this.positions.spine_mid[2]=-this.positions.spine_mid[2];
		this.posture=s.posture;
	}
	
	this.posture.correct();
	
	for(var i=0;i<this.gestures.length;i++)
		this.gestures[i].addFrame(this.posture);
};

HumanAvatar.prototype.setPosition=function(p)
{
   this.translation=p;
};

HumanAvatar.prototype.setScale=function(s,r)
{
   this.scale=s;
   if(r)this.real_player_center=r;
};

HumanAvatar.prototype.setOrientation=function(angle,axis)
{
   this.rotation_angle=angle;
   this.rotation_axis=axis;
};

HumanAvatar.prototype.getPosition=function()
{return this.position;};

HumanAvatar.prototype.getPosture=function()
{return this.posture;};

HumanAvatar.prototype.getSize=function()
{return this.size;};

HumanAvatar.prototype.drawHead=function(){};
HumanAvatar.prototype.drawNeck=function(){};
HumanAvatar.prototype.drawThorax=function(){};
HumanAvatar.prototype.drawAbdomen=function(){};
HumanAvatar.prototype.drawLeftUpperArm=function(){};
HumanAvatar.prototype.drawLeftForearm=function(){};
HumanAvatar.prototype.drawRightUpperArm=function(){};
HumanAvatar.prototype.drawRightForearm=function(){};
HumanAvatar.prototype.drawLeftThigh=function(){};
HumanAvatar.prototype.drawLeftCalf=function(){};
HumanAvatar.prototype.drawLeftFoot=function(){};
HumanAvatar.prototype.drawRightThigh=function(){};
HumanAvatar.prototype.drawRightCalf=function(){};
HumanAvatar.prototype.drawRightFoot=function(){};

HumanAvatar.prototype.computeMinY=function()
{
	if(this.last_moved_at<=this.last_computed_min_y)
	{
		return this.computed_min_y;
	}
	else this.last_computed_min_y=this.last_moved_at;
	var p=this.posture;
    var s=this.size;
	
	var m=mat4.create();
	mat4.identity(m);
	
	mat4.rotateY(m,p.thorax.angleY);
	mat4.rotateZ(m,p.thorax.angleZ);
	mat4.rotateX(m,p.thorax.angleX);
	
	mat4.rotateZ(m,3.14);
    mat4.rotateY(m,p.abdomen.angleY);
    mat4.rotateZ(m,p.abdomen.angleZ);
    mat4.rotateX(m,p.abdomen.angleX);
	
	mat4.translate(m,[0,s.abdomen.height,0]);
	
   var m2=mat4.create(m);
   mat4.translate(m,[-s.abdomen.width/2,0,0]);
   mat4.rotateY(m,p.thigh_left.angleY);
   mat4.rotateZ(m,p.thigh_left.angleZ);
   mat4.rotateX(m,p.thigh_left.angleX);
   
   mat4.translate(m,[0,s.thigh_left.length,0]);
   mat4.rotateX(m,-p.calf_left.angleX);
    
   var left=[0,s.calf_left.length,0];
   mat4.multiplyVec3(m,left);
   
   mat4.translate(m2,[s.abdomen.width/2,0,0]);
   mat4.rotateY(m2,p.thigh_right.angleY);
   mat4.rotateZ(m2,-p.thigh_right.angleZ);
   mat4.rotateX(m2,p.thigh_right.angleX);
   
   mat4.translate(m2,[0,s.thigh_right.length,0]);
   mat4.rotateX(m2,-p.calf_right.angleX);
   
   var right=[0,s.calf_right.length,0];
   mat4.multiplyVec3(m2,right);
   this.computed_min_y=Math.min(left[1],right[1]);
   
   this.computeSizeRatio(left,right);
   
   
   return this.computed_min_y;
};

//This method uses the location of the avatar's ankles in order to estimate the scale between the real user's motion and the avatar's motion.
//For example a small user's motion (for example child's) when transferred to a large avatar the motion range should be scaled up. 
//On the other hand, a big user's motion (for example tall adult's) when transferred to a small avatar the motion range should be scaled down. 
HumanAvatar.prototype.computeSizeRatio=function(left,right)
{
	var factor=10;//the role of the factor is to allow size_ratio estimations to be above 1.
   
   var p=[(this.positions.spine_mid[0]-this.real_player_center[0])*this.scale[0]*factor,
		 (this.positions.spine_mid[2]-this.real_player_center[2])*this.scale[2]*factor];
   
   
   var calc=[p[0],p[1],(p[0]+left[0]),(p[1]+left[2]),(p[0]+right[0]),(p[1]+right[2])];
   
   if(this.prev_calc)
   {
	   if(typeof this.calc_sc==='undefined')this.calc_sc=1;
	   
	   var dif=[calc[0]-this.prev_calc[0],calc[1]-this.prev_calc[1],calc[2]-this.prev_calc[2],calc[3]-this.prev_calc[3],calc[4]-this.prev_calc[4],calc[5]-this.prev_calc[5]];
	   
	   var dx=dif[0]/this.scale[0];dx*=dx;
	   var dz=dif[1]/this.scale[2];dz*=dz;
	   
	   if(dx+dz >0.001*factor*factor)
	   {
		  if(dx>dz)
		  {
		   var neg=0;
		   var pos=0;
		   for(var i=0;i<6;i+=2)if(dif[i]<0)neg+=1;else pos+=1;
		   if(neg==3)
		   {
			   var dd=[dif[0]-dif[2],dif[0]-dif[4]];
			   if(dd[0]<0 || dd[1]<0)
			   {
				   var f=[Math.max(0,dd[0]/dif[0]),Math.max(0,dd[1]/dif[0])];
				   if(Math.abs(f[0]-1)<Math.abs(f[1]-1))
					   this.calc_sc=this.calc_sc*0.97+0.03*f[0]*factor;
				   else this.calc_sc=this.calc_sc*0.97+0.03*f[1]*factor;
				   //console.log(this.calc_sc);
				   this.est_size_ratio=this.calc_sc;
			   }
		   }
		   else if(neg==0)
		   {
			   var dd=[dif[0]-dif[2],dif[0]-dif[4]];
			   if(dd[0]>0 || dd[1]>0)
			   {
				   var f=[Math.max(0,dd[0]/dif[0]),Math.max(0,dd[1]/dif[0])];
				   //console.log(f[0]+ ' '+f[1]);
				   if(Math.abs(f[0]-1)<Math.abs(f[1]-1))
					   this.calc_sc=this.calc_sc*0.97+0.03*f[0]*factor;
				   else this.calc_sc=this.calc_sc*0.97+0.03*f[1]*factor;
				   //console.log(this.calc_sc);
				   this.est_size_ratio=this.calc_sc;
			   }
		   }
		  }
		  else
		  {
			var neg=0;
		   var pos=0;
		   for(var i=1;i<6;i+=2)if(dif[i]<0)neg+=1;else pos+=1;
		   if(neg==3)
		   {
			   var dd=[dif[1]-dif[3],dif[1]-dif[5]];
			   if(dd[0]<0 || dd[1]<0)
			   {
				   var f=[Math.max(0,dd[0]/dif[1]),Math.max(0,dd[1]/dif[1])];
				   if(Math.abs(f[0]-1)<Math.abs(f[1]-1))
					   this.calc_sc=this.calc_sc*0.97+0.03*f[0]*factor;
				   else this.calc_sc=this.calc_sc*0.97+0.03*f[1]*factor;
				   //console.log(this.calc_sc);
				   this.est_size_ratio=this.calc_sc;
			   }
		   }
		   else if(neg==0)
		   {
			   var dd=[dif[1]-dif[3],dif[1]-dif[5]];
			   if(dd[0]>0 || dd[1]>0)
			   {
				   var f=[Math.max(0,dd[0]/dif[1]),Math.max(0,dd[1]/dif[1])];
				   //console.log(f[0]+ ' '+f[1]);
				   if(Math.abs(f[0]-1)<Math.abs(f[1]-1))
					   this.calc_sc=this.calc_sc*0.97+0.03*f[0]*factor;
				   else this.calc_sc=this.calc_sc*0.97+0.03*f[1]*factor;
				   //console.log(this.calc_sc);
				   this.est_size_ratio=this.calc_sc;
			   }
		   }  
		  }
	   
	   }//else console.log('stopped');
   }
   
   //console.log(p[0]+' '+p[1]+', '+(p[0]+left[0])+' '+(p[1]+left[2])+', '+(p[0]+right[0])+' '+(p[1]+right[2]));
   this.prev_calc=calc;
   return this.est_size_ratio;
};

HumanAvatar.prototype.draw=function(options)
{
   var opt=options||{};
   this.animator.requestFrame();
   if(opt.hideafter && this.last_moved_at+opt.hideafter<new Date().getTime())return;
   var cam=this.canvas.getCamera();
   var p=this.posture;
   var s=this.size;
   cam.pushMatrix();
   cam.translate(this.translation);
   cam.rotate(this.rotation_angle,this.rotation_axis);
   /*cam.translate([(this.positions.spine_mid[0]-this.real_player_center[0])*this.scale[0]*this.est_size_ratio,
					this.jump*this.scale[1]*this.est_size_ratio-this.computeMinY(),
					(this.positions.spine_mid[2]-this.real_player_center[2])*this.scale[2]*this.est_size_ratio]);*/
	cam.translate([(this.positions.spine_mid[0]-this.real_player_center[0])*this.scale[0]*this.est_size_ratio,
					(this.positions.spine_mid[1]-this.real_player_center[1])*this.scale[1]*this.est_size_ratio-this.computeMinY(),
					(this.positions.spine_mid[2]-this.real_player_center[2])*this.scale[2]*this.est_size_ratio]);				
   cam.rotateY(p.thorax.angleY);
   cam.rotateZ(p.thorax.angleZ);
   cam.rotateX(p.thorax.angleX);
   //cam.rotateY(3.14);
   this.drawThorax();
   
   cam.pushMatrix();
   cam.translate([0,s.thorax.height,0]);
   cam.pushMatrix();
   cam.rotateY(p.neck.angleY);//In Kinect this should be 0.
   cam.rotateZ(-p.neck.angleZ);
   cam.rotateX(p.neck.angleX);
   this.drawNeck();
   
    cam.pushMatrix();
   cam.translate([0,s.neck.length,0]);
   this.drawHead();
   cam.popMatrix();
   cam.popMatrix();
   
   cam.pushMatrix();
   cam.translate([s.thorax.width/2,0,0]);
   cam.rotateZ(-3.14);
   cam.rotateY(p.upperarm_left.angleY);//In Kinect this is must be calculated carefully or left 0.
   cam.rotateZ(p.upperarm_left.angleZ);
   cam.rotateX(p.upperarm_left.angleX);
   this.drawLeftUpperArm();
   
   cam.pushMatrix();
   cam.translate([0,s.upperarm_left.length,0]);
   cam.rotateX(p.forearm_left.angleX);
   this.drawLeftForearm();
   cam.popMatrix();
   
   cam.popMatrix();
   
   cam.pushMatrix();
   cam.translate([-s.thorax.width/2,0,0]);
   cam.rotateZ(3.14);
   cam.rotateY(p.upperarm_right.angleY);//In Kinect this is must be calculated carefully or left 0.
   cam.rotateZ(-p.upperarm_right.angleZ);
   cam.rotateX(p.upperarm_right.angleX);
   this.drawRightUpperArm();
   
   cam.pushMatrix();
   cam.translate([0,s.upperarm_right.length,0]);
   cam.rotateX(p.forearm_right.angleX);
   this.drawRightForearm();
   cam.popMatrix();
   
   cam.popMatrix();
   
   cam.popMatrix();//torso
   
   cam.rotateZ(3.14);
   cam.rotateY(p.abdomen.angleY);
   cam.rotateZ(p.abdomen.angleZ);
   cam.rotateX(p.abdomen.angleX);
   this.drawAbdomen();
   
   cam.translate([0,s.abdomen.height,0]);
   cam.pushMatrix();
   cam.translate([-s.abdomen.width/2,0,0]);
   cam.rotateY(p.thigh_left.angleY);
   cam.rotateZ(p.thigh_left.angleZ);
   cam.rotateX(p.thigh_left.angleX);
   this.drawLeftThigh();
   
   cam.pushMatrix();
   cam.translate([0,s.thigh_left.length,0]);
   cam.rotateX(-p.calf_left.angleX);
   this.drawLeftCalf();
   
   cam.pushMatrix();
   cam.translate([0,s.calf_left.length,0]); 
   cam.rotateX(3.14/2);
   //cam.rotateZ(leftfoot.angleZ);//In Kinect this should be 0.
   cam.rotateX(-p.foot_left.angleX);
   this.drawLeftFoot();
   cam.popMatrix();
   cam.popMatrix();
   cam.popMatrix();
   
     cam.pushMatrix();
   cam.translate([s.abdomen.width/2,0,0]);
   cam.rotateY(p.thigh_right.angleY);
   cam.rotateZ(-p.thigh_right.angleZ);
   cam.rotateX(p.thigh_right.angleX);
   this.drawRightThigh();
   
   cam.pushMatrix();
   cam.translate([0,s.thigh_right.length,0]);
   cam.rotateX(-p.calf_right.angleX);
   this.drawRightCalf();
   
   cam.pushMatrix();
   cam.translate([0,s.calf_right.length,0]); 
   cam.rotateX(3.14/2);
   //cam.rotateZ(-rightfoot.angleZ);//In Kinect this should be 0.
   cam.rotateX(-p.foot_right.angleX);
   this.drawRightFoot();
   cam.popMatrix();//foot
   cam.popMatrix();//calf
   cam.popMatrix();//thigh
   cam.popMatrix();//body
};

function StickManAvatar(canvas,mat)
{
    HumanAvatar.call(this,canvas);
	
	/*var r=2;
	this.size.calf_right.length/=r;
	this.size.thigh_right.length/=r;
	this.size.calf_left.length/=r;
	this.size.thigh_left.length/=r;
	this.size.foot_right.length/=r;
	this.size.foot_left.length/=r;
	this.size.abdomen.width/=r;*/
	
	
	this.cam=canvas.getCamera();
 
	this.axes=new CoordinateSystemAxes(canvas,0.2,0.04);
	
	var om=new GLObjectMaker(canvas);
	this.thorax=this.createBodyPart(om,mat,this.posture.thorax,this.size.thorax.height,1,this.size.thorax.width);
	
this.abdomen=this.createBodyPart(om,mat,this.posture.abdomen,this.size.abdomen.height,1,this.size.abdomen.width);
	this.neck=this.createBodyPart(om,mat,this.posture.neck,this.size.neck.length,1);
	this.leftarm=this.createBodyPart(om,mat,this.posture.upperarm_left,this.size.upperarm_left.length,1);
	this.rightarm=this.createBodyPart(om,mat,this.posture.upperarm_right, this.size.upperarm_right.length,1);
	this.leftfarm=this.createBodyPart(om,mat,this.posture.forearm_left,this.size.forearm_left.length,0);
	this.rightfarm=this.createBodyPart(om,mat,this.posture.forearm_right,this.size.forearm_right.length,0);
	this.leftthigh=this.createBodyPart(om,mat,this.posture.thigh_left,this.size.thigh_left.length,1);
	this.rightthigh=this.createBodyPart(om,mat,this.posture.thigh_right,this.size.thigh_right.length,1);
	this.leftleg=this.createBodyPart(om,mat,this.posture.calf_left,this.size.calf_left.length,1);
	this.rightleg=this.createBodyPart(om,mat,this.posture.calf_right,this.size.calf_right.length,1);
	this.leftfoot=this.createBodyPart(om,mat,this.posture.foot_left,this.size.foot_left.length,0);
	this.rightfoot=this.createBodyPart(om,mat,this.posture.foot_right,this.size.foot_right.length,0);
	this.head=this.createBodyPart(om,mat,this.posture.head,0);
	var self=this;
	this.head.onDrag=function(e)//move the neck when you drag the head
	{
		self.last_moved_at=new Date().getTime();
		self.posture.neck.angleX+=-2*e.dx[0];
		self.posture.neck.angleZ+=2*e.dy[0];
		self.posture.correct();
		self.canvas.updatePickingMap(true);
	};
}

StickManAvatar.prototype.createBodyPart=function(om,mat,orient,length,type,length2)
{
   om.identity();
  om.sphere({resolution:16,width:0.17,height:0.17,depth:0.17});
  om.pushMatrix();
om.scale([0.1,length,0.1]);
if(type==0)
{
	om.translate([0,0.5,0]);
	om.box({width:1,height:1,depth:1});
	om.translate([0,0,0.5]);
	om.cylinder({resolution:16,width:1,height:1,depth:0.7});
}
else if(type==1)
{
	om.translate([0,0.5,-0.5]);
	om.cylinder({resolution:16,width:0.5,height:1,depth:0.5});
	om.translate([0,0,1]);
	om.cylinder({resolution:16,width:1,height:1,depth:1});
}
om.popMatrix();
if(length2)
{
   om.translate([0,length,0]);
   om.scale([length2,0.1,0.1]);
   om.box({width:1,height:1,depth:1});
   om.translate([0,0,0.5]);
   om.rotateZ(3.14/2);
   om.cylinder({resolution:16,width:1,height:1,depth:0.7});
}
om.clear({uv:true});
var o=om.flush();
o.setMaterial(mat);
o.length=length;
o.angleY=0;
o.angleZ=0;
o.angleX=0;
var self=this;
o.onDrag=function(e)
{
	self.last_moved_at=new Date().getTime();
    orient.angleX+=-2*e.dx[0];
    orient.angleZ+=2*e.dy[0];
    self.posture.correct();
	om.canvas.updatePickingMap(true);
};
if(length2)o.length2=length2;
  return o;
};

StickManAvatar.prototype.drawHead=function(){
	this.cam.scale([1.5,1.5,1.5]);
	this.head.updateShader();
  this.head.draw();
  this.axes.draw();
};
StickManAvatar.prototype.drawNeck=function(){
  this.neck.updateShader();
  this.neck.draw();
  this.axes.draw();
};
StickManAvatar.prototype.drawThorax=function(){
   var cam=this.cam;
   cam.pushMatrix();
   //cam.scale([this.size.thorax.width/0.5,this.size.thorax.height/0.4,1]);
   this.thorax.updateShader();
   this.thorax.draw();
   this.axes.draw();
   cam.popMatrix();
};
StickManAvatar.prototype.drawAbdomen=function(){
var cam=this.cam;
   cam.pushMatrix();
   //cam.scale([this.size.abdomen.width/0.3,this.size.abdomen.height/0.2,1]);
this.abdomen.updateShader();
this.abdomen.draw();
this.axes.draw();
cam.popMatrix();
};
StickManAvatar.prototype.drawLeftUpperArm=function(){
   var cam=this.cam;
   cam.pushMatrix();
   //cam.scale([1,this.size.upperarm_left.length/0.3,1]);
	this.leftarm.updateShader();
	this.leftarm.draw();
	this.axes.draw();
	cam.popMatrix();
};
StickManAvatar.prototype.drawLeftForearm=function(){
var cam=this.cam;
   cam.pushMatrix();
  // cam.scale([1,this.size.forearm_left.length/0.4,1]);
	this.leftfarm.updateShader();
	this.leftfarm.draw();
	this.axes.draw();
	cam.popMatrix();
};
StickManAvatar.prototype.drawRightUpperArm=function(){
var cam=this.cam;
   cam.pushMatrix();
   //cam.scale([1,this.size.upperarm_right.length/0.3,1]);
	this.rightarm.updateShader();
	this.rightarm.draw();
	this.axes.draw();
	cam.popMatrix();
};
StickManAvatar.prototype.drawRightForearm=function(){
var cam=this.cam;
   cam.pushMatrix();
   //cam.scale([1,this.size.forearm_right.length/0.4,1]);
	this.rightfarm.updateShader();
	this.rightfarm.draw();
	this.axes.draw();
	cam.popMatrix();
};
StickManAvatar.prototype.drawLeftThigh=function(){
var cam=this.cam;
   cam.pushMatrix();
   cam.scale([this.size.thigh_left.length/0.3,1,this.size.thigh_left.length/0.3]);
	this.leftthigh.updateShader();
	this.leftthigh.draw();
	this.axes.draw();
	cam.popMatrix();
};
StickManAvatar.prototype.drawLeftCalf=function(){
var cam=this.cam;
   cam.pushMatrix();
   cam.scale([this.size.calf_left.length/0.4,1,this.size.calf_left.length/0.4]);
	this.leftleg.updateShader();
	this.leftleg.draw();
	this.axes.draw();
	cam.popMatrix();
};
StickManAvatar.prototype.drawLeftFoot=function(){
var cam=this.cam;
   cam.pushMatrix();
   cam.scale([this.size.foot_left.length/0.2,1,this.size.foot_left.length/0.2]);
	this.leftfoot.updateShader();
	this.leftfoot.draw();
	this.axes.draw();
	cam.popMatrix();
};
StickManAvatar.prototype.drawRightThigh=function(){
var cam=this.cam;
   cam.pushMatrix();
   cam.scale([this.size.thigh_right.length/0.3,1,this.size.thigh_right.length/0.3]);
	this.rightthigh.updateShader();
	this.rightthigh.draw();
	this.axes.draw();
	cam.popMatrix();
};
StickManAvatar.prototype.drawRightCalf=function(){
var cam=this.cam;
   cam.pushMatrix();
   cam.scale([this.size.calf_right.length/0.4,1,this.size.calf_right.length/0.4]);
	this.rightleg.updateShader();
	this.rightleg.draw();
	this.axes.draw();
	cam.popMatrix();
};
StickManAvatar.prototype.drawRightFoot=function(){
var cam=this.cam;
   cam.pushMatrix();
   cam.scale([this.size.foot_right.length/0.2,1,this.size.foot_right.length/0.2]);
	this.rightfoot.updateShader();
	this.rightfoot.draw();
	this.axes.draw();
	cam.popMatrix();
};

vn.extend(HumanAvatar,StickManAvatar);