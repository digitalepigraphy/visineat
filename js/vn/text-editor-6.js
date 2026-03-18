/* V6
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
 
/**
 * This class is used to process the incoming stream of text from the text editor, and should should be used with VNTextEditor, VNLineEditor, and VNTokenEditor.
 **/
function VNTextEditorTokenizer()
{
  this._key_p=new VNPromise(this);
  this._key_p.allowRecursion(true);
  this._token_p=new VNPromise(this);
  this._token_p.allowRecursion(true);
  this._token_r_p=new VNPromise(this);
  this._line_p=new VNPromise(this);
  this._token2_p=new VNPromise(this);
  this._line2_p=new VNPromise(this);
  this._remove_highlighted_p=new VNPromise(this);
  this._cancel=false;
  
  this.whenTokenEditStarts().then(function(t){t.whenTokenEditStarts().callThen();});
  this.whenTokenEditEnds().then(function(t){t.whenTokenEditEnds().callThen();});
  this.whenTokenRemoved().then(function(t){t.whenTokenRemoved().callThen();});
}

/**
 * This method cancels a key stroke when used inside the whenKeyDown() callback. 
 **/
VNTextEditorTokenizer.prototype.cancel=function(){this._cancel=true;};

/**
* Returns a promise when the user presses down a key. The promise calls are provided with an input object with the fields: newChar, textBefore, editor, line, token, input, and event.
* @return VNPromise A promise object that is triggered every time the user presses a key. 
 **/
VNTextEditorTokenizer.prototype.whenKeyDown=function(){return this._key_p;};

/**
* Returns a promise when a token is no longer being edited. The promise calls are provided with the VNTokenEditor object of interest.
* @return VNPromise A promise object that is triggered when a token is no longer being edited.
**/
VNTextEditorTokenizer.prototype.whenTokenEditEnds=function(){return this._token_p;};

/**
* Returns a promise when a token is removed.
* @return VNPromise A promise object associated with this event.
**/
VNTextEditorTokenizer.prototype.whenTokenRemoved=function(){return this._token_r_p;};


/**
* Returns a promise when a line is no longer being edited. The promise calls are provided with the VNLineEditor object of interest.
* @return VNPromise A promise object that is triggered when a line is no longer being edited.
**/
VNTextEditorTokenizer.prototype.whenLineEditEnds=function(){return this._line_p;};

/**
* Returns a promise when a token starts to be in edit mode. The promise calls are provided with the VNTokenEditor object of interest.
* @return VNPromise A promise object that is triggered when a token starts to be in edit mode. 
*/
VNTextEditorTokenizer.prototype.whenTokenEditStarts=function(){return this._token2_p;};

/**
 * Returns a promise when a line starts to be in edit mode. The promise calls are provided with the VNLineEditor object of interest.
 * @return VNPromise A promise object that is triggered when a line starts to be in edit mode. 
 **/
VNTextEditorTokenizer.prototype.whenLineEditStarts=function(){return this._line2_p;};

VNTextEditorTokenizer.prototype.whenHighlightedRemoved=function(){return this._remove_highlighted_p;};

VNTextEditorTokenizer.prototype.getText=function(editor)
{
	var s='';
	if(editor.lines.length>0)
		s+=editor.lines[0].getText();
	for(var i=1;i<editor.lines.length;i++)
		s+="\n"+editor.lines[i].getText();
	return s;
};

VNTextEditorTokenizer.prototype.getHighlightedText=function(editor)
{
	if(!editor.isHighlighted())return '';
	var s='';
	
	var t=editor.getHighlightedEnds();
	var t1=t.start;
	var t2=t.end;
	if(t1.line.order>t2.line.order || ((t1.line.order==t2.line.order)&&(t1.order>t2.order)))
	{
		var tmp=t1;
		t1=t2;
		t2=tmp;
	}
	
	var prev=null;
	var t=t1;
	while(t!=null)
	{
		if(prev)
		{
			if(prev.line!=t.line)
			{
				for(var i=0;i<t.line.order-prev.line.order;i++)
					s+="\n";
				for(var i=0;i<t.line.left_tabs;i++)
					s+="\t";
			}
			else s+=" ";
		}
		s+=t.getText();
		if(t==t2)t=null;
		else
		{
			prev=t;
			t=t.getNextToken();
		}
	}
	return s;
};

function VNTextEditorDefaultSkin()
{
	var s=this;
	s['name']='Classic Bright';
	s['icon']='js/img/Basicexample.png';
	s['backgroundColor']='white';
	s['scopeBackgroundColor1']='rgb(250,250,255)';
	s['scopeBackgroundColor0']='white';
	s['scopeBackgroundColor2']='rgb(250,255,250)';
	s['scopeBackgroundColor3']='rgb(255,250,250)';
	s['scopeLineColor1']='#0000AA';//'#AAAAAA';
	s['scopeLineColor0']='#AAAAAA';
	s['scopeLineColor2']='#00AA00';
	s['scopeLineColor3']='#AA0000';
	s['editBackgroundColor']='rgb(240,240,255)';
	s['defaultTextColor']='black';
	s['highlightColor']='#FFFF00';
	s['tokenRenderer']=new VNTokenRenderer();
	/*s['tokenRenderer']=new JavaScriptClassicBrightRenderer();
	var r=s['tokenRenderer'];
	r['{']=function(t)
	{
		if(t.scope)
		{
			var w=t.scope.depth;
			if(w%4==0)t.setStyle({color:s.scopeLineColor0});
			else if(w%4==1)t.setStyle({color:s.scopeLineColor1});
			else if(w%4==2)t.setStyle({color:s.scopeLineColor2});
			else if(w%4==3)t.setStyle({color:s.scopeLineColor3});
		}			
	};
	r['}']=function(t)
	{
		if(t.scope)
		{
			var w=t.scope.depth+1;
			if(w%4==0)t.setStyle({color:s.scopeLineColor0});
			else if(w%4==1)t.setStyle({color:s.scopeLineColor1});
			else if(w%4==2)t.setStyle({color:s.scopeLineColor2});
			else if(w%4==3)t.setStyle({color:s.scopeLineColor3});
		}			
	};*/
}

/**
 * This class creates and controls a text editor.  
 * The text editor will take in user input, and allow the user to view and modify the text.  
 * Upon the creation of an instance, it will initialize the first line of the text editor and apply preset styles to its div container. 
 **/
function VNTextEditor()
{ 
  this.skin=new VNTextEditorDefaultSkin();
  this.default_height=20;
  this.newCharPos=0;
  this.edit_mode=true;
  //CREATE THE TEXT AREA
  this.text_input=document.createElement('input');
  vn.set(this.text_input.style,{position:'inline',verticalAlign:'middle',height:this.default_height+'px',lineHeight:this.default_height+'px',padding:'0px',border:'0px',fontFamily:'"Courier New", Courier, monospace',fontSize:'14px',width:'150px',outline:'none',boxSizing:'content-box',background:'rgba(0,0,0,0)',color:this.skin.defaultTextColor,webkitAppearance:'none'});
  this.text_input.setAttribute( "autocomplete", "off" );
  this.text_input.setAttribute( "autocorrect", "off" );
  this.text_input.setAttribute( "autocapitalize", "off" );
  this.text_input.setAttribute( "spellcheck", "false" );
  this.text_input.ondrop=function(e){e.preventDefault();};
  var self=this;
  
  this.text_input.onpaste=function(e){
	 var clipboardData, pastedData;

    e.stopPropagation();
    e.preventDefault();

    clipboardData = e.clipboardData || window.clipboardData;
    pastedData = clipboardData.getData('Text');

	var s="";
	var et=self.editing_line.editing_token;
	var t=et.getNextToken();
	for(;t!=null && t.line==et.line;)
	{
		var tt=t;
		t=t.getNextToken();
		s+=" "+tt.getText();
		tt.remove();
	}
	
	if(self.text_input.selectionStart<self.text_input.value.length)
	{
		var s1=self.text_input.value.substring(0,self.text_input.selectionStart);
		var s2=self.text_input.value.substring(self.text_input.selectionStart);
		self.editing_line.editing_token.setText(s1);
		self.text_input.value=s1;
		self.typeAsync(pastedData+s2+s);
	}
	else self.typeAsync(pastedData+s);
  };
  
  /*this.text_input.addEventListener('keydown',function(e){
    if (!e) e = window.event;
    var keyCode = e.keyCode || e.which;
    if(self.control_keys[keyCode])
      self.text_input.style.width=(9*(self.text_input.value.length+1))+'px';
    else self.text_input.style.width=(9*(self.text_input.value.length+2))+'px';
  },false);*/
  
  this._key_p=new VNPromise(); 
  this._over_t=new VNPromise();
  this._over_l=new VNPromise();
  this.tokenizer=new VNTextEditorTokenizer();

  this.tokenizer.whenKeyDown().then(function(e){
	  
	//console.log(e.newChar);
	if (e.newChar == "Enter"){//enter
      e.token.breakLine();
    }
    else if(e.newChar ==32 || e.newChar == "Tab"){//space
      var part2="";
      if(e.newCharPosition<e.input.value.length)
      {
        part2=e.input.value.substring(e.newCharPosition,e.input.value.length);
        if(e.newCharPosition>0)
          e.input.value=e.input.value.substring(0,e.newCharPosition);
        else {e.input.value='';}
      }
      var t=e.line.insertTokenAt(e.token.order+1);
      if(part2.length>0)
      {
        t.setText(part2);
        t.switchToEditView();
        e.editor.setNewCharPosition(0);
      }
      else t.switchToEditView();
      self.tokenizer.cancel();
    }
    else if(e.newChar == "ArrowUp")//up
    {
		if(e.line.getPreviousLine())
		{
			e.line.editPreviousLine();
		}
		else
		{
			var t=e.line.tokens[0];
			t.switchToEditView();
			e.editor.setNewCharPosition(0);
		}
		self.tokenizer.cancel();//otherwise the carret will be moved by the system
			
    }
    else if(e.newChar == "ArrowDown")//down
    {
		if(e.line.getNextLine())
		{
			e.line.editNextLine();
		}
		else
		{
			var t=e.line.tokens[e.line.tokens.length-1];
			t.switchToEditView();
			e.editor.setNewCharPosition(e.textBefore.length);
		}
		self.tokenizer.cancel();//otherwise the carret will be moved by the system
    }
    else if(e.newChar == "PageUp")//page up
    {
      e.line.editPrevious20Line();
    }
    else if(e.newChar == "PageDown")//page down
    {
      e.line.editNext20Line();
    }
    else if(e.newChar == "ArrowRight") //right
    {
      if(e.newCharPosition==e.input.value.length)
      {
        e.token.editNextToken();
        self.tokenizer.cancel();
      }
    }
    else if(e.newChar=="ArrowLeft")//left
    {
      if(e.newCharPosition==0)
      {
        e.token.editPreviousToken();
        self.tokenizer.cancel();
      }
    }
	else if(e.newChar=="Backspace")
	{
	  if(e.newCharPosition==0)
      {
		  if(e.token.order==1)//first token in a line
		  {
			e.line.removeBreak();
		  }
		  else
		  {
			var t=e.token.getPreviousToken();
			var txt=e.token.getText();
			e.line.removeTokenAt(e.token.order);
			t.switchToEditView();
			var txt1=t.getText();
			t.setText(txt1+txt);
			e.editor.setNewCharPosition(txt1.length);
		  }
		  self.tokenizer.cancel();
      }
	}
  });
  
  this.div_container=null;
  this.editing_line=null;
  this.lines=new Array();
  this.init();
  this.control_keys={'8':"Backspace",'9':"Tab",'10':"Enter",'13':"Enter",'33':"PageUp",'34':"PageDown",'37':"ArrowLeft",'38':"ArrowUp",'39':"ArrowRight",'40':"ArrowDown",'46':"Delete"};
}

VNTextEditor.prototype.setScale=function(s){
	
	vn.set(this.getDiv().style, {transformOrigin:'left top', transform:'scale('+s+')', width:Math.round(100/s)+'%', height:Math.round(100/s)+'%'}) ;
};

VNTextEditor.prototype.clearHighlighting=function()
{
	var t=this.getHighlightedEnds();
	if(t)
	{
	var t1=t.start;
	var t2=t.end;
	if(t1 && t1.line && t2 && t2.line)
	{
		if(t1.line.order>t2.line.order || ((t1.line.order==t2.line.order)&&(t1.order>t2.order)))
		{
			var tmp=t1;
			t1=t2;
			t2=tmp;
		}
		
		var t=t1;
		while(t!=null)
		{
			t.setHighlighted(false);
			if(t==t2)t=null;
			else t=t.getNextToken();
		}
	}
	}
}

VNTextEditor.prototype.startHighlighting=function(options)
{
	var opt=options||{};
	if(opt.token || opt.line_end || opt.line_start){}
	else return;
	
	this.clearHighlighting();
	
	this._start_highlighting=options;
	this._stop_highlighting=options;
	this._started_highlighting=true;
	
	var self=this;
	var on_m_u=function(e){
		self.stopHighlighting();
		document.removeEventListener('mouseup',on_m_u,true);
		if(!self.isHighlighted())
		  {
			if(opt.token)opt.token.switchToEditView();
			else if(opt.line_end){opt.line_end.switchToEditView();opt.line_end.tokens[opt.line_end.tokens.length-1].switchToEditView();self.setNewCharPosition(self.getInput().value.length);}
			else if(opt.line_start){opt.line_start.switchToEditView();opt.line_start.tokens[0].switchToEditView();self.setNewCharPosition(0);}
			
			/*if(opt.line_clicked)
			{
				opt.line_clicked.switchToEditView();
				opt.line_clicked.tokens[opt.line_clicked.tokens.length-1].switchToEditView();
			}
			else self.switchToEditView();
			
			if(opt.white_indent)
				te.setNewCharPosition(0);
			else if(opt.outside)te.setNewCharPosition(te.getInput().value.length);*/
		  }
		e.stopPropagation();
	};
	
	document.addEventListener('mouseup',on_m_u,true);
	
};

VNTextEditor.prototype.stopHighlighting=function()
{
	this._started_highlighting=false;
		
	if(!this.isHighlighted())return;
		
	function copyTextToClipboard(text) {
  var textArea = document.createElement("textarea");

  //
  // *** This styling is an extra step which is likely not required. ***
  //
  // Why is it here? To ensure:
  // 1. the element is able to have focus and selection.
  // 2. if element was to flash render it has minimal visual impact.
  // 3. less flakyness with selection and copying which **might** occur if
  //    the textarea element is not visible.
  //
  // The likelihood is the element won't even render, not even a flash,
  // so some of these are just precautions. However in IE the element
  // is visible whilst the popup box asking the user for permission for
  // the web page to copy to the clipboard.
  //

  // Place in top-left corner of screen regardless of scroll position.
  textArea.style.position = 'fixed';
  textArea.style.top = 0;
  textArea.style.left = 0;

  // Ensure it has a small width and height. Setting to 1px / 1em
  // doesn't work as this gives a negative w/h on some browsers.
  textArea.style.width = '2em';
  textArea.style.height = '2em';

  // We don't need padding, reducing the size if it does flash render.
  textArea.style.padding = 0;

  // Clean up any borders.
  textArea.style.border = 'none';
  textArea.style.outline = 'none';
  textArea.style.boxShadow = 'none';

  // Avoid flash of white box if rendered for any reason.
  textArea.style.background = 'transparent';


  textArea.value = text;

  document.body.appendChild(textArea);

  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    //console.log('Copying text command was ' + msg);
  } catch (err) {
    console.log('Oops, unable to copy');
  }

  document.body.removeChild(textArea);
}

copyTextToClipboard(this.getHighlightedText());
	vn.getWindowManager().createNotification('Text copied.' , { background : 'rgb(128,98,165)' } ) ;
	
	var self=this;
	var k_d=function(e){//only for control keys
		if (!e) e = window.event;		  
		var keyCode = e.keyCode || e.which;
		if(keyCode==8)
		{
			self.removeHighlightedTokens();
		}
		self.clearHighlighting();
		e.preventDefault();
		document.removeEventListener('keydown',k_d,true);
	};
	
	document.addEventListener('keydown',k_d,true);
	
	
	var m_d=function(e){
		self.clearHighlighting();
		self._start_highlighting=null;
		e.preventDefault();
		document.removeEventListener('mousedown',m_d,true);
	};
	document.addEventListener('mousedown',m_d,true);
	
};

VNTextEditor.prototype.updateHighlighting=function(options)
{
	if(this._started_highlighting==true){}else return;
	if(typeof this._start_highlighting==='undefined')return;
	
	//This code scrolls the editor when the cursor is close to the top or bottom while user selecting text
	var e=options.event;
	var rect = this.div_master_container.getBoundingClientRect();
	if(e.clientY-rect.top<20)this.div_master_container.scrollTop-=20;
	else if(rect.bottom-e.clientY<20)this.div_master_container.scrollTop+=20;
	
	var t=this.getHighlightedEnds();
	var o1=t.start;
	var o2=t.end;
	
	var t=this.getHighlightedEnds(options);
	var t1=t.start;
	var t2=t.end;
	
	if(t1==o2 && t2==o2)return;
	
	this.clearHighlighting();
	
	this._stop_highlighting=options;
	if(t1 == t2)return;		
	if(t1 && t2)
	{
		if(t1.line.order>t2.line.order || ((t1.line.order==t2.line.order)&&(t1.order>t2.order)))
		{
			var tmp=t1;
			t1=t2;
			t2=tmp;
		}
		
		var t=t1;
		while(t!=null)
		{
			t.setHighlighted(true);
			if(t==t2)t=null;
			else t=t.getNextToken();
		}
	}	
};

VNTextEditor.prototype.getHighlightedEnds=function(options)
{
	if(this._start_highlighting && this._stop_highlighting){}else return null;
	var t1=this._start_highlighting;
	var t2=options||this._stop_highlighting;
	if(t1.token && t2.token)
	{
		if(t1.token.line && t2.token.line)
		{
			if(t1.token.line.order>t2.token.line.order || ((t1.token.line.order==t2.token.line.order)&&(t1.token.order>t2.token.order)))
			{
				var tmp=t1;
				t1=t2;
				t2=tmp;
			}
		}else return null;
	}
	else if(t1.token)//t2 line
	{
		if(t1.token.line)
		{
			var line=t2.line_end || t2.line_start;
			if(t1.token.line.order>line.order || (t1.token.line.order==line.order && t2.line_start))
			{
				var tmp=t1;
				t1=t2;
				t2=tmp;
			}
		}else return null;
	}
	else if(t2.token)//t1 line
	{
		if(t2.token.line)
		{
			var line=t1.line_end || t1.line_start;
			if(t2.token.line.order<line.order || (t2.token.line.order==line.order && t1.line_end))
			{
				var tmp=t1;
				t1=t2;
				t2=tmp;
			}
		}else return null;
	}
	else //both lines
	{
		var line1=t1.line_end || t1.line_start;
		var line2=t2.line_end || t2.line_start;
		if(line1.order>line2.order || (line1.order==line2.order && t1.line_end && t2.line_start))
		{
			var tmp=t1;
			t1=t2;
			t2=tmp;
		}
		if(t1.line_end&&t2.line_end&&t1.line_end==t2.line_end)return {start:null,end:null};
		if(t1.line_start&&t2.line_start&&t1.line_start==t2.line_start)return {start:null,end:null};
	}
	
	var r1=null;
	var r2=null;
	
	if(t1.token)r1=t1.token;
	else if(t1.line_start)
	{
		var l=t1.line_start;
		if(l.tokens.length==0)
		{
			var l=l.getNextLine();
			for(;l!=null && l.tokens.length==0;l=l.getNextLine());
			if(l)r1=l.tokens[0];
		}
		else r1=l.tokens[0];
	}
	else if(t1.line_end)
	{
		var l=t1.line_end;
		var l=l.getNextLine();
		for(;l!=null && l.tokens.length==0;l=l.getNextLine());
		if(l) r1=l.tokens[0];
		
	}
	
	if(t2.token)r2=t2.token;
	else if(t2.line_start)
	{
		var l=t2.line_start;
		var l=l.getPreviousLine();
		for(;l!=null && l.tokens.length==0;l=l.getPreviousLine());
		if(l)r2=l.tokens[l.tokens.length-1];
	}
	else if(t2.line_end)
	{
		var l=t2.line_end;
		if(l.tokens.length>0)r2=l.tokens[l.tokens.length-1];
		else
		{
			var l=l.getPreviousLine();
			for(;l!=null && l.tokens.length==0;l=l.getPreviousLine());
			if(l) r2=l.tokens[l.tokens.length-1];
		}
	}
	
	return {start:r1,end:r2};
};


VNTextEditor.prototype.isHighlighted=function()
{
	if(this._start_highlighting)
	{
		var t=this.getHighlightedEnds();
		if(t.start && t.end && t.start!=t.end)return true;
		else return false;
	}
	else return false;
};

/**
 * Returns the highlighted text as a string. 
 * @return string The highlighted text.
 **/
VNTextEditor.prototype.getHighlightedText=function()
{
	return this.getTokenizer().getHighlightedText(this);
};


VNTextEditor.prototype.removeHighlightedTokens=function()
{
	if(!this.isHighlighted())return;

	var t=this.getHighlightedEnds();
	var t1=t.start;
	var t2=t.end;
	if(t1.line.order>t2.line.order || ((t1.line.order==t2.line.order)&&(t1.order>t2.order)))
	{
		var tmp=t1;
		t1=t2;
		t2=tmp;
	}
	var before=t1.getPreviousToken();
	var beforebefore=null;
	if(before!=null)beforebefore=before.getPreviousToken();
	var after=t2.getNextToken();
	var prev=null;
	var t=t1;
	while(t!=null)
	{
		if(t==t2)
		{
			t.remove();
			t=null;
		}
		else
		{
			prev=t;
			t=t.getNextToken();
			while(prev.line.order<t.line.order)
				t.line.removeBreak();
			prev.remove();
		}
	}
	
	this._start_highlighting=null;
	
	if(before!=null && before.line==null)//if the previous token was empty and therefore deleted.
		before=beforebefore;
	
	if(before==null)//if there is no previous token
	{
		if(this.lines[0].tokens.length>0)
			before=this.lines[0].insertTokenAt(1);
		else
			before=this.lines[0].appendToken();
	}
	
	before.switchToEditView();
	var p=this.tokenizer.whenHighlightedRemoved();
	p.setObject(before);
	p.callThen();
	return;
};

/**
* Returns a promise when the user presses down a key. The promise calls are provided with an input object with the fields: newChar, textBefore, editor, line, token, input, and event.
* @return VNPromise A promise object that is triggered every time the user presses a key. 
 **/
VNTextEditor.prototype.whenKeyDown=function(){return this._key_p;};

/**
* Returns a promise when the user moves the mouse over a token.
* @return VNPromise A promise object associated with this event. 
**/
VNTextEditor.prototype.whenMouseOverToken=function(){return this._over_t;};

/**
* Returns a promise when the user moves the mouse over a line.
* @return VNPromise A promise object associated with this event. 
**/
VNTextEditor.prototype.whenMouseOverLine=function(){return this._over_l;};


/**
 * Returns boolean specifying whether or not this text editor is in edit mode.
 * @return Boolean The edit mode status.
 **/
VNTextEditor.prototype.isInEditMode=function()
{
  return this.edit_mode;
};

/**
 * Switches this text editor to edit mode.
 **/
VNTextEditor.prototype.switchToEditView=function()
{
  this.edit_mode=true;
};

/**
 * Switches this text editor to rigid mode.
 **/
VNTextEditor.prototype.switchToRigidView=function()
{
  this.edit_mode=false;
};

/**
 * This method returns the current skin object of this editor, which contains all the color and rendering settings.
 * @return Object The current skin object.
 */
VNTextEditor.prototype.getSkin=function(){return this.skin;};

/**
 * This method sets a new skin to this editor, with all the color and rendering settings.
 * @param skin The new skin object.
 */
VNTextEditor.prototype.setSkin=function(skin){
	this.skin=skin;
	vn.set(this.text_input.style,{background:'rgba(0,0,0,0)'/*this.skin.editBackgroundColor*/,color:this.skin.defaultTextColor});
    this.div_master_container.style.backgroundColor=this.skin.backgroundColor;
	
	var s=this.getText();
	this.clear();
	this.type(s);
};

/**
 * Returns the input HTML element of the text editor. 
 * This element is placed inside the current token being edited. 
 * @return Element The input HTML element of the text editor.  
 **/
VNTextEditor.prototype.getInput=function()
{
  return this.text_input;
};

/**
 * Returns the text of the text editor as a string. 
 * @return string The text of this text editor.
 */
VNTextEditor.prototype.getText=function()
{
	return this.getTokenizer().getText(this);
};

/**
 * Returns the total number of tokens.
 * @return number The total number of tokens.
 */
VNTextEditor.prototype.getNumberOfTokens=function()
{
	var n=0;
	for(var i=this.lines.length-1;i>=0;i--)
		n+=this.lines[i].tokens.length;
	return n;
};


/**
 * Returns the total number of active tokens, i.e. all tokens except from comments, braces, parenthesis, brackets, and semicolons.
 * @return number The total number of active tokens.
 */
VNTextEditor.prototype.getNumberOfActiveTokens=function()
{
	var n=0;
	var exclude={';':true,'{':true,'}':true,'(':true,')':true,'[':true,']':true,'//':true,'//t':true,'/*':true,'/*t':true,'*/':true,'"':true,'"':true};
	for(var i=this.lines.length-1;i>=0;i--)
	{
		var l=this.lines[i].tokens;
		for(var j=l.length-1;j>=0;j--)	
		{
			var t=l[j];
			if(t.info)
			{
				if(t.info)
				{
					if(exclude[t.info]){}
					else n++;
				}
			}
		}
	}
	return n;
};

VNTextEditor.prototype.onkeydown=function(e)
{
  var _p=this.whenKeyDown();
  _p.setObject(e);
  _p.callThen();
	
  var keyCode = e.newChar;
  var t=this.tokenizer;
  t._cancel=false;
  var p=t.whenKeyDown();
  p.setObject(e);
  
    if (keyCode == "Enter"){//enter
      /*if(this.text_input.value.length==0)//allow blank lines
      {
        this.editor.createLineAt(this.getOrder()+1);
      return false;
      } 
      else*/
      {
        p.callThen();
      if(t._cancel)return false;
      }
    
    }
  else if (keyCode == "Tab"){//tab
    p.callThen();
    if(t._cancel)return false;
    }
    else if(keyCode == "Backspace"){//back space
		p.callThen();
		if(t._cancel)return false;
    }
  else if(keyCode == "ArrowRight") //right
  {
    p.callThen();
    if(t._cancel)return false;
  }
  else if(keyCode=="ArrowLeft")//left
  {
    p.callThen();
    if(t._cancel)return false;
  }
    else if(keyCode == "ArrowUp"){//up
      p.callThen();
    if(t._cancel)return false;
    }
    else if(keyCode == "ArrowDown"){//down
      p.callThen();
    if(t._cancel)return false;
    }
    else if(keyCode == "PageUp"){//page up
      if(e.line.order>1)
      {
        if(e.input.value.length==0)//allow to move up without typing a new token
          {
          e.line.editPrevious20Line();
          } 
        else
      {
        p.callThen();
      }
      return false;
      }
    }
    else if(keyCode == "PageDown"){//page down
      if(e.line.order<e.editor.lines.length)
      {
        if(e.input.value.length==0)//allow to move down without typing a new token
          {
          e.line.editNext20Line();
          } 
        else
      {
        p.callThen();
      }
      return false;
      }
    }
    else
    {
    p.callThen();
    if(t._cancel)return false;
    }
};

VNTextEditor.prototype.setNewCharPosition=function(pos)
{
	this.newCharPos=pos;
	if(!this.edit_mode)return;
	var inp=this.getInput();
    inp.selectionStart=pos;
    inp.selectionEnd=pos;
};

VNTextEditor.prototype.getNewCharPosition=function()
{
	return this.newCharPos;
};

/**
 * This method simulates the pressing of a sequence of keys, and adds the respective characters to the text editor.
 * @param text A string with the text to be typed.
 * @param Event An optional keyType event if this type is caused by a keyboard-driven action. 
 **/
VNTextEditor.prototype.type=function(text,event)
{
  var mem_mode=this.edit_mode;
  if(typeof event==='undefined')
	  this.edit_mode=false;
  
  for(var i=0;i<text.length;i++)
  {
    this.typeChar(text.charCodeAt(i),event);
  }
  
  if(typeof event==='undefined')
	  this.edit_mode=mem_mode;
  
};

/**
 * This method simulates the pressing of a sequence of keys, and adds the respective characters to the text editor, asynchronously, i.e. without freezing the GUI. 
 * @param text A string with the text to be typed.
 * @param Event An optional keyType event if this type is caused by a keyboard-driven action. 
 **/
VNTextEditor.prototype.typeAsync=function(text,event)
{
  var mem_mode=this.edit_mode;
  if(typeof event==='undefined')
	  this.edit_mode=false;
  
  var self=this;
  
  this.progress.oneMoreToDo(text.length);
  
  var i=0;
  var step=function(){
		var c=0;
		for(;c<50 && i<text.length;i++,c++)
		{
			self.typeChar(text.charCodeAt(i),event);
		}
		self.progress.oneMoreDone(c);
		if(i<text.length)
		{
			vn.wait({seconds:0}).then(step);
		}
		else
		{
			if(typeof event==='undefined')
			self.edit_mode=mem_mode;
		}
	};
	
  vn.wait({seconds:0}).then(step);
  
};



/**
 * This method simulates the pressing of a key, and adds the respective character to the text editor. This method assumes that the caret is at the end of the input element, therefore it cannot be used to insert characters in the middle of the input string.
 * @param charCode An integer that represents a character in Unicode. 
 * @param Event An optional keyType event if this type is caused by a keyboard-driven action. 
 **/
VNTextEditor.prototype.typeChar=function(charCode,event)
{
  if(charCode==0){return;}//to avoid '0' bytes from a file that was written in utf-16 but the browser opened it as utf-8
	  
  var mem=this.getTokenizer()._cancel;
  
  if(this.editing_line==null)
    this.lines[this.lines.length-1].switchToEditView();
  var inp=this.getInput();
  this.setNewCharPosition(inp.value.length);
  var cc=charCode;
  if(charCode==10)cc="Enter";
  else if(charCode==9)cc="Tab";
  var v=this.onkeydown({event:event, newChar:cc, textBefore:inp.value, editor:this, line:this.editing_line, token:this.editing_line.editing_token,input:inp,newCharPosition:this.newCharPos});
  if(v===false){}else 
  {
    this.editing_line.editing_token.setText(inp.value+String.fromCharCode(charCode));
	this.setNewCharPosition(inp.value.length);
  }
  this.getTokenizer()._cancel=mem;
};

/**
 * Sets the tokenizer and clears the contents of the text editor.
 * @param t A VNTextEditorTokenizer object that keeps track of the incoming stream of text.
 **/
VNTextEditor.prototype.setTokenizer=function(t){this.tokenizer=t;this.clear();};

/**
 * Returns the text editor's tokenizer.
 * @return VNTextEditorTokenizer A VNTextEditorTokenizer object that keeps track of the incoming stream of text.
 **/
VNTextEditor.prototype.getTokenizer=function(){return this.tokenizer;};

VNTextEditor.prototype.init=function()
{
  this.div_out_master_container=document.createElement('div');
  this.div_out_master_container.style.position='relative';
  this.div_out_master_container.style.height='100%';
  this.div_out_master_container.style.width='100%';
  this.div_out_master_container.style.overflow='hidden';
 
  this.div_master_container=document.createElement('div');
  this.div_master_container.style.position='relative';
  this.div_master_container.style.height='100%';
  this.div_master_container.style.width='100%';
  this.div_master_container.style.backgroundColor=this.skin.backgroundColor;
  this.div_master_container.style.overflowX='hidden';
  this.div_master_container.style.overflowY='auto';
  this.div_master_container.style.cursor='text';
  this.div_out_master_container.appendChild(this.div_master_container); 
 
  this.div_container=document.createElement('div');
  this.div_container.style.minHeight='100%';
  this.div_master_container.appendChild(this.div_container);
  
  this.line_nums=document.createElement('div');
  vn.set(this.line_nums.style,{position:'absolute',top:'0px',left:'0px',width:'50px',height:'100%',background:'rgb(220,220,220)'});
  this.div_container.appendChild(this.line_nums);
  
  this.line_container=document.createElement('div');
  vn.set(this.line_container.style,{position:'relative',width:'100%',height:'auto',backgroundColor:'rgb(255,255,255)'});
  this.div_container.appendChild(this.line_container);
  this.lines[0]=new VNLineEditor(this);
  
  var self=this;
  //this.div_container.onmouseup=function(e){if(e.target==self.div_container)self.onOutsideClick(e);};
  
  this.div_container.onmousedown=function(e){
	if(e.target==self.div_container)
	{
		self.startHighlighting({line_end:self.getLastLine()});
		/*var t=self.getLastToken();
		if(t)t.startHighlighting({outside:true,line_clicked:self.getLastLine()});
		else 
		{
			self.clearHighlighting();
			self.getLastLine().switchToEditView();
			e.preventDefault();//In order to prevent focusing on the div. We need the focus to remain on the InputElement.
		}*/
	}
  };
  this.div_container.onmousemove=function(e){
	if(e.target==self.div_container)
	{
		self.updateHighlighting({line_end:self.getLastLine(),event:e});
	}
  };
  
  this.progress_div=document.createElement('div');
  vn.set(this.progress_div.style,{position:'absolute',top:'0px', left:'0px',width:'100%',height:'5px',backgroundColor:'rgb(192,192,192)',display:'none'});
  this.div_out_master_container.appendChild(this.progress_div);
  
  this.progress=new VNProgress();
  this.progress_bar=new ProgressBar(this.progress_div,5,this.progress);
  this.progress.whenProgress().then(function(){self.progress_div.style.display='block';});
  this.progress.whenDone().then(function(){self.progress_div.style.display='none';});
  
};

/**
 * Creates a new line in the text editor, in respect to the given order. The order of the first line is 1.
 * @param order An integer specifying the position of the new line. 
 * @return VNLineEditor The VNLineEditor object that was added. 
 **/
VNTextEditor.prototype.createLineAt=function(order)
{
  //WE WANT TO CREATE A NEW LINE AFTER EXISTING LINE s.
  //FIND s:
  var s=this.lines[order-2];
  
  //MOVE THE ELEMENTS IN THE ARRAY
  for(var i=this.lines.length-1;i>order-2;i--)
  {
    this.lines[i].setOrder(i+2);
    this.lines[i+1]=this.lines[i];
  }
  
  var ns=new VNLineEditor(this);
  ns.setOrder(order);
  this.lines[order-1]=ns;
  
  this.line_container.insertBefore(ns.div_container,s.div_container.nextSibling);
  return ns;
};

/**
 * Removes the line at the given order.
 * @param order An integer specifying the position of a line to be removed. 
 **/
VNTextEditor.prototype.removeLineAt=function(order)
{
  //you are not allowed to remove the first line of the text
  if(order<=1 || order>this.lines.length) return;
  
  //FIND s:
  var s=this.lines[order-1];
  if(this.editing_line==s){this.editing_line=null;}
  
  //MOVE THE ELEMENTS IN THE ARRAY
  for(var i=order-1;i<this.lines.length-1;i++)
  {
    this.lines[i+1].setOrder(i+1);
    this.lines[i]=this.lines[i+1];
  }
  this.lines.pop();
  
  this.line_container.removeChild(s.div_container);
};

/**
 * Removes all lines from the text editor.
 */
VNTextEditor.prototype.clear=function()
{
	while(this.lines.length>1)
		this.removeLineAt(this.lines.length);
	this.line_container.removeChild(this.lines.pop().div_container);
	this.lines[0]=new VNLineEditor(this);
	this.editing_line=null;
	this.lines[0].switchToEditView();
};

/**
* Returns the last line in the text editor. 
* @return VNLineEditor The VNLineEditor object that represents the last line in the text editor. 
**/
VNTextEditor.prototype.getLastLine=function()
{
  return this.lines[this.lines.length-1];
};

/**
* Returns the last token in the text editor or null if there is no token. 
* @return VNTokenEditor The VNTokenEditor object that represents the last token in the text editor. 
**/
VNTextEditor.prototype.getLastToken=function()
{
  var found=null;
  for(var l=this.lines.length-1;found==null && l>=0;l--)
  {
	  if(this.lines[l].tokens.length>0)
		  found=this.lines[l].tokens[this.lines[l].tokens.length-1];
  }
  return found;
};

/**
 * Returns the div that contains the text editor.  
 * @return Element The div element that contains the text editor.  
**/
VNTextEditor.prototype.getDiv=function(){return this.div_out_master_container;};

/**
* Returns the line that is currently in edit mode. 
* @return VNLineEditor The VNLineEditor object that is in edit mode. 
**/
VNTextEditor.prototype.getEditingLine=function()
{return this.editing_line;};

/**
 * Returns the width of the text editor. 
 * @return number An integer value of the text editor's width, in pixels. 
 **/ 
VNTextEditor.prototype.getWidth=function()
{
  return this.div_container.clientWidth;
};

/**
 * Returns the height of the text editor.
 * @return number An integer value of the text editor's height ,in pixels.  
 **/
VNTextEditor.prototype.getHeight=function()
{
  return this.div_container.clientHeight;
};

/*VNTextEditor.prototype.onOutsideClick=function(e)
{
  console.log('o');
  this.clearHighlighting();
  this.getLastLine().switchToEditView();
  this.getInput().focus();
};*/

/**
 * This class represents a line in the text editor, and should be used with the VNTextEditor class.
 @param text_editor A VNTextEditor object.
 **/
function VNLineEditor(text_editor)
{
  this.text_editor=text_editor;
  this.div_container=null;
  this.linenum_div=null;
  this.white_indent=null;
  this.white_indent2=null;
  this.left_tabs=0;
  this.token_container=null;
  this.edit_mode=false;
  this.default_height=20;
  this.order=1;
  this.tokens=new Array();
  this.editing_token=null;
  this.bkg_color='rgb(255,255,255)';
  this.init();
}

/**
 * This method creates a new line after the current line. 
 * It will then update the new line to be in edit mode. 
 * If there was text after the caret position of the text input HTML element, the text following the break will be moved to the next line. 
 * @param position An integer specifying the position of where the break was inserted. 
 * @returns VNTokenEditor The token which has the second part of the split token and is in edit mode after the break.
 **/
VNLineEditor.prototype.breakAt=function(position)
{
  var txt=this.text_editor;
  var input=txt.getInput();
  var pos=position;
  var t=null;
  var part2="";
  if(position<=this.tokens.length)t=this.tokens[position-1];
  if(t && t.isInEditMode())
  {
    if(t.getText().length==0)pos=pos-1;
    else if(txt.getNewCharPosition()<input.value.length)
    {
      part2=input.value.substring(txt.getNewCharPosition(),input.value.length);
      if(txt.getNewCharPosition()>0)
        input.value=input.value.substring(0,txt.getNewCharPosition());
      else {input.value='';pos=pos-1;}
    }
    t.switchToRigidView();
  }
  var l=txt.createLineAt(this.order+1);
  for(var i=this.tokens.length-1;i>=pos;i--)
  {
    var tk=this.removeTokenAt(i+1);
	l.insertTokenAt(1,tk); 
  }
  l.switchToEditView();
  var nt=l.insertTokenAt(1);
  nt.switchToEditView();
  if(part2.length>0)
  {
    txt.type(part2);
  }
  nt.switchToEditView();
  
  txt.setNewCharPosition(0);
  return nt;
};

/**
 * Returns the text of the line editor as a string. 
 * @return string The text of this line editor.
 **/
VNLineEditor.prototype.getText=function()
{
	var s='';
	if(this.tokens.length>0)
	{
		for(var i=0;i<this.left_tabs;i++)
			s+="\t";
		s+=this.tokens[0].getText();
	}
	for(var i=1;i<this.tokens.length;i++)
		s+=" "+this.tokens[i].getText();
	return s;
};

/**
 * This method will remove a break between this line and the previous one, and reposition the remaining lines appropriately. 
 **/
VNLineEditor.prototype.removeBreak=function()
{
  if(this.tokens.length>=1)
  {
    var l=this.getPreviousLine();
    if(l)
    {
	  var t=this.removeTokenAt(1);
	  var numt=0;
	  if(t.getText().length>0)l.appendToken(t);
	  else numt=l.tokens.length;
	  
	  while(this.tokens.length>0)
	  {
		  var tt=this.removeTokenAt(1);
		  l.appendToken(tt);
	  }
	  this.text_editor.removeLineAt(this.getOrder());
	  if(t.getText().length>0){
		  t.switchToEditView();
		  var inp=this.text_editor.getInput();
		  this.text_editor.setNewCharPosition(0);
	  }
	  else{
		  if(numt>0)l.tokens[numt-1].switchToEditView();
		  else if(l.tokens.length>0)
		  {
			  l.tokens[0].switchToEditView();
			  var inp=this.text_editor.getInput();
			  this.text_editor.setNewCharPosition(0);
		  }
		  else l.switchToEditView();
	  }
      
    }
  }
};

/**
 * Removes this line from the text editor.
 */
VNLineEditor.prototype.remove=function()
{
  this.text_editor.removeLineAt(this.order);
};

/**
 * Returns boolean specifying whether or not this line is in edit mode.
 * @return Boolean The edit mode status.
 **/
VNLineEditor.prototype.isInEditMode=function()
{
  return this.edit_mode;
};

/**
 * Returns the token that is in edit mode, from this line.
 * @return VNTokenEditor A VNTokenEditor object that is currently in edit mode. 
 **/
VNLineEditor.prototype.getEditingToken=function()
{return this.editing_token;};

/**
 * Returns the width of the current line.
 * @return number An integer value of the line width, in pixels. 
 **/
VNLineEditor.prototype.getWidth=function()
{ 
  return this.div_container.clientWidth;
};

/**
 * Returns the height of the current line.
 * @return number An integer value of the line height, in pixels. 
 **/
VNLineEditor.prototype.getHeight=function()
{
  return this.div_container.clientHeight;
};

/**
 * This method sets the width of the left indentation of this line.
 * @param w A number with the desired width in pixels.
 */
VNLineEditor.prototype.setIndentWidth=function(w){
	if(w<0)w=0;
	
	if(w==0)
	{
		this.white_indent.style.borderRight='none';
		this.white_indent2.style.width="5px";
		this.white_indent.style.width="0px";
		this.left_tabs=0;
	}
	else{
		this.white_indent2.style.width="15px";	
		this.white_indent.style.width=(w*20-10)+"px";
		this.left_tabs=w;
		
		if(w%4==0)this.white_indent.style.borderRight='1px solid '+this.getTextEditor().skin.scopeLineColor0;
		else if(w%4==1)this.white_indent.style.borderRight='1px solid '+this.getTextEditor().skin.scopeLineColor1;
		else if(w%4==2)this.white_indent.style.borderRight='1px solid '+this.getTextEditor().skin.scopeLineColor2;
		else if(w%4==3)this.white_indent.style.borderRight='1px solid '+this.getTextEditor().skin.scopeLineColor3;
	}
	if(w%4==0)this.bkg_color=this.getTextEditor().skin.scopeBackgroundColor0;//'rgb(250,250,255)';
	else if(w%4==1) this.bkg_color=this.getTextEditor().skin.scopeBackgroundColor1;//'rgb(255,255,255)';
	else if(w%4==2) this.bkg_color=this.getTextEditor().skin.scopeBackgroundColor2;//'rgb(255,250,250)';
	else if(w%4==3) this.bkg_color=this.getTextEditor().skin.scopeBackgroundColor3;//'rgb(250,255,250)';
	
	if(!this.edit_mode)this.test.style.background=this.bkg_color;
};

VNLineEditor.prototype.init=function()
{
  this.div_container=document.createElement('div');
  vn.set(this.div_container.style,{width:'100%',height:'auto',cursor:'text',display:'flex',flexDirection:'row',position:'relative',backgroundColor:'#EEEEEE',userSelect:'none',msUserSelect:'none',webkitUserSelect:'none',mozUserSelect:'none'});
  this.text_editor.line_container.appendChild(this.div_container);

  var self=this;
  this.div_container.addEventListener('mouseover',function(e){
	  self.getTextEditor().whenMouseOverLine().callThen({object:self,event:e});
  },false);
  
  this.linenum_div=document.createElement('div');
  vn.set(this.linenum_div.style,{position:'relative',left:'0px',width:'50px',height:this.default_height+'px',fontFamily:'"Courier New", Courier, monospace',fontSize:'14px',verticalAlign:'middle',lineHeight:this.default_height+'px',
  backgroundColor:'rgb(0,0,255)',color:'rgb(255,255,255)',userSelect:'none',msUserSelect:'none',webkitUserSelect:'none',mozUserSelect:'none'});
  this.linenum_div.innerHTML=this.order+'.';
  this.div_container.appendChild(this.linenum_div);
   
  this.white_indent=document.createElement('div');
  vn.set(this.white_indent.style,{position:'relative',left:'0px',width:'0px',backgroundColor:this.getTextEditor().skin.backgroundColor});
  this.div_container.appendChild(this.white_indent);
  
  this.white_indent2=document.createElement('div');
  vn.set(this.white_indent2.style,{position:'relative',left:'0px',width:'10px',backgroundColor:this.getTextEditor().skin.backgroundColor});
  this.div_container.appendChild(this.white_indent2);
  
  this.test=document.createElement('div');
  vn.set(this.test.style,{position:'relative',/*background:'rgb(240,240,255)',*/flex:1});
  this.div_container.appendChild(this.test);
  
  //CREATE THE TOKEN AREA
  this.token_container=document.createElement('div');
  vn.set(this.token_container.style,{position:'inline',height:'auto',minHeight:this.default_height+'px',cursor:'text'});
  this.test.appendChild(this.token_container);
  
  var self=this;
  //this.token_container.onmouseup=function(e){if(e.target==self.token_container)self.onrigidclick(e);};
  //this.white_indent.onmouseup=function(e){self.onleftindentclick(e);};
  //this.white_indent2.onmouseup=function(e){self.onleftindentclick(e);};
  
  this.white_indent.onmousedown=function(e){
	  self.getTextEditor().startHighlighting({line_start:self});
	/*if(self.tokens.length==0)
	{
		var l=self.getNextLine();
		for(;l!=null && l.tokens.length==0;l=l.getNextLine());
		if(l)l.tokens[0].startHighlighting({empty_line:self});
		else 
		{
			self.getTextEditor().clearHighlighting();	
			self.switchToEditView();
		}
	}
	else self.tokens[0].startHighlighting({white_indent:true});*/
  };
  this.white_indent2.onmousedown=function(e){
	  self.getTextEditor().startHighlighting({line_start:self});
	/*if(self.tokens.length==0)
	{
		var l=self.getNextLine();
		for(;l!=null && l.tokens.length==0;l=l.getNextLine());
		if(l)l.tokens[0].startHighlighting({empty_line:self});
		else
		{
			self.getTextEditor().clearHighlighting();	
			self.switchToEditView();
		}
	}
	else self.tokens[0].startHighlighting({white_indent:true});*/
  };
  this.token_container.onmousedown=function(e){
	if(e.target==self.token_container)
	{
		self.getTextEditor().startHighlighting({line_end:self});
		//if(self.tokens.length==0)
		//{
			/*var l=self.getNextLine();
			for(;l!=null && l.tokens.length==0;l=l.getNextLine());
			if(l)l.tokens[0].startHighlighting({outside:true,line_clicked:self});
			else
			{
				self.getTextEditor().clearHighlighting();	
				self.switchToEditView();
			}*/
		//}
		//else self.tokens[self.tokens.length-1].startHighlighting({outside:true});
	}
  };
  
  this.white_indent.onmousemove=function(e){
	//if(self.tokens.length>0)
		self.getTextEditor().updateHighlighting({line_start:self,event:e});
  };
  this.white_indent2.onmousemove=function(e){
	//if(self.tokens.length>0)
		self.getTextEditor().updateHighlighting({line_start:self,event:e});
  };
  this.token_container.onmousemove=function(e){
	if(e.target==self.token_container)
	{
		self.getTextEditor().updateHighlighting({line_end:self,event:e});
		//if(self.tokens.length>0)self.getTextEditor().updateHighlighting({token:self.tokens[self.tokens.length-1]});
		/*else
		{
			var l=self.getPreviousLine();
			for(;l!=null && l.tokens.length==0;l=l.getPreviousLine());
			if(l)self.getTextEditor().updateHighlighting(l.tokens[l.tokens.length-1]);
		}*/	
	}
  };
  


};

/**
 * Sets a style to the line, if the line is not in edit mode, and overwrites the line's current text with the text given. This does not change the actual text of the tokens, which will appear when the line goes to edit mode.
 * @param style An object with style properties to be set to the div element of this line. 
 * @param text A string that will replace the line's current text.
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
  line.setStyle({color:'#000000',fontStyle:'italic',paddingLeft:'5px',paddingRight:'5px'},"This is line #"+line.getOrder());
  <br></font>
 **/
VNLineEditor.prototype.setStyle=function(style,text)
{
  if(this.edit_mode)return;
  var div=document.createElement('div');
  vn.set(div.style,{position:'inline',height:'auto',minHeight:this.default_height+'px',cursor:'text',paddingLeft:this.token_container.style.paddingLeft});
  vn.set(div.style,style);
  div.innerHTML=text;
  this.test.removeChild(this.test.firstChild);
  this.test.appendChild(div);
  //var self=this;
  //div.onmouseup=function(e){self.onrigidclick(e);};
};

VNLineEditor.prototype.setOrder=function(order)
{
  this.order=order;
  this.linenum_div.innerHTML=this.order+'.';
};

/**
 * Returns the order of the this line, relative all other lines in the text editor. The ordering starts with 1 for the first line of the text.
 * @return int An integer value specifying the line's current position. 

 **/
VNLineEditor.prototype.getOrder=function()
{
  return this.order;
};

/**
 * Returns the text editor that the line belongs to. 
 * @return VNTextEditor The VNTextEditor object that contains the current line.  
 **/
VNLineEditor.prototype.getTextEditor=function(){return this.text_editor;};

/**
 * This method switches the line from rigid view to edit view.
 **/
VNLineEditor.prototype.switchToEditView=function()
{
  if(this.edit_mode)return;
  if(this.getTextEditor().editing_line)
    this.getTextEditor().editing_line.switchToRigidView();
  this.getTextEditor().editing_line=this;
  this.edit_mode=true;
  this.test.removeChild(this.test.firstChild);
  this.test.appendChild(this.token_container);
  
  vn.set(this.linenum_div.style,{backgroundColor:'rgb(0,0,255)',color:'rgb(255,255,255)'});
  vn.set(this.test.style,{background:this.getTextEditor().skin.editBackgroundColor});
  
  
  var self=this;
  this.token_container.onmouseup=function(e){
	  self.getTextEditor().clearHighlighting();
	  
    if(e.target==self.token_container)
    {
	  if(self.tokens.length>0)
	  {
		var t=self.tokens[self.tokens.length-1];
		if(t.getText().length>0)t.switchToRigidView();
		t.switchToEditView();  
	  }  
	  else self.appendToken().switchToEditView();
    }
    self.getTextEditor().getInput().focus();
    };

  var p=this.getTextEditor().tokenizer.whenLineEditStarts();
  p.setObject(this);
  p.callThen();
  
  if(this.tokens.length>0)
  {
	var t=this.tokens[this.tokens.length-1];
	t.switchToRigidView();
	t.switchToEditView();  
  }  
  else this.appendToken().switchToEditView();
};

/**
 * This method switches the line from edit view to rigid view.
 **/
VNLineEditor.prototype.switchToRigidView=function()
{
  if(!this.edit_mode)return;
  if(this.getTextEditor().editing_line!=this)console.log('ERROR!!!! THIS SHOULD NEVER HAPPEN!');
  this.getTextEditor().editing_line=null;
  this.edit_mode=false;
  
  vn.set(this.linenum_div.style,{backgroundColor:'',color:'rgb(0,0,0)'});
  vn.set(this.test.style,{background:this.bkg_color});
  
//  var self=this;
//  this.token_container.onmouseup=function(e){if(e.target==self.token_container)self.onrigidclick(e);};

  if(this.editing_token)
    this.editing_token.switchToRigidView();
  
  var p=this.getTextEditor().tokenizer.whenLineEditEnds();
  p.setObject(this);
  p.callThen();
};

/**
 * Returns the position of the line, relative to the entire application screen.
 * @return Array An Array of size 2 with the x-position as the first element, and y-position as the second element. 
 **/
VNLineEditor.prototype.getPosition=function() 
{
  var el=this.div_container;
  for (var lx=0, ly=0;
         el != null;
         lx += el.offsetLeft, ly += el.offsetTop, el = el.offsetParent);
   return [lx,ly-this.text_editor.div_container.scrollTop];
};

/**
 * Returns the next line, relative to the current line. 
 * @return VNLineEditor The VNLineEditor object that represents the next line.  
**/
VNLineEditor.prototype.getNextLine=function()
{
  if(this.text_editor.lines.length>this.order)
    return this.text_editor.lines[this.order];
  else return null;
};

/**
 * Returns the previous line, relative to the current line.  
 * @return VNLineEditor The VNLineEditor object that represents the previous line. 
 **/
VNLineEditor.prototype.getPreviousLine=function()
{
  if(this.order>1)
    return this.text_editor.lines[this.order-2];
  else return null;
};

/**
 * Returns previous token, relative to this line. It returns null if there is no previous token.
 * @return VNTokenEditor The previous VNTokenEditor object, relative to this line.
 **/
VNLineEditor.prototype.getPreviousToken=function()
{
	var t=null;
    var l=this.getPreviousLine();
    for(;l!=null&&t==null;)
    {
      if(l.tokens.length>0)return l.tokens[l.tokens.length-1];
      else l=l.getPreviousLine();
    }
    return t;

};

/**
 * Adds a token to the end of the current line.  
 * @param token An optional argument with an existing token to be appended.
 * @return VNTokenEditor The VNTokenEditor object that was added. 
 **/
VNLineEditor.prototype.appendToken=function(token)
{
  return this.insertTokenAt(this.tokens.length+1,token);
};

/**
 * Removes a token from the line.
 * @param order An integer specifying the token's position in the line, where it will be removed. The ordering starts from 1 for the first token in the line.
 * @return VNTokenEditor The VNTokenEditor object that was removed. 
 **/
VNLineEditor.prototype.removeTokenAt=function(order)
{
	//console.log('remove '+order+' out of '+this.tokens.length+' in line '+this.order);
  if(order<1 || order>this.tokens.length)return;
    
  var t=this.tokens[order-1];
    
  var pt=t.getPreviousToken();
  var nt=t.getNextToken();
	
  if(this.editing_token==t){
	  t.switchToRigidView();
	  t.line=null;
	  if(this.tokens.indexOf(t)<0)
	  {
		  var p=this.getTextEditor().tokenizer.whenTokenRemoved();
		  p.callThen({object:t,event:{previousToken:pt,nextToken:nt}});
		  return t;//the token may have already been removed from the switchToRigidView command.
	  }
	}
  this.tokens.splice(order-1,1);
  this.token_container.removeChild(t.getDiv());
  
  for(var i=order-1;i<this.tokens.length;i++)
    this.tokens[i].setOrder(i+1);

  t.line=null;
  
  var p=this.getTextEditor().tokenizer.whenTokenRemoved();
  p.callThen({object:t,event:{previousToken:pt,nextToken:nt}});		  
  return t;
};

/**
 * Inserts a token into the line, and returns the token that was inserted. 
 * @param order An integer specifying what position in the line the token will be inserted. The ordering starts from 1 for the first token in the line.
 * @param token An optional argument with an existing token to be inserted in this line.
 * @return VNTokenEditor The VNTokenEditor object that was inserted.  
 **/
VNLineEditor.prototype.insertTokenAt=function(order,token)
{
	//console.log('insert at:'+order+' out of '+this.tokens.length+' in line '+this.order +' '+(token?token.getText():'new'));
  var t=token||new VNTokenEditor(this);
  if(this.tokens.length>order-1)
    this.token_container.insertBefore(t.getDiv(),this.tokens[order-1].getDiv());
  else this.token_container.appendChild(t.getDiv());
  this.tokens.splice(order-1,0,t);  
  t.setOrder(order);
  t.line=this;//in the case that the token agrument was provided.
  for(var i=order;i<this.tokens.length;i++)
    this.tokens[i].setOrder(i+1);
  return t;
};

/**
 * This method removes the last token in this line.
 * @return VNTokenEditor The VNTokenEditor object that was removed.
 **/
VNLineEditor.prototype.removeLastToken=function()
{
  return this.removeTokenAt(this.tokens.length);
};

/**
 * This method will switch the next line to edit view, and switch the current line to rigid view. 
 **/
VNLineEditor.prototype.editNextLine=function()
{
  if(this.order>=this.text_editor.lines.length) return;
  var s=this.text_editor.lines[this.order];
  s.switchToEditView();
};

/**
 * This method will switch the previous line to edit view, and switch the current line to rigid view. 
 **/
VNLineEditor.prototype.editPreviousLine=function()
{
  if(this.order==1) return;
  var s=this.text_editor.lines[this.order-2];
  s.switchToEditView();
};

/**
 * This method will switch the next 20th line to edit view, and switch the current line to rigid view. 
 **/
VNLineEditor.prototype.editNext20Line=function()
{
  if(this.order>=this.text_editor.lines.length) return;
  var n=this.order+19;
  if(n>=this.text_editor.lines.length) n=this.text_editor.lines.length-1;
  var s=this.text_editor.lines[n];
  s.switchToEditView();
};
/**
 * This method will switch the previous 20th line to edit view, and switch the current line to rigid view. 
 **/
VNLineEditor.prototype.editPrevious20Line=function()
{
  if(this.order==1) return;
  var n=this.order-2-19;
  if(n<0)n=0;
  var s=this.text_editor.lines[n];
  s.switchToEditView();
};

/*VNLineEditor.prototype.onrigidclick=function(e)
{
  this.getTextEditor().clearHighlighting();	
  this.switchToEditView();
};*/

/*VNLineEditor.prototype.onleftindentclick=function(e)
{
  this.getTextEditor().clearHighlighting();	
  if(this.tokens.length>0)
  {
	  this.tokens[0].switchToEditView();
	  this.getTextEditor().setNewCharPosition(0);
  }
  else this.switchToEditView();
};*/

/**
 * This method applies the text editor's tokenizer to the line by triggering the promises whenLineEditStarts and whenLineEditEnds of the tokenizer.
 **/
VNLineEditor.prototype.applyTokenizer=function()
{
  this.test.removeChild(this.test.firstChild);
  this.test.appendChild(this.token_container);
  var t=this.getTextEditor().tokenizer;
  var p=t.whenLineEditStarts();
  p.setObject(this);
  p.callThen();
  p=t.whenLineEditEnds();
  p.setObject(this);
  p.callThen();
};

/**
 * This class creates and modifies a token.  
 * The user is able to modify the token when it is in edit mode.  
 * Note that when a token is not in edit mode, it is in rigid mode. 
 * This method should be used in conjunction with the VNLineEditor and VNTextEditor class. 
 * @param line_editor The line that the token exists in.  
 **/
function VNTokenEditor(line)
{
  this.line=line;
  this.div_container=null;
  this.text_input=null;
  this.space=null;
  this.default_height=20;
  this.text='';
  this.edit_mode=false;
  this.order=1;
  this._edit_s_p=new VNPromise(this);
  this._edit_e_p=new VNPromise(this);
  this._rem_p=new VNPromise(this);
  this.init();
}

VNTokenEditor.prototype.whenTokenEditStarts=function(){return this._edit_s_p;};
VNTokenEditor.prototype.whenTokenEditEnds=function(){return this._edit_e_p;};
VNTokenEditor.prototype.whenTokenRemoved=function(){return this._rem_p;};

/**
 * Inserts a new line after the current token. If there was text after the cursor position of the text input HTML element, the text following the break will be moved to the next line. 
 * @returns VNTokenEditor The token which has the second part of the split token and is in edit mode after the break.
 **/
VNTokenEditor.prototype.breakLine=function()
{
  return this.line.breakAt(this.order);
};

/**
 * Inserts a token after this token. 
 * @return VNTokenEditor The VNTokenEditor object that was inserted.
 **/
VNTokenEditor.prototype.insertTokenAfter=function()
{
  return this.line.insertTokenAt(this.order+1);
};

/**
 * Inserts the token before this token. 
 * @return VNTokenEditor A VNTokenEditor object that was inserted. 
 **/
VNTokenEditor.prototype.insertTokenBefore=function()
{
  return this.line.insertTokenAt(this.order);
};

/**
 * If this token is in edit mode, it splits the token at the location of the caret.
 * @param newChar An optional unicode number of a character to be added at the location of the carret.
 * @returns VNTokenEditor The token which has the second part of the token and is in edit mode after the split.
 **/
VNTokenEditor.prototype.split=function(newChar)
{
	if(!this.isInEditMode())return null;
	var part2="";
	var txt=this.getTextEditor();
	var input=txt.getInput();
	var nt=this.insertTokenAfter();
		
	if(txt.getNewCharPosition()<input.value.length)
	{
		part2=input.value.substring(txt.getNewCharPosition(),input.value.length);
		if(txt.getNewCharPosition()>0)
			input.value=input.value.substring(0,txt.getNewCharPosition());
		else {input.value='';}
	}
	this.switchToRigidView();
	nt.switchToEditView();
	if(newChar)
	{
		txt.typeChar(newChar);
	}
	if(part2.length>0)
	{
	  txt.type(part2);
	}
	
    nt.switchToEditView();
	if(newChar)
	{
		txt.setNewCharPosition(1);
	}
	else
	{
		txt.setNewCharPosition(0);
	}
	return nt;
};

/**
 * This method merges this token with the previous one by removing this token and typing its contents to the end of the previous token. 
 */
VNTokenEditor.prototype.mergeWithPrevious=function()
{
	var t=this.getPreviousToken();
	if(t)
	{
		t.switchToEditView();
		var pos=t.getText().length;
		var txt=this.getText();
		if(this.line)this.remove(); //we check because it may have already been removed from the t.switchToEditView line above.
		var editor=t.getTextEditor();
		editor.type(txt);
		t.switchToEditView();
		editor.setNewCharPosition(pos);
	}
};

/**
 * Returns a boolean to specify if the token is in edit mode. 
 * @return boolean 
 **/
VNTokenEditor.prototype.isInEditMode=function()
{
  return this.edit_mode;
};

/**
 * Returns the text from the current token.
 * @return string The string containing the text from the token.
 **/
VNTokenEditor.prototype.getText=function()
{
  if(this.edit_mode)return this.getTextEditor().getInput().value;
  else return this.text;
};

/**
 * Returns the remaining text of the text editor after the current token.
 * @return string The string containing the text after this token.
 **/
VNTokenEditor.prototype.getTextAfter=function()
{
	var s='';
	for(var i=this.order;i<this.line.tokens.length;i++)
	 s+=' '+this.line.tokens[i].getText();
    var ed=this.getTextEditor();
	for(var i=this.line.order;i<ed.lines.length;i++)
		s+="\n"+ed.lines[i].getText();
	return s;
};

/**
 * Returns the remaining text of the same line after the current token.
 * @return string The string containing the text after this token.
 **/
VNTokenEditor.prototype.getLineTextAfter=function()
{
	var s='';
	for(var i=this.order;i<this.line.tokens.length;i++)
	 s+=' '+this.line.tokens[i].getText();
	return s;
};


/**
 * Removes this token from the line it belongs to.
 **/
VNTokenEditor.prototype.remove=function()
{
  this.line.removeTokenAt(this.order);
};

/**
 * Removes the remaining tokens of the same line after the current token.
 **/
VNTokenEditor.prototype.removeLineTokensAfter=function()
{
	var t=this.getNextToken();
	for(;t!=null && t.line==this.line;)
	{
		var tt=t;
		t=t.getNextToken();
		tt.remove();
	}
};

/**
 * Removes the remaining tokens of the entire text editor after the current token.
 **/
VNTokenEditor.prototype.removeTokensAfter=function()
{
	var t=this.getNextToken();
	var l=this.line.order;
	for(;t!=null;)
	{
		var tt=t;
		t=t.getNextToken();
		tt.remove();
	}
	var e=this.getTextEditor();
	while(e.lines.length>l)
		e.removeLineAt(l+1);
};

/**
 * Returns true if this token is the last token in a line.
 * @return Boolean A boolean value indicating the result. 
 **/
VNTokenEditor.prototype.isLastTokenInLine=function()
{
  if(this.order==this.line.tokens.length)return true;
  else return false;
};

/**
 * Returns the text editor that the token belongs to. 
 * @return VNTextEditor The VNTextEditor object that the token belongs to. 
 **/
VNTokenEditor.prototype.getTextEditor=function(){
	if(this.line==null)console.log('ERROR: '+ this.getText());
	return this.line.text_editor;};

VNTokenEditor.prototype.setOrder=function(order)
{
  this.order=order;
};

/**
 * Returns previous token, relative to this token. It returns null if there is no previous token.
 * @return VNTokenEditor The previous VNTokenEditor object, relative to this token.
 **/
VNTokenEditor.prototype.getPreviousToken=function()
{
  if(this.line==null)return null;
  if(this.order>1)return this.line.tokens[this.order-2];
  else 
  {
    var t=null;
    var l=this.line.getPreviousLine();
    for(;l!=null&&t==null;)
    {
      if(l.tokens.length>0)return l.tokens[l.tokens.length-1];
      else l=l.getPreviousLine();
    }
    return t;
  }
};

/**
 * Returns next token, relative to this token. It returns null if there is no next token.
 * @return VNTokenEditor The next VNTokenEditor object, relative to this token.
 **/
VNTokenEditor.prototype.getNextToken=function()
{
  if(this.line==null)return null;
  if(this.order<this.line.tokens.length)return this.line.tokens[this.order];
  else 
  {
    var t=null;
    var l=this.line.getNextLine();
    for(;l!=null&&t==null;)
    {
      if(l.tokens.length>0)return l.tokens[0];
      else l=l.getNextLine();
    }
    return t;
  }
};

/**
 * Sets the previous token to be in edit mode.
 **/
VNTokenEditor.prototype.editPreviousToken=function()
{
  var t=this.getPreviousToken();
  if(t){
    if(t.line.order==this.line.order)
      t.switchToEditView();
    else this.line.editPreviousLine();
  }
  else this.line.editPreviousLine();
};

/**
 * Sets the next token to be in edit mode and the caret to be in the beginning of the token.
 **/
VNTokenEditor.prototype.editNextToken=function()
{
  var t=this.getNextToken();
  if(t){
    if(t.line.order==this.line.order || t.line.order==this.line.order+1)
	{
      t.switchToEditView();
      t.getTextEditor().setNewCharPosition(0);
	}
    else this.line.editNextLine();//in this case the next line is empty
  }
  else this.line.editNextLine();
};

/**
 * Sets the current token to be in edit mode.  
 **/
VNTokenEditor.prototype.switchToEditView=function()
{
  if(this.edit_mode)
  {
	  this.getTextEditor().getInput().focus(); //if we clicked on a div that switched this token to edit view, that div will get focus by default. Here we turn focus to the text element. 
	  return;
  }
  
  if(!this.line.edit_mode)
    this.line.switchToEditView();
  
  if(this.line.editing_token == this) return;//The token is already in edit mode from line.switchToEditView();
  else if(this.line.editing_token)
    this.line.editing_token.switchToRigidView();

  this.line.editing_token=this;
  this.edit_mode=true;
  this.div_container.removeChild(this.text_input);
  
  //we recreate the div element in order to reset the style that may have been edited by the tokenizer
  this.text_input=document.createElement('div');
  this.text_input.style.display='inline-block';
  this.text_input.style.verticalAlign='middle';
  this.text_input.style.lineHeight=this.default_height+'px';
  this.text_input.style.fontFamily='"Courier New", Courier, monospace';
  this.text_input.style.fontSize='14px';
  this.text_input.style.color=this.getTextEditor().skin.defaultTextColor;
  
  this.div_container.removeChild(this.space);
  this.space=document.createElement('div');
  this.space.style.display='inline-block';
  this.space.style.verticalAlign='middle';
  this.space.style.minHeight=this.default_height+'px';
  this.space.innerHTML='&nbsp;';
  this.div_container.appendChild(this.space);
  
  var ed=this.getTextEditor();
  var txt=ed.getInput();
 
  var self=this;
  txt.onkeydown=function(e){//only for control keys
    if (!e) e = window.event;
	  
    var keyCode = e.keyCode || e.which;
	//console.log('kd '+keyCode);
    if(ed.control_keys[keyCode])
	{
		ed.setNewCharPosition(txt.selectionStart);
		var v=ed.onkeydown({event:e, newChar:ed.control_keys[keyCode], textBefore:txt.value, editor:ed, line:self.line, token:self,input:txt,newCharPosition:ed.newCharPos});
		if(v!==false)
		{
			txt.style.width=(9*(txt.value.length+1))+'px';
		}
		return v;
	}
	};
  txt.onkeypress=function(e){
    if (!e) e = window.event;
	
    var keyCode = e.charCode;
	//vn._c.println('kp '+keyCode+ e.key);
	//if(e.key && e.key.length==1)
	if(keyCode)
	{
		//keyCode=e.key.charCodeAt(0);
		if(keyCode!=13 && keyCode!=9 && keyCode!=8)//enter,tab,backspace
		{
			ed.setNewCharPosition(txt.selectionStart);
			var v=ed.onkeydown({event:e, newChar:keyCode, textBefore:txt.value, editor:ed, line:self.line, token:self,input:txt,newCharPosition:ed.newCharPos});
			if(v!==false){
				txt.style.width=(9*(txt.value.length+2))+'px';
			}
			return v;
		}
	}
    };
  this.setText(this.text);
  this.div_container.insertBefore(txt,this.space);
  txt.focus();
  this.getTextEditor().setNewCharPosition(this.text.length); 
  
  var p=this.getTextEditor().tokenizer.whenTokenEditStarts();
  p.setObject(this);
  p.callThen();
  //console.log('Previous: '+(this.getPreviousToken()?this.getPreviousToken().text:'none')+' Next: '+(this.getNextToken()?this.getNextToken().text:'none'));
};

/**
 * This method applies the text editor's tokenizer to the token by triggering the promises whenTokenEditStarts and whenTokenEditEnds of the tokenizer.
 **/
VNTokenEditor.prototype.applyTokenizer=function()
{
  if(this.edit_mode)return;
  this.div_container.removeChild(this.text_input);
  this.text_input=document.createElement('div');
  this.text_input.style.display='inline-block';
  this.text_input.style.verticalAlign='middle';
  this.text_input.style.lineHeight=this.default_height+'px';
  this.text_input.style.fontFamily='"Courier New", Courier, monospace';
  this.text_input.style.fontSize='14px';
  this.text_input.style.color=this.getTextEditor().skin.defaultTextColor;
  this.setText(this.text);
  this.div_container.insertBefore(this.text_input,this.space);
  var t=this.getTextEditor().tokenizer;
  var p=t.whenTokenEditStarts();
  p.setObject(this);
  p.callThen();
  p=t.whenTokenEditEnds();
  p.setObject(this);
  p.callThen();
};

/**
 * Resets the rigid-mode style of the token.
 **/
VNTokenEditor.prototype.resetStyle=function()
{
  if(this.edit_mode)return;
  
  this.div_container.removeChild(this.text_input);
  
  this.text_input=document.createElement('div');
  this.text_input.style.display='inline-block';
  this.text_input.style.verticalAlign='middle';
  this.text_input.style.lineHeight=this.default_height+'px';
  this.text_input.style.fontFamily='"Courier New", Courier, monospace';
  this.text_input.style.fontSize='14px';
  this.text_input.style.color=this.getTextEditor().skin.defaultTextColor;
  this.setText(this.text);
 
  this.div_container.removeChild(this.space);
  this.space=document.createElement('div');
  this.space.style.display='inline-block';
  this.space.style.verticalAlign='middle';
  this.space.style.minHeight=this.default_height+'px';
  this.space.innerHTML='&nbsp;';
  this.div_container.appendChild(this.space);
 
  this.div_container.insertBefore(this.text_input,this.space);
  };

/**
 * Sets the token to rigid view. 
 **/
VNTokenEditor.prototype.switchToRigidView=function()
{
  if(!this.edit_mode)return;
  if(this.line.editing_token!=this)console.log('ERROR!!!! THIS SHOULD NEVER HAPPEN!');
  this.line.editing_token=null;
  this.edit_mode=false;
  
  var txt=this.getTextEditor().getInput();
  this.div_container.removeChild(txt);
  this.setText(txt.value);
  
  if(txt.value.length==0)
  {
    this.line.removeTokenAt(this.order);
    return;
  }
  
  this.div_container.insertBefore(this.text_input,this.space);
  
  var p=this.getTextEditor().tokenizer.whenTokenEditEnds();
  p.setObject(this);
  p.callThen();
};

/**
 * Returns the width of the token's div. 
 * @return number The width of the token's div, in pixels. 
 **/
VNTokenEditor.prototype.getWidth=function()
{
  return this.div_container.clientWidth;
};

/**
 * Returns the height of the token's div. 
 * @return number The height of the token's div, in pixels. 
 **/
VNTokenEditor.prototype.getHeight=function()
{
  return this.div_container.clientHeight;
};

/**
 * Returns the HTMLElement of the space area after this token.
 * @return Node The HTMLElement of the space area after this token.
 **/
VNTokenEditor.prototype.getSpace=function()
{
	return this.space;
};

/**
 * Sets a style to the token,  and optionally overwrites the token's current text with the text given. This does not change the actual text of the token, which will appear when the token goes to edit mode.
 * @param style An object with the style properties to be set to the div element of this token. 
 * @param text An optional string with the text to be shown on this token. 
 **/
VNTokenEditor.prototype.setStyle=function(style,text)
{
  var f=function(t){return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');};
  vn.set(this.text_input.style,style);
  if(typeof text!=='undefined')
	  this.text_input.innerHTML=f(text).replace(/&amp;nbsp;/g, '&nbsp;');
  else this.text_input.innerHTML=f(this.getText());
};

/**
 * Sets if this token is highlighted.
 * @param flag A boolean value with the desired highlighting status.
 */
VNTokenEditor.prototype.setHighlighted=function(flag)
{
	if(flag) this.div_container.style.background=this.getTextEditor().skin.highlightColor;
	else this.div_container.style.background='';
};

VNTokenEditor.prototype.init=function()
{
  this.div_container=document.createElement('div');
  this.div_container.style.display='inline-block';
  this.div_container.style.minHeight=this.default_height+'px';
  this.div_container.style.cursor='auto';
  //this.line.token_container.insertBefore(this.div_container,this.line.text_input);
  
  this.text_input=document.createElement('div');
  this.text_input.style.display='inline-block';
  this.text_input.style.verticalAlign='middle';
  this.text_input.style.lineHeight=this.default_height+'px';
  this.text_input.style.fontFamily='"Courier New", Courier, monospace';
  this.text_input.style.fontSize='14px';
  this.text_input.innerHTML=this.text;
  this.div_container.appendChild(this.text_input);
  
  this.space=document.createElement('div');
  this.space.style.display='inline-block';
  //this.space.style.minWidth='8px';
  this.space.style.verticalAlign='middle';
  this.space.style.minHeight=this.default_height+'px';
  this.space.innerHTML='&nbsp;';
  this.div_container.appendChild(this.space);
  
  var self=this;
  /*this.div_container.onclick=function(e){
    self.switchToEditView();
    };*/
	
  var self=this;
  this.div_container.addEventListener('mouseover',function(e){
	  self.getTextEditor().whenMouseOverToken().callThen({object:self,event:e});
  },false);
	
  this.div_container.onmousedown=function(e){
	//self.startHighlighting();
	self.getTextEditor().startHighlighting({token:self});
  };
  
  this.div_container.onmousemove=function(e){
	//console.log('MD');  
	self.getTextEditor().updateHighlighting({token:self,event:e});
  };
  
  
  
  this.div_container.ontouchstart=function(e){
	//console.log('MD');  
  };
  
  this.div_container.ontouchend=function(e){
	self.switchToEditView();
  };
};

VNTokenEditor.prototype.startHighlighting=function(options)
{
	var opt=options||{};
	var self=this;
	var te=this.getTextEditor();
	var on_m_u=function(e){
		te.stopHighlighting();
		document.removeEventListener('mouseup',on_m_u,true);
		if(!te.isHighlighted())
		  {
			if(opt.line_clicked)
			{
				opt.line_clicked.switchToEditView();
				opt.line_clicked.tokens[opt.line_clicked.tokens.length-1].switchToEditView();
			}
			else self.switchToEditView();
			
			if(opt.white_indent)
				te.setNewCharPosition(0);
			else if(opt.outside)te.setNewCharPosition(te.getInput().value.length);
		  }
		e.stopPropagation();
	};
	
	te.startHighlighting({token:this});
	document.addEventListener('mouseup',on_m_u,true);
};

/**
 * Returns this token's div.
 * @return div A div element holding the current token.  
**/
VNTokenEditor.prototype.getDiv=function(){return this.div_container;};

/**
 * Sets new text to this token.
 * @param text A string to replace the current text in the token. 
**/
VNTokenEditor.prototype.setText=function(text)
{
  this.text=text;
  if(this.edit_mode){
    var input=this.getTextEditor().getInput();
    input.value=text;
    input.style.width=(9*(input.value.length+1))+'px';
  }
  else this.text_input.innerHTML=this.text;
};

/**
 * This class implements a token renderer.
 */
function VNTokenRenderer(){}

/**
 * This method renders a token of a given type using the corresponding style of this renderer.
 * @param type A string with the type of the token to be rendered.
 * @param t A token given as a VNTokenEditor object.
 */
VNTokenRenderer.prototype.render=function(type,t)
{
	t.info2=type;
	if(this[type])this[type](t);
};

