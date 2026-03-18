function DEAdemo(app)
{
	this.vn=app.getMainApp();
	if(typeof this.vn.demo ==='undefined')
	{
		this.vn.demo=this.load(this.vn.canvas);
		this.vn.drawables.push(this.vn.demo);
	}		
	this.vn.demo.start();
};

DEAdemo.prototype.load=function(canvas)
{
	var demo=new WebGLAnimation(canvas);
	
	demo.onSetup=function()
	{
		var self=demo;
		
		self.pauseDuringUserInteraction();
		
		self.shader=new WebGLShader(self.canvas, self.canvas.VN_UV);
		
		self.obj=new Array();
		//Main hand
		var hand=new WebGLObject(self.canvas);
		hand.disablePicking(true);
		hand.setShader(self.shader);
		hand.setXYZ([0.7617,1,-3,0.1757,0.2734,-3,0,0,-3,0.7617,0,-3,0.2695,0.3984,-3,0.2695,0.6679,-3,0,0.6679,-3,0.3242,0.5546,-3,0.4492,0.5878,-3,0.5234,1,-3,0.3984,1,-3]);
		hand.setUV([0.7617,1,0.1757,0.2734,0,0,0.7617,0,0.2695,0.3984,0.2695,0.6679,0,0.6679,0.3242,0.5546,0.4492,0.5878,0.5234,1,0.3984,1]);
		hand.setTRI([1,2,3,4,1,3,3,7,4,3,8,7,9,8,3,9,3,0]);
		self.obj.push(hand);
		//Thumb finger
		var thumb=new WebGLObject(self.canvas);
		thumb.disablePicking(true);
		thumb.setShader(self.shader);
		//thumb.sameXYZ(hand);
		//thumb.sameUV(hand);
		thumb.setXYZ([0.7617,1,-3,0.1757,0.2734,-3,0,0,-3,0.7617,0,-3,0.2695,0.3984,-3,0.2695,0.6679,-3,0,0.6679,-3,0.3242,0.5546,-3,0.4492,0.5878,-3,0.5234,1,-3,0.3984,1,-3]);
		thumb.setUV([0.7617,1,0.1757,0.2734,0,0,0.7617,0,0.2695,0.3984,0.2695,0.6679,0,0.6679,0.3242,0.5546,0.4492,0.5878,0.5234,1,0.3984,1]);
		
		thumb.setTRI([1,4,6,4,5,6]);
		self.obj.push(thumb);
		//Index finger
		var index=new WebGLObject(self.canvas);
		index.disablePicking(true);
		index.setShader(self.shader);
		index.sameXYZ(hand);
		index.sameUV(hand);
		index.setTRI([9,10,8,10,7,8]);
		self.obj.push(index);
		
		var circle=new WebGLObject(self.canvas);
		circle.disablePicking(true);
		circle.setShader(self.shader);
		circle.setXYZ([0.1523,0.9726,-3,0.0273,0.9726,-3,0.0273,0.8476,-3,0.1523,0.8476,-3]);
		circle.setUV([0.1523,0.9726,0.0273,0.9726,0.0273,0.8476,0.1523,0.8476]);
		circle.setTRI([0,1,2,0,2,3]);
		self.obj.push(circle);
		
		self.img=new WebGLTexture(self.canvas);
		self.img.load('http://www.digitalepigraphy.org/js/DEMOhand.png');
		self.thumb_angle=0;
		self.index_angle=0;
		self.wrist_angle=0;
		self.wrist_translation=0;
		
		self.thumb_goal=0;
		self.index_goal=0;
		//this.wrist_goal=0;
		//this.translation_goal=0;
				
		var k1=new WebGLKeyFrame('interpolate',[-0.2],[0.2],0.5,2);
		k1.onStart=function(){self.thumbUp();self.indexDown();};
		k1.onValueChange=function(){self.wrist_translation=k1.getValue(0);if(k1.getPhase()==0)self.camera.doRotate(0.001*self.camera.inverseFPS/0.017,0);else self.camera.doRotate(-0.001*self.camera.inverseFPS/0.017,0);};
		self.addKeyFrame(k1);
		
		var k2=new WebGLKeyFrame('interpolate',[0],[0],1,1);
		k2.onStart=function(){self.thumbUp();self.indexUp();k2.setValue(0,self.wrist_translation);};
		k2.onValueChange=function(){self.wrist_translation=k2.getValue(0);self.camera.doRotate(0.001*self.camera.inverseFPS/0.017,0);};
		self.addKeyFrame(k2);
		
		var k3=new WebGLKeyFrame('interpolate',[-0.5],[0.2],0.5,2);
		k3.onStart=function(){self.thumbDown();self.indexDown();};
		k3.onValueChange=function(){self.wrist_angle=k3.getValue(0);if(k3.getPhase()==0){self.camera.rotateZ(0.003*self.camera.inverseFPS/0.017);self.camera.doTranslate(-0.0015*self.camera.inverseFPS/0.017,-0.001*self.camera.inverseFPS/0.017);}else {self.camera.rotateZ(-0.003*self.camera.inverseFPS/0.017);self.camera.doTranslate(0.0015*self.camera.inverseFPS/0.017,0.001*self.camera.inverseFPS/0.017);}};
		self.addKeyFrame(k3);
			
		var k4=new WebGLKeyFrame('interpolate',[0],[0],1,1);
		k4.onStart=function(){self.thumbUp();self.indexUp();k4.setValue(0,self.wrist_angle);};
		k4.onValueChange=function(){self.wrist_angle=k4.getValue(0);self.camera.rotateZ(0.004*self.camera.inverseFPS/0.017);self.camera.doTranslate(-0.0030*self.camera.inverseFPS/0.017,-0.0014*self.camera.inverseFPS/0.017);};
		self.addKeyFrame(k4);
		
		var k5=new WebGLKeyFrame('interpolate',[-0.2],[0.2],0.5,2);
		k5.onStart=function(){self.thumbDown();self.indexDown();};
		k5.onValueChange=function(){self.wrist_translation=k5.getValue(0);if(k5.getPhase()==0)self.camera.doTranslate(0.0015*self.camera.inverseFPS/0.017,0);else self.camera.doTranslate(-0.0015*self.camera.inverseFPS/0.017,0);};
		self.addKeyFrame(k5);
		
		var k6=new WebGLKeyFrame('interpolate',[0],[0],1,1);
		k6.onStart=function(){self.thumbUp();self.indexUp();k6.setValue(0,self.wrist_translation);};
		k6.onValueChange=function(){self.wrist_translation=k6.getValue(0);self.camera.doTranslate(0.0014*self.camera.inverseFPS/0.017,0);};
		self.addKeyFrame(k6);
		
		var k7=new WebGLKeyFrame('interpolate',[-0.5],[0.2],0.5,2);
		k7.onStart=function(){self.thumbDown();self.indexDown();};
		k7.onValueChange=function(){self.wrist_angle=k7.getValue(0);if(k7.getPhase()==0){self.camera.rotateZ(0.003*self.camera.inverseFPS/0.017);self.camera.doTranslate(-0.0015*self.camera.inverseFPS/0.017,-0.001*self.camera.inverseFPS/0.017);}else {self.camera.rotateZ(-0.003*self.camera.inverseFPS/0.017);self.camera.doTranslate(0.0015*self.camera.inverseFPS/0.017,0.001*self.camera.inverseFPS/0.017);}};
		self.addKeyFrame(k7);
			
		var k8=new WebGLKeyFrame('interpolate',[0],[0],1,1);
		k8.onStart=function(){self.thumbUp();self.indexUp();k8.setValue(0,self.wrist_angle);};
		k8.onValueChange=function(){self.wrist_angle=k8.getValue(0);self.camera.rotateZ(0.0037*self.camera.inverseFPS/0.017);self.camera.doTranslate(-0.0011*self.camera.inverseFPS/0.017,-0.0013*self.camera.inverseFPS/0.017);};
		self.addKeyFrame(k8);		
	};
	
	demo.onStart=function()
	{
		var self=demo;
		self.wrist_angle=0;
		self.wrist_translation=0;
		self.thumbUp();
		self.indexUp();
	};
	
	demo.onDraw=function()
	{
		var self=demo;
			
		var gl=self.gl;
		self.shader.updateProjection();

		self.img.use();
		gl.disable(gl.DEPTH_TEST);
		
		var mv = mat4.create();
		var mv2 = mat4.create();
		mat4.identity(mv);
		mat4.translate(mv,[-0.5,-0.5-0.2,1.5]);
		mat4.translate(mv,[self.wrist_translation,0,0]);
		mat4.translate(mv,[0.25,0,0]);
		mat4.rotate(mv,self.wrist_angle,[0,0,1]);
		mat4.translate(mv,[-0.25,0,0]);
		self.shader.setModelView(mv);
		self.obj[0].draw();
		
		if(self.thumb_angle==0.5)
		{
			mat4.set(mv,mv2);
			mat4.translate(mv2,[0.025,-0.32,-0.2]);
			self.shader.setModelView(mv2);
			self.shader.setColorMask([1,1,1,0.4]);
			self.obj[3].draw();
		}
		
		if(self.index_angle==0.5)
		{
			mat4.set(mv,mv2);
			mat4.translate(mv2,[0.39,-0.01,-0.21]);
			self.shader.setModelView(mv2);		
			self.shader.setColorMask([1,1,1,0.4]);
			self.obj[3].draw();
		}
		
		if(self.thumb_goal!=self.thumb_angle)
		{
			if(self.thumb_goal>self.thumb_angle)
			{
				self.thumb_angle+=self.camera.inverseFPS;
				if(self.thumb_angle>self.thumb_goal)self.thumb_angle=self.thumb_goal;
			}
			else
			{
				self.thumb_angle-=self.camera.inverseFPS;
				if(self.thumb_angle<self.thumb_goal)self.thumb_angle=self.thumb_goal;
			}
		}
		
		mat4.set(mv,mv2);
		mat4.translate(mv2,[0.22255,0.3359,-3]);
		mat4.rotate(mv2,-self.thumb_angle,[0.6,0.8,0]);
		mat4.translate(mv2,[-0.22255,-0.3359,3]);
		self.shader.setModelView(mv2);
		if(self.thumb_angle>0) self.shader.setColorMask([1,0.5,0.5,1]);
		else self.shader.setColorMask([1,1,1,1]);
		self.obj[1].draw();
		
		
		if(self.index_goal!=self.index_angle)
		{
			if(self.index_goal>self.index_angle)
			{
				self.index_angle+=self.camera.inverseFPS;
				if(self.index_angle>self.index_goal)self.index_angle=self.index_goal;
			}
			else
			{
				self.index_angle-=self.camera.inverseFPS;
				if(self.index_angle<self.index_goal)self.index_angle=self.index_goal;
			}
		}
		
		mat4.set(mv,mv2);
		mat4.translate(mv2,[0.3867,0.5712,-3]);
		mat4.rotate(mv2,-self.index_angle,[0.9666, 0.2567,0]);
		mat4.translate(mv2,[-0.3867,-0.5712,3]);
		self.shader.setModelView(mv2);		
		if(self.index_angle>0) self.shader.setColorMask([1,0.5,0.5,1]);
		else self.shader.setColorMask([1,1,1,1]);
		self.obj[2].draw();
		
		gl.enable(gl.DEPTH_TEST);
		self.shader.setColorMask([1,1,1,1]);
	
	};
	
	demo.thumbDown=function(){demo.thumb_goal=0.5;};
	demo.thumbUp=function(){demo.thumb_goal=0;};
	demo.indexDown=function(){demo.index_goal=0.5;};
	demo.indexUp=function(){demo.index_goal=0;};
	demo.load();
	
	return demo;
};