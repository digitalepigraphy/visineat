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
 
function StructureSensorZIP(canvas)
	{
		this.canvas=canvas;
		this.gl=canvas.gl;
		this.camera=canvas.camera;
		this.shader=null;
		this.obj=new Array();
		this.img=null;
		this.loaded=false;
		this.center=[0,0,0];
		this.mean=[0,0,0];
		this.min=[0,0,0];
		this.max=[0,0,0];
		this.mvMatrix= mat4.create();
		this.filename='';
		this.bounding_box=null;
		this.show_box=false;
	}
	
	StructureSensorZIP.prototype.getShader=function(){return this.shader;};
	
	StructureSensorZIP.prototype.onTap=function(){};
	StructureSensorZIP.prototype.onMouseEnter=function(){};
	StructureSensorZIP.prototype.onMouseLeave=function(){};
	StructureSensorZIP.prototype.onDrag=function(e){};
	StructureSensorZIP.prototype.onDragStart=function(e){};
	StructureSensorZIP.prototype.onDragEnd=function(e){};
	
	StructureSensorZIP.prototype.load=function(filename)
	{
	this.filename=filename;
	var xmlhttp;
	if (window.XMLHttpRequest)
	{// code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp=new XMLHttpRequest();
	}
	else
	{// code for IE6, IE5
  		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}
	var self=this;
	xmlhttp.onreadystatechange=function()
  	{
		if (xmlhttp.readyState==4 && xmlhttp.status==200)
		{
		 var zip = new JSZip(xmlhttp.response);
		
		 var obj_filename='';
	     for(var fn in zip.files) if(fn.indexOf('.obj', fn.length - 4) !== -1) obj_filename=fn;	
		
		 //for(var fn in zip.files) c.println(fn);
		
          var f=zip.file(obj_filename).asText().split(/\s+/);
          //c.println(f.length);
          var v_counter=0;
          var f_counter=0;
          var vt_counter=0;
		  var n_counter=0;
          for(var i=0;i<f.length;i++)
          {
          	if(f[i]=='v') 
          	{
          		v_counter+=1;
				i+=3;
			}
          	if(f[i]=='vn') 
          	{
          		n_counter+=1;
				i+=3;
			}
			else if(f[i]=='vt')
          	{
          		vt_counter+=1;
          		i+=2;
          	}
          	else if(f[i]=='f')
          	{
          		f_counter+=1;
          		i+=3;
          	}
          }
		  
		  //if(vt_counter>0) c.println(v_counter+' vertices, '+f_counter+' polygons, textured');
          //else c.println(v_counter+' vertices, '+f_counter+' polygons, no texture');
          
          var xyz=new Float32Array(v_counter*3);
		var nrm=new Float32Array(v_counter*3);
		var uv=null;
		if(vt_counter>0) uv=new Float32Array(v_counter*2);
		var tri=null;

		if(v_counter>256*256)
		{
			tri=new Uint32Array(f_counter*3);
		}
		else tri=new Uint16Array(f_counter*3);
		
		v_counter=0;
          f_counter=0;
          n_counter=0;
          var uv_counter=0;
          var avg=[0,0,0];
          var mn=[0,0,0];
          var mx=[0,0,0];
          var stat_c=0;
          for(var i=0;i<f.length;i++)
          {
          	if(f[i]=='v') 
          	{
          		i+=1;
          		xyz[v_counter]=parseFloat(f[i]);
          		if(xyz[v_counter]<mn[0])mn[0]=xyz[v_counter]; else if(xyz[v_counter]>mx[0])mx[0]=xyz[v_counter];
          		avg[0]+=xyz[v_counter];
          		v_counter+=1;i+=1;
          		xyz[v_counter]=-parseFloat(f[i]);
          		if(xyz[v_counter]<mn[1])mn[1]=xyz[v_counter]; else if(xyz[v_counter]>mx[1])mx[1]=xyz[v_counter];
          		avg[1]+=xyz[v_counter];
          		v_counter+=1;i+=1;
          		xyz[v_counter]=-parseFloat(f[i]);
          		if(xyz[v_counter]<mn[2])mn[2]=xyz[v_counter]; else if(xyz[v_counter]>mx[2])mx[2]=xyz[v_counter];
          		avg[2]+=xyz[v_counter];
          		v_counter+=1;
          		if(stat_c==0)
          		{
          			mn[0]=avg[0];
          			mn[1]=avg[1];
          			mn[2]=avg[2];
          			mx[0]=avg[0];
          			mx[1]=avg[1];
          			mx[2]=avg[2];
          		}
          		stat_c+=1;
          	}
          	else if(f[i]=='vn')
          	{
          		i+=1;
          		nrm[n_counter]=parseFloat(f[i]);
          		n_counter+=1;i+=1;
          		nrm[n_counter]=-parseFloat(f[i]);
          		n_counter+=1;i+=1;
          		nrm[n_counter]=-parseFloat(f[i]);
          		n_counter+=1;
			}
          	else if(f[i]=='vt')
          	{
          		i+=1;
          		uv[uv_counter]=parseFloat(f[i]);
          		uv_counter+=1;i+=1;
          		uv[uv_counter]=parseFloat(f[i]);
          		uv_counter+=1;
          	}
          	else if(f[i]=='f')
          	{
          		i+=1;
          		tri[f_counter]=parseInt(f[i])-1;
          		f_counter+=1;i+=1;
  			tri[f_counter]=parseInt(f[i])-1;
          		f_counter+=1;i+=1;
          		tri[f_counter]=parseInt(f[i])-1;
          		f_counter+=1;
          	}
          }
          avg[0]/=stat_c;
          avg[1]/=stat_c;
          avg[2]/=stat_c;
          self.mean=avg;
          
          var ctr=[(mx[0]+mn[0])/2,(mx[1]+mn[1])/2,(mx[2]+mn[1])/2];
          for(var i=0;i<xyz.length;i++)
          {
          		xyz[i]-=ctr[0];
          		i+=1;
          		xyz[i]-=ctr[1];
          		i+=1;
          		xyz[i]-=ctr[2];
          }
          mn[0]-=ctr[0];
          mn[1]-=ctr[1];
          mn[2]-=ctr[2];
          mx[0]-=ctr[0];
          mx[1]-=ctr[1];
          mx[2]-=ctr[2];	
          
          self.center=ctr;
          self.min=mn;
          self.max=mx;
         
		 if((self.max[1]-self.min[1])/(self.max[0]-self.min[0])>self.gl.viewportHeight/self.gl.viewportWidth)
		self.scale=1.2/(self.max[1]-self.min[1]);
		else self.scale=(1.2*self.gl.viewportWidth/self.gl.viewportHeight)/(self.max[0]-self.min[0]);
		  
		if(n_counter==0)
		{
			//calculate N.
			//var nc=new Uint8Array(v_counter);
		}
		  
          
          if(stat_c>256*256) //needs restructuring
          {
			  console.log(stat_c+' vertices')
          	var goes_to=new Uint32Array(stat_c);
          	var used_in_batch=new Uint8Array(stat_c);
          	var num_of_faces=tri.length/3;
          	var fc=0;
          	var batch_now=1;
          	var max16bit=256*256;
          	var v_next=0;
          	var from_face=0;
          	var _xyz=new Float32Array(max16bit*3);
          	var _nrm=new Float32Array(max16bit*3);
          	var _c1=0;
          	var _c2=0;
          	for(var f=0; f<num_of_faces;f++)
          	{
          		if(v_next>max16bit-3)
          		{
          			var obj=new WebGLObject(self.canvas);
					obj.onTap=function(e){self.onTap(e);};
					obj.onMouseEnter=function(e){self.onMouseEnter(e);};
					obj.onMouseLeave=function(e){self.onMouseLeave(e);};
					obj.onDrag=function(e){self.onDrag(e);};
					obj.onDragStart=function(e){self.onDragStart(e);};
					obj.onDragEnd=function(e){self.onDragEnd(e);};
          			var _v=_xyz.subarray(0,v_next*3);
				obj.setXYZ(_v);
				obj.setNormals(_nrm.subarray(0,v_next*3));
				//obj.setUV(uv);
				obj.setTriangles(tri.subarray(from_face*3,f*3));
				self.obj.push(obj);
				
				from_face=f;
          			v_next=0;
          			batch_now+=1;
          		}
          		
          		for(var fci=0;fci<3;fci++)
          		{
          			if(used_in_batch[tri[fc]]!=batch_now)
          			{
          				used_in_batch[tri[fc]]=batch_now;
          				goes_to[tri[fc]]=v_next;
          				//copy xyz and normal of the new vector.
          				_c1=v_next*3;
          				_c2=tri[fc]*3;
          				_xyz[_c1]=xyz[_c2];
          				_nrm[_c1]=nrm[_c2];
          				_c1+=1;_c2+=1;
          				_xyz[_c1]=xyz[_c2];
          				_nrm[_c1]=nrm[_c2];
          				_c1+=1;_c2+=1;
          				_xyz[_c1]=xyz[_c2];
          				_nrm[_c1]=nrm[_c2];
          
          				tri[fc]=goes_to[tri[fc]];
          				v_next+=1;
          			}
          			else
          			{
          				tri[fc]=goes_to[tri[fc]];
          			}
          			fc+=1;
          		}
          	}
          	
          	if(v_next>0)
          	{
          		var obj=new WebGLObject(self.canvas);
				obj.onTap=function(e){self.onTap(e);};
				obj.onMouseEnter=function(e){self.onMouseEnter(e);};
				obj.onMouseLeave=function(e){self.onMouseLeave(e);};
				obj.onDrag=function(e){self.onDrag(e);};
				obj.onDragStart=function(e){self.onDragStart(e);};
				obj.onDragEnd=function(e){self.onDragEnd(e);};
			var _v=_xyz.subarray(0,v_next*3);
			obj.setXYZ(_v);
			obj.setNormals(_nrm.subarray(0,v_next*3));
			//obj.setUV(uv);
			var _f=tri.subarray(from_face*3,num_of_faces*3);
			obj.setTriangles(_f);
			self.obj.push(obj);
          	}
          }
          else
          {
		var obj=new WebGLObject(self.canvas);
		obj.onTap=function(e){self.onTap(e);};
		obj.onMouseEnter=function(e){self.onMouseEnter(e);};
		obj.onMouseLeave=function(e){self.onMouseLeave(e);};
		obj.onDrag=function(e){self.onDrag(e);};
		obj.onDragStart=function(e){self.onDragStart(e);};
		obj.onDragEnd=function(e){self.onDragEnd(e);};
		obj.setXYZ(xyz);
		if(vt_counter>0) obj.setUV(uv);
		/*else*/ obj.setNormals(nrm);
		
		obj.setTriangles(tri);
		//c.println(avg[0]+' '+avg[1]+' '+avg[2]);
		
		self.obj.push(obj);
	}
	
		
	
		var im=zip.file("Model.jpg");
		if(vt_counter>0 && im!=null)
		{
			var blob = new Blob( [ im.asUint8Array() ], { type: "image/jpeg" } );
          	self.img=new WebGLTexture(self.canvas);	
			self.img.onLoad=function(){self.loaded=true;self.onLoad();self.canvas.updatePickingMap();};
			self.img.load(URL.createObjectURL(blob));
			//self.loaded=true;
			/*c.println(URL.createObjectURL(blob));
			var a=im.asUint8Array();
			c.println(a.length);
			c.println(a[0]);
			c.println(a[1]);
			c.println(a[2]);
			c.println(a[3]);
			c.println(a[a.length-4]);
			c.println(a[a.length-3]);
			c.println(a[a.length-2]);
			c.println(a[a.length-1]);
			c.div_container.innerHTML='<img src="'+URL.createObjectURL(blob)+'">';*/
			
  		}
		else
		{
			
			self.loaded=true;
			self.onLoad();
			self.canvas.updatePickingMap();
		}
		self.initShaders();
		self.canvas.oneMoreDone();
		self.canvas.renderFrame();
        }//if file downloaded end
          
	};
	xmlhttp.overrideMimeType("text/plain; charset=x-user-defined");
	//c.println("Start loading file...");
	this.canvas.oneMoreToDo();
	xmlhttp.open("GET",filename,true);
	xmlhttp.send();
	

	};
	
	StructureSensorZIP.prototype.onLoad=function(){};
	
	StructureSensorZIP.prototype.isLoaded=function(){return this.loaded;};
	
	StructureSensorZIP.prototype._drawBoundingBox=function()
	{
		if(this.bounding_box==null) this.bounding_box=new BoundingBox(this.min,this.max,this.canvas);
		this.bounding_box.obj.getShader().updateProjection();
		this.bounding_box.obj.getShader().setModelView(this.mvMatrix);
		this.bounding_box.obj.getShader().setColorMask([0,0,1,1]);
		this.bounding_box.obj.draw();
		this.bounding_box.obj_h.getShader().updateProjection();
		this.bounding_box.obj_h.getShader().setModelView(this.mvMatrix);
		this.bounding_box.obj_h.draw();
	};
	
	StructureSensorZIP.prototype.setDrawBoundingBox=function(flag)
	{
		this.show_box=flag;
		//this.canvas.renderFrame();
	};
	
	StructureSensorZIP.prototype.draw=function()
{
	if(!this.loaded) return;
	var gl=this.gl;
	
	//if(this.camera.view_changed)
	{
		mat4.set(this.camera.mvMatrix,this.mvMatrix);
		mat4.scale(this.mvMatrix,[this.scale,this.scale,this.scale]);    	
	}
	
	
	
	var s=this.obj[0].getShader();
	
	s.updateAndUse();
	s.setModelView(this.mvMatrix);
	if(this.img!=null) this.img.use();
	for(var i=0;i<this.obj.length;i++)
		this.obj[i].draw();	
		
	if(this.show_box) {this._drawBoundingBox();}
};

StructureSensorZIP.prototype.setDrawMode=function(mode)
{
	for(var i=0;i<this.obj.length;i++)
		this.obj[i].setDrawMode(mode);
};
	
StructureSensorZIP.prototype.initShaders=function()
{
	if(this.shader==null)
	{
		var flags=WebGLShader.MAP|WebGLShader.DIFFUSE|WebGLShader.SPECULAR;
		if(this.img!=null) flags=flags|WebGLShader.UV;
		
		this.shader=new WebGLShader(this.canvas,flags);
		for(var i=0;i<this.obj.length;i++)
			this.obj[i].setShader(this.shader);

		if(this.img==null) 
		{
			this.shader.useLighting(true); 
			this.shader.useTexture(false);
		}
		else 
		{
			this.shader.useTexture(true);
			this.shader.useLighting(false);
		}
	}
		   
	
    //mat4.set(this.camera.mvMatrix,this.mvMatrix);
    //mat4.scale(this.mvMatrix,[this.scale,this.scale,this.scale]);
    //this.shader.setModelView(this.mvMatrix);
};
	
//--------------------------------
	
function WebGLInstruction(image_composition)
{
	this.id=0;
	this.image_composition=image_composition;
}

WebGLInstruction.prototype.translate=function(x,y,z)
{
	this.id=1;
	this.valf=[x,y,z];
}

WebGLInstruction.prototype.rotate=function(angle,x,y,z)
{
	this.id=2;
	this.valf=[degToRad(angle),x,y,z];
}
		
WebGLInstruction.prototype.pushMatrix=function()
{
	this.id=3;		
}
		
WebGLInstruction.prototype.popMatrix=function()
{
	this.id=4;
}
		
WebGLInstruction.prototype.begin=function(type)
{
	this.id=5;
	this.vali=[type];
}
		
WebGLInstruction.prototype.end=function(obj)
{
	this.id=6;
	this.obj=obj;
}
		
WebGLInstruction.prototype.enable=function(type)
{
	this.id=7;
	this.vali=[type];
}
		
WebGLInstruction.prototype.disable=function(type)
{
	this.id=8;
	this.vali=[type];
}
		
WebGLInstruction.prototype.vertex=function(x,y,z)
{
	this.id=9;
	this.valf=[x,y,z];
}
		
WebGLInstruction.prototype.texcoord=function(u,v)
{
	this.id=10;
	this.valf=[u,v];
}
		
WebGLInstruction.prototype.color=function(r,g,b)
{
	this.id=11;
	this.valf=[r,g,b];
}
		
WebGLInstruction.prototype.bindTexture=function(texture)
{
	this.id=12;
	this.texture=texture;
}
		
WebGLInstruction.prototype.rectange=function(w,h,u,v)
{
	this.id=13;
	this.valf=[w,h,u,v];
}
		
WebGLInstruction.prototype.clearColor=function(r,g,b)
{
	this.id=14;
	this.valf=[r,g,b];
}

WebGLInstruction.prototype.command=function()
{
	switch(this.id)
	{
	case 1:
		return "translate";
	case 2:
		return "rotate";
	case 3:
		return "pushMatrix";
	case 4:
		return "popMatrix";
	case 5:
		return "begin";
	case 6:
		return "end";
	case 7:
		return "enable";
	case 8:
		return "disable";
	case 9:
		return "vertex";
	case 10:
		return "texCoord";
	case 11:
		return "color";
	case 12:
		return "bindTexture";
	case 13:
		return "rectangle";
	case 14:
		return "clearColor";
	};
	return "";
}

WebGLInstruction.prototype.execute=function()
{
	var gl=this.image_composition.gl;
	switch(this.id)
	{
	case 1:
		mat4.translate(this.image_composition.mvMatrix,this.valf);
		break;
	case 2:
		mat4.rotate(this.image_composition.mvMatrix, this.valf[0],[this.valf[1],this.valf[2],this.valf[3]]);
		break;
	case 3:
		this.image_composition.mvPushMatrix();
		break;
	case 4:
		this.image_composition.mvPopMatrix();
		break;
	case 5:
		//gl.glBegin(this.vali[0]);
		break;
	case 6:
		//gl.glEnd();
		this.image_composition.getShader().setModelView(this.image_composition.mvMatrix);
		this.obj.draw();
		break;
	case 7:
		this.image_composition.gl.enable(this.vali[0]);
		break;
	case 8:
		this.image_composition.gl.disable(this.vali[0]);
		break;
	case 9:
		//gl.glVertex3f(this.valf[0],this.valf[1],this.valf[2]);
		break;
	case 10:
		//gl.glTexCoord2f(this.valf[0],this.valf[1]);
		break;
	case 11:
		//gl.glColor3f(this.valf[0], this.valf[1], this.valf[2]);
		this.image_composition._shader.setColorMask([this.valf[0], this.valf[1], this.valf[2],1]);
		break;
	case 12:
		if(this.texture!=null && this.texture.texture!=-1)this.texture.use();
		break;
	case 13:
		if(typeof this.obj !== 'undefined')
		{
			this.image_composition.getShader().setModelView(this.image_composition.mvMatrix);
			this.obj.draw();
		}
		else
		{
			this.obj=new WebGLObject(this.image_composition.canvas);
			this.obj.createRect(this.valf[0],this.valf[1],this.valf[2],this.valf[3]);
			this.obj.setShader(this.image_composition._shader);
		}
		break;
	case 14:
		this.image_composition.canvas.setBackgroundColor(this.valf[0],this.valf[1],this.valf[2]);
		break;
	};
}
 

function WebGLImageComposition(canvas)
{
	this.canvas=canvas;
	this.gl=canvas.gl;
	this.loaded=false;
	this.mvMatrixStack = [];
	this.mvMatrix=mat4.create();;
	this._shader=new WebGLShader(canvas,WebGLShader.UV);
	this._shader.useTexture(true);
	this.brightness=1;
}

WebGLImageComposition.prototype.getShader=function()
{
	if(this.canvas.roii.draw_rois) return this.canvas.roii.shader;
	return this._shader;
}
	
WebGLImageComposition.prototype.load=function(fnm)
{
	this.filename=fnm;
	this.instructions=new Array();
	this.textures=new Array();
	var file_request;
	if (window.XMLHttpRequest)
	{// code for IE7+, Firefox, Chrome, Opera, Safari
		file_request=new XMLHttpRequest();
	}
	else
	{// code for IE6, IE5
		file_request=new ActiveXObject("Microsoft.XMLHTTP");
	}	
	var self=this;
	file_request.onreadystatechange=function()
	{
		if (file_request.readyState==4 && file_request.status==200)
		{
			self.handleLoadedFile(file_request.responseText);
		}
	}
	file_request.overrideMimeType("text/plain; charset=x-user-defined");
	file_request.open("GET",this.filename+"/cgi",true);
	file_request.send();
}

WebGLImageComposition.prototype.setBrightness=function(v)
{
	this.brightness=v;
	this.gl.useProgram(this._shader.shaderProgram);
	this.gl.uniform4f(this._shader.shaderProgram.uBrightness,this.brightness,this.brightness,this.brightness,1);
}

WebGLImageComposition.prototype.decreaseBrightness=function(v)
{
	this.brightness-=v;
	if(this.brightness<0)this.brightness=0;
	this.gl.uniform4f(this._shader.shaderProgram.uBrightness,this.brightness,this.brightness,this.brightness,1);
}

WebGLImageComposition.prototype.increaseBrightness=function(v)
{
	this.brightness+=v;
	if(this.brightness>1)this.brightness=1;
	this.gl.uniform4f(this._shader.shaderProgram.uBrightness,this.brightness,this.brightness,this.brightness,1);
}

WebGLImageComposition.prototype.mvPushMatrix=function() {
    var copy = mat4.create();
    mat4.set(this.mvMatrix, copy);
    this.mvMatrixStack.push(copy);
}

WebGLImageComposition.prototype.mvPopMatrix=function() {
    if (this.mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    this.mvMatrix = this.mvMatrixStack.pop();
}

WebGLImageComposition.prototype.getKeywordID=function(s)
{
	if(s.toUpperCase()==="LINES") return this.gl.LINES;
	else if(s.toUpperCase()==="TRIANGLES") return this.gl.TRIANGLES;
	else if(s.toUpperCase()==="QUADS") return "QUADS";
	else if(s.toUpperCase()==="TEXTURES") return "TEXTURES";
	else if(s.toUpperCase()==="DEPTH_TEST") return this.gl.DEPTH_TEST;
	else if(s.toUpperCase()==="BLEND") return this.gl.BLEND;
	else return 0;
}

WebGLImageComposition.prototype.getTextureByName=function(s)
{
	var found=-1;
	var ret;
	for(var i=0;i<this.textures.length && found==-1;i++)
	{
		if(this.textures[i].name.toUpperCase()===s.toUpperCase())
		{
			found=i;
			ret=this.textures[i];
		}
	}
	return ret;
}

WebGLImageComposition.prototype.handleLoadedFile=function(text)
{
	var gl=this.gl;
	var line=text.split("\n");
	for(l=0;l<line.length;l++)
	{
		var tokens=line[l].split(/\s+/);
		
		if(tokens.length>1 && tokens[0].length==0)
		{
			var tokens2=new Array();
			for(i=1;i<tokens.length;i++)
					tokens2[i-1]=tokens[i];
			tokens=tokens2;
		}

		if(tokens.length>=4 && tokens[0].toUpperCase()==="TRANSLATE")
		{
			var i=new WebGLInstruction(this);
			i.translate(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]));
			this.instructions[this.instructions.length]=i;
		}
		else if(tokens.length>=5 && tokens[0].toUpperCase()==="ROTATE")
		{
			var i=new WebGLInstruction(this);
			i.rotate(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]), parseFloat(tokens[4]));
			this.instructions[this.instructions.length]=i;
		}
		else if(tokens.length>=1 && tokens[0].toUpperCase()==="PUSHMATRIX")
		{
			var i=new WebGLInstruction(this);
			i.pushMatrix();
			this.instructions[this.instructions.length]=i;
		}
		else if(tokens.length>=1 && tokens[0].toUpperCase()==="POPMATRIX")
		{
			var i=new WebGLInstruction(this);
			i.popMatrix();
			this.instructions[this.instructions.length]=i;
		}
		else if(tokens.length>=2 && tokens[0].toUpperCase()==="BEGIN")
		{
			var i=new WebGLInstruction(this);
			i.begin(this.getKeywordID(tokens[1]));
			this.instructions[this.instructions.length]=i;
			this.mem_begin=i.vali[0];
			this.mem_xyz=new Array();
			//this.mem_clr=new Array();
			this.mem_uv=new Array();
		}
		else if(tokens.length>=1 && tokens[0].toUpperCase()==="END")
		{
			var i=new WebGLInstruction(this);
			var obj=new WebGLObject(this.canvas);
			obj.setShader(this._shader);
			if(this.mem_begin==gl.TRIANGLES)
			{
				obj.setXYZ(this.mem_xyz);
				var s=this.mem_xyz.length/3;
				var mem_tri=new Uint16Array(s);
				for(j=0;j<s;j++)mem_tri[j]=j;
				obj.setTriangles(mem_tri);
				obj.setUV(this.mem_uv);
			}
			else if(this.mem_begin==="QUADS")
			{
				obj.setXYZ(this.mem_xyz);
				var s=this.mem_xyz.length/12;
				var mem_tri=new Uint16Array(s*6);
				for(j=0;j<s;j++)
				{
					mem_tri[j*6]=j*4;
					mem_tri[j*6+1]=j*4+1;
					mem_tri[j*6+2]=j*4+2;
					mem_tri[j*6+3]=j*4;
					mem_tri[j*6+4]=j*4+2;
					mem_tri[j*6+5]=j*4+3;
				}
				obj.setTriangles(mem_tri);
				obj.setUV(this.mem_uv);
			}
			i.end(obj);
			this.instructions[this.instructions.length]=i;
		}
		else if(tokens.length>=2 && tokens[0].toUpperCase()==="ENABLE")
		{
			var i=new WebGLInstruction(this);
			i.enable(this.getKeywordID(tokens[1]));
			if(i.vali[0]=="TEXTURES")
			{}
			else
			this.instructions[this.instructions.length]=i;
		}
		else if(tokens.length>=2 && tokens[0].toUpperCase()==="DISABLE")
		{
			var i=new WebGLInstruction(this);
			i.disable(this.getKeywordID(tokens[1]));
			if(i.vali[0]=="TEXTURES")
			{}
			else
			this.instructions[this.instructions.length]=i;
		}
		else if(tokens.length>=4 && tokens[0].toUpperCase()==="VERTEX")
		{
			var i=new WebGLInstruction(this);
			i.vertex(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]));
			this.instructions[this.instructions.length]=i;
			this.mem_xyz[this.mem_xyz.length]=i.valf[0];
			this.mem_xyz[this.mem_xyz.length]=i.valf[1];
			this.mem_xyz[this.mem_xyz.length]=i.valf[2];
		}
		else if(tokens.length>=3 && tokens[0].toUpperCase()==="TEXCOORD")
		{
			var i=new WebGLInstruction(this);
			i.texcoord(parseFloat(tokens[1]), parseFloat(tokens[2]));
			this.instructions[this.instructions.length]=i;
			this.mem_uv[this.mem_uv.length]=i.valf[0];
			this.mem_uv[this.mem_uv.length]=i.valf[1];
		}
		else if(tokens.length>=4 && tokens[0].toUpperCase()==="COLOR")
		{
			var i=new WebGLInstruction(this);
			i.color(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]));
			this.instructions[this.instructions.length]=i;
			//this.mem_clr[this.mem_clr.length]=i.valf[0];
			//this.mem_clr[this.mem_clr.length]=i.valf[1];
			//this.mem_clr[this.mem_clr.length]=i.valf[2];
		}
		else if(tokens.length>=2 && tokens[0].toUpperCase()==="BINDTEXTURE")
		{
			var i=new WebGLInstruction(this);
			i.bindTexture(this.getTextureByName(tokens[1]));
			this.instructions[this.instructions.length]=i;
		}
		else if(tokens.length>=3 && tokens[0].toUpperCase()==="TEXTURE")
		{
			var t=new WebGLTexture(this.canvas,tokens[1]);
			t.load(this.filename+"/"+tokens[2]);
			this.textures[this.textures.length]=t;
		}
		else if(tokens.length>=3 && tokens[0].toUpperCase()==="ALPHATEXTURE")
		{
			var t=new WebGLTexture(this.canvas,tokens[1]);
			t.load(this.filename+"/"+tokens[2]);
			this.textures[this.textures.length]=t;
		}
		else if(tokens.length>=5 && tokens[0].toUpperCase()==="RECTANGLE")
		{
			var i=new WebGLInstruction(this);
			i.rectange(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]), parseFloat(tokens[4]));
			this.instructions[this.instructions.length]=i;
		}
		else if(tokens.length>=3 && tokens[0].toUpperCase()==="RECTANGLE")
		{
			var i=new WebGLInstruction(this);
			i.rectange(parseFloat(tokens[1]), parseFloat(tokens[2]), 1,1);
			this.instructions[this.instructions.length]=i;
		}
		else if(tokens.length>=4 && tokens[0].toUpperCase()==="CLEARCOLOR")
		{
			var i=new WebGLInstruction(this);
			i.clearColor(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]));
			this.instructions[this.instructions.length]=i;
		}
	}
	this.loaded=true;
	this.canvas.updatePickingMap();
}

WebGLImageComposition.prototype.draw=function()
{
	if(this.loaded==false)return;
    mat4.set(this.canvas.camera.mvMatrix,this.mvMatrix);
	
	//this.gl.useProgram(this.shaderProgram);
	//this.gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, this.canvas.camera.pMatrix);
	//this.gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, this.mvMatrix);
	var s=this.getShader();
	
	s.updateProjection();
	s.setModelView(this.mvMatrix);
	
	for(i=0;i<this.instructions.length;i++)
		this.instructions[i].execute();
}
