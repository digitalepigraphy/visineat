function TreeFileObject()
{
	this.height=24;
	
	this._select_p=new VNPromise(this);
	this._move_p=new VNPromise(this);
	this._filedrop_p=new VNPromise(this);
	this._unselect_p=new VNPromise(this);
	this._click_p=new VNPromise(this);
	
	this.div_container=document.createElement('div');
	vn.set(this.div_container.style,{width:'100%',height:this.height+'px',position:'relative',overflow:'hidden'});
	
	this.title_div=document.createElement('div');
	this.title_div.draggable="true";
	var self=this;
	this.title_div.addEventListener('dragstart',function(event){
			TreeFileObject.dragged_object=self;
			//self.select();
	},false);
	vn.set(this.title_div.style,{width:'100%',height:this.height+'px',position:'relative',overflow:'hidden'});
	this.div_container.appendChild(this.title_div);
	
	this.title_div.addEventListener('mousedown',function(event){
		if(event.target==self.icon_div||event.target==self.title_text_div||event.target==self.small_icon_div)
		{
			self._click_p.callThen({event:event});
			var r=self.getRoot();
			if(r)
			{
				var p=r.whenClicked();
				p.setObject(self);
				p.callThen({event:event});
			}
			self.select(event);
		}
	},false);
	
	this.title_div.addEventListener('drop',function(event){self.handleDrop(event);},false);
	this.title_div.addEventListener('dragover',function(event){self.handleDragOver(event);},false);
	
	this.icon_url=vn.hosturl+'js/img/file-icon.png';
	this.icon_div=document.createElement('div');
	vn.set(this.icon_div.style,{width:this.height+'px',height:this.height+'px',position:'absolute',backgroundImage:'url("'+this.icon_url+'")',backgroundSize:'contain',backgroundRepeat:'no-repeat',backgroundPosition:'center'});
	this.title_div.appendChild(this.icon_div);
	
	this.small_icon_url=null;//vn.hosturl+'js/img/file-icon.png';
	this.small_icon_div=document.createElement('div');
	vn.set(this.small_icon_div.style,{width:Math.round(this.height/2)+'px',height:Math.round(this.height/2)+'px',bottom:'0px',right:'0px',position:'absolute',backgroundSize:'contain',backgroundRepeat:'no-repeat',backgroundPosition:'center'});
	this.icon_div.appendChild(this.small_icon_div);
	
	this.title_text_div=document.createElement('div');
	vn.set(this.title_text_div.style,{left:this.height+'px',position:'absolute',height:this.height+'px',lineHeight:this.height+'px',fontFamily:'Arial',fontSize:Math.round(this.height*3/5)+'px',paddingLeft:'5px'});
	this.title_div.appendChild(this.title_text_div);

	this.root_folder=null;
	this.parent_folder=null;
	
	this._can_move=true;
	
	this.setName('Untitled file');
	
}

TreeFileObject.prototype.setCanMove=function(flag){this._can_move=flag;};
TreeFileObject.prototype.canMove=function(){return this._can_move;};

function TreeFileDropTarget(div)
{
	this.div=div;
	this._filedrop_p=new VNPromise();
	this._drop_p=new VNPromise();
	this._not_p=new VNPromise(this);
	this._fileover_p=new VNPromise();
	this._over_p=new VNPromise();
	
	var self=this;
	var handleDrop=function(event)
	{
		event.preventDefault();
		event.stopPropagation();
		
		if(event.dataTransfer.files && event.dataTransfer.files.length>0)
		{
			self._filedrop_p.setObject({files:event.dataTransfer.files,into:this});
			self._filedrop_p.callThen({event:event});
			return;
		}
		//console.log(root.dragged_object.name+' -> '+this.name);
		
		self._drop_p.setObject({object:TreeFileObject.dragged_object,into:this});
		self._drop_p.callThen({event:event});
	};
	
	div.addEventListener('drop',handleDrop,false);
	
	var handleDragOver=function(event)
	{
		event.preventDefault();
		//event.stopPropagation();//I disabled this line so that the event is triggered on the VNWindow level in order the window to gain focus.
		event.dataTransfer.dropEffect = "move";
		
		
		if(event.dataTransfer.files && event.dataTransfer.files.length>0)
		{
			self._fileover_p.setObject({files:event.dataTransfer.files,into:this});
			self._fileover_p.callThen({event:event});
			return;
		}
		//console.log(root.dragged_object.name+' -> '+this.name);
		
		
		self._over_p.setObject({object:TreeFileObject.dragged_object,into:this});
		self._over_p.callThen({event:event});
	};
	div.addEventListener('dragenter',handleDragOver,false);
	
	div.addEventListener('dragleave',function(event){self._not_p.callThen({event:event});},false);
}
TreeFileDropTarget.prototype.whenDropped=function(){return this._drop_p;};
TreeFileDropTarget.prototype.whenNotDropped=function(){return this._not_p;};
TreeFileDropTarget.prototype.whenFileDropped=function(){return this._filedrop_p;};
TreeFileDropTarget.prototype.whenDraggedOver=function(){return this._over_p;};
TreeFileDropTarget.prototype.whenFileDraggedOver=function(){return this._fileover_p;};

var VNDropTarget=function(area)
{
	this._filedrop_p=new VNPromise();
	this._drop_p=new VNPromise();
	var self=this;
	
	var logo_container=document.createElement('div');
	area.appendChild(logo_container);
	vn.set(logo_container.style,{
		position:'absolute',
		bottom:'0px',
		top:'0px',
		width:'100%',
		overflow:'hidden'
	});
	var logo=document.createElement('div');
	logo_container.appendChild(logo);
	vn.set(logo.style,{
		position:'absolute',
		left:'50%',
		top:'50%',
		width:'100%',
		height:'100%'
	});
	var droparea=document.createElement('div');
	vn.set(droparea.style,{position:'absolute',
		width:'128px',
		height:'128px',
		top:'-64px',
		left:'-64px',
		borderRadius:'10px',
		border:'5px black dashed'});
	logo.appendChild(droparea);

	var usearea=document.createElement('div');
	vn.set(usearea.style,{position:'absolute',
		width:'64px',
		height:'64px',
		top:'32px',
		left:'32px'});
	droparea.appendChild(usearea);

	var b=new GUIButton('',{width:'60px',height:'60px'});
	b.setImage(vn.hosturl+'js/img/vn_use_icon.png');
	b.whenClicked().then(function(){
		var u=vn.cloud.use();
		if(u==null)return;
		self._drop_p.callThen({object:u.object.getId()});
	});
	
	usearea.appendChild(b.getDiv());

	//Type your algorithm here...
	var dt=new TreeFileDropTarget(droparea);
	dt.whenDropped().then(function(o,e){
		if(o.object)
		{
			if(o.object.cloudObject)
				self._drop_p.callThen({object:o.object.cloudObject.getId(),event:e});
			else if(o.object.oid)
				self._drop_p.callThen({object:o.object.oid,event:e});
		}
	});

	dt.whenFileDropped().then(function(o,e){
		self._filedrop_p.callThen({object:o,event:e});
	});
	
	dt.whenDraggedOver().then(function(o,e){
		droparea.style.background='linear-gradient(to top,rgb(250,250,255) 0%,rgba(100,100,255,0.5) 60%,rgba(200,200,255,0.5) 70%)';
	});

	dt.whenNotDropped().then(function(o,e){
		if(e.target==usearea||e.target==b.inner_div||e.target==b.getDiv())return;
		droparea.style.background='none';
	});
};

VNDropTarget.prototype.whenCloudFileProvided=function(){return this._drop_p;};
VNDropTarget.prototype.whenLocalFileProvided=function(){return this._filedrop_p;};

TreeFileObject.prototype.handleDrop=function(event)
{
	event.preventDefault();
	event.stopPropagation();
	var root=this.getRoot();
	if(root)
	{
		if(event.dataTransfer.files && event.dataTransfer.files.length>0)
		{
			var p=root.whenFileDropped();
			this._filedrop_p.setObject({files:event.dataTransfer.files,into:this});
			this._filedrop_p.callThen({event:event});
			p.setObject({files:event.dataTransfer.files,into:this});
			p.callThen({event:event});
			return;
		}
		//console.log(root.dragged_object.name+' -> '+this.name);
		
		if(!TreeFileObject.dragged_object.canMove())return;
		
		TreeFileObject.dragged_object.cancel_move=false;
	
		var p=root.whenMoved();
		if(!TreeFileObject.dragged_object.canMove())return;
		
		if(this.isFolder())
		{
			if(!this.isPredecessor(TreeFileObject.dragged_object))
			{
				TreeFileObject.dragged_object._move_p.setObject({object:TreeFileObject.dragged_object,into:this});
				TreeFileObject.dragged_object._move_p.callThen({event:event});
				p.setObject({object:TreeFileObject.dragged_object,into:this});
				p.callThen({event:event});
				if(!TreeFileObject.dragged_object.cancel_move)this.addFirst(TreeFileObject.dragged_object);
			}
			
		}
		else if(this!=TreeFileObject.dragged_object)
		{
			if(!this.parent_folder.isPredecessor(TreeFileObject.dragged_object))
			{
				TreeFileObject.dragged_object._move_p.setObject({object:TreeFileObject.dragged_object,into:this.parent_folder});
				TreeFileObject.dragged_object._move_p.callThen({event:event});
				p.setObject({object:TreeFileObject.dragged_object,into:this.parent_folder});
				p.callThen({event:event});
				if(!TreeFileObject.dragged_object.cancel_move)this.parent_folder.addAfter(TreeFileObject.dragged_object,this.getDiv());
			}
		}
		
	}
};

TreeFileObject.prototype.cancelMove=function(){this.cancel_move=true;};

TreeFileObject.prototype.handleDragOver=function(event)
{
	event.preventDefault();
	//event.stopPropagation();//I disabled this line so that the event is triggered on the VNWindow level in order the window to gain focus.
	event.dataTransfer.dropEffect = "move";
};

TreeFileObject.prototype.setName=function(name)
{
	this.name=name;
	this.title_text_div.innerHTML=name;
	return this;
};

TreeFileObject.prototype.getName=function(){return this.name;};

TreeFileObject.prototype.isFolder=function(){return false;};
TreeFileObject.prototype.getDiv=function(){return this.div_container;};
TreeFileObject.prototype.setIcon=function(url){this.icon_url=url;this.icon_div.style.backgroundImage='url("'+url+'")';return this;};
TreeFileObject.prototype.setSmallIcon=function(url){this.small_icon_url=url;this.small_icon_div.style.backgroundImage='url("'+url+'")';return this;};
TreeFileObject.prototype.getRoot=function()
{
	if(this.root_folder)return this.root_folder;
	if(this.parent_folder){this.root_folder=this.parent_folder.getRoot();}
	return this.root_folder;
};
TreeFileObject.prototype.getParent=function(){return this.parent_folder;};
TreeFileObject.prototype.isPredecessor=function(object)
{
	if(object)
	{
		if(object==this.getParent())return true;
		else if(this.getParent()==null)return false;
		else return this.getParent().isPredecessor(object);
	}
	else return false;//if no object was provided.
};

TreeFileObject.prototype.unselect=function(event)
{
	this.title_text_div.style.textShadow='';
	this.title_text_div.style.color='rgb(0,0,0)';
	this._unselect_p.callThen({event:event});
	var r=this.getRoot();
	if(r)
	{
		var p=r.whenUnSelected();
		p.setObject(this);
		p.callThen({event:event});
	}
};

TreeFileObject.prototype.select=function(event)
{
	var r=this.getRoot();
	if(r)
	{
		if(r.selected_object==this)return;//already selected
		if(r.selected_object) r.selected_object.unselect(event);
		r.selected_object=this;
		this.title_text_div.style.textShadow='2px 2px 15px #0000FF,-2px -2px 15px #0000FF,2px -2px 15px #0000FF,-2px 2px 15px #0000FF';
		this.title_text_div.style.color='rgb(255,255,255)';
		this._select_p.callThen({event:event});
		var p=r.whenSelected();
		p.setObject(this);
		p.callThen({event:event});
	}
};

TreeFileObject.prototype.whenSelected=function(){return this._select_p;};
TreeFileObject.prototype.whenUnSelected=function(){return this._unselect_p;};
TreeFileObject.prototype.whenClicked=function(){return this._click_p;};
TreeFileObject.prototype.whenMoved=function(){return this._move_p;};
TreeFileObject.prototype.whenFileDropped=function(){return this._filedrop_p;};
TreeFileObject.prototype.isSelected=function(){
	var r=this.getRoot();
	if(r && r.selected_object==this)return true;
	else return false;
}

//------------------------
function TreeFolderObject(div)
{
	TreeFileObject.call(this);
	this.setName('Untitled folder');
	this.contents=[];
	this.is_exanded=false;
	
	this._expand_p=new VNPromise(this);
	this._collapse_p=new VNPromise(this);
	
	this.icon_files_url=vn.hosturl+'js/img/folder-files-closed-icon.png';
	this.icon_open_files_url=vn.hosturl+'js/img/folder-files-open-icon.png';
	this.icon_empty_url=vn.hosturl+'js/img/folder-closed-icon.png';
	this.icon_open_empty_url=vn.hosturl+'js/img/folder-open-icon.png';
	
	this.setIcon(this.icon_empty_url);
	this.setIconOpen(this.icon_open_empty_url);
	
	this.contents_div=document.createElement('div');
	vn.set(this.contents_div.style,{right:'0px',position:'relative',left:this.height+'px',display:'none'});
	this.div_container.appendChild(this.contents_div);

	var self=this;		
	var _mouse_up=function(event){
		if(self.is_expanded) self.collapse();
		else self.expand();
		document.removeEventListener('mouseup',_mouse_up,false);
	};
	
	var sel_evt=null;
	
	this.whenSelected().then(function(o,e){
		sel_evt=e;
	});
	
	this.title_div.addEventListener('mousedown',function(event){
		if(self.isSelected() && event!=sel_evt)
		if(event.target==self.icon_div||event.target==self.title_text_div||event.target==self.small_icon_div)
		{
			document.addEventListener('mouseup',_mouse_up,false);
		}
	},false);
	
	if(typeof div!=='undefined')
	{
		this.tree_div=document.createElement('div');
		vn.set(this.tree_div.style,{backgroundColor:'rgb(255,255,255)',top:'0px',bottom:'0px',position:'absolute',width:'100%',overflowX:'hidden',overflowY:'auto'});
		div.appendChild(this.tree_div);
	
		this.progress_div=document.createElement('div');
		vn.set(this.progress_div.style,{backgroundColor:'rgb(192,192,192)',height:'5px',bottom:'0px',position:'absolute',width:'100%',overflow:'hidden',display:'none'});
		div.appendChild(this.progress_div);
	
		this.progress=new VNProgress();
		this.progress_bar=new ProgressBar(this.progress_div,5,this.progress);
		this.progress.whenProgress().then(function(){self.progress_div.style.display='block';});
		this.progress.whenDone().then(function(){self.progress_div.style.display='none';});
		
		this.selected_object=null;
		this.whenSelected().then(function(o){
			self.selected_object=o;
		});
		
		div=this.tree_div;
		this.root_folder=this; 
		div.appendChild(this.div_container);

		//this.expand();//the root is expanded
		this.is_expanded=true;
		this.contents_div.style.display='block';
		this.div_container.style.height='auto';
		this.div_container.style.overflow='visible';
		this.icon_div.style.backgroundImage='url('+this.icon_open_url+')';

		this.collapse=function(){};//collapsing the root is not allowed.
		this.contents_div.style.left='0px';//the root elements have no identation.
		this.title_div.style.height='0px';//the root has no title
		this.div_container.style.minHeight='100%';
		
		this.extra_div=document.createElement('div');//the root has an extra empty space on the bottom so that we can always drop an element to the root
		vn.set(this.extra_div.style,{right:'0px',position:'relative',left:'0px',height:this.height+'px'});
		this.div_container.appendChild(this.extra_div);
		
		this.div_container.addEventListener('mousedown',function(event){
			if(event.target==self.div_container || event.target==self.extra_div)
				self.select(event);
		},false);
		
		div.addEventListener('drop',function(event){
			event.preventDefault();
			event.stopPropagation();
			
			TreeFileObject.dragged_object.cancel_move=false;
	
			var p=self.whenMoved();
			
			TreeFileObject.dragged_object._move_p.setObject({object:TreeFileObject.dragged_object,into:self});
			TreeFileObject.dragged_object._move_p.callThen({event:event});
			p.setObject({object:TreeFileObject.dragged_object,into:self});
			p.callThen({event:event});
			if(!TreeFileObject.dragged_object.cancel_move)self.addLast(TreeFileObject.dragged_object);
			},false);
			
		div.addEventListener('dragover',function(event){
			self.handleDragOver(event);
			},false);
	
		this.setName('Root folder');
	}
	
	//pre-load the default icons as static fields in this class:
	if(typeof TreeFolderObject.static_file_icon==='undefined')
	{
		TreeFolderObject.static_file_icon=new Image();
		TreeFolderObject.static_file_icon.crossOrigin = '';
		TreeFolderObject.static_file_icon.src=vn.hosturl+'js/img/file-icon.png';
		
		TreeFolderObject.static_files=new Image();
		TreeFolderObject.static_files.crossOrigin = '';
		TreeFolderObject.static_files.src=vn.hosturl+'js/img/folder-files-closed-icon.png';
		
		TreeFolderObject.static_open_files=new Image();
		TreeFolderObject.static_open_files.crossOrigin = '';
		TreeFolderObject.static_open_files.src=vn.hosturl+'js/img/folder-files-open-icon.png';
	
		TreeFolderObject.static_empty=new Image();
		TreeFolderObject.static_empty.crossOrigin = '';
		TreeFolderObject.static_empty.src=vn.hosturl+'js/img/folder-closed-icon.png';
	
		TreeFolderObject.static_open_empty=new Image();
		TreeFolderObject.static_open_empty.crossOrigin = '';
		TreeFolderObject.static_open_empty.src=vn.hosturl+'js/img/folder-open-icon.png';
	}
}
/**
* This method sets the icons to be used in this folder object. There are up to 4 icons that can be set: one for the open folder, one for the closed folder, one for the open folder when it is empty, and one for the closed folder when it is empty. 
* If you set only open icon and the closed icon, the same will be used for the empty open and empty closed cases.
*
* @icons Object - An object that has one or more of the following string fields containing the url of image files: "open", "closed", "open_empty", "closed_empty". Example: my_folder.setIcons({open:"open_icon.png",closed:"closed_icon.png",open_empty:"open_icon.png",closed_empty:"closed_icon.png"});
*/
TreeFolderObject.prototype.setIcons=function(icons)
{
	var ic=icons||{};
	if(icons.open)
	{
		this.icon_open_files_url=icons.open;
		if(icons.open_empty)
			this.icon_open_empty_url=icons.open_empty;
		else this.icon_open_empty_url=icons.open;
	}
	
	if(icons.closed)
	{
		this.icon_files_url=icons.closed;
		if(icons.closed_empty)
			this.icon_empty_url=icons.closed_empty;
		else this.icon_empty_url=icons.closed;
	}
		
	if(this.contents.length==0)
	{
		this.setIcon(this.icon_empty_url);
		this.setIconOpen(this.icon_open_empty_url);
	}
	else 
	{
		this.setIcon(this.icon_files_url);
		this.setIconOpen(this.icon_open_files_url);
	}
};

TreeFolderObject.prototype.setIconOpen=function(url){this.icon_open_url=url;if(this.is_expanded)this.icon_div.style.backgroundImage='url("'+url+'")';};

TreeFolderObject.prototype.expand=function(){
	this.is_expanded=true;
	this.contents_div.style.display='block';
	this.div_container.style.height='auto';
	this.div_container.style.overflow='visible';
	this.icon_div.style.backgroundImage='url('+this.icon_open_url+')';
	this._expand_p.callThen();
	var r=this.getRoot();
	if(r)
	{
		var p=r.whenExpanded();
		p.setObject(this);
		p.callThen();
	}
};
	
TreeFolderObject.prototype.collapse=function(){
	this.is_expanded=false;
	this.contents_div.style.display='none';
	this.div_container.style.height=this.height+'px';
	this.div_container.style.overflow='hidden';
	this.icon_div.style.backgroundImage='url('+this.icon_url+')';
	this._collapse_p.callThen();
	var r=this.getRoot();
	if(r)
	{
		var p=r.whenCollapsed();
		p.setObject(this);
		p.callThen();
	}
	};
TreeFolderObject.prototype.isFolder=function(){return true;};
TreeFolderObject.prototype.getContents=function(){return this.contents;};

TreeFolderObject.prototype.whenExpanded=function(){return this._expand_p;};
TreeFolderObject.prototype.whenCollapsed=function(){return this._collapse_p;};

TreeFolderObject.prototype.remove=function(object)
{
	var i=this.contents.indexOf(object);
	if(i>-1)
	{
		var r=this.getRoot();
		if(r)
		{
			var o=r.getSelected();
			if(o==object) r.setSelected(null);
		}
		this.contents.splice(i,1);
		if(this.contents.length==0)
		{
			this.setIcon(this.icon_empty_url);
			this.setIconOpen(this.icon_open_empty_url);
		}
		this.contents_div.removeChild(object.getDiv());
		object.parent_folder=null;
	}
};

TreeFolderObject.prototype.removeAll=function()
{
	var contents=this.contents.slice();
	for(object in contents)
		this.remove(contents[object]);
};

TreeFolderObject.prototype.addFirst=function(object)
{
	if(object==this)return;//cannot add a folder into itself
	if(this.isPredecessor(object))return;
	
	var is_selected=false;
	var r=this.getRoot();
	if(r && r.getSelected()==object) is_selected=true;
	
	if(object.parent_folder)object.parent_folder.remove(object);
	object.parent_folder=this;
	this.contents.push(object);
	if(this.contents.length==1)
	{
		this.setIcon(this.icon_files_url);
		this.setIconOpen(this.icon_open_files_url);
	}
	this.contents_div.insertBefore(object.getDiv(),this.contents_div.childNodes[0]);
	
	if(is_selected)object.select();
};

TreeFolderObject.prototype.addLast=function(object)
{
	if(object==this)return;//cannot add a folder into itself
	if(this.isPredecessor(object))return;
	
	var is_selected=false;
	var r=this.getRoot();
	if(r && r.getSelected()==object) is_selected=true;
	
	
	if(object.parent_folder)object.parent_folder.remove(object);
	object.parent_folder=this;
	this.contents.push(object);
	if(this.contents.length==1)
	{
		this.setIcon(this.icon_files_url);
		this.setIconOpen(this.icon_open_files_url);
	}
	this.contents_div.appendChild(object.getDiv());
	
	if(is_selected)object.select();
};

TreeFolderObject.prototype.add=TreeFolderObject.prototype.addLast;

TreeFolderObject.prototype.addAfter=function(object,after)
{
	if(object==this)return;//cannot add a folder into itself
	if(this.isPredecessor(object))return;
	
	var is_selected=false;
	var r=this.getRoot();
	if(r && r.getSelected()==object) is_selected=true;
	
	if(object.parent_folder)object.parent_folder.remove(object);
	object.parent_folder=this;
	this.contents.push(object);
	if(this.contents.length==1)
	{
		this.setIcon(this.icon_files_url);
		this.setIconOpen(this.icon_open_files_url);
	}
	after.parentNode.insertBefore(object.getDiv(), after.nextSibling);
	
	if(is_selected)object.select();
};

TreeFolderObject.prototype.sort=function(){
	var c=this.getContents().slice();
	this.removeAll();
	c.sort(function(a,b){
		if(a.isFolder()&&!b.isFolder())
			return -1;
		if(!a.isFolder()&&b.isFolder())
			return 1;
		return a.getName().localeCompare(b.getName());
	});
	for(var i in c)
	{
		this.add(c[i]);
	}
};

TreeFolderObject.prototype.getProgress=function(){return this.progress;};
TreeFolderObject.prototype.getSelected=function(){return this.selected_object;};
TreeFolderObject.prototype.setSelected=function(o){this.selected_object=o;};


vn.extend(TreeFileObject,TreeFolderObject);

function TreeViewerButton()
{
	this._click_p=new VNPromise(this);
	this.icon_div=document.createElement('div');
	vn.set(this.icon_div.style,{margin:'1px',width:'36px',height:'36px',position:'relative',float:'left',background:'rgb(164,164,164)'});
	
	this.icon_img=document.createElement('div');
	vn.set(this.icon_img.style,{left:'0px',top:'0px',width:'100%',height:'100%',position:'relative',backgroundSize:'contain',backgroundRepeat:'no-repeat',backgroundPosition:'center'});
	this.icon_div.appendChild(this.icon_img)
	
	var self=this;
	this.icon_div.addEventListener('click',function(event){self._click_p.callThen();},false);
	this.icon_div.addEventListener('mouseover',function(event){self.icon_div.style.background='radial-gradient(rgb(255,255,0) 50%, rgb(128,128,128) 100%)';},false);
	this.icon_div.addEventListener('mouseout',function(event){self.icon_div.style.background='rgb(164,164,164)';},false);
}

TreeViewerButton.prototype.setToolTip=function(txt){this.icon_img.title=txt;};

TreeViewerButton.prototype.getDiv=function(){return this.icon_div;};

TreeViewerButton.prototype.setIcon=function(url)
{
	this.icon_img.style.backgroundImage='url("'+url+'")';
};

TreeViewerButton.prototype.whenClicked=function(){return this._click_p;};

function TreeViewer(wm,options)
{
	var opt=options||{};
	vn.default(opt,{title:'Tree Viewer',width:800,height:600});
	VNWindow.call(this,wm,opt);
	var div=this.getContentDiv();
	
	//this._file_viewers={};
	
	vn.set(div.style,{display:'flex',flexDirection:'column'});
	
	this.tree_width=250;
	
	this.toolbar=document.createElement('div');
	vn.set(this.toolbar.style,{backgroundColor:'rgb(192,192,192)',height:'38px',position:'absolute',width:'100%',overflow:'hidden'});
	div.appendChild(this.toolbar);
	
	var main=document.createElement('div');
	vn.set(main.style,{width:'100%',top:'38px',bottom:'0px',position:'absolute'});
	div.appendChild(main);
	
	var divider=new GUIDivider({background:'rgb(192,192,192)',height:'100%'});
	main.appendChild(divider.getDiv());
	vn.set(divider.getDiv1().style,{height:'100%',backgroundColor:'white'});
	
	this.main_div=divider.getDiv2();
		
	this.root=new TreeFolderObject(divider.getDiv1());
	
	/*this.whenResized().then(function(){
		var w=self.getContentDiv().clientWidth;
		if(self.tree_width>w-100)self.tree_width=w-100;
		if(self.tree_width<100)self.tree_width=100;
		self.left_div.style.width=self.tree_width+'px';
	});*/
}
//TreeViewer.prototype.getFileViewers=function(){return this._file_viewers;};
//TreeViewer.prototype.setFileViewer=function(classname,viewer){this._file_viewers[classname]=viewer};
TreeViewer.prototype.getMainDiv=function(){return this.main_div;};
TreeViewer.prototype.getRoot=function(){return this.root;};
TreeViewer.prototype.addButton=function(button)
{
	this.toolbar.appendChild(button.getDiv());
};


vn.extend(VNWindow,TreeViewer);