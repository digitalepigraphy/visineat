/* V1.0
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
 
function GUIManager(div)
{
	if(typeof div=='string')this.div_container=document.getElementById(div);
	else this.div_container=div;		

	this.toolbars=new Array();
	this.notification_area=null;
	
	this.click1_sound=new Audio((('https:' == document.location.protocol) ? 'https:' : 'http:')+'//'+vn.hostname+'/js/snd/click1.mp3');
	this.click2_sound=new Audio((('https:' == document.location.protocol) ? 'https:' : 'http:')+'//'+vn.hostname+'/js/snd/click2.mp3');
	this.mouseover1_sound=new Audio((('https:' == document.location.protocol) ? 'https:' : 'http:')+'//'+vn.hostname+'/js/snd/mouseover1.mp3');
	this.mouseover2_sound=new Audio((('https:' == document.location.protocol) ? 'https:' : 'http:')+'//'+vn.hostname+'/js/snd/mouseover2.mp3');
	
}

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
		this.mouseover1_sound.play();
	}
};

GUIManager.prototype.playMouseOver2Sound=function()
{
	if(this.mouseover2_sound.readyState>0)
	{
		this.mouseover2_sound.currentTime=0;
		this.mouseover2_sound.play();
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
	this.notification_area=new NotificationArea(this.div_container);
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

function ProgressBar(div_container,width)
{
	this.max_value=100;
	this.value=100;
	
	this.div=document.createElement('div');
	this.div.style.position='absolute';
	this.div.style.right='100%';
	this.div.style.height=width+'px';
	this.div.style.width='100%';
	this.div.style.top='0px';
	this.div.style.backgroundColor='rgb(0,0,255)';
	this.div.style.pointerEvents='none';
	this.div.style.display='none';
	div_container.appendChild(this.div);
}

ProgressBar.prototype.oneMoreToDo=function()
{
	if(this.value==this.max_value)
	{
		this.setProgress(0);
		this.setMaximumProgress(1);
	}
	else
		this.setMaximumProgress(this.max_value+1);
};

ProgressBar.prototype.oneMoreDone=function()
{
	this.setProgress(this.value+1);
};

ProgressBar.prototype.setProgress=function(value)
 {
 	var v=value;
 	if(v>this.max_value) v=this.max_value;
 	else if(v<0)c=0;
 	if(v!=this.value)
 	{
 		this.value=v;
		this.div.style.right=(100-(this.value*100)/this.max_value)+'%';
		if(this.value==this.max_value)
			this.div.style.display='none';
		else this.div.style.display='block';
 	}
 };
  
ProgressBar.prototype.setMaximumProgress=function(value)
 {
 	var v=value;
 	if(v<=0) return;
 	if(v!=this.max_value)
 	{
 		if(this.value>v) this.value=v;
 		this.max_value=v;
		this.div.style.right=(100-(this.value*100)/this.max_value)+'%';
		if(this.value==this.max_value)
			this.div.style.display='none';
		else this.div.style.display='block';
 	}
 };

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
		this.toolbar.div_container.style.margin='-'+(this.toolbar.size*this.toolbar.buttons.length/2)+'px 0 0 -'+this.y+'px';
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


function NotificationArea(gui_area_div)
{
	this.messages=new Array();
	
	var div=document.createElement('div');
	div.style.position='absolute';
	div.style.top='20%';
	div.style.width='100%';
	div.style.bottom='0px';
	div.style.pointerEvents='none';
	div.style.overflow='hidden';
	gui_area_div.appendChild(div);
	this.div_container=div;
}

NotificationArea.prototype.println=function(text)
{
	this.messages.push(new NotificationAreaItem(this,text));
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
		window.setTimeout(function(){self.animate();}, 1000/25);
		frame_requested=true;
	
		if(this.messages[0].y>-25)
		{
			this.messages[0].y-=1;
			this.messages[0].div_container.style.margin=this.messages[0].y+'px auto 0px auto';
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
			else if(this.messages[i].h>0)
			{
				this.messages[i].h-=1;
				this.messages[i].div_container.style.height=this.messages[i].h+'px';
				if(!frame_requested)
				{
					window.setTimeout(function(){self.animate();}, 1000/25);
					frame_requested=true;
				}
			}
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

function NotificationAreaItem(message_area,text)
{
	this.message_area=message_area;
	this.hide_status=0;
	this.y=0;
	this.h=24;
	this.alpha=1;
	var div=document.createElement('div');
	div.style.float='top';
	div.style.width='300px';
	div.style.height='24px';
	div.style.background='linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.4), rgba(0,0,0,0.2))';
	div.style.margin='0 auto';
	div.style.borderRadius='10px';
	div.style.color='rgb(255,255,255)';
	div.style.fontFamily='Arial';
	div.style.paddingLeft='5px';
	div.style.paddingTop='5px';
	div.style.weight='bold';
	div.style.fontSize='16px';
	div.style.textAlign='center';
	div.innerHTML=text;
	this.div_container=div;
	this.message_area.div_container.appendChild(div);
	var self=this;
	window.setTimeout(function(){self.tick();}, 4000);
}

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