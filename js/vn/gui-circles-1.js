/** 
 * This class is part of an animated interactive menu. This class creates a button that can be added as an option to another CircleButton or the root button of a CircleMenu.
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * var menu=new CircleMenu(area); <br>
 * menu.show();<br>
 * var menu_root_button=menu.getRoot();<br>
 * menu_root_button.setLabel('My Menu');<br>
 * menu_root_button.append(new CircleButton()).setLabel('My Option');<br></font>
 */
function CircleButton()
{
	this.parent=null;
	this._expand_p=new VNPromise(this);
	this._collapse_p=new VNPromise(this);
	this._clicked_p=new VNPromise(this);
	this.is_selected=false;
	this.is_ancestor_of=null;
	this.children=[];
	this.children_r=0;
	this.children_angle=0;
	this.children_angle2=0;
	this.is_dragging=false;
	this.label='';
	var self=this;
	
	this.div_box=document.createElement('div');
	vn.set(this.div_box.style,{position:'absolute',left:'-50%',top:'-50%',width:'100%',height:'100%',pointerEvents:'none'});

	function mo(event)
	{
		//event.target.style.border='2px solid rgb(0,0,255)';
		//event.target.style.background='radial-gradient(circle,rgb(255,255,255) 0%,rgba(0,0,255,0.5) 60%,rgba(0,0,255,0.3) 70%)';
	
	}
	
	this.child_div=document.createElement('div');
	vn.set(this.child_div.style,{position:'absolute',left:'0px',top:'0px',width:'100%',height:'100%'});
	this.div_box.appendChild(this.child_div);
	
	this.ancestor_div=document.createElement('div');
	vn.set(this.ancestor_div.style,{position:'absolute',left:'50%',top:'70%',width:'70%',height:'70%',opacity:0.8});
	this.div_box.appendChild(this.ancestor_div);
	
	this.expand_anim=new Animation();
	this.expand_anim.addKeyFrame(0,{angle:-3.14*50/180,r:0});
	this.expand_anim.addKeyFrame(0.5,{angle:-3.14*170/180,r:1});
	this.collapse_anim=new Animation();
	this.collapse_anim.addKeyFrame(0.5,{angle:-3.14*50/180,r:0});
	this.collapse_anim.addKeyFrame(0,{angle:-3.14*170/180,r:1});
	this.current_anim=this.collapse_anim;
	
	function anim(frame)
	{
		self.children_angle2=frame.data.angle;
		self.children_r=frame.data.r;
		self.renderChildren();
	}
	this.collapse_anim.whenNewFrame().then(anim);
	this.expand_anim.whenNewFrame().then(anim);
	
	this.div=document.createElement('div');
	vn.set(this.div.style,{position:'absolute',border:'2px solid rgba(200,200,255,0.5)',background:'radial-gradient(circle,rgba(0,0,0,0) 0%,rgba(0,0,255,0.3) 70%)',width:'50%',height:'50%',left:'25%',top:'25%',borderRadius:'50%',boxSizing:'border-box',pointerEvents:'auto'});
	this.div_box.appendChild(this.div);
		
	this.icon=document.createElement('div');
	vn.set(this.icon.style,{position:'absolute',top:'15%',left:'15%',bottom:'15%',right:'15%',backgroundImage:'url("'+vn.hosturl+'js/img/VNlogo512.png")',backgroundSize:'contain',backgroundRepeat:'no-repeat',backgroundPosition:'center',textAlign:'center',color:'white',fontFamily:'Arial',fontWeight:'900'});
	this.div.appendChild(this.icon);
	var self=this;
	this.div.addEventListener('mouseover',function(){
		self.lightsOn();
		},false);
	this.div.addEventListener('mouseout',function(){self.lightsOff();},false);
	this.div.addEventListener('touchstart',function(event){
		event.preventDefault();
		event.stopPropagation();
		self.touch_operated=true;
		var x=new Array();var y=new Array();for(var i=0;i<event.targetTouches.length;i++){x[i]=event.targetTouches[i].clientX;y[i]=event.targetTouches[i].clientY;} 
		self.handlePointerDown(x,y);
	},false);
	this.div.addEventListener('mousedown',function(event){
		event.preventDefault();
		event.stopPropagation();
		if(self.touch_operated)return;
		var x=new Array();var y=new Array();x[0]=event.clientX; y[0]=event.clientY;
		self.handlePointerDown(x,y);
	},false);
	
	this.mousemove_event=function(event){event.stopPropagation();event.preventDefault();var x=new Array();var y=new Array();x[0]=event.clientX; y[0]=event.clientY; self.handlePointerMove(x,y);};
	this.touchmove_event=function(event){event.stopPropagation();event.preventDefault();var x=new Array();var y=new Array();for(var i=0;i<event.targetTouches.length;i++){x[i]=event.targetTouches[i].clientX;y[i]=event.targetTouches[i].clientY;}self.handlePointerMove(x,y);};
	this.pointerup_event=function(event){event.stopPropagation();self.handlePointerUp();};
	
	
		
	this.riple_div=document.createElement('div');
	vn.set(this.riple_div.style,{position:'absolute',left:'50%',top:'50%',width:'100%',height:'100%'});
	this.div_box.appendChild(this.riple_div);
	this.my_ripl=new Riple(this.riple_div);
	this.my_ripl.setColor(0,0,255);
	this.my_ripl.setWidth(15);
	this.my_ripl.setSpeed(0.5);
}

/**
 * This method updates the text of the label of this button.
 * @param text A string with the label to be set to this button.
 * @return CircleButton This object is returned to allow for chained call of methods such as my_button.setLabel(...).setIcon(...) etc.
 */
CircleButton.prototype.setLabel=function(text){this.label=text;return this;};

/**
 * This method updates the icon of this button.
 * @param url A string with the URL of an image file.
 * @return CircleButton This object is returned to allow for chained call of methods such as my_button.setLabel(...).setIcon(...) etc.
 */
CircleButton.prototype.setIcon=function(url){this.icon.style.backgroundImage='url("'+url+'")';return this;};

CircleButton.prototype.setTextIcon=function(text){this.icon.innerHTML=text;this.icon.style.backgroundImage='none';return this;};

CircleButton.prototype.setAncestor=function(b)
{
	this.ancestor_div.appendChild(b.getDiv());
	b.is_ancestor_of=this;
};
CircleButton.prototype.lightsOn=function()
{
	this.getRoot().menu.printCaption(this.label,{seconds:10});
	this.div.style.border='2px solid rgb(0,0,255)';
	this.div.style.background='radial-gradient(circle,rgb(255,255,255) 0%,rgba(0,0,255,0.5) 60%,rgba(0,0,255,0.3) 70%)';
};
CircleButton.prototype.lightsOff=function()
{
	this.div.style.border='2px solid rgba(200,200,255,0.5)';
	this.div.style.background='radial-gradient(circle,rgba(0,0,0,0) 0%,rgba(0,0,255,0.3) 70%)';
};

/**
 * This method expands the contents (sub-buttons) of this object if any.
 */
CircleButton.prototype.expand=function()
{
	if(this.current_anim!=this.expand_anim)
	{
		this._expand_p.callThen();
		this._expand_p.reset();
		this.lightsOn();
		this.current_anim=this.expand_anim;
		this.expand_anim.playAfter(this.collapse_anim);
		this.my_ripl.setTime(0);
		this.my_ripl.play();
	}
};

/**
 * This method collapses the contents (sub-buttons) of this object if any.
 */
CircleButton.prototype.collapse=function()
{
	if(this.current_anim==this.expand_anim)
	{
		this._collapse_p.callThen();
		this._collapse_p.reset();
		this.lightsOff();
		this.current_anim=this.collapse_anim;
		this.collapse_anim.playAfter(this.expand_anim);
	}
};

/**
 * This method returns a promise that will be fulfilled when the contents of this button are expanded.
 * @return VNPromise The promise object that is associated with this event. 
 */
CircleButton.prototype.whenExpanded=function(){return this._expand_p;};
/**
 * This method returns a promise that will be fulfilled when the contents of this button are collapsed.
 * @return VNPromise The promise object that is associated with this event. 
 */
CircleButton.prototype.whenCollapsed=function(){return this._collapse_p;};
/**
 * This method returns a promise that will be fulfilled when this button is clicked.
 * @return VNPromise The promise object that is associated with this event. 
 */
CircleButton.prototype.whenClicked=function(){return this._clicked_p;};

CircleButton.prototype._anmt=function()
{
	var root_div=this.is_ancestor_of.getDiv().parentNode;
	root_div.removeChild(this.is_ancestor_of.getDiv());
	root_div.appendChild(this.getDiv());
	this.children[this.is_ancestor_of.order].div.appendChild(this.is_ancestor_of.getDiv());
	this.is_ancestor_of.setIsSelected(false);
	this.setIsSelected(true);
	this.is_ancestor_of.collapse();
	this.expand();
	this.is_ancestor_of=null;
};

CircleButton.prototype.handlePointerDown=function(x,y)
{
	//cns.println('down');
	if(this.is_selected)
	{
		if(this.current_anim==this.expand_anim)
		{
			this.collapse();
		}
		else
		{
			this.expand();
			if(this.parent==null)
			{
				//document.documentElement.webkitRequestFullscreen();
			}
		}
	}
	else if(this.is_ancestor_of)
	{
		if(this.is_ancestor_of.is_ancestor_of==null)
		{
			this._anmt();
		}
		else
		{
			while(this.is_ancestor_of.is_ancestor_of!=null)
			{
				var el=this;
				while(el.is_ancestor_of.is_ancestor_of!=null)
					el=el.is_ancestor_of;
				el._anmt();
			}
			this._anmt();
		}
	}
	else
	{
		if(this.parent)
		{
			this.lightsOn();
		if(this.touch_operated)
		{
			document.addEventListener('touchmove',this.touchmove_event,false);
			document.addEventListener('touchend',this.pointerup_event,false);
		}
		else
		{
			document.addEventListener('mousemove',this.mousemove_event,false);
			document.addEventListener('mouseup',this.pointerup_event,false);
		}
		this.offset_x=x[0];
		this.offset_y=y[0];
		this.sum_dx=0;
		}
	}
};

CircleButton.prototype.handlePointerUp=function()
{
	//cns.println('up');
	this.lightsOff();
	if(this.touch_operated)
	{
		document.removeEventListener('touchmove',this.touchmove_event,false);
		document.removeEventListener('touchend',this.pointerup_event,false);
	}
	else
	{
		document.removeEventListener('mousemove',this.mousemove_event,false);
		document.removeEventListener('mouseup',this.pointerup_event,false);
	}
	if(typeof this.dx==='undefined') //tap
	{
		this.my_ripl.setTime(0);
		this.my_ripl.play();
		
		if(this.children.length>0)
		{
		var root_div=this.parent.getDiv().parentNode;
		root_div.removeChild(this.parent.getDiv());
		root_div.appendChild(this.getDiv());
		this.setAncestor(this.parent);
		this.parent.setIsSelected(false);
		this.setIsSelected(true);
		this.parent.collapse();
		this.expand();
		}
		else
		{
			this._clicked_p.callThen();
			this._clicked_p.reset();
			/*for(var i=0;i<10;i++)
			{
				var w=vn.getWindowManager().createWindow();
				//w.hideDecorations();
				w.setFullScreen();
			}*/
			//this.getRoot().menu.hide();
		}
		
	}
	else
	{
		if(this.sum_dx<10)//tap
		{
			this.my_ripl.setTime(0);
			this.my_ripl.play();
			
			if(this.children.length>0)
			{
			var root_div=this.parent.getDiv().parentNode;
			root_div.removeChild(this.parent.getDiv());
			root_div.appendChild(this.getDiv());
			this.setAncestor(this.parent);
			this.parent.setIsSelected(false);
			this.setIsSelected(true);
			this.parent.collapse();
			this.expand();
			}
			else
			{
				this._clicked_p.callThen();
				this._clicked_p.reset();
			}
		}
		else if(Math.abs(this.delta_angle)>0.02)//drag with speed
		{
			var a=new Animation();
			a.addKeyFrame(0,{w:0});
			a.addKeyFrame(5,{w:5});
			var self=this;
			a.whenNewFrame().then(function(f){
				self.delta_angle*=0.9;
				if(Math.abs(self.delta_angle)<0.02)
				{
					self.dx=0;
					a.pause();
				}
				self.parent.children_angle+=self.delta_angle;
				self.parent.renderChildren();
			});
			a.play();
		}
	}
};
CircleButton.prototype.handlePointerMove=function(x,y)
{
	//cns.println('move');
	this.dx=3.14*(x[0]-this.offset_x)/this.parent.div_box.clientWidth;
	this.dy=3.14*(y[0]-this.offset_y)/this.parent.div_box.clientWidth;
	this.sum_dx+=Math.abs(x[0]-this.offset_x)+Math.abs(y[0]-this.offset_y);
	this.offset_x=x[0];	
	this.offset_y=y[0];	
	this.delta_angle=-Math.sin(this.angle)*this.dx+Math.cos(this.angle)*this.dy;
	this.parent.children_angle+=this.delta_angle;
	this.parent.renderChildren();
};

/**
 * This method returns an HTMLElement object that contains this GUI component. You can use this method to append this element to any HTMLElement (such as div) in the layout of your applicartion.
 * @return HTMLElement The HTMLElement object that contains this GUI component.
 */
CircleButton.prototype.getDiv=function()
{
	return this.div_box;
};

CircleButton.prototype.renderChildren=function()
{ 
	var angle=this.children_angle;
	if(angle>0)angle=0;
	else if(angle<-0.628*Math.max(0,this.children.length-5))angle=-0.628*Math.max(0,this.children.length-5);
	this.children_angle=angle;
	var angle2=this.children_angle2;
	var a=0;
	var r=this.children_r;
	if(r==0)
		this.child_div.style.display='none';
	else this.child_div.style.display='block';
	for(var i=0;i<this.children.length;i++)
	{
		a=angle+angle2+i*0.628;
		this.children[i].div.style.left=(Math.cos(a)*37.5*r+50)+'%';
		this.children[i].div.style.top=(Math.sin(a)*37.5*r+50)+'%';
		this.children[i].b.angle=a;
		if(a>3.14*60/180)
		{
			var w=a*180/3.14-60;
			if(w>20)
				this.children[i].div.style.display='none';
			else
			{
				this.children[i].div.style.display='block';
				this.children[i].div.style.opacity=(1-w/20);
			}
		}
		else if(a<-3.14*240/180)
		{
			var w=-a*180/3.14-240;
			if(w>20)
				this.children[i].div.style.display='none';
			else
			{
				this.children[i].div.style.display='block';
				this.children[i].div.style.opacity=(1-w/20);
			}
		} 
		else
		{
			this.children[i].div.style.display='block';
			this.children[i].div.style.opacity=1;
		}
	}
};

/** 
 * This method appends an other CircleButton as a child of this button. 
 * @param b The CircleButton object to be appended to this area.
 * @return CircleButton The child input object is returned in order to allow for compact code such as: var button2=button1.append(new CircleButton());
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * var menu=new CircleMenu(area); <br>
 * menu.show();<br>
 * var menu_root_button=menu.getRoot();<br>
 * menu_root_button.setLabel('My Menu');<br>
 * menu_root_button.append(new CircleButton()).setLabel('My Option');<br></font>
 */
CircleButton.prototype.append=function(b)
{
	var div=document.createElement('div');
	vn.set(div.style,{top:'50%',left:'50%',width:'40%',height:'40%',position:'absolute',display:'none'});
	this.child_div.appendChild(div);
	this.children.push({div:div,b:b});
	b.parent=this;
	b.order=this.children.length-1;
	div.appendChild(b.getDiv());
	return b;
};

CircleButton.prototype.clear=function()
{
	for(;this.children.length>0;)
	{
		var c=this.children.pop();
		this.child_div.removeChild(c.div);
	}
};

CircleButton.prototype.setIsSelected=function(flag)
{
	if(flag==this.is_selected)return;
	this.is_selected=flag;
};

/** 
 * This method returns the CirclButton object which is in the root of the button-tree structure.
 * @return CircleButton The root CircleButton object.
 */
CircleButton.prototype.getRoot=function()
{
	if(this.parent)return this.parent.getRoot();
	else return this;
};

function Riple(container)
{
	Animation.call(this);
	this.div_container=container;
	this.div=document.createElement('div');
	vn.set(this.div.style,{position:'absolute',borderRadius:'50%',boxSizing:'border-box',pointerEvents:'none'});
	container.appendChild(this.div);
   this.diameter=0;
	this.left=0;
	this.top=0;
	this.setColor(50,50,80);
	this.setWidth(2);
	this.setSpeed(0.025);
	this.addKeyFrame(0,{w:50});
	this.addKeyFrame(1,{w:400});
	var self=this;
	this.whenNewFrame().then(function(f){self.animate(f);});
}


Riple.prototype.setWidth=function(w)
{
	this.border_size=w;
};

Riple.prototype.setColor=function(r,g,b)
{
	this.border_color=r+','+g+','+b;
};


Riple.prototype.animate=function(f)
{  
	vn.set(this.div.style,{
		left:-(f.data.w/2)+'%',
		top:-(f.data.w/2)+'%',
		border:this.border_size+'px solid rgba('+this.border_color+','+0.5*(1-f.time)+')',
		width:f.data.w+'%',
		height:f.data.w+'%',
		background:'radial-gradient(circle,rgba(0,0,0,0) 59%,rgba(0,0,255,'+0.3*(1-f.time)+') 70%)'});
};

vn.extend(Animation,Riple);//vn.animation must be imported before this file

/** 
 * This class creates a CircleMenu object, which will render an animated circular menu of options within a given HTMLElement area (typically a div element).
 * @param HTMLElement A given HTMLElement object, such as a div, in which this menu will be rendered.
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * var menu=new CircleMenu(area); <br>
 * menu.show();<br>
 * var menu_root_button=menu.getRoot();<br>
 * menu_root_button.setLabel('My Menu');<br>
 * menu_root_button.append(new CircleButton()).setLabel('My Option');<br></font>
 */
function CircleMenu(div)
{
  this.circles_div=document.createElement('div');
  vn.set(this.circles_div.style,{position:'absolute',left:'0px',top:'0px',width:'100%',height:'100%',background:'linear-gradient(to bottom right,rgba(0,0,70,0.8),rgba(0,0,0,0.9))',display:'none'});
  div.appendChild(this.circles_div);
  
  this. _out_p=new VNPromise(this);
  
  
  var click_out=function(event){
	  event.preventDefault();
	  event.stopPropagation();
	  if(event.target==self.circles_div)
	  {
		  /*if(self.current_anim==self.collapse_anim)
			  self.show();
		  else self.hide();*/
		  self._out_p.callThen();
	  }
  };
  
  this.circles_div.addEventListener('mousedown',click_out,false);
  this.circles_div.addEventListener('touchstart',click_out,false);
	
  this.expand_anim=new Animation();
  this.expand_anim.addKeyFrame(0,{opacity:0});
  this.expand_anim.addKeyFrame(0.5,{opacity:1});
  this.collapse_anim=new Animation();
  this.collapse_anim.addKeyFrame(0,{opacity:1});
  this.collapse_anim.addKeyFrame(0.5,{opacity:0});
  this.current_anim=this.collapse_anim;
  
  var self=this;
  function anim(frame)
  {
	if(frame.data.opacity==0)
		self.circles_div.style.display='none';
	else self.circles_div.style.display='block';
	self.circles_div.style.opacity=frame.data.opacity;
  }
  this.collapse_anim.whenNewFrame().then(anim);
  this.expand_anim.whenNewFrame().then(anim);
  
  this.center_box=document.createElement('div');
  var size=0.7*Math.min(div.clientWidth,div.clientHeight);
  vn.set(this.center_box.style,{position:'absolute',left:'50%',top:'50%',width:size+'px',height:size+'px',pointerEvents:'none'});
  this.circles_div.appendChild(this.center_box);
  
  this.caption_box=document.createElement('div');
  vn.set(this.caption_box.style,{position:'absolute',top:'-64%',left:'-71.5%',width:'143%',height:'20%',textAlign:'center',lineHeight:size*7/70+'px',fontSize:size*7/70+'px',    fontFamily: '"Segoe UI Light","Segoe UI","Segoe WP Light","Segoe WP","Segoe UI Latin Light",HelveticaNeue,Helvetica,Tahoma,ArialUnicodeMS,sans-serif',fontWeight:200,color:'rgb(255,255,255)',textShadow:'0px 0px '+(size*7/70)+'px rgb(0,0,255)'});
  this.center_box.appendChild(this.caption_box);
  this.last_caption='';
  
  
  var ripl=[];
	for(var i=0;i<4;i++)
	{
	  ripl[i]=new Riple(this.center_box);
	  ripl[i].setLoop(true);
	  ripl[i].setTime(0.75);
	}
  ripl[0].setTime(0);
  ripl[0].play();
  ripl[3].play();
  ripl[3].whenAnimationEnds().then(function(){if(first_time && ripl[1].isStopped())ripl[1].play();});
  ripl[1].whenAnimationEnds().then(function(){if(first_time && ripl[2].isStopped())ripl[2].play();});
  
  window.addEventListener('resize',function(){
	var s=0.7*Math.min(div.clientWidth,div.clientHeight);
	vn.set(self.center_box.style,{width:s+'px',height:s+'px'});
	vn.set(self.caption_box.style,{lineHeight:s*7/70+'px',fontSize:s*7/70+'px',textShadow:'0px 0px '+(s*7/70)+'px rgb(0,0,255)'});
  
  },false);
	
  var first_time=true;
  this._root=new CircleButton();
  this._root.menu=this;
  this._root.setIsSelected(true);
  this._root.whenExpanded().then(function(){
	  if(first_time)
	  {
		  first_time=false;
		  for(var i=0;i<4;i++)
		  {
			ripl[i].setLoop(false);
			ripl[i].setSpeed(1);
		  }
	  }
  });
  
  this.center_box.appendChild(this._root.getDiv());
}

/**
 * This method returns a promise that will be fulfilled when the user clicks outside of the menu buttons.
 * @return VNPromise The promise object that is associated with this event. 
 */
CircleMenu.prototype.whenClickedOutside=function(){return this._out_p;};

/** 
 * This method returns the CirclButton object which is in the root button of this menu.
 * @return CircleButton The root CircleButton object.
 */
CircleMenu.prototype.getRoot=function(){return this._root;};

/**
 * This method prints a given message on the top of this menu for 5 seconds.
 * @param text A string with the message to be printed.
 * @param options An optional object with one or more of the following fields: 'seconds' with the duration of the caption animation in seconds (default is 5).
 */
CircleMenu.prototype.printCaption=function(text,options)
{
	var opt=options||{};
	vn.default(opt,{seconds:5});
	if(text.length==0)return;
	if(text==this.last_caption && (!this.caption_animation.isStopped()||this.caption_animation.isQueued()))return;
	this.last_caption=text;
	var a=new Animation();
	a.addKeyFrame(0,{opacity:0});
	a.addKeyFrame(1,{opacity:1});
	a.addKeyFrame(opt.seconds-1,{opacity:1});
	a.addKeyFrame(opt.seconds,{opacity:0});
	var self=this;
	a.whenNewFrame().then(function(f){
		self.caption_box.style.opacity=f.data.opacity;
	});
	if(this.caption_animation)
	{
		var t=this.caption_animation.getTime();
		if(t>1)
		{
			this.caption_animation.setSpeed(this.caption_animation.getDuration()-1);
			this.caption_animation.setTime(Math.max(t,this.caption_animation.getDuration()-1));
			a.playAfter(this.caption_animation);
			this.caption_animation.whenAnimationEnds().then(function(){self.caption_box.innerHTML=text;});
		}
		else 
		{
			if(!this.caption_animation.isStopped()||this.caption_animation.isQueued())
			{
				this.caption_animation.setTime(this.caption_animation.getDuration());
				a.playAfter(this.caption_animation);
				this.caption_animation.whenAnimationEnds().then(function(){self.caption_box.innerHTML=text;});
			}
			else
			{
				this.caption_box.innerHTML=text;
				a.play();
			}
		}
		this.caption_animation=a;
	}
	else
	{
		this.caption_animation=a;
		this.caption_box.innerHTML=text;
		a.play();
	}
};

/**
 * This method shows the menu. It is initially hidden. 
 */
CircleMenu.prototype.show=function()
{
	if(this.current_anim!=this.expand_anim)
	{
		var wm=vn.getWindowManager();
		wm.zIndex+=1;
		this.circles_div.style.zIndex=wm.zIndex;
		this.current_anim=this.expand_anim;
		this.expand_anim.playAfter(this.collapse_anim);
	}
};

/**
 * This method hides the menu.
 */
CircleMenu.prototype.hide=function()
{
	if(this.current_anim==this.expand_anim)
	{
		this.current_anim=this.collapse_anim;
		this.collapse_anim.playAfter(this.expand_anim);
	}
};

/**
 * This method returns the div container of the CircleMenu.
 */
CircleMenu.prototype.getDiv=function()
{
	return this.circles_div;
};

/**
 * This method returns the div container of the caption.
 */
CircleMenu.prototype.getCaptionDiv=function()
{
	return this.caption_box;
};