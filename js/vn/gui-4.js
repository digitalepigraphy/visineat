/* V4
 * Author(s): Angelos Barmpoutis, Kim Huynh
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
 
function GUIManager(div)
{
	if(typeof div=='string')this.div_container=document.getElementById(div);
	else this.div_container=div;		

	this.toolbars=new Array();
	this.notification_area=null;
	
	this.click1_sound=new Audio(vn.hosturl+'js/snd/click1.mp3');
	this.click2_sound=new Audio(vn.hosturl+'js/snd/click2.mp3');
	this.mouseover1_sound=new Audio(vn.hosturl+'js/snd/mouseover1.mp3');
	this.mouseover2_sound=new Audio(vn.hosturl+'js/snd/mouseover2.mp3');
	
}

GUIManager.prototype.createCanvasProjectionToolbar=function(c)
{	
	var message_area=this.createNotificationArea();
	var projector_menu=this.createRetractableToolbar(50,1);

	//var projector_menu=new RetractableToolbarButton(toolbar);
	//projector_menu.setLabel('Change viewing mode');

	var eyes_button=new RetractableToolbarButton(projector_menu);
	eyes_button.setIcon(vn.hosturl+'js/img/eye_icon.png');
	eyes_button.setLabel('Bare eye vision');
	eyes_button.onClick=function()
	{
		eyes_button.setSelected(false);
		c.useRegularProjector();
	};
	
	var parallel_eyes_button=new RetractableToolbarButton(projector_menu);
	parallel_eyes_button.setIcon(vn.hosturl+'js/img/parallel_eyes_icon.png');
	parallel_eyes_button.setLabel('Parallel eyes');
	parallel_eyes_button.onClick=function()
	{
		parallel_eyes_button.setSelected(false);
		c.useSideBySideProjector(false,false);
	};
	
	var cross_eyes_button=new RetractableToolbarButton(projector_menu);
	cross_eyes_button.setIcon(vn.hosturl+'js/img/crossed_eyes_icon.png');
	cross_eyes_button.setLabel('Crossed eyes');
	cross_eyes_button.onClick=function()
	{
		cross_eyes_button.setSelected(false);
		c.useSideBySideProjector(false,true);
	};
	
	var red_blue_button=new RetractableToolbarButton(projector_menu);
	red_blue_button.setIcon(vn.hosturl+'js/img/red_cyan_icon.png');
	red_blue_button.setLabel('Red/Cyan glasses');
	red_blue_button.onClick=function()
	{
		red_blue_button.setSelected(false);
		c.useRedCyanProjector();
	};
	
	var side_by_side_button=new RetractableToolbarButton(projector_menu);
	side_by_side_button.setIcon(vn.hosturl+'js/img/3dtv_icon.png');
	side_by_side_button.setLabel('3D TV display');
    side_by_side_button.onClick=function()
	{
		side_by_side_button.setSelected(false);
		c.useSideBySideProjector(true,false);
	};
	
	var polygonal_button=new RetractableToolbarButton(projector_menu);
	polygonal_button.setIcon(vn.hosturl+'js/img/polygonal_icon.png');
	polygonal_button.setLabel('Polygonal theater display');
	polygonal_button.onClick=function()
	{
		polygonal_button.setSelected(false);
		c.usePolygonalTheaterProjector(45,5);
	};
	
	var vr_menu=new RetractableToolbarButton(projector_menu);
	vr_menu.setIcon(vn.hosturl+'js/img/vr_icon.png');
	vr_menu.setLabel('VR head mounted display');
	
	var vr85_button=new RetractableToolbarButton(vr_menu);
	vr85_button.setIcon(vn.hosturl+'js/img/vr_icon.png');
	vr85_button.setLabel('85 vFOV');
	
	var vr95_button=new RetractableToolbarButton(vr_menu);
	vr95_button.setIcon(vn.hosturl+'js/img/vr_icon.png');
	vr95_button.setLabel('95 vFOV');
	
	var vr105_button=new RetractableToolbarButton(vr_menu);
	vr105_button.setIcon(vn.hosturl+'js/img/vr_icon.png');
	vr105_button.setLabel('105 vFOV');
	
	var vr115_button=new RetractableToolbarButton(vr_menu);
	vr115_button.setIcon(vn.hosturl+'js/img/vr_icon.png');
	vr115_button.setLabel('115 vFOV');
	vr_menu.setSelectedOption(vr105_button);
	vr_menu.onSelect=function(opt)
	{
		if(opt==vr85_button)
		{
			c.useFishEyeProjector(85);
			//self.setFullScreen(true);
		}
		else if(opt==vr95_button)
		{
			c.useFishEyeProjector(95,.0675);
			//self.setFullScreen(true);
		}
		else if(opt==vr105_button)
		{
			c.useFishEyeProjector(105,.0675);
			//self.setFullScreen(true);
		}
		else if(opt==vr115_button)
		{
			c.useFishEyeProjector(115,.0675);
			//self.setFullScreen(true);
		}
	};

	
	
	var gui=this;
	c.whenTapped().then(function(o,e){if(gui.isExpanded())gui.retract();else gui.expand();});
	c.whenMoved().then(function(o,e){if(!e.mouse_pressed){gui.expand();}});
	c.whenDragStarts().then(function(o,e){gui.retract();});
	c.whenDragEnds().then(function(e){gui.expand();});
};

GUIManager.prototype.playClick1Sound=function()
{
	if(this.click1_sound.readyState>0)
	{
		this.click1_sound.currentTime=0;
		this.click1_sound.play();
	}
};

GUIManager.prototype.playClick2Sound=function()
{
	if(this.click2_sound.readyState>0)
	{
		this.click2_sound.currentTime=0;
		this.click2_sound.play();
	}
};

GUIManager.prototype.playMouseOver1Sound=function()
{
	if(this.mouseover1_sound.readyState>0)
	{
		this.mouseover1_sound.currentTime=0;
		//this.mouseover1_sound.play();
	}
};

GUIManager.prototype.playMouseOver2Sound=function()
{
	if(this.mouseover2_sound.readyState>0)
	{
		this.mouseover2_sound.currentTime=0;
		//this.mouseover2_sound.play();
	}
};
	
GUIManager.prototype.createRetractableToolbar=function(size,orientation)
{
	var t=new RetractableToolbar(this,size,orientation);
	this.toolbars.push(t);
	return t;
};

GUIManager.prototype.createNotificationArea=function()
{
	var div=document.createElement('div');
	div.style.position='relative';
	div.style.top='20%';
	div.style.width='300px';
	div.style.margin='0 auto';
	//div.style.bottom='0px';
	div.style.pointerEvents='none';
	//div.style.overflow='hidden';
	this.div_container.appendChild(div);
	
	this.notification_area=new NotificationArea({parent:div,direction:'top'});
	return this.notification_area;
};

GUIManager.prototype.addNotification=function(text)
{
	if(this.notification_area!=null) this.notification_area.println(text);
};
GUIManager.prototype.setNotification=function(pos,text)
{
	if(this.notification_area!=null)this.notification_area.overwrite(pos,text);
};
GUIManager.prototype.clearNotifications=function()
{
	if(this.notification_area!=null) this.notification_area.clear();
};

GUIManager.prototype.expand=function()
{
	for(var i=0;i<this.toolbars.length;i++)
		this.toolbars[i].expand();
};

GUIManager.prototype.isExpanded=function()
{
	for(var i=0;i<this.toolbars.length;i++)
		if(this.toolbars[i].isExpanded())return true;
	return false;
};

GUIManager.prototype.retract=function()
{
	for(var i=0;i<this.toolbars.length;i++)
		this.toolbars[i].retract();
};

GUIManager.prototype.retractOptions=function()
{
	for(var i=0;i<this.toolbars.length;i++)
		this.toolbars[i].retractOptions();
};

function ProgressBar(div_container,width,progress)
{
	this.progress=progress;
	this.div=document.createElement('div');
	this.div.style.position='absolute';
	this.div.style.left='0px';
	this.div.style.height=width+'px';
	this.div.style.width='100%';
	this.div.style.top='0px';
	this.div.style.backgroundColor='rgb(0,0,255)';
	this.div.style.pointerEvents='none';
	this.div.style.display='none';
	vn.set(this.div.style,{backgroundImage: 'url("'+vn.hosturl+'js/img/loading_candy.gif")', backgroundSize:'auto 100%'});
	div_container.appendChild(this.div);
	
	this.text=document.createElement('div');
	vn.set(this.text.style,{float:'right',height:width+'px',position:'relative',textAlign:'right',lineHeight:width+'px',verticalAlign:'middle',fontFamily:'Arial',color:'rgb(255,255,255)',textShadow:'-1px -1px 0px #5b6178,1px -1px 0px #5b6178,-1px 1px 0px #5b6178,1px 1px 0px #5b6178',/*fontWeight:'bold',*/fontSize:(width+2)+'px',textDecoration:'none',touchAction:'none'});
	
	this.div.appendChild(this.text);
	
	
	var self=this;
	this.progress.whenProgress().then(function(p)
	{
		self.text.innerHTML=''+Math.ceil((p.getValue()+p.getIncrement())*99)+'%';
		self.div.style.width=(p.getValue()+p.getIncrement())*99+'%';
		self.div.style.display='block';
	});
	
	this.progress.whenDone().then(function(p)
	{
		self.div.style.display='none';
	});
}

ProgressBar.prototype.getDiv=function(){return this.div;};

function RetractableToolbar(gm,size,orientation)
{
	this.expanding=false;
	this.in_motion=false;
	this.size=size;
	this.y=size;
	this.orientation=orientation;
	this.timeout_id=null;
	this.gui=gm;
	this.buttons=new Array();
	this.button_level=0;
	this.expanded_options=null;
	this.visible=true;
	
	if(this.orientation==1)
	{
		var div=document.createElement('div');
		div.style.position='absolute';
		div.style.height=this.size+'px';
		div.style.width='100%';
		div.style.bottom='0px';
		div.style.pointerEvents='none';
		this.gui.div_container.appendChild(div);
		
		this.div_container=document.createElement('div');
		this.div_container.style.height=(this.size-6)+'px';
		this.div_container.style.width='0px';
		this.div_container.style.margin=this.y+'px auto 0 auto';
		this.div_container.style.pointerEvents='auto';
		this.div_container.style.background='linear-gradient(180deg, #565656, #262626, #060606)';
		this.div_container.style.borderRadius='4px 4px 0px 0px';
		this.div_container.style.padding='3px 0px 3px 3px';
		this.div_container.style.boxSizing='content-box';
		div.appendChild(this.div_container);
	}
	else
	{
		var div=document.createElement('div');
		div.style.position='absolute';
		div.style.height='100%';
		div.style.width=this.size+'px';
		div.style.left='0px';
		div.style.pointerEvents='none';
		this.gui.div_container.appendChild(div);
		
		this.div_container=document.createElement('div');
		this.div_container.style.position='absolute';
		this.div_container.style.top='50%';
		this.div_container.style.height='0px';
		this.div_container.style.width=(this.size-6)+'px';
		this.div_container.style.margin='0px 0 0 -'+this.y+'px';
		this.div_container.style.pointerEvents='auto';
		this.div_container.style.background='linear-gradient(270deg, #565656, #262626, #060606)';
		this.div_container.style.borderRadius='0px 4px 4px 0px';
		this.div_container.style.padding='3px 3px 0px 3px';
		div.appendChild(this.div_container);
	}
}

RetractableToolbar.prototype.addButton=function()
{

};

RetractableToolbar.prototype.retractOptions=function()
{
	if(this.expanded_options!=null)
	{
		this.expanded_options.retractOptions();
		this.expanded_options=null;
	}
};

RetractableToolbar.prototype.retract=function()
{
	this.retractOptions();
	this.expanding=false;
	if(!this.in_motion) {this.in_motion=true;this.animate();}
};

RetractableToolbar.prototype.expand=function()
{
	this.expanding=true;
	if(!this.in_motion) {this.in_motion=true;this.animate();}
};
 
 RetractableToolbar.prototype.isExpanded=function()
 {
	if(this.visible && (this.expanding || this.y<=0)) return true;
	else return false;
 };
 
RetractableToolbar.prototype.setVisible=function(flag)
{
	if(flag)
	{
		this.visible=true;
		this.div_container.style.display='block';
	}
	else
	{
		this.visible=false;
		this.div_container.style.display='none';
	}
	
	
};

RetractableToolbar.prototype.removeButton=function(b)
{
	var indx=this.buttons.indexOf(b);
	if(indx==-1)return false;
	
	this.buttons.splice(indx, 1);
	this.div_container.removeChild(b.div_container);
	if(this.orientation==1)
	{
		this.div_container.style.width=((this.size-3)*this.buttons.length)+'px';
	}
	else 
	{
		this.div_container.style.height=((this.size-3)*this.buttons.length)+'px';
		this.div_container.style.margin='-'+(this.size*this.buttons.length/2)+'px 0 0 -'+this.y+'px';
	}
	return true;
};

RetractableToolbar.prototype.addButtonAt=function(b,pos)
{
	
	var ref=null;
	if(pos<this.buttons.length)ref=this.buttons[pos].div_container;
	
	this.buttons.splice(pos,0,b);
	this.div_container.insertBefore(b.div_container,ref);
	if(this.orientation==1)
	{
		this.div_container.style.width=((this.size-3)*this.buttons.length)+'px';
	}
	else 
	{
		this.div_container.style.height=((this.size-3)*this.buttons.length)+'px';
		this.div_container.style.margin='-'+(this.size*this.buttons.length/2)+'px 0 0 -'+this.y+'px';
	}
};

RetractableToolbar.prototype.animate=function()
{
	if(this.expanding)
	{
		if(this.y>0)
		{
			this.y-=4;
			if(this.y<0)this.y=0;
			if(this.orientation==1)
				this.div_container.style.margin=this.y+'px auto 0 auto';
			else this.div_container.style.margin='-'+(this.size*this.buttons.length/2)+'px 0 0 '+(-this.y)+'px';
			var self=this;
			window.setTimeout(function(){self.animate();}, 1000/50);
		}
		else
		{
			this.in_motion=false;
			var self=this;
			this.expanding=false;
			if(this.timeout_id!=null)
			{
				window.clearTimeout(this.timeout_id);
			}
			this.timeout_id=window.setTimeout(function(){this.timeout_id=null;self.retract();}, 4000);
		}
	}
	else
	{
		if(this.y<this.size)
		{
			this.y+=4;
			if(this.y>this.size)this.y=this.size;
			if(this.orientation==1)
				this.div_container.style.margin=this.y+'px auto 0 auto';
			else this.div_container.style.margin='-'+(this.size*this.buttons.length/2)+'px 0 0 -'+this.y+'px';
			var self=this;
			window.setTimeout(function(){self.animate();}, 1000/50);
		}
		else
		{
			this.in_motion=false;
		}
	}
	
};
 
function RetractableToolbarButton(toolbar)
{
	this.type=0;//0:toggle button; 1:link; 2:menu, 3:menu toggle button
	this.status=false;
	this.enabled=true;
	this.link="";
	this.message=new Array();
	this.buttons=new Array();
	this.is_drop_down_menu=false;
	
	this.expanding=false;
	this.in_motion=false;
	this.opacity=0;
	
	if(toolbar.button_level==0)
	{
		this.toolbar=toolbar;
		this.initButton1();
	}
	else if(toolbar.button_level==1)
	{
		this.type=3;
		this.toolbar=toolbar.toolbar;
		this.parent_button=toolbar;
		this.initButton2();
	}	
	else return;
	
	var div=this.image_div;
	var self=this;	
	this.is_touch_operated=false;
	div.addEventListener('touchstart',function(event){
		if(!self.isEnabled()) return;
		self.is_touch_operated=true;
		if(self.mouseenter!=null)
		{
			self.div_container.removeEventListener('mouseeneter',self.mouseenter,false);
			self.mouseenter=null;
			self.div_container.removeEventListener('mouseleave',self.mouseenter,false);
			self.mouseleave=null;
		}
		event.preventDefault();
		event.stopPropagation();
		self.toolbar.gui.clearNotifications();
		for(var i=0;i<self.message.length;i++) self.toolbar.gui.setNotification(i,self.message[i]);
		self.handleClick();
	},false);
	
	div.addEventListener('mousedown',function(event){
		if(!self.isEnabled()) return;
		event.preventDefault();
		event.stopPropagation();
		self.handleClick();
	},false);
	
	this.mouseenter=function(event){
		if(!self.isEnabled()) return;
		event.preventDefault();
		self.toolbar.gui.expand();//to reset the animation timer
		if(self.status==false)
		{
			if(self.button_level==1)
			{
				if(self.toolbar.orientation==1)
					self.div_container.style.background='linear-gradient(0deg, #565656, #262626, #060606)';
				else
					self.div_container.style.background='linear-gradient(90deg, #565656, #262626, #060606)';
				self.toolbar.gui.playMouseOver1Sound();
			}
			else
			{
				self.div_container.style.background='rgba(0,0,255,0.4)';
				self.toolbar.gui.playMouseOver2Sound();
			}
		}
		self.toolbar.gui.clearNotifications();
		for(var i=0;i<self.message.length;i++) self.toolbar.gui.setNotification(i,self.message[i]);
	};
	div.addEventListener('mouseenter',this.mouseenter,false);
	
	this.mouseleave=function(event){
		event.preventDefault();
		if(self.status==false)self.div_container.style.background='';
	};
	div.addEventListener('mouseleave',this.mouseleave,false);
	
}

RetractableToolbarButton.prototype.setSelectedOption=function(selected_option)
{
	if(this.toolbar.button_level==0)
	{
		this.is_drop_down_menu=true;
		this.image_div.style.backgroundImage=selected_option.image_div.style.backgroundImage;
		this.image_div.style.backgroundSize=selected_option.image_div.style.backgroundSize;
		this.selected_option=selected_option;
		this.selected_option_id=-1;
		for(var i=0;i<this.buttons.length && this.selected_option_id==-1;i++)
		{
			if(this.selected_option==this.buttons[i])
			{
				this.selected_option_id=i;
				this.selected_option=this.buttons[i];
			}
		}
	}
};

RetractableToolbarButton.prototype.getSelectedOptionId=function()
{
	return this.selected_option_id;
};

RetractableToolbarButton.prototype.getSelectedOption=function()
{
	return this.selected_option;
};

RetractableToolbarButton.prototype.isSelected=function()
{
	return this.status;
};

RetractableToolbarButton.prototype.initButton1=function()
{
	this.button_level=1;
	
	//div_container
	var div=document.createElement('div');
	div.style.borderRadius='3px';
	if(this.toolbar.orientation==1)
	{
		div.style.marginRight='3px';
		div.style.height=(this.toolbar.size-6)+'px';
		div.style.width=(this.toolbar.size-6)+'px';
	}
	else
	{
		div.style.marginBottom='3px';
		div.style.height=(this.toolbar.size-6)+'px';
		div.style.width=(this.toolbar.size-6)+'px';
	}
	div.style.float='left';
	this.toolbar.div_container.appendChild(div);
	this.div_container=div;
	
	//image_div
	div=document.createElement('div');
	div.style.height=(this.toolbar.size-6)+'px';
	div.style.width=(this.toolbar.size-6)+'px';
	var mrg=10;
	div.style.backgroundSize=(this.toolbar.size-6-mrg)+'px '+(this.toolbar.size-6-mrg)+'px';//'contain';
	div.style.backgroundPosition='center'; 
	div.style.backgroundRepeat='no-repeat';
	div.style.cursor='pointer';
	this.div_container.appendChild(div);
	this.image_div=div;
	
	//menu_bar
	div=document.createElement('div');
	div.style.position='relative';
	if(this.toolbar.orientation==1)
	{
		div.style.top=-(this.toolbar.size-6+3)+'px'
		div.style.width=(this.toolbar.size-6)+'px';
		div.style.left='-1px';
		div.style.height='0px'
		div.style.borderRadius='4px 4px 0px 0px';
	}else
	{
		div.style.top=-(this.toolbar.size-6+1)+'px'
		div.style.left=(this.toolbar.size-6)+'px';
		div.style.width='0px';
		div.style.height=(this.toolbar.size-6)+'px'
		div.style.borderRadius='0px 4px 4px 0px';
	}	
	div.style.backgroundColor='rgba(0,0,255,0.3)';
	div.style.border='1px';
	div.style.borderStyle='solid';
	div.style.borderColor='rgba(200,200,255,0.5)';
	div.style.display='none';
	this.div_container.appendChild(div);
	this.menu_bar=div;
	
	this.toolbar.buttons.push(this);
	if(this.toolbar.orientation==1)
	{
		this.toolbar.div_container.style.width=((this.toolbar.size-3)*this.toolbar.buttons.length)+'px';
	}
	else 
	{
		this.toolbar.div_container.style.height=((this.toolbar.size-3)*this.toolbar.buttons.length)+'px';
		this.toolbar.div_container.style.margin='-'+(this.toolbar.size*this.toolbar.buttons.length/2)+'px 0 0 -'+this.toolbar.y+'px';
	}
};

RetractableToolbarButton.prototype.initButton2=function()
{
	this.button_level=2;
	this.parent_button.type=2;
	this.parent_button.buttons.push(this);
	if(this.toolbar.orientation==1)
	{
		this.parent_button.menu_bar.style.top=-(this.toolbar.size-6+3)*(this.parent_button.buttons.length+1)+'px'
		this.parent_button.menu_bar.style.height=(this.toolbar.size-6+3)*this.parent_button.buttons.length+'px'
	}else
	{
		this.parent_button.menu_bar.style.width=(this.toolbar.size-6+3)*this.parent_button.buttons.length+'px';
	}	
	
	//div_container
	var div=document.createElement('div');
	div.style.borderRadius='3px';
	if(this.toolbar.orientation==1)
	{
		div.style.marginBottom='3px';
		div.style.height=(this.toolbar.size-6)+'px';
		div.style.width=(this.toolbar.size-6)+'px';
	}
	else
	{
		div.style.marginLeft='3px';
		div.style.height=(this.toolbar.size-6)+'px';
		div.style.width=(this.toolbar.size-6)+'px';
	}
	div.style.float='left';
	this.parent_button.menu_bar.appendChild(div);
	this.div_container=div;
	
	//image_div
	div=document.createElement('div');
	div.style.height=(this.toolbar.size-6)+'px';
	div.style.width=(this.toolbar.size-6)+'px';
	var mrg=10;
	div.style.backgroundSize=(this.toolbar.size-6-mrg)+'px '+(this.toolbar.size-6-mrg)+'px';//'contain';
	div.style.backgroundPosition='center'; 
	div.style.backgroundRepeat='no-repeat';
	div.style.cursor='pointer';
	this.div_container.appendChild(div);
	this.image_div=div;
	
};

RetractableToolbarButton.prototype.setLink=function(link)
{
	this.link=link;
	this.type=1;
	//if(this.link.length>0) this.image_div.onclick=function(){ window.open(this.link); return false;};
};

RetractableToolbarButton.prototype.setLabel=function(msg)
{
	if(typeof msg !== 'string') 
			this.message=msg;
	else this.message=new Array(msg);
};

RetractableToolbarButton.prototype.setIcon=function(filename,mrgn)
{
	
	if(typeof mrgn!=='undefined') 
		this.image_div.style.backgroundSize=(this.toolbar.size-6-mrgn)+'px '+(this.toolbar.size-6-mrgn)+'px';//'contain';
	
	this.image_div.style.backgroundImage='url('+filename+')';
};

RetractableToolbarButton.prototype.setEnabled=function(flag)
{
	this.enabled=flag;
};

RetractableToolbarButton.prototype.isEnabled=function(flag)
{
	return this.enabled;
};

RetractableToolbarButton.prototype.setSelected=function(flag)
{
	if(this.status==flag) return;
	if(this.type==0)
	{
		this.status=flag;
		if(this.status)
		{
			if(this.toolbar.orientation==1)
				this.div_container.style.background='linear-gradient(180deg, #000006, #000026, #0000ff)';
			else this.div_container.style.background='linear-gradient(270deg, #000006, #000026, #0000ff)';
		}
		else
		{
			this.div_container.style.background='';
		}
	}
	else if(this.type==3)
	{
		this.status=flag;
		if(this.status)
		{
			if(this.toolbar.orientation==1)
				this.div_container.style.background='linear-gradient(180deg, #6666ff, #00ff00,#6666ff)';
			else this.div_container.style.background='linear-gradient(270deg, #6666ff, #00ff00,#6666ff)';
		}
		else
		{
			this.div_container.style.background='';
		}
	}
}

RetractableToolbarButton.prototype.handleClick=function()
{
	this.toolbar.gui.expand();//to reset the animation timer
	if(this.type==0)
	{
		this.toolbar.gui.retractOptions();
		if(this.status)
		{
			if(this.is_touch_operated)
			{
				this.div_container.style.background='';
			}
			else
			{
				if(this.toolbar.orientation==1)
					this.div_container.style.background='linear-gradient(0deg, #565656, #262626, #060606)';
				else
					this.div_container.style.background='linear-gradient(90deg, #565656, #262626, #060606)';
				
			}
			this.toolbar.gui.playClick2Sound();
		}
		else
		{
			if(this.toolbar.orientation==1)
				this.div_container.style.background='linear-gradient(180deg, #000006, #000026, #0000ff)';
			else this.div_container.style.background='linear-gradient(270deg, #000006, #000026, #0000ff)';
			
			this.toolbar.gui.playClick1Sound();
		}
		this.status=!this.status;
	}
	else if(this.type==3)
	{
		if(this.parent_button.is_drop_down_menu)
		{
			this.toolbar.retractOptions();
			if(this.parent_button.getSelectedOption()!=this)
			{
				this.parent_button.setSelectedOption(this);
				this.parent_button.onSelect(this);
			}
			
			this.toolbar.gui.playClick2Sound();
		}
		else
		{
			if(this.status)
			{
				if(this.is_touch_operated)
					this.div_container.style.background='';
				else
					this.div_container.style.background='rgba(0,0,255,0.4)';
				this.toolbar.gui.playClick2Sound();
			}
			else
			{
				if(this.toolbar.orientation==1)
					this.div_container.style.background='linear-gradient(180deg, #6666ff, #00ff00,#6666ff)';
				else this.div_container.style.background='linear-gradient(270deg, #6666ff, #00ff00,#6666ff)';
				
				this.toolbar.gui.playClick1Sound();
			}
			this.status=!this.status;
		}
	}
	else if(this.type==1)
	{
		this.toolbar.gui.retractOptions();
		this.toolbar.gui.playClick1Sound();
		this.toolbar.gui.clearNotifications();
		if(this.link.length>0) parent.location=this.link;// window.open(this.link);
	}
	else if(this.type==2)
	{
		if(this.status)
		{
			this.retractOptions();
			if(!this.is_touch_operated)
			{
				if(this.toolbar.orientation==1)
					this.div_container.style.background='linear-gradient(0deg, #565656, #262626, #060606)';
				else
					this.div_container.style.background='linear-gradient(90deg, #565656, #262626, #060606)';
			}
			this.toolbar.gui.playClick2Sound();
		}
		else
		{
			this.toolbar.gui.retractOptions();
			this.expandOptions();
			if(this.is_touch_operated)
			{
				this.toolbar.gui.playMouseOver2Sound();
			}
			else
			{
				this.toolbar.gui.playClick1Sound();
			}
		}
	}
	
	this.onClick(this);
};

RetractableToolbarButton.prototype.retractOptions=function()
{
	this.div_container.style.background='';
	
	//this.menu_bar.style.display='none';
	this.status=false;
	
	this.expanding=false;
	if(!this.in_motion) {this.in_motion=true;this.animate();}
};

RetractableToolbarButton.prototype.expandOptions=function()
{
	if(this.toolbar.orientation==1)
		this.div_container.style.background='linear-gradient(0deg, #565656, #262626, #060606)';
	else this.div_container.style.background='linear-gradient(90deg, #565656, #262626, #060606)';
			
	this.toolbar.expanded_options=this;
	//this.menu_bar.style.display='block';
	this.status=true;
	
	this.expanding=true;
	if(!this.in_motion) {this.in_motion=true;this.animate();}
};

RetractableToolbarButton.prototype.animate=function()
{
	if(this.expanding)
	{
		if(this.opacity<1)
		{
			this.opacity+=0.1;
			if(this.opacity>1)this.opacity=1;
			
			this.menu_bar.style.display='block';
			this.menu_bar.style.opacity=this.opacity;
			
			var self=this;
			window.setTimeout(function(){self.animate();}, 1000/50);
		}
		else
		{
			this.in_motion=false;
		}
	}
	else
	{
		if(this.opacity>0)
		{
			this.opacity-=0.1;
			if(this.opacity<=0)
			{
				this.opacity=0;
				this.menu_bar.style.display='none';
			}
			
			this.menu_bar.style.opacity=this.opacity;
			
			var self=this;
			window.setTimeout(function(){self.animate();}, 1000/50);
		}
		else
		{
			this.in_motion=false;
		}
	}
};
 
RetractableToolbarButton.prototype.onClick=function(button){};
RetractableToolbarButton.prototype.onSelect=function(button){};


function NotificationArea(options)
{
	var opt=options||{};
	vn.default(opt,{direction:'bottom'});
	this.direction=opt.direction;
	
	this.messages=new Array();
	
	var div=document.createElement('div');
	div.style.position='absolute';
	div.style.width='100%';
	div.style.height='auto';
	if(opt.direction=='bottom')div.style.bottom='0px';
	else if(opt.direction=='top')div.style.top='0px';
	div.style.pointerEvents='none';
	//div.style.overflow='hidden';
	opt.parent.appendChild(div);
	this.div_container=div;
}

NotificationArea.prototype.println=function(text,style,options)
{
	var i=new NotificationAreaItem(this,text,style,options);
	this.messages.push(i);
	return i;
};

NotificationArea.prototype.overwrite=function(pos,text)
{
	if(pos<this.messages.length)
		this.messages[pos].setText(text);
	else this.println(text);
};

NotificationArea.prototype.animate=function()
{
	if(this.messages.length==0) return;
	
	var frame_requested=false;
	var self=this;
	
	if(this.messages[0].hide_status>0) 
	{
		if(typeof this.messages[0].max_h=='undefined')
			this.messages[0].max_h=this.messages[0].div_container.clientHeight;
		window.setTimeout(function(){self.animate();}, 1000/25);
		frame_requested=true;
	
		if(this.messages[0].y>-25)
		{
			this.messages[0].y-=1;
			if(this.direction=='top')
				this.messages[0].div_container.style.margin=Math.floor(this.messages[0].y*this.messages[0].max_h/25)+'px auto 2px auto';
			else if(this.direction=='bottom')
				this.messages[0].div_container.style.margin='2px auto '+Math.floor(this.messages[0].y*this.messages[0].max_h/25)+'px auto';
		}
		else
		{
			this.messages[0].div_container.style.display='none';
			this.div_container.removeChild(this.messages[0].div_container);
			this.messages.splice(0, 1);
		}
	}
	for(var i=0;i<this.messages.length;i++)
	{
		if(this.messages[i].hide_status>0)
		{
			if(this.messages[i].alpha>0)
			{
				this.messages[i].alpha-=1.0/25;
				this.messages[i].div_container.style.opacity=this.messages[i].alpha;
				if(!frame_requested)
				{
					window.setTimeout(function(){self.animate();}, 1000/25);
					frame_requested=true;
				}
			}
			/*else if(this.messages[i].h>0)
			{
				this.messages[i].h-=1;
				this.messages[i].div_container.style.height=this.messages[i].h+'px';
				if(!frame_requested)
				{
					window.setTimeout(function(){self.animate();}, 1000/25);
					frame_requested=true;
				}
			}*/
			else
			{
				this.messages[i].div_container.style.display='none';
				this.div_container.removeChild(this.messages[i].div_container);
				this.messages.splice(i, 1);
			}
		}
	}
	
}

NotificationArea.prototype.clear=function()
{
	for(var i=0;i<this.messages.length;i++)
		this.messages[i].clear();
};

function NotificationAreaItem(message_area,text,style,options)
{
	var opt=options||{};
	vn.default(opt,{time:4000});
	var st=style||{};
	this.message_area=message_area;
	this.hide_status=0;
	this.y=0;
	this.h=24;
	this.alpha=1;
	var div=document.createElement('div');
	if(this.message_area.direction=='bottom')
		div.style.float='bottom';
	else if(this.message_area.direction=='top')
		div.style.float='top';
	div.style.width='100%';
	div.style.height='25px';
	div.style.background='linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.4), rgba(0,0,0,0.2))';
	div.style.textShadow='0px 0px 14px #0000FF';
	div.style.margin='2px auto 2px auto';
	div.style.borderRadius='10px';
	div.style.border='2px solid white';
	div.style.color='rgb(255,255,255)';
	div.style.fontFamily='Arial';
	div.style.paddingLeft='5px';
	div.style.paddingTop='5px';
	div.style.weight='bold';
	div.style.fontSize='16px';
	div.style.lineHeight='16px';
	div.style.textAlign='center';
	div.style.boxSizing='border-box';
	div.style.boxShadow='rgba(0, 0, 0,0.5) -5px 5px 10px';
	vn.set(div.style,st);
	div.innerHTML=text;
	this.div_container=div;
	if(this.message_area.direction=='bottom')
	{
		var fc=this.message_area.div_container.firstChild;
		if(fc)this.message_area.div_container.insertBefore(div,fc);
		else this.message_area.div_container.appendChild(div);
	}
	else this.message_area.div_container.appendChild(div);
	
	var self=this;
	if(opt.progress)
	{
		opt.progress.whenDone().then(function(){
			self.div_container.innerHTML=text+' (100%)';
			self.tick();
		});
		opt.progress.whenProgress().then(function(p){
			
			var i=Math.floor(Math.min((p.getValue()+p.getIncrement())*99,100));
			self.div_container.innerHTML=text+' ('+i+'%)';
			if(opt.color && opt.color.r && opt.color.g && opt.color.b)
			{
				var c=opt.color.r+','+opt.color.g+','+opt.color.b;
				self.div_container.style.background='linear-gradient(to right, rgb('+c+') 0%, rgb('+c+') '+i+'%, rgba('+c+',0.2) '+i+'%, rgba('+c+',0.2) 100%)';
			}
			else
			self.div_container.style.background='linear-gradient(to right, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.4) '+i+'%, rgba(0,0,0,0.2) '+i+'%, rgba(0,0,0,0.2) 100%)';
		});
	}
	else
	{
		window.setTimeout(function(){self.tick();}, opt.time);
	}
}

NotificationAreaItem.prototype.getDiv=function(){return this.div_container;};

NotificationAreaItem.prototype.setText=function(text)
{
	this.div_container.innerHTML=text;
	this.div_container.style.margin='0 auto';
	this.div_container.style.opacity='1';
	this.div_container.style.height='24px';
	this.hide_status-=1;
	this.y=0;
	this.h=24;
	this.alpha=1;
	var self=this;
	window.setTimeout(function(){self.tick();}, 4000);
}

NotificationAreaItem.prototype.clear=function()
{
	this.div_container.style.opacity='0';
	this.div_container.style.height='0px';
	this.h=0;
	this.alpha=0;
};

NotificationAreaItem.prototype.tick=function()
{
	this.hide_status+=1;
	this.message_area.animate();
};

/**
 * This class is the base class of all GUI classes, such as GUIButton, GUILabel, etc.
 * @param style An optional object with CSS fields and values to be applied to this element.
 */
function GUIElement(style)
{
	var div_container=document.createElement('div');
	//vn.set(div_container.style,{height:'100%'});
	vn.set(div_container.style,style);
	this.parent=null;
	this.parent_container=null;
	this.getDiv=function()
	{
		return div_container;
	};
}

/**
 * This method returns an HTMLElement object that contains this GUI component. You can use this method to append this element to any HTMLElement (such as div) in the layout of your applicartion.
 * @return HTMLElement The HTMLElement object that contains this GUI component.
 */
GUIElement.prototype.getDiv=function(){};

/** 
 * This class creates a GUI area that can hold GUI elements either as a vertical list (one on the top of the other) or as side by side list (in line).
 * @param options An optional object with one or more of the following fields: type (with string value "list" or "inline"), parent (with an HTMLElement in which this area will be appended as a child).
 * @param style An optional object with CSS fields and values to be applied to this element.
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * var area=new GUIArea({type:"inline"});<br>
 * var button1=new GUIButton("Ok");<br>
 * area.add(button1);<br>
 * var button2=new GUIButton("Cancel");<br>
 * area.add(button2);<br></font>
 */
function GUIArea(options,style)
{
	var opt=options||{};
	vn.default(opt,{type:'list'});
	GUIElement.call(this,{});
	vn.set(this.getDiv().style,{backgroundColor:'rgba(0,0,0,0.5)'});
	vn.set(this.getDiv().style,style);
	if(opt.parent)
	{
		opt.parent.appendChild(this.getDiv());
		this.parent_container=opt.parent;
	}
	this.children_containers=[];
	this.type=opt.type||'list';
}

/** 
 * This method appends a GUI element to this area. 
 * @param child A GUIElement object such as a GUIArea, a GUIButton, a GUILabel, etc. to be appended to this area.
 * @param style An optional object with CSS fields and values to be applied to the container of the element to be added.
 * @return GUIElement The child input object is returned in order to allow for compact code such as: var button=area.add(new GUIButton("example"));
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * var area=new GUIArea({type:"inline"});<br>
 * var button1=area.add(new GUIButton("Ok"));<br>
 * var button2=area.add(new GUIButton("Cancel"));<br></font>
 */
GUIArea.prototype.add=function(child,style)
{
	var c=document.createElement('div');
	if(this.type=='list')
	{
		vn.set(c.style,{padding:'5px 10px'});
		vn.set(c.style,style);
	}
	else if(this.type='inline')
	{
		vn.set(c.style,{padding:'5px 10px',display:'inline-block'});
		vn.set(c.style,style);
	}
	this.children_containers.push(c);
	c.appendChild(child.getDiv());
	this.getDiv().appendChild(c);
	child.parent=this;
	child.parent_container=c;
	return child;
};

/**
 * This method removes all elements from in this GUI area.
 */
GUIArea.prototype.empty=function()
{
	for(c in this.children_containers)
		this.getDiv().removeChild(this.children_containers[c]);
	this.children_containers=[];
};

vn.extend(GUIElement,GUIArea);

/** 
 * This class creates a GUI button.
 * @param label A string with the label of the button.
 * @param style An optional object with CSS fields and values to be applied to this element.
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * var button=new GUIButton("Ok");<br>
 * button.whenClicked().then(function(b){<br>
 * console.log('Button clicked!');<br>
 * });<br></font>
 */
function GUIButton(label,style)
{
	GUIElement.call(this,{display:'inline-block',height:'35px',border:'2px solid rgb(200,200,255)',borderRadius:'15px',color:'rgb(255,255,255)',
	overflow:'hidden',
	lineHeight:'35px',
	backgroundSize:'100% 100%',
	userSelect:'none',msUserSelect:'none',webkitUserSelect:'none',mozUserSelect:'none',cursor:'pointer'});
	vn.set(this.getDiv().style,style);
	
	this.inner_div=document.createElement('div');
	this.getDiv().appendChild(this.inner_div);
	vn.set(this.inner_div.style,{display:'inline-block',height:'40px',color:'rgb(255,255,255)',
	fontFamily:'"Segoe UI Light","Segoe UI","Segoe WP Light","Segoe WP","Segoe UI Latin Light",HelveticaNeue,Helvetica,Tahoma,ArialUnicodeMS,sans-serif',
	fontWeight:'200',
	fontSize:'16px',
	boxSizing:'border-box',
	background:'linear-gradient(to top, rgba(0,0,0,0.3) 0%,rgba(0,0,255,0.3) 70%)',
	textShadow:'0px 0px 14px #0000FF',textAlign:'center',paddingLeft:'10px',paddingRight:'10px'});
	vn.set(this.inner_div.style,style);
	if(label){
		this.inner_div.innerHTML=label;
		//this.inner_div.title=label;
	}
	
	
	var self=this;
	this._mouseover_cb=function(e){
		//e.preventDefault();
		vn.set(self.getDiv().style,{border:'2px solid rgb(255,255,255)'});
		//if(self.has_image)
		//	vn.set(self.inner_div.style,{background:'linear-gradient(to top,rgb(150,150,255) 0%,rgba(0,0,255,0.2) 20%,rgba(100,100,255,0) 30%)'});
		//else
			vn.set(self.inner_div.style,{background:'linear-gradient(to top,rgb(250,250,255) 0%,rgba(100,100,255,0.5) 60%,rgba(200,200,255,0.5) 70%)'});
		
	};
	this.getDiv().addEventListener('touchstart',this._mouseover_cb,false);
	this.getDiv().addEventListener('mousedown',this._mouseover_cb,false);
	this._mouseout_cb=function(e){
		vn.set(self.getDiv().style,{border:'2px solid rgb(200,200,255)'});
		if(self.has_image)
			vn.set(self.inner_div.style,{background:'linear-gradient(to top,rgb(150,150,255) 0%,rgba(255,255,255,0.2) 20%,rgba(100,100,255,0) 30%)'});
		else
			vn.set(self.inner_div.style,{background:'linear-gradient(to top, rgba(0,0,0,0.3) 0%,rgba(0,0,255,0.3) 70%)'});
		
		self._p.callThen();
		self._p.reset();
	};
	this.getDiv().addEventListener('touchend',this._mouseout_cb,false);
	this.getDiv().addEventListener('mouseup',this._mouseout_cb,false);
	
	this._mouseover2_cb=function(e){
		vn.set(self.getDiv().style,{border:'2px solid rgb(0,0,255)'});
		if(self.has_image)
			vn.set(self.inner_div.style,{background:'linear-gradient(to top,rgb(150,150,255) 0%,rgba(0,0,255,0.2) 20%,rgba(100,100,255,0) 30%)'});
		else
			vn.set(self.inner_div.style,{background:'linear-gradient(to top, rgba(0,0,0,0.3) 0%,rgba(0,0,255,0.3) 70%)'});
		
	};
	this._mouseout2_cb=function(e){
		vn.set(self.getDiv().style,{border:'2px solid rgb(200,200,255)'});
		if(self.has_image)
			vn.set(self.inner_div.style,{background:'linear-gradient(to top,rgb(150,150,255) 0%,rgba(255,255,255,0.2) 20%,rgba(100,100,255,0) 30%)'});
		else
			vn.set(self.inner_div.style,{background:'linear-gradient(to top, rgba(0,0,0,0.3) 0%,rgba(0,0,255,0.3) 70%)'});
		
	};
	this.getDiv().addEventListener('mouseover',this._mouseover2_cb,false);
	this.getDiv().addEventListener('mouseout',this._mouseout2_cb,false);
	
	this._p=new VNPromise(this);
	var enabled=true;
	this.setEnabled=function(flag){
		enabled=flag;
		if(enabled)
		{
			vn.set(self.getDiv().style,{opacity:1,pointerEvents:'auto'});
		}
		else
		{
			vn.set(self.getDiv().style,{opacity:0.35,pointerEvents:'none'});
		}
		return self;
	};
	this.isEnabled=function(){return enabled;};
};
/**
 * This method updates the text of the label of this button.
 * @param text A string with the label to be set to this button.
 */
GUIButton.prototype.setText=function(text)
{
	if(text){
		this.inner_div.innerHTML=text;
	}
	return this;
};
/**
 * This method updates the tool tip text of this button.
 * @param text A string with the tool tip to be set to this button.
 */
GUIButton.prototype.setToolTipText=function(text)
{
	if(text){
		this.inner_div.title=text;
	}
	return this;
};
/**
 * This method sets an image to this button.
 * @param url A string with the url of an image file.
 */
GUIButton.prototype.setImage=function(url)
{
	this.has_image=true;
	this.getDiv().style.backgroundImage='url('+url+')';
	vn.set(this.inner_div.style,{background:'linear-gradient(to top,rgb(150,150,255) 0%,rgba(255,255,255,0.2) 20%,rgba(100,100,255,0) 30%)'});	
	return this;
};
/**
 * This method enables or disables this button. It is enabled by default.
 * @param flag A boolean value with the desired status.
 */
GUIButton.prototype.setEnabled=function(flag){};
/**
 * This method returns true if this button is currently enabled or false otherwise.
 * @return boolean The current status of this button.
 */
GUIButton.prototype.isEnabled=function(){};
/**
 * This method returns a promise that will be fulfilled when this button is clicked.
 * @return VNPromise The promise object that is associated with this event. 
 */
GUIButton.prototype.whenClicked=function(){return this._p;};
vn.extend(GUIElement,GUIButton);

/** 
 * This class creates a GUI toggle button. A toggle button can be either in the pressed or released state. The state is toggled when the user presses this button.
 * @param label A string with the label of the button.
 * @param style An optional object with CSS fields and values to be applied to this element.
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * var button=new GUIToggleButton("Ok");<br>
 * button.whenClicked().then(function(b){<br>
 * if(b.isSelected())console.log('Button is pressed!');<br>
 * else console.log('Button is released!');<br>
 * });<br></font>
 */
function GUIToggleButton(label,style)
{
	GUIButton.call(this,label,style);	
	var status=false;
	var self=this;
	this.getDiv().removeEventListener('touchstart',this._mouseover_cb);
	this.getDiv().removeEventListener('mousedown',this._mouseover_cb);
	this.getDiv().removeEventListener('touchend',this._mouseout_cb);
	this.getDiv().removeEventListener('mouseup',this._mouseout_cb);
	this.getDiv().removeEventListener('mouseover',this._mouseover2_cb);
	this.getDiv().removeEventListener('mouseout',this._mouseout2_cb);
	this._click_cb=function(){
		self.setSelected(!status);
		};
	this.getDiv().addEventListener('click',this._click_cb,false);
	this.isSelected=function(){return status;};
	this.setSelected=function(flag){
		if(flag==status)return self;
		status=flag;
		if(status)	
		{
			vn.set(self.getDiv().style,{border:'2px solid rgb(255,255,255)'});
			if(self.has_image)
				vn.set(self.inner_div.style,{background:'linear-gradient(to top,rgb(150,150,255) 0%,rgba(0,0,255,0.5) 60%,rgba(100,100,255,0.5) 70%)'});
			//vn.set(self.inner_div.style,{background:'linear-gradient(to top,rgb(250,250,255) 0%,rgba(100,100,255,0.5) 60%,rgba(200,200,255,0.5) 70%)'});
			else
			vn.set(self.inner_div.style,{background:'linear-gradient(to top,rgb(150,150,255) 0%,rgba(0,0,255,0.5) 60%,rgba(100,100,255,0.5) 70%)'});
		}
		else
		{
			vn.set(self.getDiv().style,{border:'2px solid rgb(200,200,255)'});
			if(self.has_image)
				vn.set(self.inner_div.style,{background:'linear-gradient(to top,rgb(150,150,255) 0%,rgba(255,255,255,0.2) 20%,rgba(100,100,255,0) 30%)'});
			else
				vn.set(self.inner_div.style,{background:'linear-gradient(to top, rgba(0,0,0,0.3) 0%,rgba(0,0,255,0.3) 70%)'});
		}
		self._p.callThen();
		self._p.reset();
		return self;
	};
	
	this._mouseover2_cb=function(e){
		vn.set(self.getDiv().style,{border:'2px solid rgb(0,0,255)'});
	};
	
	this._mouseout2_cb=function(e){
		if(status)	
		vn.set(self.getDiv().style,{border:'2px solid rgb(255,255,255)'});
		else
		vn.set(self.getDiv().style,{border:'2px solid rgb(200,200,255)'});		
	};
	
	
	
	this.getDiv().addEventListener('mouseover',this._mouseover2_cb,false);
	this.getDiv().addEventListener('mouseout',this._mouseout2_cb,false);
	
}
/**
 * This method returns true if this button is currently pressed or false otherwise.
 * @return boolean The current status of this button.
 */
GUIToggleButton.prototype.isSelected=function(){};
/**
 * This method changes the state of this button to "pressed" if set to true, or "released" is set to false. It is false by default.
 * @param flag A boolean value with the desired status.
 */
GUIToggleButton.prototype.setSelected=function(flag){};
vn.extend(GUIButton,GUIToggleButton);

/** 
 * This class creates a GUI label element. This element is not interactive; it is a static label such as a title before an area of buttons. 
 * @param label A string with the text of this label.
 * @param style An optional object with CSS fields and values to be applied to this element.
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * var label=area.add(new GUILabel("Confirm:"));<br>
 * var yes=area.add(new GUIButton("Yes"));<br>
 * var no=area.add(new GUIButton("No"));<br></font>
 */
function GUILabel(label,style)
{
	GUIElement.call(this,{display:'inline-block',height:'35px',color:'rgb(255,255,255)',
	fontFamily:'"Segoe UI Light","Segoe UI","Segoe WP Light","Segoe WP","Segoe UI Latin Light",HelveticaNeue,Helvetica,Tahoma,ArialUnicodeMS,sans-serif',
	fontWeight:'200',
	fontSize:'16px',
	textShadow:'0px 0px 14px #0000FF',textAlign:'center',lineHeight:'35px',paddingLeft:'10px',paddingRight:'10px',overflow:'hidden',
	userSelect:'none',msUserSelect:'none',webkitUserSelect:'none',mozUserSelect:'none'});
	vn.set(this.getDiv().style,style);
	if(label)this.getDiv().innerHTML=label;
};
/**
 * This method updates the text of this label.
 * @param text A string with the text to be set to this label.
 */
GUILabel.prototype.setText=function(text)
{
	if(text)this.getDiv().innerHTML=text;
};
/**
 * This method returns the text of this label.
 * @return string The text of this label.
 */
GUILabel.prototype.getText=function()
{
	return this.getDiv().innerHTML;
};
vn.extend(GUIElement,GUILabel);

/** 
 * This class creates a GUI area that can contain several GUIOption elements from which only one can be selected at a time. This option menu behaves similarly to a menu of radio buttons in classic computer GUIs.
 * @param style An optional object with CSS fields and values to be applied to this element.
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * var menu=new GUIOptionMenu();<br>
 * var button1=menu.add(new GUIOption("Yes"));<br>
 * var button2=menu.add(new GUIOption("No"));<br></font>
 */
function GUIOptionMenu(style)
{
  	GUIArea.call(this,{type:'inline'},{border:'2px solid rgb(200,200,255)',borderRadius:'20px'});
	vn.set(this.getDiv().style,style)
	this._p_s=new VNPromise(this);
	var selection=null;
	var self=this;
	this.getSelected=function(){return selection;};
	this.add=function(child)
	{
		var c=document.createElement('div');
		vn.set(c.style,{padding:'5px 5px',display:'inline-block'});
		self.children_containers.push(c);
		c.appendChild(child.getDiv());
		self.getDiv().appendChild(c);
		child.parent=self;
		child.parent_container=c;
		child.getDiv().addEventListener('click',function(){
			if(child.isSelected())return;
			if(selection)selection.setSelected(false);
			child.setSelected(true);
		},false);
		child.whenClicked().then(function(child){if(child.isSelected()){selection=child;self._p_s.callThen();}});
		return child;
	};
}
/**
 * This method returns a promise that will be fulfilled when a different option is selected from this menu.
 * @return VNPromise The promise object that is associated with this event. 
 */
GUIOptionMenu.prototype.whenSelectionChanges=function(){return this._p_s;};
/**
 * This method returns the GUIOption element that is currently selected from this menu, if any.
 * @return GUIOption The option element that is currently selected.
 */
GUIOptionMenu.prototype.getSelected=function(){};
vn.extend(GUIArea,GUIOptionMenu);

/** 
 * This class creates a GUI option button. An option button can be either in the pressed or released state. The state is toggled when the user presses this button. When one option is selected the others are unselected from the same menu, so that only one option is selected at a time.
 * @param label A string with the label of the option.
 * @param style An optional object with CSS fields and values to be applied to this element.
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * var menu=new GUIOptionMenu();<br>
 * var button1=menu.add(new GUIOption("Yes"));<br>
 * var button2=menu.add(new GUIOption("No"));<br></font>
 */
function GUIOption(label,style)
{
	GUIToggleButton.call(this,label,style);	
	this.getDiv().removeEventListener('click',this._click_cb);
}

/**
 * This method returns the GUIOptionMenu element in which this option belongs, if any.
 * @return GUIOptionMenu The option menu element in which this option belongs.
 */
GUIOption.prototype.getMenu=function(){return this.parent;};
vn.extend(GUIToggleButton,GUIOption);

/** 
 * This class creates a GUI area that is divided into two GUI areas, the size of which can be adjusted by the user by moving the divider. Note: A GUIDivider should not be added to an inline area, because an inline area does not provide a fixed width to divide.
 * @param options An optional object with options that define the behaviour of this divider.
 * @param style An optional object with CSS fields and values to be applied to this element.
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * var divider=new GUIDivider();<br>
 * var label1=divider.add1(new GUILabel("Area 1"));<br>
 * var label2=divider.add2(new GUILabel("Area 2"));<br></font>
 */
function GUIDivider(options,style)
{
	var opt=options||{};
	vn.default(opt,{type:'vertical',position:200,background:'linear-gradient(to right,rgba(255,255,255,1) 0%, rgba(0,0,0,0) 50%, rgba(255,255,255,1) 100%)',height:'auto'});
	GUIElement.call(this,{});
	var div=this.getDiv();
	vn.set(div.style,{height:opt.height});
	vn.set(div.style,style);
	
	//vn.set(div.style,{display:'flex',flexDirection:'row',boxSizing:'border-box'});
	
	this.width1=opt.position;
	this.type=opt.type;
	
	var main=document.createElement('div');
	if(opt.type=='horizontal')vn.set(main.style,{height:'100%',width:opt.width,position:'relative'});
	else vn.set(main.style,{width:'100%',height:opt.height,position:'relative'});
	div.appendChild(main);
	
	var main2=document.createElement('div');
	if(opt.type=='horizontal')vn.set(main2.style,{height:'100%',width:opt.width,position:'relative',overflow:'hidden',display:'flex',flexDirection:'column'});
	else vn.set(main2.style,{width:'100%',height:opt.height,position:'relative',overflow:'hidden',display:'flex',flexDirection:'row'});
	main.appendChild(main2);
	
	this.left_div=document.createElement('div');
	if(opt.type=='horizontal') vn.set(this.left_div.style,{width:opt.width,position:'relative',float:'top',height:this.width1+'px',overflow:'hidden'});
	else vn.set(this.left_div.style,{height:opt.height,position:'relative',float:'left',width:this.width1+'px',overflow:'hidden'});
	main2.appendChild(this.left_div);
	
	
	//this.tree_div=document.createElement('div');
	//vn.set(this.tree_div.style,{backgroundColor:'rgb(255,255,255)',top:'0px',bottom:'0px',position:'absolute',float:'left',width:'100%',overflowX:'hidden',overflowY:'scroll'});
	//this.left_div.appendChild(this.tree_div);
	
	
	var self=this;
	this.border_div=document.createElement('div');
	if(opt.type=='horizontal') vn.set(this.border_div.style,{background:opt.background,width:opt.width,position:'relative',float:'top',height:'10px',cursor:'row-resize'});
	else vn.set(this.border_div.style,{background:opt.background,height:opt.height,position:'relative',float:'left',width:'10px',cursor:'col-resize'});
	main2.appendChild(this.border_div);
	
	this.main_div=document.createElement('div');
	if(opt.type=='horizontal') vn.set(this.main_div.style,{width:opt.width,position:'relative',flex:'1 1 0%',overflowY:'hidden'});
	else vn.set(this.main_div.style,{height:opt.height,position:'relative',flex:'1 1 0%',overflowX:'hidden'});
	main2.appendChild(this.main_div);
	
	this.divider_mousemove_event=function(event){event.preventDefault();var x=new Array();var y=new Array();x[0]=event.clientX; y[0]=event.clientY; self.handleDividerMouseMove(x,y);};
	this.divider_touchmove_event=function(event){event.preventDefault();var x=new Array();var y=new Array();for(var i=0;i<event.targetTouches.length;i++){x[i]=event.targetTouches[i].clientX;y[i]=event.targetTouches[i].clientY;}self.handleDividerMouseMove(x,y);};
	this.divider_mouseup_event=function(event){self.handleDividerMouseUp();};
	
	
	this.border_div.addEventListener('mousedown',function(event){if(self.touch_operated)return;event.preventDefault();var x=new Array();var y=new Array();x[0]=event.clientX; y[0]=event.clientY;self.handleDividerMouseDown(x,y);},false);
	this.border_div.addEventListener('touchstart',function(event){self.touch_operated=true;event.preventDefault();var x=new Array();var y=new Array();for(var i=0;i<event.targetTouches.length;i++){x[i]=event.targetTouches[i].clientX;y[i]=event.targetTouches[i].clientY;} self.handleDividerMouseDown(x,y);},false);
	
	/*this.selected_object=null;
	this.root=new TreeFolderObject(this.tree_div);
	this.root.whenSelected().then(function(o){
		self.selected_object=o;
	});*/
}
GUIDivider.prototype.getMainDiv=function(){return this.main_div;};

GUIDivider.prototype.handleDividerMouseDown=function(x,y)
{
	if(this.type=='horizontal')this.memory_x=y[0];
	else this.memory_x=x[0];
	this.memory_width=this.width1;
	if(this.type=='horizontal')this.offset_x=y[0];
	else this.offset_x=x[0];
	if(this.touch_operated)
	{
		document.addEventListener('touchmove',this.divider_touchmove_event,false);
		document.addEventListener('touchend',this.divider_mouseup_event,false);
	}
	else
	{
		document.addEventListener('mousemove',this.divider_mousemove_event,false);
		document.addEventListener('mouseup',this.divider_mouseup_event,false);
	}
};

GUIDivider.prototype.handleDividerMouseUp=function()
{
	if(this.touch_operated)
	{
		document.removeEventListener('touchmove',this.divider_touchmove_event,false);
		document.removeEventListener('touchend',this.divider_mouseup_event,false);
	}
	else
	{
		document.removeEventListener('mousemove',this.divider_mousemove_event,false);
		document.removeEventListener('mouseup',this.divider_mouseup_event,false);
	}
};

GUIDivider.prototype.setPosition=function(p)
{
	var w=this.getDiv().clientWidth;
	if(this.type=='horizontal')w=this.getDiv().clientHeight;
	
	if(typeof p=='string')
	{
		if(p.indexOf('%')>-1)
		{
			var parts=p.split('%');
			this.width1=Math.round(parseInt(parts[0])*w/100);
		}
	}
	else this.width1=p;
	
	if(this.width1<100)this.width1=100;
	if(this.width1>w-100)this.width1=w-100;
	if(this.type=='horizontal')this.left_div.style.height=this.width1+'px';
	else this.left_div.style.width=this.width1+'px';
};

GUIDivider.prototype.handleDividerMouseMove=function(x,y)
{
	if(this.type=='horizontal')this.setPosition(this.memory_width+y[0]-this.offset_x);
	else this.setPosition(this.memory_width+x[0]-this.offset_x);	
};

/**
 * This method returns an HTMLElement object that contains the first adjustable area of this divider. You can use this method to append other HTML elements (such as div) to this area.
 * @return HTMLElement The HTML element that contains the first adjustable area of this divider.
 */
GUIDivider.prototype.getDiv1=function(){return this.left_div;};

/**
 * This method returns an HTMLElement object that contains the second adjustable area of this divider. You can use this method to append other HTML elements (such as div) to this area.
 * @return HTMLElement The HTML element that contains the second adjustable area of this divider.
 */
GUIDivider.prototype.getDiv2=function(){return this.main_div;};

/** 
 * This method appends a GUI element to this the first adjustable area of this divider. 
 * @param child A GUIElement object such as a GUIArea, a GUIButton, a GUILabel, etc. to be appended to this area.
 * @param style An optional object with CSS fields and values to be applied to the container of the element to be added.
 * @return GUIElement The child input object is returned in order to allow for compact code such as: var button=divider.add1(new GUIButton("example"));
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * var divider=new GUIDivider();<br>
 * var label1=divider.add1(new GUILabel("Area 1"));<br>
 * var label2=divider.add2(new GUILabel("Area 2"));<br></font>
 */
GUIDivider.prototype.add1=function(child,style)
{
	var c=this.left_div;
	vn.set(c.style,style);
	c.appendChild(child.getDiv());
	child.parent=this;
	child.parent_container=c;
	return child;
};

/** 
 * This method appends a GUI element to this the second adjustable area of this divider. 
 * @param child A GUIElement object such as a GUIArea, a GUIButton, a GUILabel, etc. to be appended to this area.
 * @param style An optional object with CSS fields and values to be applied to the container of the element to be added.
 * @return GUIElement The child input object is returned in order to allow for compact code such as: var button=divider.add2(new GUIButton("example"));
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * var divider=new GUIDivider();<br>
 * var label1=divider.add1(new GUILabel("Area 1"));<br>
 * var label2=divider.add2(new GUILabel("Area 2"));<br></font>
 */
GUIDivider.prototype.add2=function(child,style)
{
	var c=this.main_div;
	vn.set(c.style,style);
	c.appendChild(child.getDiv());
	child.parent=this;
	child.parent_container=c;
	return child;
};

vn.extend(GUIElement,GUIDivider);

/** 
 * This class creates a GUI input element.
 * @param options An optional object with one or more of the following fields: value (a string with the initial value of this input element), placeholder (a string with the placeholder text of this input element).
 * @param style An optional object with CSS fields and values to be applied to this element.
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * var field=area.add(new GUIInput({placeholder:'Type your name'}));<br></font>
 */
function GUIInput(options,style)
{
	var opt=options||{};
	vn.default(opt,{value:'',placeholder:''});
	
	GUIElement.call(this,{display:'inline-block',height:'35px',color:'rgb(255,255,255)',
	fontFamily:'"Segoe UI Light","Segoe UI","Segoe WP Light","Segoe WP","Segoe UI Latin Light",HelveticaNeue,Helvetica,Tahoma,ArialUnicodeMS,sans-serif',
	fontWeight:'200',
	fontSize:'16px',
	textShadow:'0px 0px 14px #0000FF',textAlign:'center',lineHeight:'35px',paddingLeft:'10px',paddingRight:'10px',overflow:'hidden',
	userSelect:'none',msUserSelect:'none',webkitUserSelect:'none',mozUserSelect:'none'});
	vn.set(this.getDiv().style,style);
	//if(label)this.getDiv().innerHTML=label;
	
	this._p_vc=new VNPromise(this);
	this._p_ve=new VNPromise(this);
	
	var text_input=document.createElement('input');
	text_input.style.float='left';
	text_input.style.height='100%';
	text_input.style.width='100%';
	text_input.style.padding='0px 5px';
	text_input.style.border='0px'; 
	text_input.style.borderRadius='10px';
	text_input.style.fontFamily='"Segoe UI Light","Segoe UI","Segoe WP Light","Segoe WP","Segoe UI Latin Light",HelveticaNeue,Helvetica,Tahoma,ArialUnicodeMS,sans-serif';
	text_input.style.fontSize='16px';
	text_input.style.color='rgb(0,0,0)';
	text_input.style.backgroundColor='rgb(255,255,255)';
	text_input.style.outline='none';
	text_input.style.webkitAppearance='none';
	text_input.setAttribute( "autocomplete", "off" );
	text_input.setAttribute( "autocorrect", "off" );
	text_input.setAttribute( "autocapitalize", "off" );
	text_input.setAttribute( "spellcheck", "false" );
	text_input.value=opt.value;
	text_input.placeholder=opt.placeholder;
	vn.set(text_input.style,style);
	
	var self=this;
	text_input.onkeydown=function(e){
		if (!e) e = window.event;
		var keyCode = e.keyCode || e.which;
		if (keyCode == '13'){//enter
			//self.close();
			self._p_ve.callThen();
			self._p_ve.reset();
			return false;
		}
		else
		{
			//self._p_vc.callThen();
			//self._p_vc.reset();
		}
	};
	text_input.onkeyup=function(e){
		if (!e) e = window.event;
		var keyCode = e.keyCode || e.which;
		if (keyCode == '13'){//enter
			//self.close();
			//self._p_ve.callThen();
			//self._p_ve.reset();
			return false;
		}
		else
		{
			self._p_vc.callThen();
			self._p_vc.reset();
		}
	};
	this.getDiv().appendChild(text_input);
	this._t=text_input;
};
/**
 * This method updates the current value of this input element.
 * @param value A string with the value to be set to this input element.
 */
GUIInput.prototype.setValue=function(value)
{
	this._t.value=value;
	//self._p_vc.callThen();
	//self._p_vc.reset();
};

GUIInput.prototype.setText=GUIInput.prototype.setValue;
/**
 * This method returns current value of this input element.
 * @return string A string with the current value of this input element.
 */
GUIInput.prototype.getValue=function()
{
	return this._t.value;
};

GUIInput.prototype.getText=GUIInput.prototype.getValue;
/**
 * This method updates the current value of this input element.
 * @param placeholder A string with the value to be set to this input element.
 */
GUIInput.prototype.setPlaceholder=function(placeholder)
{
	if(placeholder)this._t.placeholder=placeholder;
};
/**
 * This method returns a promise that will be fulfilled when the value of this input element changes.
 * @return VNPromise The promise object that is associated with this event. 
 */
GUIInput.prototype.whenValueChanges=function(){return this._p_vc;};
/**
 * This method enables or disables this input element. It is enabled by default.
 * @param flag A boolean value with the desired status.
 */
GUIInput.prototype.setEnabled=function(flag){this._t.disabled=!flag;};
/**
 * This method returns a promise that will be fulfilled when the user presses enter.
 * @return VNPromise The promise object that is associated with this event. 
 */
GUIInput.prototype.whenValueEntered=function(){return this._p_ve;};
vn.extend(GUIElement,GUIInput);

function GUITabbedArea(options,style){
	var opt=options||{};
	vn.default(opt,{type:'list'});
	GUIElement.call(this,{});

	//Set up container
	vn.set(this.getDiv().style,{width:'100%',height:'100%',/*backgroundColor:'rgba(0,0,0,0.5)',*/display:'flex',flexFlow:'column'});
	vn.set(this.getDiv().style,style);

	//Set up tab bar
	this.tab_bar_div=document.createElement('div');
	this.getDiv().appendChild(this.tab_bar_div);
	vn.set(this.tab_bar_div.style,{display:'flex',width:'100%',height:'38px',/*backgroundColor:'rgba(0,0,0,0.5)',*/userSelect:'none',cursor:'default',padding:'6px 0px 0px 8px',overflow:'hidden',boxSizing:'border-box'});

	//Set up content div
	this.content_div=document.createElement('div');
	this.getDiv().appendChild(this.content_div);
	this.content_style={backgroundColor:'rgba(0,0,0,0.5)',color:'white',width:'100%',top:'38px',flex:'2',border:'2px solid rgb(255,255,255)',fontFamily:'"Segoe UI Light","Segoe UI","Segoe WP Light","Segoe WP","Segoe UI Latin Light",HelveticaNeue,Helvetica,Tahoma,ArialUnicodeMS,sans-serif'};
	vn.set(this.content_div.style,this.content_style);

	//Define tab styles
	//this.tab_style={width:'150px',height:'100%',boxSizing:'border-box',position:'relative',backgroundColor:'rgb(234, 234, 234)',color:'rgb(128,128,128)',margin:'1px'};
	this.tab_style={width:'150px',height:'100%',boxSizing:'border-box',position:'relative',border:'2px solid rgb(200,200,255)',borderRadius:'15px 15px 0px 0px',color:'rgb(255,255,255)',
	overflow:'hidden',
	background:'linear-gradient(to top, rgba(0,0,0,0.3) 0%,rgba(0,0,255,0.3) 70%)',
	//lineHeight:'35px',
	fontFamily:'"Segoe UI Light","Segoe UI","Segoe WP Light","Segoe WP","Segoe UI Latin Light",HelveticaNeue,Helvetica,Tahoma,ArialUnicodeMS,sans-serif',
	fontWeight:'200',
	fontSize:'16px',
	textShadow:'1px 1px #0000FF,0px 0px 14px #0000FF',
	userSelect:'none',msUserSelect:'none',webkitUserSelect:'none',mozUserSelect:'none',cursor:'pointer'};
	this.active_tab_style={background:'linear-gradient(to top,rgb(250,250,255) 0%,rgba(100,100,255,0.5) 60%,rgba(200,200,255,0.5) 70%)',border:'2px solid rgb(255,255,255)'};

	this.tab_areas=[];
	this.active_tab_area=null;

	if(opt.parent){opt.parent.appendChild(this.getDiv());this.parent_container=opt.parent;}
	this.children_containers=[];
	this.type=opt.type||'list';
}

GUITabbedArea.prototype.setActiveTab=function(tabArea){
	//Called when new tab added OR when tab clicked
	//Note: only 1 active tab allowed
	if(this.active_tab_area){vn.set(this.active_tab_area.getTabDiv().style,this.tab_style);}

	//Update tab styles
	this.active_tab_area=tabArea;
	vn.set(this.active_tab_area.getTabDiv().style,this.active_tab_style);

	this.getDiv().removeChild(this.content_div);
	this.content_div=tabArea.getContentDiv();
	vn.set(this.content_div.style,this.content_style);
	this.getDiv().appendChild(this.content_div);
};

GUITabbedArea.prototype.add=function(t)
{
	t.parent=this;
	vn.set(t.getTabDiv().style,this.tab_style);
	//Set new tab as active
	this.setActiveTab(t);
	this.tab_areas.push(t);
	this.tab_bar_div.appendChild(t.getTabDiv());

	//Add event listeners
	var self=this;
	t.getTabDiv().addEventListener('click',function(){self.setActiveTab(t);});
	//t.getTabExitDiv().addEventListener('click',function(event){self.remove(t);event.stopPropagation();});
	return t;
};

GUITabbedArea.prototype.addTab=function(label,content){
	var t=new GUITabArea(label,content);
	this.add(t);
	return t;
};

GUITabbedArea.prototype.remove=function(tabArea){

	var t=tabArea;
	this.tab_bar_div.removeChild(t.getTabDiv());

	//Remove the tabArea object from array
	var i=this.tab_areas.indexOf(tabArea);
	var rm=this.tab_areas.splice(i,1)[0];

	if(rm==t){
		//When active tab removed, update content div
		if(this.tab_areas.length==0){this.getDiv().removeChild(this.content_div);}
		else{t=this.tab_areas[this.tab_areas.length-1];this.setActiveTab(t);}
	}
};


GUITabbedArea.prototype.setTabStyle=function(style){
	//Apply style to all tabs, then reset active tab
	this.tab_style=style;
	for(var i in this.tab_areas){vn.set(this.tab_areas[i].getTabDiv().style,style);}
	this.setActiveTab(this.active_tab_area);
};


GUITabbedArea.prototype.setActiveTabStyle=function(style){
	this.active_tab_style=style;
	this.setActiveTab(this.active_tab_area);
};

GUITabbedArea.prototype.getTabAreas=function(){return this.tab_areas;};
GUITabbedArea.prototype.getTabBarDiv=function(){return this.tab_bar_div;};
GUITabbedArea.prototype.getContentDiv=function(){return this.content_div;};

vn.extend(GUIElement,GUITabbedArea);


function GUITabArea(label,content){
	GUIElement.call(this,{});

	//Set up container
	vn.set(this.getDiv().style,{});

	//Set up tab
	this.tab_div=document.createElement('div');
	vn.set(this.tab_div.style,{width:'150px',height:'100%',boxSizing:'border-box',position:'relative',backgroundColor:'rgb(234, 234, 234)',color:'rgb(128,128,128)',margin:'1px'});
	this.getDiv().appendChild(this.tab_div);
	this.tab_div.title=label;//Note: Set hover text

	this.tab_text_div=document.createElement('div');
	this.tab_div.appendChild(this.tab_text_div);
	vn.set(this.tab_text_div.style,{/*width:'100px',*/textAlign:'left',display:'inline-block',overflow:'hidden',padding:'3px 0 3px 15px',fontSize:'14px'});
	if(label){this.tab_text_div.innerHTML=label;}

	this.tab_exit_container=document.createElement('div');
	this.tab_div.appendChild(this.tab_exit_container);
	vn.set(this.tab_exit_container.style,{display:'inline-block',padding:'3px 10px 10px 10px',textAlign:'right',backgroundColor:'inherit',borderRadius:'20px',height:'100%',overflow:'hidden',position:'absolute',right:'2px',boxSizing:'border-box'});

	this.tab_exit_div=document.createElement('div');
	//this.tab_exit_container.appendChild(this.tab_exit_div);
	//this.tab_exit_div.innerHTML='&#215';


	//Set up content
	this.content_div=document.createElement('div');
	this.getDiv().appendChild(this.tab_div);
	if(content){this.content_div.appendChild(content);}
	vn.set(this.content_div.style,{boxSizing:'border-box'});
}

GUITabArea.prototype.select=function(){
	if(this.parent)
		this.parent.setActiveTab(this);
};
GUITabArea.prototype.getContentDiv=function(){return this.content_div;};
GUITabArea.prototype.setContentDiv=function(content){this.content_div=content;};
GUITabArea.prototype.getTabTextDiv=function(){return this.tab_text_div;};
GUITabArea.prototype.getTabExitDiv=function(){return this.tab_exit_div;};
GUITabArea.prototype.getTabDiv=function(){return this.tab_div;};
GUITabArea.prototype.setTabLabel=function(label){
	this.tab_text_div.innerHTML=label;
	//Update hover text
	this.tab_div.title=label;
};

vn.extend(GUIElement,GUITabArea);