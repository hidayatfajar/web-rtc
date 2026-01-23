/**
 * WebRTC Meeting Composable
 * Handles socket connection, WebRTC peer connections, and media streams
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { io, Socket } from 'socket.io-client'
import { useMeetingStore } from '~/stores/meeting'

interface Participant {
  socketId: string
  username: string
  isHost?: boolean
  isCoHost?: boolean
}

export const useWebRTC = (roomId: string, username: string, onToast?: (type: 'success' | 'error' | 'info' | 'warn', title: string, description?: string) => void) => {
  const store = useMeetingStore()
  
  // Socket & Connection
  let socket: Socket | null = null
  const isConnected = ref(false)
  
  // WebRTC Peers
  const peerConnections = new Map<string, RTCPeerConnection>()
  
  // Media Streams
  const localStream = ref<MediaStream | null>(null)
  const remoteStreams = ref<Map<string, MediaStream>>(new Map())
  const screenShareStreams = ref<Map<string, MediaStream>>(new Map())
  let localScreenStream: MediaStream | null = null
  
  // Track who is sharing
  let whoIsSharing = ref<string | null>(null)
  
  // Participants & Roles
  const participants = ref<Participant[]>([])
  const hostSocketId = ref<string | null>(null)
  const coHostSocketIds = ref<string[]>([])
  
  // Config
  const config = useRuntimeConfig()
  const SOCKET_URL = config.public.socketUrl || 'http://localhost:3001'
  
  const iceServers: RTCConfiguration = {
    iceServers: [
      // STUN (optional, buat dapat srflx)
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },

      // TURN UDP (utama buat relay)
      {
        urls: 'turn:turn.rekrutmen-traspac.web.id:3478?transport=udp',
        username: 'webrtcuser',
        credential: 'strongpassword123',
      },

      // TURN TCP fallback (kalau UDP diblok)
      {
        urls: 'turn:turn.rekrutmen-traspac.web.id:3478?transport=tcp',
        username: 'webrtcuser',
        credential: 'strongpassword123',
      },
    ]
  }

  /**
   * Initialize local media stream (camera + mic)
   */
  const initializeLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      // Disable tracks by default
      stream.getAudioTracks().forEach(track => track.enabled = false)
      stream.getVideoTracks().forEach(track => track.enabled = false)
      
      localStream.value = stream
      console.log('[WebRTC] Local stream initialized (media OFF by default):', stream.id)
      return stream
    } catch (error) {
      console.error('[WebRTC] Failed to get local stream:', error)
      throw error
    }
  }

  /**
   * Create peer connection for a remote user
   */
  const createPeerConnection = (remoteSocketId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(iceServers)
    
    // Add local camera tracks if available
    if (localStream.value) {
      const tracks = localStream.value.getTracks()
      if (tracks.length > 0) {
        console.log('[WebRTC] Adding', tracks.length, 'local camera tracks to PC for', remoteSocketId)
        tracks.forEach(track => {
          pc.addTrack(track, localStream.value!)
        })
      }
    }
    
    // Add screen share tracks if currently sharing
    if (localScreenStream && store.isScreenSharing) {
      console.log('[WebRTC] Adding screen share tracks to PC for', remoteSocketId)
      localScreenStream.getTracks().forEach(track => {
        pc.addTrack(track, localScreenStream!)
      })
    }
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc-ice-candidate', {
          roomId,
          candidate: event.candidate,
          targetId: remoteSocketId
        })
      }
    }
    
    // Handle remote stream
    pc.ontrack = (event) => {
      const stream = event.streams[0]
      const streamId = stream.id
      
      console.log('[WebRTC] Received remote track from:', remoteSocketId)
      console.log('[WebRTC] Stream ID:', streamId)
      console.log('[WebRTC] Stream has', stream.getVideoTracks().length, 'video,', stream.getAudioTracks().length, 'audio tracks')
      console.log('[WebRTC] whoIsSharing.value:', whoIsSharing.value)
      console.log('[WebRTC] Is this peer sharing?', whoIsSharing.value === remoteSocketId)
      
      // Logic from index-backup.vue:
      // First stream always goes to remoteStreams (camera)
      // Second stream with different ID goes to screenShareStreams (screen share)
      
      const existingCameraStream = remoteStreams.value.get(remoteSocketId)
      
      if (whoIsSharing.value === remoteSocketId && existingCameraStream && existingCameraStream.id !== streamId) {
        // This peer is sharing AND we already have their camera stream
        // This new stream with different ID must be screen share
        console.log('[WebRTC] Screen share stream from:', remoteSocketId, '(second stream, different ID)')
        screenShareStreams.value.set(remoteSocketId, stream)
        screenShareStreams.value = new Map(screenShareStreams.value)
      } else {
        // First stream OR same stream ID = camera stream
        console.log('[WebRTC] Camera stream from:', remoteSocketId)
        remoteStreams.value.set(remoteSocketId, stream)
        remoteStreams.value = new Map(remoteStreams.value)
      }
      
      console.log('[WebRTC] screenShareStreams size:', screenShareStreams.value.size)
      console.log('[WebRTC] remoteStreams size:', remoteStreams.value.size)
    }
    
    // Handle connection state
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state for ${remoteSocketId}:`, pc.connectionState)
    }
    
    peerConnections.set(remoteSocketId, pc)
    return pc
  }

  /**
   * Create and send offer to remote peer
   */
  const createOffer = async (remoteSocketId: string) => {
    try {
      const pc = createPeerConnection(remoteSocketId)
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      
      socket?.emit('webrtc-offer', {
        roomId,
        offer,
        targetId: remoteSocketId
      })
      
      console.log('[WebRTC] Offer sent to:', remoteSocketId)
    } catch (error) {
      console.error('[WebRTC] Error creating offer:', error)
    }
  }

  /**
   * Handle incoming offer from remote peer
   */
  const handleOffer = async (remoteSocketId: string, offer: RTCSessionDescriptionInit) => {
    try {
      const pc = createPeerConnection(remoteSocketId)
      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      
      socket?.emit('webrtc-answer', {
        roomId,
        answer,
        targetId: remoteSocketId
      })
      
      console.log('[WebRTC] Answer sent to:', remoteSocketId)
    } catch (error) {
      console.error('[WebRTC] Error handling offer:', error)
    }
  }

  /**
   * Handle incoming answer from remote peer
   */
  const handleAnswer = async (remoteSocketId: string, answer: RTCSessionDescriptionInit) => {
    try {
      const pc = peerConnections.get(remoteSocketId)
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer))
        console.log('[WebRTC] Answer received from:', remoteSocketId)
      }
    } catch (error) {
      console.error('[WebRTC] Error handling answer:', error)
    }
  }

  /**
   * Handle ICE candidate from remote peer
   */
  const handleIceCandidate = async (remoteSocketId: string, candidate: RTCIceCandidateInit) => {
    try {
      const pc = peerConnections.get(remoteSocketId)
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
        console.log('[WebRTC] ICE candidate added for:', remoteSocketId)
      }
    } catch (error) {
      console.error('[WebRTC] Error adding ICE candidate:', error)
    }
  }

  /**
   * Close peer connection
   */
  const closePeerConnection = (remoteSocketId: string) => {
    const pc = peerConnections.get(remoteSocketId)
    if (pc) {
      pc.close()
      peerConnections.delete(remoteSocketId)
      remoteStreams.value.delete(remoteSocketId)
      console.log('[WebRTC] Peer connection closed:', remoteSocketId)
    }
  }

  /**
   * Connect to socket server and setup event handlers
   */
  const connectSocket = async () => {
    console.log('[Socket] Attempting to connect to:', SOCKET_URL)
    
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket?.id)
      isConnected.value = true
      
      // Join room with username
      console.log('[Socket] Emitting join-room:', { roomId, username })
      socket?.emit('join-room', { roomId, username })
    })

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error)
    })

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason)
      isConnected.value = false
    })

    socket.on('joined-room', async ({ socketId, participants: participantsList, whoIsSharing: initialSharing, isRecording, host, coHosts }) => {
      console.log('[Socket] Joined room:', roomId, 'as', socketId)
      console.log('[Socket] Participants received:', participantsList)
      console.log('[Socket] Host:', host)
      console.log('[Socket] Co-hosts:', coHosts)
      
      // Initialize store with metadata
      store.initMeeting(roomId, username, socketId)
      
      // Update participants (includes yourself)
      if (participantsList && participantsList.length > 0) {
        participants.value = participantsList
        hostSocketId.value = host
        coHostSocketIds.value = coHosts || []
        store.updateParticipants(participantsList)
      } else {
        console.error('[Socket] No participants in joined-room response!')
      }
      
      // Set initial sharing state if someone is sharing
      if (initialSharing && initialSharing !== socketId) {
        console.log('[Socket] Someone is already sharing:', initialSharing)
        whoIsSharing.value = initialSharing
        store.isScreenSharing = true
      }
      
      // DON'T initialize local stream automatically - let user enable camera/mic manually
      // This prevents sending disabled tracks to peers
      
      // Create offers to existing participants (except yourself)
      // Only if we already have media (which we don't on first join - that's OK)
      participantsList.forEach((p: any) => {
        if (p.socketId !== socketId) {
          console.log('[WebRTC] Will create offer to:', p.socketId, p.username, 'when we have media')
          // They will send us offer, we'll answer
        }
      })
    })

    socket.on('user-connected', async ({ socketId: newSocketId, username: newUsername, participants: participantsList, host, coHosts }) => {
      console.log('[Socket] User connected:', newSocketId, newUsername)
      console.log('[Socket] Updated host:', host)
      console.log('[Socket] Updated co-hosts:', coHosts)
      
      // Update participants in store
      participants.value = participantsList
      hostSocketId.value = host
      coHostSocketIds.value = coHosts || []
      store.addSocketParticipant(newSocketId, newUsername)
      
      // Show toast notification for new user
      onToast?.('info', 'Participant Joined', `${newUsername} has joined the call`)
      
      // If we have active media (camera, mic, or screen share), create offer to new user
      const hasActiveMedia = localStream.value && localStream.value.getTracks().length > 0
      const isSharing = store.isScreenSharing && localScreenStream
      
      if (hasActiveMedia || isSharing) {
        console.log('[WebRTC] We have active media, creating offer for new user:', newSocketId)
        await createOffer(newSocketId)
      } else {
        console.log('[WebRTC] No active media, waiting for offer from:', newSocketId)
      }
    })

    socket.on('user-disconnected', ({ socketId: disconnectedSocketId, participants: participantsList, host, coHosts, hostTransferred, newHost, username: disconnectedUsername }) => {
      console.log('[Socket] User disconnected:', disconnectedSocketId)
      console.log('[Socket] Remaining participants count:', participantsList.length)
      console.log('[Socket] Updated host:', host)
      console.log('[Socket] Updated co-hosts:', coHosts)
      
      if (hostTransferred && newHost) {
        console.log('[Socket] Host transferred to:', newHost)
      }
      
      // Remove participant from store FIRST
      const removedParticipant = store.participants.find(p => p.id === disconnectedSocketId)
      store.removeParticipant(disconnectedSocketId)
      
      // Update participants in store
      participants.value = participantsList
      hostSocketId.value = host
      coHostSocketIds.value = coHosts || []
      
      // Show toast notification
      if (removedParticipant) {
        onToast?.('info', 'Participant Left', `${removedParticipant.name} has left the call`)
      }
      
      // Clear chat history if room is now empty (no participants left)
      console.log('[Socket] Checking if room empty. Participants:', participantsList.length)
      if (participantsList.length === 0) {
        console.log('[Socket] ✅ Room is now empty, clearing chat history for room:', roomId)
        store.clearChatHistory(roomId)
      }
      
      // Close peer connection
      closePeerConnection(disconnectedSocketId)
    })

    socket.on('webrtc-offer', async ({ socketId: remoteSocketId, offer }) => {
      console.log('[Socket] Received offer from:', remoteSocketId)
      await handleOffer(remoteSocketId, offer)
    })

    socket.on('webrtc-answer', async ({ socketId: remoteSocketId, answer }) => {
      console.log('[Socket] Received answer from:', remoteSocketId)
      await handleAnswer(remoteSocketId, answer)
    })

    socket.on('webrtc-ice-candidate', async ({ socketId: remoteSocketId, candidate }) => {
      console.log('[Socket] Received ICE candidate from:', remoteSocketId)
      await handleIceCandidate(remoteSocketId, candidate)
    })

    socket.on('chat-message', ({ socketId: senderSocketId, username: senderUsername, message }) => {
      console.log('[Socket] Received chat message from:', senderUsername)
      store.receiveMessage(senderSocketId, senderUsername, message)
    })

    socket.on('mic-toggled', ({ socketId: remoteSocketId, enabled }) => {
      console.log('[Socket] User toggled mic:', remoteSocketId, enabled)
      store.updateParticipantMedia(remoteSocketId, { isMuted: !enabled })
    })

    socket.on('camera-toggled', ({ socketId: remoteSocketId, enabled }) => {
      console.log('[Socket] User toggled camera:', remoteSocketId, enabled)
      store.updateParticipantMedia(remoteSocketId, { isVideoOff: !enabled })
    })

    socket.on('sharing-started', ({ socketId: sharerSocketId }) => {
      console.log('[Socket] User started sharing:', sharerSocketId)
      whoIsSharing.value = sharerSocketId
      
      // Only set isScreenSharing true if WE are the one sharing
      if (sharerSocketId === socket?.id) {
        store.isScreenSharing = true
      } else {
        // Someone else is sharing - show screen share view but it's not our share
        store.isScreenSharing = true // Still show screen share view
      }
    })

    socket.on('stop-sharing', ({ socketId: sharerSocketId }) => {
      console.log('[Socket] User stopped sharing:', sharerSocketId)
      
      // Clear whoIsSharing if it was this user
      if (whoIsSharing.value === sharerSocketId) {
        whoIsSharing.value = null
        store.isScreenSharing = false
      }
      
      // Remove screen share stream
      screenShareStreams.value.delete(sharerSocketId)
      screenShareStreams.value = new Map(screenShareStreams.value)
    })

    socket.on('recording-started', ({ socketId: recorderSocketId }) => {
      console.log('[Socket] Recording started by:', recorderSocketId)
      store.isRecording = true
    })

    socket.on('recording-stopped', ({ socketId: recorderSocketId }) => {
      console.log('[Socket] Recording stopped by:', recorderSocketId)
      store.isRecording = false
    })

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected')
      isConnected.value = false
    })

    socket.on('room-full', () => {
      console.error('[Socket] Room is full!')
      alert('Room is full. Maximum 10 participants allowed.')
    })
    
    // Co-host management
    socket.on('cohost-assigned', ({ socketId: coHostSocketId, assignedBy, assignedByUsername, participants: participantsList, coHosts }) => {
      console.log('[Socket] Co-host assigned:', coHostSocketId, 'by', assignedByUsername)
      participants.value = participantsList
      coHostSocketIds.value = coHosts || []
      
      // Show toast for the newly assigned co-host
      const coHost = participantsList.find((p: any) => p.socketId === coHostSocketId)
      if (coHost) {
        onToast?.('success', 'Co-host Assigned', `${coHost.username} is now a co-host`)
      }
    })
    
    socket.on('cohost-removed', ({ socketId: removedSocketId, removedBy, removedByUsername, participants: participantsList, coHosts }) => {
      console.log('[Socket] Co-host removed:', removedSocketId, 'by', removedByUsername)
      participants.value = participantsList
      coHostSocketIds.value = coHosts || []
      
      // Show toast for removed co-host
      const removedUser = participantsList.find((p: any) => p.socketId === removedSocketId)
      if (removedUser) {
        onToast?.('info', 'Co-host Removed', `${removedUser.username} is no longer a co-host`)
      }
    })
    
    // Kick event
    socket.on('participant-kicked', ({ socketId: kickedSocketId, username: kickedUsername, kickedBy, kickedByUsername, participants: participantsList }) => {
      console.log('[Socket] Participant kicked:', kickedSocketId, kickedUsername, 'by', kickedByUsername)
      participants.value = participantsList
      
      // Remove peer connection and streams
      closePeerConnection(kickedSocketId)
      screenShareStreams.value.delete(kickedSocketId)
      screenShareStreams.value = new Map(screenShareStreams.value)
      
      // Show toast notification
      onToast?.('warn', 'Participant Kicked', `${kickedUsername} was removed by ${kickedByUsername}`)
    })
    
    socket.on('kicked', ({ roomId, kickedBy, kickedByUsername }) => {
      console.log('[Socket] You were kicked by:', kickedByUsername)
      
      // Show toast and redirect
      onToast?.('error', 'You Were Kicked', `You were removed from the call by ${kickedByUsername}`)
      
      // Cleanup and redirect
      setTimeout(() => {
        leaveMeeting()
        if (typeof window !== 'undefined') {
          window.location.href = '/'
        }
      }, 2000)
    })
    
    // Rename event
    socket.on('participant-renamed', ({ socketId: renamedSocketId, oldUsername, newUsername, participants: participantsList }) => {
      console.log('[Socket] Participant renamed:', oldUsername, '->', newUsername)
      participants.value = participantsList
      
      // Update in store
      const participant = store.participants.find(p => p.id === renamedSocketId)
      if (participant) {
        participant.name = newUsername
      }
      
      // Show toast notification
      onToast?.('info', 'Name Changed', `${oldUsername} is now ${newUsername}`)
    })
  }

  /**   * Renegotiate with all peers (send new offers)
   */
  const renegotiateAll = async () => {
    const mySocketId = socket?.id
    if (!mySocketId) return
    
    for (const [remoteSocketId, pc] of peerConnections.entries()) {
      try {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        
        socket?.emit('webrtc-offer', {
          roomId,
          offer,
          targetId: remoteSocketId
        })
        
        console.log('[WebRTC] Renegotiation offer sent to:', remoteSocketId)
      } catch (error) {
        console.error('[WebRTC] Renegotiation failed for:', remoteSocketId, error)
      }
    }
  }

  /**   * Toggle microphone
   */
  const toggleMic = async () => {
    if (!socket) return
    
    if (store.isMuted) {
      // Enable mic - add audio track
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        })
        const audioTrack = newStream.getAudioTracks()[0] 
        
        // Add to local stream - preserve existing video tracks!
        if (localStream.value) {
          // Check if video tracks exist
          const hasVideoTracks = localStream.value.getVideoTracks().length > 0
          console.log('[Media] Existing localStream has video tracks:', hasVideoTracks)

          // Just add audio track to existing stream
          localStream.value.addTrack(audioTrack)
        } else {
          // No existing stream, use the new one
          localStream.value = newStream
        }
        
        // Update store FIRST
        store.isMuted = false
        const you = store.participants.find(p => p.isYou)
        if (you) you.isMuted = false
        
        // Add to all existing peer connections
        peerConnections.forEach((pc) => {
          pc.addTrack(audioTrack, localStream.value!)
        })
        
        // Create offers for ALL participants (like index-backup.vue)
        const mySocketId = socket.id
        for (const participant of store.participants) {
          const peerId = participant.id
          if (peerId !== mySocketId) {
            await createOffer(peerId)
          }
        }
        
        console.log('[Media] Mic enabled')
        
        // Broadcast status AFTER creating offers
        socket.emit('mic-toggled', { roomId: store.roomId, enabled: true })
      } catch (error) {
        console.error('[Media] Failed to enable mic:', error)
      }
    } else {
      // Disable mic - remove audio track
      if (localStream.value) {
        // Remove audio tracks from peer connections
        peerConnections.forEach((pc) => {
          const senders = pc.getSenders()
          const audioSender = senders.find(s => s.track?.kind === 'audio')
          if (audioSender && audioSender.track) {
            pc.removeTrack(audioSender)
          }
        })
        
        // Stop and remove from local stream
        const audioTracks = localStream.value.getAudioTracks()
        audioTracks.forEach(track => {
          track.stop()
          localStream.value?.removeTrack(track)
        })
        
        // Update store FIRST
        store.isMuted = true
        const you = store.participants.find(p => p.isYou)
        if (you) you.isMuted = true
        
        // Create offers for ALL participants
        const mySocketId = socket.id
        for (const participant of store.participants) {
          const peerId = participant.id
          if (peerId !== mySocketId) {
            await createOffer(peerId)
          }
        }
        
        console.log('[Media] Mic disabled')
        
        // Broadcast status
        socket.emit('mic-toggled', { roomId: store.roomId, enabled: false })
      }
    }
  }

  /**
   * Toggle camera
   */
  const toggleVideo = async () => {
    if (!socket) return
    
    if (store.isVideoOff) {
      // Enable video - add video track
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 },
            frameRate: { ideal: 30, max: 30 }
          },
          audio: false
        })
        
        const videoTrack = newStream.getVideoTracks()[0]
        
        // Add to local stream
        if (localStream.value) {
          localStream.value.addTrack(videoTrack)
        } else {
          localStream.value = newStream
        }
        
        // Update store FIRST
        store.isVideoOff = false
        const you = store.participants.find(p => p.isYou)
        if (you) you.isVideoOff = false
        
        // Add to all existing peer connections
        peerConnections.forEach((pc) => {
          pc.addTrack(videoTrack, localStream.value!)
        })
        
        // Create offers for ALL participants (like index-backup.vue)
        const mySocketId = socket.id
        for (const participant of store.participants) {
          const peerId = participant.id
          if (peerId !== mySocketId) {
            await createOffer(peerId)
          }
        }
        
        console.log('[Media] Camera enabled')
        
        // Broadcast status AFTER creating offers
        socket.emit('camera-toggled', { roomId: store.roomId, enabled: true })
      } catch (error) {
        console.error('[Media] Failed to enable camera:', error)
      }
    } else {
      // Disable video - remove video track
      if (localStream.value) {
        // Remove video tracks from peer connections
        peerConnections.forEach((pc) => {
          const senders = pc.getSenders()
          const videoSender = senders.find(s => s.track?.kind === 'video')
          if (videoSender && videoSender.track) {
            pc.removeTrack(videoSender)
          }
        })
        
        // Stop and remove from local stream
        const videoTracks = localStream.value.getVideoTracks()
        videoTracks.forEach(track => {
          track.stop()
          localStream.value?.removeTrack(track)
        })
        
        // Update store FIRST
        store.isVideoOff = true
        const you = store.participants.find(p => p.isYou)
        if (you) you.isVideoOff = true
        
        // Create offers for ALL participants
        const mySocketId = socket.id
        for (const participant of store.participants) {
          const peerId = participant.id
          if (peerId !== mySocketId) {
            await createOffer(peerId)
          }
        }
        
        console.log('[Media] Camera disabled')
        
        // Broadcast status
        socket.emit('camera-toggled', { roomId: store.roomId, enabled: false })
      }
    }
  }

  /**
   * Toggle screen share
   */
  const toggleScreenShare = async () => {
    if (!socket) return
    
    if (store.isScreenSharing) {
      // Stop sharing
      if (localScreenStream) {
        // Remove screen tracks from peer connections
        peerConnections.forEach((pc) => {
          const senders = pc.getSenders()
          senders.forEach(sender => {
            if (sender.track && localScreenStream?.getTracks().includes(sender.track)) {
              pc.removeTrack(sender)
            }
          })
        })
        
        // Stop screen tracks
        localScreenStream.getTracks().forEach(track => track.stop())
        localScreenStream = null
        
        // Update store and whoIsSharing
        store.isScreenSharing = false
        whoIsSharing.value = null
        
        // Notify others
        socket.emit('stop-sharing', { roomId: store.roomId })
        
        // Create offers for ALL participants (like index-backup.vue)
        const mySocketId = socket.id
        for (const participant of store.participants) {
          const peerId = participant.id
          if (peerId !== mySocketId) {
            await createOffer(peerId)
          }
        }
        
        console.log('[Media] Screen share stopped')
      }
    } else {
      // Start sharing
      try {
        localScreenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        })
        
        store.isScreenSharing = true
        const mySocketId = socket.id
        whoIsSharing.value = mySocketId || null
        
        console.log('[Media] Screen share started')
        
        // Notify others FIRST (like index-backup.vue)
        socket.emit('sharing-started', { roomId: store.roomId })
        
        // Add screen tracks to peer connections
        const screenTracks = localScreenStream.getTracks()
        peerConnections.forEach((pc) => {
          screenTracks.forEach(track => {
            pc.addTrack(track, localScreenStream!)
          })
        })
        
        // Handle when user stops from browser UI
        const videoTrack = localScreenStream.getVideoTracks()[0]
        videoTrack.onended = () => {
          console.log('[Media] Screen sharing ended by user')
          toggleScreenShare() // Stop sharing
        }
        
        // Create offers for ALL participants (like index-backup.vue)
        for (const participant of store.participants) {
          const peerId = participant.id
          if (peerId !== mySocketId) {
            await createOffer(peerId)
          }
        }
      } catch (error) {
        console.error('[Media] Failed to start screen share:', error)
      }
    }
  }

  /**
   * Send chat message
   */
  const sendMessage = (message: string) => {
    if (socket && message.trim()) {
      socket.emit('chat-message', { roomId: store.roomId, message: message.trim() })
      // Don't add to store here - let the socket echo back handle it
    }
  }

  /**
   * Leave meeting and cleanup
   */
  const leaveMeeting = () => {
    // Check if we are the last person in the room before disconnecting
    const remainingParticipants = store.participants.filter(p => !p.isYou).length
    console.log('[WebRTC] Leaving meeting. Remaining participants:', remainingParticipants)
    
    if (remainingParticipants === 0) {
      console.log('[WebRTC] ✅ We are the last person, clearing chat history before leaving')
      store.clearChatHistory(roomId)
    }
    
    // Stop all tracks
    if (localStream.value) {
      localStream.value.getTracks().forEach(track => track.stop())
    }
    
    // Close all peer connections
    peerConnections.forEach((pc, socketId) => {
      closePeerConnection(socketId)
    })
    
    // Disconnect socket
    if (socket) {
      socket.disconnect()
      socket = null
    }

    // Reset store
    // store.resetMeeting()  
    
    console.log('[WebRTC] Left meeting')
  }
  
  /**
   * Kick participant (host/co-host only)
   */
  const kickParticipant = (targetSocketId: string) => {
    if (!socket) return
    
    socket.emit('kick-participant', { roomId, targetSocketId })
  }
  
  /**
   * Assign co-host (host only)
   */
  const assignCoHost = (targetSocketId: string) => {
    if (!socket) return
    
    socket.emit('assign-cohost', { roomId, targetSocketId })
  }
  
  /**
   * Remove co-host (host only)
   */
  const removeCoHostRole = (targetSocketId: string) => {
    if (!socket) return
    
    socket.emit('remove-cohost', { roomId, targetSocketId })
  }
  
  /**
   * Rename current user
   */
  const renameCurrentUser = (newUsername: string) => {
    if (!socket || !newUsername.trim()) return
    
    socket.emit('rename-participant', { roomId, newUsername: newUsername.trim() })
  }

  // Auto connect immediately when composable is called
  connectSocket()

  // Cleanup on unmount
  onUnmounted(() => {
    leaveMeeting()
  })

  return {
    isConnected,
    localStream,
    remoteStreams,
    screenShareStreams,
    whoIsSharing,
    participants,
    hostSocketId,
    coHostSocketIds,
    getLocalScreenStream: () => localScreenStream,
    toggleMic,
    toggleVideo,
    toggleScreenShare,
    sendMessage,
    leaveMeeting,
    kickParticipant,
    assignCoHost,
    removeCoHostRole,
    renameCurrentUser,
  }
}
