import { defineStore } from 'pinia'

export interface Participant {
  id: string
  name: string
  avatar: string
  isMuted: boolean
  isVideoOff: boolean
  isHost: boolean
  isCoHost: boolean
  isSpeaking: boolean
  isYou: boolean
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  message: string
  timestamp: Date
}

export const useMeetingStore = defineStore('meeting', {
  state: () => ({
    // Meeting Info
    roomName: '',
    roomId: '',
    username: '',
    socketId: '',
    
    // Participants - will be populated from socket
    participants: [] as Participant[],
    
    // Meeting Controls
    isMuted: true,  // Default OFF
    isVideoOff: true,  // Default OFF
    isScreenSharing: false,
    isRecording: false,
    
    // UI State
    showSidePanel: false,
    tabActive: 'participants' as 'participants' | 'chat',
    
    // Chat
    messages: [] as ChatMessage[],
    hasUnreadMessage: false,
  }),

  getters: {
    participantCount: (state) => state.participants.length,
    
    activeSpeaker: (state) => 
      state.participants.find(p => p.isSpeaking) || state.participants[0],
    
    // Calculate grid layout based on participant count
    gridLayout: (state) => {
      const count = state.participants.length
      if (count === 1) return { cols: 1, rows: 1 }
      if (count === 2) return { cols: 2, rows: 1 }
      if (count <= 4) return { cols: 2, rows: 2 }
      if (count <= 6) return { cols: 3, rows: 2 }
      if (count <= 9) return { cols: 3, rows: 3 }
      return { cols: 4, rows: Math.ceil(count / 4) }
    },

    gridClass: (state) => {
      const layout = state.participants.length
      if (layout === 1) return 'grid-cols-1 grid-rows-1'
      if (layout === 2) return 'grid-cols-2 grid-rows-1'
      if (layout <= 4) return 'grid-cols-2 grid-rows-2'
      if (layout <= 6) return 'grid-cols-3 grid-rows-2'
      if (layout <= 9) return 'grid-cols-3 grid-rows-3'
      return 'grid-cols-4'
    },
  },

  actions: {
    // Initialize meeting
    initMeeting(roomId: string, username: string, socketId: string) {
      this.roomId = roomId
      this.roomName = `Room ${roomId}`
      this.username = username
      this.socketId = socketId
      
      // Load chat history for this room
      this.loadChatHistory()
      
      // Don't set participants here, let updateParticipants handle it
    },

    // Update participants from socket
    updateParticipants(participants: Array<{ socketId: string, username: string }>) {
      if (!participants || participants.length === 0) {
        console.warn('[Store] updateParticipants called with empty array')
        return
      }
      
      this.participants = participants.map((p, index) => {
        const isYou = p.socketId === this.socketId
        return {
          id: p.socketId,
          name: isYou ? `${p.username} (You)` : p.username,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(p.username)}&background=random`,
          isMuted: true,  // Default OFF
          isVideoOff: true,  // Default OFF
          isHost: index === 0, // First person is host
          isSpeaking: false,
          isYou,
          isCoHost: false,  
        }
      })
      
      console.log('[Store] Participants updated:', this.participants.length, this.participants)
    },

    // Add new participant from socket
    addSocketParticipant(socketId: string, username: string) {
      const exists = this.participants.find(p => p.id === socketId)
      if (!exists) {
        this.participants.push({
          id: socketId,
          name: username,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`,
          isMuted: true,  // Default OFF
          isVideoOff: true,  // Default OFF
          isHost: false,
          isSpeaking: false,
          isYou: false,
          isCoHost: false,
        })
      }
    },

    // Remove participant
    removeParticipant(socketId: string) {
      console.log('[Store] removeParticipant called for:', socketId)
      console.log('[Store] Participants before removal:', this.participants.length)
      this.participants = this.participants.filter(p => p.id !== socketId)
      console.log('[Store] Participants after removal:', this.participants.length)
    },

    // Update participant media status
    updateParticipantMedia(socketId: string, { isMuted, isVideoOff }: { isMuted?: boolean, isVideoOff?: boolean }) {
      const participant = this.participants.find(p => p.id === socketId)
      if (participant) {
        if (isMuted !== undefined) participant.isMuted = isMuted
        if (isVideoOff !== undefined) participant.isVideoOff = isVideoOff
      }
    },

    // Meeting Control Actions
    toggleMic() {
      this.isMuted = !this.isMuted
      const you = this.participants.find(p => p.isYou)
      if (you) {
        you.isMuted = this.isMuted
      }
      console.log('[Store] Mic toggled:', this.isMuted)
    },

    toggleVideo() {
      this.isVideoOff = !this.isVideoOff
      const you = this.participants.find(p => p.isYou)
      if (you) {
        you.isVideoOff = this.isVideoOff
      }
      console.log('[Store] Video toggled:', this.isVideoOff)
    },

    toggleScreenShare() {
      this.isScreenSharing = !this.isScreenSharing
    },

    toggleRecording() {
      this.isRecording = !this.isRecording
    },

    // UI Actions
    setTabActive(tab: 'participants' | 'chat') {
      this.tabActive = tab
      if (tab === 'chat') {
        this.hasUnreadMessage = false
      }
      if (!this.showSidePanel) {
        this.showSidePanel = true
      }
    },

    toggleSidePanel() {
      this.showSidePanel = !this.showSidePanel
    },

    // Chat Actions (not used anymore - receiveMessage handles all)
    sendMessage(message: string) {
      // This is now handled by socket echo in receiveMessage
      console.warn('[Store] sendMessage called but should use socket emit instead')
    },

    receiveMessage(socketId: string, username: string, message: string) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        senderId: socketId,
        senderName: username,
        message,
        timestamp: new Date(),
      }
      this.messages.push(newMessage)
      
      // Save chat history to localStorage per room
      this.saveChatHistory()
      
      if (this.tabActive !== 'chat' || !this.showSidePanel) {
        this.hasUnreadMessage = true
      }
    },
    
    // Save chat history to localStorage
    saveChatHistory() {
      if (typeof window !== 'undefined' && this.roomId) {
        const key = `chat_history_${this.roomId}`
        localStorage.setItem(key, JSON.stringify(this.messages))
      }
    },
    
    // Load chat history from localStorage
    loadChatHistory() {
      if (typeof window !== 'undefined' && this.roomId) {
        const key = `chat_history_${this.roomId}`
        const saved = localStorage.getItem(key)
        if (saved) {
          try {
            this.messages = JSON.parse(saved)
            console.log('[Store] Loaded', this.messages.length, 'messages from history')
          } catch (e) {
            console.error('[Store] Failed to load chat history:', e)
          }
        }
      }
    },
    
    // Clear chat history when leaving room (called on disconnect)
    clearChatOnNewRoom() {
      // Don't clear - let loadChatHistory handle it
      // This way rejoining same room keeps history
    },
    
    // Clear chat history for a specific room (when room becomes empty)
    clearChatHistory(roomId?: string) {
      const targetRoomId = roomId || this.roomId
      console.log('[Store] clearChatHistory called for roomId:', targetRoomId)
      console.log('[Store] Current roomId:', this.roomId)
      console.log('[Store] Messages count before clear:', this.messages.length)
      
      if (typeof window !== 'undefined' && targetRoomId) {
        const key = `chat_history_${targetRoomId}`
        
        // Check if key exists before removing
        const existingData = localStorage.getItem(key)
        console.log('[Store] Existing data in localStorage:', existingData ? 'YES' : 'NO')
        
        localStorage.removeItem(key)
        console.log('[Store] ✅ Cleared chat history from localStorage for room:', targetRoomId, 'key:', key)
        
        // Clear messages if it's the current room
        if (targetRoomId === this.roomId) {
          this.messages = []
          console.log('[Store] ✅ Cleared messages array. New count:', this.messages.length)
        }
      } else {
        console.warn('[Store] Cannot clear chat history - missing targetRoomId or not in browser')
      }
    },
  },
})
