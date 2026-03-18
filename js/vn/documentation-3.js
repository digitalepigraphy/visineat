/* V3
 * Author(s): Kim Huynh, Tess Bianchi, Angelos Barmpoutis
 * 
 * Copyright (c) 2016-2017, University of Florida Research Foundation, Inc. 
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
 * This class is used to create documentation for a JavaScript file. 
 * The documentation will identify and store all public classes and their corresponding methods presented in the given JS file. 
 * A class will be classified as public if it has a comment before its definition. And a method will be classified as public if 
 * it has a comment before it and is defined with a prototype of a public class. <br><br>
 * Begin by declaring the documentation as a new object in a script function, which can be later called in the onload attribute of the
 * html body element. Then use the "load(url)" method to load and parse the JS file,
 * where the url of the JS file is passed as an argument. 
 * <br><br><b>Example:</b><br>
 * <font style="font-family:Courier"> <br>
 * function on_load(){ <br>
 * vn.import('vn.documentation').then(function(){ <br>
 * var doc = new Documentation(); <br>
 * doc.load('http://www.visineat.com/js/vn-1.7.js').then(function(){...}); }); <br></font>
 */
function Documentation() 
{
    this.name="name";
    this.classes = {};
}

 /**
  * This method loads and parses a JavaScript file to the application and returns a promise once the file is completely parsed.
  * This method must be used before using any of the other methods.
  *<br><br><b>Example:</b><br>
  *<font style="font-family:Courier">
  *doc.load('//www.visineat.com/js/vn/windows-2.js').then(function(){...}).catch(function(){..});
  *<br></font>
  * @param url A string containing the path to the script file.
  * @return VNPromise A promise object that indicates when the JS file is finished parsing. 
  */
  

Documentation.prototype.load=function(url)
{   
  var p=new VNPromise(this);

  var doc=this;
  this.classes = {};
    
  this.url = url;
  this.setName(url);
    
  vn.http(url).then(function(request)
  {
     var s = request.responseText;
     s = s.replace(/(\r\n|\n|\r)/g, "\n");
     var arr = s.split(".prototype.");
     
     var className = "";
     var methodName = "";
     var methodBody="";
     
    for(var i = 1; i != arr.length; ++i)
    {
      var firstHalf = arr[i-1];
      var secondHalf = arr[i];
      
      className = doc.parseClassName(firstHalf);
      var classNamePos = firstHalf.lastIndexOf(className);
      
      firstHalf = firstHalf.slice(0,classNamePos);
      var comment = doc.parseComment(firstHalf);
      
      
      if(comment != false && comment !== null)
      {
        methodName = doc.getMethodName(secondHalf);
        methodBody = doc.getMethodBody(secondHalf);
        
        if(className in doc.classes)//If this class has already been delt with
        {
          var c = doc.classes[className];
          c.addMethod(methodName,comment,methodBody);
        }
        else//If this is the first time we've seen the class
        {
          var c = new JSClass(className);
          
          try{
            //Constructor for specific definition types
            var constructor = doc.searchForConstructor(className,s,c);
          }catch(e){console.log('Error regarding '+c);console.log(e);}
          
          if(constructor != false)
          {
            c.setConstructor(constructor);
          }
  
          c.addMethod(methodName,comment,methodBody);
          doc.classes[className] = c;
        }
      }
    }
    doc.searchForVNExtend(s);
    doc.searchForFunctionClone(s);
    p.callThen();
   }).catch(function(){
     p.callCatch();
   });
  
  return p;
};

/**
 * Prints out relevant information about every public class in the documentation and its corresponding methods.    
 * @param  container A div container that will display information about the classes and methods.
 */
Documentation.prototype.print=function(container)
{
  for(c in this.classes)
  {
    this.classes[c].print(container,true);
  }
};

/**
 * Returns all JSClasses from the documentation inside of an associative array.  
 * @return AssociativeArray An associative array storing the JSClasses as elements, and its name as the indices. 
 */
Documentation.prototype.getClasses=function()
{
  return this.classes;
};


/**
 * Returns a JSClass from the documentation with the given name. 
 * @param name A string indicating the name of desired class. 
 * @return JSClass The JSClass object that was requested. 
 */
Documentation.prototype.getClass=function(name)
{
    var classes = this.classes; //Array where fields:name of class, values: JSClass Objects
    return this.classes[name];
};

Documentation.prototype.setName=function(url)
{
  var s = url.split('/');
  var name = s[s.length-1];
  
  this.name = name;
};

Documentation.prototype.parseClassName=function(str)
{
      var mystr = "";
      for(var j = str.length - 1; j != -1; --j)//Iterate through the character backwards.
      {
      var c = str.charAt(j);//Get the current character
      if( c== '}' || c  == ' ' || c.indexOf("\n") == 0) //If the current character is a } or a space or a new line
      {
        break; //The class name has been written to mystr, this works because of javascript syntaxt, which is Classname.prototpye.methodName = function()
      }
      else
      {
        mystr = c + mystr;//If it isn't one of those characters it is part of the class name, so append the character to the front of mystr
      } 
    }
      return mystr;
};

Documentation.prototype.searchForConstructor=function (className,text,parent_class)
{
  //Find string 'function className ('
  //Note: Spacing count is ignored
  var regex = new RegExp('function\\s*' + className + '\\s*\\(');
  var arr = text.split(regex);

  //When no split occurred
  if(arr.length<=1)
  {
    //Split using other type of class definition - 'var className = function('
    regex = new RegExp('var\\s*' + className + '\\s*\\=\\s*function\\s*\\(');
    arr = text.split(regex);
  }
  
  var comment = this.parseComment(arr[0]);
  var arrBody =arr[1].split('/**'); 
  arrBody =arrBody[0].split(className+'.prototype'); 
  var body = this.getMethodBody(arrBody[0]); 
  
  if(comment == false || comment === null || comment === undefined)
  {
    return false;
  }
  
  var ret = new JSMethod(className,comment,body,parent_class);
  return ret;
};

Documentation.prototype.searchForVNExtend=function(text)
{
  var str = "vn.extend";
  var arr = text.split(str);
  
  for(var j=1; j<arr.length; j++) // Iterate through all extend method calls
  {
    var strWithParams = arr[j]; 
    
    var first;
    var second;
    
    var i = 0;
    
    //Skip over first open bracket, or spaces before first param
    while(strWithParams[i]=='(' || strWithParams[i]==' ')
    {
      i++;
    }
    
    //Find first param
    var start = i;
    var end;
    while(strWithParams[i]!="," && strWithParams[i]!=' ')
    {
      i++;
    }
    end = i;
    first = strWithParams.substring(start,end);
    
    //Skip over comma or any spaces after first param
    while(strWithParams[i]==',' || strWithParams[i]==' ')
    {
      i++;
    }
    
    //Find second param
    start = i;
    while(strWithParams[i]!=")" && strWithParams[i]!=' ')
    {
      i++;
    }
    end = i;
    second = strWithParams.substring(start,end);
    this.extendClass(first, second);
  }
};

Documentation.prototype.extendClass=function(superclass,subclass)
{
  if(this.classes[superclass]&&this.classes[subclass])
  {
    vn.default(this.classes[subclass].getMethods(),this.classes[superclass].getMethods());
    this.classes[subclass].extends_class=this.classes[superclass];
  }
};

Documentation.prototype.searchForFunctionClone=function(text)
{
  //Given documentation text, find any function prototypes that are cloned
  //Example: CloudTreeFolderObject.prototype.glue=CloudTreeFileObject.prototype.glue;
  //Or GLObject.prototype.setTRI=GLObject.prototype.setTriangles
  //Note: optional amount of spaces allowed between = 
  
  //Use of regex and replace function allows for global search, and function call per match
  var regex = new RegExp('\\w+.prototype.\\w+\\s*\\=\\s*\\w+.prototype.\\w+','g');
  var doc = this;
  text.replace(regex, function(str){
    //Remove any spaces
    str = str.replace(' ','');
    
    //Split assignment 
    var arr = str.split('=');

    //Parse left and right side
    var left = arr[0];
    var arrayL = left.split('.prototype.');
    var classL = arrayL[0];
    var methodL = arrayL[1];
  
    var right = arr[1]; 
    var arrayR= right.split('.prototype.');
    var classR = arrayR[0];
    var methodR= arrayR[1];
  
    //Both classes must be documented, in addition to the method on the RHS 
    if(doc.classes[classL] && doc.classes[classR] && doc.classes[classR].getMethod(methodR)){
    
    //Note: capital letter denotes object type, lower case denotes string type
    var MethodsR =  doc.classes[classR].getMethods();
    var MethodsL = doc.classes[classL].getMethods();
    var MethodR = MethodsR[methodR];
    
    //Create left method
    MethodsL[methodL] = new JSMethod(methodL, MethodR.comment, MethodR.body, doc.classes[classL]);
    return str;
    }
  });
};

Documentation.prototype.parseComment=function(text)//This text is everything from before the ClassName on up
{
  var l = text.length;
  var i = 0;
  for(i = l -1; i != -1; --i)//Iteration through the string character by charater backwards
  {
    var c = text.charAt(i);
    if(c.lastIndexOf("\n") == 0|| c == "/"  || c == " ") //If char is a new line, a space, or a foward slash continue on
    {
      if(c == "/")//If its a foward slash
      {
        if(i > 3 && text.charAt(i-1).localeCompare('*') == 0)//Make sure that it isn't the third (because there needs to be space for '/**') character in the whole string, and make sure that the previous char is an asterick.
        {
          break; //We know that this is where the end of the comment is, so we break out of the loop so we can make sure there is a '/**' before it. 
        }
        else //This is an improper comment and should not have made it past the compiler
        {
          return false;
        }
      }
    }
      else
      {// if it wasn't a new line, a space, or a foward slash, that means that there was not a comment before this method. Meaning its a private method. Return False.
        return false;
      }
  }
  
  text = text.slice(0,i-1);//get rid of everything including and after the '*/'
  var ind = text.lastIndexOf("/**");// get the last index of '/**', call it ind
  
  if(ind != -1) //if '/**' is in the string, the continue
  {
    text = text.slice(ind + 3,text.length);//get everything past the '/**', set it to text
    if(text.indexOf("*/") != -1) //if text contains a closing comment brace, then this was an improper comment, and shouldn't have gotten past the compiler. Because there is an unclosed comment somewhere
    {
      return false;
    }
  }
  else //if '/**' isn't in the string, then return false, it's an improper comment, and shouldn't have gotten past the compiler
  {
    return false;
  }
  var arr = text.split("\n");//split on the new lines
  var retarr = [];
  
  for(var j = arr.length -1; j != -1; --j) // iterate backwards through the comment
  {
    var s = arr[j]; //get the current string, call it s
    s = s.trim(); ///trim off all extra white space
    var c = s.charAt(0); //get the first character, call it s
    if(c == '*')// if the first character is a *
    { 
      s = s.slice(1,s.length); //get everything from past the asterick
      retarr.push(s);
    }
    else
    {
      retarr.push(s);
    }
  }   
  
  return retarr;
};

Documentation.prototype.getMethodName=function(text)
{
    var mystr = "";
  for(var j = 0; j != text.length; ++j)
  {
    var c = text.charAt(j);
    if( c== '=' || c  == ' ')
    {
      break;
    }
    else
    {
      mystr = mystr + c  ;
    } 
  }
  return mystr;
};

Documentation.prototype.getMethodBody=function(text)
{
  var withoutComment = text.split("/**");
  var body = withoutComment[0];
  
  var openBracketIndex = 0;
  var closeBracketIndex = text.length;
  
  while(body[openBracketIndex]!='{')
  {
      openBracketIndex++;
  }
  
  var scope_counter=1;
  closeBracketIndex=openBracketIndex+1;
  
  while(scope_counter>0 && closeBracketIndex<body.length)
  {
       if(body[closeBracketIndex]=='{') 
       {
        scope_counter++;
       }
       else if(body[closeBracketIndex]=='}') 
      {
        scope_counter--;
      }
       closeBracketIndex++;
  }
  
  body = body.substring(openBracketIndex+1,closeBracketIndex-1); //exclusive of brackets
  return body;
};

Documentation.prototype.getParams=function(text)
{
  var params = [];
  var strings = text.split("(");//Splits the string from '('
  var par = strings[1];//Since the strings before '(' aren't the params, disregard them and get the take the string after '(' and call it "par"

  var currpar = "";
  for(var j = 0; j != par.length; ++j) //Iterate through 'par' char by char
  {
    var c = par.charAt(j);//get the current char, call it c
    if( c == ')')//If c is a closing parenthesis
    {
      if(currpar != "")//if the current parameter is empty, this means that there were no parameters, so don't push the current params onto the list.
      {
        params.push(currpar);
      }
      break; //break since this is the last param
    }
    if(c == ",") //If c is a comma
    {
      params.push(currpar); //push whatever was written to the temp param [currpar] into the params variable, because the parameter is over
      currpar = ""; //set the temp param to blank.
    }
    else if( c != ' ')//if it isn't a comma, then add it to the current param, unless it is a space. This is because params can be set up like this (p1 , p2); and we want to disregard the space before and after the comma
    {
      currpar += c;
    }
  }
  return params;
};

Documentation.prototype.getName=function()
{
  return this.name;
};


/**
 * This class represents a public class in the documentation and should be used with the Documentation class.  
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * var JSClass = doc.getClass('GLCamera'); <br>
 * JSClass.print(container);
 * <br></font>
 * @param name A string containing JSClass name.
 */
function JSClass(name){
  this.name = name;
  this.methods = {};
}

/**
 * Prints out all relevant information about the class and the methods belonging to it.   
 * @param container A div container in which the information about the class is placed in. 
 * @param collapsed An boolean that specifies if the information about the methods will initially be collapsed or displayed. (Optional argument)
 */
JSClass.prototype.print=function(container,collapsed)
{
  if(typeof this.constructor_method==='undefined')return;
  
  var cl=document.createElement('div');
  cl.className='Class';
  container.appendChild(cl);
  var clsp=document.createElement('div');
  clsp.className='ClassTitleSpan';
  clsp.innerHTML=this.name+' Class';
  if(this.extends_class)
   clsp.innerHTML+=' (extends '+this.extends_class.name+')';
  cl.appendChild(clsp);
  
  var bodyContainer = document.createElement('div');
  bodyContainer.className = "bodyContainer";
  vn.set(bodyContainer.style,{display:'flex',flexDirection:'row'});
  container.appendChild(bodyContainer);
  
  
  var toc=document.createElement('div');
  vn.set(toc.style,{display:'inline-block',width:'20%',overflowX:'hidden'});
  this.printMethodList(toc);
  bodyContainer.appendChild(toc);
  
  var main=document.createElement('div');
  vn.set(main.style,{flex:1,maxWidth:'80%'});
  bodyContainer.appendChild(main);
  
  this.printConstructor(main);
  this.printMethods(main,collapsed);
};


/**
 * Returns an array of JSMethods belonging to the current class.
 * @return AssociativeArray An associative array that contains JSMethod objects as elements and the methods' name as the indices.   
 */
JSClass.prototype.getMethods=function()
{
    return this.methods;
};

/**
 * Returns a JSMethod object with the given name. 
 * @param name A string indicating the name of the desired method. 
 * @return JSMethod The JSMethod object that was requested.
 */
JSClass.prototype.getMethod=function(name)
{
  var method = this.methods[name];
    return method;
};

JSClass.prototype.printClassName=function(container)
{
       var div = document.createElement('div');
       div.className = "Class";
       
       var innerDiv = document.createElement('div');
       innerDiv.className = "ClassSpan";
       innerDiv.innerHTML = this.name;
       
       container.appendChild(div);
       div.appendChild(innerDiv); 
};

JSClass.prototype.printMethodList=function(container)
{
  var methods=this.sortMethods(); // Alphabetizes this.method before printing any method info
  
       var div = document.createElement('div');
       div.className = "TOC";
       
     var title = document.createElement('div');
    vn.set(title.style,{display:'block',fontSize:'20px',fontWeight:700,marginBottom:'5px'});
    title.innerHTML='Public methods';
     div.appendChild(title);
     var self=this;
       for(var m in methods)
       {
    var method = this.methods[m].getName();
     
    var span = document.createElement('div');
    if(this.methods[m].getParent()==this)span.className='method_button';
    else span.className='method_button_extended';
    span.mthd=method;
    
    span.addEventListener('click',function(event){
      self.expandMethods();
      window.location='#'+event.target.mthd;
    },false);
    
    var span2 = document.createElement('div');
    span2.className='method_button_name';
    span2.innerHTML = method;
    span2.mthd=method;
    span.appendChild(span2);
    
    div.appendChild(span);
    container.appendChild(div); 
       }
};

JSClass.prototype.collapseMethods=function()
{
  if(this._circleButton)
  {
    if(this._circleButton.circleImage_cb.clicked==false)
    {
    this._circleButton.container.removeChild(this._circleButton.tableBody);
    this._circleButton.circleImage_cb.clicked = true;
    }
  }
};

JSClass.prototype.expandMethods=function()
{
  if(this._circleButton)
  {
    if(this._circleButton.circleImage_cb.clicked==true)
    {
    this._circleButton.container.appendChild(this._circleButton.tableBody);
    this._circleButton.circleImage_cb.clicked = false;
    }
  }
};

JSClass.prototype.printTitleBar=function(container,title,tableBody,collapsed)
{
  var cb = document.createElement("div");
  var cbspan = document.createElement("div");
  var circleImage_cb = new Image();
  
  cb.className = cb.className + "Methods";
  cbspan.className = cbspan.className + "ClassSpan";
  cbspan.className = cbspan.className + " fmHeader";
  circleImage_cb.className = circleImage_cb.className + "circleImage";
  
  cbspan.innerHTML = title;
  circleImage_cb.src = "//www.visineat.com/js/img/down.png";
  circleImage_cb.clicked = false;
  if(collapsed) circleImage_cb.clicked = true;
  
  container.appendChild(cb);
  cb.appendChild(circleImage_cb);
  cb.appendChild(cbspan);
  if(title=='Methods')
    this._circleButton={container:container,circleImage_cb:circleImage_cb,tableBody:tableBody};

  circleImage_cb.onclick = function(){
    if(circleImage_cb.clicked){
      container.appendChild(tableBody);
      circleImage_cb.clicked = false;
    }else{
      container.removeChild(tableBody);
      circleImage_cb.clicked = true;
    }
  };
};

JSClass.prototype.printConstructor=function(container)
{
  var c = this.constructor_method;
  
  var fmContainer = document.createElement("div");
  fmContainer.className = "fmContainer";
  container.appendChild(fmContainer);
  
  
  var tableBody = document.createElement('div');
  tableBody.className = "tableBody";
  
  var title = "Constructor";
  this.printTitleBar(fmContainer,title,tableBody);

  fmContainer.appendChild(tableBody);
  c.print(tableBody,this);

};

JSClass.prototype.sortMethods=function()
{
  //Sort by method name
  var methodNames = new Array();
  for(var m in this.methods)
  {
    methodNames.push(m);
  }
  methodNames.sort();
  
  //Create new assoc. arry using name + objects in this.method
  var sortedMethods = {};
  for(var i=0; i<methodNames.length ; i++)
  {
    var m = methodNames[i]; // Gets name of method in order
    sortedMethods[m] = this.methods[m];
  }
  
  //Update this.methods
  //this.methods = sortedMethods;
  return sortedMethods;
};

JSClass.prototype.printMethods=function(container,collapsed)
{
  if(this.methods.length!=0)
  {
    var fmContainer = document.createElement("div");
    fmContainer.className = "fmContainer";
    container.appendChild(fmContainer);
    
    var tableBody = document.createElement('div');
    tableBody.className = "tableBody";
    
    var title = "Methods";
    this.printTitleBar(fmContainer,title,tableBody,collapsed);
  
    if(collapsed){}else fmContainer.appendChild(tableBody);

    for(var m in this.methods)
    {
      this.methods[m].print(tableBody,this);
    }
  }
};

JSClass.prototype.setConstructor=function(constructor_method)
{
  this.constructor_method = constructor_method;
};

JSClass.prototype.addMethod=function(methodName,comment,body)
{
  var method = new JSMethod(methodName,comment,body,this);
  this.methods[methodName] = method;  
};

JSClass.prototype.getName = function()
{
  return this.name; 
};

JSClass.prototype.getConstructor=function()
{
  return this.constructor_method; 
};


/**
 * This class represents a public method in the documentation and should be used with JSClass.   
 * <br><br><b>Example:</b><br><font style="font-family:Courier">
 * var JSClass = doc.getClass('VNFile'); <br>
 * var JSMethod = JSClass.getMethod('load');<br>
 * JSMethod.print(container);
 * <br></font>
 * @param name A string with the name of the method.
 * @comment A string with the comment about the method.
 * @body A string containing the source code of the method.
 * @param parent_class A JSClass object representing the parent class of this method.  
 */
function JSMethod(name,comment,body,parent_class) 
{
  this.name = name;
  this.parent_class=parent_class;
  this.comment = comment;
  this.body = body;
  
    this.params = [];
    this.return;
    this.signatureLine="";
    this.description="";
  
  this.getFormattedDescription();
}

/**
 * Prints out all relevant information about the method. 
 * @param container A div container that displays information about the method.
 * @param subclass The JSClass object that this method is a subordinate to. (Optional argument)
 */
JSMethod.prototype.print=function(container,subclass)
{
  var linkSpan = document.createElement('span');
  vn.set(linkSpan.style,{width:'0px',height:'0px'});
  linkSpan.innerHTML = '<a name="'+this.name+'"></a>';
  container.appendChild(linkSpan);
  
  var fm = document.createElement('div');
  fm.className = 'fm';
  container.appendChild(fm);
  
  if(subclass&&subclass.constructor_method==this){}
  else
  {
  var returnSpan = document.createElement('span');
  returnSpan.className= "text Type";
  returnSpan.innerHTML = this.getReturnType();
  fm.appendChild(returnSpan);
  }
  
  var name = document.createElement('span');
  name.className= "text methodname";
  name.innerHTML = " "+this.getName()+" ";
  fm.appendChild(name);
  
  var params = document.createElement('span');
  params.className = 'text params';
  params.innerHTML = this.getParamNames();
  fm.appendChild(params);
  
  if(subclass && this.getParent() && this.getParent()!=subclass)
  {
    var inh = document.createElement('span');
    inh.className = 'text inherited';
    inh.innerHTML = 'inherited from '+this.parent_class.name;
    fm.appendChild(inh);
  }
  
  //Description
  var descont = document.createElement('div');
  descont.className = 'descont';
  fm.appendChild(descont);
  
  var description = document.createElement('span');
  description.className = "text description";
  description.innerHTML = this.getFormattedDescription(subclass);
  descont.appendChild(description);
  
  var color1='#000000';
  var color2='#ffa500';
  
  var button_div=document.createElement('div');
  vn.set(button_div.style,{position: 'absolute',right:'20px',bottom:'15px',cursor:'pointer',
    padding: '2px 3px',
    backgroundColor: color1,
    display: 'inline-block',
    borderRadius: '14px',
    boxShadow: 'inset 0 3px 2px rgba(255,255,255,.22), inset 0 -3px 2px rgba(0,0,0,.17), inset 0 20px 10px rgba(255,255,255,.12), 0 0 4px 1px rgba(0,0,0,.1), 0 3px 2px rgba(0,0,0,.2)'});
   
   var name_div=document.createElement('div');
   vn.set(name_div.style,{position: 'relative',
    marginLeft: '5px',
  marginRight: '5px',
    fontWeight: '700',
    width: 'auto',
    display: 'inline-block',
    color: color2,
    fontFamily: 'Arial',
    fontSize: '14px',
    textDecoration: 'none'/*,
   textShadow: '0px 1px 0px #f1fdf1'*/});
   name_div.innerHTML='Open Source Code';
   button_div.appendChild(name_div);
  
  fm.appendChild(button_div);
  
  var code_container = document.createElement('div');
  vn.set(code_container.style,{padding:'0px 40px 20px 40px',position:'relative'});
  fm.appendChild(code_container);
  
  var pre_container = document.createElement('div');
  vn.set(pre_container.style,{width:'100%',position:'relative', maxHeight:'300px', display:'none',overflowY:'scroll',borderRadius:'8px',backgroundColor:'#2f3640'});
  code_container.appendChild(pre_container);
  var self=this;
  button_div.addEventListener('click',function(){
    
    if(pre_container.style.display=='none')
    {
      pre_container.style.display='block';
    button_div.style.display='none';
      pre_container.innerHTML='<pre class="prettyprint linenums" style="width:100%">'+self.getBody().replace(/\</g,"&lt;").replace(/\>/g,"&gt;")+'</pre>';
      PR.prettyPrint();
    }
    else pre_container.style.display='none';
  },false);
};

/**
 * Returns the parent class of this method as a JSClass object.
 * @return JSClass The JSClass object that was requested.
 */
JSMethod.prototype.getParent=function(){return this.parent_class;};


JSMethod.prototype.getName=function() 
{
    return this.name;
};

JSMethod.prototype.getBody=function() 
{
    return this.body;
};

JSMethod.prototype.getParamNames=function()
{
  var len = this.params.length;
  if(len==0)
  {
    var empty ="()";
    return empty;
  }
  else
  {
    var pString="(";
    
    for(var i=0; i<len;i++)
    {
      pString += this.params[i].name;
      
      if(len>1 && i!=(len-1)) // If more than 1 param
      {
        pString += ",";
      }
    }
    pString += ")";
  } 
  return pString;
};

JSMethod.prototype.getSignatureLine=function() 
{
  var pString = this.getParamNames();
  var rString = this.getReturnType();
  this.signatureLine +=  rString + " " + this.name + pString ;

    return this.signatureLine;
};

JSMethod.prototype.getParams=function()
{
  return this.params;
};

JSMethod.prototype.getReturnType=function()
{ 
  return this.return.type;
};

JSMethod.prototype.getDescription=function()
{
  return this.description;
};

JSMethod.prototype.getFormattedDescription=function(subclass)
{
  var comment=this.comment;
  var line = "";
  var tempDescription = "";
  var tempParams = "";
  var returnDescription = "";
  var commentLength = comment.length;
  var returnObject = new Object();
  
  for(var j = 0; j != commentLength; ++j)
  {//Iterate through the comment
    line = comment[commentLength - j - 1];//We need to read the lines in backwards because they were put in backwards
    var hasAt = line.indexOf("@");//See if this line contains an '@' symbol
    if(hasAt != -1)
    {//If it does
      if(line.indexOf("param ") != -1)
      {//Check and see if it is a "param" with a space after it, because someone could put '@param' with nothing after it
        line = line.substring(hasAt + 6, line.length);//Read in the param description, starting after the @param
        line = line.trim();
        var myparam = "";
        var spaceIndex = line.indexOf(" ");// Find the first instance of a blank space 
        if(spaceIndex == -1)
        {//If there were no instances of a blank space, then make the params the entire line. This works because we trimmed the extra white space off of the ends earlier
          myparam = line.substring(0,line.length);
          line = "";//The rest of the description is nothing, because since there was no white space there is no description.
        }
        else
        {
          myparam = line.substring(0,spaceIndex);//If there was, then the param only goes up to that white space
          line = line.substring(spaceIndex + 1 , line.length);//The rest of the description, is the rest of the string.
          line = line.trim();
        }
        
        var param = new Object();
        param.name = myparam;
        param.description = line;
        
        this.params.push(param);
        
        if(line != "")
        { 
          line = " - " + line;
        }
        
        tempParams += ("<p style='text-indent: 4em;'><div class='input_var'><div class='input_var_name'>" + myparam + "</div></div>" + line + "</p>");
        
      }
      else if(line.indexOf("return ") != -1)
      {//Check if its a return with a space after it, because someone could put '@return' with nothing after it
        line = line.substring(hasAt + 7, line.length);//Read in the return description, starting after the @return
        line = line.trim();//Trim it, just in case of extra white space.
        var spaceIndex = line.indexOf(" ");// Find the first instance of a blank space 
        if(spaceIndex == -1)
        {//If there were no instances of a blank space, then make the returnType the entire line. This works because we trimmed the extra white space off of the ends earlier
          returnObject.type = line.substring(0,line.length);
          line = "";//The rest of the description is nothing, because since there was no white space there is no description.
        }
        else
        {
          returnObject.type = line.substring(0,spaceIndex);//If there was, then the return type only goes up to that white space
          line = line.substring(spaceIndex + 1 , line.length);//The rest of the description, is the rest of the string.
          line = line.trim();
        }
        
        returnObject.description = line;
        
        if(line != "")
        {
          line = " - " + line;
        }
    
        returnDescription += "<p style='text-indent: 4em;'><div class='return'><div class='return_name'>" + returnObject.type + "</div></div>" + line + "</p>";//The whole line should be the return description.
      }
    }
    else
    {// If it contains no '@' symbol
      tempDescription += line;
    }
  }
  if(tempParams == "")
  {//If there were no @params
    tempParams ="<p style='text-indent: 4em;'><i>" + "none" + "</i></p>";
  }
  if(returnDescription == "")
  {// If there was no @return
    returnObject.type="void";
    returnObject.description='';
    returnDescription ="<p style='text-indent: 4em;'><div class='return'><div class='return_name'>" + "void" + "</div></div></p>";
  }
  
  this.return = returnObject;

  this.description = tempDescription;
  var ret="<br>" + tempDescription + "<br><br><b> Input parameters: </b><br>" + tempParams;
  if(subclass&&subclass.constructor_method==this){}
  else ret+="<b> Returns: </b><br>" + returnDescription;
  return ret;
};

