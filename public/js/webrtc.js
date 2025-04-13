// WebRTC functionality for video and audio calls (frontend only)
document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const videoCallButton = document.querySelector('.video-call-button');
  const audioCallButton = document.querySelector('.audio-call-button');
  
  // WebRTC variables
  let localStream = null;
  let remoteStream = null;
  let peerConnection = null;
  let activeCall = null;
  
  // Mock Socket.io for signaling
  const socket = mockSocketIO();
  
  // Initialize event listeners
  if (videoCallButton) {
    videoCallButton.addEventListener('click', () => initiateCall('video'));
  }
  
  if (audioCallButton) {
    audioCallButton.addEventListener('click', () => initiateCall('audio'));
  }
  
  // Socket event listeners for signaling
  socket.on('call-offer', handleCallOffer);
  socket.on('call-answer', handleCallAnswer);
  socket.on('ice-candidate', handleIceCandidate);
  socket.on('call-end', handleCallEnd);
  
  // Functions
  async function initiateCall(type) {
    try {
      // Create call UI
      createCallUI(type, true);
      
      // Get user media
      const constraints = {
        audio: true,
        video: type === 'video'
      };
      
      localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Display local stream
      const localVideo = document.getElementById('local-video');
      if (localVideo) {
        localVideo.srcObject = localStream;
      }
      
      // Create peer connection
      createPeerConnection();
      
      // Add local stream to peer connection
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
      
      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      // Send offer to remote peer via signaling server
      socket.emit('call-offer', {
        type: type,
        offer: offer,
        to: 'remote-user-id' // In a real app, this would be the actual user ID
      });
      
      // Set active call
      activeCall = {
        type: type,
        status: 'calling',
        remoteUser: {
          id: 'remote-user-id',
          name: document.querySelector('.chat-header h4')?.textContent || 'User',
          avatar: document.querySelector('.chat-header img')?.src || ''
        }
      };
      
      // Simulate call being answered after delay
      simulateCallAnswer();
      
    } catch (error) {
      console.error('Error initiating call:', error);
      endCall();
    }
  }
  
  function createPeerConnection() {
    // Configuration with STUN servers (would include TURN servers in production)
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };
    
    peerConnection = new RTCPeerConnection(configuration);
    
    // Handle ICE candidates
    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          to: 'remote-user-id' // In a real app, this would be the actual user ID
        });
      }
    };
    
    // Handle connection state changes
    peerConnection.onconnectionstatechange = event => {
      switch(peerConnection.connectionState) {
        case 'connected':
          console.log('Connection established');
          break;
        case 'disconnected':
        case 'failed':
          console.log('Connection lost');
          endCall();
          break;
        case 'closed':
          console.log('Connection closed');
          break;
      }
    };
    
    // Handle incoming tracks
    peerConnection.ontrack = event => {
      remoteStream = event.streams[0];
      const remoteVideo = document.getElementById('remote-video');
      if (remoteVideo) {
        remoteVideo.srcObject = remoteStream;
      }
    };
  }
  
  async function handleCallOffer(data) {
    // Create call UI
    createCallUI(data.type, false);
    
    // Show incoming call notification
    showIncomingCallNotification(data);
  }
  
  async function acceptCall(data) {
    try {
      // Get user media
      const constraints = {
        audio: true,
        video: data.type === 'video'
      };
      
      localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Display local stream
      const localVideo = document.getElementById('local-video');
      if (localVideo) {
        localVideo.srcObject = localStream;
      }
      
      // Create peer connection
      createPeerConnection();
      
      // Add local stream to peer connection
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
      
      // Set remote description from offer
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
      
      // Create answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      // Send answer to remote peer via signaling server
      socket.emit('call-answer', {
        answer: answer,
        to: data.from
      });
      
      // Set active call
      activeCall = {
        type: data.type,
        status: 'connected',
        remoteUser: {
          id: data.from,
          name: document.querySelector('.chat-header h4')?.textContent || 'User',
          avatar: document.querySelector('.chat-header img')?.src || ''
        }
      };
      
      // Update call UI
      updateCallUI('connected');
      
    } catch (error) {
      console.error('Error accepting call:', error);
      endCall();
    }
  }
  
  async function handleCallAnswer(data) {
    try {
      // Set remote description from answer
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
      
      // Update active call
      if (activeCall) {
        activeCall.status = 'connected';
      }
      
      // Update call UI
      updateCallUI('connected');
      
    } catch (error) {
      console.error('Error handling call answer:', error);
      endCall();
    }
  }
  
  async function handleIceCandidate(data) {
    try {
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }
  
  function handleCallEnd() {
    endCall();
  }
  
  function endCall() {
    // Close peer connection
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
    
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }
    
    // Reset active call
    activeCall = null;
    
    // Remove call UI
    removeCallUI();
    
    // Notify remote peer
    socket.emit('call-end', {
      to: 'remote-user-id' // In a real app, this would be the actual user ID
    });
  }
  
  function createCallUI(type, isOutgoing) {
    // Create call container
    const callContainer = document.createElement('div');
    callContainer.id = 'call-container';
    callContainer.className = 'fixed inset-0 bg-dark-900 bg-opacity-90 flex flex-col z-50';
    
    // Call header
    const callHeader = document.createElement('div');
    callHeader.className = 'p-4 flex justify-between items-center';
    
    // Call status
    const callStatus = document.createElement('div');
    callStatus.id = 'call-status';
    callStatus.className = 'text-white font-medium';
    callStatus.textContent = isOutgoing ? 'Calling...' : 'Incoming call...';
    
    // Call timer
    const callTimer = document.createElement('div');
    callTimer.id = 'call-timer';
    callTimer.className = 'text-white hidden';
    callTimer.textContent = '00:00';
    
    callHeader.appendChild(callStatus);
    callHeader.appendChild(callTimer);
    
    // Call content
    const callContent = document.createElement('div');
    callContent.className = 'flex-1 flex flex-col items-center justify-center p-4';
    
    // Remote user info
    const userInfo = document.createElement('div');
    userInfo.className = 'text-center mb-8';
    
    const avatar = document.createElement('div');
    avatar.className = 'w-24 h-24 rounded-full overflow-hidden mx-auto mb-4';
    
    const avatarImg = document.createElement('img');
    avatarImg.src = document.querySelector('.chat-header img')?.src || '';
    avatarImg.alt = 'User';
    avatarImg.className = 'w-full h-full object-cover';
    
    avatar.appendChild(avatarImg);
    
    const userName = document.createElement('h3');
    userName.className = 'text-white text-xl font-bold';
    userName.textContent = document.querySelector('.chat-header h4')?.textContent || 'User';
    
    userInfo.appendChild(avatar);
    userInfo.appendChild(userName);
    
    // Video container
    const videoContainer = document.createElement('div');
    videoContainer.id = 'video-container';
    videoContainer.className = type === 'video' ? 'w-full max-w-4xl relative' : 'hidden';
    
    // Remote video
    const remoteVideo = document.createElement('video');
    remoteVideo.id = 'remote-video';
    remoteVideo.className = 'w-full rounded-xl';
    remoteVideo.autoplay = true;
    remoteVideo.playsInline = true;
    
    // Local video
    const localVideoContainer = document.createElement('div');
    localVideoContainer.className = 'absolute bottom-4 right-4 w-1/4 rounded-xl overflow-hidden border-2 border-white';
    
    const localVideo = document.createElement('video');
    localVideo.id = 'local-video';
    localVideo.className = 'w-full';
    localVideo.autoplay = true;
    localVideo.playsInline = true;
    localVideo.muted = true;
    
    localVideoContainer.appendChild(localVideo);
    videoContainer.appendChild(remoteVideo);
    videoContainer.appendChild(localVideoContainer);
    
    // Call actions
    const callActions = document.createElement('div');
    callActions.className = 'flex justify-center space-x-4 mt-8';
    
    // Mute button
    const muteButton = document.createElement('button');
    muteButton.id = 'mute-button';
    muteButton.className = 'w-14 h-14 rounded-full bg-dark-700 flex items-center justify-center text-white hover:bg-dark-600 transition-all';
    muteButton.innerHTML = '<i class="fas fa-microphone"></i>';
    muteButton.addEventListener('click', toggleMute);
    
    // Video button (only for video calls)
    const videoButton = document.createElement('button');
    videoButton.id = 'video-button';
    videoButton.className = type === 'video' ? 'w-14 h-14 rounded-full bg-dark-700 flex items-center justify-center text-white hover:bg-dark-600 transition-all' : 'hidden';
    videoButton.innerHTML = '<i class="fas fa-video"></i>';
    videoButton.addEventListener('click', toggleVideo);
    
    // End call button
    const endCallButton = document.createElement('button');
    endCallButton.id = 'end-call-button';
    endCallButton.className = 'w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-all';
    endCallButton.innerHTML = '<i class="fas fa-phone-slash"></i>';
    endCallButton.addEventListener('click', endCall);
    
    callActions.appendChild(muteButton);
    callActions.appendChild(videoButton);
    callActions.appendChild(endCallButton);
    
    // Incoming call actions (only for incoming calls)
    const incomingCallActions = document.createElement('div');
    incomingCallActions.id = 'incoming-call-actions';
    incomingCallActions.className = isOutgoing ? 'hidden' : 'flex justify-center space-x-4 mt-8';
    
    // Accept call button
    const acceptCallButton = document.createElement('button');
    acceptCallButton.className = 'w-14 h-14 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-all';
    acceptCallButton.innerHTML = '<i class="fas fa-phone"></i>';
    acceptCallButton.addEventListener('click', () => {
      // Hide incoming call actions
      incomingCallActions.classList.add('hidden');
      
      // Show call actions
      callActions.classList.remove('hidden');
      
      // Accept call
      acceptCall({
        type: type,
        from: 'remote-user-id',
        offer: {} // In a real app, this would be the actual offer
      });
    });
    
    // Reject call button
    const rejectCallButton = document.createElement('button');
    rejectCallButton.className = 'w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-all';
    rejectCallButton.innerHTML = '<i class="fas fa-phone-slash"></i>';
    rejectCallButton.addEventListener('click', endCall);
    
    incomingCallActions.appendChild(acceptCallButton);
    incomingCallActions.appendChild(rejectCallButton);
    
    // Assemble call UI
    callContent.appendChild(userInfo);
    callContent.appendChild(videoContainer);
    callContent.appendChild(callActions);
    callContent.appendChild(incomingCallActions);
    
    callContainer.appendChild(callHeader);
    callContainer.appendChild(callContent);
    
    // Add to body
    document.body.appendChild(callContainer);
    
    // Hide call actions for incoming calls
    if (!isOutgoing) {
      callActions.classList.add('hidden');
    }
  }
  
  function updateCallUI(status) {
    const callStatus = document.getElementById('call-status');
    const callTimer = document.getElementById('call-timer');
    
    if (callStatus) {
      callStatus.textContent = status === 'connected' ? 'Connected' : 'Calling...';
    }
    
    if (callTimer && status === 'connected') {
      callTimer.classList.remove('hidden');
      startCallTimer();
    }
  }
  
  function removeCallUI() {
    const callContainer = document.getElementById('call-container');
    if (callContainer) {
      document.body.removeChild(callContainer);
    }
  }
  
  function toggleMute() {
    if (!localStream) return;
    
    const audioTrack = localStream.getAudioTracks()[0];
    if (!audioTrack) return;
    
    audioTrack.enabled = !audioTrack.enabled;
    
    const muteButton = document.getElementById('mute-button');
    if (muteButton) {
      muteButton.innerHTML = audioTrack.enabled ? '<i class="fas fa-microphone"></i>' : '<i class="fas fa-microphone-slash"></i>';
    }
  }
  
  function toggleVideo() {
    if (!localStream) return;
    
    const videoTrack = localStream.getVideoTracks()[0];
    if (!videoTrack) return;
    
    videoTrack.enabled = !videoTrack.enabled;
    
    const videoButton = document.getElementById('video-button');
    if (videoButton) {
      videoButton.innerHTML = videoTrack.enabled ? '<i class="fas fa-video"></i>' : '<i class="fas fa-video-slash"></i>';
    }
  }
  
  function startCallTimer() {
    const callTimer = document.getElementById('call-timer');
    if (!callTimer) return;
    
    let seconds = 0;
    let minutes = 0;
    
    const timerInterval = setInterval(() => {
      seconds++;
      if (seconds === 60) {
        seconds = 0;
        minutes++;
      }
      
      const formattedMinutes = minutes.toString().padStart(2, '0');
      const formattedSeconds = seconds.toString().padStart(2, '0');
      
      callTimer.textContent = `${formattedMinutes}:${formattedSeconds}`;
      
      // Check if call is still active
      if (!activeCall) {
        clearInterval(timerInterval);
      }
    }, 1000);
  }
  
  function showIncomingCallNotification(data) {
    // Check if browser supports notifications
    if (!("Notification" in window)) return;
    
    // Check if permission is granted
    if (Notification.permission === "granted") {
      createCallNotification(data);
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(function (permission) {
        if (permission === "granted") {
          createCallNotification(data);
        }
      });
    }
  }
  
  function createCallNotification(data) {
    const notification = new Notification(`Incoming ${data.type} call`, {
      body: `from ${document.querySelector('.chat-header h4')?.textContent || 'User'}`,
      icon: document.querySelector('.chat-header img')?.src || '',
      requireInteraction: true
    });
    
    notification.onclick = function() {
      window.focus();
      this.close();
    };
  }
  
  function simulateCallAnswer() {
    // Simulate call being answered after delay
    setTimeout(() => {
      handleCallAnswer({
        answer: {},
        from: 'remote-user-id'
      });
    }, 3000);
  }
  
  // Mock Socket.io implementation (frontend only)
  function mockSocketIO() {
    const eventHandlers = {};
    
    return {
      on: function(event, callback) {
        if (!eventHandlers[event]) {
          eventHandlers[event] = [];
        }
        eventHandlers[event].push(callback);
      },
      
      emit: function(event, data) {
        // For frontend-only implementation, we'll simulate receiving the event
        setTimeout(() => {
          if (eventHandlers[event]) {
            eventHandlers[event].forEach(callback => {
              callback(data);
            });
          }
        }, 500);
      }
    };
  }
});
