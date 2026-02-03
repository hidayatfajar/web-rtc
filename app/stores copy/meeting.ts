import { defineStore } from 'pinia'

export interface Participant {
  id: string
  name: string
  avatar: string
  isMuted: boolean
  isVideoOff: boolean
  isHost: boolean
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
    roomName: 'room-1',
    
    // Participants
    participants: [
      {
        id: '1',
        name: 'Alice (You)',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCf9_qDE-Ax3RAzkNPs5Fxlb08NkTzIFliKBGWAlYDkDMFT5kfkpBommZgZeNA0quiPU-4k2v3NHukrcbjldYJVXWVc8yysiX2miDtUwQnjbZM-3dp5ID6BUDeTjnUEaQSGbzpqHbKUiPCNWmt8CRSf5z4XlwXpPg9Wnyaa_Sc4M0e_lOWFq8vmyLJV42KJGI-mm575jQsoDIGIyoXLyuJqyMcBWlPICrKXjhUEM6VGD9M6grX8s3OtAOtcYP-z8JgsQtl9kWuTF-Qy',
        isMuted: false,
        isVideoOff: false,
        isHost: true,
        isSpeaking: true,
        isYou: true,
      },
      {
        id: '2',
        name: 'Bob Smith',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnNWlDe9t1upjAhHykCP0bssEwIAEReADOpcha_tZQoODKCGErU6K9xsF9FHFKQQSJRCmiFfzttNs-4JNKi88ElvMDkBV9LnbCJYvqxUoC8ZMapjt_kRY-yLYp0YeqPJpPkW9G3KJ0y5abbp0PbVxFhQqa-Aci-UCw1pZOcjeJDJ9mb4gSsJL-NOuLT7yR1sWbrWVzom7AiI-e9jsBu9fFgG5lW2XghB8U1xmnruKVO8iM2hX5ESUwq2uKZ_XpiE_Ji_3BzNwLXTdX',
        isMuted: true,
        isVideoOff: false,
        isHost: false,
        isSpeaking: false,
        isYou: false,
      },
      {
        id: '3',
        name: 'Charlie',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGNqBLXDGKL4H_CYY3Okgm92d3imu1vn65y_uovhGfbp6Jlpuqfq3BkVeGBM_CoeFvI8VIx7WS0gH9kZSgq-pMicJfCFeEl24SAP9-DwxKzhp2LdYe4xmEUyn_eooKoihlqklfHytigM2BC4b19NCiOvOx0lIrkEjJa6Gi5F2dnxBMuL-HkC0lvoxuWI_ecbj-O0WtSbi0byc2iQKIhbafllrIGGRO6n1HFfIpuW0LSKrptpxiF-z8Ug2akUMkbnnziUcDGpoq35oT',
        isMuted: true,
        isVideoOff: true,
        isHost: false,
        isSpeaking: false,
        isYou: false,
      },
    ] as Participant[],
    
    // Meeting Controls
    isMuted: false,
    isVideoOff: false,
    isScreenSharing: false,
    isRecording: false,
    
    // UI State
    showSidePanel: false,
    tabActive: 'participants' as 'participants' | 'chat',
    
    // Chat
    messages: [
      {
        id: '1',
        senderId: '2',
        senderName: 'Bob Smith',
        message: 'Hello everyone!',
        timestamp: new Date(),
      },
      {
        id: '2',
        senderId: '3',
        senderName: 'Charlie',
        message: 'Hi Bob! How are you?',
        timestamp: new Date(),
      },
    ] as ChatMessage[],
    hasUnreadMessage: true,
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
    // Participant Actions
    addParticipant() {
      const names = ['David', 'Emma', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack', 'Kate', 'Leo', 'Mia']
      const randomName = names[Math.floor(Math.random() * names.length)]
      const newParticipant: Participant = {
        id: Date.now().toString(),
        name: randomName,
        avatar: `https://ui-avatars.com/api/?name=${randomName}&background=random`,
        isMuted: Math.random() > 0.5,
        isVideoOff: Math.random() > 0.5,
        isHost: false,
        isSpeaking: false,
        isYou: false,
      }
      this.participants.push(newParticipant)
    },

    removeParticipant(id: string) {
      this.participants = this.participants.filter(p => p.id !== id)
    },

    toggleParticipantMute(id: string) {
      const participant = this.participants.find(p => p.id === id)
      if (participant) {
        participant.isMuted = !participant.isMuted
      }
    },

    // Meeting Control Actions
    toggleMic() {
      this.isMuted = !this.isMuted
      const you = this.participants.find(p => p.isYou)
      if (you) {
        you.isMuted = this.isMuted
      }
    },

    toggleVideo() {
      this.isVideoOff = !this.isVideoOff
      const you = this.participants.find(p => p.isYou)
      if (you) {
        you.isVideoOff = this.isVideoOff
      }
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

    // Chat Actions
    sendMessage(message: string) {
      const you = this.participants.find(p => p.isYou)
      if (!you || !message.trim()) return

      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        senderId: you.id,
        senderName: you.name,
        message: message.trim(),
        timestamp: new Date(),
      }
      this.messages.push(newMessage)
    },

    receiveMessage(senderId: string, message: string) {
      const sender = this.participants.find(p => p.id === senderId)
      if (!sender) return

      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        senderId,
        senderName: sender.name,
        message,
        timestamp: new Date(),
      }
      this.messages.push(newMessage)
      
      if (this.tabActive !== 'chat' || !this.showSidePanel) {
        this.hasUnreadMessage = true
      }
    },
  },
})
