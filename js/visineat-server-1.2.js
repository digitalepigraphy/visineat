/* V1.2
 * Author(s): Angelos Barmpoutis, Tanvir Talukder, Luke Richter
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

//--------------------------------------------------------------------------------------
/**
 * This class creates and controls a real-time multi-user network session. It generates three easy-to-use classes of objects VNSession, VNUser, and VNVariable that let you program any type of synchronous multi-user network interaction using only minimal client-side JavaScript coding, without any server-side programming. By using this class, you can program the logic of one client/user. If you run the same web application in many devices (or many browsers/tabs in a single device) a real-time multi-user network will be created.<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var server=new VNServer();<br>
 * server.onConnectionOpened=function(){<br>
 *		server.joinFirstAvailableSession(2,true);<br>
 *	};<br>
 * server.onSelfJoinedSession=function(session) {...};<br>
 * server.connect('type here a unique name for your application');<br></font>
 */
function VNServer() {
	this.ws = null;
	this.server_id="";
	
	this._me=new VNUser(this,null);
	
	this.sessions = {};
	this.currentSession = null;

	this.server = null;
	this.commandHandler = null;
	this.attempts_to_reconnect=0;
}
//--------------------------------------------------------------------------------------

VNServer.prototype.waitForSocketConnection = function(callback) {
	var self = this;
	setTimeout(
	        function() {
				if(self.ws == null) return;
			
	            if(self.ws.readyState === 1) {
	                // connection is open
	                if(callback != null) {
	                    callback();
	                }
	                return;
	            } 
				else if(self.ws.readyState === 3) {
					// connection is closed
					return;
				}
				else {
	                // wait for connection
	                self.waitForSocketConnection(callback);
	            }

	        }, 5); // wait 5 milliseconds for the connection
};

// Main Methods
//--------------------------------------------------------------------------------------
/**
 * This method establishes a multi-user network connection for your web application. If the connection is successful, the callback method VNServer.onConnectionOpened() will be called, which you may set before establishing the connection.
 * @param unique_app_title A string with a unique title for your application.
 * @param secure_connection An optional boolean parameter to enable secure connection. The default value is false. 
 */
VNServer.prototype.connect = function(unique_app_title,secure_connection) {
	/*if(!("WebSocket" in window)) {
		alert("WebSocket is not supported by your browser");
		return;
	}*/
	if(typeof secure_connection==='undefined' && ('https:' == document.location.protocol)) secure_connection=true;
	this.url='ws://www.visineat.com:80/ws';
	if(typeof secure_connection!=='undefined' && secure_connection==true)
		this.url='wss://www.visineat.com:443/ws';
	
	this.server=new VNServerConfig(this);
	var self=this;
	this.server.getServerStatusData(function()
	{
		if(!self.server.isRunning()) {
			console.log("Web socket is not running");
			return;
		}
	});
		self.commandHandler = new VisiNeatCommandHandler(self);
		self.server_id=unique_app_title;
		
		//var websocket_port = self.server.getWebSocketPort();
		self.ws = new WebSocket(self.url);
		self.ws.binaryType = 'arraybuffer';
		
		self.ws.onopen = function() {
			self._onopen();
		};
		self.ws.onmessage = function(message) {
			self._onmessage(message);
		};
		self.ws.onclose = function() { 
			self._onclose();
			self.ws = null;
		};
		self.ws.onerror = function(error) {
			self._onerror(error);
		};
	//});
};

VNServer.prototype.send = function(request) {
	var self = this;
	if(self.ws != null) {
		this.waitForSocketConnection(function() {
			self.ws.send(request);
			if(	!(Object.prototype.toString.call(request) === "[object Int8Array]") &&
				!(Object.prototype.toString.call(request) === "[object ArrayBuffer]")) {
				//console.log("Request: " + request);
			}
		});
	}
	else {
		console.log("WebSocket connection has not been established");
	}
};

/**
 * This method disconnects your application from the multi-user network.
 */
VNServer.prototype.disconnect = function() {
	var self = this;
	if(self.ws != null) {
		this.waitForSocketConnection(function() {
			self.ws.close();
			self.ws = null;
		});
	}
	else {
		console.log("WebSocket connection was never established");
	}
};
//--------------------------------------------------------------------------------------



// WebSocket Event Handling Methods
//--------------------------------------------------------------------------------------
VNServer.prototype._onopen = function() {
	//console.log("Connection established");
	this.send("C$"+this.server_id);
};

VNServer.prototype._onmessage = function(message) {
	if(message.data instanceof ArrayBuffer) {
		if(message.data.byteLength==0)return;
		 var dv = new DataView(message.data);
		 var stream_id=dv.getUint8(0);
		 var user_id=dv.getUint16(1);
		 
		 if(this.currentSession)//in case this message came before the construction of the session
		 {
		 if(user_id==0)
		 {
			var s=this.currentSession.stream(stream_id);
			if(!s.lossless)this.send('G$F$'+stream_id+'$'+user_id);//Request Next Frame
			s.v=message.data.slice(3);
			//console.log(dv.getUint8(8)+' '+dv.getUint8(9)+' '+dv.getUint8(10)+' '+dv.getUint8(11)+' '+dv.getUint8(12)+' '+dv.getUint8(13));
			s.onFrameReceived(s,null);
		 }
		 else
		 {	 
			var u=this.currentSession.users[user_id];
			if(u)//in case this message came before the construction of the user
			{
				var s=u.stream(stream_id);
				if(!s.lossless)this.send('G$F$'+stream_id+'$'+user_id);//Request Next Frame
				s.v=message.data.slice(3);
				this.me().stream(stream_id).onUsersFrameReceived(u,s,u);
			}
			else this.send('G$F$'+stream_id+'$'+user_id);//Request Next Frame
		 }
		 }
		 else this.send('G$F$'+stream_id+'$'+user_id);//Request Next Frame
		 
		//c.println(user_id+' '+stream_id+' '+message.data.byteLength);
	}
	else { //if(typeof message.data === "string")
		//console.log("Command: " + message.data);
		var tokens = message.data.split("$");
		var commandName = tokens[0];
		
		if(commandName == "c") {
			this.send("c");
		}
		else if(commandName == "N") {
			this.commandHandler.handleNew(tokens);
		}
		else if(commandName == "S") {
			this.commandHandler.handleSet(tokens);
		}
		else if(commandName == "A") {
			this.commandHandler.handleAvailable(tokens);
		}
		else if(commandName == "J") {
			this.commandHandler.handleJoinedSession(tokens);
		}
		else if(commandName == "D") {
			this.commandHandler.handleDelete(tokens);
		}
		else if(commandName == "F") {
			this.commandHandler.handleFinished(tokens);
		}
		else if(commandName == "E") {
			console.log("Command: " + message.data);
			this.commandHandler.handleError(tokens);
		} 
		else if(commandName == "C") {
			this.commandHandler.handleConnected(tokens);
		}
	}
};

VNServer.prototype._onerror = function(error) {
	console.log(error);
};

VNServer.prototype._onclose = function() {
	this.ws=null;
	if(this.attempts_to_reconnect<9)
	{
		this.attempts_to_reconnect+=1;
		this.connect(this.server_id);
	}
	else
	{
		this.attempts_to_reconnect=0;
		this.onConnectionClosed();
	}
};
//--------------------------------------------------------------------------------------
/**
 * This method returns the user object of the user running this instance of your web application.
 * @return VNUser The user object of the current user.
 */
VNServer.prototype.me=function(){return this._me;};

/**
 * This method returns the session object of the current session joined by the user. It is null if the user has currently not joined any session.
 * @return VNSession The session object of the current session.
 */
VNServer.prototype.getSession=function(){return this.currentSession;};

/**
 * This method returns the index of the available sessions.
 * @return AssociativeArray An associative array with the session objects of the currently available sessions. As an associative array it can be searched using statements like: for(var session in server.getSessions())... 
 */
VNServer.prototype.getSessions=function(){return this.sessions;};

/**
 * This method creates a new multi-user network session and it is automatically joined by the user running this instance of your web application.
 * @param sessionName A string with a unique name for the new session.
 * @param capacity The maximum number of users that can join the new session. If the capacity is set to zero, no limit is imposed to the number of users.
 * @param hold_positions A boolean flag that indicates if a user's position is held after leaving from this session, thus limiting the number of available seats for new users. For example in a 2-player chess application, if one player leaves, then an incoming new player should not be allowed to join the game. The flag can be false if the seat is released when a user leaves this session, thus creating one more free seat for a new user to join. 
 */
VNServer.prototype.createAndJoinNewSession = function(sessionName, capacity, hold_positions) {
	if(isValidName(sessionName)) {
		if(!this.currentSession) {
			this.send("N$S$" + sessionName+"$"+capacity+"$"+hold_positions); 
		}
		else {
			alert("Error: User must leave current session before creating a new session");
		}
	}
	else {
		alert("Error: Session names can only contain letters, numbers, spaces, and underscores");
	}
};

/**
 * With this method, the user running this instance of your web application requests to join an existing multi-user network session.
 * @param sessionName A string with the unique name of the session to be joined.
 */
VNServer.prototype.joinSession = function(sessionName) {
	if(!this.currentSession) {
		this.send("J$S$" + sessionName);
	}
	else {
		alert("Error: User must leave current session before joining another session");
	}
};

/**
 * With this method, the user running this instance of your web application requests to join the first available session, or otherwise create a new one (as specified by the two input arguments) if there are no available sessions, or all existing sessions are full. 
 * @param capacity The maximum number of users that can join the new session, if a new session is created. If the capacity is set to zero, no limit is imposed to the number of users.
 * @param hold_positions A boolean flag that indicates if a user's position is held after leaving from this session, thus limiting the number of available seats for new users. For example in a 2-player chess application, if one player leaves, then an incoming new player should not be allowed to join the game. The flag can be false if the seat is released when a user leaves this session, thus creating one more free seat for a new user to join. 
 */
VNServer.prototype.joinFirstAvailableSession = function(capacity,hold_positions) {
	if(!this.currentSession) {
		this.send("J$F$" +capacity+"$"+hold_positions);
	}
	else {
		alert("Error: User must leave current session before joining another session");
	}
};

/**
 * With this method, the user running this instance of your web application requests to leave from the current session.
 */
VNServer.prototype.leaveSession = function() {
	if(this.currentSession) {
		this.send("L");
	}
	else {
		alert("Error: User must join a session before leaving a session");
	}
};

VNServer.prototype.promoteToAdmin = function(userName, userId) {
	if(this._me._isAdmin && this.currentSession) {
		this.send("S$A$" + userId + "$" + userName);
	}
	else {
		alert('Error: client does not have permission to promote others');
	}
};
VNServer.prototype.demoteFromAdmin = function(userName, userId) {
	if(this._me._isAdmin && this.currentSession) {
		this.send("S$U$" + userId + "$" + userName);
	}
	else {
		alert('Error: client does not have permission to demote others');
	}
};

//--------------------------------------------------------------------------------------

// Requests made by API
//--------------------------------------------------------------------------------------
VNServer.prototype.getInitialSessions = function() {
	this.send("G$S");
};
VNServer.prototype.getInitialUsersInSession = function() {
	this.send("G$U");
};
//--------------------------------------------------------------------------------------

isValidName = function(name) {
	var validInput = /^[0-9a-zA-Z _]+$/;
	if(name.match(validInput)) {
		return true;
	}
	return false;
};

VNServer.prototype.isSessionNameValid = function(name) {
	return isValidName(name);
};

VNServer.prototype.removeSessionFromSessionList = function(sessionId) {
	var s=null;
	if(sessionId in this.sessions)
	{
		s=this.sessions[sessionId];
		delete this.sessions[sessionId];
	}
	return s;
};
//--------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------


// Customizable Event Listeners
//--------------------------------------------------------------------------------------
/**
 * This is a callback function that is called when the connection is established. It is initially empty.
 */
VNServer.prototype.onConnectionOpened = function(){};
VNServer.prototype.onConnectionClosed = function(){};

VNServer.prototype.onSelfNameUpdated = function(user) {};
VNServer.prototype.onUserNameUpdated = function(user) {};

VNServer.prototype.onCreateNewSession = function(session) {};
VNServer.prototype.onNewSessionAvailable = function(session) {};
VNServer.prototype.onInitialSessionsAvailable = function(sessions) {};
VNServer.prototype.onNoAvailableSessions = function() {};
/**
 * This is a callback function that is called when the connection is established. It is initially empty.
 * @param session The session joined given as a VNSession object.
 */
VNServer.prototype.onSelfJoinedSession = function(session) {};
VNServer.prototype.onSessionRemoved = function(session) {};

VNServer.prototype.onUserPromotionSuccess = function(user) {};
VNServer.prototype.onUserDemotionSuccess = function(user) {};
VNServer.prototype.onSelfPromoted = function(user) {};
VNServer.prototype.onSelfDemoted = function(user) {};
VNServer.prototype.onUserPromoted = function(user) {};
VNServer.prototype.onUserDemoted = function(user) {};

VNServer.prototype.onWarning = function(warningName, description) {};
VNServer.prototype.onError = function(errorName, description) {};
//--------------------------------------------------------------------------------------
function VNServerConfig(VNServer) {
	this.client = VNServer;
	this.data = null;
}

VNServerConfig.prototype.getServerStatusData = function(callback) {
	var xmlhttp = new XMLHttpRequest();
	var self=this;
	xmlhttp.onreadystatechange=function()
  	{
		if (xmlhttp.readyState==4 && xmlhttp.status==200)
		{
			self.data=xmlhttp.response;
			callback();
		}
	};
	
	xmlhttp.open("GET",((this.client.url.indexOf('wss')==0) ? 'https:' : 'http:')+'//www.visineat.com/server',true);
	try{
	xmlhttp.send();
	}
	catch(err){console.log(err);}
};

VNServerConfig.prototype.isRunning = function() {
	if(this.data.indexOf('<running>true')!=-1) return true;
	else return false;
};

//-------------------
// CommandHandler Object
function VisiNeatCommandHandler(VNServer) {
	this.command = new VisiNeatCommand(VNServer);
}

VisiNeatCommandHandler.prototype.handleConnected = function(tokens) {
	this.command.connected(tokens[1]);
};

VisiNeatCommandHandler.prototype.handleNew = function(tokens) {
	if(tokens[1] == "s") { // N$s$id$name (NEW$SESSION$SESSION_ID$NAME$SESSION_NAME)
		var sessionId = tokens[2];
		var sessionName = tokens[4];
		
		this.command.newSession(sessionId, sessionName);
	}
	else if(tokens[1] == "S") { // N$S$id$name (NEW$SESSION_AVAILABLE$SESSION_ID$NAME$SESSION_NAME)
		var sessionId = tokens[2];
		var sessionName = tokens[4];
		
		this.command.newSessionAvailable(sessionId, sessionName);
	}
};

VisiNeatCommandHandler.prototype.handleSet = function(tokens) {
	if(tokens[1] == "F")//S$F$user_id$var_name$var_value$user_id (Set$user_Field_changed$user_id$var_name$var_value$user_id)
	{
		this.command.setUserFieldChanged(tokens[2],tokens[3],tokens[4],tokens[5]);
	}
	else if(tokens[1] == "S")//S$S$var_name$var_value$user_id (Set$session_Field_changed$var_name$var_value$user_id)
	{
		this.command.setSessionFieldChanged(tokens[2],tokens[3],tokens[4]);
	}
	else if(tokens[1] == "f")//S$f$var_name$var_value (Set$self_Field_changed$var_name$var_value)
	{
		this.command.setSelfFieldChanged(tokens[2],tokens[3]);
	}
	else if(tokens[1] == "I") { // S$I$id (Set$self_Id$id)
		this.command.setSelfIdChanged(tokens[2]);
	}
	else if(tokens[1] == "p") { // S$p$ie (SET$ADMIN_SUCCESS$USER_ID)
		this.command.setAdminSuccess(tokens[2]);
	}
	else if(tokens[1] == "d") { // S$d$id (SET$NON_ADMIN_SUCCESS$USER_ID)
		this.command.setNonAdminSuccess(tokens[2]);
	}
	else if(tokens[1] == "P") { // S$P$id (SET$USER_PROMOTED$USER_ID)
		this.command.setUserPromoted(tokens[2]);
	}
	else if(tokens[1] == "D") { // S$D$id (SET$USER_DEMOTED$USER_ID)
		this.command.setUserDemoted(tokens[2]);
	}
};

VisiNeatCommandHandler.prototype.handleAvailable = function(tokens) {
	// AVAILABLE$SESSION$SESSION_ID$SESSION_NAME
	if(tokens[1] == "S") { 
		var sessionId = tokens[2];
		var sessionName = tokens[3];
		
		this.command.availableSession(sessionId, sessionName);
	}
	// AVAILABLE$USER_ADMIN$USER_ID
	else if(tokens[1] == "A") { 
		var userId = tokens[2];
		
		this.command.availableUser(userId, true);
	}
	// AVAILABLE$USER_NONADMIN$USER_ID
	else if(tokens[1] == "U") { 
		var userId = tokens[2];
		
		this.command.availableUser(userId, false);
	}
};


VisiNeatCommandHandler.prototype.handleJoinedSession = function(tokens) {
	if(tokens[1] == "U") { // JOINED_SESSION$USER$USER_ID$NAME
		var userId = tokens[2];
		var userName = tokens[3];
		
		this.command.joinedSessionUser(userId, userName);
	}
	else { // JOINED_SESSION$SESSION_ID$SESSION_NAME
		var userId = tokens[1];
		var sessionId = tokens[2];
		var sessionName = tokens[3];
		
		this.command.joinedSession(userId, sessionId, sessionName);
	}
};

VisiNeatCommandHandler.prototype.handleDelete = function(tokens) { 
	if(tokens[1]=='S')//D$S$id (DELETE$Session$id)
		this.command.removeSession(tokens[2]);
	else if(tokens[1]=='U')//D$U$id (DELETE$User$id)
		this.command.deleteUser(tokens[2]);
};


VisiNeatCommandHandler.prototype.handleFinished = function(tokens) {
	if(tokens[1] == "S") { // F$S (FINISHED$SESSIONS)
		this.command.finishedSessions();
	}
	else { // F$U (FINISHED$USERS)
		this.command.finishedUsers();
	}
};

VisiNeatCommandHandler.prototype.handleWarning = function(tokens) { // WARNING$WARNING_NAME$COMMAND$COMMAND_NAME$REASON$Description of warning
	var warningName = tokens[1];
	var description = tokens[5];
	
	this.command.warning(warningName, description);
};

VisiNeatCommandHandler.prototype.handleError = function(tokens) { // ERROR$ERROR_NAME$REQUEST_NAME$Description of error
	var errorName = tokens[1];
	var description = tokens[3];
	
	this.command.error(errorName, description);
};
//------------------------
function VisiNeatCommand(VNServer) {
	this.client = VNServer;
}

VisiNeatCommand.prototype.connected = function(serverId)
{
	this.client._me.server_id=this.client._me._Id;//save original 16digit ID
	this.client.onConnectionOpened();
	this.client.getInitialSessions();
}


// NEW Command
//--------------------------------------------------------------------------------------
VisiNeatCommand.prototype.newSession = function(sessionId, sessionName) {
	var session = new VNSession(this.client, sessionId, sessionName);
	
	this.client.sessions[sessionId]=session;
	this.client._me._isAdmin = true;
	
	this.client.onCreateNewSession(session);
};

VisiNeatCommand.prototype.newSessionAvailable = function(sessionId, sessionName) {
	var session = new VNSession(this.client, sessionId, sessionName);
	
	this.client.sessions[sessionId]=session;
	
	this.client.onNewSessionAvailable(session);
};
//--------------------------------------------------------------------------------------
// SET Command
//--------------------------------------------------------------------------------------
VisiNeatCommand.prototype.setUserFieldChanged = function(userId, fieldName, fieldValue, initiatorId) {
	var user=this.client.currentSession.getUser(userId);
	var initiator=this.client.currentSession.getUser(initiatorId);
	var field=user.variable(fieldName);
	field._update(fieldValue,initiator);
	field.onValueChanged(field,initiator);
	this.client._me.variable(fieldName).onUsersValueChanged(user,field,initiator);
};
VisiNeatCommand.prototype.setSelfFieldChanged = function( fieldName, fieldValue) {
	var user=this.client._me;
	var initiator=user;
	var field=user.variable(fieldName);
	field._update(fieldValue,initiator);
	field.onValueChanged(field,initiator);
	this.client._me.variable(fieldName).onUsersValueChanged(user,field,initiator);
};
VisiNeatCommand.prototype.setSessionFieldChanged = function(fieldName, fieldValue, initiatorId) {
	var field=this.client.currentSession.variable(fieldName);
	var initiator=null;
	if(initiatorId!='NULL')	initiator=this.client.currentSession.getUser(initiatorId);
	field._update(fieldValue,initiator);
	field.onValueChanged(field,initiator);
};

VisiNeatCommand.prototype.setSelfIdChanged = function(userId) {
	this.client._me._Id = userId;
};

VisiNeatCommand.prototype.setAdminSuccess = function(userId) {
	var user=this.client.currentSession.promoteToAdmin(userId);
	this.client.onUserPromotionSuccess(user);
};

VisiNeatCommand.prototype.setNonAdminSuccess = function(userId) {
	var user=this.client.currentSession.demoteFromAdmin(userId);
	this.client.onUserDemotionSuccess(user);
};

VisiNeatCommand.prototype.setUserPromoted = function(userId) {
	if(userId == this.client._me._Id) {
		this.client._me._isAdmin = true;
		//this.client.currentSession.promoteToAdmin(userId);	
		this.client.onSelfPromoted(this.client._me);
	}
	else {
		var user=this.client.currentSession.promoteToAdmin(userId);
		this.client.onUserPromoted(user);
	}
};

VisiNeatCommand.prototype.setUserDemoted = function(userId) {
	if(userId == this.client._me._Id) {
		this.client._me._isAdmin = false;
		//this.client.currentSession.demoteFromAdmin(userId);	
		this.client.onSelfDemoted(this.client._me);
	}
	else {
		var user=this.client.currentSession.demoteFromAdmin(userId);
		this.client.onUserDemoted(user);
	}
};
//--------------------------------------------------------------------------------------



// AVAILABLE Command
//--------------------------------------------------------------------------------------
VisiNeatCommand.prototype.availableSession = function(sessionId, sessionName) {
	var session = new VNSession(this.client, sessionId, sessionName);
	this.client.sessions[sessionId]=session;
};

VisiNeatCommand.prototype.availableUser = function(userId, isAdmin) {
	var user = this.client.currentSession.getUser(userId);
	user._isAdmin = isAdmin;
	this.client.currentSession.onUserJoinedSession(user);
};
//--------------------------------------------------------------------------------------



// JOINED Command
//--------------------------------------------------------------------------------------
VisiNeatCommand.prototype.joinedSessionUser = function(userId, userName) {
	var user = new VNUser(this.client,userId, userName);
	this.client.currentSession.users[userId] = user;
	
	this.client.currentSession.onUserJoinedSession(user);
};

VisiNeatCommand.prototype.joinedSession = function(userId, sessionId, sessionName) {
	var session = new VNSession(this.client, sessionId, sessionName);
	this.client.me()._Id=userId;
	this.client.currentSession = session;
	this.client.getInitialUsersInSession();
	
	this.client.onSelfJoinedSession(session);
};
//--------------------------------------------------------------------------------------



// DELETE Command
//--------------------------------------------------------------------------------------
VisiNeatCommand.prototype.deleteUser = function(userId) {
	
	
	if(userId == this.client._me._Id) {
		var s=this.client.currentSession;
		this.client.currentSession = null;
		this.client._me._isAdmin = false;
		s.onSelfLeftSession();
	}
	else {
		var user = this.client.currentSession.getUser(userId);
		this.client.currentSession.removeUserFromCurrentSession(userId);
		this.client.currentSession.onUserLeftSession(user);
	}
};
//--------------------------------------------------------------------------------------



// REMOVE Command
//--------------------------------------------------------------------------------------
VisiNeatCommand.prototype.removeSession = function(sessionId) {
	var session=this.client.removeSessionFromSessionList( sessionId);
	this.client.onSessionRemoved(session);
};

//--------------------------------------------------------------------------------------



// FINISHED Command
//--------------------------------------------------------------------------------------
VisiNeatCommand.prototype.finishedSessions = function() {
	this.client.onInitialSessionsAvailable(this.client.sessions);
};

VisiNeatCommand.prototype.finishedUsers = function() {
	this.client.currentSession.onInitialUsersInSessionAvailable(this.client.currentSession.users);
};
//--------------------------------------------------------------------------------------

// WARNING Command
//--------------------------------------------------------------------------------------
VisiNeatCommand.prototype.warning = function(warningName, description) {
	this.client.onWarning(warningName, description);
};
//--------------------------------------------------------------------------------------



// ERROR Command
//--------------------------------------------------------------------------------------
VisiNeatCommand.prototype.error = function(errorName, description) {
	this.client.onError(errorName, description);
};
//--------------------------------------------------------------------------------------
/**
 * This class implements a real-time multi-user network session. Objects of this class are created by a VNServer object and can be accessed using the following methods: server.getSession() or server.getSessions()<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * for(var session_id in server.getSessions()) {<br>
 * var session=server.getSessions()[session_id];<br>
 * console.log(session.name);}<br></font>
 */
function VNSession(client,session_id, session_name) {
	this.client=client;
	this.id = session_id;
	this.name = session_name;
	this.users = {};
	this.fields={};
	this.data_streams={};
}
/**
 * This method returns the user object of a specific user in this session.
 * @param userId A string with the user ID of the requested user.
 * @return VNUser The requested user object.
 */
VNSession.prototype.getUser = function(userId)
{
	if(typeof this.users[userId] === "undefined")
	{
		if(this.client.me().id()==userId)	this.users[userId]=this.client.me();
		else this.users[userId]=new VNUser(this.client,userId);
	}
	return this.users[userId];
};
/**
 * This method returns the index of the users in this session.
 * @return AssociativeArray An associative array with the VNUser objects in this session. As an associative array it can be searched using statements like: for(var user_id in session.getUsers()) var user=session.getUsers()[user_id]; ... 
 */
VNSession.prototype.getUsers=function(){return this.users;};
/**
 * This method returns the variable object of a specific session variable. If there is not such a variable, a new variable is created and returned.
 * @param name A string with the name of the requested variable.
 * @return VNVariable The requested variable of this session.
 */
VNSession.prototype.variable = function(name)
{
	if(typeof this.fields[name] === "undefined")
	{
		this.fields[name]=new VNVariable(this.client,name,null,this);
	}
	return this.fields[name];
};
/**
 * This method returns the index of the session variables.
 * @return AssociativeArray An associative array with the VNVariable objects of this session. As an associative array it can be searched using statements like: for(var name in session.variables())console.log(name);
 */
VNSession.prototype.variables=function(){return this.fields;};

/**
 * This method returns the stream object of a specific session stream. If there is not such a stream, a new stream is created and returned.
 * @param id An integer with the id of the requested stream.
 * @return VNStream The requested stream of this session.
 */
VNSession.prototype.stream = function(id)
{
	if(typeof this.data_streams[id] === "undefined")
	{
		this.data_streams[id]=new VNStream(this.client,id,null,this);
	}
	return this.data_streams[id];
};
/**
 * This method returns the index of the session streams.
 * @return AssociativeArray An associative array with the VNStream objects of this session. As an associative array it can be searched using statements like: for(var stream_id in session.streams())console.log(stream_id);
 */
VNSession.prototype.streams=function(){return this.data_streams;};

VNSession.prototype.onUserJoinedSession = function(user) {};
VNSession.prototype.onSelfLeftSession = function() {};
VNSession.prototype.onUserLeftSession = function(user) {};
VNSession.prototype.onInitialUsersInSessionAvailable = function(users) {};

//--------------------------------------------------------------------------------------



// Command Helper Functions
//--------------------------------------------------------------------------------------
VNSession.prototype.removeUserFromCurrentSession = function( userId) {
	if(userId in this.users) {
			delete this.users[userId];
			//console.log(userId);
		}
};

VNSession.prototype.promoteToAdmin = function(userId) {
	var user=this.getUser(userId);
	user._isAdmin = true;
	return user;
};

VNSession.prototype.demoteFromAdmin = function(userId) {
	var user=this.getUser(userId);
	user._isAdmin = false;
	return user;
};

//--------------------------------------------------------------------------------------
/**
 * This class controls the information of a user in a real-time multi-user network session. Objects of this class are created by a VNServer object and can be accessed using the following methods: server.me(), session.getUser(), or session.getUsers()<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var session=server.getSession();<br>
 * for(var user_id in session.getUsers())<br>
 *		var user=session.getUsers()[user_id];<br></font>
 */
function VNUser(client,userId) {
	this._client=client;
	this._Id = userId;
	this._isAdmin = false;
	this._fields={};
	this._data_streams={};
}
/**
 * This method returns the ID of this user.
 * @return String The ID of this user.
 */
VNUser.prototype.id=function(){return this._Id;};
/**
 * This method returns the variable object of a specific user variable. If there is not such a variable, a new variable is created and returned.
 * @param name A string with the name of the requested variable.
 * @return VNVariable The requested variable of this user.
 */
VNUser.prototype.variable = function(name)
{
	if(typeof this._fields[name] === "undefined")
	{
		this._fields[name]=new VNVariable(this._client,name,this,null);
	}
	return this._fields[name];
};
/**
 * This method returns the index of the user variables.
 * @return AssociativeArray An associative array with the VNVariable objects of this user. As an associative array it can be searched using statements like: for(var name in user.variables())console.log(name);
 */
VNUser.prototype.variables=function(){return this._fields;};
/**
 * This method returns the stream object of a specific user stream. If there is not such a stream, a new stream is created and returned.
 * @param id An integer with the id of the requested stream.
 * @return VNStream The requested stream of this user.
 */
VNUser.prototype.stream = function(id)
{
	if(typeof this._data_streams[id] === "undefined")
	{
		this._data_streams[id]=new VNStream(this._client,id,this,null);
	}
	return this._data_streams[id];
};
/**
 * This method returns the index of the user streams.
 * @return AssociativeArray An associative array with the VNStream objects of this user. As an associative array it can be searched using statements like: for(var stream_id in user.streams())console.log(stream_id);
 */
VNUser.prototype.streams=function(){return this._data_streams;};

/**
 * This class implements a variable that is automatically synced in a real-time multi-user network session. Network variables of this class are created by VNUser or VNSession objects and can be accessed using the following methods: user.variable() or session.variable()<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var session=server.getSession();<br>
 * var game_score=session.variable('score');<br>
 * game_score.onValueChanged=function(v,u){<br>
 * console.log('The game score is now: '+v.value());<br>
 * };<br>
 * game_score.set(0);<br></font>
 */
function VNVariable(client,name,user,session)
{
	this.client=client;
	this.name=name;
	this.v='';
	this.user=user;
	this.session=session;
	this.callbacks=[];
	this._skip=-1;
	//interpolation staff:
	this.counter=0;
	this.p_v='';//this is the previous interpolated point and not the previous value of the variable.
	this.interp_i=0;
}


VNVariable.prototype._parseValue=function(fieldValue)
{
	if(fieldValue.indexOf('[')==0 || fieldValue.indexOf('{')==0)
	{
		this.v=eval(fieldValue);
	}
	else this.v=fieldValue;
	
};

/**
 * This method interpolates the numerical values of variables received by remote users. It should not be used for your own (i.e. the local user's) variables. The interpolated value is stored at the user's object if this is a user variable (e.g. a_user.position) or at the session's objet if this is a session variable (e.g. my_session.game_score). 
 * @skip An integer that indicates how many frames were not broadcasted by the user. This value should match the skip value used when broadcasting the data, e.g.: a_variable.broadcast({skip:10});
 */
VNVariable.prototype.interpolate=function(skip)
{
	if(this.counter<2)return;
	var w=1;
	if(skip)w=this.interp_i/(skip+5);//skip+1 is the correct value (1 frame to show plus #skip to skip). Here we increased the factor by 4 frames as a buffer to show continuous motion until the next frame arrives. In the future this could be defined as a percentage of #skip i.e. .../(skip+1+skip*0.4)  which is equal to .../(1+skip*(1.4))
	if(w>1)return;
	
	var n=0;
	if(this.v.constructor === Array)
	{
		n=new Array(this.v.length);
		for(var i=0;i<this.v.length;i++)
			n[i]=this.v[i]*w+this.p_v[i]*(1-w);
	}
	else n=this.v*w+this.p_v*(1-w);
	
	if(this.user)this.user[this.name]=n;
	else this.session[this.name]=n;
	
	this.interp_i+=1;
	
};

VNVariable.prototype._update=function(value,initiator)
{
	this.counter+=1;
	this.interp_i=0;
	if(this.user)
		this.p_v=this.user[this.name];
	else this.p_v=this.session[this.name];
	this._parseValue(value);
	if(initiator!=this.client._me)
	{
		if(this.user)
			this.user[this.name]=this.v;
		else this.session[this.name]=this.v;
	}		
	else{
		var f=this.callbacks.shift();
		if(f)f(this);
	}
};
/**
 * This method sets a new value to this variable. The new value is automatically broadcasted to all users of the current session. Example: me.variable('position').set([1,2,1.3]);
 * @param value The new value to be set.
 * @param callback An optional callback function that will be called when this assignment is fulfilled and the value has been broadcasted.
 */
VNVariable.prototype.set=function(value,callback)
{
	if(typeof value!=='string') {
		if(this.user) this.user[this.name]=value;
		else this.session[this.name]=value;
		this.broadcast(null,callback);return;
		}
		
	if(typeof callback === "undefined")
		this.callbacks.push(null);
	else this.callbacks.push(callback);
	if(this.user) 
	{
		//this.user._parseValue(this.name,value);
		this.client.send('S$F$'+this.user._Id+'$'+this.name+'$'+value);
	}
	else this.client.send('S$S$'+this.name+'$'+value);
};
/**
 * This method changes the value to this variable by a given increment. When this method is used, the value of the variable is assumed to be numerical. The change is automatically broadcasted to all users of the current session.
 * @param increment The increment by which the value will be changed. (It can also be negative.)
 * @param callback An optional callback function that will be called when this change is fulfilled and has been broadcasted to the users of this session.
 */
VNVariable.prototype.changeBy=function(increment,callback)
{
	if(typeof callback === "undefined")
		this.callbacks.push(null);
	else this.callbacks.push(callback);
	if(this.user) 
		this.client.send('S$f$'+this.user._Id+'$'+this.name+'$'+increment);
	else this.client.send('S$s$'+this.name+'$'+increment);
};
/**
 * This method broadcasts the value of this variables to all users of the current session. The value is read from the user's object if this is a user variable (e.g. a_user.position) or from the session's objet if this is a session variable (e.g. my_session.game_score)
 * @param opt An object with one or more of the following options: decimals (how many decimal points should be broadcasted), skip (how many data frames should be skipped in order to minimize the bandwidth). Example: my_position.broadcast({decimals:2,skip:10});
 * @param callback An optional callback function that will be called when this request is fulfilled and the data frame has been broadcasted to the users of this session.
 */
VNVariable.prototype.broadcast=function(opt,callback){
	var v=null;
	if(this.user)v=this.user[this.name];
	else v=this.session[this.name];
	if(v!==null)
	{
		if(opt && opt.skip)
		{
			this._skip+=1;
			if(this._skip % (opt.skip+1)!=0)return false;
		}
		if(v.constructor === Array)
		{
			var s='[';
			if(opt && opt.decimals)
			{
				s+=v[0].toFixed(opt.decimals);
				for(var i=1;i<v.length;i++)
					s+=','+v[i].toFixed(opt.decimals);
				s+=']';
			}
			else s+=v+']';
			this.set(s,callback);
		}
		else if(typeof v === 'number'){
			var s='';
			if(opt && opt.decimals)
				s=v.toFixed(opt.decimals);
			else s=''+v;
			this.set(s,callback);
		}
		else if(typeof v==='string')
		{
			this.set(v,callback);
		}
		else console.log('ATTEMPTING TO BROADCAST DATA OF UNKNOWN TYPE');
		return true;
	} else return false;
};

/**
 * This method returns the current value of this variable.
 * @return String The value of this variable.
 */
VNVariable.prototype.value=function(){return this.v;};
/**
 * This method returns the current value of this variable as a number.
 * @return float The value of this variable.
 */
VNVariable.prototype.num=function(){return (this.v.length==0)?0:parseFloat(this.v);};
/**
 * This is a callback function that is called when the value of this variable is changed. It is initially empty.
 * @param variable The current VNVariable object that has been changed.
 * @param user The VNUser object of the user who initiated this change.
 */
VNVariable.prototype.onValueChanged=function(variable,user){};

/**
 * This is a callback function that is called when the value of the corresponding variable of any user is changed. It is initially empty.
 * @param user The VNUser object of the user whose variable was changed.
 * @param variable The current VNVariable object that has been changed.
 * @param initiator The VNUser object of the user who initiated this change.
 */
VNVariable.prototype.onUsersValueChanged=function(user,variable,initiator){};

/**
 * This class implements a binary data stream that is broadcasted in a real-time multi-user network session. Data stream objects of this class are created by VNUser or VNSession objects and can be accessed using the following methods: user.stream() or session.stream()<br><br>
 * <b>Example:</b><br><font style="font-family:Courier">
 * var session=server.getSession();<br>
 * var AUDIO=1;
 * var audio_stream=session.stream(AUDIO);<br>
 * audio_stream.onFrameReceived=function(f,u){...};<br>
 * audio_stream.addFrame(my_new_data_frame);<br></font>
 */
function VNStream(client,id,user,session)
{
	this.client=client;
	this._id=id;
	this.v=null;
	this.user=user;
	this.session=session;
	this.packed_frame=new ArrayBuffer(0);
	this.lossless=false;
}

VNStream.prototype.id=function(){return this._id;};

VNStream.USER_ID_SIZE=2; //in bytes

VNStream.prototype._pack_frame=function(data)
{
	if(this.packed_frame.byteLength!=data.byteLength+1+VNStream.USER_ID_SIZE)
	{	
		this.packed_frame=new ArrayBuffer(data.byteLength+1+VNStream.USER_ID_SIZE);
		var dv=new DataView(this.packed_frame);
		dv.setUint8(0,this._id);
		if(this.user) dv.setUint16(1,this.user.id());
		else dv.setUint16(1,0);
	}
	var dv=new DataView(this.packed_frame);
	var j=this.packed_frame.byteLength;
	if(data.constructor === Float32Array)
		for(var i=data.length-1;i>=0;i--) {j-=4;dv.setFloat32(j,data[i]);}
	else if(data.constructor === Uint16Array)
		for(var i=data.length-1;i>=0;i--) {j-=2;dv.setUint16(j,data[i]);}
	else if(data.constructor === Int8Array)
		for(var i=data.length-1;i>=0;i--) {j-=1;dv.setInt8(j,data[i]);}
	else if(data.constructor === Int16Array)
		for(var i=data.length-1;i>=0;i--) {j-=2;dv.setInt16(j,data[i]);}
	else if(data.constructor === Int32Array)
		for(var i=data.length-1;i>=0;i--) {j-=4;dv.setInt32(j,data[i]);}
	else if(data.constructor === Uint8Array)
		for(var i=data.length-1;i>=0;i--) {j-=1;dv.setUint8(j,data[i]);}
	else if(data.constructor === Uint32Array)
		for(var i=data.length-1;i>=0;i--) {j-=4;dv.setUint32(j,data[i]);}
	else if(data.constructor === Float64Array)
		for(var i=data.length-1;i>=0;i--) {j-=8;dv.setFloat64(j,data[i]);}
	
	//console.log(dv.getUint8(8)+' '+dv.getUint8(9)+' '+dv.getUint8(10)+' '+dv.getUint8(11)+' '+dv.getUint8(12)+' '+dv.getUint8(13));
			
}

/**
 * This method adds a new data frame to this stream. The new frame is automatically broadcasted to all users of the current session.
 * @param data The new data frame to be broadcasted.
 */
VNStream.prototype.addFrame=function(data)
{
	this._pack_frame(data);
	if(this.user) 
		this.client.send(this.packed_frame.slice(0));//slice is used because chrome is keeping only the reference of the ArrayBuffer, and may wait for a couple of them before sending them. If we do not use slice here, the data entries of the last frame will be streamed multiple times instead of the previous frames.
	else this.client.send(this.packed_frame.slice(0));
};

/**
 * This method returns the last frame received from this stream.
 * @return ArrayBuffer The last data frame of this stream.
 */
VNStream.prototype.frame=function(){return this.v;};

VNStream.prototype.losslessReception=function(flag){
	
	if(flag==this.lossless)return;
	
	var flg='T';
	if(flag==true)
	{	flg='T'; this.lossless=true;}
	else if(flag==false)
	{	flg='F'; this.lossless=false;}
	if(this.user)
		this.client.send('G$F$'+this._id+'$'+this.user.id()+'$'+flg);//Request Next Frame
	else this.client.send('G$F$'+this._id+'$0$'+flg);//Request Next Frame

};

/**
 * This method returns the last frame received from this stream as a Float32Array.
 * @return Float32Array The last data frame of this stream.
 */
VNStream.prototype.frameAsFloat32Array=function(){
	var data=new Float32Array((this.v.byteLength-1-VNStream.USER_ID_SIZE)/4);
	var dv=new DataView(this.v);
	var j=this.v.byteLength;
	for(var i=data.length-1;i>=0;i--) {j-=4;data[i]=dv.getFloat32(j);}
	return data;
};

/**
 * This method returns the last frame received from this stream as a Uint16Array.
 * @return Uint16Array The last data frame of this stream.
 */
VNStream.prototype.frameAsUint16Array=function(){
	var data=new Uint16Array((this.v.byteLength-1-VNStream.USER_ID_SIZE)/2);
	var dv=new DataView(this.v);
	var j=this.v.byteLength;
	for(var i=data.length-1;i>=0;i--) {j-=2;data[i]=dv.getUint16(j);}
	return data;
};

/**
 * This is a callback function that is called when a new data frame of this stream has been received. It is initially empty.
 * @param stream The VNStream object that received the frame.
 * @param user The VNUser object of the user who broadcasted this frame.
 */
VNStream.prototype.onFrameReceived=function(stream,user){};

/**
 * This is a callback function that is called when a new data frame of the corresponding stream of any user received a frame. It is initially empty.
 * @param user The VNUser object of the user whose stream received the frame.
 * @param variable The current VNStream object that received the frame.
 * @param initiator The VNUser object of the user who broadcasted this frame.
 */
VNStream.prototype.onUsersFrameReceived=function(user,stream,initiator){};